// 冒烟测试：通过 Vite SSR 加载器渲染全部画科布局（本文件本身保持无 JSX）。
// 运行：node smoke-test.mjs
const { createElement: h } = await import('react')
const { renderToString } = await import('react-dom/server')
const { createServer } = await import('vite')

global.IntersectionObserver = class {
  observe() {} unobserve() {} disconnect() {}
}

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const museum = await vite.ssrLoadModule('/src/data/museumData.js')
const taxonomyMod = await vite.ssrLoadModule('/src/data/taxonomy.js')
const painting = await vite.ssrLoadModule('/src/lib/painting.js')
const TaxonomySection = (await vite.ssrLoadModule('/src/components/TaxonomySection.jsx')).default

const { artworks } = museum
const { buildTaxonomy, selectArtworksBySubject, subjects, getSubject } = taxonomyMod
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

await vite.close()
console.log(failures === 0 ? '\n全部冒烟检查通过 ✓' : `\n${failures} 项失败 ✗`)
process.exit(failures === 0 ? 0 : 1)
