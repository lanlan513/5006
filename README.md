# 中国画科馆 · Taxonomy of Painting

中国传统绘画分科浏览界面：人物画、山水画、花鸟画、界画（另保留一个空的走兽画入口）作为一级入口，**每个画科进入后采用不同的视觉布局**，而不是复用同一个作品列表。

## 运行

```bash
npm install
npm run dev      # Vite 5187 + Express API 3018（/api 已代理）
# 或
npm run build && npm start   # 生产模式，单端口 3018
npm run smoke                # SSR 冒烟测试：五科渲染 / 空态 / 搜索 / 图像链路 / 多科零复制
```

## 核心设计：分类是独立的关系数据，不是作品上的硬编码列表

```
src/data/taxonomy.js    画科分类法（独立数据结构）
                        ├─ subjects[]：每个画科的介绍、观看点、专属布局 layout
                        ├─ buildTaxonomy(artworks)：扫描作品上的 subjectIds，
                        │   反向构建 画科 → 作品ID[] 索引（存 ID，不存对象）
                        │   同时产出计数、缺字段告警、悬空分类引用、多重归类清单
                        └─ getSubjectView(artwork, subjectId)：
                            多科作品在不同画科语境下给出不同的「题材/构图/表现对象」观察点
src/data/museumData.js  作品唯一事实来源；每件绘画作品以 subjectIds: string[] 指向画科
```

- **多重归类零复制**：《清明上河图》`subjectIds: ['figure','jiehua']`，在人物画与界画中各自出现，但作品记录只有一份；两个分类的索引都只持有它的 ID。全库共 4 件多科作品。
- **前端动态生成分类结果**：组件不硬编码任何作品。`TaxonomySection` 从 taxonomy 索引按 ID 解析出作品对象后，交给与画科对应的布局组件。
- **服务端同源**：`GET /api/taxonomy` 由同一份数据构建（`server/repositories/artworkRepository.js`），同样只下发 ID 索引；API 不可用时前端本地构建无缝兜底。

## 四种布局（对应四种传统观看方式）

| 画科 | 布局组件 | 观法 |
| --- | --- | --- |
| 人物画 | `FigureHandscroll` | 横向**手卷**：可拖动卷杆进度、纵向滚轮转横向、不等宽画卷卡片、编号引首 |
| 山水画 | `LandscapeHanging` | **立轴**分组：按郭熙「高远 / 深远 / 平远」与南宋「边角」分组，三列错落悬挂，可开关构图标记（主峰轴线、取景标签） |
| 花鸟画 | `FlowerbirdAlbum` | 方形**册页**网格：题材筛选（禽鸟/花卉/草虫），悬停翻面显示主要表现对象 |
| 界画 | `JiehuaRuler` | **界尺横轴**：营造标尺刻度、建筑编号与结构标签，与手卷不同的阅读节奏 |
| 走兽画 | — | **空分类**：入口与计数（0）保留，显示编目中说明，数据回补后自动出现作品 |

搜索时覆盖为中性的「全库结果」网格，不污染任何画科布局；清空搜索即回到原布局。

## 切换画科保持浏览位置

`TaxonomySection` 为每个画科记忆两类位置（内存 + `localStorage`，刷新也在）：

1. `window.scrollY`：切换瞬间固化旧画科位置，新画科布局挂载后于 `requestAnimationFrame` 恢复；
2. 布局内部横向滚动：手卷 / 界画的 `scrollLeft`，通过 `scrollerRef` 收集与还原。

图片容器一律固定 `aspect-ratio`，图片解码前后版面高度不变，恢复滚动不会跳动。

## 图片懒加载与缺失处理

- `components/common.jsx#LazyPainting`：`IntersectionObserver`（rootMargin 320px）进入视口附近才挂载 `<img loading="lazy">`，带加载幕布与错误重试；
- 图像解析顺序：作品外链照片 → 本地方案；外链失败自动回落，全部失败显示「图像缺失」斜纹占位；
- `src/lib/painting.js`：由作品 `art` 描述符**确定性生成**水墨/青绿 SVG 示意画（data URI，离线可用），同 ID 多次引用结果缓存为同一引用——多科作品不会各存一张图；
- **数据缺失**：作者缺失显示「佚名」、年代缺失「年代不详」、字段未著录显示「待考」虚线标记，顶部给出缺项数据横幅，「分类关系」面板可查看全部告警与悬空引用；数据缺失示例作品为 `silk-fragment-unnamed`。

## 目录

```
src/
  data/taxonomy.js                 分类法 + 反向索引 + 数据校验
  data/museumData.js               作品数据（含 subjectIds / art 描述符 / 观察点）
  lib/painting.js                  离线水墨 SVG 生成器
  lib/storage.js                   收藏与浏览位置持久化
  components/
    TaxonomySection.jsx            一级入口、滚动记忆、搜索覆盖、关系检查器
    FigureHandscroll.jsx           人物 · 手卷
    LandscapeHanging.jsx           山水 · 立轴（三远分组）
    FlowerbirdAlbum.jsx            花鸟 · 册页（题材筛选）
    JiehuaRuler.jsx                界画 · 界尺
    ArtworkDrawer.jsx              作品详情（多科归属与语境化观察点）
    common.jsx                     懒加载图片 / 观察点 / 空态 / 缺字段标记
server/
  app.js                           /api/taxonomy、/api/artworks?subjectId=…
  repositories/artworkRepository.js 与前端共用 data/ 下的同一份数据
```

> 图像说明：内置 SVG 为风格化示意，用于在无馆藏照片时呈现题材、构图与主要表现对象；接入真实馆藏 URL 后写入作品的 `image` 字段即可自动优先使用。
