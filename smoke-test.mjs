// 冒烟测试：通过 Vite SSR 加载器渲染全部画科布局（本文件本身保持无 JSX）。
// 运行：node smoke-test.mjs
const { createElement: h } = await import('react')
const { renderToString } = await import('react-dom/server')
const { createServer } = await import('vite')

global.IntersectionObserver = class {
  observe() {} unobserve() {} disconnect() {}
}
// CompareStudio 的选择持久化会访问 localStorage（SSR / Node 下提供内存兜底）。
const memoryStorage = new Map()
global.localStorage = {
  getItem: (key) => (memoryStorage.has(key) ? memoryStorage.get(key) : null),
  setItem: (key, value) => memoryStorage.set(key, String(value)),
  removeItem: (key) => memoryStorage.delete(key)
}

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const museum = await vite.ssrLoadModule('/src/data/museumData.js')
const taxonomyMod = await vite.ssrLoadModule('/src/data/taxonomy.js')
const techniqueMod = await vite.ssrLoadModule('/src/data/techniques.js')
const painting = await vite.ssrLoadModule('/src/lib/painting.js')
const TaxonomySection = (await vite.ssrLoadModule('/src/components/TaxonomySection.jsx')).default
const CompareStudio = (await vite.ssrLoadModule('/src/components/CompareStudio.jsx')).default
const CompositionLab = (await vite.ssrLoadModule('/src/components/CompositionLab.jsx')).default

const { artworks } = museum
const { buildTaxonomy, selectArtworksBySubject, subjects, getSubject } = taxonomyMod
const {
  techniques, buildTechniqueIndex, selectArtworksByTechnique, getDimensionRows, getTechniqueView
} = techniqueMod
const taxonomy = buildTaxonomy(artworks)
const artworkById = new Map(artworks.map((a) => [a.id, a]))

let failures = 0
const assert = (cond, msg) => {
  if (!cond) { failures += 1; console.log('  ✗', msg) }
  return cond
}

const section = (props) => renderToString(h(TaxonomySection, {
  onSubjectChange: () => {}, onOpen: () => {}, statusMessage: '', artworkRows: artworks, taxonomy, ...props
}))

for (const subject of subjects) {
  const rows = selectArtworksBySubject(artworks, taxonomy, subject.id, artworkById)
  const html = section({ activeSubjectId: subject.id, query: '', results: rows })
  const okSize = assert(html.length > 2000, `${subject.name} 渲染过短`)
  const okEmpty = rows.length === 0 ? assert(html.includes('暂无在展作品'), `${subject.name} 应显示空态`) : true
  console.log(`${subject.name} | ${okSize ? '渲染OK' : '渲染失败'} | ${rows.length} 件${rows.length === 0 && okEmpty ? ' · 空态OK' : ''}`)
}

const searchRows = artworks.filter((a) => `${a.detail}${a.composition}`.includes('屏风'))
const searchHtml = section({ activeSubjectId: 'figure', query: '屏风', results: searchRows })
assert(searchHtml.includes('全库检索'), '搜索态应渲染中性结果网格')
console.log(`搜索态 | ${searchRows.length} 条命中 | ${searchHtml.includes('全库检索') ? 'OK' : 'FAIL'}`)

const missing = artworks.filter((a) => !a.art && !a.image)
const generated = artworks.filter((a) => painting.resolveArtworkImage(a)?.startsWith('data:image/svg+xml'))
console.log(`图像链路 | ${generated.length} 件生成 SVG 示意 | ${missing.length} 件缺图（${missing.map((a) => a.id).join(',')}）`)
assert(generated.length >= 20, '应有 20+ 件可离线生成示意图')
assert(missing.length === 1, '应有 1 件故意缺图的数据缺失示例')

const figIds = new Set(selectArtworksBySubject(artworks, taxonomy, 'figure', artworkById).map((a) => a.id))
const shared = selectArtworksBySubject(artworks, taxonomy, 'jiehua', artworkById).filter((a) => figIds.has(a.id))
assert(shared.length === 2, `人物/界画应共享 2 件，实际 ${shared.length}`)
console.log('零复制多科 |', shared.map((a) => a.title).join('、'))
assert(getSubject('nope') === null, '未知画科应返回 null')
assert(taxonomy.warnings.some((w) => w.type === 'missing-field'), '应产出缺字段告警')

/* ---------------- 表现技法比较页 ---------------- */
console.log('\n— 表现技法比较 —')
const techniqueIndex = buildTechniqueIndex(artworks)
const renderCompare = () => renderToString(h(CompareStudio, {
  artworkRows: artworks, onOpen: () => {}, statusMessage: ''
}))

for (const technique of techniques) {
  const rows = selectArtworksByTechnique(artworks, techniqueIndex, technique.id, artworkById)
  assert(rows.length > 0, `${technique.name} 应有代表作`)
  // 每件代表作都必须带笔墨判读与至少两个局部热点，否则比较器无内容可比。
  rows.forEach((artwork) => {
    const view = getTechniqueView(artwork, technique.id)
    assert(view.details.length >= 2, `${technique.name}/${artwork.title} 至少 2 个笔墨热点`)
    view.details.forEach((detail) => {
      assert(detail.x >= 0 && detail.x <= 1 && detail.y >= 0 && detail.y <= 1,
        `${artwork.title} 热点「${detail.label}」坐标需在 0~1`)
    })
  })
  console.log(`${technique.name} | ${rows.length} 件 | 热点校验OK`)
}

// 跨技法作品：兼工带写，作品仍只存一份（零复制，多 ID 关联）。
assert(techniqueIndex.multiTechnique.some((m) => m.artworkId === 'double-happiness'),
  '《双喜图》应兼属工笔与写意')
const gongbiRows = selectArtworksByTechnique(artworks, techniqueIndex, 'gongbi', artworkById)
const xieyiRows = selectArtworksByTechnique(artworks, techniqueIndex, 'xieyi', artworkById)
const sharedTechnique = gongbiRows.filter((a) => xieyiRows.some((b) => b.id === a.id))
assert(sharedTechnique.length >= 1, '工笔/写意应共享至少 1 件兼工带写作品')
console.log('跨技法零复制 |', sharedTechnique.map((a) => a.title).join('、'))

// 维度矩阵：三种技法两两可对照，且两侧文案不同（比较而非复制）。
for (const pair of [['gongbi', 'xieyi'], ['gongbi', 'mogu'], ['xieyi', 'mogu']]) {
  const rows = getDimensionRows(pair[0], pair[1])
  assert(rows.length >= 5, `${pair.join(' vs ')} 至少 5 个比较维度`)
  assert(rows.every((r) => r.left && r.right && r.left !== r.right), `${pair.join(' vs ')} 两侧文案需相异`)
}

// 新入藏代表作（大写意 / 减笔写意 / 没骨 ×2）的图像链路与立轴尺寸。
for (const id of ['ink-grapes', 'lotus-birds-bada', 'peony-mogu', 'album-grass-insects']) {
  const artwork = artworkById.get(id)
  assert(artwork, `应有作品 ${id}`)
  const size = painting.artworkNaturalSize(artwork)
  assert(size && size.width > 0 && size.height > 0, `${id} 应有自然尺寸`)
  assert(painting.resolveArtworkImage(artwork)?.startsWith('data:image/svg+xml'), `${id} 应离线生成 SVG`)
}
const hanging = painting.artworkNaturalSize(artworkById.get('ink-grapes'))
assert(hanging.width === 620 && hanging.height === 880, '立轴大写意应为 620×880')

// 比较页 SSR：默认工笔 vs 写意，应渲染技法槽位、维度矩阵与双画浏览器。
const compareHtml = renderCompare()
assert(compareHtml.length > 4000, '比较页渲染过短')
assert(compareHtml.includes('工笔') && compareHtml.includes('写意'), '比较页应含默认两侧技法')
assert(compareHtml.includes('cmp-stage'), '比较页应含双画浏览器')
assert(compareHtml.includes('cmp-hotspot'), '比较页应渲染笔墨热点')
assert(compareHtml.includes('比较维度'), '比较页应含维度矩阵')
console.log('比较页 SSR | OK |', compareHtml.length, '字节')

/* ---------------- 构图标本库（第三迭代） ---------------- */
console.log('\n— 构图标本库 —')
const compositionMod = await vite.ssrLoadModule('/src/data/compositions.js')
const {
  compositions: compList, specimens: specimenList, buildCompositionIndex, selectSpecimens,
  annotationBounds, annotationAnchor, getComposition
} = compositionMod
const compIndex = buildCompositionIndex(artworks)

// 五种构图法都必须有标本，且全部标本引用到真实存在的作品。
assert(compList.length === 5, '应有 5 种构图法')
for (const composition of compList) {
  const rows = selectSpecimens(composition.id)
  assert(rows.length >= 2, `${composition.name} 至少 2 件标本`)
  rows.forEach((specimen) => {
    assert(artworkById.has(specimen.artworkId), `${composition.name} 标本引用的作品需存在：${specimen.artworkId}`)
  })
  console.log(`${composition.name} | ${rows.length} 件标本`)
}
assert(specimenList.length >= 10, `标本总数应 ≥10，实际 ${specimenList.length}`)
assert(compIndex.warnings.length === 0, '构图标本数据不应有告警：' + compIndex.warnings.map((w) => w.message).join('；'))

// 标注数量与形状「不固定」：全库标注数至少有 3 种不同取值，且覆盖三类标注与多种形状。
assert(compIndex.distinctAnnotationCounts.size >= 3, `标注数量应不统一（≥3 种取值），实际 ${[...compIndex.distinctAnnotationCounts].join('/')}`)
console.log('标注数量分布 |', compIndex.annotationCounts.join(', '), '处/标本')
assert(compIndex.shapeUsage.guide.length >= 2, '辅助线应覆盖 ≥2 种形状')
assert(compIndex.shapeUsage.mask.length >= 2, '遮罩应覆盖 ≥2 种形状')
assert(compIndex.shapeUsage.focus.includes('crosshair'), '视觉中心应为 crosshair')
console.log('形状覆盖 |', Object.entries(compIndex.shapeUsage).map(([k, v]) => `${k}:${v.join('/')}`).join(' · '))

// 每个标本：至少 2 处标注、必含视觉中心、所有归一化坐标落在 0~1、包围盒可计算。
for (const specimen of specimenList) {
  assert(specimen.annotations.length >= 2, `${specimen.id} 至少 2 处标注`)
  assert(specimen.annotations.some((a) => a.kind === 'focus'), `${specimen.id} 应含视觉中心标记`)
  specimen.annotations.forEach((annotation) => {
    assert(annotation.label && annotation.text, `${specimen.id} 标注需有名称与解释`)
    const anchor = annotationAnchor(annotation)
    assert([anchor.x, anchor.y].every((n) => n >= 0 && n <= 1), `${specimen.id} 锚点需在 0~1`)
    const bounds = annotationBounds(annotation)
    assert(bounds.w >= 0 && bounds.h >= 0 && bounds.x >= 0 && bounds.y >= 0, `${specimen.id} 包围盒非法`)
  })
}
console.log('归一化坐标 / 锚点 / 包围盒校验 | OK')

// 一件作品可被多种构图标本引用（零复制：作品记录仍只在 museumData 中一份）。
const usageCount = new Map()
for (const specimen of specimenList) usageCount.set(specimen.artworkId, (usageCount.get(specimen.artworkId) ?? 0) + 1)
const reused = [...usageCount].filter(([, n]) => n > 1)
assert(reused.length >= 1, '应至少有 1 件作品被多种构图法引用')
console.log('多构图引用（零复制）|', reused.map(([id]) => artworkById.get(id).title).join('、'))
assert(getComposition('nope') === null, '未知构图法应返回 null')

// 构图层 SSR：应渲染构法 tabs、原图/分析模式切换、SVG 标注层与编号热点。
const compHtml = renderToString(h(CompositionLab, { artworkRows: artworks, onOpen: () => {}, statusMessage: '' }))
assert(compHtml.length > 4000, '构图页渲染过短')
assert(compHtml.includes('散点透视') && compHtml.includes('三远法'), '构图页应含构法名')
assert(compHtml.includes('sp-mode-switch'), '构图页应含原图/分析模式切换')
assert(compHtml.includes('sp-svg'), '构图页应含 SVG 标注层')
assert(compHtml.includes('sp-pin'), '构图页应渲染编号热点')
assert(compHtml.includes('annotation-list'), '构图页应含标注清单')
console.log('构图页 SSR | OK |', compHtml.length, '字节')

await vite.close()
console.log(failures === 0 ? '\n全部冒烟检查通过 ✓' : `\n${failures} 项失败 ✗`)
process.exit(failures === 0 ? 0 : 1)
