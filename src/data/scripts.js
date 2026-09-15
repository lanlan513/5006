// 五种书体的阶段定义：顺序、年代、结构特征与字体资源的对应关系。
// fontId 对应 src/lib/fonts.js 中的字体资源键。

export const SCRIPTS = [
  {
    id: 'zhuan',
    name: '篆书',
    fullName: '篆书 · 小篆',
    seal: '篆',
    era: '秦 · 约前 3 世纪',
    fontId: 'seal',
    source: '霞鹜篆书（据《说文》小篆）',
    gist: '匀圆长线，纵势结字',
    intro: '小篆是汉字第一次官方统一的标准形体。笔画匀圆等粗、结构纵长对称，象形遗意尚存。'
  },
  {
    id: 'li',
    name: '隶书',
    fullName: '隶书 · 汉隶',
    seal: '隶',
    era: '汉 · 前 2 世纪—3 世纪',
    fontId: 'li',
    source: '清骨隸（金农隶意）',
    gist: '破圆为方，波磔分明',
    intro: '隶书解散篆引、破圆为方，横画取波磔之势。汉字由此从古文字跨入今文字。'
  },
  {
    id: 'kai',
    name: '楷书',
    fullName: '楷书 · 唐楷',
    seal: '楷',
    era: '唐 · 7—9 世纪定型',
    fontId: 'kai',
    source: 'Ma Shan Zheng 毛笔楷书',
    gist: '笔画定型，结构方正',
    intro: '楷书收敛波磔、确立钩法，笔画形态最终定型，至今仍是规范字形的基础。'
  },
  {
    id: 'xing',
    name: '行书',
    fullName: '行书',
    seal: '行',
    era: '魏晋以降',
    fontId: 'xing',
    source: 'Zhi Mang Xing 行书',
    gist: '牵丝引带，简省有度',
    intro: '行书是楷书的流动写法：笔画之间增加引带，减省提按，结构犹存而书写更快。'
  },
  {
    id: 'cao',
    name: '草书',
    fullName: '草书 · 今草',
    seal: '草',
    era: '汉末以降',
    fontId: 'cao',
    source: 'Liu Jian Mao Cao 毛草',
    gist: '符号化，多笔一贯',
    intro: '草书进一步简省合并：部首符号化、多笔连为一笔，识读依赖约定俗成的草法。'
  }
]

// 相邻书体之间的过渡：这是观察「结构压缩、笔画变化、形态重组」的主线。
export const TRANSITIONS = [
  {
    from: 'zhuan',
    to: 'li',
    key: 'zhuan>li',
    name: '隶变',
    gist: '解散篆引，破圆为方',
    detail: '隶变是古今文字的分水岭：匀圆的象形线条被拆解为可快速书写的笔画，圆转改为方折，部首位置与写法大量重组。'
  },
  {
    from: 'li',
    to: 'kai',
    key: 'li>kai',
    name: '楷化',
    gist: '波磔收敛，间架方正',
    detail: '楷书把隶书的扁方结构扶正为方正，波磔收敛为规范的撇捺，钩、挑等笔法确立，笔画系统最终定型。'
  },
  {
    from: 'kai',
    to: 'xing',
    key: 'kai>xing',
    name: '行化',
    gist: '笔势连贯，减省提按',
    detail: '行书不改结构而改笔势：笔画之间出现牵丝引带，独立的点画化为呼应的笔意，书写节奏明显加快。'
  },
  {
    from: 'xing',
    to: 'cao',
    key: 'xing>cao',
    name: '草化',
    gist: '部首符号化，多笔一贯',
    detail: '草书把常用部首压缩为约定符号，多笔连作一笔。形体远离楷书，但每一个省法都有渊源，并非随意缠绕。'
  }
]

export const scriptById = Object.fromEntries(SCRIPTS.map((script) => [script.id, script]))

export function transitionBetween(fromId, toId) {
  return TRANSITIONS.find((item) => item.from === fromId && item.to === toId)
}
