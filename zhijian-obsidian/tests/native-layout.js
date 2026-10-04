/* Browser regression using the real UI renderer, synthetic notes, and no storage. */
(async function () {
  const parameters = new URLSearchParams(location.search);
  const settings = { displayName: '排版验证', theme: parameters.get('theme') || 'dark', motion: 'off', bookmarks: [] };
  const titles = [
    '关于个人知识库的长期维护与跨学科知识连接：一份很长的中文阅读笔记标题',
    'KnowledgeManagementWorkflowWithoutAnySpacesOrWordBoundaries0123456789',
    '设计笔记 Design Notes：中英文混排、界面布局与信息组织的持续实践',
  ];
  const notes = titles.map((title, index) => ({
    path: `示例/${index}.md`, title, folder: '示例', category: ['资产', 'Skills', '资源'][index],
    reading: ['在读', '已读', '未读'][index], absorption: '待沉淀', tags: ['排版验证'],
    excerpt: index === 1 ? 'LongUnbrokenExcerptThatMustWrapInsideTheGlassCard1234567890' : '这是一段专门用于检查卡片边界的长摘要，文字应该在玻璃卡片内部自然换行，并在两行后省略。',
    created: Date.now() - index * 86400000, modified: Date.now() - index * 1000, links: [], readonly: true,
  }));
  await window.ZhijianUI.mount(document.getElementById('app'), {
    getSettings: async () => settings,
    saveSettings: async patch => Object.assign(settings, patch),
    getNotes: async () => notes,
    getVaultName: () => '原创长文本测试数据',
    readNote: async path => notes.find(note => note.path === path)?.excerpt || '',
    openNote: async () => {},
  }).ready;

  function check() {
    const failures = [];
    const stat = document.querySelector('button.zj-stat');
    const label = stat.querySelector('.zj-stat-label').getBoundingClientRect();
    const number = stat.querySelector('.zj-stat-number').getBoundingClientRect();
    const footer = stat.querySelector('.zj-stat-bottom').getBoundingClientRect();
    if (label.bottom > number.top + 1 || number.bottom > footer.top + 1) failures.push('统计文字没有按行排列');
    if (stat.scrollWidth > stat.clientWidth + 1 || stat.scrollHeight > stat.clientHeight + 1) failures.push('统计卡片溢出');
    for (const card of document.querySelectorAll('.zj-orbit-card')) {
      const css = getComputedStyle(card);
      const innerWidth = card.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
      for (const selector of ['strong', '.zj-orbit-excerpt']) {
        const text = card.querySelector(selector);
        const style = getComputedStyle(text);
        if (text.offsetWidth > innerWidth + 1 || text.scrollWidth > text.clientWidth + 1) failures.push(`${selector} 横向溢出`);
        if (text.clientHeight > parseFloat(style.lineHeight) * 2 + 1) failures.push(`${selector} 超过两行`);
      }
      if (card.scrollHeight > card.clientHeight + 1) failures.push('轮换卡片纵向溢出');
    }
    const report = document.getElementById('fixture-result');
    report.dataset.result = failures.length ? 'fail' : 'pass';
    report.textContent = failures.length ? `未通过：${failures.join('；')}` : '通过：统计文字分行 · 中文 / 连续英文 / 混排标题与摘要均在卡内 · 宿主样式模拟';
  }
  await document.fonts.ready;
  requestAnimationFrame(check);
  new ResizeObserver(check).observe(document.getElementById('app'));
})();
