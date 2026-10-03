// Regression fixtures use in-memory Obsidian/browser mocks; they do not verify a real Obsidian app load.
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Graph = require("../graph");

class Target {
  constructor() { this.listeners = new Map(); }
  addEventListener(event, handler) { const handlers = this.listeners.get(event) || []; handlers.push(handler); this.listeners.set(event, handlers); }
  removeEventListener(event, handler) { this.listeners.set(event, (this.listeners.get(event) || []).filter(entry => entry !== handler)); }
  dispatch(event, values = {}) {
    const data = { preventDefault() { this.defaultPrevented = true; }, ...values };
    for (const handler of [...(this.listeners.get(event) || [])]) handler(data);
    return data;
  }
  get listenerCount() { return [...this.listeners.values()].reduce((sum, handlers) => sum + handlers.length, 0); }
}

class Element extends Target {
  constructor(doc, tag = "div") {
    super();
    this.ownerDocument = doc; this.tagName = tag.toUpperCase(); this.className = "";
    this.children = []; this.dataset = {}; this.attributes = {}; this.style = {};
    this.value = ""; this.textContent = ""; this.isConnected = true; this.captures = new Set();
    this.bounds = { width: 800, height: 600, left: 80, top: 60 };
    const classes = new Set();
    this.classList = { add: key => classes.add(key), remove: key => classes.delete(key), contains: key => classes.has(key) };
  }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  appendChild(element) { element.remove(); this.children.push(element); element.parentElement = this; element.isConnected = this.isConnected; return element; }
  replaceChildren(...elements) { for (const child of [...this.children]) child.remove(); for (const element of elements) this.appendChild(element); }
  remove() {
    if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(child => child !== this);
    this.parentElement = null; this.isConnected = false;
  }
  getBoundingClientRect() { return this.tagName === "CANVAS" && this.parentElement ? this.parentElement.bounds : this.bounds; }
  get clientWidth() { return this.getBoundingClientRect().width; }
  get clientHeight() { return this.getBoundingClientRect().height; }
  focus() { this.ownerDocument.activeElement = this; }
  setPointerCapture(id) { this.captures.add(id); }
  hasPointerCapture(id) { return this.captures.has(id); }
  releasePointerCapture(id) { this.captures.delete(id); }
}

function notes(count = 30) {
  const categories = ["项目", "资产", "资源", "辅助", "灵感", "Skills"];
  return Array.from({ length: count }, (_, index) => ({
    path: `notes/Note-${index}.md`, title: `Note ${index}`, category: categories[index % categories.length],
    links: index + 1 < count ? [`Note-${index + 1}`] : [],
  }));
}

function fixture({ count = 30, motion = "full", reduced = false, withCanvas = true, hidden = false } = {}) {
  const doc = new Target(), win = new Target(), media = new Target();
  doc.defaultView = win; doc.hidden = hidden; media.matches = reduced;
  let time = 0, id = 0;
  const frames = new Map(), observers = [], elements = [];
  const stats = { draws: 0, arcs: [], lines: [], curves: [], labels: [], transforms: [] };
  const ctx = {
    globalAlpha: 1,
    clearRect() { stats.draws++; stats.arcs = []; stats.lines = []; stats.curves = []; stats.labels = []; },
    setTransform(...values) { stats.transforms.push(values); },
    beginPath() {}, moveTo(x, y) { this.start = { x, y }; },
    lineTo(x, y) { stats.lines.push({ from: this.start, to: { x, y }, opacity: this.globalAlpha }); },
    bezierCurveTo(c1x, c1y, c2x, c2y, x, y) { stats.curves.push({ from: this.start, control1: { x: c1x, y: c1y }, control2: { x: c2x, y: c2y }, to: { x, y }, opacity: this.globalAlpha }); },
    stroke() {}, fill() {},
    arc(x, y, radius) { stats.arcs.push({ x, y, radius, opacity: this.globalAlpha }); },
    fillText(text, x, y) { stats.labels.push({ text, x, y, opacity: this.globalAlpha }); },
  };
  doc.createElement = tag => { const element = new Element(doc, tag); element.getContext = () => withCanvas ? ctx : null; elements.push(element); return element; };
  win.devicePixelRatio = 3; win.performance = { now: () => time }; win.matchMedia = () => media;
  win.getComputedStyle = () => ({ fontFamily: "Inter, sans-serif", getPropertyValue: () => "" });
  win.requestAnimationFrame = callback => { frames.set(++id, callback); return id; };
  win.cancelAnimationFrame = frame => frames.delete(frame);
  win.step = milliseconds => { time += milliseconds; const scheduled = [...frames.values()]; frames.clear(); for (const callback of scheduled) callback(time); };
  class Observer {
    constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
    trigger() { if (!this.disconnected) this.callback(); }
  }
  win.ResizeObserver = Observer;
  const container = new Element(doc), sourceNotes = notes(count);
  const settings = { theme: "dark", motion }, opens = [], focus = [], zooms = [], graphStats = [];
  const options = { getSettings: () => settings, onOpen: path => opens.push(path), onFocus: (...values) => focus.push(values), onZoom: zoom => zooms.push(zoom), onStats: value => graphStats.push(value) };
  const mounted = Graph.mount(container, sourceNotes, options);
  function find(className) { return elements.find(element => element.isConnected && element.className === className); }
  return { mounted, doc, win, media, container, sourceNotes, settings, opens, focus, zooms, graphStats, frames, observers, elements, stats, options, find };
}

function advance(f, milliseconds, pace = 16) {
  for (let elapsed = 0; elapsed < milliseconds;) { const delta = Math.min(pace, milliseconds - elapsed); f.win.step(delta); elapsed += delta; }
}

function completeGrowth(f) {
  if (f.container.dataset.growthState === "preparing") f.win.step(34);
  if (f.container.dataset.growthState !== "complete") advance(f, 3200);
  assert.equal(f.container.dataset.growth, "1.000");
  assert.equal(f.container.dataset.growthState, "complete");
}

function settle(f) {
  completeGrowth(f);
  for (let iteration = 0; iteration < 720 && f.container.dataset.settled !== "true"; iteration++) f.win.step(1000 / 60);
  assert.equal(f.container.dataset.settled, "true", "active force layout eventually settles");
  advance(f, 200);
}

function pointer(f, event, x, y, id = 1) {
  const bounds = f.find("zj-force-canvas").getBoundingClientRect();
  return f.find("zj-force-canvas").dispatch(event, { pointerId: id, pointerType: "mouse", button: 0, clientX: bounds.left + x, clientY: bounds.top + y });
}

test("model resolves relative paths and wiki aliases, deduplicates links, and preserves source notes", () => {
  const source = [
    { path: "folder/a.md", title: "Alpha", links: ["[[b|第二篇]]", "../library/c.md#Part", "folder/b.md", "![[b]]", "Alpha", "Missing", "https://example.test", "#Heading"] },
    { path: "folder/b.md", title: "Beta", links: ["a", "folder/a.md", "b"] },
    { path: "library/c.md", title: "Gamma", links: ["../folder/a.md"] },
    { path: "folder\\a.MD", title: "Duplicate", links: [] },
    { path: "orphan.md", title: "Orphan", links: [] },
    { path: "x/shared.md", title: "Shared", links: [] },
    { path: "y/shared.md", title: "Shared", links: [] },
    { path: "query.md", title: "Query", links: ["shared"] },
  ];
  const snapshot = JSON.stringify(source);
  for (const note of source) { Object.freeze(note.links); Object.freeze(note); }
  Object.freeze(source);
  const model = Graph.buildModel(source);
  assert.equal(model.nodes.length, 7);
  assert.equal(model.edges.length, 2, "reciprocal links and repeated aliases count as one connection");
  assert.equal(model.unresolved, 2, "missing or ambiguous note aliases remain unresolved");
  assert.equal(model.nodes.find(node => node.title === "Alpha").degree, 2);
  assert.equal(model.nodes.find(node => node.title === "Orphan").degree, 0);
  assert.equal(JSON.stringify(source), snapshot);
  const connected = Graph.buildModel(source, { showOrphans: false });
  assert.equal(connected.nodes.length, 3); assert.equal(connected.edges.length, 2);
  assert.equal(connected.sourceTotal, 7); assert.equal(connected.total, 3);
  assert.equal(Graph.normalizedPath("folder\\sub\\..\\note.MD"), "folder/note");
  assert.equal(Graph.normalizedPath("../../outside.md"), "");
  assert.equal(Graph.linkText("![[folder/a.md#heading|Alias]]"), "folder/a.md");
  assert.equal(Graph.linkText("https://example.test"), "");
});

test("model caps nodes at 1000 and remaps only displayed edges", () => {
  const source = notes(1030);
  const limited = Graph.buildModel(source, { maxNodes: 5000 });
  assert.equal(limited.nodes.length, 1000); assert.equal(limited.maximum, 1000);
  assert.equal(limited.total, 1030); assert.equal(limited.truncated, true);
  assert.equal(limited.edges.length, 999);
  for (const edge of limited.edges) assert.ok(edge.source >= 0 && edge.source < 1000 && edge.target >= 0 && edge.target < 1000);
  const small = Graph.buildModel(source, { maxNodes: 5, showOrphans: false });
  assert.equal(small.nodes.length, 5); assert.equal(small.edges.length, 4);
  assert.deepEqual(small.nodes.map(node => node.degree), [1, 2, 2, 2, 1]);
  assert.equal(Graph.buildModel(null).nodes.length, 0);
});

test("each mount incrementally births nodes over 3200ms while keeping its camera fixed", () => {
  const f = fixture();
  assert.equal(f.container.dataset.growth, "0.000"); assert.equal(f.container.dataset.growthState, "preparing");
  assert.equal(f.container.dataset.growthDuration, "3200"); assert.equal(f.container.dataset.growthTechnique, "incremental-fluid");
  assert.equal(f.container.dataset.visibleNodes, "0"); assert.equal(f.frames.size, 1);
  const canvas = f.find("zj-force-canvas");
  assert.equal(canvas.width, 1600); assert.equal(canvas.height, 1200); assert.equal(canvas.attributes.role, "img");
  assert.equal(f.graphStats[0].nodes, 30); assert.equal(f.graphStats[0].edges, 29);
  f.win.step(34);
  assert.equal(f.container.dataset.growthState, "growing"); assert.equal(f.container.dataset.growth, "0.000");
  assert.equal(f.container.dataset.activeNodes, "1"); assert.equal(f.container.dataset.visibleNodes, "0");
  assert.equal(f.frames.size, 1, "preparation and drawing share one RAF chain");
  const camera = { zoom: f.container.dataset.zoom, x: f.container.dataset.panX, y: f.container.dataset.panY };
  advance(f, 300);
  assert.ok(Number(f.container.dataset.activeNodes) > 1 && Number(f.container.dataset.activeNodes) < 30);
  assert.ok(Number(f.container.dataset.visibleNodes) > 0 && Number(f.container.dataset.visibleNodes) <= Number(f.container.dataset.activeNodes));
  advance(f, 1300); assert.equal(f.container.dataset.growth, "0.500");
  assert.ok(Number(f.container.dataset.activeNodes) > 15 && Number(f.container.dataset.activeNodes) < 30);
  advance(f, 480); assert.equal(f.container.dataset.activeNodes, "30", "all notes are active after 65% of the birth interval");
  advance(f, 1119); assert.equal(f.container.dataset.growthState, "growing");
  f.win.step(1); assert.equal(f.container.dataset.growth, "1.000"); assert.equal(f.container.dataset.growthState, "complete");
  assert.equal(f.container.dataset.visibleNodes, "30"); assert.equal(f.stats.arcs.length, 30); assert.equal(f.stats.lines.length, 29); assert.equal(f.stats.curves.length, 0);
  assert.equal(f.opens.length, 0); assert.equal(f.frames.size, 1);
  assert.deepEqual({ zoom: f.container.dataset.zoom, x: f.container.dataset.panX, y: f.container.dataset.panY }, camera, "birth completion does not trigger a camera expansion");
  settle(f);
  assert.deepEqual({ zoom: f.container.dataset.zoom, x: f.container.dataset.panX, y: f.container.dataset.panY }, camera, "settling does not reframe the graph");
  f.mounted.destroy();
  const again = Graph.mount(f.container, f.sourceNotes, f.options);
  assert.equal(f.container.dataset.growthState, "preparing"); assert.equal(f.container.dataset.growth, "0.000");
  f.win.step(34); advance(f, 3200); assert.equal(f.container.dataset.activeNodes, "30");
  again.destroy(); assert.equal(f.frames.size, 0);
});

test("hidden documents pause births, force movement, and the floating clock", () => {
  const f = fixture(); f.win.step(34); advance(f, 600);
  const state = { growth: f.container.dataset.growth, active: f.container.dataset.activeNodes, frame: f.container.dataset.frame, arcs: structuredClone(f.stats.arcs), draws: f.stats.draws };
  f.doc.hidden = true; f.doc.dispatch("visibilitychange"); assert.equal(f.frames.size, 0); f.win.step(10000);
  assert.equal(f.container.dataset.growth, state.growth); assert.equal(f.container.dataset.activeNodes, state.active); assert.equal(f.container.dataset.frame, state.frame); assert.equal(f.stats.draws, state.draws);
  f.doc.hidden = false; f.doc.dispatch("visibilitychange"); f.win.step(16);
  assert.equal(f.container.dataset.growth, state.growth); assert.deepEqual(f.stats.arcs, state.arcs, "the first visible frame integrates no hidden time");
  advance(f, 2600); assert.equal(f.container.dataset.growthState, "complete"); settle(f);
  // Flush the 30fps paint throttle so the baseline uses the current floating clock.
  f.mounted.updateStyle(); f.win.step(0);
  const floating = structuredClone(f.stats.arcs);
  f.doc.hidden = true; f.doc.dispatch("visibilitychange"); f.win.step(10000);
  f.doc.hidden = false; f.doc.dispatch("visibilitychange"); f.win.step(16);
  assert.deepEqual(f.stats.arcs, floating, "floating resumes at the same phase");
  f.mounted.destroy(); assert.equal(f.frames.size, 0);
});

test("new centre births push older points through real forces while labels keep stable offsets", () => {
  const f = fixture({ count: 8 }); f.win.step(34); advance(f, 200);
  assert.equal(f.container.dataset.activeNodes, "1"); assert.equal(f.stats.arcs.length, 1);
  assert.equal(f.container.dataset.seedX, "400.00"); assert.equal(f.container.dataset.seedY, "300.00");
  const first = { ...f.stats.arcs[0] };
  assert.ok(Math.hypot(first.x - 400, first.y - 300) < 1, "a lone first note stays near the birth seed");
  advance(f, 240);
  assert.equal(f.container.dataset.activeNodes, "2");
  const old = f.stats.arcs[1];
  assert.ok(Math.hypot(old.x - first.x, old.y - first.y) > 2, "the next node physically displaces the old note");
  const oldPosition = { x: old.x, y: old.y }, frame = Number(f.container.dataset.frame);
  f.win.step(16);
  assert.ok(Number(f.container.dataset.frame) > frame);
  assert.ok(Math.hypot(f.stats.arcs[1].x - oldPosition.x, f.stats.arcs[1].y - oldPosition.y) > 0.05, "stored velocity continues real motion at RAF cadence");
  assert.equal(f.stats.curves.length, 0); assert.equal(f.stats.arcs.length, Number(f.container.dataset.visibleNodes), "growth has no halos or travelling tips");
  advance(f, 3200 - 456); assert.equal(f.container.dataset.activeNodes, "8"); assert.equal(f.container.dataset.visibleNodes, "8");
  const offsets = () => new Map(f.stats.labels.map(label => {
    const match = label.text.match(/^Note (\d+)$/), point = match && f.stats.arcs[Number(match[1])];
    return point ? [label.text, { x: label.x - point.x, y: label.y - point.y }] : [label.text, null];
  }).filter(([, point]) => point));
  const firstSlots = offsets(); assert.ok(firstSlots.size > 0);
  let previousSlots = firstSlots;
  for (let iteration = 0; iteration < 12; iteration++) {
    f.win.step(16); const nextSlots = offsets();
    for (const [name, offset] of firstSlots) {
      assert.ok(nextSlots.has(name), "an established name stays visible");
      const next = nextSlots.get(name), previous = previousSlots.get(name);
      assert.ok(Math.abs(next.x - offset.x) < 0.02, "an established name never jumps to another horizontal anchor");
      assert.ok(Math.abs(next.y - previous.y) < 8, "vertical avoidance is damped across consecutive paints");
      const textWidth = name.length * 10;
      if (Math.abs(offset.x + textWidth / 2) < 0.02) assert.equal(Math.sign(next.y), Math.sign(offset.y), "above/below names stay on their original side");
    }
    previousSlots = nextSlots;
  }
  settle(f); assert.equal(f.frames.size, 1);
  const draws = f.stats.draws; f.win.step(34); const paced = f.stats.draws; f.win.step(16); assert.equal(f.stats.draws, paced); f.win.step(18); assert.equal(f.stats.draws, paced + 1); assert.ok(paced >= draws);
  const fullA = structuredClone(f.stats.arcs);
  f.settings.motion = "subtle"; f.mounted.updateStyle(); f.win.step(0); const subtleA = structuredClone(f.stats.arcs);
  f.settings.motion = "full"; f.mounted.updateStyle(); f.win.step(0); advance(f, 600, 34); f.mounted.updateStyle(); f.win.step(0); const fullB = structuredClone(f.stats.arcs);
  f.settings.motion = "subtle"; f.mounted.updateStyle(); f.win.step(0); const subtleB = structuredClone(f.stats.arcs);
  const distances = (a, b) => a.map((point, index) => Math.hypot(point.x - b[index].x, point.y - b[index].y));
  const full = distances(fullA, fullB), subtle = distances(subtleA, subtleB);
  assert.ok(Math.max(...full) > 0.01 && Math.max(...full) < 1.5, "idle drift moves only a fraction of a screen pixel over 600ms");
  const ratio = subtle.reduce((sum, value) => sum + value, 0) / full.reduce((sum, value) => sum + value, 0); assert.ok(ratio > 0.4 && ratio < 0.65);
  f.mounted.destroy(); assert.equal(f.frames.size, 0);
});

test("dragging a newly born node uses its actual visible position and follows the pointer exactly", () => {
  const f = fixture(); f.win.step(34); advance(f, 600);
  const point = f.stats.arcs.find(candidate => candidate.opacity > 0.2 && candidate.opacity < 0.8);
  assert.ok(point);
  pointer(f, "pointerdown", point.x, point.y); assert.ok(f.container.dataset.focusedPath);
  pointer(f, "pointermove", point.x + 80, point.y + 30); f.win.step(0);
  assert.ok(Math.abs(Number(f.container.dataset.focusedX) - point.x - 80) < 0.02); assert.ok(Math.abs(Number(f.container.dataset.focusedY) - point.y - 30) < 0.02);
  f.win.step(16); assert.ok(Math.abs(Number(f.container.dataset.focusedX) - point.x - 80) < 0.02); assert.ok(Math.abs(Number(f.container.dataset.focusedY) - point.y - 30) < 0.02);
  pointer(f, "pointerup", point.x + 80, point.y + 30); assert.equal(f.opens.length, 0); assert.equal(f.find("zj-force-canvas").captures.size, 0);
  f.mounted.destroy(); assert.equal(f.frames.size, 0);
});

test("zero-size containers pause births and forces and retain their clocks on recovery", () => {
  const f = fixture(); f.win.step(34); advance(f, 600);
  const growth = f.container.dataset.growth, active = f.container.dataset.activeNodes, frame = f.container.dataset.frame, arcs = structuredClone(f.stats.arcs), bounds = { ...f.container.bounds };
  f.container.bounds = { ...bounds, width: 0, height: 0 }; f.observers[0].trigger(); assert.equal(f.frames.size, 0); f.win.step(10000);
  assert.equal(f.container.dataset.growth, growth); assert.equal(f.container.dataset.activeNodes, active); assert.equal(f.container.dataset.frame, frame);
  f.container.bounds = bounds; f.observers[0].trigger(); f.win.step(16);
  assert.equal(f.container.dataset.growth, growth); assert.deepEqual(f.stats.arcs, arcs);
  advance(f, 2600); assert.equal(f.container.dataset.growthState, "complete"); f.mounted.destroy();
  const paused = fixture({ count: 8 }), control = fixture({ count: 8 }); settle(paused); settle(control);
  for (const item of [paused, control]) { item.container.bounds = { ...item.container.bounds, width: 0, height: 0 }; item.observers[0].trigger(); }
  paused.win.step(10000);
  for (const item of [paused, control]) { item.container.bounds = { ...item.container.bounds, width: 800, height: 600 }; item.observers[0].trigger(); item.win.step(16); }
  assert.deepEqual(paused.stats.arcs, control.stats.arcs, "zero-size time advances neither drift nor forces");
  paused.mounted.destroy(); control.mounted.destroy();
});

test("large graphs use bounded camera preparation and preserve manual zoom while nodes are born", () => {
  const f = fixture({ count: 200 }); f.win.step(34);
  assert.equal(f.container.dataset.growthState, "growing"); assert.equal(f.container.dataset.activeNodes, "1");
  advance(f, 1600); assert.equal(f.container.dataset.growth, "0.500");
  f.mounted.zoomBy(0.2); const zoom = f.container.dataset.zoom;
  advance(f, 1600); assert.equal(f.container.dataset.growthState, "complete"); assert.equal(f.container.dataset.zoom, zoom);
  f.mounted.destroy(); assert.equal(f.frames.size, 0);
  const large = fixture({ count: 300 }); settle(large); large.win.step(67); const draws = large.stats.draws;
  large.win.step(16); large.win.step(18); assert.equal(large.stats.draws, draws, "large settled graphs pace floating at 15fps");
  large.win.step(33); assert.equal(large.stats.draws, draws + 1); large.mounted.destroy();
});

test("mounting while hidden waits to prepare and birth nodes until visibility", () => {
  const f = fixture({ hidden: true }); assert.equal(f.frames.size, 0); assert.equal(f.container.dataset.frame, "0");
  f.win.step(10000); assert.equal(f.container.dataset.growth, "0.000"); assert.equal(f.container.dataset.visibleNodes, "0");
  f.doc.hidden = false; f.doc.dispatch("visibilitychange"); f.win.step(34);
  assert.equal(f.container.dataset.growthState, "growing"); assert.equal(f.container.dataset.activeNodes, "1");
  advance(f, 1600); assert.equal(f.container.dataset.growth, "0.500"); advance(f, 1600); assert.equal(f.container.dataset.growthState, "complete");
  f.mounted.destroy();
});

test("off and reduced motion show static complete layouts, and resuming adopts existing positions", () => {
  for (const mode of [{ motion: "off" }, { reduced: true }]) {
    const f = fixture(mode); assert.equal(f.container.dataset.growth, "1.000"); assert.equal(f.container.dataset.activeNodes, "30");
    f.win.step(1); assert.equal(f.container.dataset.visibleNodes, "30"); assert.equal(f.frames.size, 0); f.mounted.destroy();
  }
  const f = fixture(); f.win.step(34); advance(f, 600);
  f.settings.motion = "off"; f.mounted.updateStyle(); f.win.step(1);
  const staticPoints = structuredClone(f.stats.arcs);
  assert.equal(f.container.dataset.activeNodes, "30"); assert.equal(f.container.dataset.visibleNodes, "30"); assert.equal(f.frames.size, 0);
  f.settings.motion = "full"; f.mounted.updateStyle(); f.win.step(0);
  assert.equal(f.container.dataset.growth, "1.000"); assert.equal(f.container.dataset.activeNodes, "30"); assert.equal(f.stats.arcs.length, 30);
  assert.ok(f.stats.arcs.every((point, index) => Math.hypot(point.x - staticPoints[index].x, point.y - staticPoints[index].y) < 2.5), "reenabling motion does not reset notes to the birth centre");
  f.media.matches = true; f.media.dispatch("change"); f.win.step(1); assert.equal(f.frames.size, 0);
  f.media.matches = false; f.media.dispatch("change"); assert.equal(f.container.dataset.growth, "1.000");
  f.settings.motion = "off"; f.mounted.updateStyle(); f.win.step(1); assert.equal(f.frames.size, 0); f.mounted.destroy();
});

test("zoom, picker focus, pan, pinch and dragging remain distinct from opening notes", () => {
  const f = fixture(); settle(f);
  const canvas = f.find("zj-force-canvas"), select = f.find("zj-graph-node-select"), search = f.find("zj-graph-node-search");
  select.value = f.sourceNotes[10].path; select.dispatch("change"); f.win.step(1);
  assert.equal(f.container.dataset.focusedPath, f.sourceNotes[10].path); assert.equal(Number(f.container.dataset.focusedX), 400); assert.equal(Number(f.container.dataset.focusedY), 300);
  const priorZoom = Number(f.container.dataset.zoom); f.mounted.zoomBy(0.2); f.win.step(1); assert.ok(Number(f.container.dataset.zoom) > priorZoom);
  const wheel = canvas.dispatch("wheel", { deltaY: -120, clientX: 480, clientY: 360 }); assert.equal(wheel.defaultPrevented, true); f.win.step(1); assert.equal(f.opens.length, 0);
  pointer(f, "pointerdown", 400, 300); pointer(f, "pointermove", 480, 330); f.win.step(16);
  assert.equal(Number(f.container.dataset.focusedX), 480); assert.equal(Number(f.container.dataset.focusedY), 330);
  pointer(f, "pointerup", 480, 330); assert.equal(f.opens.length, 0);
  pointer(f, "pointerdown", 480, 330); pointer(f, "pointerup", 480, 330); assert.deepEqual(f.opens, [f.sourceNotes[10].path]);
  f.find("zj-graph-node-open").dispatch("click"); canvas.dispatch("keydown", { key: "Enter" }); assert.equal(f.opens.length, 3);
  search.value = "Note 4"; search.dispatch("input"); search.dispatch("keydown", { key: "Enter" }); f.win.step(1); assert.equal(f.container.dataset.focusedPath, f.sourceNotes[4].path); assert.equal(f.opens.length, 3);
  pointer(f, "pointerdown", 10, 10, 2); pointer(f, "pointermove", 70, 25, 2); pointer(f, "pointerup", 70, 25, 2);
  const zoom = Number(f.container.dataset.zoom); pointer(f, "pointerdown", 10, 10, 3); pointer(f, "pointerdown", 50, 10, 4); pointer(f, "pointermove", 90, 10, 4);
  assert.ok(Number(f.container.dataset.zoom) > zoom); pointer(f, "pointerup", 10, 10, 3); pointer(f, "pointerup", 90, 10, 4);
  assert.equal(f.opens.length, 3); assert.equal(canvas.captures.size, 0); f.mounted.destroy();
});

test("resize and cancellation maintain coordinates, and destroy clears all frames, captures and listeners", () => {
  const f = fixture(); settle(f); const canvas = f.find("zj-force-canvas"), select = f.find("zj-graph-node-select");
  select.value = f.sourceNotes[5].path; select.dispatch("change"); f.win.step(1);
  pointer(f, "pointerdown", 400, 300, 5); pointer(f, "pointercancel", 400, 300, 5); assert.equal(f.opens.length, 0); assert.equal(canvas.captures.size, 0);
  f.container.bounds = { width: 1000, height: 700, left: 80, top: 60 }; f.observers[0].trigger(); assert.equal(canvas.width, 2000); assert.equal(canvas.height, 1400); f.win.step(16);
  pointer(f, "pointerdown", Number(f.container.dataset.focusedX), Number(f.container.dataset.focusedY), 6); assert.equal(canvas.captures.size, 1);
  const draws = f.stats.draws; f.mounted.destroy(); f.mounted.destroy();
  assert.equal(canvas.captures.size, 0); assert.equal(f.frames.size, 0); assert.equal(f.container.children.length, 0); assert.equal(f.container.dataset.layout, "destroyed");
  assert.ok(f.observers.every(observer => observer.disconnected)); for (const target of [f.doc, f.win, f.media, ...f.elements]) assert.equal(target.listenerCount, 0);
  f.win.step(10000); f.win.dispatch("resize"); f.media.dispatch("change"); f.doc.dispatch("visibilitychange"); assert.equal(f.stats.draws, draws); assert.equal(f.frames.size, 0); assert.equal(f.focus.at(-1)[0], null);
});

test("keyboard picker remains usable without Canvas2D and schedules no idle work", () => {
  const f = fixture({ motion: "off", withCanvas: false, count: 110 }); const select = f.find("zj-graph-node-select"), search = f.find("zj-graph-node-search");
  assert.equal(select.children.length, 81); search.value = "Note 100"; search.dispatch("input"); assert.equal(select.children.length, 2);
  select.value = f.sourceNotes[100].path; select.dispatch("change"); f.find("zj-graph-node-open").dispatch("click"); assert.deepEqual(f.opens, [f.sourceNotes[100].path]);
  f.win.step(1); assert.equal(f.frames.size, 0); f.mounted.destroy();
  const animated = fixture({ withCanvas: false }); completeGrowth(animated); assert.equal(animated.frames.size, 0); animated.mounted.destroy();
});
