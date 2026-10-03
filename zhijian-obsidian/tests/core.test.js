// Regression fixtures use in-memory Obsidian/browser mocks; they do not verify a real Obsidian app load.
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const Core = require("../core");

function clone(value) { return JSON.parse(JSON.stringify(value)); }

class Events {
  constructor() { this.handlers = new Map(); }
  on(event, handler) { const list = this.handlers.get(event) || []; list.push(handler); this.handlers.set(event, list); return { event, handler }; }
  emit(event, ...args) { for (const handler of this.handlers.get(event) || []) handler(...args); }
}

class TFile {
  constructor(filePath, content = "", frontmatter = {}) {
    this.path = filePath;
    this.name = filePath.split("/").pop();
    this.basename = this.name.replace(/\.md$/i, "");
    this.extension = this.name.split(".").pop();
    this.parent = { path: filePath.split("/").slice(0, -1).join("/") };
    this.stat = { ctime: new Date("2026-09-01T12:00:00").valueOf(), mtime: new Date("2026-10-02T12:00:00").valueOf() };
    this.content = content;
    this.fm = frontmatter;
    this.cache = { frontmatter: clone(frontmatter) };
  }
}
class TFolder { constructor(folderPath) { this.path = folderPath; } }

function parseFixtureFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]+?)\n---/);
  if (!match) return {};
  return Object.fromEntries(match[1].split("\n").map(line => {
    const separator = line.indexOf(":");
    const key = line.slice(0, separator), value = line.slice(separator + 1).trim();
    try { return [key, JSON.parse(value)]; } catch (_) { return [key, value]; }
  }));
}

function makeApp() {
  const vault = new Events(), metadataCache = new Events();
  const files = new Map(), writes = [], reads = [];
  vault.getAbstractFileByPath = filePath => files.get(filePath) || null;
  vault.getMarkdownFiles = () => [...files.values()].filter(file => file instanceof TFile && file.extension === "md");
  vault.getName = () => "Mock LLMWiki";
  vault.cachedRead = async file => { reads.push(file.path); return file.content; };
  vault.createFolder = async folderPath => {
    if (files.has(folderPath)) throw new Error("already exists");
    const folder = new TFolder(folderPath); files.set(folderPath, folder); return folder;
  };
  vault.create = async (filePath, content) => {
    if (files.has(filePath)) throw new Error("already exists");
    const file = new TFile(filePath, content, parseFixtureFrontmatter(content));
    files.set(filePath, file); writes.push({ kind: "create", path: filePath }); vault.emit("create", file); return file;
  };
  vault.process = async (file, updater) => {
    file.content = updater(file.content); file.stat.mtime++; writes.push({ kind: "process", path: file.path });
  };
  metadataCache.getFileCache = file => file.cache;
  metadataCache.getFirstLinkpathDest = (link, sourcePath) => {
    const absolute = files.get(link) || files.get(`${link}.md`);
    if (absolute instanceof TFile) return absolute;
    const relative = `${sourcePath.split("/").slice(0, -1).join("/")}/${link.replace(/\.md$/i, "")}.md`;
    return files.get(relative) || [...files.values()].find(file => file instanceof TFile && file.basename === link.replace(/\.md$/i, "")) || null;
  };
  const fileManager = {
    active: 0, maxActive: 0,
    async processFrontMatter(file, mutation) {
      this.active++; this.maxActive = Math.max(this.maxActive, this.active);
      try {
        const mutated = clone(file.fm);
        mutation(mutated);
        await new Promise(resolve => setTimeout(resolve, 3));
        if (this.failNext) { this.failNext = false; throw new Error("mock disk write failed"); }
        file.fm = mutated;
        file.stat.mtime++;
        file.cache = { ...file.cache, frontmatter: clone(file.fm) };
        writes.push({ kind: "frontmatter", path: file.path });
        metadataCache.emit("changed", file, file.content, file.cache);
      } finally { this.active--; }
    }
  };
  const workspace = { getLeavesOfType: () => [], getActiveViewOfType() { return this.activeView || null; }, detachLeavesOfType(type) { this.detachedView = type; } };
  return { vault, metadataCache, fileManager, workspace, files, writes, reads };
}

function loadPlugin(app) {
  class Plugin {
    constructor() { this.app = app; this.cleanups = []; }
    async loadData() { return null; }
    async saveData(data) { this.savedData = clone(data); }
    registerView(type, factory) { this.viewType = type; this.viewFactory = factory; }
    addRibbonIcon() {} addCommand() {} addSettingTab() {} registerEvent() {}
    register(callback) { this.cleanups.push(callback); }
  }
  class Setting {}
  class PluginSettingTab { constructor(application, plugin) { this.app = application; this.plugin = plugin; } }
  const notices = [];
  const moduleFixture = { exports: {} };
  const globals = {
    module: moduleFixture, exports: moduleFixture.exports,
    require(name) {
      if (name === "obsidian") return { Plugin, ItemView: class {}, TFile, TFolder, Notice: class { constructor(message) { notices.push(message); } }, Component: class {}, MarkdownRenderer: {}, PluginSettingTab, Setting };
      if (name === "./core" || name === "../core") return Core;
      if (name === "./ui" || name === "../ui") return { mount: () => ({ destroy() {}, refresh() {} }) };
      if (name === "./icons" || name === "../icons") return { leaf: "<svg></svg>" };
      if (name === "./fx" || name === "../fx") return { mount: () => ({ destroy() {} }) };
      throw new Error(`Unexpected dependency ${name}`);
    },
    window: { setTimeout, clearTimeout, ZhijianIcons: "previous-icons", ZhijianFX: "previous-fx", ZhijianGraph: "previous-graph", ZhijianCarousel: "previous-carousel" }, console, setTimeout, clearTimeout
  };
  const main = fs.readFileSync(path.join(__dirname, process.env.ZHIJIAN_TEST_SOURCE === "src" ? "../src/plugin.js" : "../main.js"), "utf8");
  vm.runInNewContext(main, globals, { filename: "main.js" });
  const plugin = new moduleFixture.exports();
  plugin.notices = notices;
  plugin.testWindow = globals.window;
  return plugin;
}

async function run() {
  assert.equal(Core.dateKey("2026-10-03"), "2026-10-03");
  assert.equal(Core.dateKey("2026-02-30"), "");
  assert.equal(Core.dateKey("2024-02-29"), "2024-02-29");
  assert.equal(Core.dateKey("2026-13-01"), "");
  assert.equal(Core.stripFrontmatter("---\ntitle: test\n---\n\n正文"), "\n正文");
  assert.equal(Core.excerpt("---\ntitle: secret\n---\n# 主题\n\n正文 [[资源|来源]] `词`\n```js\nhidden\n```"), "主题 正文 来源 词");
  for (const invalid of ["../outside", "C:/outside", "/absolute", "folder/../note", "folder\u0000note"]) assert.throws(() => Core.normalizePath(invalid));
  for (const invalid of ["", ".md", ".", "..", "../escape", "CON", "A|B", "A[B]", "A#heading"]) assert.throws(() => Core.safeTitle(invalid));
  assert.equal(Core.isExcluded("04-辅助/私密/账号.md"), true);
  assert.equal(Core.isExcluded("04-辅助/私密2/公开.md"), false);
  assert.equal(Core.isExcluded("06-Skills/ingest/SKILL.md"), false);
  assert.equal(Core.isExcluded("03-资源/summary-template.md"), true);
  assert.equal(Core.isReadonly("03-资源/原始资料/采访.md"), true);
  assert.equal(Core.isReadonly("03-资源/原始资料摘要/采访.md"), false);
  assert.equal(Core.classify("06-Skills/工作流程.md"), "Skills");
  assert.equal(Core.cleanSettings({}).motion, "full");
  assert.equal(Core.cleanSettings({ motion: "subtle" }).motion, "subtle");
  assert.equal(Core.cleanSettings({ motion: "invalid" }).motion, "full");
  assert.equal(Core.noteFromFile(new TFile("06-Skills/ingest-source/SKILL.md")).title, "ingest-source");
  assert.equal(Core.classify("03-资源/来源摘要/采访.md", { type: "source-summary" }), "资源");

  const originalFm = { type: "resource", status: "reference", updated: "2026-09-01", tags: ["保留"], custom: { nested: [1, 2] } };
  const updatedFm = clone(originalFm);
  Core.applyStatus(updatedFm, { reading: "在读" }, "2026-10-03");
  Core.applyStatus(updatedFm, { reading: "已读", absorption: "已沉淀" }, "2026-10-04");
  Core.applyStatus(updatedFm, { reading: "未读" }, "2026-10-05");
  assert.equal(updatedFm["开始阅读"], "2026-10-03");
  assert.equal(updatedFm["完成阅读"], "2026-10-04");
  for (const key of Object.keys(originalFm)) assert.deepEqual(updatedFm[key], originalFm[key]);
  assert.throws(() => Core.applyStatus(updatedFm, { reading: "bad", absorption: "待沉淀" }));
  assert.equal(updatedFm["吸收状态"], "已沉淀");

  const draft = Core.buildNewNote({ title: "可复用框架", folder: "02-资产/方法", tags: ["#框架", "框架"], content: "## 想法\n\n[[index]]" }, "2026-10-03");
  assert.equal(draft.frontmatter.type, "asset");
  assert.equal(draft.frontmatter.created, "2026-10-03");
  assert.deepEqual(draft.frontmatter.tags, ["框架"]);
  assert.deepEqual(draft.frontmatter.related, ["[[index|知识库总索引]]"]);
  assert.notEqual(Core.buildNewNote({ title: "A$", folder: "02-资产" }, "2026-10-03").frontmatter.id, Core.buildNewNote({ title: "A", folder: "02-资产" }, "2026-10-03").frontmatter.id);
  assert.throws(() => Core.buildNewNote({ title: "原始覆盖", folder: "03-资源/原始资料" }));
  const indexOriginal = "# 索引\n\n## 项目\n\n- [[01-项目/旧项目]]：保留说明。\n\n## 资产\n\n- [[02-资产/旧资产]]：保留资产。\n\n## 最近变化\n\n原有变化\n";
  const indexUpdated = Core.indexEntry(indexOriginal, draft);
  assert.ok(indexUpdated.includes("保留说明"));
  assert.ok(indexUpdated.includes("保留资产"));
  assert.ok(indexUpdated.indexOf(draft.title) < indexUpdated.indexOf("## 最近变化"));
  assert.equal(Core.indexEntry(indexUpdated, draft), indexUpdated);

  const app = makeApp();
  const article = new TFile("03-资源/研究.md", "# 研究\n\n已有正文与引用。", clone(originalFm));
  article.cache.links = [{ link: "原始资料/采访" }];
  const raw = new TFile("03-资源/原始资料/采访.md", "只读来源正文", { created: "2026-09-01" });
  const privateFile = new TFile("04-辅助/私密/凭证.md", "DO_NOT_READ", {});
  const template = new TFile("06-Skills/_模板/SKILL.md", "DO_NOT_READ", {});
  const indexFile = new TFile("index.md", indexOriginal, { type: "support", updated: "2026-09-01" });
  const logFile = new TFile("log.md", "# 变更日志\n\n## [2026-09-01] setup | 历史记录\n\n保留历史。\n", {});
  for (const file of [article, raw, privateFile, template, indexFile, logFile]) app.files.set(file.path, file);
  const plugin = loadPlugin(app);
  await plugin.onload();
  assert.equal(plugin.viewType, "zhijian-studio-view");
  assert.equal(typeof plugin.testWindow.ZhijianFX.mount, "function", "原生加载后发布 bundled FX API");
  assert.equal(typeof plugin.testWindow.ZhijianIcons.leaf, "string");
  assert.equal(typeof plugin.testWindow.ZhijianGraph.mount, "function", "原生加载后发布 bundled force graph API");
  assert.equal(typeof plugin.testWindow.ZhijianCarousel.mount, "function", "原生加载后发布 bundled carousel API");
  let notes = await plugin.getNotes();
  assert.equal(notes.length, 2);
  assert.equal(notes.find(note => note.path === raw.path).readonly, true);
  assert.deepEqual(clone(notes.find(note => note.path === article.path).links), [raw.path], "原生关系图使用从源文件解析的完整路径");
  assert.equal(app.writes.length, 0, "开启和索引不得自动补写任何属性");
  assert.equal(app.reads.some(file => file === privateFile.path || file === template.path), false, "排除目录不得读取正文");
  const readsAfterFirstScan = app.reads.length;
  await plugin.getNotes();
  assert.equal(app.reads.length, readsAfterFirstScan, "未变化笔记应复用摘要缓存");

  app.fileManager.failNext = true;
  await assert.rejects(plugin.updateNote(article.path, { reading: "在读" }), /mock disk write failed/);
  assert.equal(plugin.frontmatterOverrides.has(article.path), false, "写失败后清除未提交的状态快照");
  assert.equal(article.fm["阅读状态"], undefined);

  await assert.rejects(plugin.updateNote(raw.path, { reading: "已读" }), /只读/);
  assert.equal(app.writes.length, 0);
  await assert.rejects(plugin.updateNote(article.path, { reading: "bogus" }), /无效/);
  assert.equal(app.writes.length, 0);
  await Promise.all([
    plugin.updateNote(article.path, { reading: "在读" }),
    plugin.updateNote(article.path, { reading: "已读", absorption: "已沉淀" })
  ]);
  assert.equal(app.fileManager.maxActive, 1, "并发操作必须串行保留前次写入");
  assert.equal(article.fm["阅读状态"], "已读");
  assert.equal(article.fm["吸收状态"], "已沉淀");
  assert.deepEqual(article.fm.custom, originalFm.custom);
  assert.equal(article.fm.updated, "2026-09-01", "阅读操作不改变实质内容更新时间");
  assert.equal(article.content, "# 研究\n\n已有正文与引用。", "状态操作保留正文");
  notes = await plugin.getNotes();
  assert.equal(notes.find(note => note.path === article.path).reading, "已读");

  const previousLog = logFile.content;
  const createdPath = await plugin.createNote({ title: "新主题", folder: "05-灵感/观察", tags: ["设计"], content: "## 观察\n\n等待补充资料。" });
  const created = app.files.get(createdPath);
  assert.equal(created.fm.type, "idea");
  assert.equal(created.fm.status, "incubating");
  for (const field of ["id", "title", "type", "status", "created", "updated", "tags", "sources", "related"]) assert.ok(field in created.fm, `新页需要 ${field}`);
  assert.ok(indexFile.content.includes("[[05-灵感/观察/新主题|新主题]]"));
  assert.ok(logFile.content.startsWith(previousLog), "日志只能追加并完整保留历史字节");
  assert.ok(logFile.content.includes("create | 新主题"));
  await assert.rejects(plugin.createNote({ title: "新主题", folder: "05-灵感/观察" }), /同名页面/);
  assert.equal((logFile.content.match(/create \| 新主题/g) || []).length, 1);
  await assert.rejects(plugin.createNote({ title: "误写", folder: "03-资源/原始资料" }), /只读/);
  await assert.rejects(plugin.createNote({ title: "误写", folder: "04-辅助/私密" }), /包含的目录/);

  const viewFixture = { renderMarkdown: async () => {} };
  const adapter = plugin.adapter(viewFixture);
  assert.equal(adapter.isActive(), false, "后台工作台不捕获笔记编辑器快捷键");
  app.workspace.activeView = viewFixture;
  assert.equal(adapter.isActive(), true);
  app.workspace.activeView = null;
  await assert.rejects(adapter.readNote(privateFile.path), /排除范围/);
  const settingsCopy = adapter.getSettings();
  settingsCopy.excludedPaths.length = 0;
  assert.deepEqual(clone(plugin.settings.excludedPaths), ["04-辅助/私密"]);
  await plugin.saveSettings({ bookmarks: [article.path, article.path, "../invalid", 7] });
  assert.deepEqual(clone(plugin.settings.bookmarks), [article.path]);
  const bookmarksCopy = adapter.getSettings();
  bookmarksCopy.bookmarks.length = 0;
  assert.deepEqual(clone(plugin.settings.bookmarks), [article.path]);
  let callbackCount = 0;
  const unsubscribe = adapter.subscribe(() => callbackCount++);
  app.vault.emit("rename", article, "03-资源/研究旧名.md");
  await new Promise(resolve => setTimeout(resolve, 140));
  assert.equal(callbackCount, 1);
  unsubscribe();
  app.vault.emit("create", raw);
  await new Promise(resolve => setTimeout(resolve, 140));
  assert.equal(callbackCount, 1);
  assert.equal(raw.fm["阅读状态"], undefined, "新增原始资料事件不得初始化 YAML");

  plugin.onunload();
  assert.equal(app.workspace.detachedView, "zhijian-studio-view", "卸载时关闭所有工作台视图");
  for (const cleanup of plugin.cleanups) cleanup();
  assert.equal(plugin.testWindow.ZhijianIcons, "previous-icons", "清理时恢复原图标全局引用");
  assert.equal(plugin.testWindow.ZhijianFX, "previous-fx", "清理时恢复原FX全局引用");
  assert.equal(plugin.testWindow.ZhijianGraph, "previous-graph", "清理时恢复原图谱全局引用");
  assert.equal(plugin.testWindow.ZhijianCarousel, "previous-carousel", "清理时恢复原轮播全局引用");
  console.log("PASS: core normalization, read-only indexing, private exclusions, cached reads, serialized YAML updates, schema creation, index/log preservation, duplicate prevention, and event cleanup.");
}

run().catch(error => { console.error(error); process.exitCode = 1; });
