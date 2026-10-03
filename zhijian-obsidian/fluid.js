(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ZhijianFluid = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

/** Incremental water-like force layout. step(dt) accepts seconds, normally 1/60. */
function createFluidLayout(model, options = {}) {
  const nodes = Array.isArray(model && model.nodes) ? model.nodes : [];
  const count = nodes.length, alive = new Set(), active = [], links = [], allLinks = [], incident = Array.from({ length: count }, () => []);
  const radii = new Float64Array(count), degree = new Uint32Array(count), ax = new Float64Array(count), ay = new Float64Array(count);
  const lastFixedX = new Float64Array(count), lastFixedY = new Float64Array(count);
  lastFixedX.fill(NaN); lastFixedY.fill(NaN);
  const offsets = new Uint32Array(count), gridX = new Int32Array(count), gridY = new Int32Array(count), stack = [];
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));
  const finite = (value, fallback = 0) => Number.isFinite(value) ? Math.max(-1e7, Math.min(1e7, value)) : fallback;
  const dimension = (value, fallback) => Number.isFinite(value) && value > 0 ? Math.min(value, 1e7) : fallback;
  let width = dimension(options.width, 800), height = dimension(options.height, 600);
  let seed = { x: finite(options.seed && options.seed.x), y: finite(options.seed && options.seed.y) };
  let alpha = 0, frame = 0, age = 0, quiet = 0, settled = true, maxRadius = 4;

  for (let i = 0; i < count; i++) {
    radii[i] = Number.isFinite(nodes[i].radius) && nodes[i].radius > 0 ? Math.min(1000, nodes[i].radius) : 4;
    maxRadius = Math.max(maxRadius, radii[i]);
  }
  for (const edge of Array.isArray(model && model.edges) ? model.edges : []) {
    const a = edge.source, b = edge.target;
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a >= count || b >= count || a === b) continue;
    const index = allLinks.length;
    allLinks.push({ a, b, distance: Math.max(54, radii[a] + radii[b] + 38), active: false });
    incident[a].push(index); incident[b].push(index);
  }

  function direction(i, j) {
    const a = Math.min(i, j) + 1, b = Math.max(i, j) + 1;
    const angle = ((Math.imul(a, 73856093) ^ Math.imul(b, 19349663)) >>> 0) / 4294967296 * Math.PI * 2;
    const sign = i < j ? 1 : -1;
    return [Math.cos(angle) * sign, Math.sin(angle) * sign];
  }

  function reheat(amount = 0.72) {
    alpha = active.length ? Math.max(alpha, Math.max(0.05, Math.min(1, Number.isFinite(amount) ? amount : 0.72))) : 0;
    age = quiet = 0; settled = !active.length;
    return layout;
  }

  function add(index, settings = {}) {
    if (!Number.isInteger(index) || index < 0 || index >= count) return null;
    if (alive.has(index)) return nodes[index];
    const node = nodes[index], angle = (index + 1) * GOLDEN;
    if (settings.preservePosition) {
      node.x = finite(node.x, seed.x); node.y = finite(node.y, seed.y); node.vx = finite(node.vx); node.vy = finite(node.vy);
    } else {
      node.x = seed.x + Math.cos(angle) * 0.065; node.y = seed.y + Math.sin(angle) * 0.065;
      node.vx = node.vy = 0;
    }
    if (Number.isFinite(node.fx)) node.x = finite(node.fx);
    if (Number.isFinite(node.fy)) node.y = finite(node.fy);
    alive.add(index); active.push(index);
    for (const edgeIndex of incident[index]) {
      const edge = allLinks[edgeIndex];
      if (!edge.active && alive.has(edge.a) && alive.has(edge.b)) { edge.active = true; links.push(edge); degree[edge.a]++; degree[edge.b]++; }
    }
    reheat();
    return node;
  }

  function partition(indices, x0, y0, size, depth) {
    let x = 0, y = 0, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const i of indices) {
      const node = nodes[i]; x += node.x; y += node.y;
      minX = Math.min(minX, node.x); minY = Math.min(minY, node.y); maxX = Math.max(maxX, node.x); maxY = Math.max(maxY, node.y);
    }
    const cell = { x0, y0, size, mass: indices.length, x: x / indices.length, y: y / indices.length, children: null, indices: null };
    if (indices.length <= 8 || depth >= 20 || (maxX - minX < 1e-9 && maxY - minY < 1e-9)) { cell.indices = indices; return cell; }
    const half = size / 2, groups = [[], [], [], []];
    for (const i of indices) groups[(nodes[i].x >= x0 + half ? 1 : 0) | (nodes[i].y >= y0 + half ? 2 : 0)].push(i);
    cell.children = groups.map((group, q) => group.length ? partition(group, x0 + (q & 1 ? half : 0), y0 + (q & 2 ? half : 0), half, depth + 1) : null);
    return cell;
  }

  function tree() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const i of active) {
      minX = Math.min(minX, nodes[i].x); minY = Math.min(minY, nodes[i].y);
      maxX = Math.max(maxX, nodes[i].x); maxY = Math.max(maxY, nodes[i].y);
    }
    return partition(active, minX - 0.001, minY - 0.001, Math.max(1, maxX - minX, maxY - minY) + 0.002, 0);
  }

  function charge(i, dx, dy, mass) {
    let distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 1e-9) { dx = Math.cos((i + 1) * GOLDEN); dy = Math.sin((i + 1) * GOLDEN); distance = 1; }
    const softened = distance + 4;
    const force = 190 * alpha * mass / (softened * softened * distance);
    ax[i] += dx * force; ay[i] += dy * force;
  }

  function repulsion(root) {
    for (const i of active) {
      const node = nodes[i]; stack.length = 0; stack.push(root);
      while (stack.length) {
        const cell = stack.pop();
        const inside = node.x >= cell.x0 && node.x < cell.x0 + cell.size && node.y >= cell.y0 && node.y < cell.y0 + cell.size;
        const dx = node.x - cell.x, dy = node.y - cell.y;
        if (!inside && cell.size * cell.size < 1.44 * (dx * dx + dy * dy)) { charge(i, dx, dy, cell.mass); continue; }
        if (cell.children) { for (const child of cell.children) if (child) stack.push(child); continue; }
        if (cell.indices.length > 8) {
          const mass = cell.mass - Number(inside);
          if (mass) charge(i, dx * cell.mass / mass, dy * cell.mass / mass, mass);
        } else for (const j of cell.indices) {
          if (i === j) continue;
          let pairX = node.x - nodes[j].x, pairY = node.y - nodes[j].y;
          if (pairX * pairX + pairY * pairY < 1e-18) [pairX, pairY] = direction(i, j);
          charge(i, pairX, pairY, 1);
        }
      }
    }
  }

  function springForces() {
    for (const edge of links) {
      const a = nodes[edge.a], b = nodes[edge.b];
      let dx = b.x - a.x, dy = b.y - a.y;
      if (dx * dx + dy * dy < 1e-18) [dx, dy] = direction(edge.b, edge.a);
      const distance = Math.sqrt(dx * dx + dy * dy), force = (distance - edge.distance) / distance * 0.014 * alpha / Math.sqrt(Math.min(degree[edge.a], degree[edge.b]));
      const bias = degree[edge.b] / (degree[edge.a] + degree[edge.b]);
      const aX = Number.isFinite(a.fx) ? 0 : Number.isFinite(b.fx) ? 1 : bias;
      const aY = Number.isFinite(a.fy) ? 0 : Number.isFinite(b.fy) ? 1 : bias;
      const bX = Number.isFinite(b.fx) ? 0 : Number.isFinite(a.fx) ? 1 : 1 - bias;
      const bY = Number.isFinite(b.fy) ? 0 : Number.isFinite(a.fy) ? 1 : 1 - bias;
      ax[edge.a] += dx * force * aX; ay[edge.a] += dy * force * aY;
      ax[edge.b] -= dx * force * bX; ay[edge.b] -= dy * force * bY;
    }
  }

  function collisions() {
    const cells = new Map(), size = maxRadius * 2 + 2;
    for (const i of active) {
      const x = Math.floor(nodes[i].x / size), y = Math.floor(nodes[i].y / size); gridX[i] = x; gridY[i] = y;
      const key = x + "," + y; let bucket = cells.get(key);
      if (!bucket) cells.set(key, bucket = []);
      offsets[i] = bucket.length; bucket.push(i);
    }
    function resolve(i, j) {
      if (j <= i) return;
      const a = nodes[i], b = nodes[j], minimum = radii[i] + radii[j] + 2;
      let dx = b.x - a.x, dy = b.y - a.y;
      if (dx * dx + dy * dy >= minimum * minimum) return;
      let distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 1e-9) { [dx, dy] = direction(j, i); distance = 1; }
      const force = (minimum - distance) / distance * 0.055;
      const aX = Number.isFinite(a.fx) ? 0 : 1, bX = Number.isFinite(b.fx) ? 0 : 1;
      const aY = Number.isFinite(a.fy) ? 0 : 1, bY = Number.isFinite(b.fy) ? 0 : 1;
      if (aX + bX) { ax[i] -= dx * force * aX / (aX + bX); ax[j] += dx * force * bX / (aX + bX); }
      if (aY + bY) { ay[i] -= dy * force * aY / (aY + bY); ay[j] += dy * force * bY / (aY + bY); }
    }
    for (const i of active) for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
      const bucket = cells.get((gridX[i] + ox) + "," + (gridY[i] + oy)); if (!bucket) continue;
      if (bucket.length <= 24) { for (const j of bucket) resolve(i, j); }
      else {
        const start = ox === 0 && oy === 0 ? offsets[i] : (Math.imul(i + 1, 2654435761) >>> 0) % bucket.length;
        const stride = Math.max(1, Math.floor(bucket.length / 12));
        for (let k = 0; k < 12; k++) resolve(i, bucket[(start + k * stride + 1) % bucket.length]);
      }
    }
  }

  function constrain() {
    let moved = false;
    for (const i of active) {
      const node = nodes[i]; node.x = finite(node.x, seed.x); node.y = finite(node.y, seed.y); node.vx = finite(node.vx); node.vy = finite(node.vy);
      const fixedX = Number.isFinite(node.fx) ? node.fx : NaN, fixedY = Number.isFinite(node.fy) ? node.fy : NaN;
      if ((Number.isFinite(fixedX) || Number.isFinite(lastFixedX[i])) && fixedX !== lastFixedX[i]) moved = true;
      if ((Number.isFinite(fixedY) || Number.isFinite(lastFixedY[i])) && fixedY !== lastFixedY[i]) moved = true;
      lastFixedX[i] = fixedX; lastFixedY[i] = fixedY;
      if (Number.isFinite(fixedX)) { node.x = finite(fixedX); node.vx = 0; }
      if (Number.isFinite(fixedY)) { node.y = finite(fixedY); node.vy = 0; }
    }
    return moved;
  }

  function integrate(h) {
    for (const i of active) ax[i] = ay[i] = 0;
    repulsion(tree()); springForces(); collisions();
    const gravity = Math.max(0.001, Math.min(0.003, 0.0017 * Math.sqrt(600 / Math.max(100, Math.min(width, height))))) * alpha;
    const damping = Math.pow(0.90, h), accelerationLimit = 0.20 + alpha * 0.24;
    let speedMaximum = 0;
    for (const i of active) {
      const node = nodes[i]; ax[i] -= (node.x - seed.x) * gravity; ay[i] -= (node.y - seed.y) * gravity;
      if (Number.isFinite(node.fx)) ax[i] = 0;
      if (Number.isFinite(node.fy)) ay[i] = 0;
      const acceleration = Math.sqrt(ax[i] * ax[i] + ay[i] * ay[i]);
      if (acceleration > accelerationLimit) { ax[i] *= accelerationLimit / acceleration; ay[i] *= accelerationLimit / acceleration; }
      node.vx = (node.vx + ax[i] * h) * damping; node.vy = (node.vy + ay[i] * h) * damping;
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed > 3.2) { node.vx *= 3.2 / speed; node.vy *= 3.2 / speed; }
      if (Number.isFinite(node.fx)) { node.x = finite(node.fx); node.vx = 0; } else node.x = finite(node.x + node.vx * h, seed.x);
      if (Number.isFinite(node.fy)) { node.y = finite(node.fy); node.vy = 0; } else node.y = finite(node.y + node.vy * h, seed.y);
      speedMaximum = Math.max(speedMaximum, Math.sqrt(node.vx * node.vx + node.vy * node.vy));
    }
    alpha *= Math.pow(0.985, h); age += h;
    quiet = alpha < 0.008 && speedMaximum < 0.045 ? quiet + h : 0;
    if (quiet >= 12 || age >= 600) {
      settled = true; alpha = 0;
      for (const i of active) nodes[i].vx = nodes[i].vy = 0;
    }
  }

  function step(dt = 1 / 60) {
    const movedFixedPoint = constrain();
    if (movedFixedPoint) reheat(0.25);
    if (!active.length || settled || dt === 0) return { born: alive.size, frame, settled, alpha };
    const seconds = Number.isFinite(dt) && dt > 0 ? Math.min(1 / 30, dt) : 1 / 60;
    const parts = Math.max(1, Math.ceil(seconds * 60));
    const h = seconds * 60 / parts;
    for (let part = 0; part < parts && !settled; part++) integrate(h);
    frame++;
    return { born: alive.size, frame, settled, alpha };
  }

  function resize(nextWidth, nextHeight) { width = dimension(nextWidth, width); height = dimension(nextHeight, height); return reheat(0.22); }
  function setSeed(value, y) {
    seed = typeof value === "object" && value ? { x: finite(value.x, seed.x), y: finite(value.y, seed.y) } : { x: finite(value, seed.x), y: finite(y, seed.y) };
    return layout;
  }

  const layout = { add, adopt(index) { return add(index, { preservePosition: true }); }, step, reheat, resize, setSeed, alive, get born() { return alive.size; }, get frame() { return frame; }, get settled() { return settled; }, get alpha() { return alpha; } };
  return layout;
}

return { createFluidLayout };
});
