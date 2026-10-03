"use strict";

const { Plugin, ItemView, TFile, TFolder, Notice, Component, MarkdownRenderer, PluginSettingTab, Setting } = require("obsidian");
const Core = require("../core");
const UI = require("../ui");
const Icons = require("../icons");
const FX = require("../fx");
const Graph = require("../graph");
const Carousel = require("../carousel");
const VIEW_TYPE = "zhijian-studio-view";

class StudioView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.markdownComponents = new Map();
  }
  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return "知间 · Knowledge Studio"; }
  getIcon() { return "panels-top-left"; }
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
    for (const [target, component] of this.markdownComponents) {
      if (target === element || !target.isConnected) {
        this.removeChild(component);
        this.markdownComponents.delete(target);
      }
    }
    const component = new Component();
    this.addChild(component);
    this.markdownComponents.set(element, component);
    element.empty();
    await MarkdownRenderer.render(this.app, content, element, path, component);
  }
}

class StudioSettings extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    this.containerEl.empty();
    this.containerEl.createEl("h2", { text: "知间 · Knowledge Studio" });
    new Setting(this.containerEl).setName("显示名称").setDesc("用于工作台问候语。")
      .addText(text => text.setValue(this.plugin.settings.displayName).onChange(value => this.plugin.saveSettings({ displayName: value })));
    new Setting(this.containerEl).setName("主题").setDesc("工作台使用独立的浅色或深色外观。")
      .addDropdown(dropdown => dropdown.addOptions({ light: "浅色", dark: "深色" }).setValue(this.plugin.settings.theme).onChange(value => this.plugin.saveSettings({ theme: value })));
    new Setting(this.containerEl).setName("动效强度").setDesc("极光流动、纵深粒子与玻璃卡片交互；系统减少动态效果偏好优先。")
      .addDropdown(dropdown => dropdown.addOptions({ full: "完整动效", subtle: "柔和动效", off: "关闭动效" }).setValue(this.plugin.settings.motion).onChange(value => this.plugin.saveSettings({ motion: value })));
    new Setting(this.containerEl).setName("排除目录").setDesc("每行一个相对路径；默认排除私密资料。系统说明与模板不会进入卡片列表。")
      .addTextArea(text => text.setValue(this.plugin.settings.excludedPaths.join("\n")).onChange(value => this.plugin.saveSettings({ excludedPaths: value.split(/\r?\n/).map(path => path.trim()).filter(Boolean) })));
    this.containerEl.createEl("p", { text: "原始资料保持只读。刷新只建立索引；显式修改状态才写入 YAML，新页面会同步 index.md 与 log.md。" });
  }
}

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
        if (previousIcons === undefined) delete window.ZhijianIcons;
        else window.ZhijianIcons = previousIcons;
      }
      if (window.ZhijianFX === FX) {
        if (previousFX === undefined) delete window.ZhijianFX;
        else window.ZhijianFX = previousFX;
      }
      if (window.ZhijianGraph === Graph) {
        if (previousGraph === undefined) delete window.ZhijianGraph;
        else window.ZhijianGraph = previousGraph;
      }
      if (window.ZhijianCarousel === Carousel) {
        if (previousCarousel === undefined) delete window.ZhijianCarousel;
        else window.ZhijianCarousel = previousCarousel;
      }
    });
    this.noteCache = new Map();
    this.frontmatterOverrides = new Map();
    this.listeners = new Set();
    this.operationQueue = Promise.resolve();
    this.registerView(VIEW_TYPE, leaf => new StudioView(leaf, this));
    this.addRibbonIcon("panels-top-left", "打开知间知识工作台", () => this.activateView());
    this.addCommand({ id: "open-zhijian-studio", name: "打开知间知识工作台", callback: () => this.activateView() });
    this.addCommand({ id: "open-zhijian-sidebar", name: "在右侧栏打开知间", callback: () => this.activateView(true) });
    this.addSettingTab(new StudioSettings(this.app, this));
    this.registerEvent(this.app.metadataCache.on("changed", file => {
      this.frontmatterOverrides.delete(file.path);
      this.invalidate(file.path);
    }));
    this.registerEvent(this.app.vault.on("create", file => this.invalidate(file.path)));
    this.registerEvent(this.app.vault.on("delete", file => {
      this.frontmatterOverrides.delete(file.path);
      if (file instanceof TFolder) this.clearPathCache(file.path);
      this.invalidate(file.path);
    }));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      this.noteCache.delete(oldPath);
      this.frontmatterOverrides.delete(oldPath);
      if (file instanceof TFolder) { this.clearPathCache(oldPath); this.clearPathCache(file.path); }
      this.invalidate(file.path);
    }));
    this.register(() => { window.clearTimeout(this.notifyTimer); this.listeners.clear(); this.noteCache.clear(); this.frontmatterOverrides.clear(); });
  }

  async activateView(sidebar = false) {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) leaf = sidebar ? this.app.workspace.getRightLeaf(false) : this.app.workspace.getLeaf("tab");
    if (!leaf) leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    await this.app.workspace.revealLeaf(leaf);
  }

  onunload() { this.app.workspace.detachLeavesOfType(VIEW_TYPE); }

  invalidate(path) {
    this.noteCache.delete(path);
    window.clearTimeout(this.notifyTimer);
    this.notifyTimer = window.setTimeout(() => {
      for (const listener of this.listeners) {
        try { listener(); } catch (error) { console.error("知间视图更新失败", error); }
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
    const files = this.app.vault.getMarkdownFiles().filter(file => !Core.isExcluded(file.path, this.settings));
    const notes = await Core.mapLimit(files, 8, async file => {
      const cached = this.noteCache.get(file.path);
      if (cached && cached.mtime === file.stat.mtime) return cached.note;
      const metadata = this.app.metadataCache.getFileCache(file) || {};
      const cache = this.frontmatterOverrides.has(file.path) ? { ...metadata, frontmatter: this.frontmatterOverrides.get(file.path) } : metadata;
      let content = "";
      try { content = await this.app.vault.cachedRead(file); }
      catch (error) { console.warn("知间：笔记摘要读取失败", file.path, error); }
      const note = Core.noteFromFile(file, cache, content);
      note.links = [...new Set(note.links.map(link => this.app.metadataCache.getFirstLinkpathDest(link, file.path)?.path || link))];
      this.noteCache.set(file.path, { mtime: file.stat.mtime, note });
      return note;
    });
    return notes.sort((a, b) => b.modified - a.modified || a.title.localeCompare(b.title, "zh-CN"));
  }

  fileFor(path, writable = false) {
    const normalized = Core.normalizePath(path);
    const file = this.app.vault.getAbstractFileByPath(normalized);
    if (!(file instanceof TFile) || file.extension !== "md") throw new Error("笔记已移动或删除，请刷新工作台。");
    if (Core.isExcluded(normalized, this.settings)) throw new Error("此页面位于工作台排除范围。");
    if (writable && Core.isReadonly(normalized)) throw new Error("原始资料保持只读，请在来源摘要中记录阅读与沉淀。");
    return file;
  }

  enqueue(operation) {
    const result = this.operationQueue.then(operation);
    this.operationQueue = result.catch(() => {});
    return result;
  }

  updateNote(path, patch) {
    return this.enqueue(async () => {
      const file = this.fileFor(path, true);
      Core.applyStatus({}, patch);
      try {
        await this.app.fileManager.processFrontMatter(file, frontmatter => {
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
      if (existing && !(existing instanceof TFolder)) throw new Error(`目录位置已有同名文件：${current}`);
      if (!existing) {
        try { await this.app.vault.createFolder(current); }
        catch (error) { if (!(this.app.vault.getAbstractFileByPath(current) instanceof TFolder)) throw error; }
      }
    }
  }

  async updateMaintenance(note) {
    const date = Core.localDate();
    let index = this.app.vault.getAbstractFileByPath("index.md");
    if (index && !(index instanceof TFile)) throw new Error("index.md 位置不是文件。");
    if (!index) index = await this.app.vault.create("index.md", `---\nid: SYS-index\ntitle: 知识库总索引\ntype: support\nstatus: active\ncreated: ${date}\nupdated: ${date}\ntags: [index]\nsources: []\nrelated: []\n---\n\n# 知识库总索引\n`);
    await this.app.vault.process(index, content => Core.indexEntry(content, note));
    await this.app.fileManager.processFrontMatter(index, frontmatter => { frontmatter.updated = date; });
    let log = this.app.vault.getAbstractFileByPath("log.md");
    if (log && !(log instanceof TFile)) throw new Error("log.md 位置不是文件。");
    if (!log) log = await this.app.vault.create("log.md", "# 变更日志\n\n本文件只追加，不改写历史。\n");
    await this.app.vault.process(log, content => content + (content.endsWith("\n") ? "" : "\n") + Core.logEntry(note, date));
  }

  createNote(input) {
    return this.enqueue(async () => {
      const note = Core.buildNewNote(input);
      if (Core.isExcluded(note.path, this.settings)) throw new Error("请选择工作台包含的目录与页面名称。");
      for (const maintenancePath of ["index.md", "log.md"]) {
        const existing = this.app.vault.getAbstractFileByPath(maintenancePath);
        if (existing && !(existing instanceof TFile)) throw new Error(`${maintenancePath} 位置不是文件。`);
      }
      if (this.app.vault.getAbstractFileByPath(note.path)) throw new Error("已有同名页面，请优先打开并更新，或使用独立的新标题。");
      await this.ensureFolder(note.folder);
      const file = await this.app.vault.create(note.path, note.content);
      this.frontmatterOverrides.set(file.path, note.frontmatter);
      try { await this.updateMaintenance(note); }
      catch (error) {
        this.invalidate(file.path);
        new Notice(`页面已创建：${note.path}。索引或日志更新未完成，请检查后补充。`, 10000);
        console.error("知间：页面维护记录更新失败", error);
        const failure = new Error(`页面已创建于 ${note.path}；索引或日志更新未完成：${error.message}`);
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
      saveSettings: patch => this.saveSettings(patch),
      getVaultName: () => this.app.vault.getName(),
      supportsNativeGraph: true,
      isActive: () => this.app.workspace.getActiveViewOfType(StudioView) === view,
      openNote: async path => {
        const file = this.fileFor(path);
        const existing = this.app.workspace.getLeavesOfType("markdown").find(leaf => leaf.view?.file?.path === file.path);
        const leaf = existing || this.app.workspace.getLeaf("tab");
        await leaf.openFile(file, { active: true });
        await this.app.workspace.revealLeaf(leaf);
      },
      readNote: async path => this.app.vault.cachedRead(this.fileFor(path)),
      renderMarkdown: (content, element, path) => view.renderMarkdown(content, element, path),
      updateNote: (path, patch) => this.updateNote(path, patch),
      createNote: input => this.createNote(input),
      subscribe: callback => { this.listeners.add(callback); return () => this.listeners.delete(callback); },
      notice: message => new Notice(String(message)),
      openGraph: async () => {
        try {
          const leaf = this.app.workspace.getLeavesOfType("graph")[0] || this.app.workspace.getLeaf("tab");
          await leaf.setViewState({ type: "graph", active: true });
          await this.app.workspace.revealLeaf(leaf);
        } catch (error) { new Notice("请先启用 Obsidian 的关系图谱核心插件。"); console.warn("知间：关系图谱打开失败", error); }
      }
    };
  }
};
