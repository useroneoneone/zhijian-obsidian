# 回归测试

在 `zhijian-obsidian` 目录执行：

```sh
npm test
```

测试只使用 Node.js 标准库，不需要安装测试依赖。仓库中的 `main.js` 已生成；修改插件源码后先执行 `npm ci --ignore-scripts` 与 `npm run build`，再运行测试。请保留与插件目录相邻的 `scripts` 和 `preview` 目录。

运行器逐个启动独立 Node.js 进程，自动发现本目录的 `*.test.js`，并执行 `scripts/verify-preview.cjs`。文件发现由 Node.js 完成，支持 Windows；性能检查顺序执行，避免多个模拟同时争抢计算资源。

| 文件 | 验证范围 |
| --- | --- |
| `core.test.js` | 分区与排除规则、只读索引、缓存、YAML 更新顺序、新建笔记、索引与日志保留、重复防护和事件清理 |
| `carousel.test.js` | 轮换计时、手动控制、悬停/聚焦/后台暂停、减少动效与资源清理 |
| `fx.test.js` | 画布尺寸、DPR、粒子和着色器参数、倾斜交互、后台与动效设置、降级及资源清理 |
| `graph-physics.test.js` | 实际 `graph.js` 导出的力导向模拟、确定性、固定节点、重热、数值稳定与千节点计算 |
| `fluid-layout.test.js` | 实际 `fluid.js` 的增量出生、惯性、固定节点、时间步、尺寸变化、千节点计算和稳定收敛 |
| `graph.test.js` | 图谱模型、逐个出生、镜头与标签稳定、拖拽/平移/缩放、后台暂停、键盘定位和生命周期 |
| 仓库根目录的 `scripts/verify-preview.cjs` | 原创示例数据、连接、增删改、书签、主题、排除范围、订阅与 Markdown 输出 |

Obsidian API、浏览器事件、Canvas/WebGL 和存储均使用内存中的模拟对象。测试不会打开真实知识库，也不会访问浏览器已有存储。通过这些检查表示代码契约与回归用例通过；**真实 Obsidian 应用中的插件加载、窗口布局和实际设备视觉效果仍需单独验收**。

## 宿主样式与长文本布局回归

启动仓库根目录的 `start-preview.cmd`，访问 `http://127.0.0.1:4177/zhijian-obsidian/tests/native-layout.html`。此页面复用实际 UI，注入宿主按钮的 `inline-flex`、居中与 `nowrap` 样式，使用原创中文长标题、连续英文和中英文混排数据；不读取知识库或浏览器存储。

顶部结果检查统计文字的垂直次序、卡片边界及标题和摘要的两行上限。使用 `?theme=light` 检查浅色主题，调整窗口宽度检查响应式布局；同时查看轮换控件是否与卡片重叠。已验证 1440、900、390 像素宽度下的深浅双主题，卡片与控件间距至少 13 像素。这是浏览器宿主样式回归，不替代真实 Obsidian 的整体验收。
