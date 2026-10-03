(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./fluid"));
  else root.ZhijianGraph = factory(root.ZhijianFluid);
})(typeof globalThis !== "undefined" ? globalThis : this, function (Fluid) {
  "use strict";

  /**
 * Dependency-free force layout. Coordinates are relative to the graph centre.
 * Only in-memory node x/y/vx/vy values are modified; edges are read-only.
 */
function createSimulation(graph, options = {}) {
  const nodes = Array.isArray(graph && graph.nodes) ? graph.nodes : [];
  const count = nodes.length;
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  const POSITION_LIMIT = 1e7;
  const MIN_ALPHA = 0.001;
  const MAX_TICKS = 360;
  const DECAY = 0.976;
  const radii = new Float64Array(count);
  const degrees = new Uint32Array(count);
  const bucketOffsets = new Uint32Array(count);
  let width = dimension(options.width, 800);
  let height = dimension(options.height, 600);
  let alpha = count ? 1 : 0;
  let frame = 0;
  let ticksSinceHeat = 0;
  let settled = !count;
  let maxRadius = 6;
  let radiusTotal = 0;

  function dimension(value, fallback) {
    return Number.isFinite(value) && value > 0 ? Math.min(1e7, value) : fallback;
  }

  function coordinate(value, fallback) {
    return Number.isFinite(value) ? Math.max(-POSITION_LIMIT, Math.min(POSITION_LIMIT, value)) : fallback;
  }

  function velocity(value) {
    return Number.isFinite(value) ? Math.max(-50, Math.min(50, value)) : 0;
  }

  // Pair directions use indices rather than randomness and are antisymmetric.
  function direction(a, b) {
    const lo = Math.min(a, b) + 1;
    const hi = Math.max(a, b) + 1;
    const hash = (Math.imul(lo, 73856093) ^ Math.imul(hi, 19349663)) >>> 0;
    const angle = hash / 4294967296 * Math.PI * 2;
    const sign = a < b ? 1 : -1;
    return [Math.cos(angle) * sign, Math.sin(angle) * sign];
  }

  for (let i = 0; i < count; i++) {
    const radius = nodes[i].radius;
    radii[i] = Number.isFinite(radius) && radius > 0 ? Math.min(1000, radius) : 6;
    radiusTotal += radii[i];
    maxRadius = Math.max(maxRadius, radii[i]);
  }

  const initialSpacing = Math.max(18, count ? radiusTotal / count * 3.5 : 18);
  let generatedOnly = true;
  let sumX = 0;
  let sumY = 0;
  for (let i = 0; i < count; i++) {
    const node = nodes[i];
    const distance = initialSpacing * Math.sqrt(i + 0.5);
    const angle = i * GOLDEN_ANGLE;
    generatedOnly = generatedOnly && !Number.isFinite(node.x) && !Number.isFinite(node.y);
    node.x = coordinate(node.x, Math.cos(angle) * distance);
    node.y = coordinate(node.y, Math.sin(angle) * distance);
    node.vx = velocity(node.vx);
    node.vy = velocity(node.vy);
    if (Number.isFinite(node.fx)) node.x = coordinate(node.fx, node.x);
    if (Number.isFinite(node.fy)) node.y = coordinate(node.fy, node.y);
    sumX += node.x;
    sumY += node.y;
  }
  if (generatedOnly && count) {
    const centreX = sumX / count;
    const centreY = sumY / count;
    for (const node of nodes) {
      if (!Number.isFinite(node.fx)) node.x -= centreX;
      if (!Number.isFinite(node.fy)) node.y -= centreY;
    }
  }

  const links = [];
  for (const edge of Array.isArray(graph && graph.edges) ? graph.edges : []) {
    const source = edge.source;
    const target = edge.target;
    if (!Number.isInteger(source) || !Number.isInteger(target) || source < 0 || target < 0 || source >= count || target >= count || source === target) continue;
    links.push({ source, target, distance: Math.max(64, radii[source] + radii[target] + 44) });
    degrees[source]++;
    degrees[target]++;
  }

  // A bounded-depth quadtree groups coincident points into one aggregate leaf.
  // Large coincident leaves are never expanded into all-pairs interactions.
  function buildTree() {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const indices = new Array(count);
    for (let i = 0; i < count; i++) {
      const node = nodes[i];
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x);
      maxY = Math.max(maxY, node.y);
      indices[i] = i;
    }
    const size = Math.max(1, maxX - minX, maxY - minY) + 0.002;
    return partition(indices, minX - 0.001, minY - 0.001, size, 0);
  }

  function partition(indices, x0, y0, size, depth) {
    let x = 0;
    let y = 0;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const i of indices) {
      const node = nodes[i];
      x += node.x;
      y += node.y;
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x);
      maxY = Math.max(maxY, node.y);
    }
    const cell = { x0, y0, size, mass: indices.length, x: x / indices.length, y: y / indices.length, children: null, indices: null };
    if (indices.length <= 4 || depth >= 24 || (maxX - minX < 1e-9 && maxY - minY < 1e-9)) {
      cell.indices = indices;
      return cell;
    }
    const half = size / 2;
    const midX = x0 + half;
    const midY = y0 + half;
    const groups = [[], [], [], []];
    for (const i of indices) groups[(nodes[i].x >= midX ? 1 : 0) | (nodes[i].y >= midY ? 2 : 0)].push(i);
    cell.children = groups.map((group, quadrant) => group.length ? partition(group, x0 + (quadrant & 1 ? half : 0), y0 + (quadrant & 2 ? half : 0), half, depth + 1) : null);
    return cell;
  }

  function repel(i, tree) {
    const node = nodes[i];
    const charge = 155 * alpha;
    const thetaSquared = 0.81;
    function apply(dx, dy, mass) {
      if (dx * dx + dy * dy < 1e-12) {
        const angle = (i + 1) * GOLDEN_ANGLE;
        dx = Math.cos(angle);
        dy = Math.sin(angle);
      }
      const force = charge * mass / Math.max(64, dx * dx + dy * dy);
      node.vx += dx * force;
      node.vy += dy * force;
    }
    function visit(cell) {
      if (!cell) return;
      const inside = node.x >= cell.x0 && node.x < cell.x0 + cell.size && node.y >= cell.y0 && node.y < cell.y0 + cell.size;
      const dx = node.x - cell.x;
      const dy = node.y - cell.y;
      if (cell.children && !inside && cell.size * cell.size < thetaSquared * (dx * dx + dy * dy)) {
        apply(dx, dy, cell.mass);
      } else if (cell.children) {
        for (const child of cell.children) visit(child);
      } else if (cell.indices.length <= 4) {
        for (const j of cell.indices) {
          if (i === j) continue;
          let pairX = node.x - nodes[j].x;
          let pairY = node.y - nodes[j].y;
          if (pairX * pairX + pairY * pairY < 1e-12) [pairX, pairY] = direction(i, j);
          apply(pairX, pairY, 1);
        }
      } else {
        // Degenerate leaf: use its centre of mass, with self mass removed.
        const mass = cell.mass - (inside ? 1 : 0);
        if (mass > 0) apply(dx * cell.mass / mass, dy * cell.mass / mass, mass);
      }
    }
    visit(tree);
  }

  function springs() {
    for (const link of links) {
      const source = nodes[link.source];
      const target = nodes[link.target];
      let dx = predictedX(target) - predictedX(source);
      let dy = predictedY(target) - predictedY(source);
      if (dx * dx + dy * dy < 1e-12) [dx, dy] = direction(link.target, link.source);
      const length = Math.sqrt(dx * dx + dy * dy);
      const strength = 0.12 * alpha / Math.sqrt(Math.min(degrees[link.source], degrees[link.target]));
      const pull = (length - link.distance) / length * strength;
      const sourceWeight = degrees[link.target] / (degrees[link.source] + degrees[link.target]);
      const sourceXWeight = Number.isFinite(source.fx) ? 0 : Number.isFinite(target.fx) ? 1 : sourceWeight;
      const sourceYWeight = Number.isFinite(source.fy) ? 0 : Number.isFinite(target.fy) ? 1 : sourceWeight;
      const targetXWeight = Number.isFinite(target.fx) ? 0 : Number.isFinite(source.fx) ? 1 : 1 - sourceWeight;
      const targetYWeight = Number.isFinite(target.fy) ? 0 : Number.isFinite(source.fy) ? 1 : 1 - sourceWeight;
      source.vx += dx * pull * sourceXWeight;
      source.vy += dy * pull * sourceYWeight;
      target.vx -= dx * pull * targetXWeight;
      target.vy -= dy * pull * targetYWeight;
    }
  }

  function predictedX(node) {
    return node.x + (Number.isFinite(node.fx) ? 0 : node.vx);
  }

  function predictedY(node) {
    return node.y + (Number.isFinite(node.fy) ? 0 : node.vy);
  }

  function collide() {
    const cellSize = maxRadius * 2 + 5;
    const cells = new Map();
    const gridX = new Int32Array(count);
    const gridY = new Int32Array(count);
    for (let i = 0; i < count; i++) {
      const node = nodes[i];
      const x = Math.floor(predictedX(node) / cellSize);
      const y = Math.floor(predictedY(node) / cellSize);
      gridX[i] = x;
      gridY[i] = y;
      const key = x + ',' + y;
      let bucket = cells.get(key);
      if (!bucket) cells.set(key, bucket = []);
      bucketOffsets[i] = bucket.length;
      bucket.push(i);
    }
    function resolve(i, j) {
      if (j <= i) return;
      const a = nodes[i];
      const b = nodes[j];
      let dx = predictedX(b) - predictedX(a);
      let dy = predictedY(b) - predictedY(a);
      const minimum = radii[i] + radii[j] + 3;
      if (dx * dx + dy * dy >= minimum * minimum) return;
      if (dx * dx + dy * dy < 1e-12) [dx, dy] = direction(j, i);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const push = (minimum - distance) / distance * 0.75;
      const ax = Number.isFinite(a.fx) ? 0 : 1;
      const bx = Number.isFinite(b.fx) ? 0 : 1;
      const ay = Number.isFinite(a.fy) ? 0 : 1;
      const by = Number.isFinite(b.fy) ? 0 : 1;
      if (ax + bx) {
        a.vx -= dx * push * ax / (ax + bx);
        b.vx += dx * push * bx / (ax + bx);
      }
      if (ay + by) {
        a.vy -= dy * push * ay / (ay + by);
        b.vy += dy * push * by / (ay + by);
      }
    }
    for (let i = 0; i < count; i++) {
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const bucket = cells.get((gridX[i] + ox) + ',' + (gridY[i] + oy));
          if (!bucket) continue;
          // Bounded sampling prevents a dense cell from becoming O(n^2).
          if (bucket.length <= 24) {
            for (const j of bucket) resolve(i, j);
          } else {
            const ownCell = ox === 0 && oy === 0;
            const start = ownCell ? bucketOffsets[i] : (Math.imul(i + 1, 2654435761) >>> 0) % bucket.length;
            const stride = Math.max(1, Math.floor(bucket.length / 16));
            for (let k = 0; k < 16; k++) resolve(i, bucket[(start + k * stride + 1) % bucket.length]);
          }
        }
      }
    }
  }

  function reheat(amount = 0.45) {
    const next = Number.isFinite(amount) ? Math.max(0.01, Math.min(1, amount)) : 0.45;
    alpha = count ? Math.max(alpha, next) : 0;
    ticksSinceHeat = 0;
    settled = !count;
    return simulation;
  }

  function resize(nextWidth, nextHeight) {
    width = dimension(nextWidth, width);
    height = dimension(nextHeight, height);
    return reheat(0.18);
  }

  function step() {
    if (!count) return { alpha, settled: true, frame };
    let fixed = false;
    for (let i = 0; i < count; i++) {
      const node = nodes[i];
      const distance = initialSpacing * Math.sqrt(i + 0.5);
      node.x = coordinate(node.x, Math.cos(i * GOLDEN_ANGLE) * distance);
      node.y = coordinate(node.y, Math.sin(i * GOLDEN_ANGLE) * distance);
      node.vx = velocity(node.vx);
      node.vy = velocity(node.vy);
      if (Number.isFinite(node.fx)) {
        node.x = coordinate(node.fx, node.x);
        node.vx = 0;
        fixed = true;
      }
      if (Number.isFinite(node.fy)) {
        node.y = coordinate(node.fy, node.y);
        node.vy = 0;
        fixed = true;
      }
    }
    if (fixed) {
      alpha = Math.max(alpha, 0.08);
      ticksSinceHeat = 0;
      settled = false;
    } else if (settled) {
      return { alpha, settled, frame };
    }

    const tree = buildTree();
    for (let i = 0; i < count; i++) repel(i, tree);
    springs();
    const gravity = Math.max(0.014, Math.min(0.045, 0.025 * Math.sqrt(600 / Math.max(100, Math.min(width, height))))) * alpha;
    for (const node of nodes) {
      node.vx -= node.x * gravity;
      node.vy -= node.y * gravity;
    }
    collide();
    const maxSpeed = 20 + 6 * alpha;
    for (const node of nodes) {
      node.vx *= 0.72;
      node.vy *= 0.72;
      const speed = Math.hypot(node.vx, node.vy);
      if (speed > maxSpeed) {
        node.vx *= maxSpeed / speed;
        node.vy *= maxSpeed / speed;
      }
      if (Number.isFinite(node.fx)) {
        node.x = coordinate(node.fx, node.x);
        node.vx = 0;
      } else {
        node.x = coordinate(node.x + node.vx, 0);
      }
      if (Number.isFinite(node.fy)) {
        node.y = coordinate(node.fy, node.y);
        node.vy = 0;
      } else {
        node.y = coordinate(node.y + node.vy, 0);
      }
    }
    frame++;
    ticksSinceHeat++;
    alpha *= DECAY;
    if (!fixed && (alpha < MIN_ALPHA || ticksSinceHeat >= MAX_TICKS)) {
      alpha = 0;
      settled = true;
      for (const node of nodes) node.vx = node.vy = 0;
    }
    return { alpha, settled, frame };
  }

  const simulation = {
    step,
    reheat,
    resize,
    get alpha() { return alpha; },
    get frame() { return frame; },
    get settled() { return settled; },
  };
  return simulation;
}

  const CATEGORIES = ["项目", "资产", "资源", "辅助", "灵感", "Skills"];
  const COLOR_NAMES = ["project", "asset", "resource", "support", "idea", "skill"];
  let mountCounter = 0;

  function normalizedPath(value) {
    const segments = [];
    for (const part of String(value || "").replace(/\\/g, "/").split("/")) {
      if (!part || part === ".") continue;
      if (part === "..") { if (!segments.length) return ""; segments.pop(); }
      else segments.push(part);
    }
    return segments.join("/").replace(/\.md$/i, "");
  }

  function linkText(value) {
    if (typeof value !== "string") return "";
    const text = value.trim().replace(/^!?\[\[/, "").replace(/\]\]$/, "").split("|")[0].split("#")[0].trim();
    return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(text) ? "" : text;
  }

  function buildModel(notes, options = {}) {
    const maximum = Math.max(1, Math.min(1000, Math.floor(Number(options.maxNodes) || 1000)));
    const unique = new Map();
    for (const note of Array.isArray(notes) ? notes : []) {
      if (!note || typeof note.path !== "string" || !normalizedPath(note.path)) continue;
      const key = normalizedPath(note.path);
      if (!unique.has(key)) unique.set(key, { note, path: note.path, title: String(note.title || key.split("/").pop()), category: note.category || "辅助", degree: 0, originalIndex: unique.size });
    }
    const all = [...unique.values()];
    const paths = new Map(all.map(node => [normalizedPath(node.path), node]));
    const aliases = new Map();
    function addAlias(name, node) {
      if (!name) return;
      const key = name.toLocaleLowerCase();
      if (!aliases.has(key)) aliases.set(key, new Set());
      aliases.get(key).add(node);
    }
    for (const node of all) {
      addAlias(node.title, node);
      addAlias(normalizedPath(node.path).split("/").pop(), node);
      addAlias(normalizedPath(node.path), node);
    }
    function resolve(raw, source) {
      const text = linkText(raw);
      if (!text) return null;
      const rootKey = normalizedPath(text);
      const folder = normalizedPath(source.path).split("/").slice(0, -1).join("/");
      const relativeKey = normalizedPath((folder ? folder + "/" : "") + text);
      if ((text.includes("/") || /\.md$/i.test(text)) && paths.has(rootKey)) return paths.get(rootKey);
      if (paths.has(relativeKey)) return paths.get(relativeKey);
      const matches = aliases.get(rootKey.toLocaleLowerCase());
      return matches && matches.size === 1 ? matches.values().next().value : null;
    }
    const connections = new Map();
    let unresolved = 0;
    for (const node of all) {
      for (const raw of Array.isArray(node.note.links) ? node.note.links : []) {
        const target = resolve(raw, node);
        if (!target) { if (linkText(raw)) unresolved++; continue; }
        if (target === node) continue;
        const from = Math.min(node.originalIndex, target.originalIndex), to = Math.max(node.originalIndex, target.originalIndex);
        const key = `${from}:${to}`;
        if (!connections.has(key)) {
          connections.set(key, { source: from, target: to });
          all[from].degree++; all[to].degree++;
        }
      }
    }
    const eligible = options.showOrphans === false ? all.filter(node => node.degree > 0) : all;
    const displayed = eligible.slice(0, maximum);
    const indices = new Map(displayed.map((node, index) => [node.originalIndex, index]));
    const nodes = displayed.map((node, index) => ({ ...node, index, degree: 0, radius: 3.5 }));
    const edges = [];
    for (const edge of connections.values()) {
      if (!indices.has(edge.source) || !indices.has(edge.target)) continue;
      const source = indices.get(edge.source), target = indices.get(edge.target);
      edges.push({ source, target }); nodes[source].degree++; nodes[target].degree++;
    }
    for (const node of nodes) node.radius = 3.3 + Math.min(5.2, Math.sqrt(node.degree) * 1.3);
    return { nodes, edges, total: eligible.length, sourceTotal: all.length, truncated: eligible.length > maximum, maximum, unresolved };
  }

  function mount(container, notes, options = {}) {
    if (!container?.ownerDocument) throw new Error("ZhijianGraph needs a graph container");
    const doc = container.ownerDocument, win = doc.defaultView || window;
    const model = buildModel(notes, options);
    const adjacency = model.nodes.map(() => new Set());
    for (const edge of model.edges) { adjacency[edge.source].add(edge.target); adjacency[edge.target].add(edge.source); }
    const byPath = new Map(model.nodes.map(node => [node.path, node]));
    const disposers = [], elements = [], pointers = new Map();
    const media = win.matchMedia?.("(prefers-reduced-motion: reduce)");
    let destroyed = false, frame = 0, needsDraw = true;
    let width = 0, height = 0, dpr = 1, zoom = 1, panX = 0, panY = 0;
    let hover = null, selected = null, reported = undefined, gesture = null;
    let configuration = { theme: "dark", motion: "full" }, colors = {}, font = "system-ui, sans-serif";
    let initialized = false, prepared = false, cameraTouched = false, cameraTarget = null;
    let growth = 0, growthElapsed = 0, growthClock = null, followFocus = false;
    let motionTime = 0, motionClock = null, lastDriftDraw = 0;
    let fluid = null, bornCount = 0;
    let seed = { x: 0, y: 0 };
    const growthDuration = 3200;
    const preparationTicks = model.nodes.length > 150 ? 48 : 360;
    // Reveal actual neighbours in breadth-first order, starting with connected hubs.
    const visited = new Set(), order = [];
    for (const hub of [...model.nodes].sort((a, b) => b.degree - a.degree)) {
      if (visited.has(hub.index)) continue;
      const queue = [hub.index]; visited.add(hub.index); hub.parent = null;
      for (let cursor = 0; cursor < queue.length; cursor++) {
        const index = queue[cursor]; order.push(index);
        for (const neighbour of adjacency[index]) if (!visited.has(neighbour)) { visited.add(neighbour); model.nodes[neighbour].parent = index; queue.push(neighbour); }
      }
    }
    order.forEach((index, rank) => { model.nodes[index].revealAt = rank / Math.max(1, order.length - 1) * 0.65; });
    const visualPositions = new Map(), labelSlots = new Map();
    const simulation = createSimulation(model, { width: 800, height: 600 });
    // Estimate the camera from a separate complete fluid layout. Its particles never
    // participate in the visible simulation; that simulation starts with zero nodes.
    const previewModel = { nodes: model.nodes.map(node => ({ ...node })), edges: model.edges };
    const previewSimulation = Fluid.createFluidLayout(previewModel, { width: 800, height: 600 });
    for (const node of previewModel.nodes) previewSimulation.add(node.index);

    function element(tag, className, parent = container, text) {
      const node = doc.createElement(tag);
      node.className = className;
      if (text !== undefined) node.textContent = text;
      parent.appendChild(node);
      if (parent === container) elements.push(node);
      return node;
    }
    const canvas = element("canvas", "zj-force-canvas");
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `知识关系图：${model.nodes.length} 篇笔记，${model.edges.length} 条连接。`);
    Object.assign(canvas.style, { width: "100%", height: "100%", display: "block", touchAction: "none" });
    let ctx = null;
    try { ctx = canvas.getContext("2d", { alpha: true }); } catch (_) { /* The keyboard picker remains usable. */ }
    const picker = element("div", "zj-graph-picker");
    picker.style.height = "auto";
    const search = element("input", "zj-graph-node-search", picker);
    search.type = "search"; search.placeholder = "查找并定位笔记…";
    search.setAttribute("aria-label", "按标题或路径查找图谱节点");
    const select = element("select", "zj-graph-node-select", picker);
    select.setAttribute("aria-label", "选择要定位的笔记，匹配列表最多显示 80 项");
    const openButton = element("button", "zj-graph-node-open", picker, "打开笔记");
    openButton.type = "button"; openButton.disabled = true;
    const help = element("p", "zj-graph-a11y", container, "拖动节点调整位置；拖动空白处平移；滚轮或双指缩放。画布聚焦后，按加减号缩放，方向键平移，0 适配画面，Enter 打开选中的笔记。也可使用笔记定位搜索与选择列表。");
    help.id = `zhijian-graph-help-${++mountCounter}`;
    canvas.setAttribute("aria-describedby", help.id);
    const status = element("span", "zj-graph-a11y");
    status.setAttribute("aria-live", "polite");
    container.dataset.nodes = String(model.nodes.length); container.dataset.edges = String(model.edges.length);
    container.dataset.total = String(model.total); container.dataset.sourceNodes = String(model.sourceTotal);
    container.dataset.truncated = String(model.truncated); container.dataset.layout = "force-directed";
    container.dataset.frame = "0"; container.dataset.zoom = "1.000";
    container.dataset.growth = "0.000"; container.dataset.growthState = "preparing";
    container.dataset.growthDuration = String(growthDuration); container.dataset.visibleNodes = "0";
    container.dataset.growthTechnique = "incremental-fluid";

    function call(name, ...args) {
      if (typeof options[name] !== "function") return;
      try {
        const value = options[name](...args);
        if (value?.catch) value.catch(error => console.debug("知间图谱回调", name, error));
      } catch (error) { console.debug("知间图谱回调", name, error); }
    }
    function listen(target, event, handler, settings) {
      target.addEventListener(event, handler, settings);
      disposers.push(() => target.removeEventListener(event, handler, settings));
    }
    function isStatic() { return configuration.motion === "off" || Boolean(media?.matches); }
    function stop() { if (frame) win.cancelAnimationFrame(frame); frame = 0; }
    function drifting() { return Boolean(ctx && model.nodes.length && !isStatic()); }
    function running() { return !destroyed && !doc.hidden && width > 0 && height > 0 && !isStatic() && (!prepared || growth < 1 || (ctx && fluid && !fluid.settled) || cameraTarget || drifting()); }
    function ensureFluid() {
      if (!fluid) fluid = Fluid.createFluidLayout(model, { width, height, seed });
      return fluid;
    }
    function wake(amount) { if (isStatic()) simulation.reheat(amount); else if (fluid) fluid.reheat(amount); }
    function birthNodes() {
      const layout = ensureFluid();
      while (bornCount < order.length && model.nodes[order[bornCount]].revealAt <= growth) {
        const node = model.nodes[order[bornCount++]];
        if (layout.alive.has(node.index)) continue;
        layout.add(node.index);
        node.bornTime = growthElapsed;
        node.bornMotionTime = motionTime;
      }
      container.dataset.activeNodes = String(layout.alive.size);
    }
    function exposeStaticNodes() {
      bornCount = order.length;
      for (const node of model.nodes) {
        node.bornTime = -10000;
        node.bornMotionTime = -10000;
        if (fluid && !fluid.alive.has(node.index)) fluid.add(node.index, { preservePosition: true });
      }
      container.dataset.activeNodes = String(model.nodes.length);
    }
    function requestDraw() {
      if (destroyed) return;
      needsDraw = true;
      if (!frame && !doc.hidden && width > 0 && height > 0) frame = win.requestAnimationFrame(tick);
    }
    function staticLayout() {
      if (doc.hidden || !width || !height) return;
      // Low-motion layout performs a bounded amount of computation and paints one static snapshot.
      // Large graphs should not freeze the editor while calculating a full convergence.
      const start = win.performance.now();
      const maximum = model.nodes.length < 100 ? 380 : Math.max(6, Math.min(90, Math.floor(9000 / model.nodes.length)));
      for (let iteration = 0; iteration < maximum && !simulation.settled; iteration++) {
        simulation.step();
        if (win.performance.now() - start > 24) break;
      }
      container.dataset.frame = String(simulation.frame);
      container.dataset.settled = String(simulation.settled);
    }
    function prepareLayout() {
      const start = win.performance.now();
      for (let count = 0; count < 360 && !previewSimulation.settled && previewSimulation.frame < preparationTicks; count++) {
        previewSimulation.step(1 / 60);
        if (win.performance.now() - start > 8) break;
      }
      container.dataset.frame = String(previewSimulation.frame); container.dataset.settled = String(previewSimulation.settled);
      if (!previewSimulation.settled && previewSimulation.frame < preparationTicks) return;
      for (let index = 0; index < model.nodes.length; index++) {
        model.nodes[index].x = previewModel.nodes[index].x; model.nodes[index].y = previewModel.nodes[index].y;
        model.nodes[index].vx = model.nodes[index].vy = 0;
      }
      prepared = true;
      if (!cameraTouched) {
        fit();
        // Leave breathing room for the different topology produced by sequential births.
        const margin = Math.max(0.12, zoom * 0.86) / zoom;
        zoom *= margin; panX *= margin; panY *= margin; notifyZoom();
      }
      seed = { x: -panX / zoom, y: -panY / zoom };
      container.dataset.seedX = (width / 2).toFixed(2); container.dataset.seedY = (height / 2).toFixed(2);
      if (!model.nodes.length) { finishGrowth(); return; }
      container.dataset.growthState = "growing";
      status.textContent = "关系图谱正在生长。";
      growthClock = null;
      ensureFluid();
      birthNodes();
    }
    const clamp = value => Math.max(0, Math.min(1, value));
    const smooth = value => value * value * value * (value * (value * 6 - 15) + 10);
    function reveal(node) {
      if (isStatic() || node.interacted) return 1;
      if (!fluid?.alive.has(node.index)) return 0;
      return smooth(clamp((motionTime - node.bornMotionTime) / 180));
    }
    function visualWorld(node) {
      if (!prepared || isStatic() || node.interacted || !fluid?.alive.has(node.index)) return node;
      if (visualPositions.has(node.index)) return visualPositions.get(node.index);
      const phase = node.index * 2.39996323;
      const maturity = smooth(clamp((motionTime - node.bornMotionTime) / 1100));
      const amplitude = (configuration.motion === "subtle" ? 0.65 : 1.2) / zoom * maturity;
      const driftX = node === focused() ? 0 : amplitude * (Math.sin(motionTime * 0.00032 + phase) + 0.22 * Math.sin(motionTime * 0.00017 + phase * 0.7));
      const driftY = node === focused() ? 0 : amplitude * (Math.cos(motionTime * 0.00027 + phase * 1.3) + 0.18 * Math.sin(motionTime * 0.00021 + phase));
      // The layout owns movement. This tiny idle drift never substitutes for birth forces.
      const point = { x: node.x + driftX, y: node.y + driftY };
      visualPositions.set(node.index, point); return point;
    }
    function finishGrowth() {
      growth = 1; growthElapsed = growthDuration; growthClock = null;
      container.dataset.growth = "1.000"; container.dataset.growthState = "complete";
      status.textContent = `关系图谱已展开，${model.nodes.length} 篇笔记，${model.edges.length} 条连接。`;
    }

    function focused() { return hover || selected; }
    function reportFocus() {
      const current = focused();
      if (reported === current) return;
      reported = current;
      container.dataset.focusedPath = current ? current.path : "";
      openButton.disabled = !current;
      status.textContent = current ? `${current.title}，${adjacency[current.index].size} 篇相邻笔记。` : "未选中笔记。";
      call("onFocus", current ? current.note : null, current ? adjacency[current.index].size : 0);
    }
    function fillOptions(query = "") {
      const key = query.trim().toLocaleLowerCase();
      const matches = model.nodes.filter(node => !key || `${node.title} ${node.path}`.toLocaleLowerCase().includes(key));
      select.replaceChildren();
      const placeholder = element("option", "", select, matches.length ? `定位笔记 · ${matches.length} 项${matches.length > 80 ? "（输入以筛选）" : ""}` : "没有匹配笔记");
      placeholder.value = "";
      for (const node of matches.slice(0, 80)) {
        const option = element("option", "", select, `${node.title} · ${node.category}`);
        option.value = node.path;
      }
      if (selected && matches.slice(0, 80).some(node => node === selected)) select.value = selected.path;
      else select.value = "";
    }

    function world(point) { return { x: (point.x - width / 2 - panX) / zoom, y: (point.y - height / 2 - panY) / zoom }; }
    function screen(node) { const point = visualWorld(node); return { x: width / 2 + panX + point.x * zoom, y: height / 2 + panY + point.y * zoom }; }
    function local(event) {
      const bounds = canvas.getBoundingClientRect();
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    }
    function hit(point) {
      let result = null, closest = Infinity;
      for (const node of model.nodes) {
        if (reveal(node) < 0.4) continue;
        const position = screen(node), distance = Math.hypot(point.x - position.x, point.y - position.y);
        const radius = Math.max(7, node.radius * zoom + 4);
        if (distance < radius && distance < closest) { result = node; closest = distance; }
      }
      return result;
    }
    function notifyZoom() { container.dataset.zoom = zoom.toFixed(3); call("onZoom", zoom); }
    function setZoom(value, point = { x: width / 2, y: height / 2 }) {
      cameraTouched = true;
      cameraTarget = null;
      followFocus = false;
      const anchor = world(point);
      zoom = Math.max(0.12, Math.min(6, Number(value) || 1));
      panX = point.x - width / 2 - anchor.x * zoom;
      panY = point.y - height / 2 - anchor.y * zoom;
      notifyZoom(); requestDraw();
    }
    function fit(immediate = true) {
      if (destroyed || !width || !height) return;
      if (immediate) followFocus = false;
      if (!model.nodes.length) { zoom = 1; panX = 0; panY = 0; notifyZoom(); requestDraw(); return; }
      let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
      for (const node of model.nodes) {
        left = Math.min(left, node.x - node.radius); right = Math.max(right, node.x + node.radius);
        top = Math.min(top, node.y - node.radius); bottom = Math.max(bottom, node.y + node.radius);
      }
      const nextZoom = Math.max(0.12, Math.min(2.25, (width - Math.min(100, width * 0.2)) / Math.max(50, right - left), (height - Math.min(100, height * 0.2)) / Math.max(50, bottom - top)));
      const target = { zoom: nextZoom, x: -(left + right) * 0.5 * nextZoom, y: -(top + bottom) * 0.5 * nextZoom };
      if (immediate || isStatic()) { zoom = target.zoom; panX = target.x; panY = target.y; cameraTarget = null; notifyZoom(); }
      else cameraTarget = target;
      requestDraw();
    }
    function focusNode(node) {
      cameraTouched = true;
      cameraTarget = null;
      selected = node; hover = null;
      followFocus = Boolean(node); visualPositions.clear();
      if (node) { const point = visualWorld(node); panX = -point.x * zoom; panY = -point.y * zoom; select.value = node.path; }
      reportFocus(); requestDraw();
    }

    function updateStyle() {
      if (destroyed) return;
      const settings = typeof options.getSettings === "function" ? options.getSettings() || {} : {};
      const wasStatic = isStatic();
      configuration = { theme: settings.theme === "light" ? "light" : "dark", motion: ["full", "subtle", "off"].includes(settings.motion) ? settings.motion : "full" };
      const computed = win.getComputedStyle?.(container);
      const dark = configuration.theme === "dark";
      const fallback = dark ? ["#a3c6c3", "#93b4d0", "#b4accb", "#adb4b7", "#c6bca7", "#91b5ac"] : ["#568f8b", "#647f9a", "#8f80a6", "#849198", "#a18b61", "#638e80"];
      function color(name, defaultValue) { return computed?.getPropertyValue(`--zj-graph-${name}`).trim() || defaultValue; }
      colors.groups = COLOR_NAMES.map((name, index) => color(name, fallback[index]));
      colors.node = color("node", dark ? "#dfedf7" : "#6c8ba1");
      colors.text = color("text", dark ? "#cfdfed" : "#29475f");
      colors.link = color("link", dark ? "#647e96" : "#91adbf");
      colors.muted = color("muted-link", dark ? "#32495f" : "#c0d0dc");
      font = computed?.fontFamily || "system-ui, sans-serif";
      if (isStatic()) { stop(); motionClock = null; exposeStaticNodes(); staticLayout(); prepared = true; finishGrowth(); if (initialized && !cameraTouched) fit(); }
      else if (wasStatic) {
        const layout = ensureFluid();
        for (const node of model.nodes) if (!layout.alive.has(node.index)) layout.add(node.index, { preservePosition: true });
        layout.reheat(0.35);
      }
      requestDraw();
    }

    function draw() {
      if (!ctx || destroyed || !width || !height) return;
      visualPositions.clear();
      ctx.clearRect(0, 0, width, height);
      const active = focused(), near = active ? adjacency[active.index] : null;
      container.dataset.panX = panX.toFixed(2); container.dataset.panY = panY.toFixed(2);
      if (active) {
        const focusPosition = screen(active);
        container.dataset.focusedX = focusPosition.x.toFixed(2); container.dataset.focusedY = focusPosition.y.toFixed(2);
      } else { delete container.dataset.focusedX; delete container.dataset.focusedY; }
      ctx.lineWidth = 0.7;
      for (const edge of model.edges) {
        const source = model.nodes[edge.source], target = model.nodes[edge.target];
        const progress = Math.min(reveal(source), reveal(target));
        if (!progress) continue;
        const from = screen(model.nodes[edge.source]), to = screen(model.nodes[edge.target]);
        const highlighted = active && (edge.source === active.index || edge.target === active.index);
        ctx.strokeStyle = highlighted ? colors.link : colors.muted;
        ctx.globalAlpha = Math.sqrt(progress) * (active && !highlighted ? 0.35 : highlighted ? 0.95 : 0.68);
        ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
      }
      let labels = 0, visibleNodes = 0;
      const labelBoxes = [], labelCandidates = [];
      ctx.font = `12px ${font}`; ctx.textBaseline = "middle";
      for (const node of model.nodes) {
        const progress = reveal(node); if (!progress) continue;
        visibleNodes++;
        const position = screen(node), radius = Math.max(2.1, Math.min(14, node.radius * Math.sqrt(zoom))) * (0.45 + progress * 0.55);
        if (position.x < -40 || position.x > width + 40 || position.y < -40 || position.y > height + 40) continue;
        const highlighted = !active || node === active || near.has(node.index);
        const color = colors.groups[CATEGORIES.indexOf(node.category)] || colors.node;
        ctx.globalAlpha = progress * progress * (highlighted ? 0.95 : 0.28);
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(position.x, position.y, radius, 0, Math.PI * 2); ctx.fill();
        if (node === active) {
          ctx.strokeStyle = color; ctx.lineWidth = 1.1; ctx.globalAlpha = progress * 0.65;
          ctx.beginPath(); ctx.arc(position.x, position.y, radius + 4, 0, Math.PI * 2); ctx.stroke();
          ctx.lineWidth = 0.7;
        }
        const showLabel = node === active || near?.has(node.index) || model.nodes.length < 85 && zoom > 0.42 || zoom > 1.4 && node.degree > 1 || zoom > 2.7;
        const spread = isStatic() || node.interacted ? 1 : smooth(clamp((motionTime - node.bornMotionTime - 160) / 520));
        if (showLabel && spread > 0.18) labelCandidates.push({ node, position, radius, progress: progress * smooth(clamp((spread - 0.18) / 0.5)), highlighted });
      }
      // Keep names readable at the fitted scale, prioritising the selected note and its neighbours.
      labelCandidates.sort((a, b) => Number(b.node === active) - Number(a.node === active) || Number(near?.has(b.node.index)) - Number(near?.has(a.node.index)) || b.node.degree - a.node.degree);
      for (const candidate of labelCandidates) {
        if (labels >= 120) break;
        const { node, position, radius, progress, highlighted } = candidate;
        const maximum = zoom < 2.4 ? 172 : 244;
        const measure = text => ctx.measureText?.(text).width || text.length * 10;
        let text = node.title;
        while (text.length > 3 && measure(text) > maximum) text = text.slice(0, -1);
        if (text !== node.title) text = text.slice(0, -1) + "…";
        const textWidth = measure(text);
        const placements = [
          { x: position.x + radius + 6, y: position.y },
          { x: position.x - radius - 6 - textWidth, y: position.y },
          { x: position.x - textWidth / 2, y: position.y - radius - 11 },
          { x: position.x - textWidth / 2, y: position.y + radius + 11 }
        ];
        // Choose a side once. Re-running collision placement every frame makes names
        // blink or jump between four sides as their floating nodes pass one another.
        let slot = labelSlots.get(node.index);
        if (slot === undefined) {
          const overlap = point => labelBoxes.reduce((score, box) => score + Math.max(0, Math.min(point.x + textWidth + 5, box.right) - Math.max(point.x - 5, box.left)) * Math.max(0, Math.min(point.y + 10, box.bottom) - Math.max(point.y - 10, box.top)), 0);
          const valid = placements.map((point, index) => ({ point, index })).filter(({ point }) => point.x > 5 && point.x + textWidth < width - 5 && point.y > 10 && point.y < height - 10 && overlap(point) === 0);
          // A new name can wait for space, then fade in once. Existing names stay put.
          if (!valid.length && node !== active) continue;
          slot = { side: valid[0]?.index ?? node.index % 4, shownAt: motionTime, offsetY: 0, targetY: 0, lastDraw: motionTime };
          labelSlots.set(node.index, slot);
        }
        const anchored = placements[slot.side];
        const point = { x: Math.max(5, Math.min(width - textWidth - 5, anchored.x)), y: Math.max(12, Math.min(height - 12, anchored.y + slot.offsetY)) };
        const intersects = y => labelBoxes.some(box => point.x < box.right + 5 && point.x + textWidth > box.left - 5 && y - 7 < box.bottom + 3 && y + 7 > box.top - 3);
        if (intersects(anchored.y + slot.targetY)) {
          const candidates = [slot.targetY, 0, -18, 18, -36, 36, -54, 54]
            .filter(offset => slot.side === 2 ? offset <= 0 : slot.side === 3 ? offset >= 0 : true)
            .sort((a, b) => Math.abs(a - slot.offsetY) - Math.abs(b - slot.offsetY));
          const free = candidates.find(offset => anchored.y + offset > 12 && anchored.y + offset < height - 12 && !intersects(anchored.y + offset));
          if (free !== undefined) slot.targetY = free;
        }
        // Small vertical corrections use water-like damping, never an instant side switch.
        const easing = isStatic() ? 1 : 1 - Math.exp(-Math.max(0, motionTime - slot.lastDraw) / 220);
        slot.offsetY += (slot.targetY - slot.offsetY) * easing; slot.lastDraw = motionTime;
        point.y = Math.max(12, Math.min(height - 12, anchored.y + slot.offsetY));
        labelBoxes.push({ left: point.x, right: point.x + textWidth, top: point.y - 7, bottom: point.y + 7 });
        const nameFade = isStatic() || node === active ? 1 : smooth(clamp((motionTime - slot.shownAt) / 260));
        ctx.globalAlpha = progress * nameFade * (highlighted ? 0.9 : 0.35); ctx.fillStyle = colors.text;
        ctx.fillText(text, point.x, point.y); labels++;
      }
      ctx.globalAlpha = 1;
      container.dataset.visibleNodes = String(visibleNodes);
      if (!model.nodes.length) {
        ctx.font = `14px ${font}`; ctx.fillStyle = colors.text; ctx.textAlign = "center";
        ctx.fillText(options.showOrphans === false ? "当前筛选中没有互相连接的笔记" : "当前筛选中没有笔记", width / 2, height / 2);
        ctx.textAlign = "start";
      }
    }

    function tick(now) {
      frame = 0;
      if (destroyed || doc.hidden || !width || !height) return;
      const elapsed = motionClock === null ? 0 : Math.max(0, now - motionClock);
      if (!isStatic()) { motionTime += elapsed; motionClock = now; }
      visualPositions.clear();
      if (!prepared && !isStatic()) { prepareLayout(); needsDraw = true; }
      if (prepared && growth < 1 && !isStatic()) {
        if (growthClock !== null) growthElapsed += Math.max(0, now - growthClock);
        growthClock = now; growth = Math.min(1, growthElapsed / growthDuration);
        container.dataset.growth = growth.toFixed(3);
        birthNodes();
        if (growth === 1) finishGrowth();
        needsDraw = true;
      }
      const physicsDue = ctx && prepared && !isStatic() && fluid && !fluid.settled;
      if (physicsDue) {
        fluid.step(Math.min(1 / 30, elapsed / 1000));
        // Birth, settling and floating share one stable camera. Only explicit fit/zoom
        // gestures change it, so completion never makes the entire graph expand again.
        container.dataset.frame = String(fluid.frame); container.dataset.settled = String(fluid.settled);
        needsDraw = true;
      }
      if (cameraTarget && !cameraTouched) {
        zoom += (cameraTarget.zoom - zoom) * 0.16;
        panX += (cameraTarget.x - panX) * 0.16; panY += (cameraTarget.y - panY) * 0.16;
        if (Math.abs(zoom - cameraTarget.zoom) < 0.0005 && Math.hypot(panX - cameraTarget.x, panY - cameraTarget.y) < 0.08) { zoom = cameraTarget.zoom; panX = cameraTarget.x; panY = cameraTarget.y; cameraTarget = null; }
        notifyZoom(); needsDraw = true;
      }
      if (followFocus && selected && !gesture) { const point = visualWorld(selected); panX = -point.x * zoom; panY = -point.y * zoom; }
      if (drifting() && now - lastDriftDraw >= 1000 / (model.nodes.length > 250 ? 15 : 30) - 0.3) { lastDriftDraw = now; needsDraw = true; }
      if (needsDraw) { draw(); needsDraw = false; }
      if (!frame && (running() || needsDraw)) frame = win.requestAnimationFrame(tick);
    }
    function resize() {
      if (destroyed) return;
      const bounds = container.getBoundingClientRect();
      const newWidth = Math.max(0, Math.round(bounds.width || container.clientWidth || 0));
      const newHeight = Math.max(0, Math.round(bounds.height || container.clientHeight || 0));
      const newDpr = Math.min(2, Math.max(1, win.devicePixelRatio || 1));
      if (newWidth === width && newHeight === height && newDpr === dpr) return;
      width = newWidth; height = newHeight; dpr = newDpr;
      canvas.width = Math.max(1, Math.round(width * dpr)); canvas.height = Math.max(1, Math.round(height * dpr));
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      simulation.resize(width, height);
      previewSimulation.resize(width, height);
      fluid?.resize(width, height);
      if (!width || !height) { growthClock = null; motionClock = null; stop(); return; }
      if (isStatic()) { exposeStaticNodes(); staticLayout(); prepared = true; finishGrowth(); }
      initialized = true;
      if (prepared && !cameraTouched && isStatic()) fit();
      requestDraw();
    }

    function beginPan(pointerId, point, moved = false) {
      gesture = { kind: "pan", pointerId, start: point, panX, panY, moved };
    }
    function cancelNode() {
      if (gesture?.kind === "node") { delete gesture.node.fx; delete gesture.node.fy; wake(0.25); }
    }
    function pointerDown(event) {
      if (event.button !== undefined && event.button !== 0 || destroyed) return;
      cameraTouched = true;
      cameraTarget = null;
      followFocus = false;
      const point = local(event);
      pointers.set(event.pointerId, point);
      try { canvas.setPointerCapture(event.pointerId); } catch (_) { /* Capture may have ended before dispatch. */ }
      canvas.focus({ preventScroll: true });
      if (pointers.size === 2) {
        cancelNode();
        const positions = [...pointers.values()], middle = { x: (positions[0].x + positions[1].x) / 2, y: (positions[0].y + positions[1].y) / 2 };
        gesture = { kind: "pinch", distance: Math.max(1, Math.hypot(positions[0].x - positions[1].x, positions[0].y - positions[1].y)), zoom, anchor: world(middle), moved: true };
      } else if (pointers.size === 1) {
        const node = hit(point);
        if (node) {
          const anchor = world(point);
          const visual = visualWorld(node);
          node.x = visual.x; node.y = visual.y; node.interacted = true; visualPositions.clear();
          node.fx = node.x; node.fy = node.y;
          gesture = { kind: "node", pointerId: event.pointerId, start: point, node, offsetX: node.x - anchor.x, offsetY: node.y - anchor.y, moved: false };
          selected = node; hover = null; reportFocus(); wake(0.35);
        } else beginPan(event.pointerId, point);
      }
      container.classList.add("is-dragging");
      requestDraw();
    }
    function pointerMove(event) {
      if (destroyed) return;
      const point = local(event);
      if (pointers.has(event.pointerId)) pointers.set(event.pointerId, point);
      if (gesture?.kind === "pinch" && pointers.size >= 2) {
        const positions = [...pointers.values()].slice(0, 2);
        const middle = { x: (positions[0].x + positions[1].x) / 2, y: (positions[0].y + positions[1].y) / 2 };
        zoom = Math.max(0.12, Math.min(6, gesture.zoom * Math.hypot(positions[0].x - positions[1].x, positions[0].y - positions[1].y) / gesture.distance));
        panX = middle.x - width / 2 - gesture.anchor.x * zoom; panY = middle.y - height / 2 - gesture.anchor.y * zoom;
        notifyZoom(); requestDraw(); return;
      }
      if (gesture && gesture.pointerId === event.pointerId) {
        if (Math.hypot(point.x - gesture.start.x, point.y - gesture.start.y) > 5) gesture.moved = true;
        if (gesture.kind === "node") {
          const anchor = world(point);
          gesture.node.fx = gesture.node.x = anchor.x + gesture.offsetX;
          gesture.node.fy = gesture.node.y = anchor.y + gesture.offsetY;
          wake(0.4);
        } else {
          panX = gesture.panX + point.x - gesture.start.x;
          panY = gesture.panY + point.y - gesture.start.y;
        }
        requestDraw(); return;
      }
      if (!gesture && event.pointerType !== "touch") {
        const next = hit(point);
        if (hover !== next) { hover = next; canvas.style.cursor = next ? "pointer" : "grab"; reportFocus(); requestDraw(); }
      }
    }
    function finishPointer(event, cancelled = false) {
      if (!pointers.has(event.pointerId)) return;
      const current = gesture;
      if (current?.start && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
        const point = local(event);
        if (Math.hypot(point.x - current.start.x, point.y - current.start.y) > 5) current.moved = true;
      }
      pointers.delete(event.pointerId);
      if (current?.kind === "node" && current.pointerId === event.pointerId) {
        cancelNode();
        if (!cancelled && !current.moved) call("onOpen", current.node.path);
      } else if (current?.kind === "pan" && !cancelled && !current.moved) { selected = null; hover = null; reportFocus(); }
      gesture = null;
      try { if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId); } catch (_) { /* Capture is already gone. */ }
      if (pointers.size === 1) { const [pointerId, point] = pointers.entries().next().value; beginPan(pointerId, point, true); }
      if (!pointers.size) container.classList.remove("is-dragging");
      requestDraw();
    }
    function cancelAll() {
      cancelNode(); gesture = null;
      const activePointers = [...pointers.keys()]; pointers.clear();
      for (const id of activePointers) { try { if (canvas.hasPointerCapture?.(id)) canvas.releasePointerCapture(id); } catch (_) { /* Best effort. */ } }
      container.classList.remove("is-dragging");
    }

    listen(canvas, "pointerdown", pointerDown);
    listen(canvas, "pointermove", pointerMove, { passive: true });
    listen(canvas, "pointerup", event => finishPointer(event));
    listen(canvas, "pointercancel", event => finishPointer(event, true));
    listen(canvas, "lostpointercapture", event => finishPointer(event, true));
    listen(canvas, "pointerleave", () => { if (!gesture && hover) { hover = null; reportFocus(); requestDraw(); } });
    listen(canvas, "wheel", event => { event.preventDefault(); setZoom(zoom * Math.exp(-event.deltaY * 0.0015), local(event)); }, { passive: false });
    listen(canvas, "dblclick", event => { if (!hit(local(event))) fit(); });
    listen(canvas, "keydown", event => {
      if (event.key.startsWith("Arrow")) { cameraTouched = true; cameraTarget = null; followFocus = false; }
      if (event.key === "+" || event.key === "=") setZoom(zoom + 0.12);
      else if (event.key === "-") setZoom(zoom - 0.12);
      else if (event.key === "0" || event.key === "Home") fit();
      else if (event.key === "ArrowLeft") panX -= 40;
      else if (event.key === "ArrowRight") panX += 40;
      else if (event.key === "ArrowUp") panY -= 40;
      else if (event.key === "ArrowDown") panY += 40;
      else if (event.key === "Enter" && focused()) call("onOpen", focused().path);
      else if (event.key === "Escape") { selected = null; hover = null; reportFocus(); }
      else return;
      event.preventDefault(); requestDraw();
    });
    listen(search, "input", () => fillOptions(search.value));
    listen(search, "keydown", event => {
      if (event.key !== "Enter") return;
      const key = search.value.trim().toLocaleLowerCase();
      const node = model.nodes.find(item => `${item.title} ${item.path}`.toLocaleLowerCase().includes(key));
      if (node) { focusNode(node); canvas.focus({ preventScroll: true }); event.preventDefault(); }
    });
    listen(select, "change", () => focusNode(byPath.get(select.value) || null));
    listen(openButton, "click", () => { if (focused()) call("onOpen", focused().path); });
    listen(doc, "visibilitychange", () => {
      growthClock = null;
      motionClock = null;
      if (doc.hidden) { cancelAll(); stop(); }
      else { if (isStatic()) staticLayout(); requestDraw(); }
    });
    listen(win, "resize", resize, { passive: true });
    if (media?.addEventListener) listen(media, "change", updateStyle);
    else if (media?.addListener) { media.addListener(updateStyle); disposers.push(() => media.removeListener(updateStyle)); }
    let resizeObserver = null;
    if (win.ResizeObserver) { resizeObserver = new win.ResizeObserver(resize); resizeObserver.observe(container); }
    fillOptions(); updateStyle(); resize(); reportFocus();
    call("onStats", { nodes: model.nodes.length, edges: model.edges.length, total: model.total, truncated: model.truncated });

    return {
      zoomBy(delta) { if (!destroyed) setZoom(zoom + (Number(delta) || 0)); },
      fit,
      updateStyle,
      reheat() { if (!destroyed) { wake(0.5); if (isStatic()) staticLayout(); requestDraw(); } },
      destroy() {
        if (destroyed) return;
        destroyed = true; cancelAll(); stop(); resizeObserver?.disconnect();
        for (const dispose of disposers) dispose();
        for (const node of elements) node.remove();
        call("onFocus", null, 0); container.dataset.layout = "destroyed";
      }
    };
  }

  return { mount, buildModel, createSimulation, normalizedPath, linkText };
});
