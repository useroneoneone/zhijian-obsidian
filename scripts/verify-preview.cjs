// In-memory demo and Markdown regression checks; no real vault or browser storage is accessed.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');

const memory = new Map();
const events = [];
class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.dataset = {}; this.listeners = {}; this.textContent = ''; }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = items; }
  addEventListener(name, fn) { this.listeners[name] = fn; }
}
const document = {
  addEventListener() {}, getElementById() { return null; },
  createElement(tag) { return new Element(tag); }, createTextNode(text) { return { textContent: text }; },
};
const context = { window: { dispatchEvent(event) { events.push(event); } }, document,
  localStorage: { getItem(key) { return memory.get(key); }, setItem(key, value) { memory.set(key, value); } },
  CustomEvent: function (type, options) { this.type = type; this.detail = options.detail; },
  setTimeout, clearTimeout, console, Date, Set,
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../preview/demo.js'), 'utf8'), context);

(async () => {
  const demo = context.window.ZhijianDemo;
  const adapter = demo.adapter;
  const originals = await adapter.getNotes();
  assert.equal(originals.length, 20);
  assert.equal(new Set(originals.map(n => n.category)).size, 6);
  assert.equal(originals.filter(n => n.reading === '已读' && n.absorption === '待沉淀').length, 2);
  const links = originals.flatMap(n => n.links);
  assert.ok(links.every(title => originals.some(n => n.title === title)));
  assert.ok(originals.every(n => !Object.hasOwn(n, 'content')));
  let changes = 0;
  const unsubscribe = adapter.subscribe(() => changes++);
  await adapter.saveSettings({ bookmarks: [originals[0].path], theme: 'dark', motion: 'off' });
  assert.equal(adapter.getSettings().theme, 'dark');
  assert.equal(adapter.getSettings().motion, 'off');
  assert.equal(adapter.getSettings().bookmarks[0], originals[0].path);
  await adapter.updateNote(originals[0].path, { reading: '已读', absorption: '已沉淀' });
  assert.match((await adapter.getNotes())[0].readDate, /^\d{4}-\d{2}-\d{2}$/);
  await assert.rejects(() => adapter.updateNote(originals[0].path, { reading: 'bad' }));
  const created = await adapter.createNote({ title: '../测试笔记', folder: '../05-灵感/../想法', tags: ['#测试'], content: '# 测试\n\n一个新想法。' });
  assert.ok(!created.includes('..'));
  assert.equal((await adapter.getNotes()).length, 21);
  assert.equal(await adapter.readNote(created), '# 测试\n\n一个新想法。');
  const duplicate = await adapter.createNote({ title: '../测试笔记', folder: '05-灵感/想法', tags: [], content: '第二条' });
  assert.notEqual(created, duplicate);
  await adapter.deleteNote(created);
  await adapter.deleteNote(duplicate);
  await adapter.saveSettings({ excludedPaths: ['03 资源'] });
  assert.equal((await adapter.getNotes()).filter(n => n.category === '资源').length, 0);
  assert.ok(changes >= 7);
  unsubscribe();
  const before = changes;
  await adapter.saveSettings({ excludedPaths: [] });
  assert.equal(changes, before);

  // Catch deferred link closures and confirm text never becomes unsafe HTML.
  const container = new Element('div');
  await adapter.renderMarkdown('## 标题\n\n[[费曼学习法：从理解到表达]] 和 [[设计中的设计：留白的力量]]\n\n<script>alert(1)</script>\n\n[危险](javascript:alert(1))', container);
  const all = item => [item, ...(item.children || []).flatMap(all)];
  const nodes = all(container);
  assert.ok(!nodes.some(n => n.tag === 'script'));
  const internal = nodes.filter(n => n.className === 'internal-link');
  assert.equal(internal.length, 2);
  internal[0].listeners.click({ preventDefault() {} });
  internal[1].listeners.click({ preventDefault() {} });
  assert.equal(internal[0].dataset.path, originals[2].path);
  assert.equal(internal[1].dataset.path, originals[1].path);
  assert.equal(internal[0].dataset.action, 'detail');
  assert.ok(!nodes.some(n => n.href && n.href.startsWith('javascript:')));
  console.log(`PASS: 20 notes, 6 categories, ${links.length} resolved links, CRUD, bookmarks, theme, exclusions, subscriptions, safe Markdown.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
