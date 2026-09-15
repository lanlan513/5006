// 章法布局与度量引擎：纯函数，不依赖 React。
//
// layoutComposition(work, comp)  把章法参数展开为纸面坐标（正文纵列、落款、印章）。
// analyzeComposition(work, comp, layout)  从布局计算实时指标：
//   视觉重心、空白比例、四边密度、密度网格（热力用）、失衡预警、平衡指数。
//
// 所有坐标使用纸面像素（work.paper 定义的画幅），元素位置以「中心点」为准。

// 墨量模型：单字墨面积 ≈ 字径² × 覆盖率；印章为白文印，红底覆盖率更高，
// 且朱砂色在视觉上更「跳」，给印章额外视觉权重。
const CHAR_INK_RATIO = 0.42
const SEAL_INK_RATIO = 0.6
const SEAL_SALIENCE = 1.3

// 传统章法的理想重心：几何中心略偏上（宁上勿下）。
export const IDEAL_CENTER = { nx: 0.5, ny: 0.47 }

export const GRID_SIZE = 26

/** 正文纵排布局：列从右往左，字在列内自上而下。 */
export function layoutComposition(work, comp) {
  const { w, h } = work.paper
  const { fontSize, charGap, colGap } = comp
  const margin = {
    t: comp.margins.t * h,
    r: comp.margins.r * w,
    b: comp.margins.b * h,
    l: comp.margins.l * w
  }
  const pitchY = fontSize * (1 + charGap)
  const pitchX = fontSize * (1 + colGap)
  const innerTop = margin.t
  const innerBottom = h - margin.b
  const innerRight = w - margin.r
  const innerLeft = margin.l
  const innerH = innerBottom - innerTop

  const rows = Math.max(1, Math.floor((innerH - fontSize) / pitchY) + 1)
  const chars = [...work.text]
  const cols = Math.ceil(chars.length / rows)
  const overflow = rows * pitchY > innerH + 0.001 || (cols - 1) * pitchX + fontSize > innerRight - innerLeft + 0.001

  const bodyChars = []
  for (let i = 0; i < chars.length; i += 1) {
    const col = Math.floor(i / rows)
    const row = i % rows
    bodyChars.push({
      char: chars[i],
      index: i,
      col,
      row,
      x: innerRight - fontSize / 2 - col * pitchX,
      y: innerTop + fontSize / 2 + row * pitchY
    })
  }
  const bodyBBox = bboxOf(bodyChars, fontSize)

  // 落款：单列小字，(x, y) 为首字中心的纸面比例。
  const insFont = fontSize * comp.inscription.scale
  const insPitch = insFont * 1.18
  const insChars = [...work.inscriptionText].map((char, i) => ({
    char,
    x: comp.inscription.x * w,
    y: comp.inscription.y * h + i * insPitch
  }))
  const insBBox = bboxOf(insChars, insFont)

  const seals = comp.seals.map((seal) => ({
    ...seal,
    px: seal.x * w,
    py: seal.y * h
  }))

  return {
    paper: { w, h },
    margin,
    fontSize,
    insFont,
    pitchX,
    pitchY,
    insPitch,
    rows,
    cols,
    overflow,
    bodyChars,
    bodyBBox,
    insChars,
    insBBox,
    seals
  }
}

function bboxOf(chars, size) {
  if (!chars.length) return null
  const half = size / 2
  return {
    x0: Math.min(...chars.map((c) => c.x)) - half,
    x1: Math.max(...chars.map((c) => c.x)) + half,
    y0: Math.min(...chars.map((c) => c.y)) - half,
    y1: Math.max(...chars.map((c) => c.y)) + half
  }
}

/**
 * 实时指标：视觉重心 / 空白比例 / 四边密度 / 密度网格 / 预警。
 */
export function analyzeComposition(work, comp, layout) {
  const { w, h } = layout.paper
  const elements = []

  for (const c of layout.bodyChars) {
    elements.push({ x: c.x, y: c.y, size: layout.fontSize, ink: layout.fontSize ** 2 * CHAR_INK_RATIO, salience: 1 })
  }
  for (const c of layout.insChars) {
    elements.push({ x: c.x, y: c.y, size: layout.insFont, ink: layout.insFont ** 2 * CHAR_INK_RATIO, salience: 1 })
  }
  for (const s of layout.seals) {
    elements.push({ x: s.px, y: s.py, size: s.size, ink: s.size ** 2 * SEAL_INK_RATIO, salience: SEAL_SALIENCE })
  }

  // ---- 视觉重心（墨量 × 视觉权重加权） ----
  let massSum = 0
  let mx = 0
  let my = 0
  let inkArea = 0
  for (const el of elements) {
    const mass = el.ink * el.salience
    massSum += mass
    mx += el.x * mass
    my += el.y * mass
    inkArea += el.ink
  }
  const centroid = massSum > 0 ? { x: mx / massSum, y: my / massSum } : { x: w / 2, y: h / 2 }
  const cnx = centroid.x / w
  const cny = centroid.y / h
  const devX = cnx - IDEAL_CENTER.nx
  const devY = cny - IDEAL_CENTER.ny
  const deviation = Math.hypot(devX, devY)

  // ---- 空白比例 ----
  const blankRatio = Math.max(0, Math.min(1, 1 - inkArea / (w * h)))

  // ---- 密度网格（热力图与边界密度共用） ----
  const grid = new Float32Array(GRID_SIZE * GRID_SIZE)
  const cellW = w / GRID_SIZE
  const cellH = h / GRID_SIZE
  for (const el of elements) {
    const half = el.size / 2
    const gx0 = Math.max(0, Math.floor((el.x - half) / cellW))
    const gx1 = Math.min(GRID_SIZE - 1, Math.floor((el.x + half) / cellW))
    const gy0 = Math.max(0, Math.floor((el.y - half) / cellH))
    const gy1 = Math.min(GRID_SIZE - 1, Math.floor((el.y + half) / cellH))
    const cells = (gx1 - gx0 + 1) * (gy1 - gy0 + 1)
    const per = el.ink / cells
    for (let gy = gy0; gy <= gy1; gy += 1) {
      for (let gx = gx0; gx <= gx1; gx += 1) {
        grid[gy * GRID_SIZE + gx] += per
      }
    }
  }
  // 网格值归一为「墨覆盖率」：cell 墨面积 / cell 面积
  const cellArea = cellW * cellH
  for (let i = 0; i < grid.length; i += 1) grid[i] /= cellArea

  // ---- 四边密度：最外两格带的平均覆盖率 ----
  const band = 2
  const edgeMean = (indices) => indices.reduce((sum, i) => sum + grid[i], 0) / indices.length
  const topIdx = []
  const bottomIdx = []
  const leftIdx = []
  const rightIdx = []
  for (let gy = 0; gy < GRID_SIZE; gy += 1) {
    for (let gx = 0; gx < GRID_SIZE; gx += 1) {
      const i = gy * GRID_SIZE + gx
      if (gy < band) topIdx.push(i)
      if (gy >= GRID_SIZE - band) bottomIdx.push(i)
      if (gx < band) leftIdx.push(i)
      if (gx >= GRID_SIZE - band) rightIdx.push(i)
    }
  }
  // 覆盖率 → 0..1 密度读数（0.45 覆盖率视为「满」）
  const norm = (v) => Math.min(1, v / 0.45)
  const boundary = {
    top: norm(edgeMean(topIdx)),
    right: norm(edgeMean(rightIdx)),
    bottom: norm(edgeMean(bottomIdx)),
    left: norm(edgeMean(leftIdx))
  }

  // ---- 失衡预警 ----
  const warnings = []
  const dir = []
  if (devX < -0.012) dir.push('左')
  if (devX > 0.012) dir.push('右')
  if (devY < -0.012) dir.push('上')
  if (devY > 0.012) dir.push('下')
  const dirText = dir.length ? `偏${dir.join('')}` : '偏移'
  if (deviation > 0.09) warnings.push({ level: 2, key: 'centroid', text: `重心${dirText}过甚，章法失衡` })
  else if (deviation > 0.05) warnings.push({ level: 1, key: 'centroid', text: `重心${dirText}，行气微倾` })

  // 空白比例的阈值按真实章法标定：手卷/立轴的墨覆盖率通常 6%–14%，
  // 即空白比例约 0.86–0.94；越出此带才提示疏密问题。
  if (blankRatio < 0.72) warnings.push({ level: 2, key: 'blank', text: '墨色壅塞，空白严重不足' })
  else if (blankRatio < 0.8) warnings.push({ level: 1, key: 'blank', text: '布白偏紧，透气不足' })
  else if (blankRatio > 0.972) warnings.push({ level: 2, key: 'blank', text: '布白过空，墨阵涣散' })
  else if (blankRatio > 0.955) warnings.push({ level: 1, key: 'blank', text: '布白偏疏，字势孤单' })

  const edgeNames = { top: '上', right: '右', bottom: '下', left: '左' }
  for (const [edge, value] of Object.entries(boundary)) {
    if (value > 0.72) warnings.push({ level: 2, key: `edge-${edge}`, text: `${edgeNames[edge]}边墨气外溢，逼塞纸边` })
    else if (value > 0.5) warnings.push({ level: 1, key: `edge-${edge}`, text: `${edgeNames[edge]}边偏紧，留白受侵` })
  }

  if (layout.overflow) warnings.push({ level: 2, key: 'overflow', text: '正文溢出留白边界，字径或行数需收' })

  for (const seal of layout.seals) {
    const half = seal.size / 2
    if (seal.px - half < 0 || seal.px + half > w || seal.py - half < 0 || seal.py + half > h) {
      warnings.push({ level: 1, key: `seal-out-${seal.id}`, text: '印章越出纸面' })
    }
    if (
      layout.bodyBBox &&
      seal.px + half > layout.bodyBBox.x0 &&
      seal.px - half < layout.bodyBBox.x1 &&
      seal.py + half > layout.bodyBBox.y0 &&
      seal.py - half < layout.bodyBBox.y1
    ) {
      warnings.push({ level: 1, key: `seal-body-${seal.id}`, text: '印章压占正文，慎防喧宾夺主' })
    }
  }

  if (layout.bodyBBox && layout.insChars.length) {
    const insBottom = layout.insBBox.y1
    if (insBottom > layout.bodyBBox.y1 + layout.fontSize * 0.6) {
      warnings.push({ level: 1, key: 'ins-low', text: '落款低于正文脚，气势下坠' })
    }
  }

  // ---- 平衡指数 ----
  const penalty = warnings.reduce((sum, item) => sum + (item.level === 2 ? 14 : 6), 0)
  const balanceScore = Math.max(0, Math.min(100, Math.round(100 - penalty - deviation * 120)))
  const balanceLabel = balanceScore >= 85 ? '沉稳' : balanceScore >= 65 ? '微倾' : balanceScore >= 45 ? '欹侧' : '失衡'

  return {
    centroid: { x: centroid.x, y: centroid.y, nx: cnx, ny: cny },
    ideal: { x: IDEAL_CENTER.nx * w, y: IDEAL_CENTER.ny * h },
    deviation: { x: devX, y: devY, dist: deviation },
    blankRatio,
    boundary,
    grid,
    gridSize: GRID_SIZE,
    warnings,
    balanceScore,
    balanceLabel,
    maxLevel: warnings.reduce((max, item) => Math.max(max, item.level), 0)
  }
}
