// Regression fixtures use in-memory Obsidian/browser mocks; they do not verify a real Obsidian app load.
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { createSimulation } = require('../graph');

function graph(count, edges = []) {
  return { nodes: Array.from({ length: count }, (_, i) => ({ path: i + '.md', title: 'Node ' + i, radius: 6 })), edges };
}

function finish(simulation) {
  for (let i = 0; i < 400 && !simulation.settled; i++) simulation.step();
  assert.equal(simulation.settled, true, 'settles within 400 steps');
  assert.equal(simulation.alpha, 0);
}

function finiteNodes(nodes) {
  for (const node of nodes) for (const key of ['x', 'y', 'vx', 'vy']) assert.ok(Number.isFinite(node[key]), key + ' is finite');
}

test('phyllotaxis and resulting layout are deterministic, centred, and finite', () => {
  const a = graph(50);
  const b = graph(50);
  const sa = createSimulation(a);
  const sb = createSimulation(b);
  assert.deepEqual(a, b);
  assert.ok(Math.abs(a.nodes.reduce((sum, node) => sum + node.x, 0)) < 1e-8);
  finish(sa);
  finish(sb);
  assert.deepEqual(a, b);
  assert.ok(a.nodes.some(node => Math.hypot(node.x, node.y) > 50), 'isolates retain useful separation');
  finiteNodes(a.nodes);
  const positions = a.nodes.map(node => [node.x, node.y]);
  const frame = sa.frame;
  assert.deepEqual(sa.step(), { alpha: 0, settled: true, frame });
  assert.deepEqual(a.nodes.map(node => [node.x, node.y]), positions);
});

test('springs shorten edges relative to the same unconnected nodes', () => {
  const linked = graph(2, [{ source: 0, target: 1 }]);
  const isolated = graph(2);
  linked.nodes[0].x = isolated.nodes[0].x = -180;
  linked.nodes[1].x = isolated.nodes[1].x = 180;
  linked.nodes[0].y = linked.nodes[1].y = isolated.nodes[0].y = isolated.nodes[1].y = 0;
  finish(createSimulation(linked));
  finish(createSimulation(isolated));
  const distance = g => Math.hypot(g.nodes[1].x - g.nodes[0].x, g.nodes[1].y - g.nodes[0].y);
  assert.ok(distance(linked) < distance(isolated) * 0.8);
  assert.ok(distance(linked) > 15, 'linked nodes keep collision clearance');
});

test('dragging follows fixed axes even after settling and release settles again', () => {
  const g = graph(20, Array.from({ length: 19 }, (_, i) => ({ source: 0, target: i + 1 })));
  const simulation = createSimulation(g);
  finish(simulation);
  g.nodes[0].fx = 130;
  g.nodes[0].fy = -90;
  assert.equal(simulation.step().settled, false);
  assert.equal(g.nodes[0].x, 130);
  assert.equal(g.nodes[0].y, -90);
  for (let i = 0; i < 25; i++) {
    g.nodes[0].fx += 2;
    g.nodes[0].fy -= 1;
    simulation.step();
    assert.equal(g.nodes[0].x, g.nodes[0].fx);
    assert.equal(g.nodes[0].y, g.nodes[0].fy);
    assert.equal(g.nodes[0].vx, 0);
    assert.equal(g.nodes[0].vy, 0);
  }
  delete g.nodes[0].fx;
  delete g.nodes[0].fy;
  finish(simulation);
  finiteNodes(g.nodes);
});

test('resize and reheating preserve current coordinates and restart cooling', () => {
  const g = graph(40);
  const simulation = createSimulation(g);
  finish(simulation);
  const positions = g.nodes.map(node => [node.x, node.y]);
  assert.equal(simulation.resize(1200, 900), simulation);
  assert.deepEqual(g.nodes.map(node => [node.x, node.y]), positions);
  assert.equal(simulation.settled, false);
  finish(simulation);
  const frame = simulation.frame;
  simulation.reheat(0.6);
  assert.equal(simulation.alpha, 0.6);
  finish(simulation);
  assert.ok(simulation.frame - frame < 400);
});

test('coincident points and invalid coordinates recover without NaN', () => {
  const g = graph(120);
  for (const node of g.nodes) Object.assign(node, { x: 0, y: 0, vx: 0, vy: 0 });
  Object.assign(g.nodes[0], { x: NaN, y: Infinity, vx: Infinity, vy: NaN, radius: NaN });
  g.edges = [{ source: -1, target: 0 }, { source: 0, target: 500 }, { source: 0, target: 0 }];
  const simulation = createSimulation(g);
  finish(simulation);
  finiteNodes(g.nodes);
  const occupied = new Set(g.nodes.map(node => Math.round(node.x) + ',' + Math.round(node.y)));
  assert.equal(occupied.size, g.nodes.length);
});

test('1000-node sparse and fully coincident graphs run bounded work and settle', t => {
  for (const coincident of [false, true]) {
    const g = graph(1000, Array.from({ length: 999 }, (_, i) => ({ source: Math.floor(i / 3), target: i + 1 })));
    if (coincident) for (const node of g.nodes) Object.assign(node, { x: 0, y: 0 });
    const simulation = createSimulation(g);
    const started = performance.now();
    finish(simulation);
    const duration = performance.now() - started;
    finiteNodes(g.nodes);
    t.diagnostic(`${coincident ? 'coincident' : 'phyllotaxis'}: ${simulation.frame} steps, ${duration.toFixed(0)} ms`);
    assert.ok(duration < 15000, '1000 nodes complete without an all-pairs bottleneck');
  }
});

test('empty and single-node graphs are stable', () => {
  const empty = createSimulation(graph(0));
  assert.deepEqual(empty.step(), { alpha: 0, settled: true, frame: 0 });
  empty.reheat().resize(0, NaN);
  assert.equal(empty.settled, true);
  const single = graph(1);
  finish(createSimulation(single));
  assert.equal(single.nodes[0].x, 0);
  assert.equal(single.nodes[0].y, 0);
});
