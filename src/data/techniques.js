/**
 * 表现技法分类法（techniques）
 * ----------------------------
 * 与画科分类法（taxonomy.js）平行的第二套关系数据：
 * 画科回答“画了什么”（人物 / 山水 / 花鸟 / 界画），
 * 技法回答“怎么画”（工笔 / 写意 / 没骨）。
 *
 * 作品记录仍是唯一事实来源：作品以 techniqueIds: string[] 指向技法，
 * 分类结果由 buildTechniqueIndex() 运行时反向构建，索引只持有作品 ID。
 * 一件作品可兼属多种技法（如《双喜图》兼工带写 → ['gongbi','xieyi']），
 * 作品记录只有一份，不为比较页复制任何数据。
 *
 * 比较维度（dimensions）是本页的信息骨架：不再有“题材 / 构图 / 表现对象”，
 * 而是沿“用线、运笔、墨色、设色、程序、气息”逐项对照两种画法。
 */

export const TECHNIQUE_DIMENSIONS = [
  {
    id: 'line',
    name: '用线',
    axis: '勾线立骨 ↔ 点染无骨',
    gongbi: '双钩细线先立骨架，线匀细、起止收束清楚。',
    xieyi: '线面合一，中锋侧锋互用，一笔中可见提按速度。',
    mogu: '几乎不用墨线，轮廓藏在色与色、水与色的相接处。'
  },
  {
    id: 'brush',
    name: '运笔',
    axis: '静、匀、收 ↔ 动、变、放',
    gongbi: '行笔慢而稳，多遍完成，笔痕被刻意隐藏。',
    xieyi: '行笔快、动作大，提按顿挫与飞白都留在纸上。',
    mogu: '点染为主，一笔落纸即定浓淡向背，落笔不可改。'
  },
  {
    id: 'ink',
    name: '墨色',
    axis: '层次渲染 ↔ 墨分五色',
    gongbi: '以淡墨多次分染，明暗渐次加深。',
    xieyi: '蘸墨一次写出浓淡干湿，泼墨、破墨、积墨并用。',
    mogu: '以彩色代替墨色，水的多少直接决定深浅。'
  },
  {
    id: 'color',
    name: '设色',
    axis: '重彩薄罩 ↔ 水墨为上',
    gongbi: '三矾九染：石色矿彩层层薄罩，厚而不腻。',
    xieyi: '多为浅绛淡彩或纯水墨，颜色让位于笔墨。',
    mogu: '纯以彩色图之：一支笔蘸足浓淡颜色，点写即有向背。'
  },
  {
    id: 'process',
    name: '作画程序',
    axis: '九朽一罢 ↔ 一气呵成',
    gongbi: '起稿—落墨—分染—罩色—提线，工序分明、可反复修改。',
    xieyi: '意在笔先，落墨直写，多在生宣上趁势完成。',
    mogu: '不用先勾墨稿，以水色渍染、叠色成形，近写意处在于不可改。'
  },
  {
    id: 'spirit',
    name: '气息',
    axis: '格物精微 ↔ ' + '写心抒怀',
    gongbi: '院体精神：格物、写生、形神兼备，重“状物”。',
    xieyi: '文人精神：以书入画、以画寄兴，重“写心”。',
    mogu: '兼工写之间：状物精微而无刻画之迹，清雅而有生趣。'
  }
]

export const techniques = [
  {
    id: 'gongbi',
    name: '工笔',
    pinyin: 'GONG BI',
    char: '工',
    epithet: '三矾九染 · 以线立骨',
    intro:
      '工笔是“先立骨、再敷肉”的画法：先以匀细墨线双钩轮廓，再以淡墨与颜色多遍分染、罩染，每遍极薄，层层叠到厚重。它重程序、重格物，院体花鸟与唐代人物是其典范。看工笔要近看：看线是否匀挺、看色与线的咬合、看反复渲染出的质感。',
    method: ['双钩白描立形', '淡墨层层分染', '矿彩薄罩、三矾九染', '熟绢熟纸，可反复修改'],
    watch: '放大后盯住轮廓线与羽、纱、花瓣的边缘——形是被“勾”出来的。',
    accent: '#c99e74'
  },
  {
    id: 'xieyi',
    name: '写意',
    pinyin: 'XIE YI',
    char: '写',
    epithet: '以书入画 · 意在笔先',
    intro:
      '写意把运笔动作本身推到台前：一笔下去，墨的浓淡干湿、笔的提按顿挫全部留在纸上，无法修改。皴法、泼墨、减笔都是写意的语言——斧劈斫出石质、披麻写出土坡、泼墨成形、减笔传神。看写意要看“动作”：一笔的速度、水分和去向。',
    method: ['中锋侧锋互用，线面合一', '墨分五色，泼墨破墨', '以书法笔意入画', '生宣一笔定形，不可涂改'],
    watch: '放大后看单个笔触的边缘——飞白、水痕、墨色渐变都是一次性运笔的证据。',
    accent: '#9fb0a0'
  },
  {
    id: 'mogu',
    name: '没骨',
    pinyin: 'MO GU',
    char: '没',
    epithet: '不用墨笔 · 直以彩色图之',
    intro:
      '“没骨”是不以墨线立骨的画法。传为北宋徐崇嗣所创，《梦溪笔谈》称其画“全无笔墨，惟用五彩布成”；清代恽寿平复兴此法，一笔蘸足浓淡颜色直接点写花瓣，枝叶以水色趁湿相接。它介于工写之间：有工笔的精微，却没有勾勒的痕迹。',
    method: ['不用墨线勾勒', '一笔蘸浓淡色，点染成形', '水色趁湿接染', '骨藏于色彩相接之处'],
    watch: '放大后寻找“线消失的地方”——形体是被颜色和水渍托出来的。',
    accent: '#d28fa3'
  }
]

export const techniqueIds = techniques.map((technique) => technique.id)
const techniqueIdSet = new Set(techniqueIds)

export function getTechnique(id) {
  return techniques.find((technique) => technique.id === id) ?? null
}

export function getDimensionRows(leftId, rightId) {
  return TECHNIQUE_DIMENSIONS.map((dimension) => ({
    ...dimension,
    left: dimension[leftId],
    right: dimension[rightId]
  }))
}

/**
 * 由作品集合反向构建“技法 -> 作品ID[]”索引。
 * 与 buildTaxonomy 同构：只持 ID，不复制作品；同时产出计数、
 * 多重技法作品清单与悬空技法引用告警。
 */
export function buildTechniqueIndex(artworkRows) {
  const idsByTechnique = new Map(techniques.map((technique) => [technique.id, []]))
  const warnings = []
  const seen = new Set()

  for (const artwork of artworkRows ?? []) {
    if (!artwork || typeof artwork.id !== 'string') {
      warnings.push({ type: 'invalid-artwork', message: '存在缺少 ID 的作品记录，已跳过。' })
      continue
    }
    if (seen.has(artwork.id)) {
      warnings.push({ type: 'duplicate-artwork', artworkId: artwork.id, message: `作品 ID「${artwork.id}」重复。` })
      continue
    }
    seen.add(artwork.id)

    for (const techniqueId of new Set(artwork.techniqueIds ?? [])) {
      const bucket = idsByTechnique.get(techniqueId)
      if (bucket) bucket.push(artwork.id)
      else {
        warnings.push({
          type: 'unknown-technique',
          artworkId: artwork.id,
          techniqueId,
          message: `作品「${artwork.title ?? artwork.id}」引用了不存在的技法「${techniqueId}」。`
        })
      }
    }
  }

  const counts = Object.fromEntries(techniques.map((t) => [t.id, idsByTechnique.get(t.id).length]))
  const multiTechnique = [...seen]
    .map((id) => artworkRows.find((row) => row.id === id))
    .filter((artwork) => new Set(artwork.techniqueIds ?? []).size > 1)
    .map((artwork) => ({ artworkId: artwork.id, techniqueIds: [...new Set(artwork.techniqueIds)].filter((id) => techniqueIdSet.has(id)) }))

  return { idsByTechnique, counts, warnings, multiTechnique, totalTagged: [...idsByTechnique.values()].reduce((n, ids) => n + ids.length, 0) }
}

/** 由 ID 关系实时解析某技法下的作品对象（作品数据不复制）。 */
export function selectArtworksByTechnique(artworkRows, index, techniqueId, artworkById) {
  const ids = index.idsByTechnique.get(techniqueId)
  if (!ids) return []
  const lookup = artworkById ?? new Map(artworkRows.map((row) => [row.id, row]))
  return ids.map((id) => lookup.get(id)).filter(Boolean).sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
}

/**
 * 取一件作品在某技法语境下的笔墨内容。
 * 笔墨热点可按技法给出不同版本（techniqueDetails），缺省使用通用 details。
 */
export function getTechniqueView(artwork, techniqueId) {
  const contextual = artwork.techniqueViews?.[techniqueId]
  return {
    brushNote: contextual?.brushNote ?? artwork.brushNote ?? null,
    details: contextual?.details ?? artwork.details ?? []
  }
}

/** 取作品在两个技法语境下都能对上的热点（按 label 匹配），用于比较页联动。 */
export function getSharedDetails(artworkA, artworkB, techniqueA, techniqueB) {
  const a = getTechniqueView(artworkA, techniqueA).details
  const b = getTechniqueView(artworkB, techniqueB).details
  const bByLabel = new Map(b.map((detail) => [detail.label, detail]))
  return a
    .map((detail) => ({ left: detail, right: bByLabel.get(detail.label) ?? null }))
    .filter((pair) => pair.right)
}

export function getArtworkTechniques(artwork) {
  return (artwork.techniqueIds ?? []).map(getTechnique).filter(Boolean)
}
