// Regression fixtures use in-memory Obsidian/browser mocks; they do not verify a real Obsidian app load.
"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const { performance } = require("node:perf_hooks");
const { createFluidLayout } = require("../fluid");
function graph(count) { return { nodes: Array.from({ length: count }, (_, i) => ({ path: String(i), radius: 4 })), edges: Array.from({ length: Math.max(0, count - 1) }, (_, i) => ({ source: i, target: i + 1 })) }; }
function run(layout, count) { for (let i = 0; i < count; i++) layout.step(1 / 60); }
function finite(model, layout) { for (const i of layout.alive) for (const key of ["x", "y", "vx", "vy"]) assert.ok(Number.isFinite(model.nodes[i][key]), `${i}.${key}`); }
function finish(layout) { for (let i = 0; i < 620 && !layout.settled; i++) layout.step(1 / 60); assert.equal(layout.settled, true); }

test("nodes are added at the shared seed with deterministic jitter without resetting older nodes", () => {
  const a = graph(10), b = graph(10), fa = createFluidLayout(a, { seed: { x: 10, y: 20 } }), fb = createFluidLayout(b, { seed: { x: 10, y: 20 } });
  assert.equal(fa.born, 0); assert.equal(fa.settled, true);
  assert.equal(fa.add(3), a.nodes[3]); fb.add(3); assert.deepEqual(a.nodes[3], b.nodes[3]);
  assert.ok(Math.hypot(a.nodes[3].x - 10, a.nodes[3].y - 20) < 0.1);
  run(fa, 20); const position = [a.nodes[3].x, a.nodes[3].y];
  fa.add(5); assert.deepEqual([a.nodes[3].x, a.nodes[3].y], position);
  assert.equal(fa.add(5), a.nodes[5]); assert.equal(fa.born, 2); assert.deepEqual([...fa.alive], [3, 5]);
  assert.equal(fa.add(-1), null); assert.equal(fa.add(1000), null);
});

test("a new centre-born node causally pushes an already settled node with retained inertia", () => {
  const model = graph(2), layout = createFluidLayout(model);
  layout.add(0); finish(layout);
  const before = { x: model.nodes[0].x, y: model.nodes[0].y };
  layout.add(1); assert.equal(layout.settled, false);
  layout.step(1 / 60);
  const firstMove = Math.hypot(model.nodes[0].x - before.x, model.nodes[0].y - before.y);
  assert.ok(firstMove > 0 && firstMove < 0.5, "first displacement uses light acceleration");
  run(layout, 12);
  assert.ok(Math.hypot(model.nodes[0].x - before.x, model.nodes[0].y - before.y) > 3, "older nodes really move in response to the new node");
  assert.ok(Math.hypot(model.nodes[0].vx, model.nodes[0].vy) > 0.1);
  finish(layout); finite(model, layout);
  assert.ok(Math.hypot(model.nodes[0].x - model.nodes[1].x, model.nodes[0].y - model.nodes[1].y) > 10);
});

test("fixed axes follow drag values including zero, then release settles without accumulated velocity", () => {
  const model = graph(20), layout = createFluidLayout(model);
  for (let i = 0; i < 10; i++) layout.add(i);
  for (let i = 0; i < 60; i++) {
    model.nodes[0].fx = i; model.nodes[0].fy = 0; layout.step(1 / 30);
    assert.equal(model.nodes[0].x, i); assert.equal(model.nodes[0].y, 0); assert.equal(model.nodes[0].vx, 0); assert.equal(model.nodes[0].vy, 0);
    if (i === 20) layout.add(12);
  }
  delete model.nodes[0].fx; delete model.nodes[0].fy;
  finish(layout); finite(model, layout);
});

test("stationary fixed points settle and fixed-axis forces leave the free-axis budget intact", () => {
  function sample(x) { const model = graph(1), layout = createFluidLayout(model); Object.assign(model.nodes[0], { x, y: 100, vx: 0, vy: 0, fx: x }); layout.adopt(0); layout.step(); return { model, layout }; }
  const near = sample(0), far = sample(1e7);
  assert.ok(Math.abs(near.model.nodes[0].y - far.model.nodes[0].y) < 1e-9, "fixed x acceleration does not suppress free y motion");
  finish(near.layout); assert.equal(near.model.nodes[0].x, 0);
  near.model.nodes[0].fx = 40; near.layout.step(0); assert.equal(near.model.nodes[0].x, 40); assert.equal(near.layout.settled, false);
  finish(near.layout); assert.equal(near.layout.settled, true);
});

test("time steps are bounded and refresh rates preserve comparable water motion", () => {
  function sample(dt, count) { const model = graph(8), layout = createFluidLayout(model); for (let i = 0; i < 8; i++) layout.add(i); for (let i = 0; i < count; i++) layout.step(dt); return model.nodes; }
  const a = sample(1 / 60, 120), b = sample(1 / 30, 60), c = sample(1 / 120, 240);
  for (let i = 0; i < a.length; i++) { assert.ok(Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y) < 0.01); assert.ok(Math.hypot(a[i].x - c[i].x, a[i].y - c[i].y) < 12); }
  const model = graph(8), layout = createFluidLayout(model); for (let i = 0; i < 8; i++) layout.add(i);
  const before = model.nodes.map(node => [node.x, node.y]); layout.step(30);
  for (let i = 0; i < 8; i++) assert.ok(Math.hypot(model.nodes[i].x - before[i][0], model.nodes[i].y - before[i][1]) < 7);
  finite(model, layout);
});

test("resize and seed updates preserve old coordinates and change only subsequent births", () => {
  const model = graph(3), layout = createFluidLayout(model); layout.add(0); run(layout, 20);
  const position = [model.nodes[0].x, model.nodes[0].y]; layout.resize(1200, 800); layout.setSeed({ x: 40, y: 50 });
  assert.deepEqual([model.nodes[0].x, model.nodes[0].y], position);
  layout.add(1); assert.ok(Math.hypot(model.nodes[1].x - 40, model.nodes[1].y - 50) < 0.1);
  finish(layout); layout.reheat(); assert.equal(layout.settled, false); finish(layout);
});

test("adopting a static layout preserves shared coordinates and momentum without a centre birth", () => {
  const model = graph(3), layout = createFluidLayout(model);
  Object.assign(model.nodes[0], { x: 100, y: -30, vx: 0.2, vy: -0.1 });
  const snapshot = { ...model.nodes[0] };
  assert.equal(layout.add(0, { preservePosition: true }), model.nodes[0]); assert.deepEqual(model.nodes[0], snapshot);
  Object.assign(model.nodes[2], { x: -150, y: 70, vx: 0.4, vy: 0.3 });
  const adopted = { ...model.nodes[2] }; layout.adopt(2); assert.deepEqual(model.nodes[2], adopted);
  assert.deepEqual([...layout.alive], [0, 2]); layout.step(); finite(model, layout);
});

test("1000 densely born nodes avoid NaN and all-pairs work, separate and cool", t => {
  const model = graph(1000), layout = createFluidLayout(model), started = performance.now();
  for (let i = 0; i < 1000; i++) layout.add(i);
  run(layout, 100); finite(model, layout);
  assert.equal(layout.born, 1000);
  const occupied = new Set(model.nodes.map(node => Math.round(node.x) + "," + Math.round(node.y)));
  assert.ok(occupied.size > 900, "dense newborns spread into distinct positions");
  finish(layout); finite(model, layout);
  t.diagnostic(`1000 nodes: ${layout.frame} frames, ${(performance.now() - started).toFixed(0)} ms`);
});

test("invalid coordinates recover, duplicate centres separate, and empty layouts remain idle", () => {
  const empty = createFluidLayout(graph(0)); assert.equal(empty.step().frame, 0); assert.equal(empty.born, 0);
  const model = graph(30), layout = createFluidLayout(model);
  for (let i = 0; i < 30; i++) { layout.add(i); model.nodes[i].x = model.nodes[i].y = 0; }
  Object.assign(model.nodes[0], { x: NaN, y: Infinity, vx: NaN, vy: Infinity });
  run(layout, 60); finite(model, layout); finish(layout);
  assert.equal(new Set(model.nodes.map(node => Math.round(node.x) + "," + Math.round(node.y))).size, 30);
});
