/* Shared native Obsidian / offline preview interface. No remote requests. */
(function (factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.ZhijianUI = api;
})(function () {
  'use strict';
  const categories = ['项目', '资产', '资源', '辅助', '灵感', 'Skills'];
  const categoryIcons = ['briefcase', 'cube', 'archive', 'folder', 'lightbulb', 'code'];
  const folders = ['01-项目', '02-资产', '03-资源', '04-辅助', '05-灵感', '06-Skills'];
  const escape = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const dateKey = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const shortDate = value => value ? new Date(value).toLocaleDateString('zh-CN', {month:'2-digit', day:'2-digit'}) : '暂无记录';
  const icon = name => {
    const icons = typeof window !== 'undefined' ? window.ZhijianIcons : null;
    return `<span class="zj-icon" aria-hidden="true">${icons && icons[name] || ''}</span>`;
  };

  function mount(root, adapter) {
    const doc = root.ownerDocument;
    let notes = [], settings = {}, destroyed = false, modal = null, modalToken = 0, lastFocus = null;
    let refreshing = null, refreshAgain = false, inputTimer, toastTimer, unsubscribe, composing = false, graphView = null, carouselView = null;
    const state = {page:'overview', category:'', graphCategory:'', showOrphans:true, status:'全部', absorption:'', query:'', sort:'updated', layout:'grid', year:new Date().getFullYear(), mobile:false, zoom:1};
    root.classList.add('zj-host');
    const scene = doc.createElement('div'); scene.className = 'zj-scene'; scene.setAttribute('aria-hidden','true');
    const app = doc.createElement('div'); app.className = 'zj-app';
    const layer = doc.createElement('div'); layer.className = 'zj-layer';
    const toastRegion = doc.createElement('div'); toastRegion.className = 'zj-toast-region'; toastRegion.setAttribute('aria-live', 'polite');
    root.replaceChildren(scene, app, layer, toastRegion);
    const FX = typeof window !== 'undefined' ? window.ZhijianFX : null;
    const effects = FX?.mount(scene,app,{getSettings:()=>settings});
    function toast(message) {
      clearTimeout(toastTimer); toastRegion.innerHTML = `<div class="zj-toast">${icon('check')}<span>${escape(message)}</span></div>`;
      toastTimer = setTimeout(() => toastRegion.replaceChildren(), 3500);
    }
    function theme() {
      app.dataset.theme = settings.theme || 'light'; layer.dataset.theme = settings.theme || 'light'; toastRegion.dataset.theme = settings.theme || 'light'; scene.dataset.theme=settings.theme||'light';app.dataset.motion=settings.motion||'full';
    }
    function nav(label, name, glyph, count, active) {
      return `<button class="zj-nav-item ${active ? 'is-active' : ''}" data-action="navigate" data-page="${name}" aria-current="${active ? 'page' : 'false'}">${icon(glyph)}<span>${label}</span>${count == null ? '' : `<span class="zj-nav-count">${count}</span>`}</button>`;
    }
    function selectedNotes() {
      const category = state.page === 'graph' ? state.graphCategory : state.category;
      let result = notes.filter(n => (!category || n.category === category) && (state.status === '全部' || n.reading === state.status) && (!state.absorption || n.absorption === state.absorption) && (state.page !== 'pending' || n.reading === '已读'));
      if (state.page === 'bookmarks') result = result.filter(n => (settings.bookmarks || []).includes(n.path));
      const query = state.query.trim().toLowerCase();
      if (query) result = result.filter(n => [n.title, n.excerpt, n.folder, ...(n.tags || [])].join(' ').toLowerCase().includes(query));
      return result.sort(state.sort === 'title' ? (a,b) => a.title.localeCompare(b.title,'zh-CN') : state.sort === 'created' ? (a,b) => b.created-a.created : (a,b) => b.modified-a.modified);
    }
    function sidebar() {
      const pending = notes.filter(n => n.reading === '已读' && n.absorption === '待沉淀').length;
      return `<aside class="zj-sidebar ${state.mobile ? 'is-open' : ''}" aria-label="知识库导航">
        <a class="zj-brand" href="#" data-action="navigate" data-page="overview"><span class="zj-brand-mark">${icon('leaf')}</span><span><span class="zj-brand-word">知间<span class="zj-brand-dot">.</span></span><span class="zj-brand-caption">KNOWLEDGE STUDIO</span></span></a>
        <div class="zj-nav-group"><div class="zj-nav-label">我的空间</div>${nav('概览','overview','squares',null,state.page==='overview'&&!state.category)}${nav('阅读书架','shelf','book',notes.length,state.page==='shelf'&&!state.category)}${nav('知识图谱','graph','graph',null,state.page==='graph')}</div>
        <div class="zj-nav-group"><div class="zj-nav-label">知识分区<span>6</span></div>${categories.map((c,i)=>`<button class="zj-nav-item ${state.category===c ? 'is-active' : ''}" data-action="category" data-category="${c}">${icon(categoryIcons[i])}<span>${c==='Skills' ? '工作流 · Skills' : c==='项目' ? '项目空间' : c==='资产' ? '知识资产' : c==='资源' ? '资源收藏' : c==='辅助' ? '辅助与索引' : '灵感笔记'}</span><span class="zj-nav-count">${notes.filter(n=>n.category===c).length}</span></button>`).join('')}</div>
        <div class="zj-nav-group"><div class="zj-nav-label">让知识生长</div>${nav('待沉淀','pending','sparkles',pending,state.page==='pending')}${nav('我的书签','bookmarks','bookmark',(settings.bookmarks||[]).filter(p=>notes.some(n=>n.path===p)).length,state.page==='bookmarks')}</div>
        <div class="zj-sidebar-bottom"><div class="zj-local"><span class="zj-local-dot"></span>本地知识库<span>${icon('check')}</span></div><button class="zj-profile" data-action="settings"><span class="zj-avatar">${escape((settings.displayName || 'Y').slice(0,1))}</span><span><strong>${escape(settings.displayName || 'Y')} 的知识空间</strong><small>${escape(adapter.getVaultName ? adapter.getVaultName() : 'Obsidian Vault')}</small></span>${icon('chevronDown')}</button></div>
      </aside>`;
    }
    function pageTools() {
      return `<div class="zj-page-tools" aria-label="知识库工具"><label class="zj-search">${icon('search')}<input class="zj-search-input" data-role="search" aria-label="搜索知识库" placeholder="搜索你的知识库…" value="${escape(state.query)}"><kbd>⌘ / Ctrl K</kbd></label><button class="zj-icon-button" data-action="theme" aria-label="切换${settings.theme==='dark'?'浅色':'深色'}主题" title="切换主题">${icon(settings.theme==='dark'?'sun':'moon')}</button><button class="zj-icon-button" data-action="settings" aria-label="界面设置" title="界面设置">${icon('settings')}</button></div>`;
    }
    function pageTitle() { return state.category || ({overview:'概览',shelf:'阅读书架',graph:'知识图谱',pending:'待沉淀',bookmarks:'我的书签'}[state.page] || '阅读书架'); }
    function pageHeading() {
      const today = new Date();
      return `<div class="zj-page-heading"><div class="zj-page-copy"><div class="zj-mobile-page-nav"><button class="zj-icon-button zj-menu-button" data-action="menu" aria-label="打开导航">${icon('menu')}</button><span>${escape(pageTitle())}</span></div><div class="zj-eyebrow">${state.page==='overview' ? `${today.toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'})} · READING COCKPIT` : 'YOUR PERSONAL KNOWLEDGE SPACE'}</div><h1>${state.page==='overview' ? `${escape(settings.displayName || 'Y')}，欢迎回到你的知识宇宙。` : escape(pageTitle())}</h1><p>${state.page==='overview' ? '让阅读产生连接，让灵感沉淀为自己的知识。' : state.page==='graph' ? '每一条连接，都是一个新的理解。点击节点，探索你的笔记。' : state.page==='pending' ? '把读过的内容，变成可以再次调用的知识。' : state.page==='bookmarks' ? '留一盏小灯，随时回到值得重读的地方。' : '为好奇留一个位置，为理解留一点时间。'}</p></div><div class="zj-page-actions">${pageTools()}<button class="zj-button primary" data-action="create">${icon('plus')}记录新想法</button></div></div>`;
    }
    function stats() {
      const reading = notes.filter(n=>n.reading==='在读').length, read = notes.filter(n=>n.reading==='已读').length;
      return `<section class="zj-stats zj-overview-stats" aria-label="知识库统计"><button class="zj-stat" data-action="stat" data-route="shelf"><div class="zj-stat-label">笔记总量<span class="zj-stat-icon">${icon('book')}</span></div><div class="zj-stat-number">${notes.length}<span>篇</span></div><div class="zj-stat-bottom">每一篇，都是新的可能${icon('arrowUpRight')}</div></button><section class="zj-stat zj-reading-stat" aria-label="阅读进度"><div class="zj-stat-label">阅读进度<span class="zj-stat-icon">${icon('clock')}</span></div><div class="zj-reading-metrics">${[['正在阅读',reading,'reading'],['已完成阅读',read,'read']].map(([label,count,route])=>`<button class="zj-reading-metric" data-action="stat" data-route="${route}" aria-label="${label} ${count} 篇"><span class="zj-reading-metric-label">${label}</span><span class="zj-stat-number">${count}<span>篇</span></span></button>`).join('')}</div><div class="zj-stat-bottom">${notes.length?Math.round(read/notes.length*100):0}% 的笔记已读完</div></section>${heatmap()}</section>`;
    }
    function focusCard() {
      const note = notes.find(n=>n.reading==='在读') || notes.find(n=>n.reading==='未读');
      if (!note) return `<section class="zj-focus-card"><div class="zj-focus-copy"><div class="zj-focus-label">A LITTLE EVERY DAY</div><h2>让每一次阅读，都有所沉淀。</h2><p>记录一个想法，或重读一篇值得回味的笔记。</p><button class="zj-focus-action" data-action="create">写下新的想法${icon('arrowRight')}</button></div><div class="zj-focus-mark">${icon('book')}</div></section>`;
      const orbitNotes=[note,...notes.filter(n=>n.path!==note.path)].slice(0,3);
      return `<section class="zj-focus-card"><div class="zj-focus-copy"><div class="zj-focus-label">${icon('sparkles')}READ · CONNECT · GROW</div><h2>让灵感，<br>在知识宇宙中流动。</h2><p data-role="orbitTitle">正在探索 · ${escape(note.title)}</p><button class="zj-focus-action" data-action="detail" data-role="orbitOpen" data-path="${escape(note.path)}"><span data-role="orbitAction">${note.reading==='在读' ? '继续阅读' : '打开笔记'}</span>${icon('arrowRight')}</button></div><div class="zj-orbit-stage zj-orbit-carousel" role="region" aria-label="悬浮笔记轮播" aria-roledescription="轮播"><div class="zj-orbit-glow" aria-hidden="true"></div><div class="zj-orbit-ring" aria-hidden="true"></div><div class="zj-orbit-ring second" aria-hidden="true"></div>${orbitNotes.map((n,i)=>`<button class="zj-orbit-card" data-carousel-item="${i}" data-orbit-index="${i}" data-action="detail" data-path="${escape(n.path)}" aria-label="打开悬浮笔记：${escape(n.title)}"><span class="zj-orbit-top">${icon(categoryIcons[categories.indexOf(n.category)]||'file')}<span>${escape(n.category)}</span><i class="zj-orbit-dot"></i></span><strong>${escape(n.title)}</strong><span class="zj-orbit-excerpt">${escape(n.excerpt.slice(0,52))}</span><span class="zj-orbit-status">${icon('circle')}${escape(n.reading)}</span></button>`).join('')}<div class="zj-carousel-controls" ${orbitNotes.length<2?'hidden':''}><button class="zj-carousel-arrow" data-carousel-step="-1" aria-label="上一张悬浮笔记">${icon('chevronLeft')}</button>${orbitNotes.map((n,i)=>`<button class="zj-carousel-dot" data-carousel-go="${i}" aria-label="展示第 ${i+1} 张：${escape(n.title)}" aria-current="${i===0}"></button>`).join('')}<button class="zj-carousel-arrow" data-carousel-step="1" aria-label="下一张悬浮笔记">${icon('chevronRight')}</button><span class="zj-carousel-caption" aria-hidden="true">01 / ${String(orbitNotes.length).padStart(2,'0')}</span><button class="zj-carousel-toggle" aria-label="暂停自动轮换" aria-pressed="false">Ⅱ</button></div></div></section>`;
    }
    function toolbar() {
      const category=state.page==='graph'?state.graphCategory:state.category;
      const pool = notes.filter(n=>(!category||n.category===category)&&(!state.absorption||n.absorption===state.absorption)&&(state.page!=='bookmarks'||(settings.bookmarks||[]).includes(n.path))&&(state.page!=='pending'||n.reading==='已读'));
      const tools = state.page==='graph' ? `<select class="zj-select" data-role="graphCategory" aria-label="图谱知识分区"><option value="">全部分区</option>${categories.map(c=>`<option value="${c}" ${state.graphCategory===c?'selected':''}>${c}</option>`).join('')}</select><label class="zj-graph-orphans"><input type="checkbox" data-role="graphOrphans" ${state.showOrphans?'checked':''}>显示孤立笔记</label>${adapter.supportsNativeGraph?`<button class="zj-text-button" data-action="nativeGraph">打开原生图谱${icon('arrowUpRight')}</button>`:''}` : `<select class="zj-select" data-role="sort" aria-label="笔记排序"><option value="updated" ${state.sort==='updated'?'selected':''}>最近更新</option><option value="created" ${state.sort==='created'?'selected':''}>最近创建</option><option value="title" ${state.sort==='title'?'selected':''}>标题排序</option></select><div class="zj-view-toggle" aria-label="显示方式"><button class="zj-icon-button ${state.layout==='grid'?'is-active':''}" data-action="layout" data-layout="grid" aria-label="卡片视图" aria-pressed="${state.layout==='grid'}">${icon('squares')}</button><button class="zj-icon-button ${state.layout==='list'?'is-active':''}" data-action="layout" data-layout="list" aria-label="列表视图" aria-pressed="${state.layout==='list'}">${icon('list')}</button></div>`;
      return `<div class="zj-toolbar"><div class="zj-tabs" role="group" aria-label="阅读状态">${(state.page==='pending'?['已读']:['全部','未读','在读','已读']).map(s=>`<button class="zj-tab ${state.status===s?'is-active':''}" aria-pressed="${state.status===s}" data-action="status" data-status="${s}">${s}<span>${s==='全部'?pool.length:pool.filter(n=>n.reading===s).length}</span></button>`).join('')}</div><div class="zj-toolbar-right">${tools}</div></div>`;
    }
    function noteCard(note) {
      const marked = (settings.bookmarks || []).includes(note.path);
      const glyph = categoryIcons[categories.indexOf(note.category)] || 'file';
      return `<article class="zj-note-card"><button class="zj-card-open" data-action="detail" data-path="${escape(note.path)}"><span class="zj-card-top"><span class="zj-note-symbol">${icon(glyph)}</span><span class="zj-category">${escape(note.category)}${note.readonly?' · 只读':''}</span></span><h3 class="zj-note-title">${escape(note.title)}</h3><p class="zj-note-excerpt">${escape(note.excerpt || '还没有摘要，打开笔记开始探索。')}</p><span class="zj-tags">${(note.tags || []).slice(0,2).map(t=>`<span># ${escape(t)}</span>`).join('')}</span></button><div class="zj-card-bottom"><span class="zj-status ${note.reading==='在读'?'reading':note.reading==='已读'?'read':'unread'}"><span></span>${escape(note.reading)}</span><span class="zj-note-date">${shortDate(note.modified)}</span><button class="zj-icon-button zj-card-more ${marked?'is-bookmarked':''}" data-action="bookmark" data-path="${escape(note.path)}" aria-label="${marked?'取消':'添加'}书签：${escape(note.title)}" aria-pressed="${marked}">${icon('bookmark')}</button></div></article>`;
    }
    function empty() {
      return `<div class="zj-empty">${icon('book')}<h3>${state.query?'没有找到相关笔记':state.page==='bookmarks'?'把值得重读的笔记留下来':state.page==='pending'?'所有已读知识，都已妥善安放':'这里还有一片留白'}</h3><p>${state.query?'试试标题、标签或摘要中的其他关键词。':state.page==='bookmarks'?'点击笔记卡片右下角的书签，就能在这里找到它。':'创建新笔记，或调整筛选条件。'}</p><button class="zj-button secondary" data-action="${state.query?'clearSearch':'resetFilters'}">${state.query?'清除搜索':'查看全部笔记'}</button></div>`;
    }
    function cards() {
      const selected = selectedNotes();
      return `<div class="zj-note-grid ${state.layout==='list'?'zj-note-list':''}">${selected.length?selected.map(noteCard).join(''):empty()}</div><div class="zj-shelf-summary">${selected.length} 篇笔记${state.query ? ` · 搜索「${escape(state.query)}」` : ' · 留在这里的想法，会慢慢成为你的知识'}</div>`;
    }
    function heatmap() {
      const year = state.year, counts = {};
      notes.forEach(n=>{if(n.readDate && n.readDate.slice(0,4)===String(year))counts[n.readDate]=(counts[n.readDate]||0)+1;});
      const start = new Date(year,0,1), first = new Date(year,0,1-start.getDay()), end = new Date(year+1,0,1), today=dateKey(new Date());
      const totalDays = Math.round((end-first)/86400000), cols=Math.ceil(totalDays/7);
      let cells='';
      for(let i=0;i<cols*7;i++) {
        const d=new Date(first);d.setDate(first.getDate()+i);const key=dateKey(d), within=d>=start&&d<end, value=counts[key]||0;
        cells+=`<span class="zj-heat-cell" data-level="${Math.min(value,4)}" ${within?'':'data-outside="true"'} ${key>today?'data-future="true"':''} title="${within?`${key} · ${value} 篇完成阅读`:''}"></span>`;
      }
      const total=Object.values(counts).reduce((a,b)=>a+b,0);
      const months=Array.from({length:12},(_,month)=>`<span style="grid-column:${Math.floor((new Date(year,month,1)-first)/604800000)+1}" data-month="${month+1}">${month+1} 月</span>`).join('');
      return `<section class="zj-panel zj-heat-panel zj-heat-compact"><div class="zj-panel-heading"><h2>${icon('calendar')}阅读足迹</h2><div class="zj-year-controls"><button class="zj-icon-button" data-action="year" data-step="-1" aria-label="上一年">${icon('chevronLeft')}</button><span>${year}</span><button class="zj-icon-button" data-action="year" data-step="1" ${year>=new Date().getFullYear()?'disabled':''} aria-label="下一年">${icon('chevronRight')}</button></div></div><div class="zj-heatmap-scroller" style="--heat-cols:${cols}" role="img" aria-label="${year} 年阅读热力图：${total} 篇笔记，${Object.keys(counts).length} 个活跃日"><div class="zj-heat-months" aria-hidden="true">${months}</div><div class="zj-heatmap" aria-hidden="true">${cells}</div></div><div class="zj-heat-footer"><div class="zj-heat-summary"><strong>${total}</strong> 篇笔记<span>${Object.keys(counts).length} 个活跃日</span></div><div class="zj-heat-legend" aria-hidden="true"><span>少</span>${[0,1,2,3,4].map(l=>`<span class="zj-heat-cell" data-level="${l}"></span>`).join('')}<span>多</span></div></div></section>`;
    }
    function progress() {
      const eligible=notes.filter(n=>n.reading==='已读'&&n.absorption!=='无需沉淀'), absorbed=eligible.filter(n=>n.absorption==='已沉淀').length, percent=eligible.length?Math.round(absorbed/eligible.length*100):0;
      return `<section class="zj-panel zj-progress-panel"><div class="zj-panel-heading"><h2>${icon('sparkles')}知识沉淀</h2><button class="zj-icon-button" data-action="navigate" data-page="pending" aria-label="查看待沉淀笔记">${icon('arrowUpRight')}</button></div><div class="zj-progress-ring" style="--progress:${percent}%" role="img" aria-label="已读且需要沉淀的笔记中，${percent}% 已沉淀"><div class="zj-progress-center"><strong>${percent}<span>%</span></strong><small>理解，内化，生长</small></div></div><div class="zj-progress-key"><span><i></i>已沉淀<strong>${absorbed}</strong></span><span><i></i>待沉淀<strong>${eligible.length-absorbed}</strong></span></div><button class="zj-button secondary zj-wide" data-action="navigate" data-page="pending">去整理读过的知识${icon('arrowRight')}</button></section>`;
    }
    function graph() {
      const pool=selectedNotes();
      return `<section class="zj-panel zj-graph-shell zj-force-graph"><div class="zj-section-heading"><h2>知识之间，自有引力</h2><span class="zj-graph-summary" data-role="graphSummary">${pool.length} 篇笔记 · 正在整理连接</span></div><div class="zj-graph-panel"><div class="zj-network" data-role="network">${pool.length?'':empty()}</div><div class="zj-graph-controls"><button class="zj-icon-button" data-action="zoom" data-step="-0.2" aria-label="缩小图谱">−</button><span data-role="graphZoom">100%</span><button class="zj-icon-button" data-action="zoom" data-step="0.2" aria-label="放大图谱">${icon('plus')}</button><button class="zj-icon-button" data-action="fitGraph" aria-label="适应图谱大小">${icon('target')}</button></div><div class="zj-graph-focus" data-role="graphFocus" hidden></div></div><div class="zj-graph-legend" aria-label="图谱分区颜色">${categories.map((c,i)=>`<span><i style="background:var(--zj-graph-${['project','asset','resource','support','idea','skill'][i]})"></i>${c}</span>`).join('')}</div><p class="zj-panel-note">拖动节点调整位置 · 拖动空白平移 · 滚轮缩放 · 点击节点查看笔记</p><p class="zj-panel-note" data-role="graphLimit" hidden></p></section>`;
    }
    function mountGraph() {
      const container=app.querySelector('[data-role="network"]'), Graph=typeof window!=='undefined'?window.ZhijianGraph:null;
      if(!container)return;
      if(!Graph){container.textContent='关系图谱正在准备，请刷新工作台。';return;}
      graphView=Graph.mount(container,selectedNotes(),{
        getSettings:()=>settings,showOrphans:state.showOrphans,
        onOpen:path=>detail(path).catch(error=>toast(error.message||'笔记读取失败')),
        onZoom:zoom=>{state.zoom=zoom;const el=app.querySelector('[data-role="graphZoom"]');if(el)el.textContent=`${Math.round(zoom*100)}%`;},
        onFocus:(note,count)=>{const el=app.querySelector('[data-role="graphFocus"]');if(!el)return;el.hidden=!note;if(note)el.textContent=`${note.title} · ${count} 篇关联笔记`;},
        onStats:stats=>{const el=app.querySelector('[data-role="graphSummary"]'),limit=app.querySelector('[data-role="graphLimit"]');if(el)el.textContent=`${stats.nodes} 个节点 · ${stats.edges} 条连接`;if(limit){limit.hidden=!stats.truncated;limit.textContent=stats.truncated?`当前显示 ${stats.nodes} 个节点；使用搜索或分区筛选查看其余笔记。`:'';}}
      });
    }
    function mountCarousel() {
      const hero=app.querySelector('.zj-focus-card'), Carousel=typeof window!=='undefined'?window.ZhijianCarousel:null;
      if(!hero?.querySelector('.zj-orbit-carousel')||!Carousel)return;
      carouselView=Carousel.mount(hero,{getSettings:()=>settings,onChange:path=>{
        const note=notes.find(n=>n.path===path);if(!note)return;
        hero.querySelector('[data-role="orbitTitle"]').textContent=`正在探索 · ${note.title}`;
        hero.querySelector('[data-role="orbitOpen"]').dataset.path=path;
        hero.querySelector('[data-role="orbitAction"]').textContent=note.reading==='在读'?'继续阅读':'打开笔记';
      }});
    }
    function render() {
      if(destroyed||composing)return;
      const focused=doc.activeElement, preserve=focused&&focused.dataset.role==='search', selection=preserve?focused.selectionStart:0;
      const focusAction=app.contains(focused)&&focused.dataset.action?{...focused.dataset}:null;
      const overview=state.page==='overview'&&!state.category;
      graphView?.destroy();graphView=null;
      carouselView?.destroy();carouselView=null;
      app.dataset.page=state.page;
      app.innerHTML=`${sidebar()}${state.mobile?'<button class="zj-mobile-backdrop" data-action="menu" aria-label="关闭导航"></button>':''}<main class="zj-main"><div class="zj-content">${pageHeading()}${overview?`${stats()}<div class="zj-overview-feature">${focusCard()}${progress()}</div>`:''}${state.page==='graph'?`${toolbar()}${graph()}`:`<section class="zj-shelf"><div class="zj-section-heading"><h2>${state.category?escape(state.category)+'中的想法':state.page==='pending'?'等待内化的知识':state.page==='bookmarks'?'值得再读一遍':'我的阅读书架'}<span>${selectedNotes().length}</span></h2>${overview?'<button class="zj-text-button" data-action="navigate" data-page="shelf">查看全部'+icon('arrowRight')+'</button>':''}</div>${toolbar()}${cards()}</section>`}<footer class="zj-footer"><span>${icon('leaf')}把好奇心，留在日常里。</span><span>知间 · 本地生长</span></footer></div></main>`;
      theme();
      if(state.page==='graph')mountGraph();
      if(overview)mountCarousel();
      if(preserve){const input=app.querySelector('[data-role="search"]');input.focus();input.setSelectionRange(selection,selection);}
      else if(focusAction){[...app.querySelectorAll('[data-action]')].find(el=>Object.entries(focusAction).every(([k,v])=>el.dataset[k]===v))?.focus();}
    }
    async function refresh() {
      if(destroyed)return;
      if(refreshing){refreshAgain=true;return refreshing;}
      refreshing=(async()=>{do {refreshAgain=false;settings={...settings,...await adapter.getSettings()};notes=await adapter.getNotes();notes=Array.isArray(notes)?notes:[];if(!destroyed)render();}while(refreshAgain&&!destroyed);})();
      try {await refreshing;if(!destroyed&&!unsubscribe&&adapter.subscribe)unsubscribe=adapter.subscribe(()=>refresh().catch(error=>toast(error.message)));} finally {refreshing=null;}
    }
    function navigate(page) {
      state.page=page;state.category='';state.status='全部';state.absorption=page==='pending'?'待沉淀':'';state.mobile=false;
      if(page==='pending')state.status='已读';
      state.query='';render();app.querySelector('.zj-main').scrollTop=0;
      if(!root.classList.contains('zj-native')&&doc.scrollingElement)doc.scrollingElement.scrollTop=0;
    }
    function closeModal() {
      modalToken++;modal=null;layer.replaceChildren();app.inert=false;if(lastFocus&&lastFocus.isConnected)lastFocus.focus();else app.querySelector('.zj-search-input')?.focus();
    }
    function modalShell(title,content,footer,drawer=false) {
      app.inert=true;
      layer.innerHTML=`<div class="zj-overlay" data-theme="${escape(settings.theme||'light')}"><button class="zj-scrim" data-action="close" aria-label="关闭窗口" tabindex="-1"></button><section class="${drawer?'zj-drawer':'zj-dialog'}" role="dialog" aria-modal="true" aria-labelledby="zj-dialog-title"><div class="zj-dialog-header"><h2 id="zj-dialog-title">${title}</h2><button class="zj-icon-button" data-action="close" aria-label="关闭窗口">${icon('close')}</button></div>${content}${footer||''}</section></div>`;
      (layer.querySelector('input, select, textarea')||layer.querySelector('button:not(.zj-scrim)'))?.focus();
    }
    async function detail(path) {
      const note=notes.find(n=>n.path===path);if(!note){toast('这篇笔记已移动或删除，请刷新后再试。');return;}
      lastFocus=doc.activeElement;modal={kind:'detail',path};const token=++modalToken;
      modalShell('笔记详情',`<div class="zj-dialog-body"><div class="zj-detail-meta"><span>${escape(note.category)}</span><span>${shortDate(note.modified)} 更新</span></div><h3 class="zj-detail-title">${escape(note.title)}</h3><div class="zj-tags">${(note.tags||[]).map(t=>`<span># ${escape(t)}</span>`).join('')}</div>${note.readonly?'<p class="zj-readonly">'+icon('archive')+'原始资料保持只读。可以阅读、添加书签和在 Obsidian 中打开。</p>':''}<div class="zj-form-grid"><label class="zj-field">阅读状态<select data-role="reading" aria-label="阅读状态" ${note.readonly?'disabled':''}>${['未读','在读','已读'].map(s=>`<option ${note.reading===s?'selected':''}>${s}</option>`).join('')}</select></label><label class="zj-field">吸收状态<select data-role="absorption" aria-label="吸收状态" ${note.readonly?'disabled':''}>${['待沉淀','已沉淀','无需沉淀'].map(s=>`<option ${note.absorption===s?'selected':''}>${s}</option>`).join('')}</select></label></div><div class="zj-detail-content" aria-busy="true"><div class="zj-skeleton"></div><div class="zj-skeleton"></div><div class="zj-skeleton"></div></div></div>`,`<div class="zj-dialog-footer"><span class="zj-detail-path" title="${escape(note.path)}">${icon('file')}${escape(note.path)}</span><button class="zj-button primary" data-action="openNote" data-path="${escape(note.path)}">在 Obsidian 中打开${icon('arrowUpRight')}</button></div>`,true);
      try {let content=String(await adapter.readNote(path));if(destroyed||token!==modalToken)return;content=content.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/,'').trim();const lines=content.split('\n');if(lines[0].replace(/^#\s+/,'').trim()===note.title){lines.shift();content=lines.join('\n').trim();}const el=layer.querySelector('.zj-detail-content');el.replaceChildren();if(adapter.renderMarkdown)await adapter.renderMarkdown(content,el,path);else el.textContent=content;el.removeAttribute('aria-busy');}catch(error){if(token===modalToken){layer.querySelector('.zj-detail-content').textContent='笔记读取失败，请重新打开。';toast(error.message||'笔记读取失败');}}
    }
    function createDialog() {
      lastFocus=doc.activeElement;modal={kind:'create'};
      modalShell('给一个想法，留个位置',`<form data-form="create"><div class="zj-dialog-body"><p class="zj-form-intro">从一句话开始，让好奇心慢慢长成知识。</p><label class="zj-field">笔记标题<input name="title" required maxlength="100" placeholder="这个想法叫什么？" autocomplete="off"></label><div class="zj-form-grid"><label class="zj-field">存放分区<select name="folder">${folders.map((f,i)=>`<option value="${f}" ${f==='05-灵感'?'selected':''}>${categories[i]}</option>`).join('')}</select></label><label class="zj-field">标签<input name="tags" placeholder="学习, 灵感" autocomplete="off"></label></div><label class="zj-field">此刻的想法<textarea name="content" rows="6" placeholder="写下一个发现、一个问题，或一段想继续探索的话。"></textarea></label><p class="zj-panel-note">保存为本地 Markdown 笔记，使用知识库的页面格式。</p></div><div class="zj-dialog-footer"><button class="zj-button secondary" type="button" data-action="close">再想想</button><button class="zj-button primary" type="submit">${icon('plus')}保存想法</button></div></form>`);
    }
    function settingsDialog() {
      lastFocus=doc.activeElement;modal={kind:'settings'};
      modalShell('让空间更像你',`<form data-form="settings"><div class="zj-dialog-body"><label class="zj-field">显示名称<input name="displayName" value="${escape(settings.displayName||'Y')}" maxlength="30" required></label><label class="zj-field">界面主题<select name="theme"><option value="light" ${settings.theme!=='dark'?'selected':''}>冰蓝浅色 · 流光玻璃</option><option value="dark" ${settings.theme==='dark'?'selected':''}>星夜深色 · 极光玻璃</option></select></label><label class="zj-field">动态效果<select name="motion"><option value="full" ${(!settings.motion||settings.motion==='full')?'selected':''}>丰富 · 流体、粒子与 3D 悬浮</option><option value="subtle" ${settings.motion==='subtle'?'selected':''}>轻柔 · 减少粒子与悬浮幅度</option><option value="off" ${settings.motion==='off'?'selected':''}>静止 · 专注阅读</option></select></label><label class="zj-field">从界面排除的路径<textarea name="excludedPaths" rows="3" placeholder="每行一个目录路径">${escape((settings.excludedPaths||[]).join('\n'))}</textarea></label><p class="zj-panel-note">排除只影响界面索引。私密目录默认不展示，原始资料保持只读。</p><div class="zj-settings-about">${icon('leaf')}<div><strong>知间 · Knowledge Studio</strong><p>连接你的知识宇宙。<br>所有数据均在本地处理。</p></div></div></div><div class="zj-dialog-footer"><button class="zj-button secondary" type="button" data-action="close">取消</button><button class="zj-button primary" type="submit">保存设置${icon('check')}</button></div></form>`);
    }
    async function action(event) {
      const button=event.target.closest('[data-action]');if(!button||!root.contains(button))return;
      const name=button.dataset.action;
      if(button.tagName==='A')event.preventDefault();
      try {
        switch(name) {
          case 'navigate':navigate(button.dataset.page);break;
          case 'category':state.page='shelf';state.category=button.dataset.category;state.status='全部';state.absorption='';state.query='';state.mobile=false;render();break;
          case 'status':state.status=button.dataset.status;render();break;
          case 'layout':state.layout=button.dataset.layout;render();break;
          case 'detail':await detail(button.dataset.path);break;
          case 'openNote':await adapter.openNote(button.dataset.path);break;
          case 'create':createDialog();break;
          case 'settings':settingsDialog();break;
          case 'close':closeModal();break;
          case 'menu':state.mobile=!state.mobile;render();break;
          case 'clearSearch':state.query='';render();app.querySelector('[data-role="search"]').focus();break;
          case 'resetFilters':navigate('shelf');break;
          case 'year':state.year+=Number(button.dataset.step);render();break;
          case 'zoom':graphView?.zoomBy(Number(button.dataset.step));break;
          case 'fitGraph':graphView?.fit();break;
          case 'nativeGraph':await adapter.openGraph?.();break;
          case 'refresh':await refresh();break;
          case 'theme':settings.theme=settings.theme==='dark'?'light':'dark';await adapter.saveSettings({theme:settings.theme});theme();render();toast(settings.theme==='dark'?'已切换到星夜玻璃':'已切换到冰蓝玻璃');break;
          case 'bookmark': {const bookmarks=new Set(settings.bookmarks||[]),path=button.dataset.path;bookmarks.has(path)?bookmarks.delete(path):bookmarks.add(path);settings.bookmarks=[...bookmarks];await adapter.saveSettings({bookmarks:settings.bookmarks});render();toast(bookmarks.has(path)?'已加入我的书签':'已取消书签');break;}
          case 'stat':navigate('shelf');if(button.dataset.route==='reading')state.status='在读';if(button.dataset.route==='read')state.status='已读';if(button.dataset.route==='absorbed')state.absorption='已沉淀';render();break;
        }
      } catch(error) {toast(error.message||'操作未完成，请重试。');}
    }
    function input(event) {
      if(event.target.dataset.role==='search'){state.query=event.target.value;clearTimeout(inputTimer);if(!composing&&!event.isComposing)inputTimer=setTimeout(render,100);}
    }
    function compositionStart(event){if(event.target.dataset.role==='search'){composing=true;clearTimeout(inputTimer);}}
    function compositionEnd(event){if(event.target.dataset.role==='search'){composing=false;state.query=event.target.value;render();}}
    async function change(event) {
      const role=event.target.dataset.role;
      if(role==='sort'){state.sort=event.target.value;render();}
      if(role==='graphCategory'){state.graphCategory=event.target.value;render();app.querySelector('[data-role="graphCategory"]')?.focus();}
      if(role==='graphOrphans'){state.showOrphans=event.target.checked;render();app.querySelector('[data-role="graphOrphans"]')?.focus();}
      if((role==='reading'||role==='absorption')&&modal?.kind==='detail') {
        const path=modal.path,target=event.target,previous=notes.find(n=>n.path===path)?.[role];target.disabled=true;
        try {await adapter.updateNote(path,{[role]:target.value});await refresh();toast(role==='reading'?'阅读状态已保存到笔记':'吸收状态已保存到笔记');}catch(error){target.value=previous;toast(error.message||'状态保存失败');}finally{target.disabled=false;}
      }
    }
    async function submit(event) {
      const form=event.target;if(!form.dataset.form)return;event.preventDefault();
      const data=new FormData(form),button=form.querySelector('[type="submit"]'),startedModal=modal;button.disabled=true;
      try {
        if(form.dataset.form==='create') {
          const title=String(data.get('title')).trim();if(!title)throw new Error('请为这个想法填写标题。');
          const path=await adapter.createNote({title,folder:String(data.get('folder')),tags:String(data.get('tags')||'').split(/[,，\s]+/).filter(Boolean),content:String(data.get('content')||'')});
          await refresh();toast('新想法已保存');if(modal===startedModal&&!destroyed){closeModal();await detail(path);}
        }else {
          const patch={displayName:String(data.get('displayName')).trim()||'Y',theme:String(data.get('theme')),motion:String(data.get('motion')||'full'),excludedPaths:String(data.get('excludedPaths')||'').split('\n').map(s=>s.trim()).filter(Boolean)};
          await adapter.saveSettings(patch);settings={...settings,...patch};if(modal===startedModal&&!destroyed)closeModal();await refresh();toast('空间设置已保存');
        }
      }catch(error){if(error.createdPath){try {await refresh();if(modal===startedModal&&!destroyed){closeModal();await detail(error.createdPath);}}catch(_){/* Preserve the original partial-save message. */}}toast(error.message||'保存失败，请重试。');}finally{if(button.isConnected)button.disabled=false;}
    }
    function keydown(event) {
      if(adapter.isActive&&!adapter.isActive())return;
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'&&!modal){event.preventDefault();app.querySelector('[data-role="search"]').focus();}
      if(event.key==='Escape'){if(modal){event.preventDefault();closeModal();}else if(state.mobile){state.mobile=false;render();}else if(state.query){state.query='';render();}}
      if(event.key==='Tab'&&modal){const focusable=[...layer.querySelectorAll('button:not([disabled]):not([tabindex="-1"]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')];const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&(doc.activeElement===first||!layer.contains(doc.activeElement))){event.preventDefault();last?.focus();}else if(!event.shiftKey&&(doc.activeElement===last||!layer.contains(doc.activeElement))){event.preventDefault();first?.focus();}}
    }
    root.addEventListener('click',action);root.addEventListener('input',input);root.addEventListener('compositionstart',compositionStart);root.addEventListener('compositionend',compositionEnd);root.addEventListener('change',change);root.addEventListener('submit',submit);doc.addEventListener('keydown',keydown);
    const ready=(async()=>{try {settings=await adapter.getSettings()||{};await refresh();}catch(error){app.innerHTML=`<div class="zj-empty"><h3>知识库暂时还没有准备好</h3><p>${escape(error.message)}</p><button class="zj-button secondary" data-action="refresh">重新连接</button></div>`;}})();
    return {ready,refresh,destroy(){destroyed=true;modalToken++;clearTimeout(inputTimer);clearTimeout(toastTimer);unsubscribe?.();graphView?.destroy();graphView=null;carouselView?.destroy();carouselView=null;effects?.destroy();root.removeEventListener('click',action);root.removeEventListener('input',input);root.removeEventListener('compositionstart',compositionStart);root.removeEventListener('compositionend',compositionEnd);root.removeEventListener('change',change);root.removeEventListener('submit',submit);doc.removeEventListener('keydown',keydown);root.replaceChildren();root.classList.remove('zj-host');}};
  }
  return {mount};
});
