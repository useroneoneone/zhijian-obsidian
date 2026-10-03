/* Three-dimensional note carousel. Local timers only; no external dependencies. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ZhijianCarousel = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function mount(hero, options = {}) {
    const doc = hero.ownerDocument, win = doc.defaultView;
    const stage = hero.querySelector('.zj-orbit-carousel');
    const cards = [...hero.querySelectorAll('[data-carousel-item]')];
    const dots = [...hero.querySelectorAll('[data-carousel-go]')];
    const caption = hero.querySelector('.zj-carousel-caption');
    const toggle = hero.querySelector('.zj-carousel-toggle');
    const media = win.matchMedia?.('(prefers-reduced-motion: reduce)');
    const disposers = [];
    const interval = 3500;
    let active = 0, timer = null, destroyed = false, hovering = false, focusing = false, paused = false;
    function listen(target, name, callback) {
      target.addEventListener(name, callback);
      disposers.push(() => target.removeEventListener(name, callback));
    }
    function clear() { if (timer !== null) win.clearTimeout(timer); timer = null; }
    function canRotate() {
      const settings = options.getSettings?.() || {};
      return !destroyed && cards.length > 1 && !doc.hidden && !media?.matches && settings.motion !== 'off' && !hovering && !focusing && !paused;
    }
    function schedule() {
      clear();
      const rotating = canRotate();
      stage.dataset.autoplay = String(rotating);
      if (rotating) timer = win.setTimeout(() => { timer = null; go(active + 1); }, interval);
    }
    function go(index) {
      if (destroyed || !cards.length) return;
      active = ((index % cards.length) + cards.length) % cards.length;
      cards.forEach((card, item) => {
        card.dataset.orbitIndex = String((item - active + cards.length) % cards.length);
        card.dataset.active = String(item === active);
      });
      dots.forEach((dot, item) => dot.setAttribute('aria-current', item === active ? 'true' : 'false'));
      if (caption) caption.textContent = `${String(active + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
      stage.dataset.activeIndex = String(active);
      options.onChange?.(cards[active].dataset.path);
      schedule();
    }
    listen(hero, 'pointerenter', event => { if (event.pointerType !== 'touch') { hovering = true; schedule(); } });
    listen(hero, 'pointerleave', () => { hovering = false; schedule(); });
    listen(hero, 'focusin', () => { focusing = true; schedule(); });
    listen(hero, 'focusout', event => { focusing = hero.contains(event.relatedTarget); schedule(); });
    listen(stage, 'keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault(); go(active + (event.key === 'ArrowRight' ? 1 : -1));
    });
    for (const button of hero.querySelectorAll('[data-carousel-step]')) listen(button, 'click', () => go(active + Number(button.dataset.carouselStep)));
    for (const button of dots) listen(button, 'click', () => go(Number(button.dataset.carouselGo)));
    if (toggle) listen(toggle, 'click', () => {
      paused = !paused;
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? '继续自动轮换' : '暂停自动轮换');
      toggle.textContent = paused ? '▷' : 'Ⅱ';
      schedule();
    });
    listen(doc, 'visibilitychange', schedule);
    if (media?.addEventListener) listen(media, 'change', schedule);
    stage.dataset.interval = String(interval);
    go(0);
    return {
      go,
      updateStyle: schedule,
      destroy() { if (destroyed) return; destroyed = true; clear(); for (const dispose of disposers) dispose(); stage.dataset.autoplay = 'false'; }
    };
  }
  return { mount };
});
