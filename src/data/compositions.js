/**
 * 构图法分类法（compositions）与视觉标本数据
 * ------------------------------------------
 * 第三套关系数据，与画科（taxonomy.js，画了什么）、
 * 表现技法（techniques.js，怎么画）平行，回答「怎么经营位置」：
 *   散点透视 / 留白 / 三远法 / 对角构图 / S 形动势。
 *
 * 标本（specimen）不是作品的复制：作品记录仍在 museumData.js 中唯一存在，
 * 标本只持有 artworkId 与一组「构图标注」。同一件作品可被多种构图标本引用。
 *
 * 标注坐标模型（关键设计）
 * ----------------------
 * 每个标注的几何坐标一律是 **图片自身坐标系下的归一化坐标（0~1）**：
 *   - x=0 图片左缘，x=1 右缘；y 自上而下；
 *   - 与图片实际像素、屏幕像素、当前缩放倍数全部无关；
 *   - SpecimenViewer 里由 SVG 层（viewBox=图片自然尺寸）与百分比定位的
 *     HTML 标记分别消费，缩放 / 平移 / 窗口尺寸变化都自动重算（见组件注释）。
 *
 * 标注数量与形状「故意不固定」：
 *   kind：guide 辅助线 / mask 区域遮罩 / focus 视觉中心
 *   shape：line | arrow | polyline | circle（guide）
 *          rect | polygon | ellipse（mask）
 *          crosshair（focus）
 * 全库标本标注数 3~7 个不等，由 buildCompositionIndex() 校验形状与坐标。
 */

export const compositions = [
  {
    id: 'sandian',
    name: '散点透视',
    pinyin: 'SAN DIAN TOU SHI',
    char: '移',
    epithet: '移步换景 · 移动的视点',
    intro:
      '西方焦点透视只有一个固定消失点，中国长卷的视点却在行走：观者随卷轴展开不断变换立足点，' +
      '每一段都有自己的视平线，张择端把汴河郊野、虹桥、街市收入一卷，顾恺之让洛神在数个段落中反复现身。' +
      '散点不是「没有透视」，而是把时间写进了空间。',
    principles: ['视点随展卷水平移动，一段一景', '段落之间以树木、屏扇、水流自然过渡', '人在不同高度与角度出现，不以同一消失点约束'],
    watch: '先横向扫读全卷，再逐段定位：辅助线标出段落边界，箭头标出视点的行走方向。',
    accent: '#c19560'
  },
  {
    id: 'liubai',
    name: '留白',
    pinyin: 'LIU BAI',
    char: '白',
    epithet: '计白当黑 · 虚实相生',
    intro:
      '空白在中国画里不是未完成的纸，而是水、是雾、是天、是未曾说出口的话。倪瓒一河两岸，画面过半空着；' +
      '八大山人把物象挤到边角，一只白眼水鸟之外全是空旷。实笔靠虚白呼吸，观者用想象把空处填满——这叫「计白当黑」。',
    principles: ['空白承担具体所指：水、云、天、气', '物象越简，每处实笔的重量越大', '题款印章也是实，与空白互相生发'],
    watch: '注意遮罩标出的空白区域占比：先看空白有多大，再看物象被安放在哪条边、哪个角。',
    accent: '#7fa3b5'
  },
  {
    id: 'sanyuan',
    name: '三远法',
    pinyin: 'SAN YUAN FA',
    char: '远',
    epithet: '高远 · 深远 · 平远',
    intro:
      '郭熙在《林泉高致》中给出三种观看山水的方式：自山下而仰山巅谓之高远，自山前而窥山后谓之深远，' +
      '自近山而望远山谓之平远。同一幅立轴可以兼有三远：范宽《溪山行旅图》以高远立主峰，' +
      '郭熙《早春图》则以深远把楼阁藏进山腰，视线在一幅画里上下、前后、远近同时运动。',
    principles: ['高远：仰视，主峰压顶，尺度崇高', '深远：层层推入，云烟与扭脊制造纵深', '平远：平视旷望，视线沿水面向远方延展'],
    watch: '三条箭头是三种视线方向：向上是高远、斜入山后是深远、水平推开是平远；遮罩分出前中后三层。',
    accent: '#7fa07a'
  },
  {
    id: 'duijiao',
    name: '对角构图',
    pinyin: 'DUI JIAO GOU TU',
    char: '角',
    epithet: '马一角 · 夏半边',
    intro:
      '南宋画家把北宋的全景江山裁成一角：马远常取山之一角，人称「马一角」；夏圭多画水之一涯，人称「夏半边」。' +
      '实笔沿一条对角线经营，另一端大片空出，虚与实斜相制衡。花鸟画也用此法——蝴蝶与锦鸡的目光连成一条斜线，' +
      '静止的画面因此有了拉力。',
    principles: ['实象集中于一角一涯，沿对角线展开', '对角线另一端以虚白承接，虚实相撑', '视线、枝势常与对角同向，牵引目光'],
    watch: '先沿对角辅助线看实与虚如何分割画面，再看两端的视觉中心如何隔空呼应。',
    accent: '#c47f5b'
  },
  {
    id: 'sdongshi',
    name: 'S 形动势',
    pinyin: 'S XING DONG SHI',
    char: '势',
    epithet: '之字回旋 · 龙脉起伏',
    intro:
      '好画的元素不是平均撒开，而沿一条隐藏的动线起伏回旋，形如 S 或「之」字。' +
      '崔白《双喜图》中俯鸣之雀、斜出枝干与回首野兔连成之字回应；长卷山水则以水脉与岸线的 S 形穿插' +
      '引导目光行进。这条线后来被称作「龙脉」：它不画在纸上，却决定了气往哪里走。',
    principles: ['关键节点落在 S / 之字的转折点上', '相邻节点一虚一实、一高一低，形成节奏', '目光沿动线行进，画面因此「动」起来'],
    watch: '沿 S 形辅助线从一端走到另一端，看每个转折点上的视觉中心如何接力。',
    accent: '#a985b8'
  }
]

/**
 * 标本：{ id, compositionId, artworkId（museumData 中的作品）, thesis（一句话构图判读）, annotations[] }
 * 标注几何字段（均为归一化 0~1；anchor 缺省时由形状几何自动推算）：
 *  guide  line    { from:{x,y}, to:{x,y} }
 *         arrow   { from, to }
 *         polyline{ points:[{x,y}, ...] }
 *  mask   rect    { x, y, w, h }
 *         ellipse { cx, cy, rx, ry }
 *         polygon { points:[...] }
 *  focus  crosshair { x, y, r? }
 */
export const specimens = [
  /* ---------------- 散点透视 ---------------- */
  {
    id: 'sp-qingming-sandian',
    compositionId: 'sandian',
    artworkId: 'qingming-river',
    thesis: '一卷之中视点不断平移：郊野、虹桥、街市各成一章，虹桥是全卷高潮。',
    annotations: [
      { id: 'q-a', kind: 'mask', shape: 'rect', x: 0.01, y: 0.56, w: 0.26, h: 0.40, label: '郊野段', text: '卷首疏林薄雾、行旅赶路，视平安放较低，是全卷的「起调」。' },
      { id: 'q-b', kind: 'mask', shape: 'rect', x: 0.28, y: 0.30, w: 0.44, h: 0.66, label: '虹桥段', text: '视点在桥心升高：拱桥占据画面中段，船工落桅的一瞬是全卷叙事高潮。' },
      { id: 'q-c', kind: 'mask', shape: 'rect', x: 0.73, y: 0.56, w: 0.26, h: 0.40, label: '街市段', text: '卷尾城楼店肆密集，视点重新放平，市井百态在移动中逐一展开。' },
      { id: 'q-g1', kind: 'guide', shape: 'line', from: { x: 0.275, y: 0.08 }, to: { x: 0.275, y: 0.95 }, dashed: true, label: '段落分界', text: '两段之间没有统一的消失点，分界靠水岸与屋宇自然衔接。' },
      { id: 'q-g2', kind: 'guide', shape: 'line', from: { x: 0.725, y: 0.08 }, to: { x: 0.725, y: 0.95 }, dashed: true, label: '段落分界', text: '竖线标出视点「换站」之处：每过一段，观察者就像沿河又走了一段路。' },
      { id: 'q-f', kind: 'focus', shape: 'crosshair', x: 0.5, y: 0.36, label: '移动方向', text: '横向箭头即展卷方向：时间沿卷面水平发生，而非固定于一个画框。', arrow: { from: { x: 0.06, y: 0.16 }, to: { x: 0.94, y: 0.16 } } }
    ]
  },
  {
    id: 'sp-luoshen-sandian',
    compositionId: 'sandian',
    artworkId: 'nymph-luoshen',
    thesis: '同一个洛神在数个段落里反复出现，屏扇隔开的是时间而不仅是空间。',
    annotations: [
      { id: 'l-a', kind: 'mask', shape: 'rect', x: 0.0, y: 0.06, w: 0.30, h: 0.88, label: '初见 · 定情', text: '曹植与洛神相遇于洛水之滨，人物取独立视平线，是连环画式叙事的第一章。' },
      { id: 'l-b', kind: 'mask', shape: 'rect', x: 0.31, y: 0.06, w: 0.34, h: 0.88, label: '赠佩 · 徘徊', text: '屏扇之后情节再启：洛神解珮相赠，人物尺度依旧，不被前一段的空间约束。' },
      { id: 'l-c', kind: 'mask', shape: 'rect', x: 0.66, y: 0.06, w: 0.34, h: 0.88, label: '怅别 · 洛神登舟', text: '末段人神殊途、舟驾离去，与卷首隔水呼应，情绪在平移中收束。' },
      { id: 'l-g1', kind: 'guide', shape: 'line', from: { x: 0.305, y: 0.06 }, to: { x: 0.305, y: 0.94 }, dashed: true, label: '屏扇隔段', text: '屏风既是家具，也是「镜头切换」：中国画用器物切分时间。' },
      { id: 'l-g2', kind: 'guide', shape: 'line', from: { x: 0.655, y: 0.06 }, to: { x: 0.655, y: 0.94 }, dashed: true, label: '屏扇隔段', text: '每扇屏风后是一个新立足点，散点透视让连续叙事成为可能。' },
      { id: 'l-f', kind: 'focus', shape: 'crosshair', x: 0.125, y: 0.72, label: '洛神复现', text: '洛神在各段中反复现身——移动视点追随的是人物与情节，而非固定机位。' }
    ]
  },

  /* ---------------- 留白 ---------------- */
  {
    id: 'sp-yuzan-liubai',
    compositionId: 'liubai',
    artworkId: 'fisherman-autumn',
    thesis: '一河两岸：画面过半不着一笔，空处是水，也是元人简淡的心绪。',
    annotations: [
      { id: 'y-m1', kind: 'mask', shape: 'rect', x: 0.04, y: 0.22, w: 0.92, h: 0.52, label: '空水留白', text: '画面过半空无一物，不着一笔水纹——空白即是浩渺江面，靠两岸夹出。' },
      { id: 'y-m2', kind: 'mask', shape: 'rect', x: 0.04, y: 0.03, w: 0.92, h: 0.17, label: '天空留白', text: '远山上缘与天相接处同样留纸，天、水两块虚白把实景托在一条窄带里。' },
      { id: 'y-g1', kind: 'guide', shape: 'line', from: { x: 0.04, y: 0.775 }, to: { x: 0.96, y: 0.775 }, label: '远岸一抹', text: '对岸只作低缓一抹，平远视线沿水面推向它，是「平远」的标准章法。' },
      { id: 'y-g2', kind: 'guide', shape: 'line', from: { x: 0.04, y: 0.9 }, to: { x: 0.96, y: 0.9 }, label: '近岸一线', text: '近景坡石压在画面下缘，与远岸平行夹住中间全部空白。' },
      { id: 'y-f', kind: 'focus', shape: 'crosshair', x: 0.2, y: 0.88, label: '枯树孤亭', text: '几株枯树、一座空亭是全画仅有的重音，四周越空，它越孤独。' }
    ]
  },
  {
    id: 'sp-bada-liubai',
    compositionId: 'liubai',
    artworkId: 'lotus-birds-bada',
    thesis: '物象被挤压到边角，大片空白成为主角，白眼向人的鸟悬在空旷之中。',
    annotations: [
      { id: 'b-m1', kind: 'mask', shape: 'polygon', points: [{ x: 0.02, y: 0.03 }, { x: 0.64, y: 0.03 }, { x: 0.54, y: 0.6 }, { x: 0.02, y: 0.72 }], label: '虚白 · 天水一色', text: '左上逾半幅没有任何笔墨，空白既是天也是水，把孤石与鸟变成空旷里的回音。' },
      { id: 'b-g1', kind: 'guide', shape: 'polyline', points: [{ x: 0.69, y: 0.77 }, { x: 0.68, y: 0.58 }, { x: 0.65, y: 0.36 }], label: '一茎荷梗', text: '长锋一笔自下而上贯穿，是大片空白中唯一的纵向支撑，极简而不可移。' },
      { id: 'b-f', kind: 'focus', shape: 'crosshair', x: 0.43, y: 0.7, label: '白眼向人', text: '鸟眼圈大、焦墨点睛在上方，周围越空，这一眼的孤傲越被放大。' }
    ]
  },
  {
    id: 'sp-tage-liubai',
    compositionId: 'liubai',
    artworkId: 'stomping-song',
    thesis: '同一件《踏歌图》也是留白标本：云烟横贯占去半幅，计白当黑，实笔被压到上下两角。',
    annotations: [
      { id: 't-m1', kind: 'mask', shape: 'rect', x: 0.02, y: 0.3, w: 0.96, h: 0.26, label: '云烟留白带', text: '中段一道云烟全以留白横隔上下，是烟也是气，把远峰与田埂推成两层空间。' },
      { id: 't-m2', kind: 'mask', shape: 'polygon', points: [{ x: 0.3, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0.32 }, { x: 0.66, y: 0.2 }], label: '清空右上', text: '右上几乎不着一笔，与下方实笔呼应——空白不是剩余，是被经营出来的「黑」。' },
      { id: 't-g1', kind: 'guide', shape: 'line', from: { x: 0.04, y: 0.43 }, to: { x: 0.96, y: 0.43 }, dashed: true, label: '虚实分界', text: '云烟上下两条隐含的水平分界，把画面分成实—虚—实三段呼吸。' },
      { id: 't-f', kind: 'focus', shape: 'crosshair', x: 0.68, y: 0.24, label: '远峰一点', text: '削立的奇峰只在空白上露出一角，越简越远，留白替它说完了高度。' }
    ]
  },

  /* ---------------- 三远法 ---------------- */
  {
    id: 'sp-zaochun-sanyuan',
    compositionId: 'sanyuan',
    artworkId: 'early-spring',
    thesis: '一幅立轴兼具三远：仰看主峰、窥入山后、平望远水，视线在画中上下前后运动。',
    annotations: [
      { id: 'z-m1', kind: 'mask', shape: 'rect', x: 0.0, y: 0.02, w: 1.0, h: 0.30, label: '远景 · 高远层', text: '主峰自云中升起，须仰面而视——郭熙所谓「自山下而仰山巅」。' },
      { id: 'z-m2', kind: 'mask', shape: 'rect', x: 0.0, y: 0.32, w: 1.0, h: 0.34, label: '中景 · 深远层', text: '山腰扭转、楼阁半藏，视线自山前层层窥入山后，云烟把纵深一段段让开。' },
      { id: 'z-m3', kind: 'mask', shape: 'rect', x: 0.0, y: 0.68, w: 1.0, h: 0.30, label: '近景 · 平远层', text: '近处坡石行旅是立脚点，视线由此水平推向溪谷远方，三远在一幅之内衔接。' },
      { id: 'z-g1', kind: 'guide', shape: 'arrow', from: { x: 0.5, y: 0.8 }, to: { x: 0.5, y: 0.16 }, label: '高远 · 仰视', text: '自山脚直指峰巅的仰视方向，主峰的纪念碑性由此建立。' },
      { id: 'z-g2', kind: 'guide', shape: 'arrow', from: { x: 0.26, y: 0.84 }, to: { x: 0.5, y: 0.53 }, label: '深远 · 窥入', text: '斜向插入山腰楼阁：不是看穿山体，而是随云气绕到山后去。' },
      { id: 'z-g3', kind: 'guide', shape: 'arrow', from: { x: 0.5, y: 0.64 }, to: { x: 0.94, y: 0.64 }, label: '平远 · 旷望', text: '视线在近景处折为水平，随溪面开阔推向画外远山。' },
      { id: 'z-f', kind: 'focus', shape: 'crosshair', x: 0.48, y: 0.53, label: '山腰楼阁', text: '楼阁故意藏在中段转折处，是深远视线的落点，也是三远交会的枢纽。' }
    ]
  },
  {
    id: 'sp-fankuan-sanyuan',
    compositionId: 'sanyuan',
    artworkId: 'travelers-mountains',
    thesis: '高远的极致：主峰占去三分之二画幅，一线飞瀑与如蚁旅人衬出山的体量。',
    annotations: [
      { id: 'f-m1', kind: 'mask', shape: 'polygon', points: [{ x: 0.12, y: 0.32 }, { x: 0.3, y: 0.16 }, { x: 0.52, y: 0.13 }, { x: 0.74, y: 0.2 }, { x: 0.9, y: 0.34 }, { x: 0.86, y: 0.72 }, { x: 0.14, y: 0.72 }], label: '主峰块面', text: '巨峰几乎占去画面三分之二，逼在眉睫——高远章法以尺度压迫观者。' },
      { id: 'f-g1', kind: 'guide', shape: 'line', from: { x: 0.5, y: 0.14 }, to: { x: 0.5, y: 0.7 }, dashed: true, label: '主峰轴线', text: '峰体沿中轴隆起，两侧溪谷对称下沉，立轴的稳定感来自这条看不见的轴。' },
      { id: 'f-g2', kind: 'guide', shape: 'line', from: { x: 0.485, y: 0.46 }, to: { x: 0.485, y: 0.66 }, label: '一线飞瀑', text: '细如发丝的留白纵贯两崖，越细越显得两侧墨色山体高不可测。' },
      { id: 'f-g3', kind: 'guide', shape: 'arrow', from: { x: 0.14, y: 0.86 }, to: { x: 0.46, y: 0.22 }, label: '仰看视线', text: '观者的目光自前景巨石斜向攀上峰巅，整幅画只邀请这一个动作：仰望。' },
      { id: 'f-f', kind: 'focus', shape: 'crosshair', x: 0.29, y: 0.9, label: '商旅如蚁', text: '山脚下的驴队小如蚁点，人物尺度被压到最低，正是「高远」之高的尺度注脚。' }
    ]
  },

  /* ---------------- 对角构图 ---------------- */
  {
    id: 'sp-mayuan-duijiao',
    compositionId: 'duijiao',
    artworkId: 'stomping-song',
    thesis: '马一角：实笔压在左下一角，奇峰与云烟沿对角斜让，右上整片空出。',
    annotations: [
      { id: 'm-m1', kind: 'mask', shape: 'polygon', points: [{ x: 0.0, y: 0.6 }, { x: 0.52, y: 0.5 }, { x: 0.58, y: 1.0 }, { x: 0.0, y: 1.0 }], label: '实 · 一角田垅', text: '山石、田埂与踏歌农人全部收在左下三角，实笔不到画面一半。' },
      { id: 'm-m2', kind: 'mask', shape: 'polygon', points: [{ x: 0.34, y: 0.0 }, { x: 1.0, y: 0.0 }, { x: 1.0, y: 0.62 }, { x: 0.62, y: 0.5 }], label: '虚 · 云烟清空', text: '对角另一端几乎全空，云烟占去画面半幅，虚实沿斜线相撑。' },
      { id: 'm-g1', kind: 'guide', shape: 'line', from: { x: 0.06, y: 0.92 }, to: { x: 0.94, y: 0.3 }, label: '虚实对角线', text: '一条斜线把满与空分开：重心在左下角，目光却被斜线牵到右上虚空。' },
      { id: 'm-g2', kind: 'guide', shape: 'line', from: { x: 0.45, y: 0.34 }, to: { x: 0.95, y: 0.34 }, dashed: true, label: '云气横隔', text: '一道云烟把上下景物断开，边角山水靠「断」制造空灵感。' },
      { id: 'm-f', kind: 'focus', shape: 'crosshair', x: 0.3, y: 0.89, label: '踏歌农人', text: '人物点在实角最沉处，丰年的人间烟火与大片清空遥遥相对。' }
    ]
  },
  {
    id: 'sp-jinji-duijiao',
    compositionId: 'duijiao',
    artworkId: 'hibiscus-golden-pheasant',
    thesis: '对角线不止于山水：蝴蝶与锦鸡的目光在斜线上相击，静画有了张力。',
    annotations: [
      { id: 'j-m1', kind: 'mask', shape: 'ellipse', cx: 0.29, cy: 0.36, rx: 0.12, ry: 0.1, label: '双蝶一端', text: '双蝶居画面左上，小而轻，是斜线的起点，也是目光的诱饵。' },
      { id: 'j-m2', kind: 'mask', shape: 'ellipse', cx: 0.7, cy: 0.66, rx: 0.2, ry: 0.17, label: '锦鸡一端', text: '锦鸡压在右下，体量最大、设色最重，与蝴蝶形成轻重两极。' },
      { id: 'j-g1', kind: 'guide', shape: 'arrow', from: { x: 0.25, y: 0.31 }, to: { x: 0.817, y: 0.614 }, label: '回首视线', text: '锦鸡回首注视双蝶，一条看不见的视线被画出了方向，两端因此锁死。' },
      { id: 'j-g2', kind: 'guide', shape: 'line', from: { x: 0.17, y: 0.89 }, to: { x: 0.86, y: 0.25 }, label: '芙蓉枝势', text: '压弯的枝条自左下斜上舒展，与视线同向，构图的动势被枝干实体化。' },
      { id: 'j-f', kind: 'focus', shape: 'crosshair', x: 0.817, y: 0.614, label: '点睛', text: '眼睛落在斜线终点：全画的张力在此收束，所谓「传神写照正在阿堵中」。' }
    ]
  },

  /* ---------------- S 形动势 ---------------- */
  {
    id: 'sp-shuangxi-sdong',
    compositionId: 'sdongshi',
    artworkId: 'double-happiness',
    thesis: '俯雀、斜枝、回首兔连成之字三折，目光沿动线在三者之间接力。',
    annotations: [
      { id: 's-g1', kind: 'guide', shape: 'polyline', points: [{ x: 0.8, y: 0.24 }, { x: 0.62, y: 0.46 }, { x: 0.44, y: 0.62 }, { x: 0.31, y: 0.84 }], label: '之字呼应链', text: '上雀、俯鸣之雀、古木转折、野兔依次落在之字形的转折点上，节奏一顿一挫。' },
      { id: 's-m1', kind: 'mask', shape: 'ellipse', cx: 0.78, cy: 0.28, rx: 0.1, ry: 0.08, label: '节点 · 上雀', text: '第一只山雀高踞枝梢，是动势的起音。' },
      { id: 's-m2', kind: 'mask', shape: 'ellipse', cx: 0.58, cy: 0.46, rx: 0.12, ry: 0.1, label: '节点 · 俯鸣', text: '张翅俯鸣之雀居中转折，把上方的动势导向下方。' },
      { id: 's-m3', kind: 'mask', shape: 'ellipse', cx: 0.32, cy: 0.82, rx: 0.16, ry: 0.12, label: '节点 · 回首野兔', text: '野兔在低处回首应声，是之字的收束，一俯一仰完成隔空对话。' },
      { id: 's-f', kind: 'focus', shape: 'crosshair', x: 0.58, y: 0.44, label: '张力中枢', text: '中间这只雀的朝向与动势最猛：它一转身，上下两端才被连成一口气。' }
    ]
  },
  {
    id: 'sp-fuchun-sdong',
    compositionId: 'sdongshi',
    artworkId: 'dwelling-fuchun',
    thesis: '长卷以水脉岸线的 S 形穿插推进，起承转合不在情节里，而在山势水形里。',
    annotations: [
      { id: 'u-g1', kind: 'guide', shape: 'polyline', points: [{ x: 0.94, y: 0.8 }, { x: 0.7, y: 0.88 }, { x: 0.45, y: 0.78 }, { x: 0.22, y: 0.87 }, { x: 0.05, y: 0.79 }], label: '水脉 · S 形动线', text: '江岸左右摆动、水面时宽时窄，目光被 S 形水脉带着在卷中行走，是为「龙脉」。' },
      { id: 'u-m1', kind: 'mask', shape: 'ellipse', cx: 0.5, cy: 0.79, rx: 0.46, ry: 0.06, label: '远岸起伏', text: '远山低缓、时隐时现，构成 S 线上沿的一串弱拍。' },
      { id: 'u-m2', kind: 'mask', shape: 'ellipse', cx: 0.42, cy: 0.93, rx: 0.4, ry: 0.07, label: '近坡承接', text: '近处坡石与树亭在下沿承托，与远岸错动，夹出中段弯曲的江流。' },
      { id: 'u-f', kind: 'focus', shape: 'crosshair', x: 0.73, y: 0.72, label: '江行渔舟', text: '一叶渔舟点在水脉转折处，给流动的构图一个可停留的视觉驿站。' }
    ]
  }
]

/* ============================================================
   索引与校验：构图层不复制作品，只持有 artworkId；
   索引在前端与服务端由同一份作品集合构建（服务不可达时前端无缝兜底）。
   ============================================================ */

const GUIDE_SHAPES = new Set(['line', 'arrow', 'polyline'])
const MASK_SHAPES = new Set(['rect', 'polygon', 'ellipse'])
const FOCUS_SHAPES = new Set(['crosshair'])
const KIND_LABELS = { guide: '辅助线', mask: '区域遮罩', focus: '视觉中心' }

export function getComposition(id) {
  return compositions.find((item) => item.id === id) ?? null
}

export function annotationKindLabel(kind) {
  return KIND_LABELS[kind] ?? kind
}

function pointsOf(annotation) {
  if (annotation.shape === 'rect') {
    return [
      { x: annotation.x, y: annotation.y },
      { x: annotation.x + annotation.w, y: annotation.y + annotation.h }
    ]
  }
  if (annotation.shape === 'ellipse') {
    return [{ x: annotation.cx - annotation.rx, y: annotation.cy - annotation.ry }, { x: annotation.cx + annotation.rx, y: annotation.cy + annotation.ry }]
  }
  if (annotation.shape === 'crosshair') return [{ x: annotation.x, y: annotation.y }]
  if (annotation.shape === 'line' || annotation.shape === 'arrow') return [annotation.from, annotation.to]
  return annotation.points ?? []
}

/** 标注在归一化坐标下的包围盒（用于「放大到该区域」）。 */
export function annotationBounds(annotation) {
  const points = pointsOf(annotation)
  if (!points.length) return { x: 0, y: 0, w: 1, h: 1 }
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  return { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY }
}

/** 标注的热点锚点（编号按钮位置；数据可用 anchor 显式覆盖）。 */
export function annotationAnchor(annotation) {
  if (annotation.anchor) return annotation.anchor
  if (annotation.shape === 'crosshair') return { x: annotation.x, y: annotation.y }
  if (annotation.shape === 'ellipse') return { x: annotation.cx, y: annotation.cy }
  if (annotation.shape === 'rect') return { x: annotation.x + annotation.w / 2, y: annotation.y + annotation.h / 2 }
  if (annotation.shape === 'line' || annotation.shape === 'arrow') {
    return { x: (annotation.from.x + annotation.to.x) / 2, y: (annotation.from.y + annotation.to.y) / 2 }
  }
  const points = annotation.points ?? []
  if (annotation.shape === 'polyline') return points[Math.floor(points.length / 2)] ?? { x: 0.5, y: 0.5 }
  const bounds = annotationBounds(annotation)
  return { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 }
}

function isUnitPoint(point) {
  return point && Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1
}

function validateAnnotation(annotation) {
  const problems = []
  if (!annotation.id) problems.push('缺少 id')
  if (!KIND_LABELS[annotation.kind]) problems.push(`未知类型 ${annotation.kind}`)
  if (!annotation.label) problems.push('缺少 label')
  if (!annotation.text) problems.push('缺少解释文字')
  const shapes = annotation.kind === 'guide' ? GUIDE_SHAPES : annotation.kind === 'mask' ? MASK_SHAPES : FOCUS_SHAPES
  if (!shapes.has(annotation.shape)) problems.push(`类型 ${annotation.kind} 不支持形状 ${annotation.shape}`)
  for (const point of pointsOf(annotation)) {
    if (!isUnitPoint(point)) problems.push('坐标超出 0~1 或字段缺失')
  }
  if (annotation.arrow && !isUnitPoint(annotation.arrow.from)) problems.push('附带箭头起点非法')
  if (annotation.arrow && !isUnitPoint(annotation.arrow.to)) problems.push('附带箭头终点非法')
  return problems
}

/**
 * 由作品集合构建「构图法 → 标本」索引并完成全部数据校验。
 * 标本引用的 artworkId 必须在作品集合中存在（悬空引用告警）。
 */
export function buildCompositionIndex(artworkRows) {
  const byComposition = new Map(compositions.map((item) => [item.id, []]))
  const warnings = []
  const knownArtworks = new Set((artworkRows ?? []).map((artwork) => artwork?.id).filter(Boolean))
  const seenSpecimen = new Set()
  const shapeUsage = { guide: new Set(), mask: new Set(), focus: new Set() }
  const counts = []

  for (const specimen of specimens) {
    if (seenSpecimen.has(specimen.id)) {
      warnings.push({ type: 'duplicate-specimen', specimenId: specimen.id, message: `标本「${specimen.id}」重复。` })
      continue
    }
    seenSpecimen.add(specimen.id)

    if (!byComposition.has(specimen.compositionId)) {
      warnings.push({ type: 'unknown-composition', specimenId: specimen.id, message: `标本「${specimen.id}」引用了未知构图法。` })
      continue
    }
    if (!knownArtworks.has(specimen.artworkId)) {
      warnings.push({ type: 'unknown-artwork', specimenId: specimen.id, artworkId: specimen.artworkId, message: `标本「${specimen.id}」引用的作品不存在。` })
    }
    if (!Array.isArray(specimen.annotations) || specimen.annotations.length < 2) {
      warnings.push({ type: 'too-few-annotations', specimenId: specimen.id, message: `标本「${specimen.id}」标注少于 2 个。` })
    }
    const seenAnnotation = new Set()
    for (const annotation of specimen.annotations ?? []) {
      if (seenAnnotation.has(annotation.id)) warnings.push({ type: 'duplicate-annotation', specimenId: specimen.id, annotationId: annotation.id, message: '标注 id 重复。' })
      seenAnnotation.add(annotation.id)
      for (const problem of validateAnnotation(annotation)) {
        warnings.push({ type: 'bad-annotation', specimenId: specimen.id, annotationId: annotation.id, message: `标注「${annotation.label ?? annotation.id}」：${problem}` })
      }
      shapeUsage[annotation.kind]?.add(annotation.shape)
    }
    counts.push(specimen.annotations?.length ?? 0)
    byComposition.get(specimen.compositionId).push(specimen.id)
  }

  const specimenCounts = Object.fromEntries(compositions.map((item) => [item.id, byComposition.get(item.id).length]))
  return {
    idsByComposition: byComposition,
    specimenCounts,
    annotationCounts: counts,
    distinctAnnotationCounts: new Set(counts),
    shapeUsage: Object.fromEntries(Object.entries(shapeUsage).map(([kind, set]) => [kind, [...set]])),
    warnings
  }
}

/** 由 ID 解析构图法下的标本对象数组（按声明顺序）。 */
export function selectSpecimens(compositionId) {
  return specimens.filter((specimen) => specimen.compositionId === compositionId)
}

export function getSpecimen(id) {
  return specimens.find((specimen) => specimen.id === id) ?? null
}
