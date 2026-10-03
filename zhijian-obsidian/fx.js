(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ZhijianFX = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERTEX = `
    attribute vec2 aPosition;
    varying vec2 vUv;
    void main() { vUv = aPosition * 0.5 + 0.5; gl_Position = vec4(aPosition, 0.0, 1.0); }
  `;
  const FRAGMENT = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    varying vec2 vUv;
    uniform vec2 uResolution;
    uniform vec2 uPointer;
    uniform float uTime;
    uniform float uDark;
    uniform float uMotion;

    float hash(vec2 p) {
      vec3 value = fract(vec3(p.xyx) * 0.1031);
      value += dot(value, value.yzx + 33.33);
      return fract((value.x + value.y) * value.z);
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }
    float fbm(vec2 p) {
      float value = 0.0, weight = 0.53;
      mat2 turn = mat2(0.80, -0.60, 0.60, 0.80);
      for (int octave = 0; octave < 4; octave++) {
        value += weight * noise(p); p = turn * p * 2.04 + 13.7; weight *= 0.5;
      }
      return value;
    }
    void main() {
      float aspect = uResolution.x / max(uResolution.y, 1.0);
      vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
      vec2 mouse = (uPointer - 0.5) * vec2(aspect, 1.0);
      float t = uTime * 0.12;
      vec2 flow = vec2(fbm(p * 1.35 + vec2(t * 0.17, -t * 0.13)),
                       fbm(p * 1.52 + vec2(-t * 0.13, t * 0.15) + 4.9));
      float pointerField = exp(-dot(p - mouse, p - mouse) * 3.0);
      vec2 glass = p + (flow - 0.5) * (0.52 + uMotion * 0.13);
      glass += (mouse - p) * pointerField * 0.025 * uMotion;
      float cloud = fbm(glass * 1.18 + vec2(t * 0.05, -t * 0.07));
      float folded = sin(glass.x * 2.2 - glass.y * 3.4 + cloud * 4.5 + t * 0.38);
      float foldDistance = folded * 2.6;
      float ribbon = exp(-(foldDistance * foldDistance));
      float rippleDistance = (glass.y + sin(glass.x * 2.0 + t * 0.31) * 0.26 - 0.15) * 4.6;
      float ribbon2 = exp(-(rippleDistance * rippleDistance));
      float haze = smoothstep(0.22, 0.79, cloud);
      float highlight = pow(max(0.0, 1.0 - abs(flow.x - flow.y) * 3.0), 7.0);
      vec3 lightBase = mix(vec3(0.89, 0.94, 0.96), vec3(0.98, 0.99, 1.0), vUv.y);
      vec3 darkBase = mix(vec3(0.016, 0.027, 0.065), vec3(0.035, 0.048, 0.108), vUv.y);
      vec3 ice = mix(vec3(0.69, 0.84, 0.89), vec3(0.10, 0.32, 0.41), uDark);
      vec3 violet = mix(vec3(0.81, 0.80, 0.91), vec3(0.18, 0.13, 0.35), uDark);
      vec3 mint = mix(vec3(0.76, 0.89, 0.87), vec3(0.065, 0.34, 0.30), uDark);
      vec3 liquid = mix(ice, violet, smoothstep(0.18, 0.84, flow.x));
      liquid = mix(liquid, mint, haze * 0.50);
      vec3 color = mix(lightBase, darkBase, uDark);
      float light = (ribbon * 0.28 + ribbon2 * 0.31 + haze * 0.12);
      color = mix(color, liquid, light * mix(0.47, 0.62, uDark));
      color += mix(vec3(0.016), vec3(0.010, 0.025, 0.032), uDark) * highlight * ribbon;
      float vignette = smoothstep(0.22, 1.35, length((vUv - 0.5) * vec2(1.0, 0.85)));
      color *= 1.0 - vignette * mix(0.04, 0.22, uDark);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function createGPU(canvas) {
    let gl;
    try { gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false }); }
    catch (_) { return null; }
    if (!gl) return null;
    const shaders = [];
    let program = null, buffer = null;
    try {
      function compile(type, source) {
        const shader = gl.createShader(type);
        if (!shader) throw new Error("Shader allocation failed");
        shaders.push(shader);
        gl.shaderSource(shader, source); gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Shader compilation failed");
        return shader;
      }
      const vertex = compile(gl.VERTEX_SHADER, VERTEX), fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
      program = gl.createProgram();
      if (!program) throw new Error("Program allocation failed");
      gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Program linking failed");
      buffer = gl.createBuffer();
      if (!buffer) throw new Error("Buffer allocation failed");
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const attribute = gl.getAttribLocation(program, "aPosition");
      const uniforms = {};
      for (const name of ["uResolution", "uPointer", "uTime", "uDark", "uMotion"]) uniforms[name] = gl.getUniformLocation(program, name);
      return {
        gl,
        draw(width, height, time, pointer, dark, strength) {
          if (gl.isContextLost()) return;
          gl.viewport(0, 0, width, height); gl.useProgram(program);
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.enableVertexAttribArray(attribute);
          gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
          gl.uniform2f(uniforms.uResolution, width, height);
          gl.uniform2f(uniforms.uPointer, pointer.x, 1 - pointer.y);
          gl.uniform1f(uniforms.uTime, time); gl.uniform1f(uniforms.uDark, dark ? 1 : 0);
          gl.uniform1f(uniforms.uMotion, strength); gl.drawArrays(gl.TRIANGLES, 0, 6);
        },
        destroy(loseContext = false) {
          if (!gl.isContextLost()) {
            gl.deleteBuffer(buffer); gl.deleteProgram(program);
            for (const shader of shaders) gl.deleteShader(shader);
            if (loseContext) gl.getExtension("WEBGL_lose_context")?.loseContext();
          }
        }
      };
    } catch (error) {
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      for (const shader of shaders) gl.deleteShader(shader);
      console.debug("知间：流光使用 CSS 背景", error.message);
      return null;
    }
  }

  function mount(scene, app, options = {}) {
    if (!scene || !app) throw new Error("ZhijianFX needs a scene and an app root");
    const doc = scene.ownerDocument;
    const win = doc.defaultView || window;
    const disposers = [];
    const media = win.matchMedia?.("(prefers-reduced-motion: reduce)");
    const getSettings = typeof options.getSettings === "function" ? options.getSettings : () => ({});
    let destroyed = false, frame = 0, elapsed = 0, lastDraw = 0;
    let width = 0, height = 0, ratio = 1, activeCard = null, pendingPointer = null;
    let configuration = { theme: "light", motion: "full" };
    const pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5, active: false };
    let particles = [], projections = [];
    let seed = 67841;
    function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }

    function canvas(className) {
      const element = doc.createElement("canvas");
      element.className = className;
      element.setAttribute("aria-hidden", "true");
      Object.assign(element.style, { position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none" });
      scene.appendChild(element);
      return element;
    }
    const auroraCanvas = canvas("zj-aurora-canvas");
    const particleCanvas = canvas("zj-particle-canvas");
    let gpu = createGPU(auroraCanvas);
    let context = null;
    try { context = particleCanvas.getContext("2d", { alpha: true }); } catch (_) { /* CSS alone remains available. */ }
    scene.dataset.renderer = gpu ? "webgl" : "css";
    auroraCanvas.style.opacity = gpu ? "1" : "0";

    function listen(target, event, callback, listenerOptions) {
      target.addEventListener(event, callback, listenerOptions);
      disposers.push(() => target.removeEventListener(event, callback, listenerOptions));
    }
    function isStatic() { return configuration.motion === "off" || Boolean(media?.matches); }
    function strength() { return isStatic() ? 0 : configuration.motion === "subtle" ? 0.35 : 1; }
    function resetCard() {
      if (!activeCard) return;
      activeCard.style.removeProperty("--tilt-x"); activeCard.style.removeProperty("--tilt-y");
      activeCard.style.removeProperty("--shine-x"); activeCard.style.removeProperty("--shine-y");
      activeCard.classList.remove("is-tilting"); activeCard = null;
    }
    function stop() { if (frame) win.cancelAnimationFrame(frame); frame = 0; }
    function shouldAnimate() { return !destroyed && !doc.hidden && !isStatic() && width > 0 && height > 0; }
    function schedule() {
      if (!frame && shouldAnimate()) { lastDraw = win.performance.now(); frame = win.requestAnimationFrame(tick); }
    }
    function syncSettings() {
      if (destroyed) return;
      const saved = getSettings() || {};
      const next = { theme: saved.theme === "dark" ? "dark" : "light", motion: ["full", "subtle", "off"].includes(saved.motion) ? saved.motion : "full" };
      const changed = next.theme !== configuration.theme || next.motion !== configuration.motion;
      configuration = next;
      scene.dataset.theme = next.theme; scene.dataset.motion = media?.matches ? "off" : next.motion;
      if (app.dataset.motion !== next.motion) app.dataset.motion = next.motion;
      particleCanvas.style.opacity = next.motion === "off" ? "0" : "1";
      if (isStatic()) { stop(); resetCard(); }
      if (changed || media?.matches) draw();
      schedule();
    }

    function replenish() {
      const full = Math.max(400, Math.min(720, Math.round(width * height / 3400)));
      const count = Math.round(full * (configuration.motion === "subtle" ? 0.58 : 1));
      while (particles.length < count) particles.push({ x: random() * 2.6 - 1.3, y: random() * 2.6 - 1.3, z: random(), phase: random() * Math.PI * 2, speed: 0.45 + random() * 0.55, radius: 0.5 + random() * 0.85, lastX: null, lastY: null });
      if (particles.length > count) particles.length = count;
      projections.length = count;
      if (scene.dataset.particles !== String(count)) scene.dataset.particles = String(count);
    }

    function resize() {
      if (destroyed) return;
      const bounds = scene.getBoundingClientRect();
      const nextWidth = Math.max(0, Math.round(bounds.width || scene.clientWidth || 0));
      const nextHeight = Math.max(0, Math.round(bounds.height || scene.clientHeight || 0));
      const nextRatio = Math.min(1.5, Math.max(1, win.devicePixelRatio || 1));
      if (nextWidth === width && nextHeight === height && nextRatio === ratio) return;
      width = nextWidth; height = nextHeight; ratio = nextRatio;
      // Liquid shapes are deliberately smooth: cap their backing buffer while retaining the actual viewport aspect.
      const auroraRatio = Math.min(ratio, Math.sqrt(1200000 / Math.max(1, width * height)));
      auroraCanvas.width = Math.max(1, Math.round(width * auroraRatio));
      auroraCanvas.height = Math.max(1, Math.round(height * auroraRatio));
      particleCanvas.width = Math.max(1, Math.round(width * ratio));
      particleCanvas.height = Math.max(1, Math.round(height * ratio));
      if (context) context.setTransform(ratio, 0, 0, ratio, 0, 0);
      replenish();
      for (const particle of particles) { particle.lastX = null; particle.lastY = null; }
      draw();
      if (shouldAnimate()) schedule(); else stop();
    }

    function drawParticles(time, amount, dark) {
      if (!context || !width || !height) return;
      context.clearRect(0, 0, width, height);
      if (configuration.motion === "off") return;
      replenish();
      const color = dark ? "149,210,223" : "84,135,163";
      const pointerX = pointer.x * width, pointerY = pointer.y * height;
      for (let index = 0; index < particles.length; index++) {
        const particle = particles[index], depth = 1.15 - particle.z * 0.6;
        const flowX = particle.x + Math.sin(time * 0.105 * particle.speed + particle.phase) * 0.16 * amount;
        const flowY = ((particle.y + time * 0.013 * particle.speed * amount + 1.3) % 2.6) - 1.3;
        let x = width * 0.5 + flowX * width * 0.54 * depth;
        let y = height * 0.5 + flowY * height * 0.54 * depth;
        x += (pointer.x - 0.5) * 18 * depth * amount;
        y += (pointer.y - 0.5) * 12 * depth * amount;
        const dx = pointerX - x, dy = pointerY - y, distance = Math.sqrt(dx * dx + dy * dy);
        if (pointer.active && distance < 200) { const attraction = (1 - distance / 200) * 0.055 * amount * depth; x += dx * attraction; y += dy * attraction; }
        const alpha = (dark ? 0.23 : 0.21) + depth * (dark ? 0.25 : 0.19);
        const radius = particle.radius * depth;
        projections[index] = { x, y, alpha };
        if (x < -30 || x > width + 30 || y < -30 || y > height + 30) { particle.lastX = null; particle.lastY = null; continue; }
        if (particle.lastX !== null && amount && distance < 220 && pointer.active) {
          context.beginPath(); context.moveTo(particle.lastX, particle.lastY); context.lineTo(x, y);
          context.strokeStyle = `rgba(${color},${alpha * 0.32})`; context.lineWidth = 0.55; context.stroke();
        }
        if (index % 23 === 0) {
          const glow = context.createRadialGradient(x, y, 0, x, y, radius * 6.5);
          glow.addColorStop(0, `rgba(${color},${alpha * 0.38})`); glow.addColorStop(1, `rgba(${color},0)`);
          context.fillStyle = glow; context.fillRect(x - radius * 6.5, y - radius * 6.5, radius * 13, radius * 13);
        }
        context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${color},${alpha})`; context.fill();
        particle.lastX = x; particle.lastY = y;
      }
      context.lineWidth = 0.55;
      for (let index = 0; index + 9 < projections.length; index += 13) {
        const from = projections[index], to = projections[index + 9];
        if (!from || !to) continue;
        const distance = Math.hypot(from.x - to.x, from.y - to.y);
        if (distance > 160 || distance < 20) continue;
        context.beginPath(); context.moveTo(from.x, from.y); context.lineTo(to.x, to.y);
        context.strokeStyle = `rgba(${color},${(1 - distance / 160) * (dark ? 0.11 : 0.10)})`; context.stroke();
      }
      for (let line = 0; line < 3; line++) {
        const y = height * (0.21 + line * 0.32), drift = Math.sin(time * 0.11 + line * 2.1) * height * 0.028 * amount;
        context.beginPath(); context.moveTo(-20, y + drift);
        context.bezierCurveTo(width * 0.31, y - height * 0.20, width * 0.65, y + height * 0.22, width + 20, y - drift);
        context.strokeStyle = `rgba(${color},${dark ? 0.065 : 0.075})`; context.lineWidth = 0.65; context.stroke();
      }
    }

    function draw() {
      if (destroyed || !width || !height || doc.hidden) return;
      const amount = strength(), time = isStatic() ? 0 : elapsed;
      const dark = configuration.theme === "dark";
      if (gpu) gpu.draw(auroraCanvas.width, auroraCanvas.height, time, pointer, dark, amount);
      drawParticles(time, amount, dark);
    }
    function tick(now) {
      frame = 0;
      if (!shouldAnimate()) return;
      if (now - lastDraw >= 1000 / 30 - 0.3) {
        elapsed += Math.min(100, now - lastDraw) / 1000 * (configuration.motion === "subtle" ? 0.45 : 1);
        lastDraw = now;
        pointer.x += (pointer.targetX - pointer.x) * 0.08;
        pointer.y += (pointer.targetY - pointer.y) * 0.08;
        updatePointer();
        draw();
      }
      frame = win.requestAnimationFrame(tick);
    }

    function pointerMove(event) {
      if (isStatic() || event.pointerType === "touch") return;
      pendingPointer = { target: event.target, clientX: event.clientX, clientY: event.clientY };
    }
    function updatePointer() {
      if (!pendingPointer) return;
      const event = pendingPointer;
      pendingPointer = null;
      const bounds = scene.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      pointer.targetX = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      pointer.targetY = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      pointer.active = true;
      const card = event.target?.closest?.(".zj-note-card,.zj-stat,.zj-orbit-card");
      if (!card || !app.contains(card)) { resetCard(); return; }
      if (activeCard !== card) { resetCard(); activeCard = card; }
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      const limit = 5 * strength();
      card.style.setProperty("--tilt-x", `${((0.5 - y) * limit * 2).toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${((x - 0.5) * limit * 2).toFixed(2)}deg`);
      card.style.setProperty("--shine-x", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--shine-y", `${(y * 100).toFixed(1)}%`);
      card.classList.add("is-tilting");
    }
    function pointerLeave() { pendingPointer = null; pointer.active = false; pointer.targetX = 0.5; pointer.targetY = 0.5; resetCard(); }
    listen(app, "pointermove", pointerMove, { passive: true });
    listen(app, "pointerleave", pointerLeave, { passive: true });
    listen(app, "pointerout", event => {
      const leaving = event.target?.closest?.(".zj-note-card,.zj-stat,.zj-orbit-card");
      if (leaving && !leaving.contains(event.relatedTarget)) pendingPointer = null;
      if (activeCard && !activeCard.contains(event.relatedTarget)) resetCard();
    }, { passive: true });
    listen(doc, "visibilitychange", () => { if (doc.hidden) { stop(); pointerLeave(); } else { draw(); schedule(); } });
    listen(win, "resize", resize, { passive: true });
    listen(auroraCanvas, "webglcontextlost", event => {
      event.preventDefault(); gpu = null; scene.dataset.renderer = "css"; auroraCanvas.style.opacity = "0";
    });
    listen(auroraCanvas, "webglcontextrestored", () => {
      if (destroyed) return;
      gpu = createGPU(auroraCanvas); scene.dataset.renderer = gpu ? "webgl" : "css"; auroraCanvas.style.opacity = gpu ? "1" : "0";
      draw(); schedule();
    });
    if (media?.addEventListener) listen(media, "change", syncSettings);
    else if (media?.addListener) { media.addListener(syncSettings); disposers.push(() => media.removeListener(syncSettings)); }
    let resizeObserver = null, mutationObserver = null;
    if (win.ResizeObserver) { resizeObserver = new win.ResizeObserver(resize); resizeObserver.observe(scene); }
    if (win.MutationObserver) {
      mutationObserver = new win.MutationObserver(() => { if (activeCard && !activeCard.isConnected) resetCard(); syncSettings(); });
      mutationObserver.observe(app, { childList: true, attributes: true, attributeFilter: ["data-theme", "data-motion"] });
    }
    syncSettings(); resize();

    return {
      destroy() {
        if (destroyed) return;
        destroyed = true; stop(); resetCard();
        resizeObserver?.disconnect(); mutationObserver?.disconnect();
        for (const dispose of disposers) dispose();
        gpu?.destroy(true); gpu = null;
        particles = []; projections = [];
        auroraCanvas.remove(); particleCanvas.remove();
        delete scene.dataset.renderer;
        delete scene.dataset.particles;
      }
    };
  }

  return { mount };
});
