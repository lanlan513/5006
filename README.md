# 字形演变观察器 · 篆隶楷行草

输入或选择一个汉字，沿 **篆 → 隶 → 楷 → 行 → 草** 五个阶段观察它的结构压缩、笔画变化与形态重组。

页面重点不是作品介绍，而是同一个字在五种书体中的形体对照。没有可靠样本的阶段**如实留缺**——不以推测补形、不伪造连续演变。

## 运行

```bash
npm install
npm run dev        # http://localhost:5187
npm run build      # 产物在 dist/
npm run build:fonts  # 重新下载并子集化字体（见下）
```

## 数据结构：汉字 → 书体 → 字形资源

```
src/data/scripts.js     五种书体的阶段定义（年代、特征、字体资源键）与四段过渡解读
src/data/glyphData.js   考据字库：entry(字) → forms(书体) → { display, note, tags } | { missing }
src/data/fontManifest.json  各字库真实收字清单（构建期由字体 cmap 生成）
src/lib/fonts.js        字体异步加载（FontFace API）、状态机 idle/loading/ready/error、覆盖查询
src/lib/resolve.js      输入字 → 五个书体格子的视图模型（考据 / 字库自动 / 缺样）
```

- **考据条目**：19 个手工注记的汉字，含每书体的结构观察与变化标签；`alias` 支持繁体输入（如「書」→「书」）。
- **字库自动条目**：考据库之外的字，按字库覆盖如实渲染，不编造注记。
- **缺样**：条目明确标记 `missing`，或字库未收录——界面显示缺样格与原因。

## 字形资源与许可

| 书体 | 字体 | 许可 | 收字 |
| --- | --- | --- | --- |
| 篆 | [霞鹜篆书 LXGW Seal](https://github.com/lxgw/LxgwSeal)（据《说文》小篆，含今字映射） | OFL-1.1 | 133 |
| 隶 | [清骨隸 Qinggu Li](https://github.com/IIzzaya/project-qing-font)（金农隶意） | Arphic PL | 1025 |
| 楷 | [Ma Shan Zheng](https://github.com/googlefonts/mashanzheng) | OFL-1.1 | 3755 |
| 行 | [Zhi Mang Xing](https://github.com/googlefonts/zhimangxing) | OFL-1.1 | 3755 |
| 草 | [Liu Jian Mao Cao](https://github.com/googlefonts/liujianmaocao) | OFL-1.1 | 3755 |

许可全文见 `public/fonts/licenses/`。字体为现代开源字库，非碑帖原迹。

`npm run build:fonts` 执行完整管线：下载上述字体 → 子集化（篆保留全部码位；隶沿用作者子集；楷行草取 GB2312 一级字 3755 字）→ 输出 `public/fonts/*.woff2` 并从真实 cmap 生成 `fontManifest.json`。

## 异步加载与降级

- 五个字体经 `FontFace` API 异步加载，状态实时显示在字库状态条（载入中 / 就绪 / 失败可重试）。
- 加载中：格子显示幽灵字与「字体载入中…」。
- 加载失败：该格子降级为系统字体渲染并标注「系统字代替」，状态条提供重试；其余书体不受影响。
- 缺样与降级是两种不同状态：前者是数据断点（不补），后者是资源故障（可重试）。
