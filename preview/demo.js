/* 知间离线预览。所有笔记均为原创示例，数据只写入当前浏览器的 localStorage。 */
(function () {
  'use strict';

  const STORAGE_KEY = 'zhijian-preview-v1';
  const SETTINGS_KEY = 'zhijian-preview-settings-v1';
  const listeners = new Set();
  const DAY = 86400000;
  const epoch = new Date('2026-10-03T09:30:00+08:00').getTime();
  const clone = value => JSON.parse(JSON.stringify(value));
  const defaults = { displayName: 'Y', theme: 'dark', motion: 'full', excludedPaths: [], bookmarks: [
    '03 资源/设计/设计中的设计：留白的力量.md', '02 资产/学习方法/费曼学习法：从理解到表达.md',
  ] };

  function note(index, title, folder, category, reading, absorption, tags, excerpt, sections, links = []) {
    return {
      path: folder + '/' + title + '.md', title, folder, category, reading, absorption,
      tags, excerpt, created: epoch - (index * 3 + 8) * DAY,
      modified: epoch - index * DAY * .34,
      readDate: reading === '已读' ? new Date(epoch - (index + 1) * DAY).toISOString().slice(0, 10) : '',
      links, readonly: false,
      content: '# ' + title + '\n\n' + excerpt + '\n\n' + sections.join('\n\n'),
    };
  }

  const seed = [
    note(0, '构建第二大脑：让知识真正为你所用', '02 资产/知识管理', '资产', '在读', '待沉淀', ['知识管理', '第二大脑', '方法论'],
      '收藏不是终点。把零散的信息组织成能被找到、能被连接、能被行动调用的个人知识系统。', [
        '> 一份笔记的价值，不只取决于你记住了什么，也取决于它何时再次派上用场。',
        '## 从储存走向使用\n常见的知识库从“我觉得这个有用”开始，却很少回答“我准备拿它做什么”。先明确正在推进的项目，再为材料找到可行动的归宿。知识的组织方式应随着使用场景调整。',
        '## 四个简单动作\n- **捕捉**：只留下触动自己、与目标相关的片段。\n- **组织**：按当前项目、长期资产、参考资源归档。\n- **提炼**：写下自己的理解，让未来的自己快速读懂。\n- **表达**：通过文章、方案或作品，把知识变成结果。',
        '## 本周的小实验\n选择一篇已经收藏的文章，写下 3 句话：它回答了什么问题？我为什么在意？下一次可以在哪里用到？\n\n关联：[[渐进式总结：让笔记越用越轻]] · [[PARA：以行动组织你的知识]]',
      ], ['渐进式总结：让笔记越用越轻', 'PARA：以行动组织你的知识']),
    note(1, '设计中的设计：留白的力量', '03 资源/设计', '资源', '在读', '待沉淀', ['设计', '视觉', '阅读笔记'],
      '留白不是未完成的空间，而是一种安排注意力的方式。让信息有呼吸感，让重要的内容自己浮现。', [
        '## 空间也会说话\n当所有元素都在争取注意力，界面反而失去重点。留白帮助读者辨认层级，也让信息之间的关系更清晰。它是内容的一部分，而不是内容剩下的部分。',
        '## 三种留白\n1. 页面与内容的边界，建立整体秩序。\n2. 模块之间的距离，区分不同主题。\n3. 字行与段落的间距，决定阅读节奏。',
        '## 应用在自己的知识库\n减少同时出现的强调色；让阅读状态与分类保持一致；为长篇笔记提供稳定的行宽。好的界面应让人愿意停留，也能迅速找到下一步。',
        '**我的理解**：真正有用的留白不是“看起来极简”，而是让人更轻松地判断什么重要。',
      ], ['从注意力到体验：设计信息层级']),
    note(2, '费曼学习法：从理解到表达', '02 资产/学习方法', '资产', '已读', '已沉淀', ['学习', '表达', '方法论'],
      '用自己的语言讲清楚一个概念，在讲不明白的地方找到理解缺口。输出，是检验理解的起点。', [
        '## 一个实用的练习\n选定一个小概念，假设要讲给第一次接触它的人听。尽量减少术语，用具体例子解释它如何发生、为何有效。',
        '## 解释不清楚时做什么\n- 标记自己绕过去的地方。\n- 回到原始材料，只补充这个缺口。\n- 再写一次，用更直接的句子表达。\n- 换一个例子，检验是否能迁移。',
        '## 一个例子\n“复利”可以先解释成：上一次积累的结果，也参与下一次积累。比如每天改进一小段笔记，后续查找与表达都会更省力。这样的解释比背诵公式更容易形成直觉。',
        '## 沉淀\n解释的目标是让对方理解，而不是展示自己知道多少。每次读完一个章节，用 150 字写给未来的自己。',
      ], ['写作是一种思考：让模糊的想法成形']),
    note(3, 'PARA：以行动组织你的知识', '02 资产/知识管理', '资产', '已读', '已沉淀', ['PARA', '知识管理', '工作流'],
      '让分类跟着事情走。围绕项目、长期责任、参考资料与历史归档，为知识找到明确的使用位置。', [
        '## 先问“它服务于什么”\n一个文件可能同时属于多个学科，但它此刻服务的行动通常更明确。为正在推进的项目保留最短的访问路径。',
        '## 四类位置\n- **项目**：有明确结果和结束时间的工作。\n- **资产**：长期经营的能力与责任。\n- **资源**：以后可能参考的主题材料。\n- **归档**：已经结束、暂时不再活跃的内容。',
        '## 保持流动\n分类不是一次性的。项目结束时，提炼出的经验进入资产，相关资料回到资源，其余内容进入归档。每个月只需进行一次轻量整理。',
        '关联：[[构建第二大脑：让知识真正为你所用]]',
      ], ['构建第二大脑：让知识真正为你所用']),
    note(4, '阅读计划：十月的三本书', '01 项目/十月阅读', '项目', '在读', '待沉淀', ['阅读计划', '2026', '习惯'],
      '本月围绕学习、设计与表达各选一本书。给每次阅读留出一小段反馈，让输入真正产生变化。', [
        '## 本月主题\n我希望通过阅读理解三个问题：怎样记住真正重要的东西？怎样用更少的元素表达更多？怎样写出清楚、有用的文章？',
        '## 阅读节奏\n- 工作日：晚上阅读 20 分钟，留下一个问题。\n- 周末：选择一段做渐进式总结。\n- 月末：把最有用的观点用于一篇短文。',
        '## 完成的标准\n完成不是合上最后一页，而是能说出一条值得持续使用的原则，并记录一个具体应用。阅读量可以灵活调整，反馈不能省略。',
        '## 关联材料\n[[费曼学习法：从理解到表达]]\n[[渐进式总结：让笔记越用越轻]]',
      ], ['费曼学习法：从理解到表达', '渐进式总结：让笔记越用越轻']),
    note(5, '渐进式总结：让笔记越用越轻', '02 资产/知识管理', '资产', '在读', '待沉淀', ['笔记', '提炼', '第二大脑'],
      '第一次阅读留下线索，第二次重访突出重点，再次使用时补充自己的理解。笔记不必一次完成。', [
        '## 分层阅读\n保存材料之后，先保留最有意义的段落；重访时标出其中的关键句；真正需要它时再补充自己的总结。精力应该投入到被实际调用的材料上。',
        '## 小而明确的摘要\n摘要回答一个问题即可。与其写一份面面俱到的读书报告，不如留下一个以后可以再次使用的解释。',
        '## 每次重访的提问\n1. 这段内容现在与什么有关？\n2. 哪一句话是关键？\n3. 我是否可以添加自己的例子？',
        '**提醒**：重点越来越多，通常意味着尚未做选择。给自己设一个限制：每次只留下三个核心观点。',
      ], ['构建第二大脑：让知识真正为你所用']),
    note(6, '写作是一种思考：让模糊的想法成形', '02 资产/表达与写作', '资产', '已读', '待沉淀', ['写作', '思考', '表达'],
      '当想法落到纸面，逻辑的缺口开始显现。写作不仅传递已经形成的思想，也帮助思想形成。', [
        '## 从一个问题开始\n先写清楚文章想解决的问题，再决定需要哪些材料。没有问题作为中心，素材再丰富也容易变成堆积。',
        '## 写作的两个阶段\n起草时允许粗糙，尽量保持连续；修改时站在读者的位置，检查每一段是否推进了理解。把生成和判断分开，会减少反复停顿。',
        '## 让句子承担工作\n- 删掉没有新增含义的修饰。\n- 用具体动作替代抽象名词。\n- 给关键观点补一个例子。\n- 一段只推进一个主要想法。',
        '## 下一步\n从知识库里选三条关联笔记，围绕一个共同问题写 500 字。读者应在第一段就知道这篇文章对自己有什么帮助。',
      ], ['费曼学习法：从理解到表达']),
    note(7, '卡片盒笔记：让观点彼此对话', '03 资源/笔记方法', '资源', '未读', '待沉淀', ['卡片盒', '双向链接', '笔记'],
      '一张卡片记录一个完整观点。通过有理由的连接，让独立笔记形成能持续生长的思考网络。', [
        '## 原子化的含义\n“短”并不是唯一标准。好的卡片能独立说明一个观点，有上下文、有证据，也能与其他想法连接。',
        '## 链接要带理由\n不要只列出相关标题。补上一句：它们为什么相关？一个观点是另一个的例子、反例，还是进一步推论？连接的解释本身就是新的知识。',
        '## 可以尝试的模板\n**观点**：一句话说明。\n\n**理由**：它为什么值得相信。\n\n**联系**：它与已有笔记的关系。\n\n**应用**：它可以解决什么问题。',
        '关联：[[双向链接的边界：连接之前先理解]]',
      ], ['双向链接的边界：连接之前先理解']),
    note(8, '从注意力到体验：设计信息层级', '03 资源/设计', '资源', '已读', '无需沉淀', ['设计', '信息架构', 'UX'],
      '先让读者看见最重要的内容，再让他们知道如何继续。字号、间距和颜色共同建立阅读顺序。', [
        '## 先决定优先级\n视觉层级应服从内容层级。页面的主要任务、支持信息与辅助操作，需要有明确的先后次序。',
        '## 用差异建立关系\n同一组内容保持相似，不同层级保留足够差异。标题、正文与元信息不必各自使用一种醒目的颜色；字号和距离往往已经足够。',
        '## 一个简单检查\n把页面缩小或轻微眯眼观察，重要的标题和主要操作应该仍然可辨。若每个区域都显眼，说明没有真正建立重点。',
        '关联：[[设计中的设计：留白的力量]]',
      ], ['设计中的设计：留白的力量']),
    note(9, '每周回顾：把忙碌变成进展', '04 辅助/回顾模板', '辅助', '已读', '已沉淀', ['回顾', '模板', '效率'],
      '用十分钟找回一周的线索：完成了什么，哪里值得调整，下一周最重要的一步是什么。', [
        '## 回顾模板\n### 这一周的三个进展\n1. 一个已经完成的结果。\n2. 一个有价值的新理解。\n3. 一个值得继续的小习惯。',
        '### 一个需要调整的地方\n描述具体情境，而不是笼统地评价自己。什么阻碍了进展？怎样减少下一次发生的概率？',
        '### 下一周最重要的一步\n把目标缩小到一个可以开始的动作，最好 30 分钟内能完成。先开始，再根据反馈调整。',
        '## 使用提示\n回顾不是制作一份漂亮的成绩单。它的作用是帮助下一周做出更好的选择。',
      ], ['阅读计划：十月的三本书']),
    note(10, '知识花园：允许想法缓慢生长', '05 灵感/想法', '灵感', '在读', '待沉淀', ['数字花园', '灵感', '创作'],
      '不急着把每个想法写成结论。留下问题、草稿与连接，在持续回访中看见知识如何生长。', [
        '## 种子与成熟观点\n一个模糊的问题可以先作为种子保存。等它遇到新的材料、例子与经验，再逐渐形成完整的表达。',
        '## 保留生长的痕迹\n记录观点的变化比维护完美的笔记更重要。可以用“正在探索”“已有例子”“可以应用”描述不同阶段。',
        '## 一个界面想法\n在知识库里留一个安静的“正在生长”区域，展示最近重新访问的想法。它不需要催促完成，只需要提醒连接。',
        '关联：[[卡片盒笔记：让观点彼此对话]]',
      ], ['卡片盒笔记：让观点彼此对话']),
    note(11, '把阅读变成可执行的小实验', '01 项目/阅读实验', '项目', '在读', '待沉淀', ['实践', '阅读', '实验'],
      '读到一个有用的观点，就设计一次低成本尝试。让真实反馈帮助你决定哪些方法适合自己。', [
        '## 先缩小范围\n把“建立完整的知识系统”改成“为本周一个项目整理五条关键笔记”。实验越小，反馈越清楚。',
        '## 实验记录\n- **假设**：新的做法会改善哪一步？\n- **动作**：具体做什么，持续多久？\n- **观察**：记录可以看到的变化。\n- **结论**：保留、调整，还是停止？',
        '## 示例\n连续一周，在阅读结束后写一句“这条观点可以用于什么”。周末看看这些句子里，哪些已经帮助了一次真实的决定。',
        '关联：[[复利式成长：每天一点点的作用]]',
      ], ['复利式成长：每天一点点的作用']),
    note(12, '复利式成长：每天一点点的作用', '03 资源/个人成长', '资源', '未读', '待沉淀', ['习惯', '成长', '长期主义'],
      '小动作的力量来自持续、反馈与积累。把进步融入日常，比等待一次完美的开始更可靠。', [
        '## 小动作需要方向\n积累并不自动意味着进步。需要定期检查：自己反复做的动作，是否朝向想要的结果？',
        '## 降低开始的成本\n让下一步足够小，让材料容易找到。比如提前打开正在读的章节，或在笔记顶部留下下一次要回答的问题。',
        '## 关注可以控制的过程\n每天留下一个完整观点、每周回访三条笔记，都比要求自己“变得更聪明”容易执行。长期目标由这些可重复动作连接起来。',
        '## 思考题\n我的知识库里，哪一个小动作能同时改善未来的阅读、检索和表达？',
      ], ['每周回顾：把忙碌变成进展']),
    note(13, 'Markdown 笔记的轻量写作规范', '04 辅助/工具说明', '辅助', '已读', '无需沉淀', ['Markdown', '规范', '工具'],
      '用稳定而简单的格式降低维护成本。让标题、链接与标签服务于阅读，不让格式占用思考。', [
        '## 文件命名\n使用能说明内容的标题。避免大量无意义的缩写，必要时用日期区分同主题的回顾与记录。',
        '## 基础格式\n```markdown\n# 一个明确的标题\n\n一句话说明这篇笔记的用途。\n\n## 核心观点\n- 一个完整观点。\n- 一个具体例子。\n\n关联：[[另一篇笔记]]\n```',
        '## 标签保持克制\n选择二到四个能用于检索的标签。同一含义使用同一拼写，避免同时出现“笔记方法”“笔记技巧”“记笔记”而没有区别。',
        '## 可读优先\n标题层级连续，段落之间留一行空白。每次整理只修正影响使用的问题。',
      ], ['双向链接的边界：连接之前先理解']),
    note(14, '阅读摘要 Skill：从材料到观点', '06 Skills/阅读', 'Skills', '在读', '待沉淀', ['AI', 'Skill', '工作流'],
      '一份可复用的阅读协作流程：先明确问题，再提炼论点、依据和应用，让摘要保留可追溯的上下文。', [
        '## 适用场景\n阅读文章、章节或研究报告，需要快速形成自己的理解时。先给出原文与阅读目的，再开始提炼。',
        '## 输入\n- 待读材料。\n- 当前想回答的问题。\n- 输出形式：阅读笔记、项目参考或分享提纲。',
        '## 输出顺序\n1. 用三句话概括主要观点。\n2. 列出关键依据与原文位置。\n3. 分开记录作者的论点和自己的理解。\n4. 提出一个可以执行的小实验。',
        '## 质量检查\n检查是否遗漏限制条件，是否把推测写成结论。遇到材料没有回答的问题，保留问题，而不是补写一个确定答案。',
      ], ['把阅读变成可执行的小实验']),
    note(15, '双向链接的边界：连接之前先理解', '03 资源/笔记方法', '资源', '已读', '待沉淀', ['Obsidian', '双向链接', '思考'],
      '链接的数量不是理解的深度。把“有关联”写得更具体，知识网络才会为下一次思考提供帮助。', [
        '## 一个容易忽略的问题\n两篇笔记都谈到“学习”，并不意味着它们存在有用的关系。主题相同只是连接的起点。',
        '## 给链接写一条理由\n可以使用几种关系：支持、反驳、例子、应用、前提、延伸。明确关系后，未来的自己更容易继续思考。',
        '## 少量高质量连接\n每写一条永久笔记，先找一到三条最有意义的关联。暂时没有合适链接，也可以先独立保存。',
        '## 小练习\n打开知识库里链接最多的一篇笔记，挑三条问自己：如果删除这个链接，会损失什么理解？',
      ], ['卡片盒笔记：让观点彼此对话', '知识花园：允许想法缓慢生长']),
    note(16, '建立自己的问题清单', '05 灵感/问题', '灵感', '未读', '待沉淀', ['问题', '好奇心', '研究'],
      '持续记录真正困扰自己的问题。问题会让阅读有方向，也会帮助你在不同材料中发现同一条线索。', [
        '## 我的长期问题\n- 什么样的笔记会在半年后依然有用？\n- 怎样判断自己是理解了，还是只是熟悉了？\n- 一个工具什么时候在帮忙，什么时候在增加负担？',
        '## 把问题写具体\n“怎样提高效率”太宽泛。可以继续问：我在哪一步反复卡住？哪一个变化能减少重复劳动？',
        '## 定期重访\n每月看一次清单，记录已经出现的线索。问题的变化本身也值得保留，它反映了关注点与理解的变化。',
        '关联：[[费曼学习法：从理解到表达]]',
      ], ['费曼学习法：从理解到表达']),
    note(17, '项目复盘：个人知识空间的第一版', '01 项目/知识空间', '项目', '已读', '已沉淀', ['复盘', '产品', 'Obsidian'],
      '从清楚的入口、可信的状态和顺手的阅读开始。一个知识空间的价值，应在日常使用中被看见。', [
        '## 目标\n减少找笔记的时间，让正在阅读的材料与已经沉淀的观点都有明确位置。首页应帮助开始一天的学习。',
        '## 有效的决定\n- 用稳定分类提供导航。\n- 阅读状态与沉淀状态分开记录。\n- 卡片只展示标题、摘要与必要元信息。\n- 详情保留足够宽度，方便长文阅读。',
        '## 下一版\n观察一周内最常使用的入口。如果某个统计从未影响过行动，应该简化；如果一种检索每天都被重复使用，应该让它更直接。',
        '## 一个原则\n知识库应成为思考的环境，而不是需要持续维护的展示柜。',
      ], ['从注意力到体验：设计信息层级', 'PARA：以行动组织你的知识']),
    note(18, '研究准备 Skill：先画出问题的边界', '06 Skills/研究', 'Skills', '未读', '待沉淀', ['研究', 'Skill', 'AI'],
      '开始收集资料之前，明确研究对象、时间范围和需要做出的决定。好的边界让结果更可用。', [
        '## 开始前的三个问题\n1. 谁需要这个结果，准备做什么决定？\n2. 研究覆盖哪些对象、哪些时间范围？\n3. 怎样区分事实、推断与建议？',
        '## 资料记录\n为每条关键事实保留来源、日期与上下文。先看原始材料，再用二手报道补充视角。',
        '## 输出模板\n**结论**：直接回答研究问题。\n\n**依据**：支持结论的关键材料。\n\n**限制**：现有资料留下的空白。\n\n**行动**：根据结果可以做什么。',
        '## 检查\n删除与决定无关的背景堆积。每一段信息都应解释：它为什么改变了我们的判断？',
      ], ['建立自己的问题清单']),
    note(19, '信息收件箱：给碎片一个临时位置', '04 辅助/工作流', '辅助', '在读', '待沉淀', ['收件箱', '整理', '工作流'],
      '随手记录时保持轻松，整理时再决定归宿。收件箱是缓冲区，需要定期清空而不是不断扩张。', [
        '## 捕捉时只做一件事\n把信息保留下来，并尽量补一句“我为什么保存它”。不要在记录灵感时陷入复杂的分类。',
        '## 每周整理\n- 已失去意义的内容直接删除。\n- 与当前项目相关的放入项目。\n- 值得长期使用的提炼为资产。\n- 仅供参考的归入资源。',
        '## 一个小限制\n让收件箱保持在一屏以内。内容太多时，先停止增加新的订阅，认真处理已经留下的材料。',
        '关联：[[PARA：以行动组织你的知识]]\n[[每周回顾：把忙碌变成进展]]',
      ], ['PARA：以行动组织你的知识', '每周回顾：把忙碌变成进展']),
  ];

  function load(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : clone(fallback); }
    catch { return clone(fallback); }
  }

  function validNotes(value) {
    return Array.isArray(value) && value.length < 3000 && value.every(item =>
      item && typeof item.path === 'string' && typeof item.title === 'string' && typeof item.content === 'string' &&
      Array.isArray(item.tags) && typeof item.modified === 'number');
  }

  let notes = load(STORAGE_KEY, seed);
  if (!validNotes(notes)) notes = clone(seed);
  let settings = Object.assign({}, defaults, load(SETTINGS_KEY, defaults));
  if (!Array.isArray(settings.excludedPaths)) settings.excludedPaths = [];

  function notice(message) {
    const toast = document.getElementById('demo-toast');
    if (!toast) return;
    toast.textContent = String(message);
    toast.classList.add('visible');
    clearTimeout(notice.timer);
    notice.timer = setTimeout(() => toast.classList.remove('visible'), 2800);
  }

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
    catch { notice('本次更改已保留，浏览器未开启持久存储。'); }
  }

  function emit() {
    for (const listener of listeners) {
      try { listener(); } catch (error) { console.error('Preview subscriber:', error); }
    }
  }

  function findNote(path) {
    const found = notes.find(item => item.path === path || item.title === path.replace(/\.md$/, ''));
    if (!found) throw new Error('笔记已移除，请刷新列表。');
    return found;
  }

  function safeFolder(folder) {
    return String(folder || '00 收件箱').replace(/\\/g, '/').split('/').filter(part =>
      part && part !== '.' && part !== '..').map(part => part.replace(/[<>:"|?*\x00-\x1f]/g, '')).join('/') || '00 收件箱';
  }

  function categoryFromFolder(folder) {
    for (const category of ['项目', '资产', '资源', '辅助', '灵感', 'Skills']) if (folder.includes(category)) return category;
    return '资源';
  }

  // Render a small, safe Markdown subset without fetching remote assets or executing HTML.
  function inline(text, parent) {
    const pattern = /(\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
    let cursor = 0;
    let match;
    while ((match = pattern.exec(text))) {
      parent.append(document.createTextNode(text.slice(cursor, match.index)));
      let element;
      if (match[2]) {
        const internalTargetName = match[2];
        element = document.createElement('a');
        element.href = '#';
        element.className = 'internal-link';
        element.textContent = match[3] || match[2];
        element.dataset.href = match[2];
        const target = notes.find(item => item.title === internalTargetName || item.path === internalTargetName);
        if (target) { element.dataset.action = 'detail'; element.dataset.path = target.path; }
        element.addEventListener('click', event => {
          event.preventDefault();
          if (!target) notice('示例知识库中暂无这篇笔记。');
        });
      } else if (match[4]) {
        const url = match[5];
        element = document.createElement('a');
        element.textContent = match[4];
        if (/^https?:\/\//i.test(url)) { element.href = url; element.target = '_blank'; element.rel = 'noopener noreferrer'; }
        else if (/^#[\w\u4e00-\u9fff-]+$/.test(url)) element.href = url;
        else { element.href = '#'; element.addEventListener('click', event => event.preventDefault()); }
      } else if (match[6]) { element = document.createElement('code'); element.textContent = match[6]; }
      else if (match[7]) { element = document.createElement('strong'); element.textContent = match[7]; }
      else { element = document.createElement('em'); element.textContent = match[8]; }
      parent.append(element);
      cursor = pattern.lastIndex;
    }
    parent.append(document.createTextNode(text.slice(cursor)));
  }

  async function renderMarkdown(content, element) {
    element.replaceChildren();
    const lines = String(content).replace(/\r\n/g, '\n').split('\n');
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      if (/^```/.test(line)) {
        const code = document.createElement('code');
        const pre = document.createElement('pre');
        const language = line.slice(3).trim();
        if (/^[\w-]+$/.test(language)) code.className = 'language-' + language;
        const body = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])) body.push(lines[i++]);
        if (i < lines.length) i++;
        code.textContent = body.join('\n'); pre.append(code); element.append(pre); continue;
      }
      const heading = /^(#{1,6})\s+(.+)$/.exec(line);
      if (heading) {
        const h = document.createElement('h' + heading[1].length); inline(heading[2], h); element.append(h); i++; continue;
      }
      if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) { element.append(document.createElement('hr')); i++; continue; }
      if (/^>\s?/.test(line)) {
        const quote = document.createElement('blockquote');
        const body = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) body.push(lines[i++].replace(/^>\s?/, ''));
        const p = document.createElement('p'); inline(body.join(' '), p); quote.append(p); element.append(quote); continue;
      }
      const listMatch = /^(?:[-*+]\s+|\d+\.\s+)(.+)$/.exec(line);
      if (listMatch) {
        const ordered = /^\d+\./.test(line);
        const list = document.createElement(ordered ? 'ol' : 'ul');
        while (i < lines.length) {
          const item = (ordered ? /^\d+\.\s+(.+)$/ : /^[-*+]\s+(.+)$/).exec(lines[i]);
          if (!item) break;
          const li = document.createElement('li'); inline(item[1], li); list.append(li); i++;
        }
        element.append(list); continue;
      }
      const paragraph = [];
      while (i < lines.length && lines[i].trim() && !/^(?:#{1,6}\s|```|>\s?|[-*+]\s|\d+\.\s)/.test(lines[i])) paragraph.push(lines[i++]);
      if (!paragraph.length) { paragraph.push(lines[i]); i++; }
      const p = document.createElement('p'); inline(paragraph.join(' '), p); element.append(p);
    }
  }

  const adapter = {
    mode: 'preview',
    async getNotes() {
      const excluded = settings.excludedPaths.map(item => String(item).replace(/\\/g, '/').replace(/\/$/, ''));
      return notes.filter(item => !excluded.some(path => path && (item.path === path || item.path.startsWith(path + '/'))))
        .map(({ content, ...metadata }) => clone(metadata));
    },
    getSettings() { return clone(settings); },
    async saveSettings(patch) {
      if (typeof patch.displayName === 'string') settings.displayName = patch.displayName.trim().slice(0, 48) || 'Y';
      if (['light', 'dark', 'system'].includes(patch.theme)) settings.theme = patch.theme;
      if (['full', 'subtle', 'off'].includes(patch.motion)) settings.motion = patch.motion;
      if (Array.isArray(patch.excludedPaths)) settings.excludedPaths = patch.excludedPaths.map(String);
      if (Array.isArray(patch.bookmarks)) settings.bookmarks = patch.bookmarks.map(String);
      persist(); emit();
    },
    getVaultName() { return '我的知识花园'; },
    async openNote(path) {
      const target = findNote(path);
      window.dispatchEvent(new CustomEvent('zhijian:open-note', { detail: { path: target.path } }));
      notice('离线示例笔记：' + target.title);
    },
    async readNote(path) { return findNote(path).content; },
    renderMarkdown,
    async updateNote(path, patch) {
      const target = findNote(path);
      if (target.readonly) throw new Error('这篇笔记处于只读状态。');
      if (patch.reading !== undefined) {
        if (!['未读', '在读', '已读'].includes(patch.reading)) throw new Error('请选择有效的阅读状态。');
        target.reading = patch.reading;
        const today = new Date();
        target.readDate = patch.reading === '已读' ? today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0') : '';
      }
      if (patch.absorption !== undefined) {
        if (!['待沉淀', '已沉淀', '无需沉淀'].includes(patch.absorption)) throw new Error('请选择有效的沉淀状态。');
        target.absorption = patch.absorption;
      }
      // Optional preview-only editing fields retain the same adapter behavior.
      if (typeof patch.content === 'string') target.content = patch.content;
      if (typeof patch.excerpt === 'string') target.excerpt = patch.excerpt;
      if (Array.isArray(patch.tags)) target.tags = patch.tags.map(String);
      target.modified = Date.now(); persist(); emit();
    },
    async createNote({ title, folder, tags, content }) {
      const cleanTitle = String(title || '').trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '').replace(/\.md$/i, '').replace(/^[.\s]+|[.\s]+$/g, '').slice(0, 160);
      if (!cleanTitle) throw new Error('请填写笔记标题。');
      const cleanFolder = safeFolder(folder);
      let fileTitle = cleanTitle;
      let suffix = 2;
      while (notes.some(item => item.path === cleanFolder + '/' + fileTitle + '.md')) fileTitle = cleanTitle + ' ' + suffix++;
      const path = cleanFolder + '/' + fileTitle + '.md';
      const body = String(content || '# ' + fileTitle + '\n\n从一个想法开始。');
      const cleanTags = (Array.isArray(tags) ? tags : []).map(tag => String(tag).replace(/^#/, '').trim()).filter(Boolean);
      const excerpt = body.replace(/^---\n[\s\S]*?\n---\n?/, '').replace(/^#+\s.+$/gm, '')
        .replace(/\[\[([^\]]+)\]\]/g, '$1').replace(/[`*_>]/g, '').trim().replace(/\s+/g, ' ').slice(0, 125);
      notes.unshift({ path, title: fileTitle, folder: cleanFolder, category: categoryFromFolder(cleanFolder),
        reading: '未读', absorption: '待沉淀', tags: cleanTags, excerpt, content: body,
        created: Date.now(), modified: Date.now(), readDate: '',
        links: Array.from(body.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g), match => match[1]), readonly: false });
      persist(); emit(); return path;
    },
    async deleteNote(path) {
      const target = findNote(path);
      if (target.readonly) throw new Error('这篇笔记处于只读状态。');
      notes = notes.filter(item => item.path !== target.path); persist(); emit();
    },
    subscribe(callback) { listeners.add(callback); return () => listeners.delete(callback); },
    notice,
    async openGraph() {
      window.dispatchEvent(new CustomEvent('zhijian:open-graph'));
      notice('关系图谱展示当前示例笔记之间的连接。');
    },
  };

  // Public helpers for preview verification; do not access an external Obsidian vault.
  window.ZhijianDemo = {
    adapter,
    reset() {
      notes = clone(seed); settings = clone(defaults); persist();
      if (window.ZhijianDemo.app && window.ZhijianDemo.app.destroy) window.ZhijianDemo.app.destroy();
      if (window.ZhijianUI) window.ZhijianDemo.app = window.ZhijianUI.mount(document.getElementById('app'), adapter);
      emit(); notice('已恢复示例知识库。');
    },
    inspect() { return { notes: clone(notes), settings: clone(settings) }; },
  };

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('app');
    document.getElementById('demo-reset').addEventListener('click', () => {
      // The change is limited to this offline demo and can be recreated at any time.
      window.ZhijianDemo.reset();
    });
    if (!window.ZhijianUI || typeof window.ZhijianUI.mount !== 'function') {
      root.replaceChildren();
      const fallback = document.createElement('div'); fallback.className = 'demo-loading';
      const heading = document.createElement('strong'); heading.textContent = '知间预览文件未完整加载';
      const text = document.createElement('p'); text.textContent = '请保持 preview 与 zhijian-obsidian 文件夹相邻，然后重新打开此页面。';
      fallback.append(heading, text); root.append(fallback); return;
    }
    try {
      window.ZhijianDemo.app = window.ZhijianUI.mount(root, adapter);
      Promise.resolve(window.ZhijianDemo.app).catch(error => {
        console.error('Preview mount:', error); notice('页面加载遇到问题，请刷新后重试。');
      });
    } catch (error) { console.error('Preview mount:', error); notice('页面加载遇到问题，请刷新后重试。'); }
  });
}());
