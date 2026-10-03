/* 知间 · Knowledge Studio — generated bundle. Sources: src/plugin.js, core.js, ui.js, fx.js, graph.js, fluid.js, carousel.js, icons.js. */
/*
Bundled Phosphor Icons, regular subset.
MIT License

Copyright (c) 2023 Phosphor Icons

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// core.js
var require_core = __commonJS({
  "core.js"(exports2, module2) {
    (function(root, factory) {
      if (typeof module2 === "object" && module2.exports) module2.exports = factory();
      else root.ZhijianCore = factory();
    })(typeof globalThis !== "undefined" ? globalThis : exports2, function() {
      "use strict";
      const READING = ["\u672A\u8BFB", "\u5728\u8BFB", "\u5DF2\u8BFB"];
      const ABSORPTION = ["\u5F85\u6C89\u6DC0", "\u5DF2\u6C89\u6DC0", "\u65E0\u9700\u6C89\u6DC0"];
      const DEFAULTS = { displayName: "Y", theme: "dark", motion: "full", excludedPaths: ["04-\u8F85\u52A9/\u79C1\u5BC6"], bookmarks: [] };
      const ROUTES = [
        { category: "\u9879\u76EE", folder: "01-\u9879\u76EE", type: "project" },
        { category: "\u8D44\u4EA7", folder: "02-\u8D44\u4EA7", type: "asset" },
        { category: "\u8D44\u6E90", folder: "03-\u8D44\u6E90", type: "resource" },
        { category: "\u8F85\u52A9", folder: "04-\u8F85\u52A9", type: "support" },
        { category: "\u7075\u611F", folder: "05-\u7075\u611F", type: "idea" },
        { category: "Skills", folder: "06-Skills", type: "skill" }
      ];
      const SYSTEM_FILES = /* @__PURE__ */ new Set(["readme.md", "agents.md", "claude.md", "index.md", "log.md"]);
      function localDate(value = /* @__PURE__ */ new Date()) {
        const date = value instanceof Date ? value : new Date(value);
        if (!Number.isFinite(date.valueOf())) return "";
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      }
      function dateKey(value) {
        if (typeof value === "string") {
          const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/);
          if (match) {
            const parsed2 = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
            return parsed2.getFullYear() === Number(match[1]) && parsed2.getMonth() + 1 === Number(match[2]) && parsed2.getDate() === Number(match[3]) ? match[0].slice(0, 10) : "";
          }
        }
        if (value === void 0 || value === null || value === "") return "";
        const parsed = new Date(typeof value === "number" && value < 1e11 ? value * 1e3 : value);
        return Number.isFinite(parsed.valueOf()) ? localDate(parsed) : "";
      }
      function timestamp(value, fallback = 0) {
        const key = dateKey(value);
        if (key) return (/* @__PURE__ */ new Date(`${key}T12:00:00`)).valueOf();
        return Number.isFinite(Number(fallback)) ? Number(fallback) : 0;
      }
      function normalizePath(value, allowEmpty = false) {
        if (typeof value !== "string") throw new Error("\u8BF7\u8F93\u5165\u77E5\u8BC6\u5E93\u5185\u7684\u76F8\u5BF9\u8DEF\u5F84\u3002");
        const path = value.replace(/\\/g, "/").replace(/\/{2,}/g, "/").replace(/\/$/, "").trim();
        if (!path && allowEmpty) return "";
        if (!path || path.startsWith("/") || /^[A-Za-z]:/.test(path) || /[\u0000-\u001f]/.test(path) || path.split("/").some((part) => !part || part === "." || part === "..")) {
          throw new Error("\u8DEF\u5F84\u987B\u4F4D\u4E8E\u5F53\u524D\u77E5\u8BC6\u5E93\u5185\u3002");
        }
        return path;
      }
      function inPath(path, prefix) {
        const current = String(path).replace(/\\/g, "/").toLowerCase();
        const root = String(prefix).replace(/\\/g, "/").replace(/\/$/, "").toLowerCase();
        return current === root || current.startsWith(root + "/");
      }
      function isReadonly(path) {
        return inPath(path, "03-\u8D44\u6E90/\u539F\u59CB\u8D44\u6599");
      }
      function isExcluded(path, settings = DEFAULTS) {
        const normalized = String(path).replace(/\\/g, "/");
        const segments = normalized.split("/");
        if (segments.some((part) => [".obsidian", ".git", ".trash", "node_modules"].includes(part.toLowerCase()))) return true;
        const name = segments[segments.length - 1].toLowerCase();
        if (!name.endsWith(".md") || SYSTEM_FILES.has(name)) return true;
        if (segments.some((part) => /(?:模板|(?:^|[-_\s])templates?(?:[-_.\s]|$))/i.test(part))) return true;
        return (Array.isArray(settings.excludedPaths) ? settings.excludedPaths : DEFAULTS.excludedPaths).some((prefix) => prefix && inPath(normalized, prefix));
      }
      function cleanSettings(raw) {
        const value = raw && typeof raw === "object" ? raw : {};
        const excludedPaths = Array.isArray(value.excludedPaths) ? value.excludedPaths : DEFAULTS.excludedPaths;
        return {
          displayName: typeof value.displayName === "string" && value.displayName.trim() ? value.displayName.trim().slice(0, 40) : DEFAULTS.displayName,
          theme: ["light", "dark"].includes(value.theme) ? value.theme : DEFAULTS.theme,
          motion: ["full", "subtle", "off"].includes(value.motion) ? value.motion : "full",
          excludedPaths: [...new Set(excludedPaths.map((path) => {
            try {
              return normalizePath(path);
            } catch (_) {
              return "";
            }
          }).filter(Boolean))],
          bookmarks: [...new Set((Array.isArray(value.bookmarks) ? value.bookmarks : []).map((path) => {
            try {
              return normalizePath(path);
            } catch (_) {
              return "";
            }
          }).filter(Boolean))]
        };
      }
      function classify(path, frontmatter = {}) {
        const type = String(frontmatter.type || "").toLowerCase();
        const declared = ROUTES.find((route) => route.type === type || type === "source-summary" && route.type === "resource");
        const routed = ROUTES.find((route) => inPath(path, route.folder));
        return (routed || declared || ROUTES[3]).category;
      }
      function list(value) {
        if (Array.isArray(value)) return value.flatMap(list);
        if (typeof value === "string") return value.split(/[,，\n]/).map((item) => item.trim()).filter(Boolean);
        return [];
      }
      function tags(frontmatter, cache = {}) {
        const all = [...list(frontmatter.tags), ...list(frontmatter["\u6807\u7B7E"]), ...(cache.tags || []).map((tag) => tag.tag)];
        return [...new Set(all.map((tag) => String(tag).replace(/^#+/, "").trim()).filter(Boolean))];
      }
      function linkPath(value) {
        return String(value || "").trim().replace(/^!?\[\[/, "").replace(/\]\]$/, "").split("|")[0].split("#")[0].trim();
      }
      function stripFrontmatter(content) {
        return String(content || "").replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
      }
      function excerpt(content) {
        return stripFrontmatter(content).replace(/```[\s\S]*?```/g, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/!?\[\[([^\]]+)\]\]/g, (_, value) => value.split("|").pop().split("#")[0]).replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/<[^>]*>/g, "").replace(/^[#>\s*-]+/gm, "").replace(/[`*_~]/g, "").replace(/\s+/g, " ").trim().slice(0, 200);
      }
      function noteFromFile(file, cache = {}, content = "") {
        const fm = cache.frontmatter || {};
        const path = String(file.path);
        const basename = file.basename || path.split("/").pop().replace(/\.md$/i, "");
        const parentPath = file.parent?.path || path.split("/").slice(0, -1).join("/");
        const createdValue = fm.created ?? fm["\u521B\u5EFA\u65E5\u671F"] ?? fm.date;
        return {
          path,
          title: typeof fm.title === "string" && fm.title.trim() ? fm.title.trim() : basename.toLowerCase() === "skill" ? parentPath.split("/").pop() || "Skill" : basename,
          folder: parentPath || "\u6839\u76EE\u5F55",
          category: classify(path, fm),
          reading: READING.includes(fm["\u9605\u8BFB\u72B6\u6001"]) ? fm["\u9605\u8BFB\u72B6\u6001"] : "\u672A\u8BFB",
          absorption: ABSORPTION.includes(fm["\u5438\u6536\u72B6\u6001"]) ? fm["\u5438\u6536\u72B6\u6001"] : "\u5F85\u6C89\u6DC0",
          tags: tags(fm, cache),
          excerpt: excerpt(content),
          created: timestamp(createdValue, file.stat?.ctime),
          modified: Number(file.stat?.mtime) || timestamp(fm.updated ?? fm["\u66F4\u65B0\u65E5\u671F"]),
          readDate: dateKey(fm["\u5B8C\u6210\u9605\u8BFB"] ?? fm.readDate),
          links: [...new Set([...list(fm.related), ...list(fm["\u5173\u8054"]), ...(cache.links || []).map((link) => link.link)].map(linkPath).filter(Boolean))],
          readonly: isReadonly(path),
          createdFromFrontmatter: Boolean(dateKey(createdValue))
        };
      }
      function applyStatus(frontmatter, patch, date = localDate()) {
        if (!patch || typeof patch !== "object") throw new Error("\u8BF7\u9009\u62E9\u8981\u66F4\u65B0\u7684\u72B6\u6001\u3002");
        if (patch.reading !== void 0 && !READING.includes(patch.reading)) throw new Error("\u9605\u8BFB\u72B6\u6001\u65E0\u6548\u3002");
        if (patch.absorption !== void 0 && !ABSORPTION.includes(patch.absorption)) throw new Error("\u5438\u6536\u72B6\u6001\u65E0\u6548\u3002");
        let changed = false;
        if (patch.reading !== void 0 && frontmatter["\u9605\u8BFB\u72B6\u6001"] !== patch.reading) {
          frontmatter["\u9605\u8BFB\u72B6\u6001"] = patch.reading;
          if (patch.reading === "\u5728\u8BFB" && !frontmatter["\u5F00\u59CB\u9605\u8BFB"]) frontmatter["\u5F00\u59CB\u9605\u8BFB"] = date;
          if (patch.reading === "\u5DF2\u8BFB" && !frontmatter["\u5B8C\u6210\u9605\u8BFB"]) frontmatter["\u5B8C\u6210\u9605\u8BFB"] = date;
          changed = true;
        }
        if (patch.absorption !== void 0 && frontmatter["\u5438\u6536\u72B6\u6001"] !== patch.absorption) {
          frontmatter["\u5438\u6536\u72B6\u6001"] = patch.absorption;
          changed = true;
        }
        if (changed) frontmatter["\u72B6\u6001\u66F4\u65B0\u65F6\u95F4"] = date;
        return changed;
      }
      function safeTitle(value) {
        const title = String(value || "").trim().replace(/\.md$/i, "");
        if (!title || title.length > 120 || /[\\/:*?"<>|#\[\]\u0000-\u001f]/.test(title) || /[. ]$/.test(title) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(title)) {
          throw new Error("\u8BF7\u586B\u5199 1\u2013120 \u5B57\u6807\u9898\uFF0C\u5E76\u907F\u5F00\u6587\u4EF6\u540D\u4FDD\u7559\u5B57\u7B26\u3002");
        }
        return title;
      }
      function buildNewNote(input, date = localDate()) {
        const title = safeTitle(input?.title);
        const folder = normalizePath(input?.folder || "04-\u8F85\u52A9/\u6536\u4EF6\u7BB1");
        if (isReadonly(folder)) throw new Error("\u539F\u59CB\u8D44\u6599\u76EE\u5F55\u4FDD\u6301\u53EA\u8BFB\uFF0C\u8BF7\u9009\u62E9\u5176\u4ED6\u5206\u7C7B\u3002");
        const route = ROUTES.find((item) => inPath(folder, item.folder)) || ROUTES[3];
        const slug = title.toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "note";
        let identity = 2166136261;
        for (const character of `${folder}/${title}`) identity = Math.imul(identity ^ character.codePointAt(0), 16777619) >>> 0;
        const noteTags = [...new Set(list(input?.tags).map((tag) => tag.replace(/^#+/, "")).filter(Boolean))];
        const schema = {
          id: `${route.type}-${date.replace(/-/g, "")}-${slug}-${identity.toString(36)}`,
          title,
          type: route.type,
          status: route.type === "idea" ? "incubating" : route.type === "resource" ? "reference" : "active",
          created: date,
          updated: date,
          tags: noteTags,
          sources: [],
          related: ["[[index|\u77E5\u8BC6\u5E93\u603B\u7D22\u5F15]]"],
          "\u9605\u8BFB\u72B6\u6001": "\u672A\u8BFB",
          "\u5438\u6536\u72B6\u6001": "\u5F85\u6C89\u6DC0"
        };
        const yaml = Object.entries(schema).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n");
        const body = stripFrontmatter(input?.content || "").trim();
        const content = `---
${yaml}
---

# ${title}

${body || "## \u6B63\u6587\n\n\n## \u6765\u6E90\u4E0E\u5173\u8054\n\n- [[index|\u77E5\u8BC6\u5E93\u603B\u7D22\u5F15]]"}
`;
        return { title, folder, category: route.category, type: route.type, path: `${folder}/${title}.md`, content, frontmatter: schema };
      }
      function indexEntry(content, note) {
        const linkTarget = note.path.replace(/\.md$/i, "");
        if (String(content).includes(`[[${linkTarget}|`) || String(content).includes(`[[${linkTarget}]]`)) return String(content);
        const line = `- [[${linkTarget}|${note.title}]]\uFF1A\u901A\u8FC7\u77E5\u95F4\u521B\u5EFA\uFF0C\u5F85\u8865\u5145\u4E3B\u9898\u8BF4\u660E\u3002`;
        const lines = String(content).split(/\r?\n/);
        const header = lines.findIndex((value) => value.trim() === `## ${note.category}`);
        if (header < 0) return String(content) + (String(content).endsWith("\n") ? "" : "\n") + `
## ${note.category}

${line}
`;
        let insertion = header + 1;
        while (insertion < lines.length && !/^##\s/.test(lines[insertion])) insertion++;
        const added = insertion < lines.length ? [line, ""] : [line];
        while (insertion > header + 1 && !lines[insertion - 1].trim()) insertion--;
        lines.splice(insertion, 0, ...added);
        return lines.join("\n");
      }
      function logEntry(note, date = localDate()) {
        return `
## [${date}] create | ${note.title}

- \u901A\u8FC7\u77E5\u95F4\u521B\u5EFA[[${note.path.replace(/\.md$/i, "")}|${note.title}]]\uFF0C\u5F52\u5165${note.category}\u3002
- \u5DF2\u6DFB\u52A0\u77E5\u8BC6\u5E93\u603B\u7D22\u5F15\u6761\u76EE\uFF1B\u9875\u9762\u4F7F\u7528\u7EF4\u62A4\u534F\u8BAE\u4E2D\u7684 YAML schema\u3002
`;
      }
      async function mapLimit(items, limit, mapper) {
        const results = new Array(items.length);
        let cursor = 0;
        await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
          while (cursor < items.length) {
            const index = cursor++;
            results[index] = await mapper(items[index], index);
          }
        }));
        return results;
      }
      return { READING, ABSORPTION, DEFAULTS, ROUTES, localDate, dateKey, timestamp, normalizePath, inPath, isReadonly, isExcluded, cleanSettings, classify, list, tags, linkPath, stripFrontmatter, excerpt, noteFromFile, applyStatus, safeTitle, buildNewNote, indexEntry, logEntry, mapLimit };
    });
  }
});

// ui.js
var require_ui = __commonJS({
  "ui.js"(exports2, module2) {
    (function(factory) {
      const api = factory();
      if (typeof module2 === "object" && module2.exports) module2.exports = api;
      if (typeof window !== "undefined") window.ZhijianUI = api;
    })(function() {
      "use strict";
      const categories = ["\u9879\u76EE", "\u8D44\u4EA7", "\u8D44\u6E90", "\u8F85\u52A9", "\u7075\u611F", "Skills"];
      const categoryIcons = ["briefcase", "cube", "archive", "folder", "lightbulb", "code"];
      const folders = ["01-\u9879\u76EE", "02-\u8D44\u4EA7", "03-\u8D44\u6E90", "04-\u8F85\u52A9", "05-\u7075\u611F", "06-Skills"];
      const escape = (value) => String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
      const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const shortDate = (value) => value ? new Date(value).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }) : "\u6682\u65E0\u8BB0\u5F55";
      const icon = (name) => {
        const icons = typeof window !== "undefined" ? window.ZhijianIcons : null;
        return `<span class="zj-icon" aria-hidden="true">${icons && icons[name] || ""}</span>`;
      };
      function mount(root, adapter) {
        const doc = root.ownerDocument;
        let notes = [], settings = {}, destroyed = false, modal = null, modalToken = 0, lastFocus = null;
        let refreshing = null, refreshAgain = false, inputTimer, toastTimer, unsubscribe, composing = false, graphView = null, carouselView = null;
        const state = { page: "overview", category: "", graphCategory: "", showOrphans: true, status: "\u5168\u90E8", absorption: "", query: "", sort: "updated", layout: "grid", year: (/* @__PURE__ */ new Date()).getFullYear(), mobile: false, zoom: 1 };
        root.classList.add("zj-host");
        const scene = doc.createElement("div");
        scene.className = "zj-scene";
        scene.setAttribute("aria-hidden", "true");
        const app = doc.createElement("div");
        app.className = "zj-app";
        const layer = doc.createElement("div");
        layer.className = "zj-layer";
        const toastRegion = doc.createElement("div");
        toastRegion.className = "zj-toast-region";
        toastRegion.setAttribute("aria-live", "polite");
        root.replaceChildren(scene, app, layer, toastRegion);
        const FX2 = typeof window !== "undefined" ? window.ZhijianFX : null;
        const effects = FX2?.mount(scene, app, { getSettings: () => settings });
        function toast(message) {
          clearTimeout(toastTimer);
          toastRegion.innerHTML = `<div class="zj-toast">${icon("check")}<span>${escape(message)}</span></div>`;
          toastTimer = setTimeout(() => toastRegion.replaceChildren(), 3500);
        }
        function theme() {
          app.dataset.theme = settings.theme || "light";
          layer.dataset.theme = settings.theme || "light";
          toastRegion.dataset.theme = settings.theme || "light";
          scene.dataset.theme = settings.theme || "light";
          app.dataset.motion = settings.motion || "full";
        }
        function nav(label, name, glyph, count, active) {
          return `<button class="zj-nav-item ${active ? "is-active" : ""}" data-action="navigate" data-page="${name}" aria-current="${active ? "page" : "false"}">${icon(glyph)}<span>${label}</span>${count == null ? "" : `<span class="zj-nav-count">${count}</span>`}</button>`;
        }
        function selectedNotes() {
          const category = state.page === "graph" ? state.graphCategory : state.category;
          let result = notes.filter((n) => (!category || n.category === category) && (state.status === "\u5168\u90E8" || n.reading === state.status) && (!state.absorption || n.absorption === state.absorption) && (state.page !== "pending" || n.reading === "\u5DF2\u8BFB"));
          if (state.page === "bookmarks") result = result.filter((n) => (settings.bookmarks || []).includes(n.path));
          const query = state.query.trim().toLowerCase();
          if (query) result = result.filter((n) => [n.title, n.excerpt, n.folder, ...n.tags || []].join(" ").toLowerCase().includes(query));
          return result.sort(state.sort === "title" ? (a, b) => a.title.localeCompare(b.title, "zh-CN") : state.sort === "created" ? (a, b) => b.created - a.created : (a, b) => b.modified - a.modified);
        }
        function sidebar() {
          const pending = notes.filter((n) => n.reading === "\u5DF2\u8BFB" && n.absorption === "\u5F85\u6C89\u6DC0").length;
          return `<aside class="zj-sidebar ${state.mobile ? "is-open" : ""}" aria-label="\u77E5\u8BC6\u5E93\u5BFC\u822A">
        <a class="zj-brand" href="#" data-action="navigate" data-page="overview"><span class="zj-brand-mark">${icon("leaf")}</span><span><span class="zj-brand-word">\u77E5\u95F4<span class="zj-brand-dot">.</span></span><span class="zj-brand-caption">KNOWLEDGE STUDIO</span></span></a>
        <div class="zj-nav-group"><div class="zj-nav-label">\u6211\u7684\u7A7A\u95F4</div>${nav("\u6982\u89C8", "overview", "squares", null, state.page === "overview" && !state.category)}${nav("\u9605\u8BFB\u4E66\u67B6", "shelf", "book", notes.length, state.page === "shelf" && !state.category)}${nav("\u77E5\u8BC6\u56FE\u8C31", "graph", "graph", null, state.page === "graph")}</div>
        <div class="zj-nav-group"><div class="zj-nav-label">\u77E5\u8BC6\u5206\u533A<span>6</span></div>${categories.map((c, i) => `<button class="zj-nav-item ${state.category === c ? "is-active" : ""}" data-action="category" data-category="${c}">${icon(categoryIcons[i])}<span>${c === "Skills" ? "\u5DE5\u4F5C\u6D41 \xB7 Skills" : c === "\u9879\u76EE" ? "\u9879\u76EE\u7A7A\u95F4" : c === "\u8D44\u4EA7" ? "\u77E5\u8BC6\u8D44\u4EA7" : c === "\u8D44\u6E90" ? "\u8D44\u6E90\u6536\u85CF" : c === "\u8F85\u52A9" ? "\u8F85\u52A9\u4E0E\u7D22\u5F15" : "\u7075\u611F\u7B14\u8BB0"}</span><span class="zj-nav-count">${notes.filter((n) => n.category === c).length}</span></button>`).join("")}</div>
        <div class="zj-nav-group"><div class="zj-nav-label">\u8BA9\u77E5\u8BC6\u751F\u957F</div>${nav("\u5F85\u6C89\u6DC0", "pending", "sparkles", pending, state.page === "pending")}${nav("\u6211\u7684\u4E66\u7B7E", "bookmarks", "bookmark", (settings.bookmarks || []).filter((p) => notes.some((n) => n.path === p)).length, state.page === "bookmarks")}</div>
        <div class="zj-sidebar-bottom"><div class="zj-local"><span class="zj-local-dot"></span>\u672C\u5730\u77E5\u8BC6\u5E93<span>${icon("check")}</span></div><button class="zj-profile" data-action="settings"><span class="zj-avatar">${escape((settings.displayName || "Y").slice(0, 1))}</span><span><strong>${escape(settings.displayName || "Y")} \u7684\u77E5\u8BC6\u7A7A\u95F4</strong><small>${escape(adapter.getVaultName ? adapter.getVaultName() : "Obsidian Vault")}</small></span>${icon("chevronDown")}</button></div>
      </aside>`;
        }
        function pageTools() {
          return `<div class="zj-page-tools" aria-label="\u77E5\u8BC6\u5E93\u5DE5\u5177"><label class="zj-search">${icon("search")}<input class="zj-search-input" data-role="search" aria-label="\u641C\u7D22\u77E5\u8BC6\u5E93" placeholder="\u641C\u7D22\u4F60\u7684\u77E5\u8BC6\u5E93\u2026" value="${escape(state.query)}"><kbd>\u2318 / Ctrl K</kbd></label><button class="zj-icon-button" data-action="theme" aria-label="\u5207\u6362${settings.theme === "dark" ? "\u6D45\u8272" : "\u6DF1\u8272"}\u4E3B\u9898" title="\u5207\u6362\u4E3B\u9898">${icon(settings.theme === "dark" ? "sun" : "moon")}</button><button class="zj-icon-button" data-action="settings" aria-label="\u754C\u9762\u8BBE\u7F6E" title="\u754C\u9762\u8BBE\u7F6E">${icon("settings")}</button></div>`;
        }
        function pageTitle() {
          return state.category || ({ overview: "\u6982\u89C8", shelf: "\u9605\u8BFB\u4E66\u67B6", graph: "\u77E5\u8BC6\u56FE\u8C31", pending: "\u5F85\u6C89\u6DC0", bookmarks: "\u6211\u7684\u4E66\u7B7E" }[state.page] || "\u9605\u8BFB\u4E66\u67B6");
        }
        function pageHeading() {
          const today = /* @__PURE__ */ new Date();
          return `<div class="zj-page-heading"><div class="zj-page-copy"><div class="zj-mobile-page-nav"><button class="zj-icon-button zj-menu-button" data-action="menu" aria-label="\u6253\u5F00\u5BFC\u822A">${icon("menu")}</button><span>${escape(pageTitle())}</span></div><div class="zj-eyebrow">${state.page === "overview" ? `${today.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" })} \xB7 READING COCKPIT` : "YOUR PERSONAL KNOWLEDGE SPACE"}</div><h1>${state.page === "overview" ? `${escape(settings.displayName || "Y")}\uFF0C\u6B22\u8FCE\u56DE\u5230\u4F60\u7684\u77E5\u8BC6\u5B87\u5B99\u3002` : escape(pageTitle())}</h1><p>${state.page === "overview" ? "\u8BA9\u9605\u8BFB\u4EA7\u751F\u8FDE\u63A5\uFF0C\u8BA9\u7075\u611F\u6C89\u6DC0\u4E3A\u81EA\u5DF1\u7684\u77E5\u8BC6\u3002" : state.page === "graph" ? "\u6BCF\u4E00\u6761\u8FDE\u63A5\uFF0C\u90FD\u662F\u4E00\u4E2A\u65B0\u7684\u7406\u89E3\u3002\u70B9\u51FB\u8282\u70B9\uFF0C\u63A2\u7D22\u4F60\u7684\u7B14\u8BB0\u3002" : state.page === "pending" ? "\u628A\u8BFB\u8FC7\u7684\u5185\u5BB9\uFF0C\u53D8\u6210\u53EF\u4EE5\u518D\u6B21\u8C03\u7528\u7684\u77E5\u8BC6\u3002" : state.page === "bookmarks" ? "\u7559\u4E00\u76CF\u5C0F\u706F\uFF0C\u968F\u65F6\u56DE\u5230\u503C\u5F97\u91CD\u8BFB\u7684\u5730\u65B9\u3002" : "\u4E3A\u597D\u5947\u7559\u4E00\u4E2A\u4F4D\u7F6E\uFF0C\u4E3A\u7406\u89E3\u7559\u4E00\u70B9\u65F6\u95F4\u3002"}</p></div><div class="zj-page-actions">${pageTools()}<button class="zj-button primary" data-action="create">${icon("plus")}\u8BB0\u5F55\u65B0\u60F3\u6CD5</button></div></div>`;
        }
        function stats() {
          const reading = notes.filter((n) => n.reading === "\u5728\u8BFB").length, read = notes.filter((n) => n.reading === "\u5DF2\u8BFB").length;
          return `<section class="zj-stats zj-overview-stats" aria-label="\u77E5\u8BC6\u5E93\u7EDF\u8BA1"><button class="zj-stat" data-action="stat" data-route="shelf"><div class="zj-stat-label">\u7B14\u8BB0\u603B\u91CF<span class="zj-stat-icon">${icon("book")}</span></div><div class="zj-stat-number">${notes.length}<span>\u7BC7</span></div><div class="zj-stat-bottom">\u6BCF\u4E00\u7BC7\uFF0C\u90FD\u662F\u65B0\u7684\u53EF\u80FD${icon("arrowUpRight")}</div></button><section class="zj-stat zj-reading-stat" aria-label="\u9605\u8BFB\u8FDB\u5EA6"><div class="zj-stat-label">\u9605\u8BFB\u8FDB\u5EA6<span class="zj-stat-icon">${icon("clock")}</span></div><div class="zj-reading-metrics">${[["\u6B63\u5728\u9605\u8BFB", reading, "reading"], ["\u5DF2\u5B8C\u6210\u9605\u8BFB", read, "read"]].map(([label, count, route]) => `<button class="zj-reading-metric" data-action="stat" data-route="${route}" aria-label="${label} ${count} \u7BC7"><span class="zj-reading-metric-label">${label}</span><span class="zj-stat-number">${count}<span>\u7BC7</span></span></button>`).join("")}</div><div class="zj-stat-bottom">${notes.length ? Math.round(read / notes.length * 100) : 0}% \u7684\u7B14\u8BB0\u5DF2\u8BFB\u5B8C</div></section>${heatmap()}</section>`;
        }
        function focusCard() {
          const note = notes.find((n) => n.reading === "\u5728\u8BFB") || notes.find((n) => n.reading === "\u672A\u8BFB");
          if (!note) return `<section class="zj-focus-card"><div class="zj-focus-copy"><div class="zj-focus-label">A LITTLE EVERY DAY</div><h2>\u8BA9\u6BCF\u4E00\u6B21\u9605\u8BFB\uFF0C\u90FD\u6709\u6240\u6C89\u6DC0\u3002</h2><p>\u8BB0\u5F55\u4E00\u4E2A\u60F3\u6CD5\uFF0C\u6216\u91CD\u8BFB\u4E00\u7BC7\u503C\u5F97\u56DE\u5473\u7684\u7B14\u8BB0\u3002</p><button class="zj-focus-action" data-action="create">\u5199\u4E0B\u65B0\u7684\u60F3\u6CD5${icon("arrowRight")}</button></div><div class="zj-focus-mark">${icon("book")}</div></section>`;
          const orbitNotes = [note, ...notes.filter((n) => n.path !== note.path)].slice(0, 3);
          return `<section class="zj-focus-card"><div class="zj-focus-copy"><div class="zj-focus-label">${icon("sparkles")}READ \xB7 CONNECT \xB7 GROW</div><h2>\u8BA9\u7075\u611F\uFF0C<br>\u5728\u77E5\u8BC6\u5B87\u5B99\u4E2D\u6D41\u52A8\u3002</h2><p data-role="orbitTitle">\u6B63\u5728\u63A2\u7D22 \xB7 ${escape(note.title)}</p><button class="zj-focus-action" data-action="detail" data-role="orbitOpen" data-path="${escape(note.path)}"><span data-role="orbitAction">${note.reading === "\u5728\u8BFB" ? "\u7EE7\u7EED\u9605\u8BFB" : "\u6253\u5F00\u7B14\u8BB0"}</span>${icon("arrowRight")}</button></div><div class="zj-orbit-stage zj-orbit-carousel" role="region" aria-label="\u60AC\u6D6E\u7B14\u8BB0\u8F6E\u64AD" aria-roledescription="\u8F6E\u64AD"><div class="zj-orbit-glow" aria-hidden="true"></div><div class="zj-orbit-ring" aria-hidden="true"></div><div class="zj-orbit-ring second" aria-hidden="true"></div>${orbitNotes.map((n, i) => `<button class="zj-orbit-card" data-carousel-item="${i}" data-orbit-index="${i}" data-action="detail" data-path="${escape(n.path)}" aria-label="\u6253\u5F00\u60AC\u6D6E\u7B14\u8BB0\uFF1A${escape(n.title)}"><span class="zj-orbit-top">${icon(categoryIcons[categories.indexOf(n.category)] || "file")}<span>${escape(n.category)}</span><i class="zj-orbit-dot"></i></span><strong>${escape(n.title)}</strong><span class="zj-orbit-excerpt">${escape(n.excerpt.slice(0, 52))}</span><span class="zj-orbit-status">${icon("circle")}${escape(n.reading)}</span></button>`).join("")}<div class="zj-carousel-controls" ${orbitNotes.length < 2 ? "hidden" : ""}><button class="zj-carousel-arrow" data-carousel-step="-1" aria-label="\u4E0A\u4E00\u5F20\u60AC\u6D6E\u7B14\u8BB0">${icon("chevronLeft")}</button>${orbitNotes.map((n, i) => `<button class="zj-carousel-dot" data-carousel-go="${i}" aria-label="\u5C55\u793A\u7B2C ${i + 1} \u5F20\uFF1A${escape(n.title)}" aria-current="${i === 0}"></button>`).join("")}<button class="zj-carousel-arrow" data-carousel-step="1" aria-label="\u4E0B\u4E00\u5F20\u60AC\u6D6E\u7B14\u8BB0">${icon("chevronRight")}</button><span class="zj-carousel-caption" aria-hidden="true">01 / ${String(orbitNotes.length).padStart(2, "0")}</span><button class="zj-carousel-toggle" aria-label="\u6682\u505C\u81EA\u52A8\u8F6E\u6362" aria-pressed="false">\u2161</button></div></div></section>`;
        }
        function toolbar() {
          const category = state.page === "graph" ? state.graphCategory : state.category;
          const pool = notes.filter((n) => (!category || n.category === category) && (!state.absorption || n.absorption === state.absorption) && (state.page !== "bookmarks" || (settings.bookmarks || []).includes(n.path)) && (state.page !== "pending" || n.reading === "\u5DF2\u8BFB"));
          const tools = state.page === "graph" ? `<select class="zj-select" data-role="graphCategory" aria-label="\u56FE\u8C31\u77E5\u8BC6\u5206\u533A"><option value="">\u5168\u90E8\u5206\u533A</option>${categories.map((c) => `<option value="${c}" ${state.graphCategory === c ? "selected" : ""}>${c}</option>`).join("")}</select><label class="zj-graph-orphans"><input type="checkbox" data-role="graphOrphans" ${state.showOrphans ? "checked" : ""}>\u663E\u793A\u5B64\u7ACB\u7B14\u8BB0</label>${adapter.supportsNativeGraph ? `<button class="zj-text-button" data-action="nativeGraph">\u6253\u5F00\u539F\u751F\u56FE\u8C31${icon("arrowUpRight")}</button>` : ""}` : `<select class="zj-select" data-role="sort" aria-label="\u7B14\u8BB0\u6392\u5E8F"><option value="updated" ${state.sort === "updated" ? "selected" : ""}>\u6700\u8FD1\u66F4\u65B0</option><option value="created" ${state.sort === "created" ? "selected" : ""}>\u6700\u8FD1\u521B\u5EFA</option><option value="title" ${state.sort === "title" ? "selected" : ""}>\u6807\u9898\u6392\u5E8F</option></select><div class="zj-view-toggle" aria-label="\u663E\u793A\u65B9\u5F0F"><button class="zj-icon-button ${state.layout === "grid" ? "is-active" : ""}" data-action="layout" data-layout="grid" aria-label="\u5361\u7247\u89C6\u56FE" aria-pressed="${state.layout === "grid"}">${icon("squares")}</button><button class="zj-icon-button ${state.layout === "list" ? "is-active" : ""}" data-action="layout" data-layout="list" aria-label="\u5217\u8868\u89C6\u56FE" aria-pressed="${state.layout === "list"}">${icon("list")}</button></div>`;
          return `<div class="zj-toolbar"><div class="zj-tabs" role="group" aria-label="\u9605\u8BFB\u72B6\u6001">${(state.page === "pending" ? ["\u5DF2\u8BFB"] : ["\u5168\u90E8", "\u672A\u8BFB", "\u5728\u8BFB", "\u5DF2\u8BFB"]).map((s) => `<button class="zj-tab ${state.status === s ? "is-active" : ""}" aria-pressed="${state.status === s}" data-action="status" data-status="${s}">${s}<span>${s === "\u5168\u90E8" ? pool.length : pool.filter((n) => n.reading === s).length}</span></button>`).join("")}</div><div class="zj-toolbar-right">${tools}</div></div>`;
        }
        function noteCard(note) {
          const marked = (settings.bookmarks || []).includes(note.path);
          const glyph = categoryIcons[categories.indexOf(note.category)] || "file";
          return `<article class="zj-note-card"><button class="zj-card-open" data-action="detail" data-path="${escape(note.path)}"><span class="zj-card-top"><span class="zj-note-symbol">${icon(glyph)}</span><span class="zj-category">${escape(note.category)}${note.readonly ? " \xB7 \u53EA\u8BFB" : ""}</span></span><h3 class="zj-note-title">${escape(note.title)}</h3><p class="zj-note-excerpt">${escape(note.excerpt || "\u8FD8\u6CA1\u6709\u6458\u8981\uFF0C\u6253\u5F00\u7B14\u8BB0\u5F00\u59CB\u63A2\u7D22\u3002")}</p><span class="zj-tags">${(note.tags || []).slice(0, 2).map((t) => `<span># ${escape(t)}</span>`).join("")}</span></button><div class="zj-card-bottom"><span class="zj-status ${note.reading === "\u5728\u8BFB" ? "reading" : note.reading === "\u5DF2\u8BFB" ? "read" : "unread"}"><span></span>${escape(note.reading)}</span><span class="zj-note-date">${shortDate(note.modified)}</span><button class="zj-icon-button zj-card-more ${marked ? "is-bookmarked" : ""}" data-action="bookmark" data-path="${escape(note.path)}" aria-label="${marked ? "\u53D6\u6D88" : "\u6DFB\u52A0"}\u4E66\u7B7E\uFF1A${escape(note.title)}" aria-pressed="${marked}">${icon("bookmark")}</button></div></article>`;
        }
        function empty() {
          return `<div class="zj-empty">${icon("book")}<h3>${state.query ? "\u6CA1\u6709\u627E\u5230\u76F8\u5173\u7B14\u8BB0" : state.page === "bookmarks" ? "\u628A\u503C\u5F97\u91CD\u8BFB\u7684\u7B14\u8BB0\u7559\u4E0B\u6765" : state.page === "pending" ? "\u6240\u6709\u5DF2\u8BFB\u77E5\u8BC6\uFF0C\u90FD\u5DF2\u59A5\u5584\u5B89\u653E" : "\u8FD9\u91CC\u8FD8\u6709\u4E00\u7247\u7559\u767D"}</h3><p>${state.query ? "\u8BD5\u8BD5\u6807\u9898\u3001\u6807\u7B7E\u6216\u6458\u8981\u4E2D\u7684\u5176\u4ED6\u5173\u952E\u8BCD\u3002" : state.page === "bookmarks" ? "\u70B9\u51FB\u7B14\u8BB0\u5361\u7247\u53F3\u4E0B\u89D2\u7684\u4E66\u7B7E\uFF0C\u5C31\u80FD\u5728\u8FD9\u91CC\u627E\u5230\u5B83\u3002" : "\u521B\u5EFA\u65B0\u7B14\u8BB0\uFF0C\u6216\u8C03\u6574\u7B5B\u9009\u6761\u4EF6\u3002"}</p><button class="zj-button secondary" data-action="${state.query ? "clearSearch" : "resetFilters"}">${state.query ? "\u6E05\u9664\u641C\u7D22" : "\u67E5\u770B\u5168\u90E8\u7B14\u8BB0"}</button></div>`;
        }
        function cards() {
          const selected = selectedNotes();
          return `<div class="zj-note-grid ${state.layout === "list" ? "zj-note-list" : ""}">${selected.length ? selected.map(noteCard).join("") : empty()}</div><div class="zj-shelf-summary">${selected.length} \u7BC7\u7B14\u8BB0${state.query ? ` \xB7 \u641C\u7D22\u300C${escape(state.query)}\u300D` : " \xB7 \u7559\u5728\u8FD9\u91CC\u7684\u60F3\u6CD5\uFF0C\u4F1A\u6162\u6162\u6210\u4E3A\u4F60\u7684\u77E5\u8BC6"}</div>`;
        }
        function heatmap() {
          const year = state.year, counts = {};
          notes.forEach((n) => {
            if (n.readDate && n.readDate.slice(0, 4) === String(year)) counts[n.readDate] = (counts[n.readDate] || 0) + 1;
          });
          const start = new Date(year, 0, 1), first = new Date(year, 0, 1 - start.getDay()), end = new Date(year + 1, 0, 1), today = dateKey(/* @__PURE__ */ new Date());
          const totalDays = Math.round((end - first) / 864e5), cols = Math.ceil(totalDays / 7);
          let cells = "";
          for (let i = 0; i < cols * 7; i++) {
            const d = new Date(first);
            d.setDate(first.getDate() + i);
            const key = dateKey(d), within = d >= start && d < end, value = counts[key] || 0;
            cells += `<span class="zj-heat-cell" data-level="${Math.min(value, 4)}" ${within ? "" : 'data-outside="true"'} ${key > today ? 'data-future="true"' : ""} title="${within ? `${key} \xB7 ${value} \u7BC7\u5B8C\u6210\u9605\u8BFB` : ""}"></span>`;
          }
          const total = Object.values(counts).reduce((a, b) => a + b, 0);
          const months = Array.from({ length: 12 }, (_, month) => `<span style="grid-column:${Math.floor((new Date(year, month, 1) - first) / 6048e5) + 1}" data-month="${month + 1}">${month + 1} \u6708</span>`).join("");
          return `<section class="zj-panel zj-heat-panel zj-heat-compact"><div class="zj-panel-heading"><h2>${icon("calendar")}\u9605\u8BFB\u8DB3\u8FF9</h2><div class="zj-year-controls"><button class="zj-icon-button" data-action="year" data-step="-1" aria-label="\u4E0A\u4E00\u5E74">${icon("chevronLeft")}</button><span>${year}</span><button class="zj-icon-button" data-action="year" data-step="1" ${year >= (/* @__PURE__ */ new Date()).getFullYear() ? "disabled" : ""} aria-label="\u4E0B\u4E00\u5E74">${icon("chevronRight")}</button></div></div><div class="zj-heatmap-scroller" style="--heat-cols:${cols}" role="img" aria-label="${year} \u5E74\u9605\u8BFB\u70ED\u529B\u56FE\uFF1A${total} \u7BC7\u7B14\u8BB0\uFF0C${Object.keys(counts).length} \u4E2A\u6D3B\u8DC3\u65E5"><div class="zj-heat-months" aria-hidden="true">${months}</div><div class="zj-heatmap" aria-hidden="true">${cells}</div></div><div class="zj-heat-footer"><div class="zj-heat-summary"><strong>${total}</strong> \u7BC7\u7B14\u8BB0<span>${Object.keys(counts).length} \u4E2A\u6D3B\u8DC3\u65E5</span></div><div class="zj-heat-legend" aria-hidden="true"><span>\u5C11</span>${[0, 1, 2, 3, 4].map((l) => `<span class="zj-heat-cell" data-level="${l}"></span>`).join("")}<span>\u591A</span></div></div></section>`;
        }
        function progress() {
          const eligible = notes.filter((n) => n.reading === "\u5DF2\u8BFB" && n.absorption !== "\u65E0\u9700\u6C89\u6DC0"), absorbed = eligible.filter((n) => n.absorption === "\u5DF2\u6C89\u6DC0").length, percent = eligible.length ? Math.round(absorbed / eligible.length * 100) : 0;
          return `<section class="zj-panel zj-progress-panel"><div class="zj-panel-heading"><h2>${icon("sparkles")}\u77E5\u8BC6\u6C89\u6DC0</h2><button class="zj-icon-button" data-action="navigate" data-page="pending" aria-label="\u67E5\u770B\u5F85\u6C89\u6DC0\u7B14\u8BB0">${icon("arrowUpRight")}</button></div><div class="zj-progress-ring" style="--progress:${percent}%" role="img" aria-label="\u5DF2\u8BFB\u4E14\u9700\u8981\u6C89\u6DC0\u7684\u7B14\u8BB0\u4E2D\uFF0C${percent}% \u5DF2\u6C89\u6DC0"><div class="zj-progress-center"><strong>${percent}<span>%</span></strong><small>\u7406\u89E3\uFF0C\u5185\u5316\uFF0C\u751F\u957F</small></div></div><div class="zj-progress-key"><span><i></i>\u5DF2\u6C89\u6DC0<strong>${absorbed}</strong></span><span><i></i>\u5F85\u6C89\u6DC0<strong>${eligible.length - absorbed}</strong></span></div><button class="zj-button secondary zj-wide" data-action="navigate" data-page="pending">\u53BB\u6574\u7406\u8BFB\u8FC7\u7684\u77E5\u8BC6${icon("arrowRight")}</button></section>`;
        }
        function graph() {
          const pool = selectedNotes();
          return `<section class="zj-panel zj-graph-shell zj-force-graph"><div class="zj-section-heading"><h2>\u77E5\u8BC6\u4E4B\u95F4\uFF0C\u81EA\u6709\u5F15\u529B</h2><span class="zj-graph-summary" data-role="graphSummary">${pool.length} \u7BC7\u7B14\u8BB0 \xB7 \u6B63\u5728\u6574\u7406\u8FDE\u63A5</span></div><div class="zj-graph-panel"><div class="zj-network" data-role="network">${pool.length ? "" : empty()}</div><div class="zj-graph-controls"><button class="zj-icon-button" data-action="zoom" data-step="-0.2" aria-label="\u7F29\u5C0F\u56FE\u8C31">\u2212</button><span data-role="graphZoom">100%</span><button class="zj-icon-button" data-action="zoom" data-step="0.2" aria-label="\u653E\u5927\u56FE\u8C31">${icon("plus")}</button><button class="zj-icon-button" data-action="fitGraph" aria-label="\u9002\u5E94\u56FE\u8C31\u5927\u5C0F">${icon("target")}</button></div><div class="zj-graph-focus" data-role="graphFocus" hidden></div></div><div class="zj-graph-legend" aria-label="\u56FE\u8C31\u5206\u533A\u989C\u8272">${categories.map((c, i) => `<span><i style="background:var(--zj-graph-${["project", "asset", "resource", "support", "idea", "skill"][i]})"></i>${c}</span>`).join("")}</div><p class="zj-panel-note">\u62D6\u52A8\u8282\u70B9\u8C03\u6574\u4F4D\u7F6E \xB7 \u62D6\u52A8\u7A7A\u767D\u5E73\u79FB \xB7 \u6EDA\u8F6E\u7F29\u653E \xB7 \u70B9\u51FB\u8282\u70B9\u67E5\u770B\u7B14\u8BB0</p><p class="zj-panel-note" data-role="graphLimit" hidden></p></section>`;
        }
        function mountGraph() {
          const container = app.querySelector('[data-role="network"]'), Graph2 = typeof window !== "undefined" ? window.ZhijianGraph : null;
          if (!container) return;
          if (!Graph2) {
            container.textContent = "\u5173\u7CFB\u56FE\u8C31\u6B63\u5728\u51C6\u5907\uFF0C\u8BF7\u5237\u65B0\u5DE5\u4F5C\u53F0\u3002";
            return;
          }
          graphView = Graph2.mount(container, selectedNotes(), {
            getSettings: () => settings,
            showOrphans: state.showOrphans,
            onOpen: (path) => detail(path).catch((error) => toast(error.message || "\u7B14\u8BB0\u8BFB\u53D6\u5931\u8D25")),
            onZoom: (zoom) => {
              state.zoom = zoom;
              const el = app.querySelector('[data-role="graphZoom"]');
              if (el) el.textContent = `${Math.round(zoom * 100)}%`;
            },
            onFocus: (note, count) => {
              const el = app.querySelector('[data-role="graphFocus"]');
              if (!el) return;
              el.hidden = !note;
              if (note) el.textContent = `${note.title} \xB7 ${count} \u7BC7\u5173\u8054\u7B14\u8BB0`;
            },
            onStats: (stats2) => {
              const el = app.querySelector('[data-role="graphSummary"]'), limit = app.querySelector('[data-role="graphLimit"]');
              if (el) el.textContent = `${stats2.nodes} \u4E2A\u8282\u70B9 \xB7 ${stats2.edges} \u6761\u8FDE\u63A5`;
              if (limit) {
                limit.hidden = !stats2.truncated;
                limit.textContent = stats2.truncated ? `\u5F53\u524D\u663E\u793A ${stats2.nodes} \u4E2A\u8282\u70B9\uFF1B\u4F7F\u7528\u641C\u7D22\u6216\u5206\u533A\u7B5B\u9009\u67E5\u770B\u5176\u4F59\u7B14\u8BB0\u3002` : "";
              }
            }
          });
        }
        function mountCarousel() {
          const hero = app.querySelector(".zj-focus-card"), Carousel2 = typeof window !== "undefined" ? window.ZhijianCarousel : null;
          if (!hero?.querySelector(".zj-orbit-carousel") || !Carousel2) return;
          carouselView = Carousel2.mount(hero, { getSettings: () => settings, onChange: (path) => {
            const note = notes.find((n) => n.path === path);
            if (!note) return;
            hero.querySelector('[data-role="orbitTitle"]').textContent = `\u6B63\u5728\u63A2\u7D22 \xB7 ${note.title}`;
            hero.querySelector('[data-role="orbitOpen"]').dataset.path = path;
            hero.querySelector('[data-role="orbitAction"]').textContent = note.reading === "\u5728\u8BFB" ? "\u7EE7\u7EED\u9605\u8BFB" : "\u6253\u5F00\u7B14\u8BB0";
          } });
        }
        function render() {
          if (destroyed || composing) return;
          const focused = doc.activeElement, preserve = focused && focused.dataset.role === "search", selection = preserve ? focused.selectionStart : 0;
          const focusAction = app.contains(focused) && focused.dataset.action ? { ...focused.dataset } : null;
          const overview = state.page === "overview" && !state.category;
          graphView?.destroy();
          graphView = null;
          carouselView?.destroy();
          carouselView = null;
          app.dataset.page = state.page;
          app.innerHTML = `${sidebar()}${state.mobile ? '<button class="zj-mobile-backdrop" data-action="menu" aria-label="\u5173\u95ED\u5BFC\u822A"></button>' : ""}<main class="zj-main"><div class="zj-content">${pageHeading()}${overview ? `${stats()}<div class="zj-overview-feature">${focusCard()}${progress()}</div>` : ""}${state.page === "graph" ? `${toolbar()}${graph()}` : `<section class="zj-shelf"><div class="zj-section-heading"><h2>${state.category ? escape(state.category) + "\u4E2D\u7684\u60F3\u6CD5" : state.page === "pending" ? "\u7B49\u5F85\u5185\u5316\u7684\u77E5\u8BC6" : state.page === "bookmarks" ? "\u503C\u5F97\u518D\u8BFB\u4E00\u904D" : "\u6211\u7684\u9605\u8BFB\u4E66\u67B6"}<span>${selectedNotes().length}</span></h2>${overview ? '<button class="zj-text-button" data-action="navigate" data-page="shelf">\u67E5\u770B\u5168\u90E8' + icon("arrowRight") + "</button>" : ""}</div>${toolbar()}${cards()}</section>`}<footer class="zj-footer"><span>${icon("leaf")}\u628A\u597D\u5947\u5FC3\uFF0C\u7559\u5728\u65E5\u5E38\u91CC\u3002</span><span>\u77E5\u95F4 \xB7 \u672C\u5730\u751F\u957F</span></footer></div></main>`;
          theme();
          if (state.page === "graph") mountGraph();
          if (overview) mountCarousel();
          if (preserve) {
            const input2 = app.querySelector('[data-role="search"]');
            input2.focus();
            input2.setSelectionRange(selection, selection);
          } else if (focusAction) {
            [...app.querySelectorAll("[data-action]")].find((el) => Object.entries(focusAction).every(([k, v]) => el.dataset[k] === v))?.focus();
          }
        }
        async function refresh() {
          if (destroyed) return;
          if (refreshing) {
            refreshAgain = true;
            return refreshing;
          }
          refreshing = (async () => {
            do {
              refreshAgain = false;
              settings = { ...settings, ...await adapter.getSettings() };
              notes = await adapter.getNotes();
              notes = Array.isArray(notes) ? notes : [];
              if (!destroyed) render();
            } while (refreshAgain && !destroyed);
          })();
          try {
            await refreshing;
            if (!destroyed && !unsubscribe && adapter.subscribe) unsubscribe = adapter.subscribe(() => refresh().catch((error) => toast(error.message)));
          } finally {
            refreshing = null;
          }
        }
        function navigate(page) {
          state.page = page;
          state.category = "";
          state.status = "\u5168\u90E8";
          state.absorption = page === "pending" ? "\u5F85\u6C89\u6DC0" : "";
          state.mobile = false;
          if (page === "pending") state.status = "\u5DF2\u8BFB";
          state.query = "";
          render();
          app.querySelector(".zj-main").scrollTop = 0;
          if (!root.classList.contains("zj-native") && doc.scrollingElement) doc.scrollingElement.scrollTop = 0;
        }
        function closeModal() {
          modalToken++;
          modal = null;
          layer.replaceChildren();
          app.inert = false;
          if (lastFocus && lastFocus.isConnected) lastFocus.focus();
          else app.querySelector(".zj-search-input")?.focus();
        }
        function modalShell(title, content, footer, drawer = false) {
          app.inert = true;
          layer.innerHTML = `<div class="zj-overlay" data-theme="${escape(settings.theme || "light")}"><button class="zj-scrim" data-action="close" aria-label="\u5173\u95ED\u7A97\u53E3" tabindex="-1"></button><section class="${drawer ? "zj-drawer" : "zj-dialog"}" role="dialog" aria-modal="true" aria-labelledby="zj-dialog-title"><div class="zj-dialog-header"><h2 id="zj-dialog-title">${title}</h2><button class="zj-icon-button" data-action="close" aria-label="\u5173\u95ED\u7A97\u53E3">${icon("close")}</button></div>${content}${footer || ""}</section></div>`;
          (layer.querySelector("input, select, textarea") || layer.querySelector("button:not(.zj-scrim)"))?.focus();
        }
        async function detail(path) {
          const note = notes.find((n) => n.path === path);
          if (!note) {
            toast("\u8FD9\u7BC7\u7B14\u8BB0\u5DF2\u79FB\u52A8\u6216\u5220\u9664\uFF0C\u8BF7\u5237\u65B0\u540E\u518D\u8BD5\u3002");
            return;
          }
          lastFocus = doc.activeElement;
          modal = { kind: "detail", path };
          const token = ++modalToken;
          modalShell("\u7B14\u8BB0\u8BE6\u60C5", `<div class="zj-dialog-body"><div class="zj-detail-meta"><span>${escape(note.category)}</span><span>${shortDate(note.modified)} \u66F4\u65B0</span></div><h3 class="zj-detail-title">${escape(note.title)}</h3><div class="zj-tags">${(note.tags || []).map((t) => `<span># ${escape(t)}</span>`).join("")}</div>${note.readonly ? '<p class="zj-readonly">' + icon("archive") + "\u539F\u59CB\u8D44\u6599\u4FDD\u6301\u53EA\u8BFB\u3002\u53EF\u4EE5\u9605\u8BFB\u3001\u6DFB\u52A0\u4E66\u7B7E\u548C\u5728 Obsidian \u4E2D\u6253\u5F00\u3002</p>" : ""}<div class="zj-form-grid"><label class="zj-field">\u9605\u8BFB\u72B6\u6001<select data-role="reading" aria-label="\u9605\u8BFB\u72B6\u6001" ${note.readonly ? "disabled" : ""}>${["\u672A\u8BFB", "\u5728\u8BFB", "\u5DF2\u8BFB"].map((s) => `<option ${note.reading === s ? "selected" : ""}>${s}</option>`).join("")}</select></label><label class="zj-field">\u5438\u6536\u72B6\u6001<select data-role="absorption" aria-label="\u5438\u6536\u72B6\u6001" ${note.readonly ? "disabled" : ""}>${["\u5F85\u6C89\u6DC0", "\u5DF2\u6C89\u6DC0", "\u65E0\u9700\u6C89\u6DC0"].map((s) => `<option ${note.absorption === s ? "selected" : ""}>${s}</option>`).join("")}</select></label></div><div class="zj-detail-content" aria-busy="true"><div class="zj-skeleton"></div><div class="zj-skeleton"></div><div class="zj-skeleton"></div></div></div>`, `<div class="zj-dialog-footer"><span class="zj-detail-path" title="${escape(note.path)}">${icon("file")}${escape(note.path)}</span><button class="zj-button primary" data-action="openNote" data-path="${escape(note.path)}">\u5728 Obsidian \u4E2D\u6253\u5F00${icon("arrowUpRight")}</button></div>`, true);
          try {
            let content = String(await adapter.readNote(path));
            if (destroyed || token !== modalToken) return;
            content = content.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "").trim();
            const lines = content.split("\n");
            if (lines[0].replace(/^#\s+/, "").trim() === note.title) {
              lines.shift();
              content = lines.join("\n").trim();
            }
            const el = layer.querySelector(".zj-detail-content");
            el.replaceChildren();
            if (adapter.renderMarkdown) await adapter.renderMarkdown(content, el, path);
            else el.textContent = content;
            el.removeAttribute("aria-busy");
          } catch (error) {
            if (token === modalToken) {
              layer.querySelector(".zj-detail-content").textContent = "\u7B14\u8BB0\u8BFB\u53D6\u5931\u8D25\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u3002";
              toast(error.message || "\u7B14\u8BB0\u8BFB\u53D6\u5931\u8D25");
            }
          }
        }
        function createDialog() {
          lastFocus = doc.activeElement;
          modal = { kind: "create" };
          modalShell("\u7ED9\u4E00\u4E2A\u60F3\u6CD5\uFF0C\u7559\u4E2A\u4F4D\u7F6E", `<form data-form="create"><div class="zj-dialog-body"><p class="zj-form-intro">\u4ECE\u4E00\u53E5\u8BDD\u5F00\u59CB\uFF0C\u8BA9\u597D\u5947\u5FC3\u6162\u6162\u957F\u6210\u77E5\u8BC6\u3002</p><label class="zj-field">\u7B14\u8BB0\u6807\u9898<input name="title" required maxlength="100" placeholder="\u8FD9\u4E2A\u60F3\u6CD5\u53EB\u4EC0\u4E48\uFF1F" autocomplete="off"></label><div class="zj-form-grid"><label class="zj-field">\u5B58\u653E\u5206\u533A<select name="folder">${folders.map((f, i) => `<option value="${f}" ${f === "05-\u7075\u611F" ? "selected" : ""}>${categories[i]}</option>`).join("")}</select></label><label class="zj-field">\u6807\u7B7E<input name="tags" placeholder="\u5B66\u4E60, \u7075\u611F" autocomplete="off"></label></div><label class="zj-field">\u6B64\u523B\u7684\u60F3\u6CD5<textarea name="content" rows="6" placeholder="\u5199\u4E0B\u4E00\u4E2A\u53D1\u73B0\u3001\u4E00\u4E2A\u95EE\u9898\uFF0C\u6216\u4E00\u6BB5\u60F3\u7EE7\u7EED\u63A2\u7D22\u7684\u8BDD\u3002"></textarea></label><p class="zj-panel-note">\u4FDD\u5B58\u4E3A\u672C\u5730 Markdown \u7B14\u8BB0\uFF0C\u4F7F\u7528\u77E5\u8BC6\u5E93\u7684\u9875\u9762\u683C\u5F0F\u3002</p></div><div class="zj-dialog-footer"><button class="zj-button secondary" type="button" data-action="close">\u518D\u60F3\u60F3</button><button class="zj-button primary" type="submit">${icon("plus")}\u4FDD\u5B58\u60F3\u6CD5</button></div></form>`);
        }
        function settingsDialog() {
          lastFocus = doc.activeElement;
          modal = { kind: "settings" };
          modalShell("\u8BA9\u7A7A\u95F4\u66F4\u50CF\u4F60", `<form data-form="settings"><div class="zj-dialog-body"><label class="zj-field">\u663E\u793A\u540D\u79F0<input name="displayName" value="${escape(settings.displayName || "Y")}" maxlength="30" required></label><label class="zj-field">\u754C\u9762\u4E3B\u9898<select name="theme"><option value="light" ${settings.theme !== "dark" ? "selected" : ""}>\u51B0\u84DD\u6D45\u8272 \xB7 \u6D41\u5149\u73BB\u7483</option><option value="dark" ${settings.theme === "dark" ? "selected" : ""}>\u661F\u591C\u6DF1\u8272 \xB7 \u6781\u5149\u73BB\u7483</option></select></label><label class="zj-field">\u52A8\u6001\u6548\u679C<select name="motion"><option value="full" ${!settings.motion || settings.motion === "full" ? "selected" : ""}>\u4E30\u5BCC \xB7 \u6D41\u4F53\u3001\u7C92\u5B50\u4E0E 3D \u60AC\u6D6E</option><option value="subtle" ${settings.motion === "subtle" ? "selected" : ""}>\u8F7B\u67D4 \xB7 \u51CF\u5C11\u7C92\u5B50\u4E0E\u60AC\u6D6E\u5E45\u5EA6</option><option value="off" ${settings.motion === "off" ? "selected" : ""}>\u9759\u6B62 \xB7 \u4E13\u6CE8\u9605\u8BFB</option></select></label><label class="zj-field">\u4ECE\u754C\u9762\u6392\u9664\u7684\u8DEF\u5F84<textarea name="excludedPaths" rows="3" placeholder="\u6BCF\u884C\u4E00\u4E2A\u76EE\u5F55\u8DEF\u5F84">${escape((settings.excludedPaths || []).join("\n"))}</textarea></label><p class="zj-panel-note">\u6392\u9664\u53EA\u5F71\u54CD\u754C\u9762\u7D22\u5F15\u3002\u79C1\u5BC6\u76EE\u5F55\u9ED8\u8BA4\u4E0D\u5C55\u793A\uFF0C\u539F\u59CB\u8D44\u6599\u4FDD\u6301\u53EA\u8BFB\u3002</p><div class="zj-settings-about">${icon("leaf")}<div><strong>\u77E5\u95F4 \xB7 Knowledge Studio</strong><p>\u8FDE\u63A5\u4F60\u7684\u77E5\u8BC6\u5B87\u5B99\u3002<br>\u6240\u6709\u6570\u636E\u5747\u5728\u672C\u5730\u5904\u7406\u3002</p></div></div></div><div class="zj-dialog-footer"><button class="zj-button secondary" type="button" data-action="close">\u53D6\u6D88</button><button class="zj-button primary" type="submit">\u4FDD\u5B58\u8BBE\u7F6E${icon("check")}</button></div></form>`);
        }
        async function action(event) {
          const button = event.target.closest("[data-action]");
          if (!button || !root.contains(button)) return;
          const name = button.dataset.action;
          if (button.tagName === "A") event.preventDefault();
          try {
            switch (name) {
              case "navigate":
                navigate(button.dataset.page);
                break;
              case "category":
                state.page = "shelf";
                state.category = button.dataset.category;
                state.status = "\u5168\u90E8";
                state.absorption = "";
                state.query = "";
                state.mobile = false;
                render();
                break;
              case "status":
                state.status = button.dataset.status;
                render();
                break;
              case "layout":
                state.layout = button.dataset.layout;
                render();
                break;
              case "detail":
                await detail(button.dataset.path);
                break;
              case "openNote":
                await adapter.openNote(button.dataset.path);
                break;
              case "create":
                createDialog();
                break;
              case "settings":
                settingsDialog();
                break;
              case "close":
                closeModal();
                break;
              case "menu":
                state.mobile = !state.mobile;
                render();
                break;
              case "clearSearch":
                state.query = "";
                render();
                app.querySelector('[data-role="search"]').focus();
                break;
              case "resetFilters":
                navigate("shelf");
                break;
              case "year":
                state.year += Number(button.dataset.step);
                render();
                break;
              case "zoom":
                graphView?.zoomBy(Number(button.dataset.step));
                break;
              case "fitGraph":
                graphView?.fit();
                break;
              case "nativeGraph":
                await adapter.openGraph?.();
                break;
              case "refresh":
                await refresh();
                break;
              case "theme":
                settings.theme = settings.theme === "dark" ? "light" : "dark";
                await adapter.saveSettings({ theme: settings.theme });
                theme();
                render();
                toast(settings.theme === "dark" ? "\u5DF2\u5207\u6362\u5230\u661F\u591C\u73BB\u7483" : "\u5DF2\u5207\u6362\u5230\u51B0\u84DD\u73BB\u7483");
                break;
              case "bookmark": {
                const bookmarks = new Set(settings.bookmarks || []), path = button.dataset.path;
                bookmarks.has(path) ? bookmarks.delete(path) : bookmarks.add(path);
                settings.bookmarks = [...bookmarks];
                await adapter.saveSettings({ bookmarks: settings.bookmarks });
                render();
                toast(bookmarks.has(path) ? "\u5DF2\u52A0\u5165\u6211\u7684\u4E66\u7B7E" : "\u5DF2\u53D6\u6D88\u4E66\u7B7E");
                break;
              }
              case "stat":
                navigate("shelf");
                if (button.dataset.route === "reading") state.status = "\u5728\u8BFB";
                if (button.dataset.route === "read") state.status = "\u5DF2\u8BFB";
                if (button.dataset.route === "absorbed") state.absorption = "\u5DF2\u6C89\u6DC0";
                render();
                break;
            }
          } catch (error) {
            toast(error.message || "\u64CD\u4F5C\u672A\u5B8C\u6210\uFF0C\u8BF7\u91CD\u8BD5\u3002");
          }
        }
        function input(event) {
          if (event.target.dataset.role === "search") {
            state.query = event.target.value;
            clearTimeout(inputTimer);
            if (!composing && !event.isComposing) inputTimer = setTimeout(render, 100);
          }
        }
        function compositionStart(event) {
          if (event.target.dataset.role === "search") {
            composing = true;
            clearTimeout(inputTimer);
          }
        }
        function compositionEnd(event) {
          if (event.target.dataset.role === "search") {
            composing = false;
            state.query = event.target.value;
            render();
          }
        }
        async function change(event) {
          const role = event.target.dataset.role;
          if (role === "sort") {
            state.sort = event.target.value;
            render();
          }
          if (role === "graphCategory") {
            state.graphCategory = event.target.value;
            render();
            app.querySelector('[data-role="graphCategory"]')?.focus();
          }
          if (role === "graphOrphans") {
            state.showOrphans = event.target.checked;
            render();
            app.querySelector('[data-role="graphOrphans"]')?.focus();
          }
          if ((role === "reading" || role === "absorption") && modal?.kind === "detail") {
            const path = modal.path, target = event.target, previous = notes.find((n) => n.path === path)?.[role];
            target.disabled = true;
            try {
              await adapter.updateNote(path, { [role]: target.value });
              await refresh();
              toast(role === "reading" ? "\u9605\u8BFB\u72B6\u6001\u5DF2\u4FDD\u5B58\u5230\u7B14\u8BB0" : "\u5438\u6536\u72B6\u6001\u5DF2\u4FDD\u5B58\u5230\u7B14\u8BB0");
            } catch (error) {
              target.value = previous;
              toast(error.message || "\u72B6\u6001\u4FDD\u5B58\u5931\u8D25");
            } finally {
              target.disabled = false;
            }
          }
        }
        async function submit(event) {
          const form = event.target;
          if (!form.dataset.form) return;
          event.preventDefault();
          const data = new FormData(form), button = form.querySelector('[type="submit"]'), startedModal = modal;
          button.disabled = true;
          try {
            if (form.dataset.form === "create") {
              const title = String(data.get("title")).trim();
              if (!title) throw new Error("\u8BF7\u4E3A\u8FD9\u4E2A\u60F3\u6CD5\u586B\u5199\u6807\u9898\u3002");
              const path = await adapter.createNote({ title, folder: String(data.get("folder")), tags: String(data.get("tags") || "").split(/[,，\s]+/).filter(Boolean), content: String(data.get("content") || "") });
              await refresh();
              toast("\u65B0\u60F3\u6CD5\u5DF2\u4FDD\u5B58");
              if (modal === startedModal && !destroyed) {
                closeModal();
                await detail(path);
              }
            } else {
              const patch = { displayName: String(data.get("displayName")).trim() || "Y", theme: String(data.get("theme")), motion: String(data.get("motion") || "full"), excludedPaths: String(data.get("excludedPaths") || "").split("\n").map((s) => s.trim()).filter(Boolean) };
              await adapter.saveSettings(patch);
              settings = { ...settings, ...patch };
              if (modal === startedModal && !destroyed) closeModal();
              await refresh();
              toast("\u7A7A\u95F4\u8BBE\u7F6E\u5DF2\u4FDD\u5B58");
            }
          } catch (error) {
            if (error.createdPath) {
              try {
                await refresh();
                if (modal === startedModal && !destroyed) {
                  closeModal();
                  await detail(error.createdPath);
                }
              } catch (_) {
              }
            }
            toast(error.message || "\u4FDD\u5B58\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002");
          } finally {
            if (button.isConnected) button.disabled = false;
          }
        }
        function keydown(event) {
          if (adapter.isActive && !adapter.isActive()) return;
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" && !modal) {
            event.preventDefault();
            app.querySelector('[data-role="search"]').focus();
          }
          if (event.key === "Escape") {
            if (modal) {
              event.preventDefault();
              closeModal();
            } else if (state.mobile) {
              state.mobile = false;
              render();
            } else if (state.query) {
              state.query = "";
              render();
            }
          }
          if (event.key === "Tab" && modal) {
            const focusable = [...layer.querySelectorAll('button:not([disabled]):not([tabindex="-1"]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')];
            const first = focusable[0], last = focusable[focusable.length - 1];
            if (event.shiftKey && (doc.activeElement === first || !layer.contains(doc.activeElement))) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && (doc.activeElement === last || !layer.contains(doc.activeElement))) {
              event.preventDefault();
              first?.focus();
            }
          }
        }
        root.addEventListener("click", action);
        root.addEventListener("input", input);
        root.addEventListener("compositionstart", compositionStart);
        root.addEventListener("compositionend", compositionEnd);
        root.addEventListener("change", change);
        root.addEventListener("submit", submit);
        doc.addEventListener("keydown", keydown);
        const ready = (async () => {
          try {
            settings = await adapter.getSettings() || {};
            await refresh();
          } catch (error) {
            app.innerHTML = `<div class="zj-empty"><h3>\u77E5\u8BC6\u5E93\u6682\u65F6\u8FD8\u6CA1\u6709\u51C6\u5907\u597D</h3><p>${escape(error.message)}</p><button class="zj-button secondary" data-action="refresh">\u91CD\u65B0\u8FDE\u63A5</button></div>`;
          }
        })();
        return { ready, refresh, destroy() {
          destroyed = true;
          modalToken++;
          clearTimeout(inputTimer);
          clearTimeout(toastTimer);
          unsubscribe?.();
          graphView?.destroy();
          graphView = null;
          carouselView?.destroy();
          carouselView = null;
          effects?.destroy();
          root.removeEventListener("click", action);
          root.removeEventListener("input", input);
          root.removeEventListener("compositionstart", compositionStart);
          root.removeEventListener("compositionend", compositionEnd);
          root.removeEventListener("change", change);
          root.removeEventListener("submit", submit);
          doc.removeEventListener("keydown", keydown);
          root.replaceChildren();
          root.classList.remove("zj-host");
        } };
      }
      return { mount };
    });
  }
});

// icons.js
var require_icons = __commonJS({
  "icons.js"(exports2, module2) {
    (function(root, factory) {
      if (typeof module2 === "object" && module2.exports) module2.exports = factory();
      else if (typeof define === "function" && define.amd) define([], factory);
      else root.ZhijianIcons = factory();
    })(typeof globalThis !== "undefined" ? globalThis : exports2, function() {
      "use strict";
      var icons = {
        "leaf": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M223.45,40.07a8,8,0,0,0-7.52-7.52C139.8,28.08,78.82,51,52.82,94a87.09,87.09,0,0,0-12.76,49c.57,15.92,5.21,32,13.79,47.85l-19.51,19.5a8,8,0,0,0,11.32,11.32l19.5-19.51C81,210.73,97.09,215.37,113,215.94q1.67.06,3.33.06A86.93,86.93,0,0,0,162,203.18C205,177.18,227.93,116.21,223.45,40.07ZM153.75,189.5c-22.75,13.78-49.68,14-76.71.77l88.63-88.62a8,8,0,0,0-11.32-11.32L65.73,179c-13.19-27-13-54,.77-76.71,22.09-36.47,74.6-56.44,141.31-54.06C210.2,114.89,190.22,167.41,153.75,189.5Z"/></svg>',
        "squares": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M104,40H56A16,16,0,0,0,40,56v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,104,40Zm0,64H56V56h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V56A16,16,0,0,0,200,40Zm0,64H152V56h48v48Zm-96,32H56a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,104,136Zm0,64H56V152h48v48Zm96-64H152a16,16,0,0,0-16,16v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V152A16,16,0,0,0,200,136Zm0,64H152V152h48v48Z"/></svg>',
        "book": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M232,48H160a40,40,0,0,0-32,16A40,40,0,0,0,96,48H24a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8H96a24,24,0,0,1,24,24,8,8,0,0,0,16,0,24,24,0,0,1,24-24h72a8,8,0,0,0,8-8V56A8,8,0,0,0,232,48ZM96,192H32V64H96a24,24,0,0,1,24,24V200A39.81,39.81,0,0,0,96,192Zm128,0H160a39.81,39.81,0,0,0-24,8V88a24,24,0,0,1,24-24h64Z"/></svg>',
        "stack": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M230.91,172A8,8,0,0,1,228,182.91l-96,56a8,8,0,0,1-8.06,0l-96-56A8,8,0,0,1,36,169.09l92,53.65,92-53.65A8,8,0,0,1,230.91,172ZM220,121.09l-92,53.65L36,121.09A8,8,0,0,0,28,134.91l96,56a8,8,0,0,0,8.06,0l96-56A8,8,0,1,0,220,121.09ZM24,80a8,8,0,0,1,4-6.91l96-56a8,8,0,0,1,8.06,0l96,56a8,8,0,0,1,0,13.82l-96,56a8,8,0,0,1-8.06,0l-96-56A8,8,0,0,1,24,80Zm23.88,0L128,126.74,208.12,80,128,33.26Z"/></svg>',
        "graph": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M200,152a31.84,31.84,0,0,0-19.53,6.68l-23.11-18A31.65,31.65,0,0,0,160,128c0-.74,0-1.48-.08-2.21l13.23-4.41A32,32,0,1,0,168,104c0,.74,0,1.48.08,2.21l-13.23,4.41A32,32,0,0,0,128,96a32.59,32.59,0,0,0-5.27.44L115.89,81A32,32,0,1,0,96,88a32.59,32.59,0,0,0,5.27-.44l6.84,15.4a31.92,31.92,0,0,0-8.57,39.64L73.83,165.44a32.06,32.06,0,1,0,10.63,12l25.71-22.84a31.91,31.91,0,0,0,37.36-1.24l23.11,18A31.65,31.65,0,0,0,168,184a32,32,0,1,0,32-32Zm0-64a16,16,0,1,1-16,16A16,16,0,0,1,200,88ZM80,56A16,16,0,1,1,96,72,16,16,0,0,1,80,56ZM56,208a16,16,0,1,1,16-16A16,16,0,0,1,56,208Zm56-80a16,16,0,1,1,16,16A16,16,0,0,1,112,128Zm88,72a16,16,0,1,1,16-16A16,16,0,0,1,200,200Z"/></svg>',
        "sparkles": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z"/></svg>',
        "folder": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M216,72H130.67L102.93,51.2a16.12,16.12,0,0,0-9.6-3.2H40A16,16,0,0,0,24,64V200a16,16,0,0,0,16,16H216.89A15.13,15.13,0,0,0,232,200.89V88A16,16,0,0,0,216,72Zm0,128H40V64H93.33L123.2,86.4A8,8,0,0,0,128,88h88Z"/></svg>',
        "briefcase": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M216,56H176V48a24,24,0,0,0-24-24H104A24,24,0,0,0,80,48v8H40A16,16,0,0,0,24,72V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V72A16,16,0,0,0,216,56ZM96,48a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96ZM216,72v41.61A184,184,0,0,1,128,136a184.07,184.07,0,0,1-88-22.38V72Zm0,128H40V131.64A200.19,200.19,0,0,0,128,152a200.25,200.25,0,0,0,88-20.37V200ZM104,112a8,8,0,0,1,8-8h32a8,8,0,0,1,0,16H112A8,8,0,0,1,104,112Z"/></svg>',
        "cube": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M223.68,66.15,135.68,18h0a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32h0l80.34,44L128,120,47.66,76ZM40,90l80,43.78v85.79L40,175.82Zm96,129.57V133.82L216,90v85.78Z"/></svg>',
        "archive": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M224,48H32A16,16,0,0,0,16,64V88a16,16,0,0,0,16,16v88a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V104a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48ZM208,192H48V104H208ZM224,88H32V64H224V88ZM96,136a8,8,0,0,1,8-8h48a8,8,0,0,1,0,16H104A8,8,0,0,1,96,136Z"/></svg>',
        "lightbulb": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M176,232a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,232Zm40-128a87.55,87.55,0,0,1-33.64,69.21A16.24,16.24,0,0,0,176,186v6a16,16,0,0,1-16,16H96a16,16,0,0,1-16-16v-6a16,16,0,0,0-6.23-12.66A87.59,87.59,0,0,1,40,104.49C39.74,56.83,78.26,17.14,125.88,16A88,88,0,0,1,216,104Zm-16,0a72,72,0,0,0-73.74-72c-39,.92-70.47,33.39-70.26,72.39a71.65,71.65,0,0,0,27.64,56.3A32,32,0,0,1,96,186v6h64v-6a32.15,32.15,0,0,1,12.47-25.35A71.65,71.65,0,0,0,200,104Zm-16.11-9.34a57.6,57.6,0,0,0-46.56-46.55,8,8,0,0,0-2.66,15.78c16.57,2.79,30.63,16.85,33.44,33.45A8,8,0,0,0,176,104a9,9,0,0,0,1.35-.11A8,8,0,0,0,183.89,94.66Z"/></svg>',
        "code": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M69.12,94.15,28.5,128l40.62,33.85a8,8,0,1,1-10.24,12.29l-48-40a8,8,0,0,1,0-12.29l48-40a8,8,0,0,1,10.24,12.3Zm176,27.7-48-40a8,8,0,1,0-10.24,12.3L227.5,128l-40.62,33.85a8,8,0,1,0,10.24,12.29l48-40a8,8,0,0,0,0-12.29ZM162.73,32.48a8,8,0,0,0-10.25,4.79l-64,176a8,8,0,0,0,4.79,10.26A8.14,8.14,0,0,0,96,224a8,8,0,0,0,7.52-5.27l64-176A8,8,0,0,0,162.73,32.48Z"/></svg>',
        "search": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/></svg>',
        "plus": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>',
        "arrowRight": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/></svg>',
        "arrowUpRight": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z"/></svg>',
        "chevronDown": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/></svg>',
        "chevronLeft": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"/></svg>',
        "chevronRight": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/></svg>',
        "sun": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-16-16A8,8,0,0,0,42.34,53.66Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM192,72a8,8,0,0,0,5.66-2.34l16-16a8,8,0,0,0-11.32-11.32l-16,16A8,8,0,0,0,192,72Zm5.66,114.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32ZM48,128a8,8,0,0,0-8-8H16a8,8,0,0,0,0,16H40A8,8,0,0,0,48,128Zm80,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V216A8,8,0,0,0,128,208Zm112-88H216a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16Z"/></svg>',
        "moon": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,104.84,104.84,0,0,0-52.91,37A104,104,0,0,0,136,224a103.09,103.09,0,0,0,62.52-20.88,104.84,104.84,0,0,0,37-52.91A8,8,0,0,0,233.54,142.23ZM188.9,190.34A88,88,0,0,1,65.66,67.11a89,89,0,0,1,31.4-26A106,106,0,0,0,96,56,104.11,104.11,0,0,0,200,160a106,106,0,0,0,14.92-1.06A89,89,0,0,1,188.9,190.34Z"/></svg>',
        "settings": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.21,107.21,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.71,107.71,0,0,0-26.25-10.87,8,8,0,0,0-7.06,1.49L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.21,107.21,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8,8,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8,8,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z"/></svg>',
        "bell": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"/></svg>',
        "close": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/></svg>',
        "check": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>',
        "clock": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"/></svg>',
        "more": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128Zm56-12a12,12,0,1,0,12,12A12,12,0,0,0,196,116ZM60,116a12,12,0,1,0,12,12A12,12,0,0,0,60,116Z"/></svg>',
        "external": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M224,104a8,8,0,0,1-16,0V59.32l-66.33,66.34a8,8,0,0,1-11.32-11.32L196.68,48H152a8,8,0,0,1,0-16h64a8,8,0,0,1,8,8Zm-40,24a8,8,0,0,0-8,8v72H48V80h72a8,8,0,0,0,0-16H48A16,16,0,0,0,32,80V208a16,16,0,0,0,16,16H176a16,16,0,0,0,16-16V136A8,8,0,0,0,184,128Z"/></svg>',
        "calendar": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z"/></svg>',
        "list": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"/></svg>',
        "filter": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M200,136a8,8,0,0,1-8,8H64a8,8,0,0,1,0-16H192A8,8,0,0,1,200,136Zm32-56H24a8,8,0,0,0,0,16H232a8,8,0,0,0,0-16Zm-80,96H104a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Z"/></svg>',
        "file": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Zm-32-80a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,136Zm0,32a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,168Z"/></svg>',
        "target": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M221.87,83.16A104.1,104.1,0,1,1,195.67,49l22.67-22.68a8,8,0,0,1,11.32,11.32l-96,96a8,8,0,0,1-11.32-11.32l27.72-27.72a40,40,0,1,0,17.87,31.09,8,8,0,1,1,16-.9,56,56,0,1,1-22.38-41.65L184.3,60.39a87.88,87.88,0,1,0,23.13,29.67,8,8,0,0,1,14.44-6.9Z"/></svg>',
        "bookmark": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M184,32H72A16,16,0,0,0,56,48V224a8,8,0,0,0,12.24,6.78L128,193.43l59.77,37.35A8,8,0,0,0,200,224V48A16,16,0,0,0,184,32Zm0,177.57-51.77-32.35a8,8,0,0,0-8.48,0L72,209.57V48H184Z"/></svg>',
        "link": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M240,88.23a54.43,54.43,0,0,1-16,37L189.25,160a54.27,54.27,0,0,1-38.63,16h-.05A54.63,54.63,0,0,1,96,119.84a8,8,0,0,1,16,.45A38.62,38.62,0,0,0,150.58,160h0a38.39,38.39,0,0,0,27.31-11.31l34.75-34.75a38.63,38.63,0,0,0-54.63-54.63l-11,11A8,8,0,0,1,135.7,59l11-11A54.65,54.65,0,0,1,224,48,54.86,54.86,0,0,1,240,88.23ZM109,185.66l-11,11A38.41,38.41,0,0,1,70.6,208h0a38.63,38.63,0,0,1-27.29-65.94L78,107.31A38.63,38.63,0,0,1,144,135.71a8,8,0,0,0,16,.45A54.86,54.86,0,0,0,144,96a54.65,54.65,0,0,0-77.27,0L32,130.75A54.62,54.62,0,0,0,70.56,224h0a54.28,54.28,0,0,0,38.64-16l11-11A8,8,0,0,0,109,185.66Z"/></svg>',
        "refresh": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M224,48V96a8,8,0,0,1-8,8H168a8,8,0,0,1,0-16h28.69L182.06,73.37a79.56,79.56,0,0,0-56.13-23.43h-.45A79.52,79.52,0,0,0,69.59,72.71,8,8,0,0,1,58.41,61.27a96,96,0,0,1,135,.79L208,76.69V48a8,8,0,0,1,16,0ZM186.41,183.29a80,80,0,0,1-112.47-.66L59.31,168H88a8,8,0,0,0,0-16H40a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V179.31l14.63,14.63A95.43,95.43,0,0,0,130,222.06h.53a95.36,95.36,0,0,0,67.07-27.33,8,8,0,0,0-11.18-11.44Z"/></svg>',
        "download": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V32a8,8,0,0,0-16,0v92.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z"/></svg>',
        "menu": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"/></svg>',
        "circle": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z"/></svg>',
        "arrowDown": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M205.66,149.66l-72,72a8,8,0,0,1-11.32,0l-72-72a8,8,0,0,1,11.32-11.32L120,196.69V40a8,8,0,0,1,16,0V196.69l58.34-58.35a8,8,0,0,1,11.32,11.32Z"/></svg>',
        "inbox": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm0,16V152h-28.7A15.86,15.86,0,0,0,168,156.69L148.69,176H107.31L88,156.69A15.86,15.86,0,0,0,76.69,152H48V48Zm0,160H48V168H76.69L96,187.31A15.86,15.86,0,0,0,107.31,192h41.38A15.86,15.86,0,0,0,160,187.31L179.31,168H208v40Z"/></svg>',
        "feather": '<svg width="24" height="24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M221.28,34.75a64,64,0,0,0-90.49,0L60.69,104A15.9,15.9,0,0,0,56,115.31v73.38L26.34,218.34a8,8,0,0,0,11.32,11.32L67.32,200H140.7A15.92,15.92,0,0,0,152,195.32l0,0,69.23-70A64,64,0,0,0,221.28,34.75ZM142.07,46.06A48,48,0,0,1,211.79,112H155.33l34.35-34.34a8,8,0,0,0-11.32-11.32L120,124.69V67.87ZM72,115.35l32-31.67v57l-32,32ZM140.7,184H83.32l56-56h56.74Z"/></svg>'
      };
      function escape(value) {
        return String(value).replace(/[&<>"']/g, function(c) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
      }
      icons.render = function(name, attributes) {
        var svg = icons[name] || icons.file;
        if (!attributes) return svg;
        var opening = svg.slice(0, svg.indexOf(">"));
        var rest = svg.slice(svg.indexOf(">"));
        Object.keys(attributes).forEach(function(key) {
          if (!/^(?:width|height|class|role|aria-[\w-]+|data-[\w-]+|focusable)$/.test(key)) return;
          var regex = new RegExp(" " + key + '="[^"]*"');
          opening = opening.replace(regex, "") + " " + key + '="' + escape(attributes[key]) + '"';
        });
        return opening + rest;
      };
      return Object.freeze(icons);
    });
  }
});

// fx.js
var require_fx = __commonJS({
  "fx.js"(exports2, module2) {
    (function(root, factory) {
      if (typeof module2 === "object" && module2.exports) module2.exports = factory();
      else root.ZhijianFX = factory();
    })(typeof globalThis !== "undefined" ? globalThis : exports2, function() {
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
        try {
          gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
        } catch (_) {
          return null;
        }
        if (!gl) return null;
        const shaders = [];
        let program = null, buffer = null;
        try {
          let compile = function(type, source) {
            const shader = gl.createShader(type);
            if (!shader) throw new Error("Shader allocation failed");
            shaders.push(shader);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Shader compilation failed");
            return shader;
          };
          const vertex = compile(gl.VERTEX_SHADER, VERTEX), fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
          program = gl.createProgram();
          if (!program) throw new Error("Program allocation failed");
          gl.attachShader(program, vertex);
          gl.attachShader(program, fragment);
          gl.linkProgram(program);
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
              gl.viewport(0, 0, width, height);
              gl.useProgram(program);
              gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
              gl.enableVertexAttribArray(attribute);
              gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
              gl.uniform2f(uniforms.uResolution, width, height);
              gl.uniform2f(uniforms.uPointer, pointer.x, 1 - pointer.y);
              gl.uniform1f(uniforms.uTime, time);
              gl.uniform1f(uniforms.uDark, dark ? 1 : 0);
              gl.uniform1f(uniforms.uMotion, strength);
              gl.drawArrays(gl.TRIANGLES, 0, 6);
            },
            destroy(loseContext = false) {
              if (!gl.isContextLost()) {
                gl.deleteBuffer(buffer);
                gl.deleteProgram(program);
                for (const shader of shaders) gl.deleteShader(shader);
                if (loseContext) gl.getExtension("WEBGL_lose_context")?.loseContext();
              }
            }
          };
        } catch (error) {
          if (buffer) gl.deleteBuffer(buffer);
          if (program) gl.deleteProgram(program);
          for (const shader of shaders) gl.deleteShader(shader);
          console.debug("\u77E5\u95F4\uFF1A\u6D41\u5149\u4F7F\u7528 CSS \u80CC\u666F", error.message);
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
        function random() {
          seed = Math.imul(seed, 1664525) + 1013904223 >>> 0;
          return seed / 4294967296;
        }
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
        try {
          context = particleCanvas.getContext("2d", { alpha: true });
        } catch (_) {
        }
        scene.dataset.renderer = gpu ? "webgl" : "css";
        auroraCanvas.style.opacity = gpu ? "1" : "0";
        function listen(target, event, callback, listenerOptions) {
          target.addEventListener(event, callback, listenerOptions);
          disposers.push(() => target.removeEventListener(event, callback, listenerOptions));
        }
        function isStatic() {
          return configuration.motion === "off" || Boolean(media?.matches);
        }
        function strength() {
          return isStatic() ? 0 : configuration.motion === "subtle" ? 0.35 : 1;
        }
        function resetCard() {
          if (!activeCard) return;
          activeCard.style.removeProperty("--tilt-x");
          activeCard.style.removeProperty("--tilt-y");
          activeCard.style.removeProperty("--shine-x");
          activeCard.style.removeProperty("--shine-y");
          activeCard.classList.remove("is-tilting");
          activeCard = null;
        }
        function stop() {
          if (frame) win.cancelAnimationFrame(frame);
          frame = 0;
        }
        function shouldAnimate() {
          return !destroyed && !doc.hidden && !isStatic() && width > 0 && height > 0;
        }
        function schedule() {
          if (!frame && shouldAnimate()) {
            lastDraw = win.performance.now();
            frame = win.requestAnimationFrame(tick);
          }
        }
        function syncSettings() {
          if (destroyed) return;
          const saved = getSettings() || {};
          const next = { theme: saved.theme === "dark" ? "dark" : "light", motion: ["full", "subtle", "off"].includes(saved.motion) ? saved.motion : "full" };
          const changed = next.theme !== configuration.theme || next.motion !== configuration.motion;
          configuration = next;
          scene.dataset.theme = next.theme;
          scene.dataset.motion = media?.matches ? "off" : next.motion;
          if (app.dataset.motion !== next.motion) app.dataset.motion = next.motion;
          particleCanvas.style.opacity = next.motion === "off" ? "0" : "1";
          if (isStatic()) {
            stop();
            resetCard();
          }
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
          width = nextWidth;
          height = nextHeight;
          ratio = nextRatio;
          const auroraRatio = Math.min(ratio, Math.sqrt(12e5 / Math.max(1, width * height)));
          auroraCanvas.width = Math.max(1, Math.round(width * auroraRatio));
          auroraCanvas.height = Math.max(1, Math.round(height * auroraRatio));
          particleCanvas.width = Math.max(1, Math.round(width * ratio));
          particleCanvas.height = Math.max(1, Math.round(height * ratio));
          if (context) context.setTransform(ratio, 0, 0, ratio, 0, 0);
          replenish();
          for (const particle of particles) {
            particle.lastX = null;
            particle.lastY = null;
          }
          draw();
          if (shouldAnimate()) schedule();
          else stop();
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
            const flowY = (particle.y + time * 0.013 * particle.speed * amount + 1.3) % 2.6 - 1.3;
            let x = width * 0.5 + flowX * width * 0.54 * depth;
            let y = height * 0.5 + flowY * height * 0.54 * depth;
            x += (pointer.x - 0.5) * 18 * depth * amount;
            y += (pointer.y - 0.5) * 12 * depth * amount;
            const dx = pointerX - x, dy = pointerY - y, distance = Math.sqrt(dx * dx + dy * dy);
            if (pointer.active && distance < 200) {
              const attraction = (1 - distance / 200) * 0.055 * amount * depth;
              x += dx * attraction;
              y += dy * attraction;
            }
            const alpha = (dark ? 0.23 : 0.21) + depth * (dark ? 0.25 : 0.19);
            const radius = particle.radius * depth;
            projections[index] = { x, y, alpha };
            if (x < -30 || x > width + 30 || y < -30 || y > height + 30) {
              particle.lastX = null;
              particle.lastY = null;
              continue;
            }
            if (particle.lastX !== null && amount && distance < 220 && pointer.active) {
              context.beginPath();
              context.moveTo(particle.lastX, particle.lastY);
              context.lineTo(x, y);
              context.strokeStyle = `rgba(${color},${alpha * 0.32})`;
              context.lineWidth = 0.55;
              context.stroke();
            }
            if (index % 23 === 0) {
              const glow = context.createRadialGradient(x, y, 0, x, y, radius * 6.5);
              glow.addColorStop(0, `rgba(${color},${alpha * 0.38})`);
              glow.addColorStop(1, `rgba(${color},0)`);
              context.fillStyle = glow;
              context.fillRect(x - radius * 6.5, y - radius * 6.5, radius * 13, radius * 13);
            }
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fillStyle = `rgba(${color},${alpha})`;
            context.fill();
            particle.lastX = x;
            particle.lastY = y;
          }
          context.lineWidth = 0.55;
          for (let index = 0; index + 9 < projections.length; index += 13) {
            const from = projections[index], to = projections[index + 9];
            if (!from || !to) continue;
            const distance = Math.hypot(from.x - to.x, from.y - to.y);
            if (distance > 160 || distance < 20) continue;
            context.beginPath();
            context.moveTo(from.x, from.y);
            context.lineTo(to.x, to.y);
            context.strokeStyle = `rgba(${color},${(1 - distance / 160) * (dark ? 0.11 : 0.1)})`;
            context.stroke();
          }
          for (let line = 0; line < 3; line++) {
            const y = height * (0.21 + line * 0.32), drift = Math.sin(time * 0.11 + line * 2.1) * height * 0.028 * amount;
            context.beginPath();
            context.moveTo(-20, y + drift);
            context.bezierCurveTo(width * 0.31, y - height * 0.2, width * 0.65, y + height * 0.22, width + 20, y - drift);
            context.strokeStyle = `rgba(${color},${dark ? 0.065 : 0.075})`;
            context.lineWidth = 0.65;
            context.stroke();
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
          if (now - lastDraw >= 1e3 / 30 - 0.3) {
            elapsed += Math.min(100, now - lastDraw) / 1e3 * (configuration.motion === "subtle" ? 0.45 : 1);
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
          if (!card || !app.contains(card)) {
            resetCard();
            return;
          }
          if (activeCard !== card) {
            resetCard();
            activeCard = card;
          }
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
        function pointerLeave() {
          pendingPointer = null;
          pointer.active = false;
          pointer.targetX = 0.5;
          pointer.targetY = 0.5;
          resetCard();
        }
        listen(app, "pointermove", pointerMove, { passive: true });
        listen(app, "pointerleave", pointerLeave, { passive: true });
        listen(app, "pointerout", (event) => {
          const leaving = event.target?.closest?.(".zj-note-card,.zj-stat,.zj-orbit-card");
          if (leaving && !leaving.contains(event.relatedTarget)) pendingPointer = null;
          if (activeCard && !activeCard.contains(event.relatedTarget)) resetCard();
        }, { passive: true });
        listen(doc, "visibilitychange", () => {
          if (doc.hidden) {
            stop();
            pointerLeave();
          } else {
            draw();
            schedule();
          }
        });
        listen(win, "resize", resize, { passive: true });
        listen(auroraCanvas, "webglcontextlost", (event) => {
          event.preventDefault();
          gpu = null;
          scene.dataset.renderer = "css";
          auroraCanvas.style.opacity = "0";
        });
        listen(auroraCanvas, "webglcontextrestored", () => {
          if (destroyed) return;
          gpu = createGPU(auroraCanvas);
          scene.dataset.renderer = gpu ? "webgl" : "css";
          auroraCanvas.style.opacity = gpu ? "1" : "0";
          draw();
          schedule();
        });
        if (media?.addEventListener) listen(media, "change", syncSettings);
        else if (media?.addListener) {
          media.addListener(syncSettings);
          disposers.push(() => media.removeListener(syncSettings));
        }
        let resizeObserver = null, mutationObserver = null;
        if (win.ResizeObserver) {
          resizeObserver = new win.ResizeObserver(resize);
          resizeObserver.observe(scene);
        }
        if (win.MutationObserver) {
          mutationObserver = new win.MutationObserver(() => {
            if (activeCard && !activeCard.isConnected) resetCard();
            syncSettings();
          });
          mutationObserver.observe(app, { childList: true, attributes: true, attributeFilter: ["data-theme", "data-motion"] });
        }
        syncSettings();
        resize();
        return {
          destroy() {
            if (destroyed) return;
            destroyed = true;
            stop();
            resetCard();
            resizeObserver?.disconnect();
            mutationObserver?.disconnect();
            for (const dispose of disposers) dispose();
            gpu?.destroy(true);
            gpu = null;
            particles = [];
            projections = [];
            auroraCanvas.remove();
            particleCanvas.remove();
            delete scene.dataset.renderer;
            delete scene.dataset.particles;
          }
        };
      }
      return { mount };
    });
  }
});

// fluid.js
var require_fluid = __commonJS({
  "fluid.js"(exports2, module2) {
    (function(root, factory) {
      if (typeof module2 === "object" && module2.exports) module2.exports = factory();
      else root.ZhijianFluid = factory();
    })(typeof globalThis !== "undefined" ? globalThis : exports2, function() {
      "use strict";
      function createFluidLayout(model, options = {}) {
        const nodes = Array.isArray(model && model.nodes) ? model.nodes : [];
        const count = nodes.length, alive = /* @__PURE__ */ new Set(), active = [], links = [], allLinks = [], incident = Array.from({ length: count }, () => []);
        const radii = new Float64Array(count), degree = new Uint32Array(count), ax = new Float64Array(count), ay = new Float64Array(count);
        const lastFixedX = new Float64Array(count), lastFixedY = new Float64Array(count);
        lastFixedX.fill(NaN);
        lastFixedY.fill(NaN);
        const offsets = new Uint32Array(count), gridX = new Int32Array(count), gridY = new Int32Array(count), stack = [];
        const GOLDEN = Math.PI * (3 - Math.sqrt(5));
        const finite = (value, fallback = 0) => Number.isFinite(value) ? Math.max(-1e7, Math.min(1e7, value)) : fallback;
        const dimension = (value, fallback) => Number.isFinite(value) && value > 0 ? Math.min(value, 1e7) : fallback;
        let width = dimension(options.width, 800), height = dimension(options.height, 600);
        let seed = { x: finite(options.seed && options.seed.x), y: finite(options.seed && options.seed.y) };
        let alpha = 0, frame = 0, age = 0, quiet = 0, settled = true, maxRadius = 4;
        for (let i = 0; i < count; i++) {
          radii[i] = Number.isFinite(nodes[i].radius) && nodes[i].radius > 0 ? Math.min(1e3, nodes[i].radius) : 4;
          maxRadius = Math.max(maxRadius, radii[i]);
        }
        for (const edge of Array.isArray(model && model.edges) ? model.edges : []) {
          const a = edge.source, b = edge.target;
          if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a >= count || b >= count || a === b) continue;
          const index = allLinks.length;
          allLinks.push({ a, b, distance: Math.max(54, radii[a] + radii[b] + 38), active: false });
          incident[a].push(index);
          incident[b].push(index);
        }
        function direction(i, j) {
          const a = Math.min(i, j) + 1, b = Math.max(i, j) + 1;
          const angle = ((Math.imul(a, 73856093) ^ Math.imul(b, 19349663)) >>> 0) / 4294967296 * Math.PI * 2;
          const sign = i < j ? 1 : -1;
          return [Math.cos(angle) * sign, Math.sin(angle) * sign];
        }
        function reheat(amount = 0.72) {
          alpha = active.length ? Math.max(alpha, Math.max(0.05, Math.min(1, Number.isFinite(amount) ? amount : 0.72))) : 0;
          age = quiet = 0;
          settled = !active.length;
          return layout;
        }
        function add(index, settings = {}) {
          if (!Number.isInteger(index) || index < 0 || index >= count) return null;
          if (alive.has(index)) return nodes[index];
          const node = nodes[index], angle = (index + 1) * GOLDEN;
          if (settings.preservePosition) {
            node.x = finite(node.x, seed.x);
            node.y = finite(node.y, seed.y);
            node.vx = finite(node.vx);
            node.vy = finite(node.vy);
          } else {
            node.x = seed.x + Math.cos(angle) * 0.065;
            node.y = seed.y + Math.sin(angle) * 0.065;
            node.vx = node.vy = 0;
          }
          if (Number.isFinite(node.fx)) node.x = finite(node.fx);
          if (Number.isFinite(node.fy)) node.y = finite(node.fy);
          alive.add(index);
          active.push(index);
          for (const edgeIndex of incident[index]) {
            const edge = allLinks[edgeIndex];
            if (!edge.active && alive.has(edge.a) && alive.has(edge.b)) {
              edge.active = true;
              links.push(edge);
              degree[edge.a]++;
              degree[edge.b]++;
            }
          }
          reheat();
          return node;
        }
        function partition(indices, x0, y0, size, depth) {
          let x = 0, y = 0, minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
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
          if (indices.length <= 8 || depth >= 20 || maxX - minX < 1e-9 && maxY - minY < 1e-9) {
            cell.indices = indices;
            return cell;
          }
          const half = size / 2, groups = [[], [], [], []];
          for (const i of indices) groups[(nodes[i].x >= x0 + half ? 1 : 0) | (nodes[i].y >= y0 + half ? 2 : 0)].push(i);
          cell.children = groups.map((group, q) => group.length ? partition(group, x0 + (q & 1 ? half : 0), y0 + (q & 2 ? half : 0), half, depth + 1) : null);
          return cell;
        }
        function tree() {
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const i of active) {
            minX = Math.min(minX, nodes[i].x);
            minY = Math.min(minY, nodes[i].y);
            maxX = Math.max(maxX, nodes[i].x);
            maxY = Math.max(maxY, nodes[i].y);
          }
          return partition(active, minX - 1e-3, minY - 1e-3, Math.max(1, maxX - minX, maxY - minY) + 2e-3, 0);
        }
        function charge(i, dx, dy, mass) {
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 1e-9) {
            dx = Math.cos((i + 1) * GOLDEN);
            dy = Math.sin((i + 1) * GOLDEN);
            distance = 1;
          }
          const softened = distance + 4;
          const force = 190 * alpha * mass / (softened * softened * distance);
          ax[i] += dx * force;
          ay[i] += dy * force;
        }
        function repulsion(root) {
          for (const i of active) {
            const node = nodes[i];
            stack.length = 0;
            stack.push(root);
            while (stack.length) {
              const cell = stack.pop();
              const inside = node.x >= cell.x0 && node.x < cell.x0 + cell.size && node.y >= cell.y0 && node.y < cell.y0 + cell.size;
              const dx = node.x - cell.x, dy = node.y - cell.y;
              if (!inside && cell.size * cell.size < 1.44 * (dx * dx + dy * dy)) {
                charge(i, dx, dy, cell.mass);
                continue;
              }
              if (cell.children) {
                for (const child of cell.children) if (child) stack.push(child);
                continue;
              }
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
            ax[edge.a] += dx * force * aX;
            ay[edge.a] += dy * force * aY;
            ax[edge.b] -= dx * force * bX;
            ay[edge.b] -= dy * force * bY;
          }
        }
        function collisions() {
          const cells = /* @__PURE__ */ new Map(), size = maxRadius * 2 + 2;
          for (const i of active) {
            const x = Math.floor(nodes[i].x / size), y = Math.floor(nodes[i].y / size);
            gridX[i] = x;
            gridY[i] = y;
            const key = x + "," + y;
            let bucket = cells.get(key);
            if (!bucket) cells.set(key, bucket = []);
            offsets[i] = bucket.length;
            bucket.push(i);
          }
          function resolve(i, j) {
            if (j <= i) return;
            const a = nodes[i], b = nodes[j], minimum = radii[i] + radii[j] + 2;
            let dx = b.x - a.x, dy = b.y - a.y;
            if (dx * dx + dy * dy >= minimum * minimum) return;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 1e-9) {
              [dx, dy] = direction(j, i);
              distance = 1;
            }
            const force = (minimum - distance) / distance * 0.055;
            const aX = Number.isFinite(a.fx) ? 0 : 1, bX = Number.isFinite(b.fx) ? 0 : 1;
            const aY = Number.isFinite(a.fy) ? 0 : 1, bY = Number.isFinite(b.fy) ? 0 : 1;
            if (aX + bX) {
              ax[i] -= dx * force * aX / (aX + bX);
              ax[j] += dx * force * bX / (aX + bX);
            }
            if (aY + bY) {
              ay[i] -= dy * force * aY / (aY + bY);
              ay[j] += dy * force * bY / (aY + bY);
            }
          }
          for (const i of active) for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
            const bucket = cells.get(gridX[i] + ox + "," + (gridY[i] + oy));
            if (!bucket) continue;
            if (bucket.length <= 24) {
              for (const j of bucket) resolve(i, j);
            } else {
              const start = ox === 0 && oy === 0 ? offsets[i] : (Math.imul(i + 1, 2654435761) >>> 0) % bucket.length;
              const stride = Math.max(1, Math.floor(bucket.length / 12));
              for (let k = 0; k < 12; k++) resolve(i, bucket[(start + k * stride + 1) % bucket.length]);
            }
          }
        }
        function constrain() {
          let moved = false;
          for (const i of active) {
            const node = nodes[i];
            node.x = finite(node.x, seed.x);
            node.y = finite(node.y, seed.y);
            node.vx = finite(node.vx);
            node.vy = finite(node.vy);
            const fixedX = Number.isFinite(node.fx) ? node.fx : NaN, fixedY = Number.isFinite(node.fy) ? node.fy : NaN;
            if ((Number.isFinite(fixedX) || Number.isFinite(lastFixedX[i])) && fixedX !== lastFixedX[i]) moved = true;
            if ((Number.isFinite(fixedY) || Number.isFinite(lastFixedY[i])) && fixedY !== lastFixedY[i]) moved = true;
            lastFixedX[i] = fixedX;
            lastFixedY[i] = fixedY;
            if (Number.isFinite(fixedX)) {
              node.x = finite(fixedX);
              node.vx = 0;
            }
            if (Number.isFinite(fixedY)) {
              node.y = finite(fixedY);
              node.vy = 0;
            }
          }
          return moved;
        }
        function integrate(h) {
          for (const i of active) ax[i] = ay[i] = 0;
          repulsion(tree());
          springForces();
          collisions();
          const gravity = Math.max(1e-3, Math.min(3e-3, 17e-4 * Math.sqrt(600 / Math.max(100, Math.min(width, height))))) * alpha;
          const damping = Math.pow(0.9, h), accelerationLimit = 0.2 + alpha * 0.24;
          let speedMaximum = 0;
          for (const i of active) {
            const node = nodes[i];
            ax[i] -= (node.x - seed.x) * gravity;
            ay[i] -= (node.y - seed.y) * gravity;
            if (Number.isFinite(node.fx)) ax[i] = 0;
            if (Number.isFinite(node.fy)) ay[i] = 0;
            const acceleration = Math.sqrt(ax[i] * ax[i] + ay[i] * ay[i]);
            if (acceleration > accelerationLimit) {
              ax[i] *= accelerationLimit / acceleration;
              ay[i] *= accelerationLimit / acceleration;
            }
            node.vx = (node.vx + ax[i] * h) * damping;
            node.vy = (node.vy + ay[i] * h) * damping;
            const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
            if (speed > 3.2) {
              node.vx *= 3.2 / speed;
              node.vy *= 3.2 / speed;
            }
            if (Number.isFinite(node.fx)) {
              node.x = finite(node.fx);
              node.vx = 0;
            } else node.x = finite(node.x + node.vx * h, seed.x);
            if (Number.isFinite(node.fy)) {
              node.y = finite(node.fy);
              node.vy = 0;
            } else node.y = finite(node.y + node.vy * h, seed.y);
            speedMaximum = Math.max(speedMaximum, Math.sqrt(node.vx * node.vx + node.vy * node.vy));
          }
          alpha *= Math.pow(0.985, h);
          age += h;
          quiet = alpha < 8e-3 && speedMaximum < 0.045 ? quiet + h : 0;
          if (quiet >= 12 || age >= 600) {
            settled = true;
            alpha = 0;
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
        function resize(nextWidth, nextHeight) {
          width = dimension(nextWidth, width);
          height = dimension(nextHeight, height);
          return reheat(0.22);
        }
        function setSeed(value, y) {
          seed = typeof value === "object" && value ? { x: finite(value.x, seed.x), y: finite(value.y, seed.y) } : { x: finite(value, seed.x), y: finite(y, seed.y) };
          return layout;
        }
        const layout = { add, adopt(index) {
          return add(index, { preservePosition: true });
        }, step, reheat, resize, setSeed, alive, get born() {
          return alive.size;
        }, get frame() {
          return frame;
        }, get settled() {
          return settled;
        }, get alpha() {
          return alpha;
        } };
        return layout;
      }
      return { createFluidLayout };
    });
  }
});

// graph.js
var require_graph = __commonJS({
  "graph.js"(exports2, module2) {
    (function(root, factory) {
      if (typeof module2 === "object" && module2.exports) module2.exports = factory(require_fluid());
      else root.ZhijianGraph = factory(root.ZhijianFluid);
    })(typeof globalThis !== "undefined" ? globalThis : exports2, function(Fluid) {
      "use strict";
      function createSimulation(graph, options = {}) {
        const nodes = Array.isArray(graph && graph.nodes) ? graph.nodes : [];
        const count = nodes.length;
        const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
        const POSITION_LIMIT = 1e7;
        const MIN_ALPHA = 1e-3;
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
          radii[i] = Number.isFinite(radius) && radius > 0 ? Math.min(1e3, radius) : 6;
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
          const size = Math.max(1, maxX - minX, maxY - minY) + 2e-3;
          return partition(indices, minX - 1e-3, minY - 1e-3, size, 0);
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
          if (indices.length <= 4 || depth >= 24 || maxX - minX < 1e-9 && maxY - minY < 1e-9) {
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
          const cells = /* @__PURE__ */ new Map();
          const gridX = new Int32Array(count);
          const gridY = new Int32Array(count);
          for (let i = 0; i < count; i++) {
            const node = nodes[i];
            const x = Math.floor(predictedX(node) / cellSize);
            const y = Math.floor(predictedY(node) / cellSize);
            gridX[i] = x;
            gridY[i] = y;
            const key = x + "," + y;
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
                const bucket = cells.get(gridX[i] + ox + "," + (gridY[i] + oy));
                if (!bucket) continue;
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
          get alpha() {
            return alpha;
          },
          get frame() {
            return frame;
          },
          get settled() {
            return settled;
          }
        };
        return simulation;
      }
      const CATEGORIES = ["\u9879\u76EE", "\u8D44\u4EA7", "\u8D44\u6E90", "\u8F85\u52A9", "\u7075\u611F", "Skills"];
      const COLOR_NAMES = ["project", "asset", "resource", "support", "idea", "skill"];
      let mountCounter = 0;
      function normalizedPath(value) {
        const segments = [];
        for (const part of String(value || "").replace(/\\/g, "/").split("/")) {
          if (!part || part === ".") continue;
          if (part === "..") {
            if (!segments.length) return "";
            segments.pop();
          } else segments.push(part);
        }
        return segments.join("/").replace(/\.md$/i, "");
      }
      function linkText(value) {
        if (typeof value !== "string") return "";
        const text = value.trim().replace(/^!?\[\[/, "").replace(/\]\]$/, "").split("|")[0].split("#")[0].trim();
        return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(text) ? "" : text;
      }
      function buildModel(notes, options = {}) {
        const maximum = Math.max(1, Math.min(1e3, Math.floor(Number(options.maxNodes) || 1e3)));
        const unique = /* @__PURE__ */ new Map();
        for (const note of Array.isArray(notes) ? notes : []) {
          if (!note || typeof note.path !== "string" || !normalizedPath(note.path)) continue;
          const key = normalizedPath(note.path);
          if (!unique.has(key)) unique.set(key, { note, path: note.path, title: String(note.title || key.split("/").pop()), category: note.category || "\u8F85\u52A9", degree: 0, originalIndex: unique.size });
        }
        const all = [...unique.values()];
        const paths = new Map(all.map((node) => [normalizedPath(node.path), node]));
        const aliases = /* @__PURE__ */ new Map();
        function addAlias(name, node) {
          if (!name) return;
          const key = name.toLocaleLowerCase();
          if (!aliases.has(key)) aliases.set(key, /* @__PURE__ */ new Set());
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
        const connections = /* @__PURE__ */ new Map();
        let unresolved = 0;
        for (const node of all) {
          for (const raw of Array.isArray(node.note.links) ? node.note.links : []) {
            const target = resolve(raw, node);
            if (!target) {
              if (linkText(raw)) unresolved++;
              continue;
            }
            if (target === node) continue;
            const from = Math.min(node.originalIndex, target.originalIndex), to = Math.max(node.originalIndex, target.originalIndex);
            const key = `${from}:${to}`;
            if (!connections.has(key)) {
              connections.set(key, { source: from, target: to });
              all[from].degree++;
              all[to].degree++;
            }
          }
        }
        const eligible = options.showOrphans === false ? all.filter((node) => node.degree > 0) : all;
        const displayed = eligible.slice(0, maximum);
        const indices = new Map(displayed.map((node, index) => [node.originalIndex, index]));
        const nodes = displayed.map((node, index) => ({ ...node, index, degree: 0, radius: 3.5 }));
        const edges = [];
        for (const edge of connections.values()) {
          if (!indices.has(edge.source) || !indices.has(edge.target)) continue;
          const source = indices.get(edge.source), target = indices.get(edge.target);
          edges.push({ source, target });
          nodes[source].degree++;
          nodes[target].degree++;
        }
        for (const node of nodes) node.radius = 3.3 + Math.min(5.2, Math.sqrt(node.degree) * 1.3);
        return { nodes, edges, total: eligible.length, sourceTotal: all.length, truncated: eligible.length > maximum, maximum, unresolved };
      }
      function mount(container, notes, options = {}) {
        if (!container?.ownerDocument) throw new Error("ZhijianGraph needs a graph container");
        const doc = container.ownerDocument, win = doc.defaultView || window;
        const model = buildModel(notes, options);
        const adjacency = model.nodes.map(() => /* @__PURE__ */ new Set());
        for (const edge of model.edges) {
          adjacency[edge.source].add(edge.target);
          adjacency[edge.target].add(edge.source);
        }
        const byPath = new Map(model.nodes.map((node) => [node.path, node]));
        const disposers = [], elements = [], pointers = /* @__PURE__ */ new Map();
        const media = win.matchMedia?.("(prefers-reduced-motion: reduce)");
        let destroyed = false, frame = 0, needsDraw = true;
        let width = 0, height = 0, dpr = 1, zoom = 1, panX = 0, panY = 0;
        let hover = null, selected = null, reported = void 0, gesture = null;
        let configuration = { theme: "dark", motion: "full" }, colors = {}, font = "system-ui, sans-serif";
        let initialized = false, prepared = false, cameraTouched = false, cameraTarget = null;
        let growth = 0, growthElapsed = 0, growthClock = null, followFocus = false;
        let motionTime = 0, motionClock = null, lastDriftDraw = 0;
        let fluid = null, bornCount = 0;
        let seed = { x: 0, y: 0 };
        const growthDuration = 3200;
        const preparationTicks = model.nodes.length > 150 ? 48 : 360;
        const visited = /* @__PURE__ */ new Set(), order = [];
        for (const hub of [...model.nodes].sort((a, b) => b.degree - a.degree)) {
          if (visited.has(hub.index)) continue;
          const queue = [hub.index];
          visited.add(hub.index);
          hub.parent = null;
          for (let cursor = 0; cursor < queue.length; cursor++) {
            const index = queue[cursor];
            order.push(index);
            for (const neighbour of adjacency[index]) if (!visited.has(neighbour)) {
              visited.add(neighbour);
              model.nodes[neighbour].parent = index;
              queue.push(neighbour);
            }
          }
        }
        order.forEach((index, rank) => {
          model.nodes[index].revealAt = rank / Math.max(1, order.length - 1) * 0.65;
        });
        const visualPositions = /* @__PURE__ */ new Map(), labelSlots = /* @__PURE__ */ new Map();
        const simulation = createSimulation(model, { width: 800, height: 600 });
        const previewModel = { nodes: model.nodes.map((node) => ({ ...node })), edges: model.edges };
        const previewSimulation = Fluid.createFluidLayout(previewModel, { width: 800, height: 600 });
        for (const node of previewModel.nodes) previewSimulation.add(node.index);
        function element(tag, className, parent = container, text) {
          const node = doc.createElement(tag);
          node.className = className;
          if (text !== void 0) node.textContent = text;
          parent.appendChild(node);
          if (parent === container) elements.push(node);
          return node;
        }
        const canvas = element("canvas", "zj-force-canvas");
        canvas.tabIndex = 0;
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", `\u77E5\u8BC6\u5173\u7CFB\u56FE\uFF1A${model.nodes.length} \u7BC7\u7B14\u8BB0\uFF0C${model.edges.length} \u6761\u8FDE\u63A5\u3002`);
        Object.assign(canvas.style, { width: "100%", height: "100%", display: "block", touchAction: "none" });
        let ctx = null;
        try {
          ctx = canvas.getContext("2d", { alpha: true });
        } catch (_) {
        }
        const picker = element("div", "zj-graph-picker");
        picker.style.height = "auto";
        const search = element("input", "zj-graph-node-search", picker);
        search.type = "search";
        search.placeholder = "\u67E5\u627E\u5E76\u5B9A\u4F4D\u7B14\u8BB0\u2026";
        search.setAttribute("aria-label", "\u6309\u6807\u9898\u6216\u8DEF\u5F84\u67E5\u627E\u56FE\u8C31\u8282\u70B9");
        const select = element("select", "zj-graph-node-select", picker);
        select.setAttribute("aria-label", "\u9009\u62E9\u8981\u5B9A\u4F4D\u7684\u7B14\u8BB0\uFF0C\u5339\u914D\u5217\u8868\u6700\u591A\u663E\u793A 80 \u9879");
        const openButton = element("button", "zj-graph-node-open", picker, "\u6253\u5F00\u7B14\u8BB0");
        openButton.type = "button";
        openButton.disabled = true;
        const help = element("p", "zj-graph-a11y", container, "\u62D6\u52A8\u8282\u70B9\u8C03\u6574\u4F4D\u7F6E\uFF1B\u62D6\u52A8\u7A7A\u767D\u5904\u5E73\u79FB\uFF1B\u6EDA\u8F6E\u6216\u53CC\u6307\u7F29\u653E\u3002\u753B\u5E03\u805A\u7126\u540E\uFF0C\u6309\u52A0\u51CF\u53F7\u7F29\u653E\uFF0C\u65B9\u5411\u952E\u5E73\u79FB\uFF0C0 \u9002\u914D\u753B\u9762\uFF0CEnter \u6253\u5F00\u9009\u4E2D\u7684\u7B14\u8BB0\u3002\u4E5F\u53EF\u4F7F\u7528\u7B14\u8BB0\u5B9A\u4F4D\u641C\u7D22\u4E0E\u9009\u62E9\u5217\u8868\u3002");
        help.id = `zhijian-graph-help-${++mountCounter}`;
        canvas.setAttribute("aria-describedby", help.id);
        const status = element("span", "zj-graph-a11y");
        status.setAttribute("aria-live", "polite");
        container.dataset.nodes = String(model.nodes.length);
        container.dataset.edges = String(model.edges.length);
        container.dataset.total = String(model.total);
        container.dataset.sourceNodes = String(model.sourceTotal);
        container.dataset.truncated = String(model.truncated);
        container.dataset.layout = "force-directed";
        container.dataset.frame = "0";
        container.dataset.zoom = "1.000";
        container.dataset.growth = "0.000";
        container.dataset.growthState = "preparing";
        container.dataset.growthDuration = String(growthDuration);
        container.dataset.visibleNodes = "0";
        container.dataset.growthTechnique = "incremental-fluid";
        function call(name, ...args) {
          if (typeof options[name] !== "function") return;
          try {
            const value = options[name](...args);
            if (value?.catch) value.catch((error) => console.debug("\u77E5\u95F4\u56FE\u8C31\u56DE\u8C03", name, error));
          } catch (error) {
            console.debug("\u77E5\u95F4\u56FE\u8C31\u56DE\u8C03", name, error);
          }
        }
        function listen(target, event, handler, settings) {
          target.addEventListener(event, handler, settings);
          disposers.push(() => target.removeEventListener(event, handler, settings));
        }
        function isStatic() {
          return configuration.motion === "off" || Boolean(media?.matches);
        }
        function stop() {
          if (frame) win.cancelAnimationFrame(frame);
          frame = 0;
        }
        function drifting() {
          return Boolean(ctx && model.nodes.length && !isStatic());
        }
        function running() {
          return !destroyed && !doc.hidden && width > 0 && height > 0 && !isStatic() && (!prepared || growth < 1 || ctx && fluid && !fluid.settled || cameraTarget || drifting());
        }
        function ensureFluid() {
          if (!fluid) fluid = Fluid.createFluidLayout(model, { width, height, seed });
          return fluid;
        }
        function wake(amount) {
          if (isStatic()) simulation.reheat(amount);
          else if (fluid) fluid.reheat(amount);
        }
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
            node.bornTime = -1e4;
            node.bornMotionTime = -1e4;
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
          const start = win.performance.now();
          const maximum = model.nodes.length < 100 ? 380 : Math.max(6, Math.min(90, Math.floor(9e3 / model.nodes.length)));
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
          container.dataset.frame = String(previewSimulation.frame);
          container.dataset.settled = String(previewSimulation.settled);
          if (!previewSimulation.settled && previewSimulation.frame < preparationTicks) return;
          for (let index = 0; index < model.nodes.length; index++) {
            model.nodes[index].x = previewModel.nodes[index].x;
            model.nodes[index].y = previewModel.nodes[index].y;
            model.nodes[index].vx = model.nodes[index].vy = 0;
          }
          prepared = true;
          if (!cameraTouched) {
            fit();
            const margin = Math.max(0.12, zoom * 0.86) / zoom;
            zoom *= margin;
            panX *= margin;
            panY *= margin;
            notifyZoom();
          }
          seed = { x: -panX / zoom, y: -panY / zoom };
          container.dataset.seedX = (width / 2).toFixed(2);
          container.dataset.seedY = (height / 2).toFixed(2);
          if (!model.nodes.length) {
            finishGrowth();
            return;
          }
          container.dataset.growthState = "growing";
          status.textContent = "\u5173\u7CFB\u56FE\u8C31\u6B63\u5728\u751F\u957F\u3002";
          growthClock = null;
          ensureFluid();
          birthNodes();
        }
        const clamp = (value) => Math.max(0, Math.min(1, value));
        const smooth = (value) => value * value * value * (value * (value * 6 - 15) + 10);
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
          const driftX = node === focused() ? 0 : amplitude * (Math.sin(motionTime * 32e-5 + phase) + 0.22 * Math.sin(motionTime * 17e-5 + phase * 0.7));
          const driftY = node === focused() ? 0 : amplitude * (Math.cos(motionTime * 27e-5 + phase * 1.3) + 0.18 * Math.sin(motionTime * 21e-5 + phase));
          const point = { x: node.x + driftX, y: node.y + driftY };
          visualPositions.set(node.index, point);
          return point;
        }
        function finishGrowth() {
          growth = 1;
          growthElapsed = growthDuration;
          growthClock = null;
          container.dataset.growth = "1.000";
          container.dataset.growthState = "complete";
          status.textContent = `\u5173\u7CFB\u56FE\u8C31\u5DF2\u5C55\u5F00\uFF0C${model.nodes.length} \u7BC7\u7B14\u8BB0\uFF0C${model.edges.length} \u6761\u8FDE\u63A5\u3002`;
        }
        function focused() {
          return hover || selected;
        }
        function reportFocus() {
          const current = focused();
          if (reported === current) return;
          reported = current;
          container.dataset.focusedPath = current ? current.path : "";
          openButton.disabled = !current;
          status.textContent = current ? `${current.title}\uFF0C${adjacency[current.index].size} \u7BC7\u76F8\u90BB\u7B14\u8BB0\u3002` : "\u672A\u9009\u4E2D\u7B14\u8BB0\u3002";
          call("onFocus", current ? current.note : null, current ? adjacency[current.index].size : 0);
        }
        function fillOptions(query = "") {
          const key = query.trim().toLocaleLowerCase();
          const matches = model.nodes.filter((node) => !key || `${node.title} ${node.path}`.toLocaleLowerCase().includes(key));
          select.replaceChildren();
          const placeholder = element("option", "", select, matches.length ? `\u5B9A\u4F4D\u7B14\u8BB0 \xB7 ${matches.length} \u9879${matches.length > 80 ? "\uFF08\u8F93\u5165\u4EE5\u7B5B\u9009\uFF09" : ""}` : "\u6CA1\u6709\u5339\u914D\u7B14\u8BB0");
          placeholder.value = "";
          for (const node of matches.slice(0, 80)) {
            const option = element("option", "", select, `${node.title} \xB7 ${node.category}`);
            option.value = node.path;
          }
          if (selected && matches.slice(0, 80).some((node) => node === selected)) select.value = selected.path;
          else select.value = "";
        }
        function world(point) {
          return { x: (point.x - width / 2 - panX) / zoom, y: (point.y - height / 2 - panY) / zoom };
        }
        function screen(node) {
          const point = visualWorld(node);
          return { x: width / 2 + panX + point.x * zoom, y: height / 2 + panY + point.y * zoom };
        }
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
            if (distance < radius && distance < closest) {
              result = node;
              closest = distance;
            }
          }
          return result;
        }
        function notifyZoom() {
          container.dataset.zoom = zoom.toFixed(3);
          call("onZoom", zoom);
        }
        function setZoom(value, point = { x: width / 2, y: height / 2 }) {
          cameraTouched = true;
          cameraTarget = null;
          followFocus = false;
          const anchor = world(point);
          zoom = Math.max(0.12, Math.min(6, Number(value) || 1));
          panX = point.x - width / 2 - anchor.x * zoom;
          panY = point.y - height / 2 - anchor.y * zoom;
          notifyZoom();
          requestDraw();
        }
        function fit(immediate = true) {
          if (destroyed || !width || !height) return;
          if (immediate) followFocus = false;
          if (!model.nodes.length) {
            zoom = 1;
            panX = 0;
            panY = 0;
            notifyZoom();
            requestDraw();
            return;
          }
          let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
          for (const node of model.nodes) {
            left = Math.min(left, node.x - node.radius);
            right = Math.max(right, node.x + node.radius);
            top = Math.min(top, node.y - node.radius);
            bottom = Math.max(bottom, node.y + node.radius);
          }
          const nextZoom = Math.max(0.12, Math.min(2.25, (width - Math.min(100, width * 0.2)) / Math.max(50, right - left), (height - Math.min(100, height * 0.2)) / Math.max(50, bottom - top)));
          const target = { zoom: nextZoom, x: -(left + right) * 0.5 * nextZoom, y: -(top + bottom) * 0.5 * nextZoom };
          if (immediate || isStatic()) {
            zoom = target.zoom;
            panX = target.x;
            panY = target.y;
            cameraTarget = null;
            notifyZoom();
          } else cameraTarget = target;
          requestDraw();
        }
        function focusNode(node) {
          cameraTouched = true;
          cameraTarget = null;
          selected = node;
          hover = null;
          followFocus = Boolean(node);
          visualPositions.clear();
          if (node) {
            const point = visualWorld(node);
            panX = -point.x * zoom;
            panY = -point.y * zoom;
            select.value = node.path;
          }
          reportFocus();
          requestDraw();
        }
        function updateStyle() {
          if (destroyed) return;
          const settings = typeof options.getSettings === "function" ? options.getSettings() || {} : {};
          const wasStatic = isStatic();
          configuration = { theme: settings.theme === "light" ? "light" : "dark", motion: ["full", "subtle", "off"].includes(settings.motion) ? settings.motion : "full" };
          const computed = win.getComputedStyle?.(container);
          const dark = configuration.theme === "dark";
          const fallback = dark ? ["#a3c6c3", "#93b4d0", "#b4accb", "#adb4b7", "#c6bca7", "#91b5ac"] : ["#568f8b", "#647f9a", "#8f80a6", "#849198", "#a18b61", "#638e80"];
          function color(name, defaultValue) {
            return computed?.getPropertyValue(`--zj-graph-${name}`).trim() || defaultValue;
          }
          colors.groups = COLOR_NAMES.map((name, index) => color(name, fallback[index]));
          colors.node = color("node", dark ? "#dfedf7" : "#6c8ba1");
          colors.text = color("text", dark ? "#cfdfed" : "#29475f");
          colors.link = color("link", dark ? "#647e96" : "#91adbf");
          colors.muted = color("muted-link", dark ? "#32495f" : "#c0d0dc");
          font = computed?.fontFamily || "system-ui, sans-serif";
          if (isStatic()) {
            stop();
            motionClock = null;
            exposeStaticNodes();
            staticLayout();
            prepared = true;
            finishGrowth();
            if (initialized && !cameraTouched) fit();
          } else if (wasStatic) {
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
          container.dataset.panX = panX.toFixed(2);
          container.dataset.panY = panY.toFixed(2);
          if (active) {
            const focusPosition = screen(active);
            container.dataset.focusedX = focusPosition.x.toFixed(2);
            container.dataset.focusedY = focusPosition.y.toFixed(2);
          } else {
            delete container.dataset.focusedX;
            delete container.dataset.focusedY;
          }
          ctx.lineWidth = 0.7;
          for (const edge of model.edges) {
            const source = model.nodes[edge.source], target = model.nodes[edge.target];
            const progress = Math.min(reveal(source), reveal(target));
            if (!progress) continue;
            const from = screen(model.nodes[edge.source]), to = screen(model.nodes[edge.target]);
            const highlighted = active && (edge.source === active.index || edge.target === active.index);
            ctx.strokeStyle = highlighted ? colors.link : colors.muted;
            ctx.globalAlpha = Math.sqrt(progress) * (active && !highlighted ? 0.35 : highlighted ? 0.95 : 0.68);
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
          }
          let labels = 0, visibleNodes = 0;
          const labelBoxes = [], labelCandidates = [];
          ctx.font = `12px ${font}`;
          ctx.textBaseline = "middle";
          for (const node of model.nodes) {
            const progress = reveal(node);
            if (!progress) continue;
            visibleNodes++;
            const position = screen(node), radius = Math.max(2.1, Math.min(14, node.radius * Math.sqrt(zoom))) * (0.45 + progress * 0.55);
            if (position.x < -40 || position.x > width + 40 || position.y < -40 || position.y > height + 40) continue;
            const highlighted = !active || node === active || near.has(node.index);
            const color = colors.groups[CATEGORIES.indexOf(node.category)] || colors.node;
            ctx.globalAlpha = progress * progress * (highlighted ? 0.95 : 0.28);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
            ctx.fill();
            if (node === active) {
              ctx.strokeStyle = color;
              ctx.lineWidth = 1.1;
              ctx.globalAlpha = progress * 0.65;
              ctx.beginPath();
              ctx.arc(position.x, position.y, radius + 4, 0, Math.PI * 2);
              ctx.stroke();
              ctx.lineWidth = 0.7;
            }
            const showLabel = node === active || near?.has(node.index) || model.nodes.length < 85 && zoom > 0.42 || zoom > 1.4 && node.degree > 1 || zoom > 2.7;
            const spread = isStatic() || node.interacted ? 1 : smooth(clamp((motionTime - node.bornMotionTime - 160) / 520));
            if (showLabel && spread > 0.18) labelCandidates.push({ node, position, radius, progress: progress * smooth(clamp((spread - 0.18) / 0.5)), highlighted });
          }
          labelCandidates.sort((a, b) => Number(b.node === active) - Number(a.node === active) || Number(near?.has(b.node.index)) - Number(near?.has(a.node.index)) || b.node.degree - a.node.degree);
          for (const candidate of labelCandidates) {
            if (labels >= 120) break;
            const { node, position, radius, progress, highlighted } = candidate;
            const maximum = zoom < 2.4 ? 172 : 244;
            const measure = (text2) => ctx.measureText?.(text2).width || text2.length * 10;
            let text = node.title;
            while (text.length > 3 && measure(text) > maximum) text = text.slice(0, -1);
            if (text !== node.title) text = text.slice(0, -1) + "\u2026";
            const textWidth = measure(text);
            const placements = [
              { x: position.x + radius + 6, y: position.y },
              { x: position.x - radius - 6 - textWidth, y: position.y },
              { x: position.x - textWidth / 2, y: position.y - radius - 11 },
              { x: position.x - textWidth / 2, y: position.y + radius + 11 }
            ];
            let slot = labelSlots.get(node.index);
            if (slot === void 0) {
              const overlap = (point2) => labelBoxes.reduce((score, box) => score + Math.max(0, Math.min(point2.x + textWidth + 5, box.right) - Math.max(point2.x - 5, box.left)) * Math.max(0, Math.min(point2.y + 10, box.bottom) - Math.max(point2.y - 10, box.top)), 0);
              const valid = placements.map((point2, index) => ({ point: point2, index })).filter(({ point: point2 }) => point2.x > 5 && point2.x + textWidth < width - 5 && point2.y > 10 && point2.y < height - 10 && overlap(point2) === 0);
              if (!valid.length && node !== active) continue;
              slot = { side: valid[0]?.index ?? node.index % 4, shownAt: motionTime, offsetY: 0, targetY: 0, lastDraw: motionTime };
              labelSlots.set(node.index, slot);
            }
            const anchored = placements[slot.side];
            const point = { x: Math.max(5, Math.min(width - textWidth - 5, anchored.x)), y: Math.max(12, Math.min(height - 12, anchored.y + slot.offsetY)) };
            const intersects = (y) => labelBoxes.some((box) => point.x < box.right + 5 && point.x + textWidth > box.left - 5 && y - 7 < box.bottom + 3 && y + 7 > box.top - 3);
            if (intersects(anchored.y + slot.targetY)) {
              const candidates = [slot.targetY, 0, -18, 18, -36, 36, -54, 54].filter((offset) => slot.side === 2 ? offset <= 0 : slot.side === 3 ? offset >= 0 : true).sort((a, b) => Math.abs(a - slot.offsetY) - Math.abs(b - slot.offsetY));
              const free = candidates.find((offset) => anchored.y + offset > 12 && anchored.y + offset < height - 12 && !intersects(anchored.y + offset));
              if (free !== void 0) slot.targetY = free;
            }
            const easing = isStatic() ? 1 : 1 - Math.exp(-Math.max(0, motionTime - slot.lastDraw) / 220);
            slot.offsetY += (slot.targetY - slot.offsetY) * easing;
            slot.lastDraw = motionTime;
            point.y = Math.max(12, Math.min(height - 12, anchored.y + slot.offsetY));
            labelBoxes.push({ left: point.x, right: point.x + textWidth, top: point.y - 7, bottom: point.y + 7 });
            const nameFade = isStatic() || node === active ? 1 : smooth(clamp((motionTime - slot.shownAt) / 260));
            ctx.globalAlpha = progress * nameFade * (highlighted ? 0.9 : 0.35);
            ctx.fillStyle = colors.text;
            ctx.fillText(text, point.x, point.y);
            labels++;
          }
          ctx.globalAlpha = 1;
          container.dataset.visibleNodes = String(visibleNodes);
          if (!model.nodes.length) {
            ctx.font = `14px ${font}`;
            ctx.fillStyle = colors.text;
            ctx.textAlign = "center";
            ctx.fillText(options.showOrphans === false ? "\u5F53\u524D\u7B5B\u9009\u4E2D\u6CA1\u6709\u4E92\u76F8\u8FDE\u63A5\u7684\u7B14\u8BB0" : "\u5F53\u524D\u7B5B\u9009\u4E2D\u6CA1\u6709\u7B14\u8BB0", width / 2, height / 2);
            ctx.textAlign = "start";
          }
        }
        function tick(now) {
          frame = 0;
          if (destroyed || doc.hidden || !width || !height) return;
          const elapsed = motionClock === null ? 0 : Math.max(0, now - motionClock);
          if (!isStatic()) {
            motionTime += elapsed;
            motionClock = now;
          }
          visualPositions.clear();
          if (!prepared && !isStatic()) {
            prepareLayout();
            needsDraw = true;
          }
          if (prepared && growth < 1 && !isStatic()) {
            if (growthClock !== null) growthElapsed += Math.max(0, now - growthClock);
            growthClock = now;
            growth = Math.min(1, growthElapsed / growthDuration);
            container.dataset.growth = growth.toFixed(3);
            birthNodes();
            if (growth === 1) finishGrowth();
            needsDraw = true;
          }
          const physicsDue = ctx && prepared && !isStatic() && fluid && !fluid.settled;
          if (physicsDue) {
            fluid.step(Math.min(1 / 30, elapsed / 1e3));
            container.dataset.frame = String(fluid.frame);
            container.dataset.settled = String(fluid.settled);
            needsDraw = true;
          }
          if (cameraTarget && !cameraTouched) {
            zoom += (cameraTarget.zoom - zoom) * 0.16;
            panX += (cameraTarget.x - panX) * 0.16;
            panY += (cameraTarget.y - panY) * 0.16;
            if (Math.abs(zoom - cameraTarget.zoom) < 5e-4 && Math.hypot(panX - cameraTarget.x, panY - cameraTarget.y) < 0.08) {
              zoom = cameraTarget.zoom;
              panX = cameraTarget.x;
              panY = cameraTarget.y;
              cameraTarget = null;
            }
            notifyZoom();
            needsDraw = true;
          }
          if (followFocus && selected && !gesture) {
            const point = visualWorld(selected);
            panX = -point.x * zoom;
            panY = -point.y * zoom;
          }
          if (drifting() && now - lastDriftDraw >= 1e3 / (model.nodes.length > 250 ? 15 : 30) - 0.3) {
            lastDriftDraw = now;
            needsDraw = true;
          }
          if (needsDraw) {
            draw();
            needsDraw = false;
          }
          if (!frame && (running() || needsDraw)) frame = win.requestAnimationFrame(tick);
        }
        function resize() {
          if (destroyed) return;
          const bounds = container.getBoundingClientRect();
          const newWidth = Math.max(0, Math.round(bounds.width || container.clientWidth || 0));
          const newHeight = Math.max(0, Math.round(bounds.height || container.clientHeight || 0));
          const newDpr = Math.min(2, Math.max(1, win.devicePixelRatio || 1));
          if (newWidth === width && newHeight === height && newDpr === dpr) return;
          width = newWidth;
          height = newHeight;
          dpr = newDpr;
          canvas.width = Math.max(1, Math.round(width * dpr));
          canvas.height = Math.max(1, Math.round(height * dpr));
          ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
          simulation.resize(width, height);
          previewSimulation.resize(width, height);
          fluid?.resize(width, height);
          if (!width || !height) {
            growthClock = null;
            motionClock = null;
            stop();
            return;
          }
          if (isStatic()) {
            exposeStaticNodes();
            staticLayout();
            prepared = true;
            finishGrowth();
          }
          initialized = true;
          if (prepared && !cameraTouched && isStatic()) fit();
          requestDraw();
        }
        function beginPan(pointerId, point, moved = false) {
          gesture = { kind: "pan", pointerId, start: point, panX, panY, moved };
        }
        function cancelNode() {
          if (gesture?.kind === "node") {
            delete gesture.node.fx;
            delete gesture.node.fy;
            wake(0.25);
          }
        }
        function pointerDown(event) {
          if (event.button !== void 0 && event.button !== 0 || destroyed) return;
          cameraTouched = true;
          cameraTarget = null;
          followFocus = false;
          const point = local(event);
          pointers.set(event.pointerId, point);
          try {
            canvas.setPointerCapture(event.pointerId);
          } catch (_) {
          }
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
              node.x = visual.x;
              node.y = visual.y;
              node.interacted = true;
              visualPositions.clear();
              node.fx = node.x;
              node.fy = node.y;
              gesture = { kind: "node", pointerId: event.pointerId, start: point, node, offsetX: node.x - anchor.x, offsetY: node.y - anchor.y, moved: false };
              selected = node;
              hover = null;
              reportFocus();
              wake(0.35);
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
            panX = middle.x - width / 2 - gesture.anchor.x * zoom;
            panY = middle.y - height / 2 - gesture.anchor.y * zoom;
            notifyZoom();
            requestDraw();
            return;
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
            requestDraw();
            return;
          }
          if (!gesture && event.pointerType !== "touch") {
            const next = hit(point);
            if (hover !== next) {
              hover = next;
              canvas.style.cursor = next ? "pointer" : "grab";
              reportFocus();
              requestDraw();
            }
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
          } else if (current?.kind === "pan" && !cancelled && !current.moved) {
            selected = null;
            hover = null;
            reportFocus();
          }
          gesture = null;
          try {
            if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
          } catch (_) {
          }
          if (pointers.size === 1) {
            const [pointerId, point] = pointers.entries().next().value;
            beginPan(pointerId, point, true);
          }
          if (!pointers.size) container.classList.remove("is-dragging");
          requestDraw();
        }
        function cancelAll() {
          cancelNode();
          gesture = null;
          const activePointers = [...pointers.keys()];
          pointers.clear();
          for (const id of activePointers) {
            try {
              if (canvas.hasPointerCapture?.(id)) canvas.releasePointerCapture(id);
            } catch (_) {
            }
          }
          container.classList.remove("is-dragging");
        }
        listen(canvas, "pointerdown", pointerDown);
        listen(canvas, "pointermove", pointerMove, { passive: true });
        listen(canvas, "pointerup", (event) => finishPointer(event));
        listen(canvas, "pointercancel", (event) => finishPointer(event, true));
        listen(canvas, "lostpointercapture", (event) => finishPointer(event, true));
        listen(canvas, "pointerleave", () => {
          if (!gesture && hover) {
            hover = null;
            reportFocus();
            requestDraw();
          }
        });
        listen(canvas, "wheel", (event) => {
          event.preventDefault();
          setZoom(zoom * Math.exp(-event.deltaY * 15e-4), local(event));
        }, { passive: false });
        listen(canvas, "dblclick", (event) => {
          if (!hit(local(event))) fit();
        });
        listen(canvas, "keydown", (event) => {
          if (event.key.startsWith("Arrow")) {
            cameraTouched = true;
            cameraTarget = null;
            followFocus = false;
          }
          if (event.key === "+" || event.key === "=") setZoom(zoom + 0.12);
          else if (event.key === "-") setZoom(zoom - 0.12);
          else if (event.key === "0" || event.key === "Home") fit();
          else if (event.key === "ArrowLeft") panX -= 40;
          else if (event.key === "ArrowRight") panX += 40;
          else if (event.key === "ArrowUp") panY -= 40;
          else if (event.key === "ArrowDown") panY += 40;
          else if (event.key === "Enter" && focused()) call("onOpen", focused().path);
          else if (event.key === "Escape") {
            selected = null;
            hover = null;
            reportFocus();
          } else return;
          event.preventDefault();
          requestDraw();
        });
        listen(search, "input", () => fillOptions(search.value));
        listen(search, "keydown", (event) => {
          if (event.key !== "Enter") return;
          const key = search.value.trim().toLocaleLowerCase();
          const node = model.nodes.find((item) => `${item.title} ${item.path}`.toLocaleLowerCase().includes(key));
          if (node) {
            focusNode(node);
            canvas.focus({ preventScroll: true });
            event.preventDefault();
          }
        });
        listen(select, "change", () => focusNode(byPath.get(select.value) || null));
        listen(openButton, "click", () => {
          if (focused()) call("onOpen", focused().path);
        });
        listen(doc, "visibilitychange", () => {
          growthClock = null;
          motionClock = null;
          if (doc.hidden) {
            cancelAll();
            stop();
          } else {
            if (isStatic()) staticLayout();
            requestDraw();
          }
        });
        listen(win, "resize", resize, { passive: true });
        if (media?.addEventListener) listen(media, "change", updateStyle);
        else if (media?.addListener) {
          media.addListener(updateStyle);
          disposers.push(() => media.removeListener(updateStyle));
        }
        let resizeObserver = null;
        if (win.ResizeObserver) {
          resizeObserver = new win.ResizeObserver(resize);
          resizeObserver.observe(container);
        }
        fillOptions();
        updateStyle();
        resize();
        reportFocus();
        call("onStats", { nodes: model.nodes.length, edges: model.edges.length, total: model.total, truncated: model.truncated });
        return {
          zoomBy(delta) {
            if (!destroyed) setZoom(zoom + (Number(delta) || 0));
          },
          fit,
          updateStyle,
          reheat() {
            if (!destroyed) {
              wake(0.5);
              if (isStatic()) staticLayout();
              requestDraw();
            }
          },
          destroy() {
            if (destroyed) return;
            destroyed = true;
            cancelAll();
            stop();
            resizeObserver?.disconnect();
            for (const dispose of disposers) dispose();
            for (const node of elements) node.remove();
            call("onFocus", null, 0);
            container.dataset.layout = "destroyed";
          }
        };
      }
      return { mount, buildModel, createSimulation, normalizedPath, linkText };
    });
  }
});

// carousel.js
var require_carousel = __commonJS({
  "carousel.js"(exports2, module2) {
    (function(root, factory) {
      if (typeof module2 === "object" && module2.exports) module2.exports = factory();
      else root.ZhijianCarousel = factory();
    })(typeof globalThis !== "undefined" ? globalThis : exports2, function() {
      "use strict";
      function mount(hero, options = {}) {
        const doc = hero.ownerDocument, win = doc.defaultView;
        const stage = hero.querySelector(".zj-orbit-carousel");
        const cards = [...hero.querySelectorAll("[data-carousel-item]")];
        const dots = [...hero.querySelectorAll("[data-carousel-go]")];
        const caption = hero.querySelector(".zj-carousel-caption");
        const toggle = hero.querySelector(".zj-carousel-toggle");
        const media = win.matchMedia?.("(prefers-reduced-motion: reduce)");
        const disposers = [];
        const interval = 3500;
        let active = 0, timer = null, destroyed = false, hovering = false, focusing = false, paused = false;
        function listen(target, name, callback) {
          target.addEventListener(name, callback);
          disposers.push(() => target.removeEventListener(name, callback));
        }
        function clear() {
          if (timer !== null) win.clearTimeout(timer);
          timer = null;
        }
        function canRotate() {
          const settings = options.getSettings?.() || {};
          return !destroyed && cards.length > 1 && !doc.hidden && !media?.matches && settings.motion !== "off" && !hovering && !focusing && !paused;
        }
        function schedule() {
          clear();
          const rotating = canRotate();
          stage.dataset.autoplay = String(rotating);
          if (rotating) timer = win.setTimeout(() => {
            timer = null;
            go(active + 1);
          }, interval);
        }
        function go(index) {
          if (destroyed || !cards.length) return;
          active = (index % cards.length + cards.length) % cards.length;
          cards.forEach((card, item) => {
            card.dataset.orbitIndex = String((item - active + cards.length) % cards.length);
            card.dataset.active = String(item === active);
          });
          dots.forEach((dot, item) => dot.setAttribute("aria-current", item === active ? "true" : "false"));
          if (caption) caption.textContent = `${String(active + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
          stage.dataset.activeIndex = String(active);
          options.onChange?.(cards[active].dataset.path);
          schedule();
        }
        listen(hero, "pointerenter", (event) => {
          if (event.pointerType !== "touch") {
            hovering = true;
            schedule();
          }
        });
        listen(hero, "pointerleave", () => {
          hovering = false;
          schedule();
        });
        listen(hero, "focusin", () => {
          focusing = true;
          schedule();
        });
        listen(hero, "focusout", (event) => {
          focusing = hero.contains(event.relatedTarget);
          schedule();
        });
        listen(stage, "keydown", (event) => {
          if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
          event.preventDefault();
          go(active + (event.key === "ArrowRight" ? 1 : -1));
        });
        for (const button of hero.querySelectorAll("[data-carousel-step]")) listen(button, "click", () => go(active + Number(button.dataset.carouselStep)));
        for (const button of dots) listen(button, "click", () => go(Number(button.dataset.carouselGo)));
        if (toggle) listen(toggle, "click", () => {
          paused = !paused;
          toggle.setAttribute("aria-pressed", String(paused));
          toggle.setAttribute("aria-label", paused ? "\u7EE7\u7EED\u81EA\u52A8\u8F6E\u6362" : "\u6682\u505C\u81EA\u52A8\u8F6E\u6362");
          toggle.textContent = paused ? "\u25B7" : "\u2161";
          schedule();
        });
        listen(doc, "visibilitychange", schedule);
        if (media?.addEventListener) listen(media, "change", schedule);
        stage.dataset.interval = String(interval);
        go(0);
        return {
          go,
          updateStyle: schedule,
          destroy() {
            if (destroyed) return;
            destroyed = true;
            clear();
            for (const dispose of disposers) dispose();
            stage.dataset.autoplay = "false";
          }
        };
      }
      return { mount };
    });
  }
});

// src/plugin.js
var { Plugin, ItemView, TFile, TFolder, Notice, Component, MarkdownRenderer, PluginSettingTab, Setting } = require("obsidian");
var Core = require_core();
var UI = require_ui();
var Icons = require_icons();
var FX = require_fx();
var Graph = require_graph();
var Carousel = require_carousel();
var VIEW_TYPE = "zhijian-studio-view";
var StudioView = class extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.markdownComponents = /* @__PURE__ */ new Map();
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return "\u77E5\u95F4 \xB7 Knowledge Studio";
  }
  getIcon() {
    return "panels-top-left";
  }
  async onOpen() {
    this.contentEl.addClass("zhijian-view", "zj-native");
    const adapter = this.plugin.adapter(this);
    this.ui = await Promise.resolve(UI.mount(this.contentEl, adapter));
    await this.ui?.ready;
  }
  async onClose() {
    this.ui?.destroy?.();
    for (const component of this.markdownComponents.values()) this.removeChild(component);
    this.markdownComponents.clear();
    this.contentEl.empty();
  }
  async renderMarkdown(content, element, path) {
    for (const [target, component2] of this.markdownComponents) {
      if (target === element || !target.isConnected) {
        this.removeChild(component2);
        this.markdownComponents.delete(target);
      }
    }
    const component = new Component();
    this.addChild(component);
    this.markdownComponents.set(element, component);
    element.empty();
    await MarkdownRenderer.render(this.app, content, element, path, component);
  }
};
var StudioSettings = class extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    this.containerEl.empty();
    this.containerEl.createEl("h2", { text: "\u77E5\u95F4 \xB7 Knowledge Studio" });
    new Setting(this.containerEl).setName("\u663E\u793A\u540D\u79F0").setDesc("\u7528\u4E8E\u5DE5\u4F5C\u53F0\u95EE\u5019\u8BED\u3002").addText((text) => text.setValue(this.plugin.settings.displayName).onChange((value) => this.plugin.saveSettings({ displayName: value })));
    new Setting(this.containerEl).setName("\u4E3B\u9898").setDesc("\u5DE5\u4F5C\u53F0\u4F7F\u7528\u72EC\u7ACB\u7684\u6D45\u8272\u6216\u6DF1\u8272\u5916\u89C2\u3002").addDropdown((dropdown) => dropdown.addOptions({ light: "\u6D45\u8272", dark: "\u6DF1\u8272" }).setValue(this.plugin.settings.theme).onChange((value) => this.plugin.saveSettings({ theme: value })));
    new Setting(this.containerEl).setName("\u52A8\u6548\u5F3A\u5EA6").setDesc("\u6781\u5149\u6D41\u52A8\u3001\u7EB5\u6DF1\u7C92\u5B50\u4E0E\u73BB\u7483\u5361\u7247\u4EA4\u4E92\uFF1B\u7CFB\u7EDF\u51CF\u5C11\u52A8\u6001\u6548\u679C\u504F\u597D\u4F18\u5148\u3002").addDropdown((dropdown) => dropdown.addOptions({ full: "\u5B8C\u6574\u52A8\u6548", subtle: "\u67D4\u548C\u52A8\u6548", off: "\u5173\u95ED\u52A8\u6548" }).setValue(this.plugin.settings.motion).onChange((value) => this.plugin.saveSettings({ motion: value })));
    new Setting(this.containerEl).setName("\u6392\u9664\u76EE\u5F55").setDesc("\u6BCF\u884C\u4E00\u4E2A\u76F8\u5BF9\u8DEF\u5F84\uFF1B\u9ED8\u8BA4\u6392\u9664\u79C1\u5BC6\u8D44\u6599\u3002\u7CFB\u7EDF\u8BF4\u660E\u4E0E\u6A21\u677F\u4E0D\u4F1A\u8FDB\u5165\u5361\u7247\u5217\u8868\u3002").addTextArea((text) => text.setValue(this.plugin.settings.excludedPaths.join("\n")).onChange((value) => this.plugin.saveSettings({ excludedPaths: value.split(/\r?\n/).map((path) => path.trim()).filter(Boolean) })));
    this.containerEl.createEl("p", { text: "\u539F\u59CB\u8D44\u6599\u4FDD\u6301\u53EA\u8BFB\u3002\u5237\u65B0\u53EA\u5EFA\u7ACB\u7D22\u5F15\uFF1B\u663E\u5F0F\u4FEE\u6539\u72B6\u6001\u624D\u5199\u5165 YAML\uFF0C\u65B0\u9875\u9762\u4F1A\u540C\u6B65 index.md \u4E0E log.md\u3002" });
  }
};
module.exports = class ZhijianStudioPlugin extends Plugin {
  async onload() {
    this.settings = Core.cleanSettings(await this.loadData());
    const previousIcons = window.ZhijianIcons;
    const previousFX = window.ZhijianFX;
    const previousGraph = window.ZhijianGraph;
    const previousCarousel = window.ZhijianCarousel;
    window.ZhijianIcons = Icons;
    window.ZhijianFX = FX;
    window.ZhijianGraph = Graph;
    window.ZhijianCarousel = Carousel;
    this.register(() => {
      if (window.ZhijianIcons === Icons) {
        if (previousIcons === void 0) delete window.ZhijianIcons;
        else window.ZhijianIcons = previousIcons;
      }
      if (window.ZhijianFX === FX) {
        if (previousFX === void 0) delete window.ZhijianFX;
        else window.ZhijianFX = previousFX;
      }
      if (window.ZhijianGraph === Graph) {
        if (previousGraph === void 0) delete window.ZhijianGraph;
        else window.ZhijianGraph = previousGraph;
      }
      if (window.ZhijianCarousel === Carousel) {
        if (previousCarousel === void 0) delete window.ZhijianCarousel;
        else window.ZhijianCarousel = previousCarousel;
      }
    });
    this.noteCache = /* @__PURE__ */ new Map();
    this.frontmatterOverrides = /* @__PURE__ */ new Map();
    this.listeners = /* @__PURE__ */ new Set();
    this.operationQueue = Promise.resolve();
    this.registerView(VIEW_TYPE, (leaf) => new StudioView(leaf, this));
    this.addRibbonIcon("panels-top-left", "\u6253\u5F00\u77E5\u95F4\u77E5\u8BC6\u5DE5\u4F5C\u53F0", () => this.activateView());
    this.addCommand({ id: "open-zhijian-studio", name: "\u6253\u5F00\u77E5\u95F4\u77E5\u8BC6\u5DE5\u4F5C\u53F0", callback: () => this.activateView() });
    this.addCommand({ id: "open-zhijian-sidebar", name: "\u5728\u53F3\u4FA7\u680F\u6253\u5F00\u77E5\u95F4", callback: () => this.activateView(true) });
    this.addSettingTab(new StudioSettings(this.app, this));
    this.registerEvent(this.app.metadataCache.on("changed", (file) => {
      this.frontmatterOverrides.delete(file.path);
      this.invalidate(file.path);
    }));
    this.registerEvent(this.app.vault.on("create", (file) => this.invalidate(file.path)));
    this.registerEvent(this.app.vault.on("delete", (file) => {
      this.frontmatterOverrides.delete(file.path);
      if (file instanceof TFolder) this.clearPathCache(file.path);
      this.invalidate(file.path);
    }));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      this.noteCache.delete(oldPath);
      this.frontmatterOverrides.delete(oldPath);
      if (file instanceof TFolder) {
        this.clearPathCache(oldPath);
        this.clearPathCache(file.path);
      }
      this.invalidate(file.path);
    }));
    this.register(() => {
      window.clearTimeout(this.notifyTimer);
      this.listeners.clear();
      this.noteCache.clear();
      this.frontmatterOverrides.clear();
    });
  }
  async activateView(sidebar = false) {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) leaf = sidebar ? this.app.workspace.getRightLeaf(false) : this.app.workspace.getLeaf("tab");
    if (!leaf) leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    await this.app.workspace.revealLeaf(leaf);
  }
  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }
  invalidate(path) {
    this.noteCache.delete(path);
    window.clearTimeout(this.notifyTimer);
    this.notifyTimer = window.setTimeout(() => {
      for (const listener of this.listeners) {
        try {
          listener();
        } catch (error) {
          console.error("\u77E5\u95F4\u89C6\u56FE\u66F4\u65B0\u5931\u8D25", error);
        }
      }
    }, 120);
  }
  clearPathCache(path) {
    for (const cache of [this.noteCache, this.frontmatterOverrides]) {
      for (const key of cache.keys()) if (Core.inPath(key, path)) cache.delete(key);
    }
  }
  async saveSettings(patch) {
    this.settings = Core.cleanSettings({ ...this.settings, ...patch });
    await this.enqueue(async () => {
      await this.saveData(this.settings);
      this.noteCache.clear();
      this.invalidate("");
    });
  }
  async getNotes() {
    const files = this.app.vault.getMarkdownFiles().filter((file) => !Core.isExcluded(file.path, this.settings));
    const notes = await Core.mapLimit(files, 8, async (file) => {
      const cached = this.noteCache.get(file.path);
      if (cached && cached.mtime === file.stat.mtime) return cached.note;
      const metadata = this.app.metadataCache.getFileCache(file) || {};
      const cache = this.frontmatterOverrides.has(file.path) ? { ...metadata, frontmatter: this.frontmatterOverrides.get(file.path) } : metadata;
      let content = "";
      try {
        content = await this.app.vault.cachedRead(file);
      } catch (error) {
        console.warn("\u77E5\u95F4\uFF1A\u7B14\u8BB0\u6458\u8981\u8BFB\u53D6\u5931\u8D25", file.path, error);
      }
      const note = Core.noteFromFile(file, cache, content);
      note.links = [...new Set(note.links.map((link) => this.app.metadataCache.getFirstLinkpathDest(link, file.path)?.path || link))];
      this.noteCache.set(file.path, { mtime: file.stat.mtime, note });
      return note;
    });
    return notes.sort((a, b) => b.modified - a.modified || a.title.localeCompare(b.title, "zh-CN"));
  }
  fileFor(path, writable = false) {
    const normalized = Core.normalizePath(path);
    const file = this.app.vault.getAbstractFileByPath(normalized);
    if (!(file instanceof TFile) || file.extension !== "md") throw new Error("\u7B14\u8BB0\u5DF2\u79FB\u52A8\u6216\u5220\u9664\uFF0C\u8BF7\u5237\u65B0\u5DE5\u4F5C\u53F0\u3002");
    if (Core.isExcluded(normalized, this.settings)) throw new Error("\u6B64\u9875\u9762\u4F4D\u4E8E\u5DE5\u4F5C\u53F0\u6392\u9664\u8303\u56F4\u3002");
    if (writable && Core.isReadonly(normalized)) throw new Error("\u539F\u59CB\u8D44\u6599\u4FDD\u6301\u53EA\u8BFB\uFF0C\u8BF7\u5728\u6765\u6E90\u6458\u8981\u4E2D\u8BB0\u5F55\u9605\u8BFB\u4E0E\u6C89\u6DC0\u3002");
    return file;
  }
  enqueue(operation) {
    const result = this.operationQueue.then(operation);
    this.operationQueue = result.catch(() => {
    });
    return result;
  }
  updateNote(path, patch) {
    return this.enqueue(async () => {
      const file = this.fileFor(path, true);
      Core.applyStatus({}, patch);
      try {
        await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
          Core.applyStatus(frontmatter, patch);
          this.frontmatterOverrides.set(file.path, { ...frontmatter });
        });
      } catch (error) {
        this.frontmatterOverrides.delete(file.path);
        this.invalidate(file.path);
        throw error;
      }
      this.invalidate(file.path);
    });
  }
  async ensureFolder(path) {
    const parts = Core.normalizePath(path).split("/");
    for (let index = 1; index <= parts.length; index++) {
      const current = parts.slice(0, index).join("/");
      const existing = this.app.vault.getAbstractFileByPath(current);
      if (existing && !(existing instanceof TFolder)) throw new Error(`\u76EE\u5F55\u4F4D\u7F6E\u5DF2\u6709\u540C\u540D\u6587\u4EF6\uFF1A${current}`);
      if (!existing) {
        try {
          await this.app.vault.createFolder(current);
        } catch (error) {
          if (!(this.app.vault.getAbstractFileByPath(current) instanceof TFolder)) throw error;
        }
      }
    }
  }
  async updateMaintenance(note) {
    const date = Core.localDate();
    let index = this.app.vault.getAbstractFileByPath("index.md");
    if (index && !(index instanceof TFile)) throw new Error("index.md \u4F4D\u7F6E\u4E0D\u662F\u6587\u4EF6\u3002");
    if (!index) index = await this.app.vault.create("index.md", `---
id: SYS-index
title: \u77E5\u8BC6\u5E93\u603B\u7D22\u5F15
type: support
status: active
created: ${date}
updated: ${date}
tags: [index]
sources: []
related: []
---

# \u77E5\u8BC6\u5E93\u603B\u7D22\u5F15
`);
    await this.app.vault.process(index, (content) => Core.indexEntry(content, note));
    await this.app.fileManager.processFrontMatter(index, (frontmatter) => {
      frontmatter.updated = date;
    });
    let log = this.app.vault.getAbstractFileByPath("log.md");
    if (log && !(log instanceof TFile)) throw new Error("log.md \u4F4D\u7F6E\u4E0D\u662F\u6587\u4EF6\u3002");
    if (!log) log = await this.app.vault.create("log.md", "# \u53D8\u66F4\u65E5\u5FD7\n\n\u672C\u6587\u4EF6\u53EA\u8FFD\u52A0\uFF0C\u4E0D\u6539\u5199\u5386\u53F2\u3002\n");
    await this.app.vault.process(log, (content) => content + (content.endsWith("\n") ? "" : "\n") + Core.logEntry(note, date));
  }
  createNote(input) {
    return this.enqueue(async () => {
      const note = Core.buildNewNote(input);
      if (Core.isExcluded(note.path, this.settings)) throw new Error("\u8BF7\u9009\u62E9\u5DE5\u4F5C\u53F0\u5305\u542B\u7684\u76EE\u5F55\u4E0E\u9875\u9762\u540D\u79F0\u3002");
      for (const maintenancePath of ["index.md", "log.md"]) {
        const existing = this.app.vault.getAbstractFileByPath(maintenancePath);
        if (existing && !(existing instanceof TFile)) throw new Error(`${maintenancePath} \u4F4D\u7F6E\u4E0D\u662F\u6587\u4EF6\u3002`);
      }
      if (this.app.vault.getAbstractFileByPath(note.path)) throw new Error("\u5DF2\u6709\u540C\u540D\u9875\u9762\uFF0C\u8BF7\u4F18\u5148\u6253\u5F00\u5E76\u66F4\u65B0\uFF0C\u6216\u4F7F\u7528\u72EC\u7ACB\u7684\u65B0\u6807\u9898\u3002");
      await this.ensureFolder(note.folder);
      const file = await this.app.vault.create(note.path, note.content);
      this.frontmatterOverrides.set(file.path, note.frontmatter);
      try {
        await this.updateMaintenance(note);
      } catch (error) {
        this.invalidate(file.path);
        new Notice(`\u9875\u9762\u5DF2\u521B\u5EFA\uFF1A${note.path}\u3002\u7D22\u5F15\u6216\u65E5\u5FD7\u66F4\u65B0\u672A\u5B8C\u6210\uFF0C\u8BF7\u68C0\u67E5\u540E\u8865\u5145\u3002`, 1e4);
        console.error("\u77E5\u95F4\uFF1A\u9875\u9762\u7EF4\u62A4\u8BB0\u5F55\u66F4\u65B0\u5931\u8D25", error);
        const failure = new Error(`\u9875\u9762\u5DF2\u521B\u5EFA\u4E8E ${note.path}\uFF1B\u7D22\u5F15\u6216\u65E5\u5FD7\u66F4\u65B0\u672A\u5B8C\u6210\uFF1A${error.message}`);
        failure.createdPath = note.path;
        throw failure;
      }
      this.invalidate(file.path);
      return note.path;
    });
  }
  adapter(view) {
    return {
      getNotes: () => this.getNotes(),
      getSettings: () => ({ ...this.settings, excludedPaths: [...this.settings.excludedPaths], bookmarks: [...this.settings.bookmarks] }),
      saveSettings: (patch) => this.saveSettings(patch),
      getVaultName: () => this.app.vault.getName(),
      supportsNativeGraph: true,
      isActive: () => this.app.workspace.getActiveViewOfType(StudioView) === view,
      openNote: async (path) => {
        const file = this.fileFor(path);
        const existing = this.app.workspace.getLeavesOfType("markdown").find((leaf2) => leaf2.view?.file?.path === file.path);
        const leaf = existing || this.app.workspace.getLeaf("tab");
        await leaf.openFile(file, { active: true });
        await this.app.workspace.revealLeaf(leaf);
      },
      readNote: async (path) => this.app.vault.cachedRead(this.fileFor(path)),
      renderMarkdown: (content, element, path) => view.renderMarkdown(content, element, path),
      updateNote: (path, patch) => this.updateNote(path, patch),
      createNote: (input) => this.createNote(input),
      subscribe: (callback) => {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
      },
      notice: (message) => new Notice(String(message)),
      openGraph: async () => {
        try {
          const leaf = this.app.workspace.getLeavesOfType("graph")[0] || this.app.workspace.getLeaf("tab");
          await leaf.setViewState({ type: "graph", active: true });
          await this.app.workspace.revealLeaf(leaf);
        } catch (error) {
          new Notice("\u8BF7\u5148\u542F\u7528 Obsidian \u7684\u5173\u7CFB\u56FE\u8C31\u6838\u5FC3\u63D2\u4EF6\u3002");
          console.warn("\u77E5\u95F4\uFF1A\u5173\u7CFB\u56FE\u8C31\u6253\u5F00\u5931\u8D25", error);
        }
      }
    };
  }
};
