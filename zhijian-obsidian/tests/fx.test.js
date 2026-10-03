// Regression fixtures use in-memory Obsidian/browser mocks; they do not verify a real Obsidian app load.
"use strict";
const assert = require("node:assert/strict");
const FX = require("../fx");

class Target {
  constructor() { this.listeners = new Map(); }
  addEventListener(event, handler) { const entries = this.listeners.get(event) || []; entries.push(handler); this.listeners.set(event, entries); }
  removeEventListener(event, handler) { this.listeners.set(event, (this.listeners.get(event) || []).filter(entry => entry !== handler)); }
  dispatch(event, data = {}) { for (const handler of [...(this.listeners.get(event) || [])]) handler(data); }
  get listenerCount() { return [...this.listeners.values()].reduce((sum, handlers) => sum + handlers.length, 0); }
}
class Element extends Target {
  constructor(doc, className = "") {
    super(); this.ownerDocument = doc; this.className = className; this.children = []; this.dataset = {};
    this.values = {}; this.style = { setProperty: (key, value) => { this.values[key] = value; }, removeProperty: key => { delete this.values[key]; } };
    const classes = new Set(className.split(" "));
    this.classList = { add: key => classes.add(key), remove: key => classes.delete(key), contains: key => classes.has(key) };
    this.bounds = { width: 420, height: 640, left: 80, top: 60 }; this.isConnected = true;
  }
  setAttribute() {}
  appendChild(element) { this.children.push(element); element.parentElement = this; }
  remove() { this.parentElement.children = this.parentElement.children.filter(child => child !== this); this.parentElement = null; this.isConnected = false; }
  contains(element) { for (let current = element; current; current = current.parentElement) if (current === this) return true; return false; }
  getBoundingClientRect() { return this.bounds; }
  closest(selector) { return selector.includes(this.className) ? this : this.parentElement?.closest(selector) || null; }
}

function fixture(withGPU = true) {
  const doc = new Target(), win = new Target(), media = new Target();
  doc.defaultView = win; doc.hidden = false; media.matches = false;
  win.devicePixelRatio = 2; win.performance = { now: () => time }; win.matchMedia = () => media;
  let time = 0, id = 0;
  const frames = new Map(), observers = [];
  win.requestAnimationFrame = callback => { frames.set(++id, callback); return id; };
  win.cancelAnimationFrame = frame => frames.delete(frame);
  win.step = milliseconds => { time += milliseconds; const scheduled = [...frames]; frames.clear(); for (const [, callback] of scheduled) callback(time); };
  class Observer {
    constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
    trigger() { this.callback(); }
  }
  win.ResizeObserver = Observer; win.MutationObserver = Observer;
  const stats = { draws: 0, particles: 0, buffersDeleted: 0, programsDeleted: 0, shadersDeleted: 0, contextsLost: 0, lastUniforms: {} };
  const gl = {
    VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4, ARRAY_BUFFER: 5, STATIC_DRAW: 6, FLOAT: 7, TRIANGLES: 8,
    createShader: type => ({ type }), shaderSource() {}, compileShader() {}, getShaderParameter: () => true, getShaderInfoLog: () => "",
    createProgram: () => ({}), attachShader() {}, linkProgram() {}, getProgramParameter: () => true, getProgramInfoLog: () => "",
    createBuffer: () => ({}), bindBuffer() {}, bufferData() {}, getAttribLocation: () => 0, getUniformLocation: (_, name) => name,
    isContextLost: () => false, viewport() {}, useProgram() {}, enableVertexAttribArray() {}, vertexAttribPointer() {},
    uniform2f(name, x, y) { stats.lastUniforms[name] = [x, y]; }, uniform1f(name, value) { stats.lastUniforms[name] = value; },
    drawArrays() { stats.draws++; }, deleteBuffer() { stats.buffersDeleted++; }, deleteProgram() { stats.programsDeleted++; }, deleteShader() { stats.shadersDeleted++; },
    getExtension: () => ({ loseContext() { stats.contextsLost++; } })
  };
  const context = {
    setTransform() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fillRect() {}, bezierCurveTo() {}, fill() {},
    arc() { stats.particles++; }, createRadialGradient: () => ({ addColorStop() {} })
  };
  doc.createElement = () => { const element = new Element(doc); element.getContext = kind => kind === "webgl" ? withGPU ? gl : null : context; return element; };
  const scene = new Element(doc), app = new Element(doc), card = new Element(doc, "zj-note-card");
  card.bounds = { width: 200, height: 160, left: 120, top: 160 }; app.appendChild(card);
  const settings = { theme: "dark", motion: "full" };
  const mounted = FX.mount(scene, app, { getSettings: () => settings });
  return { mounted, doc, win, media, scene, app, card, settings, frames, observers, stats };
}

{
  const f = fixture();
  assert.equal(f.scene.dataset.renderer, "webgl");
  assert.equal(f.scene.children.length, 2);
  assert.equal(f.scene.children[0].width, 630, "DPR 上限为 1.5，canvas 使用 native 容器尺寸");
  assert.equal(f.scene.children[0].height, 960);
  assert.ok(f.stats.particles >= 200, "完整模式在视口内绘制数百粒子");
  const firstDraw = f.stats.draws;
  f.win.step(16); assert.equal(f.stats.draws, firstDraw);
  f.win.step(18); assert.equal(f.stats.draws, firstDraw + 1);
  f.app.dispatch("pointermove", { pointerType: "mouse", clientX: 300, clientY: 180, target: f.card });
  f.win.step(34);
  assert.equal(f.card.classList.contains("is-tilting"), true);
  assert.match(f.card.values["--tilt-x"], /deg$/);
  assert.ok(Math.abs(parseFloat(f.card.values["--tilt-y"])) <= 5);
  assert.match(f.card.values["--shine-x"], /%$/);
  f.app.dispatch("pointerleave");
  assert.equal(f.card.classList.contains("is-tilting"), false);
  assert.equal(f.card.values["--tilt-x"], undefined);
  f.doc.hidden = true; f.doc.dispatch("visibilitychange");
  assert.equal(f.frames.size, 0, "后台文档应完全停止 RAF");
  f.doc.hidden = false; f.doc.dispatch("visibilitychange");
  assert.equal(f.frames.size, 1, "重新可见时恢复 RAF");
  f.settings.motion = "off"; f.observers[1].trigger();
  assert.equal(f.frames.size, 0);
  assert.equal(f.app.dataset.motion, "off");
  assert.equal(f.scene.children[1].style.opacity, "0");
  f.settings.motion = "subtle"; f.observers[1].trigger();
  assert.equal(f.frames.size, 1);
  f.media.matches = true; f.media.dispatch("change");
  assert.equal(f.frames.size, 0, "减少动效偏好优先于用户 full/subtle 设置");
  assert.equal(f.stats.lastUniforms.uMotion, 0);
  f.media.matches = false; f.media.dispatch("change");
  assert.equal(f.frames.size, 1);
  f.scene.bounds.width = 800; f.observers[0].trigger();
  assert.equal(f.scene.children[0].width, 1200);
  f.scene.bounds = { width: 1920, height: 1080, left: 0, top: 0 }; f.observers[0].trigger();
  assert.ok(f.scene.children[0].width * f.scene.children[0].height <= 1203000, "大屏极光缓冲约 1.2M 像素上限");
  assert.equal(f.scene.children[1].width, 2880, "大屏粒子保持 1.5 DPR 清晰度");
  f.settings.theme = "light"; f.observers[1].trigger();
  assert.equal(f.stats.lastUniforms.uDark, 0);
  const canvases = [...f.scene.children];
  f.mounted.destroy(); f.mounted.destroy();
  assert.equal(f.frames.size, 0);
  assert.equal(f.scene.children.length, 0);
  assert.ok(f.observers.every(observer => observer.disconnected));
  assert.equal(f.stats.buffersDeleted, 1);
  assert.equal(f.stats.programsDeleted, 1);
  assert.equal(f.stats.shadersDeleted, 2);
  assert.equal(f.stats.contextsLost, 1);
  for (const target of [f.app, f.doc, f.win, f.media, ...canvases]) assert.equal(target.listenerCount, 0, "销毁后移除全部事件监听");
}
{
  const f = fixture(false);
  assert.equal(f.scene.dataset.renderer, "css");
  assert.ok(f.stats.particles >= 200, "WebGL 缺失时仍绘制 Canvas2D 粒子");
  assert.equal(f.frames.size, 1);
  f.mounted.destroy();
}
console.log("PASS: FX viewport/DPR, shader uniforms, hundreds of particles, 30fps pacing, delegated card tilt, visibility/reduced/off lifecycle, fallback, and full disposal.");
