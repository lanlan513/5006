// 中国美术史视觉时间轴数据
// 每个时期包含：主流艺术形式、代表作品、材料与工艺变化、审美倾向
// yearStart / yearEnd 用于拖动时的连续年份插值（负数表示公元前）

export const timelineEras = [
  {
    id: 'xianqin',
    name: '先秦',
    glyph: '鼎',
    years: '约前 2100 — 前 221',
    yearStart: -2100,
    yearEnd: -221,
    palette: { from: '#22302a', to: '#0e1512', accent: '#c9a35f' },
    summary: '青铜与玉构筑起礼制的视觉秩序，艺术服务于祭祀、战争与权力。',
    forms: ['青铜礼器', '玉石雕刻', '漆器髹饰', '帛画与岩画'],
    works: [
      { title: '后母戊鼎', artist: '商 · 王室铸器' },
      { title: '四羊方尊', artist: '商 · 青铜铸造' },
      { title: '人物龙凤帛画', artist: '战国 · 楚墓出土' }
    ],
    materials: ['青铜范铸法成熟，形成「六齐」合金配比', '玉器琢磨与钻孔工艺精细化', '天然漆由实用转向髹饰'],
    aesthetics: ['狞厉之美', '礼制秩序', '神秘图腾']
  },
  {
    id: 'qinhan',
    name: '秦汉',
    glyph: '俑',
    years: '前 221 — 220',
    yearStart: -221,
    yearEnd: 220,
    palette: { from: '#332016', to: '#150d08', accent: '#cd6a4a' },
    summary: '帝国的体量进入艺术：陶俑、石刻与帛画共同构建宏大的地下世界。',
    forms: ['陶俑与雕塑', '画像石 · 画像砖', '墓室壁画', '隶书与篆刻'],
    works: [
      { title: '秦始皇陵兵马俑', artist: '秦 · 陶塑' },
      { title: '马王堆 T 形帛画', artist: '西汉 · 帛画' },
      { title: '长信宫灯', artist: '西汉 · 鎏金铜器' },
      { title: '击鼓说唱俑', artist: '东汉 · 陶俑' }
    ],
    materials: ['陶土模制与彩绘结合，量产化', '石材减地浮雕与线刻并施', '鎏金、错金银工艺精进'],
    aesthetics: ['雄浑大气', '写实与浪漫并存', '事死如生']
  },
  {
    id: 'weijin',
    name: '魏晋南北朝',
    glyph: '窟',
    years: '220 — 589',
    yearStart: 220,
    yearEnd: 589,
    palette: { from: '#232c3d', to: '#0f1420', accent: '#8fa8c8' },
    summary: '人的觉醒带来艺术的自觉：绘画与书法第一次成为士人表达心性的方式。',
    forms: ['卷轴画', '石窟壁画与造像', '书法诸体定型'],
    works: [
      { title: '洛神赋图', artist: '顾恺之 · 东晋' },
      { title: '兰亭序', artist: '王羲之 · 东晋' },
      { title: '女史箴图', artist: '顾恺之 · 东晋' },
      { title: '莫高窟早期壁画', artist: '北朝 · 画工集体' }
    ],
    materials: ['绢本设色成为绘画新载体', '纸墨普及，书法脱离简帛', '矿物颜料随丝路传入'],
    aesthetics: ['以形写神', '魏晋风度', '线的韵律']
  },
  {
    id: 'suitang',
    name: '隋唐',
    glyph: '彩',
    years: '581 — 907',
    yearStart: 581,
    yearEnd: 907,
    palette: { from: '#3a2a18', to: '#181008', accent: '#e0a94e' },
    summary: '盛世气象凝结为饱满的色彩与形体，长安成为当时世界艺术的交汇点。',
    forms: ['人物画', '青绿山水', '石窟造像', '唐三彩'],
    works: [
      { title: '步辇图', artist: '阎立本 · 唐' },
      { title: '簪花仕女图', artist: '周昉 · 唐' },
      { title: '游春图', artist: '展子虔 · 隋' },
      { title: '莫高窟第 220 窟', artist: '初唐 · 画工集体' }
    ],
    materials: ['绢本重彩，矿物颜料体系完备', '低温铅釉陶（三彩）盛行', '金银器锤揲与掐丝成熟'],
    aesthetics: ['富丽堂皇', '丰腴自信', '开放包容']
  },
  {
    id: 'song',
    name: '五代两宋',
    glyph: '山',
    years: '907 — 1279',
    yearStart: 907,
    yearEnd: 1279,
    palette: { from: '#26332c', to: '#0f1713', accent: '#a8c5b0' },
    summary: '山水成为中国人的精神栖居地，「格物」与「意境」塑造了此后千年的审美范式。',
    forms: ['山水画', '花鸟画', '瓷器', '文人画萌芽'],
    works: [
      { title: '溪山行旅图', artist: '范宽 · 北宋' },
      { title: '清明上河图', artist: '张择端 · 北宋' },
      { title: '千里江山图', artist: '王希孟 · 北宋' },
      { title: '汝窑天青釉盘', artist: '北宋 · 汝窑' }
    ],
    materials: ['绢本水墨与浅绛并重', '青瓷、白瓷、建盏等窑系成熟', '装裱与赏藏制度完善'],
    aesthetics: ['格物致知', '平淡天真', '意境为先']
  },
  {
    id: 'yuan',
    name: '元',
    glyph: '墨',
    years: '1271 — 1368',
    yearStart: 1271,
    yearEnd: 1368,
    palette: { from: '#1f2733', to: '#0d1119', accent: '#7f9fd0' },
    summary: '文人隐于山水，笔墨本身成为目的——「写」第一次压倒「画」。',
    forms: ['文人画', '水墨山水', '青花瓷'],
    works: [
      { title: '富春山居图', artist: '黄公望 · 元' },
      { title: '鹊华秋色图', artist: '赵孟頫 · 元' },
      { title: '青花鬼谷子下山图罐', artist: '元 · 景德镇窑' }
    ],
    materials: ['纸本取代绢本成为主流', '水墨皴法体系成熟', '钴料青花随丝路贸易成熟'],
    aesthetics: ['逸笔草草', '书画同源', '寄情山水']
  },
  {
    id: 'ming',
    name: '明',
    glyph: '刻',
    years: '1368 — 1644',
    yearStart: 1368,
    yearEnd: 1644,
    palette: { from: '#33221f', to: '#160e0c', accent: '#cf8f5f' },
    summary: '复古思潮与个性解放同时涌动，艺术市场与城市文化塑造了新的观看方式。',
    forms: ['吴门画派与院体', '木版版画', '文人书法', '家具与漆器'],
    works: [
      { title: '汉宫春晓图', artist: '仇英 · 明' },
      { title: '墨葡萄图', artist: '徐渭 · 明' },
      { title: '庐山高图', artist: '沈周 · 明' },
      { title: '牡丹亭版画', artist: '明 · 金陵刻坊' }
    ],
    materials: ['纸本设色与泼墨并行', '木版套色水印成熟', '紫砂与硬木家具兴起'],
    aesthetics: ['复古与个性并立', '市民趣味', '南北宗论']
  },
  {
    id: 'qing',
    name: '清',
    glyph: '瓷',
    years: '1644 — 1912',
    yearStart: 1644,
    yearEnd: 1912,
    palette: { from: '#2b2340', to: '#120e1d', accent: '#b79ae0' },
    summary: '正统与野逸彼此拉扯，西洋画法进入宫廷，传统在张力中寻找出口。',
    forms: ['正统派与四僧', '宫廷绘画', '粉彩 · 珐琅彩瓷', '金石篆刻'],
    works: [
      { title: '荷花水鸟图', artist: '朱耷 · 清' },
      { title: '竹石图', artist: '郑燮 · 清' },
      { title: '百骏图', artist: '郎世宁 · 清' },
      { title: '山水册', artist: '石涛 · 清' }
    ],
    materials: ['珐琅彩、粉彩等釉上彩成熟', '西洋焦点透视与明暗法传入', '碑学兴起，金石入印'],
    aesthetics: ['摹古与革新角力', '中西合璧', '怪与拙']
  },
  {
    id: 'modern',
    name: '近现代',
    glyph: '变',
    years: '1912 — 至今',
    yearStart: 1912,
    yearEnd: 2026,
    palette: { from: '#2e2e33', to: '#131316', accent: '#e05a4a' },
    summary: '传统笔墨与西方造型体系碰撞融合，中国艺术进入多元并置的现代现场。',
    forms: ['国画革新', '油画与雕塑', '新兴木刻版画', '当代艺术', '影像与装置'],
    works: [
      { title: '奔马图', artist: '徐悲鸿 · 1941' },
      { title: '墨虾', artist: '齐白石 · 近现代' },
      { title: '江山如此多娇', artist: '傅抱石 · 关山月 · 1959' },
      { title: '父亲', artist: '罗中立 · 1980' },
      { title: '长江万里图', artist: '吴冠中 · 近现代' }
    ],
    materials: ['油画布、丙烯等西来媒介普及', '水墨与构成、抽象语言融合', '影像、装置等综合媒介出现'],
    aesthetics: ['中西融合', '现实主义', '多元实验']
  }
]

// —— 内容密度自适应 ——
// 每个时期在时间轴上占据的长度与其信息量（条目数与文本量）成正比，
// 信息密度高的时期获得更长的区间与更大的节点。

const contentChars = (era) =>
  [
    era.summary,
    ...era.forms,
    ...era.materials,
    ...era.aesthetics,
    ...era.works.map((work) => work.title + work.artist)
  ].join('').length

const eraWeight = (era) => 0.55 + contentChars(era) / 150

export const timelineSegments = (() => {
  const weights = timelineEras.map(eraWeight)
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  let cursor = 0
  return timelineEras.map((era, index) => {
    const start = cursor / total
    cursor += weights[index]
    const end = cursor / total
    const normalized = (weights[index] - minWeight) / (maxWeight - minWeight || 1)
    return {
      era,
      index,
      start,
      end,
      center: (start + end) / 2,
      nodeScale: 0.8 + 0.55 * normalized
    }
  })
})()

export function eraIndexAtTime(time) {
  const clamped = Math.min(0.99999, Math.max(0, time))
  const segment = timelineSegments.find((item) => clamped >= item.start && clamped < item.end)
  return segment ? segment.index : timelineSegments.length - 1
}

export function yearAtTime(time) {
  const segment = timelineSegments[eraIndexAtTime(time)]
  const clamped = Math.min(Math.max(time, segment.start), segment.end)
  const local = (clamped - segment.start) / (segment.end - segment.start)
  return segment.era.yearStart + (segment.era.yearEnd - segment.era.yearStart) * local
}

export function formatYear(year) {
  const rounded = Math.round(year)
  if (rounded < 0) return `公元前 ${Math.abs(rounded)} 年`
  if (rounded === 0) return '公元 1 年'
  return `公元 ${rounded} 年`
}
