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
