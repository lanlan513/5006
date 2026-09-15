// 章法沙盘的作品库：每件作品自带默认章法参数（字距、行距、留白、落款、印章）。
//
// 设计原则：
// 1. 正文与落款文本均经过字库真实收字校验（见 fontManifest.json），
//    原帖中字库未收的字（如「禊」「羲」「觞」「壑」「笈」）在节选时如实绕开，
//    不以近形字顶替。
// 2. 印文取自篆字库实收字（和 / 吉祥 / 寒 / 春 / 吉 / 祥 / 書 / 文），
//    保证印章能以篆书字体真实渲染。
// 3. 坐标一律用纸面比例（0..1）存储，与纸面像素解耦，便于序列化与回放。
// 4. 默认章法参数按「正文列幅占内框约九成、视觉重心居中略上」调定，
//    使每件作品打开时处于平衡态，失衡预警从用户的调整中产生。

export const WORKS = [
  {
    id: 'lanting',
    title: '兰亭序（节）',
    author: '王羲之',
    era: '东晋 · 永和九年',
    fontId: 'xing',
    scriptName: '行书',
    note: '天下第一行书。原帖字距紧、行距宽，行气贯通而留白从容。',
    paper: { w: 1000, h: 720 },
    text: '永和九年岁在癸丑暮春之初会于会稽山阴之兰亭群贤毕至少长咸集此地有崇山峻岭茂林修竹又有清流激湍映带左右列坐其次虽无丝竹管弦之盛亦足以畅叙幽情',
    inscriptionText: '永和九年三月书',
    defaults: {
      fontSize: 44,
      charGap: 0.18,
      colGap: 1.85,
      margins: { t: 0.09, r: 0.09, b: 0.09, l: 0.05 },
      inscription: { x: 0.062, y: 0.6, scale: 0.4, rotation: 0 },
      seals: [
        { id: 'seal-name', chars: '和', x: 0.062, y: 0.88, size: 52, rotation: -3 },
        { id: 'seal-lead', chars: '吉祥', x: 0.945, y: 0.14, size: 64, rotation: 2 }
      ]
    }
  },
  {
    id: 'hanshi',
    title: '寒食帖（节）',
    author: '苏轼',
    era: '北宋 · 元丰五年',
    fontId: 'xing',
    scriptName: '行书',
    note: '天下第三行书。字势左低右昂，行轴摆动，墨气随诗意起伏。',
    paper: { w: 1180, h: 760 },
    text: '自我来黄州已过三寒食年年欲惜春春去不容惜今年又苦雨两月秋萧瑟卧闻海棠花泥污燕支雪暗中偷负去夜半真有力春江欲入户雨势来不已小屋如渔舟蒙蒙水云里',
    inscriptionText: '东坡居士',
    defaults: {
      fontSize: 48,
      charGap: 0.2,
      colGap: 1.95,
      margins: { t: 0.1, r: 0.08, b: 0.1, l: 0.06 },
      inscription: { x: 0.07, y: 0.58, scale: 0.42, rotation: 0 },
      seals: [
        { id: 'seal-name', chars: '寒', x: 0.07, y: 0.86, size: 54, rotation: 2 },
        { id: 'seal-lead', chars: '春', x: 0.945, y: 0.14, size: 50, rotation: -2 }
      ]
    }
  },
  {
    id: 'jiucheng',
    title: '九成宫醴泉铭（节）',
    author: '欧阳询',
    era: '唐 · 贞观六年',
    fontId: 'kai',
    scriptName: '楷书',
    note: '楷法极则。界格严整，字距行距匀停，重心端居正中。',
    paper: { w: 760, h: 900 },
    text: '维贞观六年孟夏之月皇帝避暑乎九成之宫此则隋之仁寿宫也冠山抗殿高阁周建长廊四起照灼云霞蔽亏日月观其移山回涧穷泰极奢良足深尤',
    inscriptionText: '欧阳询书',
    defaults: {
      fontSize: 52,
      charGap: 0.32,
      colGap: 1.1,
      margins: { t: 0.07, r: 0.07, b: 0.07, l: 0.07 },
      inscription: { x: 0.1, y: 0.72, scale: 0.4, rotation: 0 },
      seals: [
        { id: 'seal-name', chars: '吉', x: 0.1, y: 0.875, size: 56, rotation: 0 },
        { id: 'seal-lead', chars: '祥', x: 0.1, y: 0.955, size: 52, rotation: 0 }
      ]
    }
  },
  {
    id: 'zixu',
    title: '自叙帖（节）',
    author: '怀素',
    era: '唐 · 大历十二年',
    fontId: 'cao',
    scriptName: '草书',
    note: '狂草名迹。字组连绵、行轴扭曲，疏密对比极强烈。',
    paper: { w: 1080, h: 780 },
    text: '怀素家长沙幼而事佛经文之暇颇好笔翰然恨未能远睹前人之奇迹所见甚浅遂西游上国见当代名公错综其事遗编绝简往往遇之',
    inscriptionText: '怀素书',
    defaults: {
      fontSize: 58,
      charGap: 0.12,
      colGap: 1.65,
      margins: { t: 0.09, r: 0.08, b: 0.09, l: 0.05 },
      inscription: { x: 0.06, y: 0.56, scale: 0.4, rotation: 0 },
      seals: [
        { id: 'seal-name', chars: '書', x: 0.06, y: 0.85, size: 54, rotation: -2 },
        { id: 'seal-lead', chars: '文', x: 0.945, y: 0.13, size: 50, rotation: 3 }
      ]
    }
  }
]

export const workById = Object.fromEntries(WORKS.map((work) => [work.id, work]))

/** 深拷贝一件作品的默认章法参数 */
export function defaultComp(work) {
  return JSON.parse(JSON.stringify(work.defaults))
}

/**
 * 把外部数据（导入的快照 / 本地缓存）清洗成当前作品的合法章法状态。
 * 逐字段校验，缺失或越界的值回落到该作品默认值 —— 不信任任何外部输入。
 */
export function sanitizeComp(work, raw) {
  const base = defaultComp(work)
  if (!raw || typeof raw !== 'object') return base
  const num = (value, fallback, min, max) =>
    Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
  const comp = {
    fontSize: num(raw.fontSize, base.fontSize, 20, 120),
    charGap: num(raw.charGap, base.charGap, 0, 1.6),
    colGap: num(raw.colGap, base.colGap, 0, 3.2),
    margins: {
      t: num(raw.margins?.t, base.margins.t, 0, 0.3),
      r: num(raw.margins?.r, base.margins.r, 0, 0.3),
      b: num(raw.margins?.b, base.margins.b, 0, 0.3),
      l: num(raw.margins?.l, base.margins.l, 0, 0.3)
    },
    inscription: {
      x: num(raw.inscription?.x, base.inscription.x, 0, 1),
      y: num(raw.inscription?.y, base.inscription.y, 0, 1),
      scale: num(raw.inscription?.scale, base.inscription.scale, 0.24, 1.2),
      rotation: num(raw.inscription?.rotation, base.inscription.rotation, -45, 45)
    },
    seals: base.seals.map((seal) => {
      const rawSeal = Array.isArray(raw.seals) ? raw.seals.find((item) => item?.id === seal.id) : null
      return {
        ...seal,
        x: num(rawSeal?.x, seal.x, -0.1, 1.1),
        y: num(rawSeal?.y, seal.y, -0.1, 1.1),
        size: num(rawSeal?.size, seal.size, 20, 220),
        rotation: num(rawSeal?.rotation, seal.rotation, -180, 180)
      }
    })
  }
  return comp
}
