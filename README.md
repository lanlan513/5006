# 中国画科馆 · Taxonomy of Painting

中国传统绘画分科浏览界面：人物画、山水画、花鸟画、界画（另保留一个空的走兽画入口）作为一级入口，**每个画科进入后采用不同的视觉布局**，而不是复用同一个作品列表。

第二迭代新增 **「表现技法比较」** 页（导航进入或 `#compare`）：不再按画科（画了什么）组织，而是围绕工笔 / 写意 / 没骨（怎么画）双作品对照。

## 运行

```bash
npm install
npm run dev      # Vite 5187 + Express API 3018（/api 已代理）
# 或
npm run build && npm start   # 生产模式，单端口 3018
npm run smoke                # SSR 冒烟测试：五科渲染 / 空态 / 搜索 / 图像链路 / 多科零复制 / 技法比较
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

## 第二迭代：表现技法比较（`#compare`）——回答「怎么画」

信息结构与画科馆刻意不同：画科按题材分，每种一科一种陈列布局；比较页首页即一台**双作品比较器**，作品、局部热点、文字解释都随所选两种技法重新组合。

```
src/data/techniques.js     表现技法分类法（与 taxonomy.js 平行的第二套关系数据）
                           ├─ techniques[]：工笔 / 写意 / 没骨（方法步骤、观看提示）
                           ├─ TECHNIQUE_DIMENSIONS：用线/运笔/墨色/设色/程序/气息 六维对照
                           ├─ buildTechniqueIndex(artworks)：扫描作品 techniqueIds 反向构建
                           │   「技法 → 作品ID[]」索引（只存 ID，不复制作品对象）
                           └─ getTechniqueView(artwork, id)：作品在某技法语境下的
                               brushNote（笔墨判读）与 details[]（带归一化坐标的笔墨热点）
```

- **零复制多技法**：作品以 `techniqueIds: string[]` 指向技法，《双喜图》兼工带写 → `['gongbi','xieyi']`，在两种技法中各出现一次，作品记录仍只有一份。共 工笔 12 / 写意 12 / 没骨 2。
- **新增代表作**：徐渭《墨葡萄图》、朱耷《荷石水禽图》（大写意 / 减笔），恽寿平《牡丹图册》、传徐崇嗣《草虫册》（没骨）。painting.js 为之新增泼墨葡萄、减笔水鸟、没骨牡丹、渍染草虫四种 motif 与立轴尺寸。
- **作品上的笔墨数据**：每件代表作带 `brushNote`（一句话判读）与 3 个 `details`（`{x,y}` 为 0~1 归一化坐标 + 局部解释），如「斧劈皴」「泼墨叶」「水色接染」——信息骨架是笔墨语言而非题材。
- **双作品同步浏览器 `CompareViewer`**：
  - 视图状态 `{ scale, focus:{x,y} }` 全部归一化，焦点坐标与画幅纵横比无关，立轴 / 长卷 / 册页可共享同一状态；
  - 默认**双画同步**（拖一侧两画一起动），可解开链接两侧独立浏览；
  - 滚轮以指针位置为焦点缩放（非被动 `preventDefault`）、双击放大/复位、按钮 +/−、复位；
  - Pointer Events 统一鼠标 / 触控：单指拖动、双指捏合缩放（焦点取两指中点），`touch-action:none` 阻止页面滚动，移动端两屏改为纵向堆叠；
  - 局部热点点击后双画同步放大到对应位置（同名热点坐标可不同、各自归一化），下方并排显示两技法在这一笔上的做法；
  - 右下角小地图（minimap）显示当前视口窗口，可点击/拖动定位；左上角实时显示归一化坐标。
  - 坐标全部走「视口像素 ↔ 归一化」换算，热点位置与高清图实际像素解耦，换图或容器尺寸变化不错位。
- 选择状态（技法对 + 两侧作品）持久化到 `localStorage`，刷新仍在；服务端同源下发 `GET /api/techniques`，不可达时本地无缝兜底。

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
  data/taxonomy.js                 画科分类法 + 反向索引 + 数据校验
  data/techniques.js               表现技法分类法（工笔/写意/没骨）+ 六维对照 + 反向索引
  data/museumData.js               作品数据（subjectIds / techniqueIds / art 描述符 / 笔墨热点）
  lib/painting.js                  离线水墨 SVG 生成器（含泼墨/没骨 motif）+ 自然尺寸/适配换算
  lib/storage.js                   收藏与浏览位置持久化
  components/
    CompareStudio.jsx              技法比较页：技法槽位 / 维度矩阵 / 作品重组
    CompareViewer.jsx              双作品同步浏览器（缩放、拖动、捏合、热点、小地图）
    TaxonomySection.jsx            一级入口、滚动记忆、搜索覆盖、关系检查器
    FigureHandscroll.jsx           人物 · 手卷
    LandscapeHanging.jsx           山水 · 立轴（三远分组）
    FlowerbirdAlbum.jsx            花鸟 · 册页（题材筛选）
    JiehuaRuler.jsx                界画 · 界尺
    ArtworkDrawer.jsx              作品详情（多科归属与语境化观察点）
    common.jsx                     懒加载图片 / 观察点 / 空态 / 缺字段标记
server/
  app.js                           /api/taxonomy、/api/techniques、/api/artworks?subjectId=…
  repositories/artworkRepository.js 与前端共用 data/ 下的同一份数据
```

> 图像说明：内置 SVG 为风格化示意，用于在无馆藏照片时呈现题材、构图与主要表现对象；接入真实馆藏 URL 后写入作品的 `image` 字段即可自动优先使用。
