/**
 * 本地示意画生成器
 * ----------------
 * 根据作品的 art 描述符生成一幅风格化的水墨/青绿 SVG（data URI）。
 * 用途：
 *  1. 离线与无外链环境下仍能观察题材、构图与表现对象；
 *  2. 同一件多分类作品始终由同一份描述符生成，不会为分类各存一张图；
 *  3. 描述符缺失（art 与 image 都为空）时由组件进入“图像缺失”状态。
 * 生成结果以作品 ID 为键缓存，保证同 ID 多次引用拿到的是同一引用。
 */

const INK = ['#1d201c', '#2b2f2a', '#3d433c', '#545a50', '#6f7469', '#8b8f84', '#a9aca0', '#c6c8bc', '#dedccd']
const BG = { ink: '#efece3', bluegreen: '#eaf0ea', light: '#f2f0e8', color: '#f3ede2' }

function hashSeed(text) {
  let h = 2166136261
  for (let i = 0; i < String(text).length; i += 1) {
    h ^= String(text).charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rng(seedText) {
  let s = hashSeed(seedText) || 1
  return () => {
    s = (Math.imul(s, 1664525) + 1013904273) >>> 0
    return s / 4294967296
  }
}

const W = 900
const dims = {
  figure: [900, 470],
  landscape: [620, 880],
  flowerbird: [720, 720],
  jiehua: [980, 560]
}

/**
 * 作品示意画的自然像素尺寸（与生成器 viewBox 一致）。
 * 比较浏览器需要以“图片自身坐标”定位热点，故统一从此取尺寸与纵横比。
 */
export function artworkNaturalSize(artwork) {
  const art = artwork?.art
  if (!art) return null
  if (art.kind === 'flowerbird' && art.format === 'hanging') return { width: 620, height: 880 }
  const pair = dims[art.kind] ?? dims.figure
  return { width: pair[0], height: pair[1] }
}

/** 比较视口内 contain 适配后的 CSS 尺寸（box 已固定，图片按短边居中）。 */
export function containSize(natural, box) {
  if (!natural) return { width: box.width, height: box.height }
  const scale = Math.min(box.width / natural.width, box.height / natural.height)
  return { width: natural.width * scale, height: natural.height * scale }
}

function ridge(rand, x0, x1, baseY, amp, points = 7) {
  const step = (x1 - x0) / points
  let path = `M ${x0.toFixed(1)} ${baseY.toFixed(1)}`
  for (let i = 0; i < points; i += 1) {
    const cx = x0 + step * (i + 0.5)
    const cy = baseY - rand() * amp - amp * 0.25
    const x = x0 + step * (i + 1)
    const y = baseY - rand() * amp * 0.8
    path += ` Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return path
}

function tree(rand, x, y, scale = 1, inkOnly = false) {
  const trunk = `<path d="M ${x} ${y} q ${3 * scale} -${34 * scale} ${-2 * scale} -${62 * scale}" stroke="${INK[1]}" stroke-width="${2.4 * scale}" fill="none" stroke-linecap="round"/>`
  let leaves = ''
  for (let i = 0; i < 9; i += 1) {
    const a = (i / 9) * Math.PI * 2
    const dx = Math.cos(a) * (16 + rand() * 8) * scale
    const dy = -62 * scale + Math.sin(a) * (12 + rand() * 6) * scale
    leaves += `<circle cx="${(x + dx).toFixed(1)}" cy="${(y + dy).toFixed(1)}" r="${(5 + rand() * 4) * scale}" fill="${inkOnly ? INK[4 + Math.floor(rand() * 3)] : '#5d7557'}" opacity="${0.5 + rand() * 0.4}"/>`
  }
  return trunk + leaves
}

function human(x, ground, scale, color = INK[1], pose = 'stand') {
  const s = scale
  const body = pose === 'bow'
    ? `<path d="M ${x} ${ground - 26 * s} q 8 ${8 * s} 2 ${18 * s}" stroke="${color}" stroke-width="${2.2 * s}" fill="none" stroke-linecap="round"/>`
    : `<path d="M ${x} ${ground - 24 * s} l 0 ${18 * s} M ${x} ${ground - 14 * s} l -${5 * s} ${8 * s} M ${x} ${ground - 14 * s} l ${5 * s} ${8 * s}" stroke="${color}" stroke-width="${2 * s}" fill="none" stroke-linecap="round"/>`
  const head = `<circle cx="${x}" cy="${ground - 31 * s}" r="${4.2 * s}" fill="${color}"/>`
  const robe = `<path d="M ${x - 8 * s} ${ground - 6 * s} q ${8 * s} ${7 * s} ${16 * s} 0" fill="${color}" opacity="0.12"/>`
  return robe + body + head
}

function seal(x, y, size = 34, char = '藏') {
  return `<g><rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#a8412f" opacity="0.92"/>
  <text x="${x + size / 2}" y="${y + size / 2 + size * 0.32}" text-anchor="middle" font-family="serif" font-size="${size * 0.58}" fill="#f3ead8">${char}</text></g>`
}

function paintLandscape(art, rand, id) {
  const [, h] = dims.landscape
  const pal = art.palette === 'bluegreen'
    ? { far: '#9db9a4', mid: '#5f8f76', near: '#3f7158', accent: '#c98d4e', bg: BG.bluegreen }
    : art.palette === 'light'
      ? { far: INK[6], mid: INK[4], near: INK[2], accent: INK[5], bg: BG.light }
      : { far: INK[6], mid: INK[4], near: INK[1], accent: INK[5], bg: BG.ink }
  let inner = ''

  // 远景山
  inner += `<path d="${ridge(rand, -40, 660, 250, 120, 6)} L 660 260 L -40 260 Z" fill="${pal.far}" opacity="0.6"/>`
  inner += `<path d="${ridge(rand, -40, 660, 300, 80, 7)} L 660 310 L -40 310 Z" fill="${pal.mid}" opacity="0.7"/>`

  if (art.composition === 'high') {
    // 高远：巨峰压顶
    inner += `<path d="M 70 ${h - 220} Q 150 180 250 250 Q 330 150 430 240 Q 500 200 560 ${h - 230} L 560 ${h - 60} L 70 ${h - 60} Z" fill="${pal.near}" opacity="0.92"/>`
    inner += `<path d="M 130 ${h - 200} Q 250 330 360 ${h - 210}" stroke="${pal.accent}" stroke-width="6" fill="none" opacity="0.5"/>`
    inner += `<rect x="296" y="420" width="10" height="150" fill="${INK[7]}" opacity="0.55"/>`
  } else if (art.composition === 'deep') {
    // 深远：层叠扭转
    inner += `<path d="M -30 ${h - 180} Q 140 330 280 380 Q 420 300 650 ${h - 190} L 650 ${h - 40} L -30 ${h - 40} Z" fill="${pal.near}" opacity="0.85"/>`
    inner += `<path d="M 40 ${h - 250} Q 220 430 420 460 Q 520 430 620 ${h - 250} L 620 ${h - 220} L 40 ${h - 220} Z" fill="${pal.mid}" opacity="0.8"/>`
    inner += `<path d="M 60 ${h - 320} Q 260 520 470 540 Q 560 520 600 ${h - 320} L 600 ${h - 300} L 60 ${h - 300} Z" fill="${pal.far}" opacity="0.7"/>`
    if (art.building) inner += pavilion(300, 470, 0.9)
  } else if (art.composition === 'corner') {
    // 边角：一侧山石，大片空
    inner += `<path d="M -30 ${h - 120} Q 120 480 250 520 Q 330 560 340 ${h - 60} L -30 ${h - 60} Z" fill="${pal.near}" opacity="0.9"/>`
    inner += `<path d="M 420 300 Q 520 250 660 300" stroke="${pal.far}" stroke-width="14" fill="none" opacity="0.5"/>`
    inner += tree(rand, 90, h - 120, 1.1)
  } else {
    // 平远：一河两岸
    inner += `<path d="M -40 ${h - 210} Q 180 ${h - 270} 660 ${h - 205} L 660 ${h - 150} L -40 ${h - 150} Z" fill="${pal.near}" opacity="0.55"/>`
    inner += `<path d="M -40 ${h - 90} Q 200 ${h - 130} 660 ${h - 95} L 660 ${h - 30} L -40 ${h - 30} Z" fill="${pal.near}"/>`
    inner += tree(rand, 120, h - 100, 1.2)
    inner += tree(rand, 210, h - 96, 0.9)
    inner += `<path d="M 250 ${h - 92} l 26 0 l -6 12 l -20 0 Z" fill="${INK[3]}" opacity="0.7"/>`
  }

  // 皴点
  for (let i = 0; i < 70; i += 1) {
    const x = 60 + rand() * 500
    const y = 330 + rand() * (h - 380)
    inner += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${1 + rand() * 2.2}" fill="${pal.near}" opacity="${0.12 + rand() * 0.25}"/>`
  }
  // 点景：舟 / 亭 / 人
  if (art.boats) {
    inner += `<path d="M 420 ${h - 250} q 34 -10 62 0 q -8 9 -31 9 q -24 0 -31 -9 Z" fill="${INK[2]}" opacity="0.85"/>`
    inner += human(452, h - 252, 0.7, INK[1])
  }
  inner += human(180, h - 92, 0.9, INK[1])
  inner += human(205, h - 94, 0.8, INK[2], 'bow')
  inner += seal(W - 120, h - 92, 34, '山')

  return frame(inner, pal.bg, dims.landscape, id)
}

function pavilion(x, y, s = 1) {
  return `<g stroke="${INK[2]}" stroke-width="${1.6 * s}" fill="none">
    <path d="M ${x - 34 * s} ${y - 30 * s} L ${x} ${y - 46 * s} L ${x + 34 * s} ${y - 30 * s} Z" fill="${INK[4]}" opacity="0.8"/>
    <line x1="${x - 24 * s}" y1="${y - 28 * s}" x2="${x - 24 * s}" y2="${y + 6 * s}"/>
    <line x1="${x + 24 * s}" y1="${y - 28 * s}" x2="${x + 24 * s}" y2="${y + 6 * s}"/>
    <line x1="${x - 28 * s}" y1="${y - 6 * s}" x2="${x + 28 * s}" y2="${y - 6 * s}"/>
  </g>`
}

function paintFigure(art, rand, id) {
  const [w, h] = dims.figure
  let inner = ''
  const isMural = art.scene === 'mural'
  const ground = h - 92

  if (isMural) {
    inner = `<rect x="0" y="0" width="${w}" height="${h}" fill="#c9a06e"/>`
    inner += `<path d="M 0 ${ground} q 220 -40 450 -10 t ${w} -20" stroke="#6f4a39" stroke-width="6" fill="none" opacity="0.6"/>`
    // 九色鹿
    inner += `<g><path d="M 560 ${ground - 26} q 40 -34 86 -4 l 14 -22 M 620 ${ground - 30} l 0 30 M 660 ${ground - 24} l 0 24" stroke="#3d2b22" stroke-width="3" fill="#e7d3ac"/><circle cx="556" cy="${ground - 34}" r="3" fill="#3d2b22"/></g>`
    for (let i = 0; i < 22; i += 1) {
      inner += `<circle cx="${580 + (i % 6) * 12}" cy="${ground - 44 + Math.floor(i / 6) * 12}" r="2.4" fill="#9c4a36" opacity="0.8"/>`
    }
  } else if (art.scene === 'procession') {
    // 风雪队列：斜向风带 + 人马
    for (let i = 0; i < 6; i += 1) {
      inner += `<path d="M -40 ${120 + i * 52} Q 300 ${80 + i * 48} 940 ${150 + i * 44}" stroke="${INK[7]}" stroke-width="3" fill="none" opacity="0.5"/>`
    }
    inner += `<path d="M 0 ${ground} L ${w} ${ground - 14}" stroke="${INK[3]}" stroke-width="3" opacity="0.5"/>`
  } else {
    // 室内/庭院：地平与屏风分段
    inner += `<path d="M 0 ${ground} L ${w} ${ground}" stroke="${INK[4]}" stroke-width="2"/>`
    const screens = art.props?.includes('screen') ? [150, 470, 760] : [300, 620]
    screens.forEach((sx) => {
      inner += `<rect x="${sx}" y="${ground - 180}" width="92" height="180" fill="${INK[8]}" stroke="${INK[5]}" stroke-width="1.5" opacity="0.9"/>`
      inner += `<path d="M ${sx + 16} ${ground - 150} q 30 -26 60 0 M ${sx + 16} ${ground - 100} q 30 30 60 0" stroke="${INK[6]}" stroke-width="1.6" fill="none"/>`
    })
  }

  // 人物队列：主大从小
  const figures = Math.min(art.figures ?? 4, 6)
  for (let i = 0; i < figures; i += 1) {
    const x = 110 + i * ((w - 220) / Math.max(figures - 1, 1)) + (rand() - 0.5) * 36
    const scale = (i === 0 ? 1.5 : 1.05 + rand() * 0.2) * (isMural ? 1.3 : 1)
    const robeColor = ['#8c3b34', '#3f5d52', '#7c6240', '#4c4f5e', INK[1], '#7a4654'][i % 6]
    inner += `<path d="M ${x - 13 * scale} ${ground - 30 * scale} q ${13 * scale} ${18 * scale} ${26 * scale} 0 L ${x + 10 * scale} ${ground - 2} L ${x - 10 * scale} ${ground - 2} Z" fill="${robeColor}" opacity="${isMural ? 0.9 : 0.82}"/>`
    inner += human(x, ground - 2, scale, isMural ? '#2c211a' : INK[0])
    if (art.props?.includes('fan') && i % 2 === 0) {
      inner += `<path d="M ${x + 8 * scale} ${ground - 26 * scale} q 12 ${-8 * scale} 16 6" stroke="${INK[2]}" stroke-width="1.6" fill="none"/>`
    }
  }

  // 道具点景
  if (art.props?.includes('boat')) {
    inner += `<path d="M 620 ${ground + 18} q 70 -16 130 0 q -12 12 -65 12 q -52 0 -65 -12 Z" fill="${INK[3]}"/>`
  }
  if (art.props?.includes('candle')) {
    inner += `<line x1="820" y1="${ground - 90}" x2="820" y2="${ground - 40}" stroke="${INK[3]}" stroke-width="3"/><circle cx="820" cy="${ground - 96}" r="6" fill="#d9a24b" opacity="0.9"/>`
  }
  if (art.props?.includes('flower')) {
    for (let i = 0; i < 5; i += 1) {
      inner += `<circle cx="${80 + i * 180}" cy="${ground + 6}" r="6" fill="#b06f78" opacity="0.7"/>`
    }
  }
  if (art.props?.includes('crane')) {
    inner += `<path d="M 700 ${ground - 10} q 30 -34 60 -6 M 706 ${ground - 30} q 12 -18 30 -22" stroke="${INK[2]}" stroke-width="2.4" fill="none"/><circle cx="738" cy="${ground - 53}" r="4" fill="#c0442f"/>`
  }
  if (art.props?.includes('horse')) {
    for (let i = 0; i < 3; i += 1) {
      const x = 240 + i * 230
      inner += `<path d="M ${x} ${ground - 34} q 34 -20 64 -2 l 10 -18 M ${x + 10} ${ground - 30} l -2 30 M ${x + 50} ${ground - 26} l 0 26" stroke="${INK[1]}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
    }
  }
  if (art.props?.includes('banner')) {
    inner += `<line x1="120" y1="${ground - 150}" x2="120" y2="${ground}" stroke="${INK[2]}" stroke-width="3"/><path d="M 120 ${ground - 146} q 30 4 40 18 l -40 8 Z" fill="#8c3b34" opacity="0.85"/>`
  }

  inner += seal(w - 86, 40, 32, '人')
  return frame(inner, isMural ? '#c9a06e' : BG.color, dims.figure, id)
}

function paintFlowerbird(art, rand, id) {
  const hanging = art.format === 'hanging'
  const [w, h] = hanging ? [620, 880] : dims.flowerbird
  const inkOnly = art.ink === true
  const mogu = art.mogu === true
  let inner = ''
  const stem = inkOnly ? INK[2] : '#6d5438'

  if (art.motif === 'grapes') {
    // 大写意立轴：泼墨葡萄叶 + 狂草藤梢，下半大片留白
    inner += `<path d="M ${w + 20} 40 Q 330 120 250 300 Q 200 400 300 470" stroke="${INK[1]}" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.85"/>`
    inner += `<path d="M ${w - 60} 90 Q 200 220 160 380" stroke="${INK[3]}" stroke-width="3" fill="none" stroke-linecap="round"/>`
    // 泼墨叶：饱墨一次泼出，边缘晕渗，不勾轮廓
    const leaves = [[300, 240, 95, INK[0], 0.9], [430, 320, 70, INK[1], 0.82], [200, 360, 62, INK[2], 0.8], [360, 150, 58, INK[2], 0.7]]
    leaves.forEach(([cx, cy, r, c, op]) => {
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2 + rand()
        inner += `<ellipse cx="${(cx + Math.cos(a) * r * 0.34).toFixed(0)}" cy="${(cy + Math.sin(a) * r * 0.3).toFixed(0)}" rx="${(r * 0.52).toFixed(0)}" ry="${(r * 0.34).toFixed(0)}" fill="${c}" opacity="${(op * (0.7 + rand() * 0.3)).toFixed(2)}" transform="rotate(${(a * 180 / Math.PI).toFixed(0)} ${cx} ${cy})"/>`
      }
    })
    // 葡萄：墨分五色，一笔一圈，浓淡一次成形
    const clusters = [[300, 330], [420, 400], [250, 440]]
    clusters.forEach(([cx, cy]) => {
      for (let i = 0; i < 9; i += 1) {
        const gx = cx + (rand() - 0.5) * 90
        const gy = cy + (rand() - 0.5) * 80
        const tone = INK[1 + Math.floor(rand() * 5)]
        inner += `<circle cx="${gx.toFixed(0)}" cy="${gy.toFixed(0)}" r="${(11 + rand() * 5).toFixed(1)}" fill="${tone}" opacity="${(0.62 + rand() * 0.34).toFixed(2)}"/>`
        inner += `<circle cx="${(gx - 3).toFixed(0)}" cy="${(gy - 3).toFixed(0)}" r="2.6" fill="${INK[7]}" opacity="0.5"/>`
      }
    })
    inner += seal(w - 74, h - 110, 32, '写')
  } else if (art.motif === 'heron') {
    // 八大减笔立轴：孤石、缩颈水鸟、一茎长荷，大面积留白
    const rock = `<path d="M 150 ${h - 210} Q 250 ${h - 262} 380 ${h - 224} Q 470 ${h - 196} 470 ${h - 176} L 140 ${h - 176} Z" fill="${INK[3]}" opacity="0.78"/>`
    inner += rock
    // 荷茎：长锋一笔贯穿
    inner += `<path d="M 430 ${h - 200} Q 424 ${h - 420} 400 ${h - 560}" stroke="${INK[2]}" stroke-width="5" fill="none" stroke-linecap="round"/>`
    inner += `<path d="M 330 ${h - 580} q 120 -34 160 30 q -80 46 -160 -30 Z" fill="${INK[4]}" opacity="0.75"/>`
    // 两只缩颈水鸟：三五个简练墨块
    ;[[250, h - 240], [340, h - 228]].forEach(([x, y], i) => {
      const s = i === 0 ? 1 : 0.82
      inner += `<ellipse cx="${x}" cy="${y}" rx="${34 * s}" ry="${30 * s}" fill="${INK[i ? 2 : 1]}" opacity="0.9"/>`
      inner += `<circle cx="${x + 16 * s}" cy="${y - 22 * s}" r="${13 * s}" fill="none" stroke="${INK[1]}" stroke-width="2.6"/>`
      inner += `<circle cx="${x + 20 * s}" cy="${y - 26 * s}" r="3.4" fill="${INK[0]}"/>`
      inner += `<path d="M ${x + 26 * s} ${y - 20 * s} l 18 ${4}" stroke="${INK[1]}" stroke-width="2.4"/>`
    })
    inner += seal(w - 78, h - 96, 32, '简')
  } else if (art.motif === 'peony') {
    // 没骨牡丹：直接以彩色点染成瓣，全程无墨线
    const px = 330
    const py = 270
    for (let ring = 3; ring >= 0; ring -= 1) {
      const count = 7 + ring * 3
      const rr = ring === 0 ? 0 : 26 + ring * 34
      for (let i = 0; i < count; i += 1) {
        const a = (i / count) * Math.PI * 2 + ring * 0.5
        const cx = px + Math.cos(a) * rr
        const cy = py + Math.sin(a) * rr * 0.86
        const light = ring >= 2
        const fill = light ? '#f0c2cf' : ['#d97e97', '#cf6685', '#e092a8'][i % 3]
        inner += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(30 - ring * 3).toFixed(0)}" ry="${(22 - ring * 2).toFixed(0)}" fill="${fill}" opacity="${light ? 0.82 : 0.9}" transform="rotate(${(a * 180 / Math.PI).toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`
      }
    }
    inner += `<ellipse cx="${px}" cy="${py}" rx="20" ry="16" fill="#c75d7c" opacity="0.92"/>`
    // 枝叶：水色趁湿相接，轮廓藏在颜色相接处
    ;[[470, 470, 96, 42, -18, '#6f9480'], [300, 540, 104, 44, 12, '#5d8270'], [520, 360, 70, 32, 30, '#7ba08c']].forEach(([cx, cy, rx, ry, rot, c]) => {
      inner += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c}" opacity="0.82" transform="rotate(${rot} ${cx} ${cy})"/>`
      inner += `<path d="M ${cx - rx * 0.5} ${cy} Q ${cx} ${cy + 8} ${cx + rx * 0.5} ${cy - 4}" stroke="${INK[4]}" stroke-width="1.4" fill="none" opacity="0.5"/>`
    })
    inner += seal(w - 86, h - 88, 32, '没')
  } else if (art.motif === 'insect') {
    // 没骨草虫：散点折枝，翼翅以薄色渍染、不见勾线
    const spots = [[220, 250, '#e3a9bd'], [480, 300, '#d8b77e'], [300, 470, '#cfa6b6']]
    spots.forEach(([cx, cy, fill], k) => {
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2
        inner += `<ellipse cx="${(cx + Math.cos(a) * 34).toFixed(0)}" cy="${(cy + Math.sin(a) * 30).toFixed(0)}" rx="26" ry="18" fill="${fill}" opacity="${0.66 + (k % 2) * 0.16}" transform="rotate(${(a * 180 / Math.PI).toFixed(0)} ${cx} ${cy})"/>`
      }
      inner += `<circle cx="${cx}" cy="${cy}" r="10" fill="#c9a05f" opacity="0.9"/>`
    })
    // 草虫：透明翼是颜色厚薄，而非勾出的线
    ;[[420, 480], [250, 560]].forEach(([cx, cy]) => {
      inner += `<ellipse cx="${cx - 16}" cy="${cy - 8}" rx="22" ry="9" fill="#9fb0b6" opacity="0.34" transform="rotate(-18 ${cx - 16} ${cy - 8})"/>`
      inner += `<ellipse cx="${cx + 16}" cy="${cy - 8}" rx="22" ry="9" fill="#9fb0b6" opacity="0.34" transform="rotate(18 ${cx + 16} ${cy - 8})"/>`
      inner += `<ellipse cx="${cx}" cy="${cy + 4}" rx="7" ry="18" fill="${INK[2]}" opacity="0.8"/>`
    })
    inner += `<path d="M 120 620 Q 360 560 620 640" stroke="#7a9076" stroke-width="5" fill="none" opacity="0.7" stroke-linecap="round"/>`
    inner += seal(w - 84, h - 86, 34, '骨')
  } else if (art.motif === 'lotus') {
    inner += `<ellipse cx="470" cy="520" rx="300" ry="90" fill="${inkOnly ? INK[6] : '#6f9480'}" opacity="0.55"/>`
    inner += `<ellipse cx="250" cy="560" rx="120" ry="40" fill="${inkOnly ? INK[5] : '#547d69'}" opacity="0.6"/>`
    inner += `<g>${petalLayer(360, 300, 130, inkOnly ? '#eceae2' : '#e7a9bd', inkOnly ? INK[2] : '#b25677')}</g>`
    inner += `<circle cx="360" cy="320" r="22" fill="${inkOnly ? INK[3] : '#d9a24b'}"/>`
  } else if (art.motif === 'crane') {
    inner = `<rect x="0" y="0" width="${w}" height="${h}" fill="${inkOnly ? BG.ink : '#dbe4ea'}"/>`
    inner += `<path d="M 0 470 L ${w} 470" stroke="${INK[4]}" stroke-width="2"/>`
    inner += pavilion(180, 470, 2.2)
    const cranes = [[230, 210, 1.15], [430, 150, 0.9], [560, 260, 1.05], [350, 300, 0.8], [640, 180, 0.7]]
    cranes.forEach(([cx, cy, s], i) => { inner += craneShape(cx, cy, s, INK[1 + (i % 3)]) })
  } else if (art.motif === 'plum') {
    inner += branchPath(rand, stem, true)
    for (let i = 0; i < 26; i += 1) {
      const bx = 120 + rand() * 520
      const by = 150 + rand() * 380
      inner += blossom(bx, by, 8 + rand() * 5, inkOnly ? INK[1] : INK[1], inkOnly ? '#f4f1e8' : '#efe2da', true)
    }
  } else if (art.motif === 'pheasant') {
    inner += branchPath(rand, stem, false)
    inner += blossom(560, 200, 26, inkOnly ? INK[3] : '#c98d4e', inkOnly ? '#f1eee5' : '#f3e7d6')
    inner += `<path d="M 380 470 q 70 -70 150 -20 q 30 18 10 60 q -90 30 -160 -10 Z" fill="${inkOnly ? INK[2] : '#b78a3e'}" opacity="0.92"/>`
    inner += `<path d="M 520 452 q 40 -30 70 -6 l -8 26 q -34 -2 -62 -14" fill="${inkOnly ? INK[4] : '#7a8b5b'}"/>`
    inner += `<circle cx="588" cy="442" r="13" fill="${INK[1]}"/><circle cx="592" cy="439" r="2.6" fill="#f3ead8"/>`
    inner += `<path d="M 600 446 l 20 4 l -20 8 Z" fill="#c0442f"/>`
    inner += butterfly(rand, 180, 220, inkOnly)
    inner += butterfly(rand, 240, 290, inkOnly)
  } else if (art.motif === 'magpie') {
    inner += `<path d="M 120 640 Q 260 250 620 180" stroke="${stem}" stroke-width="7" fill="none" stroke-linecap="round"/>`
    inner += `<path d="M 260 430 Q 430 330 590 360" stroke="${stem}" stroke-width="4" fill="none" stroke-linecap="round"/>`
    for (let i = 0; i < 40; i += 1) {
      const lx = 150 + rand() * 480
      const ly = 200 + rand() * 420
      inner += `<ellipse cx="${lx}" cy="${ly}" rx="3" ry="9" fill="${inkOnly ? INK[4] : '#8a8f5c'}" opacity="0.6" transform="rotate(${rand() * 60 - 30} ${lx} ${ly})"/>`
    }
    inner += birdShape(420, 330, 1.5, INK[0])
    inner += birdShape(560, 200, 1.2, INK[1])
    inner += `<path d="M 230 590 q 30 -18 64 0 q 14 22 -8 36 q -40 6 -56 -14 Z" fill="${inkOnly ? INK[3] : '#9c8a6b'}"/>`
    inner += `<circle cx="250" cy="600" r="3" fill="${INK[0]}"/><circle cx="280" cy="604" r="3" fill="${INK[0]}"/>`
  } else {
    // birds：写生珍禽散点
    const spots = [[180, 220, 1.1], [400, 180, 0.9], [580, 260, 1.2], [250, 470, 1.0], [520, 500, 0.85]]
    spots.forEach(([cx, cy, s], i) => {
      inner += birdShape(cx, cy + (i % 2) * 30, s, [INK[1], '#6b5238', '#46544c', INK[3], '#7a4654'][i % 5])
    })
    for (let i = 0; i < 8; i += 1) inner += butterfly(rand, 120 + rand() * 480, 120 + rand() * 440, inkOnly)
  }

  if (!['grapes', 'heron', 'peony', 'insect'].includes(art.motif)) inner += seal(w - 84, h - 86, 34, '花')
  return frame(inner, art.motif === 'crane' ? (inkOnly ? BG.ink : '#dbe4ea') : (mogu ? '#f4f0e6' : BG.color), [w, h], id)
}

function petalLayer(cx, cy, r, fill, stroke) {
  let out = ''
  for (let i = 0; i < 9; i += 1) {
    const a = (i / 9) * Math.PI * 2
    out += `<ellipse cx="${(cx + Math.cos(a) * r * 0.5).toFixed(1)}" cy="${(cy + Math.sin(a) * r * 0.5).toFixed(1)}" rx="${r * 0.3}" ry="${r * 0.55}" fill="${fill}" stroke="${stroke}" stroke-width="1.4" opacity="0.92" transform="rotate(${(a * 180) / Math.PI + 90} ${(cx + Math.cos(a) * r * 0.5).toFixed(1)} ${(cy + Math.sin(a) * r * 0.5).toFixed(1)})"/>`
  }
  return out
}

function blossom(x, y, r, stroke, fill, five = false) {
  const count = five ? 5 : 5
  let out = ''
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2 - Math.PI / 2
    out += `<circle cx="${(x + Math.cos(a) * r * 0.8).toFixed(1)}" cy="${(y + Math.sin(a) * r * 0.8).toFixed(1)}" r="${r * 0.62}" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>`
  }
  out += `<circle cx="${x}" cy="${y}" r="${r * 0.28}" fill="${stroke}"/>`
  return out
}

function branchPath(rand, color, dense) {
  let d = 'M 80 620'
  let x = 80
  let y = 620
  for (let i = 0; i < (dense ? 9 : 5); i += 1) {
    x += 90 + rand() * 40
    y -= 70 + rand() * 50
    d += ` Q ${x - 60} ${y + 30} ${x} ${y}`
  }
  return `<path d="${d}" stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round"/>`
}

function birdShape(x, y, s, color) {
  return `<g>
    <path d="M ${x} ${y} q 26 -20 52 -2 q 8 10 -4 18 q -30 8 -50 -6 Z" fill="${color}"/>
    <path d="M ${x + 30} ${y - 2} q 16 4 20 16 q -14 6 -26 -2 Z" fill="${INK[3]}" opacity="0.8"/>
    <circle cx="${x + 48}" cy="${y - 6}" r="6" fill="${color}"/>
    <circle cx="${x + 50}" cy="${y - 8}" r="1.8" fill="#f3ead8"/>
    <path d="M ${x + 54} ${y - 6} l 10 2 l -10 4 Z" fill="#c0442f"/>
    <path d="M ${x + 14} ${y + 14} l -2 16 M ${x + 34} ${y + 14} l 2 16" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>
  </g>`
}

function craneShape(x, y, s, color) {
  return `<g>
    <ellipse cx="${x}" cy="${y}" rx="${26 * s}" ry="${15 * s}" fill="#f4f1e8" stroke="${INK[2]}" stroke-width="1.5"/>
    <path d="M ${x + 14 * s} ${y - 8 * s} q ${16 * s} ${-26 * s} ${30 * s} ${-30 * s}" stroke="${INK[2]}" stroke-width="${3 * s}" fill="none" stroke-linecap="round"/>
    <circle cx="${x + 44 * s}" cy="${y - 38 * s}" r="${6 * s}" fill="#f4f1e8" stroke="${INK[2]}" stroke-width="1.4"/>
    <path d="M ${x + 49 * s} ${y - 38 * s} l ${14 * s} 2 l ${-14 * s} 5 Z" fill="#c0442f"/>
    <path d="M ${x - 8 * s} ${y + 12 * s} l ${-4 * s} ${26 * s} M ${x + 8 * s} ${y + 12 * s} l ${4 * s} ${26 * s}" stroke="${INK[2]}" stroke-width="${2.4 * s}"/>
    <circle cx="${x - 4 * s}" cy="${y - 2 * s}" r="${5 * s}" fill="#22251f"/>
  </g>`
}

function butterfly(rand, x, y, inkOnly) {
  const c = inkOnly ? INK[3] : ['#8c3b5a', '#3f5d52', '#b07b3e'][Math.floor(rand() * 3)]
  return `<g><path d="M ${x} ${y} q -12 -12 -20 -2 q 4 12 20 6 Z" fill="${c}" opacity="0.8"/><path d="M ${x} ${y} q 12 -12 20 -2 q -4 12 -20 6 Z" fill="${c}" opacity="0.8"/><line x1="${x}" y1="${y - 4}" x2="${x}" y2="${y + 8}" stroke="${INK[1]}" stroke-width="1.5"/></g>`
}

function paintJiehua(art, rand, id) {
  const [w, h] = dims.jiehua
  const green = art.bluegreen === true
  let inner = ''
  // 水面与标尺
  inner += `<path d="M 0 ${h - 110} L ${w} ${h - 110}" stroke="${INK[5]}" stroke-width="1.5"/>`
  for (let i = 0; i <= 20; i += 1) {
    const x = 40 + i * ((w - 80) / 20)
    inner += `<line x1="${x}" y1="${h - 110}" x2="${x}" y2="${h - 102}" stroke="${INK[4]}" stroke-width="1"/>`
    if (i % 4 === 0) inner += `<text x="${x}" y="${h - 86}" text-anchor="middle" font-size="11" fill="${INK[5]}" font-family="serif">${i * 5}</text>`
  }

  if (art.structure === 'bridge') {
    // 虹桥与街市
    inner += `<path d="M 60 ${h - 150} Q 490 ${h - 360} 920 ${h - 150}" stroke="${INK[2]}" stroke-width="10" fill="none"/>`
    inner += `<path d="M 60 ${h - 150} Q 490 ${h - 330} 920 ${h - 150}" stroke="${INK[4]}" stroke-width="3" fill="none"/>`
    for (let i = 1; i < 10; i += 1) {
      const t = i / 10
      const x = 60 + 860 * t
      const y = (h - 150) - Math.sin(Math.PI * t) * 190
      inner += `<line x1="${x}" y1="${y + 8}" x2="${x - 30}" y2="${h - 118}" stroke="${INK[3]}" stroke-width="2"/>`
    }
    // 桥身船
    inner += `<path d="M 380 ${h - 168} q 120 -20 230 0 q -14 22 -115 22 q -100 0 -115 -22 Z" fill="${INK[3]}"/>`
    for (let i = 0; i < Math.min(art.figures ?? 6, 8); i += 1) {
      inner += human(180 + i * 86 + rand() * 24, h - 150 - Math.sin(Math.PI * ((180 + i * 86 - 60) / 860)) * 190, 0.62, INK[0])
    }
    // 两岸屋宇
    ;[70, 800].forEach((bx) => {
      inner += jieBuilding(bx, h - 170, 1.1, green)
      inner += jieBuilding(bx + 120, h - 160, 0.9, green)
    })
  } else {
    // 宫苑 / 楼阁：层叠台榭
    const bases = [60, 280, 500, 720]
    bases.forEach((bx, i) => {
      const s = 1.1 - i * 0.07
      inner += jieBuilding(bx, h - 130 - (i % 2) * 30, s, green)
      if (i === 1 && art.structure === 'tower') {
        inner += jiePagoda(bx + 130, h - 150, green)
      }
    })
    // 连廊
    inner += `<path d="M 200 ${h - 196} L 300 ${h - 196} M 420 ${h - 188} L 520 ${h - 188} M 640 ${h - 206} L 740 ${h - 206}" stroke="${INK[3]}" stroke-width="14" opacity="0.8"/>`
    for (let i = 0; i < Math.min(art.figures ?? 4, 8); i += 1) {
      inner += human(120 + i * 100, h - 112, 0.6, INK[1])
    }
    if (art.structure === 'tower') {
      inner += `<path d="M 120 ${h - 150} q 80 -18 150 0 q -10 14 -75 14 q -64 0 -75 -14 Z" fill="${INK[3]}" opacity="0.85"/>`
    }
  }

  // 远山
  inner += `<path d="M -40 ${h - 220} Q 200 ${h - 330} 420 ${h - 250} T 1020 ${h - 230} L 1020 ${h - 110} L -40 ${h - 110} Z" fill="${green ? '#9db9a4' : INK[7]}" opacity="0.45"/>`
  inner += seal(w - 80, 36, 30, '界')
  return frame(inner, green ? BG.bluegreen : BG.light, dims.jiehua, id)
}

function jieBuilding(x, baseY, s, green) {
  const roof = green ? '#46685a' : INK[2]
  const wall = green ? '#dfe8df' : INK[8]
  return `<g stroke="${INK[2]}" stroke-width="${1.5 * s}">
    <path d="M ${x - 16 * s} ${baseY - 70 * s} L ${x} ${baseY - 92 * s} L ${x + 64 * s} ${baseY - 92 * s} L ${x + 80 * s} ${baseY - 70 * s} Z" fill="${roof}"/>
    <rect x="${x - 4 * s}" y="${baseY - 70 * s}" width="${72 * s}" height="${52 * s}" fill="${wall}"/>
    <line x1="${x + 20 * s}" y1="${baseY - 70 * s}" x2="${x + 20 * s}" y2="${baseY - 18 * s}"/>
    <line x1="${x + 44 * s}" y1="${baseY - 70 * s}" x2="${x + 44 * s}" y2="${baseY - 18 * s}"/>
    <line x1="${x - 4 * s}" y1="${baseY - 44 * s}" x2="${x + 68 * s}" y2="${baseY - 44 * s}"/>
    <rect x="${x - 10 * s}" y="${baseY - 18 * s}" width="${84 * s}" height="${7 * s}" fill="${roof}" stroke="none"/>
  </g>`
}

function jiePagoda(x, baseY, green) {
  let out = ''
  for (let i = 0; i < 3; i += 1) {
    const y = baseY - i * 52
    const inset = i * 10
    out += jieBuilding(x + inset, y, 0.8 - i * 0.06, green)
  }
  return out
}

function frame(inner, bg, [width, height], id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" data-art="${id}" font-family="'Noto Serif SC', serif">
  <defs><filter id="rough-${id}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.4 0 0 0 0 0.38 0 0 0 0 0.32 0 0 0 0.06 0"/></filter></defs>
  <rect width="${width}" height="${height}" fill="${bg}"/>
  <rect width="${width}" height="${height}" filter="url(#rough-${id})"/>
  <rect x="10" y="10" width="${width - 20}" height="${height - 20}" fill="none" stroke="${INK[5]}" stroke-width="1.2" opacity="0.55"/>
  ${inner}
  </svg>`
}

const cache = new Map()

/** 根据作品生成 data URI；art 描述符为空时返回 null（由 UI 显示“图像缺失”）。 */
export function paintingUri(artwork) {
  if (!artwork) return null
  if (cache.has(artwork.id)) return cache.get(artwork.id)
  const art = artwork.art ?? null
  if (!art) {
    cache.set(artwork.id, null)
    return null
  }
  const rand = rng(`${artwork.id}:${art.kind}:${JSON.stringify(art)}`)
  let svg
  if (art.kind === 'landscape') svg = paintLandscape(art, rand, artwork.id)
  else if (art.kind === 'flowerbird') svg = paintFlowerbird(art, rand, artwork.id)
  else if (art.kind === 'jiehua') svg = paintJiehua(art, rand, artwork.id)
  else svg = paintFigure(art, rand, artwork.id)
  const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  cache.set(artwork.id, uri)
  return uri
}

/** 统一的图像解析顺序：外链照片优先（可配置），缺省回落到本地示意画。 */
export function resolveArtworkImage(artwork, { preferLocal = true } = {}) {
  const local = paintingUri(artwork)
  const remote = typeof artwork.image === 'string' && artwork.image.length ? artwork.image : null
  if (!local && !remote) return null
  if (preferLocal) return local ?? remote
  return remote ?? local
}
