(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ZhijianCore = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const READING = ["未读", "在读", "已读"];
  const ABSORPTION = ["待沉淀", "已沉淀", "无需沉淀"];
  const DEFAULTS = { displayName: "Y", theme: "dark", motion: "full", excludedPaths: ["04-辅助/私密"], bookmarks: [] };
  const ROUTES = [
    { category: "项目", folder: "01-项目", type: "project" },
    { category: "资产", folder: "02-资产", type: "asset" },
    { category: "资源", folder: "03-资源", type: "resource" },
    { category: "辅助", folder: "04-辅助", type: "support" },
    { category: "灵感", folder: "05-灵感", type: "idea" },
    { category: "Skills", folder: "06-Skills", type: "skill" }
  ];
  const SYSTEM_FILES = new Set(["readme.md", "agents.md", "claude.md", "index.md", "log.md"]);

  function localDate(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.valueOf())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function dateKey(value) {
    if (typeof value === "string") {
      const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/);
      if (match) {
        const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
        return parsed.getFullYear() === Number(match[1]) && parsed.getMonth() + 1 === Number(match[2]) && parsed.getDate() === Number(match[3]) ? match[0].slice(0, 10) : "";
      }
    }
    if (value === undefined || value === null || value === "") return "";
    const parsed = new Date(typeof value === "number" && value < 1e11 ? value * 1000 : value);
    return Number.isFinite(parsed.valueOf()) ? localDate(parsed) : "";
  }

  function timestamp(value, fallback = 0) {
    const key = dateKey(value);
    if (key) return new Date(`${key}T12:00:00`).valueOf();
    return Number.isFinite(Number(fallback)) ? Number(fallback) : 0;
  }

  function normalizePath(value, allowEmpty = false) {
    if (typeof value !== "string") throw new Error("请输入知识库内的相对路径。");
    const path = value.replace(/\\/g, "/").replace(/\/{2,}/g, "/").replace(/\/$/, "").trim();
    if (!path && allowEmpty) return "";
    if (!path || path.startsWith("/") || /^[A-Za-z]:/.test(path) || /[\u0000-\u001f]/.test(path) || path.split("/").some(part => !part || part === "." || part === "..")) {
      throw new Error("路径须位于当前知识库内。");
    }
    return path;
  }

  function inPath(path, prefix) {
    const current = String(path).replace(/\\/g, "/").toLowerCase();
    const root = String(prefix).replace(/\\/g, "/").replace(/\/$/, "").toLowerCase();
    return current === root || current.startsWith(root + "/");
  }

  function isReadonly(path) { return inPath(path, "03-资源/原始资料"); }

  function isExcluded(path, settings = DEFAULTS) {
    const normalized = String(path).replace(/\\/g, "/");
    const segments = normalized.split("/");
    if (segments.some(part => [".obsidian", ".git", ".trash", "node_modules"].includes(part.toLowerCase()))) return true;
    const name = segments[segments.length - 1].toLowerCase();
    if (!name.endsWith(".md") || SYSTEM_FILES.has(name)) return true;
    if (segments.some(part => /(?:模板|(?:^|[-_\s])templates?(?:[-_.\s]|$))/i.test(part))) return true;
    return (Array.isArray(settings.excludedPaths) ? settings.excludedPaths : DEFAULTS.excludedPaths).some(prefix => prefix && inPath(normalized, prefix));
  }

  function cleanSettings(raw) {
    const value = raw && typeof raw === "object" ? raw : {};
    const excludedPaths = Array.isArray(value.excludedPaths) ? value.excludedPaths : DEFAULTS.excludedPaths;
    return {
      displayName: typeof value.displayName === "string" && value.displayName.trim() ? value.displayName.trim().slice(0, 40) : DEFAULTS.displayName,
      theme: ["light", "dark"].includes(value.theme) ? value.theme : DEFAULTS.theme,
      motion: ["full", "subtle", "off"].includes(value.motion) ? value.motion : "full",
      excludedPaths: [...new Set(excludedPaths.map(path => { try { return normalizePath(path); } catch (_) { return ""; } }).filter(Boolean))],
      bookmarks: [...new Set((Array.isArray(value.bookmarks) ? value.bookmarks : []).map(path => { try { return normalizePath(path); } catch (_) { return ""; } }).filter(Boolean))]
    };
  }

  function classify(path, frontmatter = {}) {
    const type = String(frontmatter.type || "").toLowerCase();
    const declared = ROUTES.find(route => route.type === type || type === "source-summary" && route.type === "resource");
    const routed = ROUTES.find(route => inPath(path, route.folder));
    return (routed || declared || ROUTES[3]).category;
  }

  function list(value) {
    if (Array.isArray(value)) return value.flatMap(list);
    if (typeof value === "string") return value.split(/[,，\n]/).map(item => item.trim()).filter(Boolean);
    return [];
  }

  function tags(frontmatter, cache = {}) {
    const all = [...list(frontmatter.tags), ...list(frontmatter["标签"]), ...(cache.tags || []).map(tag => tag.tag)];
    return [...new Set(all.map(tag => String(tag).replace(/^#+/, "").trim()).filter(Boolean))];
  }

  function linkPath(value) {
    return String(value || "").trim().replace(/^!?\[\[/, "").replace(/\]\]$/, "").split("|")[0].split("#")[0].trim();
  }

  function stripFrontmatter(content) {
    return String(content || "").replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
  }

  function excerpt(content) {
    return stripFrontmatter(content)
      .replace(/```[\s\S]*?```/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/!?\[\[([^\]]+)\]\]/g, (_, value) => value.split("|").pop().split("#")[0])
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/<[^>]*>/g, "")
      .replace(/^[#>\s*-]+/gm, "")
      .replace(/[`*_~]/g, "")
      .replace(/\s+/g, " ").trim().slice(0, 200);
  }

  function noteFromFile(file, cache = {}, content = "") {
    const fm = cache.frontmatter || {};
    const path = String(file.path);
    const basename = file.basename || path.split("/").pop().replace(/\.md$/i, "");
    const parentPath = file.parent?.path || path.split("/").slice(0, -1).join("/");
    const createdValue = fm.created ?? fm["创建日期"] ?? fm.date;
    return {
      path,
      title: typeof fm.title === "string" && fm.title.trim() ? fm.title.trim() : basename.toLowerCase() === "skill" ? parentPath.split("/").pop() || "Skill" : basename,
      folder: parentPath || "根目录",
      category: classify(path, fm),
      reading: READING.includes(fm["阅读状态"]) ? fm["阅读状态"] : "未读",
      absorption: ABSORPTION.includes(fm["吸收状态"]) ? fm["吸收状态"] : "待沉淀",
      tags: tags(fm, cache),
      excerpt: excerpt(content),
      created: timestamp(createdValue, file.stat?.ctime),
      modified: Number(file.stat?.mtime) || timestamp(fm.updated ?? fm["更新日期"]),
      readDate: dateKey(fm["完成阅读"] ?? fm.readDate),
      links: [...new Set([...list(fm.related), ...list(fm["关联"]), ...(cache.links || []).map(link => link.link)].map(linkPath).filter(Boolean))],
      readonly: isReadonly(path),
      createdFromFrontmatter: Boolean(dateKey(createdValue))
    };
  }

  function applyStatus(frontmatter, patch, date = localDate()) {
    if (!patch || typeof patch !== "object") throw new Error("请选择要更新的状态。");
    if (patch.reading !== undefined && !READING.includes(patch.reading)) throw new Error("阅读状态无效。");
    if (patch.absorption !== undefined && !ABSORPTION.includes(patch.absorption)) throw new Error("吸收状态无效。");
    let changed = false;
    if (patch.reading !== undefined && frontmatter["阅读状态"] !== patch.reading) {
      frontmatter["阅读状态"] = patch.reading;
      if (patch.reading === "在读" && !frontmatter["开始阅读"]) frontmatter["开始阅读"] = date;
      if (patch.reading === "已读" && !frontmatter["完成阅读"]) frontmatter["完成阅读"] = date;
      changed = true;
    }
    if (patch.absorption !== undefined && frontmatter["吸收状态"] !== patch.absorption) {
      frontmatter["吸收状态"] = patch.absorption;
      changed = true;
    }
    if (changed) frontmatter["状态更新时间"] = date;
    return changed;
  }

  function safeTitle(value) {
    const title = String(value || "").trim().replace(/\.md$/i, "");
    if (!title || title.length > 120 || /[\\/:*?"<>|#\[\]\u0000-\u001f]/.test(title) || /[. ]$/.test(title) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(title)) {
      throw new Error("请填写 1–120 字标题，并避开文件名保留字符。");
    }
    return title;
  }

  function buildNewNote(input, date = localDate()) {
    const title = safeTitle(input?.title);
    const folder = normalizePath(input?.folder || "04-辅助/收件箱");
    if (isReadonly(folder)) throw new Error("原始资料目录保持只读，请选择其他分类。");
    const route = ROUTES.find(item => inPath(folder, item.folder)) || ROUTES[3];
    const slug = title.toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "note";
    let identity = 2166136261;
    for (const character of `${folder}/${title}`) identity = Math.imul(identity ^ character.codePointAt(0), 16777619) >>> 0;
    const noteTags = [...new Set(list(input?.tags).map(tag => tag.replace(/^#+/, "")).filter(Boolean))];
    const schema = {
      id: `${route.type}-${date.replace(/-/g, "")}-${slug}-${identity.toString(36)}`, title, type: route.type,
      status: route.type === "idea" ? "incubating" : route.type === "resource" ? "reference" : "active",
      created: date, updated: date, tags: noteTags, sources: [], related: ["[[index|知识库总索引]]"],
      "阅读状态": "未读", "吸收状态": "待沉淀"
    };
    const yaml = Object.entries(schema).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n");
    const body = stripFrontmatter(input?.content || "").trim();
    const content = `---\n${yaml}\n---\n\n# ${title}\n\n${body || "## 正文\n\n\n## 来源与关联\n\n- [[index|知识库总索引]]"}\n`;
    return { title, folder, category: route.category, type: route.type, path: `${folder}/${title}.md`, content, frontmatter: schema };
  }

  function indexEntry(content, note) {
    const linkTarget = note.path.replace(/\.md$/i, "");
    if (String(content).includes(`[[${linkTarget}|`) || String(content).includes(`[[${linkTarget}]]`)) return String(content);
    const line = `- [[${linkTarget}|${note.title}]]：通过知间创建，待补充主题说明。`;
    const lines = String(content).split(/\r?\n/);
    const header = lines.findIndex(value => value.trim() === `## ${note.category}`);
    if (header < 0) return String(content) + (String(content).endsWith("\n") ? "" : "\n") + `\n## ${note.category}\n\n${line}\n`;
    let insertion = header + 1;
    while (insertion < lines.length && !/^##\s/.test(lines[insertion])) insertion++;
    const added = insertion < lines.length ? [line, ""] : [line];
    while (insertion > header + 1 && !lines[insertion - 1].trim()) insertion--;
    lines.splice(insertion, 0, ...added);
    return lines.join("\n");
  }

  function logEntry(note, date = localDate()) {
    return `\n## [${date}] create | ${note.title}\n\n- 通过知间创建[[${note.path.replace(/\.md$/i, "")}|${note.title}]]，归入${note.category}。\n- 已添加知识库总索引条目；页面使用维护协议中的 YAML schema。\n`;
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
