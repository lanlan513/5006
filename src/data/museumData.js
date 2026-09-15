export const domains = ['全部', '绘画', '书法', '雕塑', '陶瓷', '壁画', '工艺美术']

export const artworks = [
  {
    id: 'dwelling-fuchun',
    title: '富春山居图（剩山图）',
    artist: '黄公望',
    year: '元 · 1350',
    domain: '绘画',
    medium: '纸本水墨',
    location: '浙江省博物馆',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1600&q=85',
    accent: '#d5b487',
    summary: '以平远之法展开富春江两岸的秋日山水，墨色疏淡，却将时间的流动留在了山石之间。',
    tags: ['元四家', '文人画', '长卷'],
    relation: '从“可游可居”的山水进入文人画的观看方式',
    detail: '画家以披麻皴写山，以干湿浓淡的墨色组织层峦。观看这件作品并非一次性阅读，而是沿着长卷缓慢移动，在留白里感受行旅和心境。'
  },
  {
    id: 'tao-tea',
    title: '青花缠枝莲纹梅瓶',
    artist: '景德镇窑',
    year: '明 · 永乐',
    domain: '陶瓷',
    medium: '青花瓷',
    location: '故宫博物院',
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1200&q=85',
    accent: '#6f94a5',
    summary: '一件器物如何容纳秩序、礼制与手的温度？青花在白釉上留下了可辨认的呼吸。',
    tags: ['永乐', '窑火', '纹样'],
    relation: '从器物尺度理解明代宫廷审美与全球贸易',
    detail: '胎体匀净，青料发色浓艳。缠枝莲纹在瓶肩、瓶腹间连续展开，形成一种不间断的观看节奏。器形与绘画共同构成了明代宫廷的秩序感。'
  },
  {
    id: 'calligraphy',
    title: '兰亭序（神龙本）',
    artist: '王羲之',
    year: '唐摹本 · 约 672',
    domain: '书法',
    medium: '纸本墨迹',
    location: '故宫博物院',
    image: 'https://images.unsplash.com/photo-1547981609-4b6bf67db6d1?auto=format&fit=crop&w=1200&q=85',
    accent: '#a7745b',
    summary: '笔锋的提按、转折与呼吸，让一场春日雅集穿越一千六百年的时间抵达今日。',
    tags: ['行书', '魏晋风度', '临摹'],
    relation: '从身体动作理解“自然”如何成为书法的审美尺度',
    detail: '行书的流动感来自速度的变化，而不是单一的潦草。字与字之间互相牵引，笔画在转折处留下身体运动的证据。'
  },
  {
    id: 'grotto-buddha',
    title: '莫高窟第 257 窟 · 九色鹿',
    artist: '北魏画工',
    year: '北魏 · 439–534',
    domain: '壁画',
    medium: '壁画 / 矿物颜料',
    location: '敦煌研究院',
    image: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&w=1400&q=85',
    accent: '#c77951',
    summary: '在洞窟的幽暗中，故事沿着墙面旋转。色彩不是装饰，而是叙事的时间线。',
    tags: ['敦煌', '佛教艺术', '叙事'],
    relation: '从连续画面理解中国早期壁画的叙事结构',
    detail: '九色鹿本生故事以连续的场景铺陈，人物和动物被置于山林、河流与云气之间。矿物颜料的颗粒感使画面保留了时间的肌理。'
  },
  {
    id: 'bronze-mask',
    title: '青铜纵目面具',
    artist: '三星堆祭祀区',
    year: '商 · 约公元前 1200',
    domain: '雕塑',
    medium: '青铜铸造',
    location: '四川广汉三星堆博物馆',
    image: 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=1200&q=85',
    accent: '#7c8b6d',
    summary: '夸张的双眼把凝视推向神话。器物尺度之外，是一个文明对观看和沟通的想象。',
    tags: ['三星堆', '青铜', '祭祀'],
    relation: '从非写实造型进入古蜀文明的精神世界',
    detail: '纵目面具的造型超出人脸比例，器官被转化为符号。青铜的铸造工艺与祭祀用途共同塑造了它不可亲近的神性。'
  },
  {
    id: 'lacquer-box',
    title: '剔红花鸟纹圆盒',
    artist: '雕漆作',
    year: '明 · 宣德',
    domain: '工艺美术',
    medium: '剔红漆器',
    location: '台北故宫博物院',
    image: 'https://images.unsplash.com/photo-1582561833407-b95380302c7b?auto=format&fit=crop&w=1200&q=85',
    accent: '#b34f3d',
    summary: '数十层漆的厚度，给花鸟纹样制造出微小的山谷。触觉在这里变成了一种观看。',
    tags: ['雕漆', '手工', '宫廷'],
    relation: '从材料层次理解工艺美术中的时间成本',
    detail: '剔红需要反复髹漆，积累厚度后再雕刻纹样。刀锋切入漆层的深浅，决定了花叶的起伏和光线的停留方式。'
  }
]

export const eras = [
  { label: '先秦', range: '公元前 221 年以前', count: 32, color: '#a38f69' },
  { label: '秦汉', range: '前 221 — 220', count: 47, color: '#b9795b' },
  { label: '魏晋南北朝', range: '220 — 589', count: 64, color: '#788f8b' },
  { label: '隋唐', range: '581 — 907', count: 89, color: '#a98765' },
  { label: '宋元', range: '960 — 1368', count: 124, color: '#7a8798' },
  { label: '明清', range: '1368 — 1911', count: 176, color: '#a36a5a' },
  { label: '近现代', range: '1912 — 至今', count: 98, color: '#767f6c' }
]

export const getFeatured = () => artworks[0]
export const getArtworks = ({ domain = '全部', query = '' } = {}) => {
  const normalized = query.trim().toLowerCase()
  return artworks.filter((item) => {
    const matchesDomain = domain === '全部' || item.domain === domain
    const matchesQuery = !normalized || [item.title, item.artist, item.domain, item.medium, ...item.tags].join(' ').toLowerCase().includes(normalized)
    return matchesDomain && matchesQuery
  })
}
