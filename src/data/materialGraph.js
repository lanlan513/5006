// 中国工艺美术 · 关系型本地数据层
// ---------------------------------------------------------------------------
// 实体表：materials（材料）/ crafts（工艺）/ works（器物）/ eras（历史时期）
// 关系表：materialCrafts（材料×工艺）/ craftWorks（工艺×器物）/ workMaterials（器物×材料）
// works.eraId 是指向 eras 的外键。
// 一件器物可关联多种材料（workMaterials 多对多），一种材料也可出现在多件器物中，
// 因此关联一律通过关系表表达，而不是在实体上挂单一分类字段。
// 下方的索引与查询函数充当“视图”，对界面隐藏关联细节。

export const NODE_TYPES = ['material', 'craft', 'work', 'era']

export const NODE_TYPE_LABELS = {
  material: '材料',
  craft: '工艺',
  work: '器物',
  era: '时期'
}

// ---- 表：历史时期 -----------------------------------------------------------

export const eras = [
  { id: 'neolithic', label: '新石器时代', range: '约前 10000 — 前 2070', summary: '陶器与玉器几乎同时登场：一边是用火改变泥土，一边是用砂琢磨石头。材料工艺的两条主线在此汇合。' },
  { id: 'xian-qin', label: '先秦', range: '前 2070 — 前 221', summary: '青铜铸造达到高峰，漆器与丝织在礼制与日常之间展开，材料开始承载等级与信仰。' },
  { id: 'qin-han', label: '秦汉', range: '前 221 — 220', summary: '统一的帝国带来标准化的制作：玉衣、漆器与陶俑，指向规模化生产与丧葬礼制的结合。' },
  { id: 'wei-jin', label: '魏晋南北朝', range: '220 — 589', summary: '佛教东传带动金属造像与石窟营造，材料被赋予新的精神功能。' },
  { id: 'sui-tang', label: '隋唐', range: '581 — 907', summary: '青瓷成熟、三彩绚烂、金银器华美，开放的时代让材料与外来工艺彼此激发。' },
  { id: 'song', label: '宋', range: '960 — 1279', summary: '瓷器走向单色釉的极致，缂丝与刺绣把绘画语言移植进织物。' },
  { id: 'yuan', label: '元', range: '1271 — 1368', summary: '青花在景德镇成熟，钴料与釉下彩开启了瓷器的新纪元。' },
  { id: 'ming', label: '明', range: '1368 — 1644', summary: '永宣青花、雕漆、明式家具与顾绣：宫廷与文人趣味共同塑造了工艺的精致化。' },
  { id: 'qing', label: '清', range: '1644 — 1911', summary: '织造、雕刻与宫廷造办体系达到繁复的顶峰，材料的表现力被推向极限。' }
]

// ---- 表：材料 ---------------------------------------------------------------

export const materials = [
  {
    id: 'clay',
    name: '陶土',
    char: '陶',
    accent: '#b9795b',
    summary: '可塑的泥土经火而定型。陶土是最古老的工艺材料之一，从日用器皿到宫廷瓷器，承载着最漫长的技术积累。',
    properties: [
      { name: '可塑成型', text: '湿润时可任意塑形，干燥后保持形态，为成型提供最大自由。' },
      { name: '火烧硬化', text: '经 800–1300°C 烧成，由土化为陶、瓷，过程不可逆。' },
      { name: '矿物呈色', text: '铁、钴等呈色剂让釉下与釉上产生丰富的色彩层次。' }
    ],
    processing: [
      { name: '淘洗练泥', text: '去除杂质，揉练排气，使泥料均匀致密。' },
      { name: '成型', text: '拉坯、模印或泥条盘筑，赋予器物初始形态。' },
      { name: '施釉装饰', text: '化妆土、青花料或色釉，决定器物的表面表情。' },
      { name: '入窑烧成', text: '控制温度与气氛，完成从泥到器的最后转化。' }
    ]
  },
  {
    id: 'jade',
    name: '玉石',
    char: '玉',
    accent: '#788f8b',
    summary: '“石之美者”。玉的高硬度决定了它只能被“琢磨”而非雕刻，缓慢的手工让玉器自带时间的重量。',
    properties: [
      { name: '高硬度', text: '莫氏 6–6.5 度，金属刀具无法直接切削，需以解玉砂间接加工。' },
      { name: '纤维交织结构', text: '韧性强、不易崩裂，适合精细的镂空与薄胎。' },
      { name: '温润光泽', text: '抛光后呈油脂光泽，被传统文化视为德行的象征。' }
    ],
    processing: [
      { name: '开料', text: '以绳锯或砣具蘸解玉砂，将玉料切割成坯。' },
      { name: '琢磨', text: '砣机旋转带动砂粒，逐步磨出造型与纹样。' },
      { name: '钻孔镂空', text: '管钻取芯，搜弓镂出透空的细节。' },
      { name: '抛光', text: '以细砂与皮革反复打磨，呈现温润光泽。' }
    ]
  },
  {
    id: 'wood',
    name: '木材',
    char: '木',
    accent: '#a98765',
    summary: '有纹理、会呼吸的材料。顺纹与逆纹、干缩与湿胀，都要求工匠顺着木性去设计结构与装饰。',
    properties: [
      { name: '纹理方向性', text: '顺纹强度高、逆纹易劈裂，设计须因材施艺。' },
      { name: '干缩湿胀', text: '含水率变化引起形变，榫卯结构为此预留了余地。' },
      { name: '易于切削', text: '可雕、可刨、可接，是加工方式最丰富的材料之一。' }
    ],
    processing: [
      { name: '干燥', text: '自然阴干或窑干，稳定木性，防止开裂变形。' },
      { name: '开料刨平', text: '依纹理下锯，刨出平整的基准面。' },
      { name: '榫卯接合', text: '以凹凸构件相互咬合，不用一钉一胶。' },
      { name: '雕刻打磨', text: '线刻、浮雕、透雕，再以刮磨呈现木色。' }
    ]
  },
  {
    id: 'lacquer',
    name: '漆',
    char: '漆',
    accent: '#a34a3a',
    summary: '从漆树采割的天然树脂。层层髹涂、层层荫干，漆以时间为代价换取深度，再以雕刻或彩绘释放层次。',
    properties: [
      { name: '天然树脂', text: '漆酚氧化聚合成膜，坚硬耐久，可传世数千年。' },
      { name: '层层成膜', text: '每层仅数十微米，厚漆需数十乃至上百道髹涂。' },
      { name: '耐腐防潮', text: '成膜后耐酸碱、耐水，是胎体最可靠的保护层。' }
    ],
    processing: [
      { name: '制胎', text: '以木、竹或夹纻做成胎体，决定器物的骨架。' },
      { name: '裱布刮灰', text: '裱糊麻布、刮漆灰找平，强化胎体。' },
      { name: '髹涂荫干', text: '每髹一层需在荫室中缓慢干燥，急不得。' },
      { name: '雕刻彩绘', text: '剔红、戗金或描彩，在漆层上完成装饰。' }
    ]
  },
  {
    id: 'metal',
    name: '金属',
    char: '金',
    accent: '#b08d57',
    summary: '可熔、可铸、可锻。青铜的庄重、金银的华美，金属工艺在范铸与锻打之间建立了礼制与装饰的双重传统。',
    properties: [
      { name: '熔铸成型', text: '加热熔融后浇入范模，可成复杂器形。' },
      { name: '延展锻打', text: '金、银、铜可被锤揲成薄片，或拉拔成细丝。' },
      { name: '氧化包浆', text: '表面随时间生成锈色与包浆，记录岁月。' }
    ],
    processing: [
      { name: '冶炼配料', text: '控制铜锡铅比例，调整合金的硬度与色泽。' },
      { name: '范铸', text: '制模、翻范、浇铸，一次成型。' },
      { name: '锻打焊接', text: '锤揲成型，分铸部件再焊接组合。' },
      { name: '表面装饰', text: '鎏金、错金银、錾刻，赋予金属第二层表情。' }
    ]
  },
  {
    id: 'silk',
    name: '丝织物',
    char: '丝',
    accent: '#7a8798',
    summary: '蚕茧抽出的连续长丝。经纬交织之间，丝织物把绘画、书法与纹样织进可以穿着的时间。',
    properties: [
      { name: '蛋白纤维', text: '光泽柔和，亲肤而强韧，单根茧丝可达千米。' },
      { name: '经纬可织', text: '经线纬线的交织方式，决定织物的结构与纹样。' },
      { name: '易于染色', text: '对植物与矿物染料有良好亲和力，色谱宽广。' }
    ],
    processing: [
      { name: '缫丝', text: '煮茧索绪，将茧丝集束成生丝。' },
      { name: '练染', text: '脱胶练白，再以植物染料浸染成色。' },
      { name: '整经上机', text: '排列经线，装机准备织造。' },
      { name: '织造刺绣', text: '织锦、缂丝或以针代笔，完成图案。' }
    ]
  }
]

// ---- 表：工艺 ---------------------------------------------------------------

export const crafts = [
  { id: 'painted-pottery', name: '彩陶绘制', summary: '在陶坯上以矿物颜料绘出纹样，经火烧成后色彩与胎体融为一体。', process: ['制坯', '打磨', '绘彩', '烧成'] },
  { id: 'porcelain', name: '制瓷', summary: '以高岭土制胎、施釉高温烧成。从拉坯到利坯，每一步都在控制泥土的脾气。', process: ['练泥', '拉坯', '利坯', '施釉', '烧成'] },
  { id: 'blue-white', name: '青花绘制', summary: '以钴料在瓷胎上作画，罩透明釉后高温烧成，蓝白之间形成水墨般的层次。', process: ['淘炼钴料', '勾线分水', '罩釉', '高温烧成'] },
  { id: 'jade-carving', name: '玉雕', summary: '以砣具和解玉砂“琢磨”玉石，用缓慢换取精确，所谓“如切如磋，如琢如磨”。', process: ['相玉', '开料', '砣琢', '抛光'] },
  { id: 'wood-carving', name: '木雕', summary: '依木纹下刀，圆雕、浮雕与透雕层层递进，让木材长出新的形态。', process: ['选材', '打坯', '修光', '打磨'] },
  { id: 'joinery', name: '榫卯', summary: '以凹凸构件咬合连接木件，不用钉胶而牢固数百年，是木作的结构智慧。', process: ['画线', '开榫', '凿卯', '试装'] },
  { id: 'carved-lacquer', name: '雕漆', summary: '在胎体上髹涂数十至上百层漆，待其半干时入刀雕刻，纹样在厚度中起伏。', process: ['制胎', '髹漆', '画样', '雕刻', '磨显'] },
  { id: 'painted-lacquer', name: '髹漆彩绘', summary: '以漆为地、以彩为绘，在漆膜表面描绘纹样，色彩被漆层保护而千年不褪。', process: ['制胎', '髹地', '彩绘', '罩漆'] },
  { id: 'bronze-casting', name: '青铜铸造', summary: '制模翻范、浇铸成型，块范法让复杂的礼器与面具得以精确复制与放大。', process: ['制模', '翻范', '浇铸', '修整'] },
  { id: 'gilding', name: '鎏金', summary: '将金汞合剂涂于铜器表面，加热驱汞留金，使器物获得金色的保护层。', process: ['制金泥', '涂抹', '烘烤', '压光'] },
  { id: 'brocade', name: '织锦', summary: '以彩色经纬线在织机上直接织出纹样，妆花与织金让图案随织物一同生长。', process: ['纹样设计', '挑花结本', '整经', '织造'] },
  { id: 'kesi', name: '缂丝', summary: '“通经断纬”：纬线只在图案需要处往返，织成的画面如刀刻般边界分明。', process: ['描稿', '配线', '缂织', '修整'] },
  { id: 'embroidery', name: '刺绣', summary: '以针代笔、以线代墨，劈丝配色，在绢面上再现绘画的笔意与光色。', process: ['上绷', '劈丝', '施针', '装裱'] }
]

// ---- 表：器物（代表作品） -----------------------------------------------------

export const works = [
  {
    id: 'painted-pottery-basin',
    title: '人面鱼纹彩陶盆',
    maker: '仰韶文化陶工',
    eraId: 'neolithic',
    location: '中国国家博物馆',
    summary: '人面与鱼纹在盆内壁构成神秘的组合，是彩陶时代最具想象力的图像之一。',
    detail: '以黑彩绘于陶盆内壁，人面圆睁双目，嘴角衔鱼。纹样可能与渔猎祈愿或氏族信仰有关。陶土在这里第一次不只是容器，也是图像的载体。'
  },
  {
    id: 'jade-cong',
    title: '神人兽面纹玉琮',
    maker: '良渚文化玉工',
    eraId: 'neolithic',
    location: '浙江省博物馆',
    summary: '外方内圆的玉琮以微刻的神徽统领四角，是良渚礼制与玉作工艺的双重高峰。',
    detail: '琮体射部规整，神人兽面纹以极细的阴线刻出，一毫米之内可刻数道线条。在没有金属工具的时代，玉工以砂与砣完成了近乎不可能的精度。'
  },
  {
    id: 'bronze-mask',
    title: '青铜纵目面具',
    maker: '三星堆祭祀区',
    eraId: 'xian-qin',
    location: '四川广汉三星堆博物馆',
    summary: '夸张的双眼把凝视推向神话，器物尺度之外，是一个文明对观看的想象。',
    detail: '面具眼球呈柱状外凸，耳廓向两侧展开。分铸焊接的工艺让超比例的造型成为可能，青铜在此被赋予了沟通人神的功能。'
  },
  {
    id: 'painted-lacquer-lian',
    title: '彩绘凤鸟纹漆奁',
    maker: '楚国漆工',
    eraId: 'xian-qin',
    location: '湖北省博物馆',
    summary: '木胎之上层层髹漆，凤鸟纹在朱黑之间回旋，楚人的浪漫被漆膜保存至今。',
    detail: '奁为古代盛妆之器。木胎裱布后髹黑漆为地，以朱、黄彩绘凤鸟与云气。漆的耐腐性使这件两千多年前的器物至今仍色泽鲜明。'
  },
  {
    id: 'jade-suit',
    title: '金缕玉衣',
    maker: '汉代玉作与金作',
    eraId: 'qin-han',
    location: '河北博物院',
    summary: '两千余片玉片以金丝编缀成衣，玉与金在一具葬具上完成了最高规格的会合。',
    detail: '玉片经开料、钻孔、磨光，四角穿孔以金丝连缀。一件玉衣需要一名玉工十余年的工时，是“玉可护尸”观念与金工技术的共同产物。'
  },
  {
    id: 'gilt-buddha',
    title: '鎏金铜佛坐像',
    maker: '北魏造像工匠',
    eraId: 'wei-jin',
    location: '故宫博物院',
    summary: '铜胎鎏金，火焰纹背光升腾，佛教造像在北方找到了金属的表达方式。',
    detail: '以青铜分铸身像与背光，再通体鎏金。金层既保护铜胎，也让佛像在烛光中呈现“金色身”的庄严——材料直接参与了信仰的表达。'
  },
  {
    id: 'yue-celadon',
    title: '越窑青瓷莲花碗',
    maker: '越窑窑工',
    eraId: 'sui-tang',
    location: '故宫博物院',
    summary: '“九秋风露越窑开，夺得千峰翠色来”——青瓷把釉色烧成了山色。',
    detail: '以铁为呈色剂的青釉在高温还原焰中烧成，釉色如冰似玉。莲花瓣的刻花在釉下若隐若现，是唐五代越窑“秘色”传统的代表。'
  },
  {
    id: 'kesi-landscape',
    title: '缂丝山水图轴',
    maker: '宋代缂丝艺人',
    eraId: 'song',
    location: '辽宁省博物馆',
    summary: '以织代画：山石的皴法与云雾的留白，全部由纬线的往返完成。',
    detail: '缂丝“通经断纬”，每一色块独立织就，边界如刀切。宋代缂丝由实用转向欣赏，把绘画的笔墨语言翻译成了织物的结构。'
  },
  {
    id: 'yuan-blue-white-jar',
    title: '青花鬼谷子下山图罐',
    maker: '景德镇窑',
    eraId: 'yuan',
    location: '私人收藏',
    summary: '进口钴料与景德镇瓷胎相遇，人物故事第一次在瓷器上完整展开。',
    detail: '罐身以苏麻离青料绘鬼谷子下山故事，发色浓艳处可见铁锈斑。元青花把绘画、文学与制瓷合为一体，开启了釉下彩的时代。'
  },
  {
    id: 'blue-white-vase',
    title: '青花缠枝莲纹梅瓶',
    maker: '景德镇窑',
    eraId: 'ming',
    location: '故宫博物院',
    summary: '青花在白釉上留下可辨认的呼吸，缠枝莲纹在瓶肩与瓶腹间连续展开。',
    detail: '胎体匀净，青料发色浓艳。器形与绘画共同构成明代宫廷的秩序感，是永乐青花“发旷古之未有”的代表。'
  },
  {
    id: 'carved-lacquer-box',
    title: '剔红花鸟纹圆盒',
    maker: '果园厂雕漆作',
    eraId: 'ming',
    location: '台北故宫博物院',
    summary: '数十层漆的厚度给花鸟纹制造出微小的山谷，触觉在这里变成了观看。',
    detail: '木胎上髹朱漆百余道，半干时入刀。刀锋切入漆层的深浅决定花叶的起伏，漆的时间成本在宣德果园厂被推向极致。'
  },
  {
    id: 'gu-embroidery',
    title: '顾绣花鸟册',
    maker: '韩希孟（传）',
    eraId: 'ming',
    location: '上海博物馆',
    summary: '以针代笔、以丝代墨，顾绣把文人画的笔意绣进了绢素。',
    detail: '露香园顾绣劈丝极细，配色典雅，常以宋元名画为稿。丝线的光泽随观看角度变化，使绣面产生了绘画所没有的微光。'
  },
  {
    id: 'huanghuali-chair',
    title: '黄花梨圈椅',
    maker: '苏州木作',
    eraId: 'ming',
    location: '上海博物馆',
    summary: '一根圆材弯成椅圈，榫卯让曲线与结构合而为一，是明式家具的骨架之美。',
    detail: '椅圈以楔钉榫接合，靠背板浮雕如意纹。黄花梨的纹理与色泽被尽量保留，工匠以“少即是多”的克制呈现木材本身的美。'
  },
  {
    id: 'yunjin-robe',
    title: '明黄地织金云龙纹袍料',
    maker: '南京云锦织机',
    eraId: 'qing',
    location: '南京云锦博物馆',
    summary: '真金捻线与彩色丝绒同织，云锦把“寸锦寸金”变成可以穿着的现实。',
    detail: '以妆花工艺逐花异色，金线织出云龙。两名织工在大花楼织机上相互配合，一天仅能织出数厘米——材料与工时同样昂贵。'
  },
  {
    id: 'zitan-throne',
    title: '紫檀雕云龙纹宝座',
    maker: '清宫造办处',
    eraId: 'qing',
    location: '故宫博物院',
    summary: '紫檀的深沉色泽上，云龙纹以高浮雕盘旋而出，是宫廷木作的权力尺度。',
    detail: '紫檀木质致密、色泽沉穆。宝座通体高浮雕云龙，刀法圆熟。木材的物理特性——硬度与分量——在此被直接转化为威仪。'
  }
]

// ---- 关系表 -----------------------------------------------------------------

// 材料 × 工艺：一种材料可由多种工艺处理，一种工艺也可用于多种材料
export const materialCrafts = [
  { materialId: 'clay', craftId: 'painted-pottery', note: '陶坯是彩绘的底本，火让颜色与胎体合一。' },
  { materialId: 'clay', craftId: 'porcelain', note: '高岭土与高温，是瓷器诞生的两个前提。' },
  { materialId: 'clay', craftId: 'blue-white', note: '瓷胎如纸，钴料如墨。' },
  { materialId: 'jade', craftId: 'jade-carving', note: '玉的硬度决定了只能“琢”，不能“雕”。' },
  { materialId: 'wood', craftId: 'wood-carving', note: '顺纹下刀，木纹本身参与构图。' },
  { materialId: 'wood', craftId: 'joinery', note: '以结构代替钉胶，为木材的胀缩留出余地。' },
  { materialId: 'lacquer', craftId: 'carved-lacquer', note: '层层髹涂积累的厚度，正是雕刻的空间。' },
  { materialId: 'lacquer', craftId: 'painted-lacquer', note: '漆膜既是底色，也是保护层。' },
  { materialId: 'metal', craftId: 'bronze-casting', note: '范铸让青铜获得礼器的庄重形体。' },
  { materialId: 'metal', craftId: 'gilding', note: '金与铜的结合，让造像有了“金色身”。' },
  { materialId: 'silk', craftId: 'brocade', note: '纹样与织物同时长成。' },
  { materialId: 'silk', craftId: 'kesi', note: '纬线的往返，织出如刻的画面。' },
  { materialId: 'silk', craftId: 'embroidery', note: '以针代笔，丝线即笔墨。' }
]

// 工艺 × 器物：一件器物可集合多种工艺，一种工艺也体现在多件器物上
export const craftWorks = [
  { craftId: 'painted-pottery', workId: 'painted-pottery-basin' },
  { craftId: 'porcelain', workId: 'yue-celadon' },
  { craftId: 'porcelain', workId: 'yuan-blue-white-jar' },
  { craftId: 'porcelain', workId: 'blue-white-vase' },
  { craftId: 'blue-white', workId: 'yuan-blue-white-jar' },
  { craftId: 'blue-white', workId: 'blue-white-vase' },
  { craftId: 'jade-carving', workId: 'jade-cong' },
  { craftId: 'jade-carving', workId: 'jade-suit' },
  { craftId: 'wood-carving', workId: 'huanghuali-chair' },
  { craftId: 'wood-carving', workId: 'zitan-throne' },
  { craftId: 'joinery', workId: 'huanghuali-chair' },
  { craftId: 'carved-lacquer', workId: 'carved-lacquer-box' },
  { craftId: 'painted-lacquer', workId: 'painted-lacquer-lian' },
  { craftId: 'bronze-casting', workId: 'bronze-mask' },
  { craftId: 'bronze-casting', workId: 'gilt-buddha' },
  { craftId: 'gilding', workId: 'gilt-buddha' },
  { craftId: 'brocade', workId: 'yunjin-robe' },
  { craftId: 'kesi', workId: 'kesi-landscape' },
  { craftId: 'embroidery', workId: 'gu-embroidery' }
]

// 器物 × 材料：一件器物往往由多种材料构成，role 记录材料在器物中扮演的角色
export const workMaterials = [
  { workId: 'painted-pottery-basin', materialId: 'clay', role: '陶胎' },
  { workId: 'jade-cong', materialId: 'jade', role: '主体玉料' },
  { workId: 'bronze-mask', materialId: 'metal', role: '青铜铸体' },
  { workId: 'painted-lacquer-lian', materialId: 'lacquer', role: '表面髹饰' },
  { workId: 'painted-lacquer-lian', materialId: 'wood', role: '木胎' },
  { workId: 'jade-suit', materialId: 'jade', role: '玉片' },
  { workId: 'jade-suit', materialId: 'metal', role: '金丝编缀' },
  { workId: 'gilt-buddha', materialId: 'metal', role: '铜胎鎏金' },
  { workId: 'yue-celadon', materialId: 'clay', role: '瓷胎' },
  { workId: 'kesi-landscape', materialId: 'silk', role: '经纬丝线' },
  { workId: 'yuan-blue-white-jar', materialId: 'clay', role: '瓷胎' },
  { workId: 'blue-white-vase', materialId: 'clay', role: '瓷胎' },
  { workId: 'carved-lacquer-box', materialId: 'lacquer', role: '剔红漆层' },
  { workId: 'carved-lacquer-box', materialId: 'wood', role: '木胎' },
  { workId: 'gu-embroidery', materialId: 'silk', role: '绢地与绣线' },
  { workId: 'huanghuali-chair', materialId: 'wood', role: '黄花梨' },
  { workId: 'yunjin-robe', materialId: 'silk', role: '经纬丝线' },
  { workId: 'yunjin-robe', materialId: 'metal', role: '织金线' },
  { workId: 'zitan-throne', materialId: 'wood', role: '紫檀' }
]

// ---- 索引（主键索引 + 关系索引） ----------------------------------------------

const materialById = new Map(materials.map((material) => [material.id, material]))
const craftById = new Map(crafts.map((craft) => [craft.id, craft]))
const workById = new Map(works.map((work) => [work.id, work]))
const eraById = new Map(eras.map((era) => [era.id, era]))

function groupBy(collection, key) {
  const index = new Map()
  for (const item of collection) {
    const groupKey = item[key]
    if (!index.has(groupKey)) index.set(groupKey, [])
    index.get(groupKey).push(item)
  }
  return index
}

const craftsByMaterialId = groupBy(materialCrafts, 'materialId')
const materialsByCraftId = groupBy(materialCrafts, 'craftId')
const worksByCraftId = groupBy(craftWorks, 'craftId')
const craftsByWorkId = groupBy(craftWorks, 'workId')
const materialsByWorkId = groupBy(workMaterials, 'workId')
const worksByMaterialId = groupBy(workMaterials, 'materialId')
const worksByEraId = groupBy(works, 'eraId')

// ---- 查询（视图层） ------------------------------------------------------------

export const listMaterials = () => materials
export const listEras = () => eras
export const getMaterial = (id) => materialById.get(id) ?? null
export const getCraft = (id) => craftById.get(id) ?? null
export const getWork = (id) => workById.get(id) ?? null
export const getEra = (id) => eraById.get(id) ?? null

// 材料 → 工艺（带关系说明）
export function getCraftsOfMaterial(materialId) {
  return (craftsByMaterialId.get(materialId) ?? [])
    .map((edge) => ({ craft: craftById.get(edge.craftId), note: edge.note }))
    .filter((entry) => entry.craft)
}

// 材料 → 器物（带材料角色）
export function getWorksOfMaterial(materialId) {
  return (worksByMaterialId.get(materialId) ?? [])
    .map((edge) => ({ work: workById.get(edge.workId), role: edge.role }))
    .filter((entry) => entry.work)
}

// 材料 → 历史时期（经由器物推导，保持时期表顺序）
export function getErasOfMaterial(materialId) {
  const eraIds = new Set(getWorksOfMaterial(materialId).map(({ work }) => work.eraId))
  return eras.filter((era) => eraIds.has(era.id))
}

// 工艺 → 材料
export function getMaterialsOfCraft(craftId) {
  return (materialsByCraftId.get(craftId) ?? [])
    .map((edge) => ({ material: materialById.get(edge.materialId), note: edge.note }))
    .filter((entry) => entry.material)
}

// 工艺 → 器物
export function getWorksOfCraft(craftId) {
  return (worksByCraftId.get(craftId) ?? [])
    .map((edge) => workById.get(edge.workId))
    .filter(Boolean)
}

// 器物 → 材料（多重关联：一件器物可含多种材料）
export function getMaterialsOfWork(workId) {
  return (materialsByWorkId.get(workId) ?? [])
    .map((edge) => ({ material: materialById.get(edge.materialId), role: edge.role }))
    .filter((entry) => entry.material)
}

// 器物 → 工艺
export function getCraftsOfWork(workId) {
  return (craftsByWorkId.get(workId) ?? [])
    .map((edge) => craftById.get(edge.craftId))
    .filter(Boolean)
}

// 器物 → 历史时期（外键）
export function getEraOfWork(workId) {
  const work = workById.get(workId)
  return work ? eraById.get(work.eraId) ?? null : null
}

// 历史时期 → 器物
export function getWorksOfEra(eraId) {
  return [...(worksByEraId.get(eraId) ?? [])]
}

// 历史时期 → 工艺（经由器物推导）
export function getCraftsOfEra(eraId) {
  const seen = new Set()
  const result = []
  for (const work of getWorksOfEra(eraId)) {
    for (const craft of getCraftsOfWork(work.id)) {
      if (seen.has(craft.id)) continue
      seen.add(craft.id)
      result.push(craft)
    }
  }
  return result
}

// 器物主色：取第一种关联材料的代表色，用于图谱可视化
export function getWorkAccent(workId) {
  const firstEdge = (materialsByWorkId.get(workId) ?? [])[0]
  return firstEdge ? materialById.get(firstEdge.materialId)?.accent ?? '#c79a6b' : '#c79a6b'
}

// 节点解析：面包屑、历史记录与路由共用的统一入口
export function resolveNode(node) {
  if (!node || typeof node !== 'object') return null
  const { type, id } = node
  if (type === 'material') {
    const material = getMaterial(id)
    return material ? { type, id, label: material.name, accent: material.accent } : null
  }
  if (type === 'craft') {
    const craft = getCraft(id)
    return craft ? { type, id, label: craft.name } : null
  }
  if (type === 'work') {
    const work = getWork(id)
    return work ? { type, id, label: work.title, accent: getWorkAccent(id) } : null
  }
  if (type === 'era') {
    const era = getEra(id)
    return era ? { type, id, label: era.label } : null
  }
  return null
}

export const graphStats = {
  materials: materials.length,
  crafts: crafts.length,
  works: works.length,
  eras: eras.length,
  relations: materialCrafts.length + craftWorks.length + workMaterials.length
}
