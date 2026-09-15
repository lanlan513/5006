/**
 * 画科分类法（taxonomy）
 * ----------------------
 * 分类是一棵独立的数据结构：这里只描述“画科”本身，以及它应当采用的观看布局。
 * 作品记录存放在 museumData.js 中，通过作品上的 subjectIds 反向关联到画科，
 * 分类结果由 buildTaxonomy() 在运行时计算 —— 同一件作品可以同时属于多个画科，
 * 但作品数据始终只有一份，不为任何分类复制。
 */

export const SUBJECT_LAYOUTS = {
  handscroll: { id: 'handscroll', name: '手卷观法', hint: '横向徐徐展卷' },
  hanging: { id: 'hanging', name: '立轴观法', hint: '悬挂远观，由主峰入画' },
  album: { id: 'album', name: '册页观法', hint: '折枝小品，逐开细读' },
  ruler: { id: 'ruler', name: '界尺观法', hint: '以建筑尺度为序' }
}

export const subjects = [
  {
    id: 'figure',
    name: '人物画',
    pinyin: 'REN WU HUA',
    layout: 'handscroll',
    epithet: '以形写神',
    intro:
      '人物画是中国画中最早独立成科的门类，长于以连续画面铺陈史传、道释与风俗。观看时宜沿卷横向移动，注意画家如何用主大从小的尺度安排尊卑，用线描衣纹交代身份与动态。',
    viewing: [
      { label: '题材', text: '史传 / 道释 / 风俗 / 肖像' },
      { label: '构图', text: '长卷分段，以屏风、乐宴切分时间' },
      { label: '表现对象', text: '人物神态、衣纹线描与器物道具' }
    ],
    guide: '拖动长卷，像展开一部连续的画传。'
  },
  {
    id: 'landscape',
    name: '山水画',
    pinyin: 'SHAN SHUI HUA',
    layout: 'hanging',
    epithet: '可行 · 可望 · 可游 · 可居',
    intro:
      '山水画在宋代蔚为大国。郭熙《林泉高致》提出“三远”：自山下而仰山巅谓之高远，自山前而窥山后谓之深远，自近山而望远山谓之平远；南宋又开边角之景。下列作品按取景法分组立轴。',
    viewing: [
      { label: '题材', text: '山川行旅、渔隐与文人居所' },
      { label: '构图', text: '高远 / 深远 / 平远 / 边角' },
      { label: '表现对象', text: '峰峦、皴法、云水留白与点景人物' }
    ],
    guide: '沿立轴自下而上，跟随山势与留白游走。'
  },
  {
    id: 'flower-bird',
    name: '花鸟画',
    pinyin: 'HUA NIAO HUA',
    layout: 'album',
    epithet: '折枝写生',
    intro:
      '花鸟画以精微观察为本，黄筌富贵、徐熙野逸，各自开出工笔与写意的传统。册页斗方截取自然一隅，一花一鸟自成天地。可用题材筛选，在方寸之间比较观察对象。',
    viewing: [
      { label: '题材', text: '禽鸟 / 花卉 / 草虫 / 鳞介' },
      { label: '构图', text: '折枝截取，留白即天地' },
      { label: '表现对象', text: '翎毛姿态、花叶向背与笔墨情态' }
    ],
    guide: '逐开翻阅册页，悬停可看表现对象。'
  },
  {
    id: 'jiehua',
    name: '界画',
    pinyin: 'JIE HUA',
    layout: 'ruler',
    epithet: '尺木为界，折算无差',
    intro:
      '界画以界尺引线，专写楼阁舟桥，是中国画中最重尺度与结构的门类。它常与风俗人物共生：建筑既是背景，也是真正的主角。此处以层叠横轴陈列，标尺与编号对应建筑秩序。',
    viewing: [
      { label: '题材', text: '宫苑、城楼、舟桥与市井' },
      { label: '构图', text: '横卷展开，折算准确、疏密有序' },
      { label: '表现对象', text: '斗拱梁柱、舟船结构与人群尺度' }
    ],
    guide: '沿标尺横卷，按编号逐组读取建筑。'
  },
  {
    id: 'animal',
    name: '走兽画',
    pinyin: 'ZOU SHOU HUA',
    layout: 'album',
    epithet: '毛麟亦有情',
    intro:
      '走兽画以牛马畜兽为专工，唐代韩滉《五牛图》、韩幹画马皆属此科。',
    viewing: [
      { label: '题材', text: '牛马、畜兽与祥瑞' },
      { label: '构图', text: '多为横卷并列，逐头写神' },
      { label: '表现对象', text: '筋骨皮肉、动态与性情' }
    ],
    emptyNote: '该画科藏品尚在编目著录中，当前库内暂无可展作品。分类入口保留，待数据回补后自动生效。'
  }
]

export const subjectIds = subjects.map((subject) => subject.id)
const subjectIdSet = new Set(subjectIds)

export function getSubject(subjectId) {
  return subjects.find((subject) => subject.id === subjectId) ?? null
}

/**
 * 取一件作品在某个画科语境下的观察点。
 * 多重归类的作品可在 subjectViews 中给出不同观察点；
 * 缺省回落到作品的通用字段，避免在作品记录里复制整段数据。
 */
export function getSubjectView(artwork, subjectId) {
  const contextual = artwork.subjectViews?.[subjectId]
  return {
    matter: contextual?.matter ?? artwork.matter ?? null,
    composition: contextual?.composition ?? artwork.composition ?? null,
    focus: contextual?.focus ?? artwork.focus ?? null
  }
}

/**
 * 由作品集合反向构建“画科 -> 作品ID[]”的索引。
 * 索引保存的是 ID 而不是作品对象，保证作品只有一份事实来源。
 */
export function buildTaxonomy(artworkRows) {
  const idsBySubject = new Map(subjects.map((subject) => [subject.id, []]))
  const warnings = []
  const seenArtworkIds = new Set()

  for (const artwork of artworkRows) {
    if (!artwork || typeof artwork.id !== 'string') {
      warnings.push({ type: 'invalid-artwork', message: '存在缺少 ID 的作品记录，已跳过。' })
      continue
    }
    if (seenArtworkIds.has(artwork.id)) {
      warnings.push({ type: 'duplicate-artwork', artworkId: artwork.id, message: `作品 ID「${artwork.id}」重复。` })
      continue
    }
    seenArtworkIds.add(artwork.id)

    for (const subjectId of new Set(artwork.subjectIds ?? [])) {
      const bucket = idsBySubject.get(subjectId)
      if (bucket) bucket.push(artwork.id)
      else warnings.push({ type: 'unknown-subject', artworkId: artwork.id, subjectId, message: `作品「${artwork.title ?? artwork.id}」引用了不存在的画科「${subjectId}」。` })
    }

    if (!artwork.subjectIds?.length) continue
    const missing = []
    if (artwork.artist == null) missing.push('作者')
    if (artwork.year == null) missing.push('年代')
    if (artwork.image == null && artwork.art == null) missing.push('图像')
    if (missing.length) {
      warnings.push({ type: 'missing-field', artworkId: artwork.id, fields: missing, message: `作品「${artwork.title ?? artwork.id}」缺少：${missing.join('、')}。` })
    }
  }

  const counts = Object.fromEntries(subjects.map((subject) => [subject.id, idsBySubject.get(subject.id).length]))
  const multiClassified = [...seenArtworkIds]
    .map((id) => artworkRows.find((row) => row.id === id))
    .filter((artwork) => new Set(artwork.subjectIds ?? []).size > 1)
    .map((artwork) => ({ artworkId: artwork.id, subjectIds: [...new Set(artwork.subjectIds)].filter((id) => subjectIdSet.has(id)) }))

  return { idsBySubject, counts, warnings, multiClassified, totalArtworks: seenArtworkIds.size }
}

/** 取某画科下的作品对象（由 ID 关联实时解析，不复制数据）。 */
export function selectArtworksBySubject(artworkRows, taxonomy, subjectId, artworkById) {
  const ids = taxonomy.idsBySubject.get(subjectId)
  if (!ids) return []
  const lookup = artworkById ?? new Map(artworkRows.map((row) => [row.id, row]))
  return ids
    .map((id) => lookup.get(id))
    .filter(Boolean)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}

export function getArtworkSubjects(artwork) {
  return (artwork.subjectIds ?? []).map(getSubject).filter(Boolean)
}
