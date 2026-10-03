// Regression fixtures use in-memory Obsidian/browser mocks; they do not verify a real Obsidian app load.
'use strict';
const assert = require('node:assert/strict');
const Carousel = require('../carousel');
class Target {
  constructor() { this.events = new Map(); this.dataset = {}; this.attributes = {}; }
  addEventListener(name, fn) { this.events.set(name, [...this.events.get(name) || [], fn]); }
  removeEventListener(name, fn) { this.events.set(name, (this.events.get(name) || []).filter(item => item !== fn)); }
  emit(name, event = {}) { for (const fn of this.events.get(name) || []) fn(event); }
  setAttribute(name, value) { this.attributes[name] = value; }
  get count() { return [...this.events.values()].reduce((sum, list) => sum + list.length, 0); }
}
function fixture({ motion = 'full', reduced = false, count = 3 } = {}) {
  const doc = new Target(), win = new Target(), hero = new Target(), stage = new Target(), media = new Target();
  const caption = new Target(), toggle = new Target();
  const cards = Array.from({length: count}, (_, i) => Object.assign(new Target(), { dataset: { path: `note-${i}.md` } }));
  const dots = cards.map((_, i) => Object.assign(new Target(), { dataset: { carouselGo: String(i) } }));
  const buttons = [-1, 1].map(step => Object.assign(new Target(), { dataset: { carouselStep: String(step) } }));
  doc.defaultView = win; doc.hidden = false; hero.ownerDocument = doc; media.matches = reduced;
  hero.querySelector = selector => ({ '.zj-orbit-carousel': stage, '.zj-carousel-caption': caption, '.zj-carousel-toggle': toggle })[selector];
  hero.querySelectorAll = selector => ({ '[data-carousel-item]': cards, '[data-carousel-go]': dots, '[data-carousel-step]': buttons })[selector];
  hero.contains = target => [stage, caption, toggle, ...cards, ...dots, ...buttons].includes(target);
  const timers = new Map(); let time = 0, next = 0;
  win.setTimeout = (fn, duration) => { timers.set(++next, { fn, due: time + duration }); return next; };
  win.clearTimeout = id => timers.delete(id); win.matchMedia = () => media;
  win.step = milliseconds => {
    time += milliseconds;
    for (const [id, item] of [...timers]) if (item.due <= time) { timers.delete(id); item.fn(); }
  };
  const settings = { motion }, changed = [];
  const mounted = Carousel.mount(hero, { getSettings: () => settings, onChange: path => changed.push(path) });
  return { doc, win, hero, stage, media, caption, toggle, cards, dots, buttons, timers, settings, changed, mounted };
}
{
  const f = fixture();
  assert.deepEqual(f.cards.map(card => card.dataset.orbitIndex), ['0', '1', '2']);
  f.win.step(3499); assert.equal(f.stage.dataset.activeIndex, '0');
  f.win.step(1); assert.equal(f.stage.dataset.activeIndex, '1');
  assert.deepEqual(f.cards.map(card => card.dataset.orbitIndex), ['2', '0', '1']);
  assert.equal(f.caption.textContent, '02 / 03'); assert.equal(f.dots[1].attributes['aria-current'], 'true');
  assert.equal(f.changed.at(-1), 'note-1.md');
  f.hero.emit('pointerenter', { pointerType: 'mouse' }); assert.equal(f.timers.size, 0);
  f.win.step(7000); assert.equal(f.stage.dataset.activeIndex, '1');
  f.hero.emit('pointerleave'); f.win.step(3500); assert.equal(f.stage.dataset.activeIndex, '2');
  f.hero.emit('focusin'); assert.equal(f.timers.size, 0);
  f.hero.emit('focusout', { relatedTarget: f.cards[0] }); assert.equal(f.timers.size, 0, '内部焦点移动继续暂停');
  f.hero.emit('focusout', { relatedTarget: null }); assert.equal(f.timers.size, 1);
  f.doc.hidden = true; f.doc.emit('visibilitychange'); assert.equal(f.timers.size, 0);
  f.win.step(60000); f.doc.hidden = false; f.doc.emit('visibilitychange');
  f.win.step(3499); assert.equal(f.stage.dataset.activeIndex, '2');
  f.win.step(1); assert.equal(f.stage.dataset.activeIndex, '0');
  f.toggle.emit('click'); assert.equal(f.timers.size, 0); assert.equal(f.toggle.attributes['aria-pressed'], 'true');
  f.buttons[1].emit('click'); assert.equal(f.stage.dataset.activeIndex, '1', '暂停时仍能手动轮换');
  f.dots[0].emit('click'); assert.equal(f.stage.dataset.activeIndex, '0');
  f.stage.emit('keydown', { key: 'ArrowLeft', preventDefault() {} }); assert.equal(f.stage.dataset.activeIndex, '2');
  f.toggle.emit('click'); assert.equal(f.timers.size, 1);
  f.media.matches = true; f.media.emit('change'); assert.equal(f.timers.size, 0);
  f.media.matches = false; f.media.emit('change'); assert.equal(f.timers.size, 1);
  f.settings.motion = 'off'; f.mounted.updateStyle(); assert.equal(f.timers.size, 0);
  f.settings.motion = 'full'; f.mounted.updateStyle(); assert.equal(f.timers.size, 1);
  f.mounted.destroy(); f.mounted.destroy(); assert.equal(f.timers.size, 0);
  for (const target of [f.hero, f.stage, f.doc, f.media, f.toggle, ...f.dots, ...f.buttons]) assert.equal(target.count, 0);
}
for (const options of [{motion:'off'}, {reduced:true}, {count:1}]) {
  const f = fixture(options); assert.equal(f.timers.size, 0); f.win.step(35000); assert.equal(f.stage.dataset.activeIndex, '0'); f.mounted.destroy();
}
console.log('PASS: carousel timing, 3D slot rotation, title callback, hover/focus/background pause, keyboard/manual controls, reduced/off, and timer/listener disposal.');
