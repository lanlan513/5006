/**
 * 作品数据（单一事实来源）
 * ------------------------
 * 绘画作品不直接“属于某个写死的列表”，而是用 subjectIds 指向画科分类法；
 * 同一件作品可带多个 subjectId（如《清明上河图》兼属人物与界画），
 * 前端由 buildTaxonomy() 反向生成分类结果，作品记录始终只存一份。
 *
 * image：外部图像地址（可缺省，缺失时进入图像缺失占位）
 * art：本地示意画的绘制描述符（离线可用，风格化呈现，不替代馆藏照片）
 */

export const domains = ['全部', '绘画', '书法', '雕塑', '陶瓷', '壁画', '工艺美术']

export const dynasties = [
  { name: '东晋', order: 1 },
  { name: '唐', order: 2 },
  { name: '南唐', order: 3 },
  { name: '五代', order: 4 },
  { name: '北宋', order: 5 },
  { name: '金', order: 6 },
  { name: '南宋', order: 7 },
  { name: '元', order: 8 },
  { name: '明', order: 9 }
]

export const artworks = [
  /* ---------------- 人物画 ---------------- */
  {
    id: 'nymph-luoshen',
    title: '洛神赋图（摹本）',
    artist: '顾恺之（传）',
    dynasty: '东晋',
    year: '东晋 · 约 4 世纪（宋摹本）',
    domain: '绘画',
    medium: '绢本设色 · 长卷',
    location: '故宫博物院（摹本之一）',
    subjectIds: ['figure'],
    matter: '依曹植《洛神赋》铺陈人神相恋的连续叙事',
    composition: '长卷分段，山水树石作为情节间隔',
    focus: '洛神衣袂飘举与“春蚕吐丝”般的高古游丝描',
    summary: '赋中文字逐段化为画面：相逢、赠佩、怅别，情绪随卷首向卷尾递进。',
    detail: '顾恺之主张“以形写神”。画中人物衣纹如春蚕吐丝，连绵匀细；车马、舟船与山水分割时间，是早期连环画式叙事的典范。',
    tags: ['高古游丝描', '长卷叙事', '传顾恺之'],
    art: { kind: 'figure', scene: 'river', figures: 4, props: ['fan', 'boat', 'screen'] },
    accent: '#8f6f52',
    order: 101
  },
  {
    id: 'ladies-flowers',
    title: '簪花仕女图',
    artist: '周昉',
    dynasty: '唐',
    year: '唐 · 8 世纪末',
    domain: '绘画',
    medium: '绢本设色 · 长卷',
    location: '辽宁省博物馆',
    subjectIds: ['figure'],
    matter: '盛唐宫廷贵妇的闲适生活',
    composition: '等距排列的人物群，以猧儿、白鹤、辛夷花串联',
    focus: '丰肌秀骨的体态与薄纱罗衫的质感',
    summary: '五位贵妇与一名侍女徐徐而行，逗犬、拈花、戏鹤，盛唐的雍容留在了线条与设色里。',
    detail: '画家以“绮罗人物”闻名。肌肤以白粉薄染，纱衣透体而不露骨；人物之间不靠背景相连，全凭顾盼姿态形成节奏。',
    tags: ['绮罗人物', '宫廷', '工笔重彩'],
    art: { kind: 'figure', scene: 'garden', figures: 5, props: ['flower', 'crane', 'fan'] },
    accent: '#b06f78',
    order: 102
  },
  {
    id: 'imperial-carriage',
    title: '步辇图',
    artist: '阎立本',
    dynasty: '唐',
    year: '唐 · 贞观十五年（641）',
    domain: '绘画',
    medium: '绢本设色 · 长卷',
    location: '故宫博物院（宋摹本）',
    subjectIds: ['figure'],
    matter: '唐太宗接见吐蕃使者禄东赞，记录文成公主和亲的历史时刻',
    composition: '左侧典礼人物庄重静立，右侧步辇宫女群形成动势',
    focus: '主大从小的尺度安排与身份威仪',
    summary: '没有背景，全靠人物的体量、神情和次序来讲政治。',
    detail: '唐太宗身形明显大于周围人物，这是等级而非透视。宫女的衣带横斜使步辇如在行进，左侧三人的肃立又把画面按住，动静相制。',
    tags: ['史传人物', '初唐', '纪实'],
    art: { kind: 'figure', scene: 'court', figures: 6, props: ['screen', 'fan'] },
    accent: '#9c6b4f',
    order: 103
  },
  {
    id: 'night-revels',
    title: '韩熙载夜宴图',
    artist: '顾闳中',
    dynasty: '南唐',
    year: '南唐 · 10 世纪',
    domain: '绘画',
    medium: '绢本设色 · 长卷',
    location: '故宫博物院（宋摹本）',
    subjectIds: ['figure'],
    matter: '大臣韩熙载夜宴宾客的五段场景，兼具政治窥视',
    composition: '听乐、观舞、休憩、清吹、散宴，以屏风切分时间',
    focus: '屏风的叙事功能与人物在不同段落中的神情',
    summary: '一扇屏风隔开一段时间，五个片段合起来是一场完整的夜。',
    detail: '画家奉南唐后主之命夜访默写而成。画卷反复出现的主人公在每段中神情各异；床帏、屏风既是家具，也是镜头的切换。',
    tags: ['屏风叙事', '顾闳中', '宴乐'],
    art: { kind: 'figure', scene: 'revel', figures: 6, props: ['screen', 'harp', 'candle'] },
    accent: '#7c5b68',
    order: 104
  },
  {
    id: 'wenji-return',
    title: '文姬归汉图',
    artist: '张瑀',
    dynasty: '金',
    year: '金 · 13 世纪',
    domain: '绘画',
    medium: '绢本设色 · 长卷',
    location: '吉林省博物院',
    subjectIds: ['figure'],
    matter: '蔡文姬由匈奴归汉途中的风雪行旅',
    composition: '横向队列迎风而行，留白即风沙弥漫',
    focus: '人马缩颈低伏的动态与风势的方向感',
    summary: '整卷几乎没有背景，却让人听见风声。',
    detail: '人物与马匹的衣冠、胡汉身份都有细致区分。旗旆与衣带统一倒向一侧，队列前倾，观者无需看见雪，也能感到塞外的寒。',
    tags: ['历史故事', '鞍马', '行旅'],
    art: { kind: 'figure', scene: 'procession', figures: 5, props: ['horse', 'banner'] },
    accent: '#8a7358',
    order: 105
  },
  {
    id: 'qingming-river',
    title: '清明上河图',
    artist: '张择端',
    dynasty: '北宋',
    year: '北宋 · 12 世纪初',
    domain: '绘画',
    medium: '绢本淡设色 · 长卷',
    location: '故宫博物院',
    subjectIds: ['figure', 'jiehua'],
    matter: '汴河沿岸市井百态与漕运繁华',
    composition: '郊野、虹桥、街市三段渐次展开，虹桥为全卷高潮',
    focus: '数百人物的营生细节与虹桥船桅的惊险一瞬',
    summary: '一件作品同时是人物画与界画：人是城市的呼吸，桥楼是城市的骨架。',
    detail: '全卷人物逾八百，舟车、楼阁、店招各有来历。虹桥下船工呼喝落桅的瞬间，与街景的从容形成张弛，是风俗画与界画共同的巅峰。',
    tags: ['风俗画', '虹桥', '多重归类'],
    subjectViews: {
      jiehua: {
        matter: '汴河漕船、虹桥与街市店铺的结构写实',
        composition: '以虹桥为轴，舟桥屋宇横向铺陈',
        focus: '拱形桥木结构与船身舱室的折算关系'
      }
    },
    art: { kind: 'jiehua', structure: 'bridge', figures: 6 },
    accent: '#9a7b56',
    order: 106
  },
  {
    id: 'grotto-deer',
    title: '莫高窟第257窟 · 九色鹿本生',
    artist: null,
    dynasty: '北魏',
    year: '北魏 · 439–534',
    domain: '壁画',
    medium: '壁画 · 矿物颜料',
    location: '敦煌研究院',
    subjectIds: ['figure'],
    matter: '九色鹿救人与告密的本生故事',
    composition: '长幅横卷式连续构图，两端情节向中间汇聚',
    focus: '平面化造型与矿物色的装饰性叙事',
    summary: '在洞窟的幽暗中，色彩沿着墙面讲故事。',
    detail: '画工佚名，却以土红、石青、石绿构筑了强烈的叙事节拍。人物与动物取侧面剪影式造型，山水仅作符号，正是早期壁画的天真力量。',
    tags: ['敦煌', '佛教艺术', '佚名'],
    art: { kind: 'figure', scene: 'mural', figures: 3, props: ['deer', 'river'] },
    accent: '#c07a4e',
    order: 107
  },
  {
    id: 'silk-fragment-unnamed',
    title: '彩绘人物绢本残片（未知名）',
    artist: null,
    dynasty: null,
    year: null,
    domain: '绘画',
    medium: '绢本设色（残）',
    location: '编目中',
    subjectIds: ['figure'],
    matter: null,
    composition: null,
    focus: '残存人物立像两身，余皆漫漶',
    summary: '新近入藏的残片，作者、年代与图像尚待考订，此处展示数据缺失时的界面状态。',
    detail: '该条目作者、年代与高清图像均暂缺。系统不会隐藏它，而是以占位信息保留著录位置；待研究补全后，同一条目自动更新，无需改动分类。',
    tags: ['待考', '残片', '数据缺失示例'],
    art: null,
    image: null,
    accent: '#8d8170',
    order: 199
  },

  /* ---------------- 山水画 ---------------- */
  {
    id: 'dwelling-fuchun',
    title: '富春山居图（剩山图）',
    artist: '黄公望',
    dynasty: '元',
    year: '元 · 至正十年（1350）前后',
    domain: '绘画',
    medium: '纸本水墨 · 长卷',
    location: '浙江省博物馆 / 台北故宫博物院',
    subjectIds: ['landscape'],
    matter: '富春江两岸秋景与文人可游可居的理想',
    composition: '平远展开，峰峦坡石疏朗相间',
    focus: '披麻皴与干笔淡墨的层次呼吸',
    summary: '墨色疏淡，却把时间的流动留在了山石之间。',
    detail: '画家师法董源而自出机杼，披麻皴下笔松灵。长卷宜缓读：江天、村舍、渔舟在留白里接续，观看本身就是一次行旅。此卷曾遭火殉，今分藏两岸。',
    tags: ['元四家', '文人画', '平远'],
    art: { kind: 'landscape', composition: 'flat', palette: 'ink', boats: true },
    accent: '#7d7a66',
    order: 201
  },
  {
    id: 'thousand-li',
    title: '千里江山图',
    artist: '王希孟',
    dynasty: '北宋',
    year: '北宋 · 政和三年（1113）',
    domain: '绘画',
    medium: '绢本青绿设色 · 长卷',
    location: '故宫博物院',
    subjectIds: ['landscape'],
    matter: '理想中的锦绣江山：峰峦、江海、村舍与长桥',
    composition: '高远与平远交替，七组山势起承转合',
    focus: '石青石绿的青绿设色与层层叠加的厚度',
    summary: '十八岁宫廷学生留下的唯一传世长卷，颜色九百年未冷。',
    detail: '画家先以墨笔勾皴，再多层罩染石青、石绿，山顶以赭石相接。长卷中点缀渔村、寺观、水磨，体量宏大而细节周密，是青绿山水的极则。',
    tags: ['青绿山水', '院体', '王希孟'],
    art: { kind: 'landscape', composition: 'high', palette: 'bluegreen', building: true },
    accent: '#4f8d7b',
    order: 202
  },
  {
    id: 'travelers-mountains',
    title: '溪山行旅图',
    artist: '范宽',
    dynasty: '北宋',
    year: '北宋 · 约 1000',
    domain: '绘画',
    medium: '绢本水墨 · 立轴',
    location: '台北故宫博物院',
    subjectIds: ['landscape'],
    matter: '关陕群山与山脚下的商旅',
    composition: '高远：巨峰居中压顶，飞瀑一线，旅人如蚁',
    focus: '雨点皴积出的山石质感与主峰的纪念碑性',
    summary: '人在画前，会真的觉得山要压下来。',
    detail: '范宽长期观照终南、太华山川，以短促密集的“雨点皴”堆出山石体积。近景巨石把观者挡在溪岸，中景飞瀑拉出纵深，主峰则几乎占去画面三分之二。',
    tags: ['北宋三家', '高远', '雨点皴'],
    art: { kind: 'landscape', composition: 'high', palette: 'ink' },
    accent: '#5d6b5f',
    order: 203
  },
  {
    id: 'early-spring',
    title: '早春图',
    artist: '郭熙',
    dynasty: '北宋',
    year: '北宋 · 熙宁五年（1072）',
    domain: '绘画',
    medium: '绢本水墨 · 立轴',
    location: '台北故宫博物院',
    subjectIds: ['landscape'],
    matter: '寒冬初解、万物将醒的山间春气',
    composition: '深远：自山前窥山后，云烟往来其间',
    focus: '卷云皴、蟹爪枝与“S”形龙脉的纵深',
    summary: '山是活的：云气在石缝与溪谷间流动。',
    detail: '郭熙著《林泉高致》提出三远。画中主峰扭转升腾，山石用卷云皴，枯枝如蟹爪下垂；楼阁藏于山腰，行旅点缀其下，深远法在此作中最为完备。',
    tags: ['三远', '卷云皴', '郭熙'],
    art: { kind: 'landscape', composition: 'deep', palette: 'ink', building: true },
    accent: '#6a7464',
    order: 204
  },
  {
    id: 'retreat-qingbian',
    title: '青卞隐居图',
    artist: '王蒙',
    dynasty: '元',
    year: '元 · 14 世纪',
    domain: '绘画',
    medium: '纸本水墨 · 立轴',
    location: '上海博物馆',
    subjectIds: ['landscape'],
    matter: '浙江卞山深处的隐所',
    composition: '深远密构：层峦叠嶂，几无留白',
    focus: '牛毛皴、解索皴交织出的繁密与骚动',
    summary: '王蒙把山画成一张密网，把自己藏在最深处。',
    detail: '同为元四家，黄公望疏，王蒙密。皴线如牛毛解索，层层盘旋向上；山间茅屋中一人抱膝而坐，正是乱世文人退隐心境的写照。',
    tags: ['元四家', '牛毛皴', '隐居'],
    art: { kind: 'landscape', composition: 'deep', palette: 'ink' },
    accent: '#67705c',
    order: 205
  },
  {
    id: 'fisherman-autumn',
    title: '渔庄秋霁图',
    artist: '倪瓒',
    dynasty: '元',
    year: '元 · 1355',
    domain: '绘画',
    medium: '纸本水墨 · 立轴',
    location: '上海博物馆',
    subjectIds: ['landscape'],
    matter: '太湖渔庄雨后秋晴',
    composition: '平远“一河两岸”：近树孤亭，中段大片空水',
    focus: '折带皴与极度留白中的清冷',
    summary: '画面一大半是空的，那是水面，也是心绪。',
    detail: '倪瓒画中从不出现人物。近景平坡上几株枯树、一座空亭，对岸一抹低山，中间大片留白不着一笔，把元画的“简”推到了尽头。',
    tags: ['元四家', '一河两岸', '折带皴'],
    art: { kind: 'landscape', composition: 'flat', palette: 'light', boats: true },
    accent: '#87918a',
    order: 206
  },
  {
    id: 'stomping-song',
    title: '踏歌图',
    artist: '马远',
    dynasty: '南宋',
    year: '南宋 · 12 世纪末',
    domain: '绘画',
    medium: '绢本设色 · 立轴',
    location: '故宫博物院',
    subjectIds: ['landscape'],
    matter: '丰年里田埂踏歌的农人',
    composition: '边角构图：奇峰削立一侧，大片云烟清空',
    focus: '“马一角”的斧劈皴与留白计白当黑',
    summary: '南宋把北宋的全景江山，收成了一角诗意。',
    detail: '马远常取山之一角、水之一涯。此图上半部奇峰如刀削，下半部田垅间老农踏歌，云气横隔使上下若即若离，斧劈皴方硬爽利。',
    tags: ['南宋四家', '边角', '斧劈皴'],
    art: { kind: 'landscape', composition: 'corner', palette: 'light' },
    accent: '#7b8289',
    order: 207
  },
  {
    id: 'pure-remote',
    title: '溪山清远图',
    artist: '夏圭',
    dynasty: '南宋',
    year: '南宋 · 13 世纪初',
    domain: '绘画',
    medium: '纸本水墨 · 长卷',
    location: '台北故宫博物院',
    subjectIds: ['landscape'],
    matter: '钱塘一带溪山无尽的江天旷景',
    composition: '边角拖长卷：景断意连，大片空江',
    focus: '拖泥带水皴与“夏半边”的空灵',
    summary: '笔走到一半停了，意却没有停。',
    detail: '夏圭与马远并称“马夏”。长卷上山石以湿笔连皴带染，树丛常取半边，舟帆、亭桥从空江里偶露一角，留白处皆是水声。',
    tags: ['南宋四家', '半边', '水墨苍劲'],
    art: { kind: 'landscape', composition: 'corner', palette: 'ink', boats: true },
    accent: '#6e7a78',
    order: 208
  },
  {
    id: 'wind-in-pines',
    title: '万壑松风图',
    artist: '李唐',
    dynasty: '北宋',
    year: '北宋 · 宣和六年（1124）',
    domain: '绘画',
    medium: '绢本设色 · 立轴',
    location: '台北故宫博物院',
    subjectIds: ['landscape'],
    matter: '深谷松林与奔泻的泉声',
    composition: '高远特写：主峰迫在眉睫，松涛满幅',
    focus: '小斧劈皴的刚劲与北南山水画风的转折',
    summary: '站在画前，仿佛能听见满谷松声。',
    detail: '李唐由北宋入南宋，此作作于南渡前夕，已开后来马夏斧劈皴的先声。山石用大小斧劈斫出，松干鳞皴、松针细密，泉瀑三重跌落。',
    tags: ['两宋之间', '斧劈皴', '松'],
    art: { kind: 'landscape', composition: 'high', palette: 'light' },
    accent: '#617060',
    order: 209
  },
  {
    id: 'auspicious-cranes',
    title: '瑞鹤图',
    artist: '赵佶（宋徽宗）',
    dynasty: '北宋',
    year: '北宋 · 政和二年（1112）',
    domain: '绘画',
    medium: '绢本设色 · 卷',
    location: '辽宁省博物馆',
    subjectIds: ['flower-bird', 'landscape'],
    matter: '二十只白鹤盘旋于汴京端门之上的祥瑞景象',
    composition: '下半宫檐一线，上半大片青空与群鹤回旋',
    focus: '鹤姿无一雷同，以及石青天空与白羽的对比',
    summary: '既是花鸟写生，也是以宫阙天空为景的山水构境。',
    detail: '徽宗记当日祥云忽起、群鹤来集，亲绘此图并题诗。画中只取屋脊鸱吻一线入画，把绝大部分空间让给天空与鹤阵，取景意识极为现代。',
    tags: ['瘦金体', '瑞应', '多重归类'],
    subjectViews: {
      landscape: {
        matter: '宫阙之上祥云瑞鹤的天空之景',
        composition: '屋脊压底、青空满幅的反向留白',
        focus: '群鹤在大面积天空中的节奏分布'
      }
    },
    art: { kind: 'flowerbird', motif: 'crane' },
    accent: '#5f7ea0',
    order: 210
  },
  {
    id: 'river-sails-pavilion',
    title: '江帆楼阁图',
    artist: '李思训（传）',
    dynasty: '唐',
    year: '唐 · 8 世纪（宋摹本）',
    domain: '绘画',
    medium: '绢本青绿设色 · 立轴',
    location: '台北故宫博物院',
    subjectIds: ['landscape', 'jiehua'],
    matter: '江天帆影与林间精严的楼阁',
    composition: '近景山阁临江，远景江帆三点，高下相形',
    focus: '青绿勾勒的建筑结构与“国朝山水第一”的法度',
    summary: '在山水成为主角之前，楼阁先要画得毫厘不差。',
    detail: '传为唐代青绿大家李思训所作。楼阁以界画方式绘出，梁柱栏楯结构清晰；山石勾斫填金，江波细勾，保留了早期山水画从界画脱胎的痕迹。',
    tags: ['大小李将军', '青绿', '多重归类'],
    subjectViews: {
      jiehua: {
        matter: '临江楼阁与行舟的尺度对照',
        composition: '界画楼阁占据近景，江面留作虚空间',
        focus: '檐角斗拱与栏杆的精严线描'
      }
    },
    art: { kind: 'jiehua', structure: 'tower', bluegreen: true },
    accent: '#5e8f7e',
    order: 211
  },

  /* ---------------- 花鸟画 ---------------- */
  {
    id: 'rare-birds-sketch',
    title: '写生珍禽图',
    artist: '黄筌',
    dynasty: '五代',
    year: '五代 · 西蜀（10 世纪）',
    domain: '绘画',
    medium: '绢本设色 · 卷',
    location: '故宫博物院',
    subjectIds: ['flower-bird'],
    matter: '禽鸟、昆虫与龟的课徒稿式集合',
    composition: '册页式平铺散点，物象之间不设环境',
    focus: '“黄家富贵”的工细翎毛与鳞翼质感',
    summary: '这不是创作，是一位画院统领给儿子留下的观察笔记。',
    detail: '画中二十余只虫鸟各自独立、大小间杂，羽毛的丝染、龟甲的纹理、蜂翼的透明都极精确。它奠定了北宋院体花鸟“格物精微”的基调。',
    tags: ['黄家富贵', '写生', '课徒稿'],
    art: { kind: 'flowerbird', motif: 'birds' },
    accent: '#a07d52',
    order: 301
  },
  {
    id: 'hibiscus-golden-pheasant',
    title: '芙蓉锦鸡图',
    artist: '赵佶（宋徽宗）',
    dynasty: '北宋',
    year: '北宋 · 12 世纪初',
    domain: '绘画',
    medium: '绢本设色 · 立轴',
    location: '故宫博物院',
    subjectIds: ['flower-bird'],
    matter: '锦鸡栖于芙蓉枝上回首望蝶',
    composition: '对角线取势：蝶、花、鸡目光连成一线',
    focus: '五色羽毛的渲染与“形神兼备”的院体标准',
    summary: '徽宗题下“儒家五常”，让一只雉鸡背负了道德。',
    detail: '锦鸡压弯芙蓉枝的重量感、回首注视双蝶的视线牵引，都经过精密安排。羽毛以墨线勾勒后层层晕染，是诗、书、画合一的院体样板。',
    tags: ['院体花鸟', '赵佶', '工笔'],
    art: { kind: 'flowerbird', motif: 'pheasant' },
    accent: '#b4813f',
    order: 302
  },
  {
    id: 'double-happiness',
    title: '双喜图',
    artist: '崔白',
    dynasty: '北宋',
    year: '北宋 · 嘉祐六年（1061）',
    domain: '绘画',
    medium: '绢本设色 · 立轴',
    location: '台北故宫博物院',
    subjectIds: ['flower-bird'],
    matter: '秋风古木间，山喜鹊向野兔噪鸣',
    composition: '“之”字形枝干贯穿，二雀一兔呼应成三角',
    focus: '禽兔的野逸神态与秋风中的枝叶动势',
    summary: '宫墙之外的花鸟开始呼吸秋风。',
    detail: '崔白打破了黄筌体制的拘谨，把花鸟放回荒郊野趣。喜鹊张翅俯鸣、野兔回首的瞬间神态生动，枯竹败叶笔势放纵，开“徐熙野逸”一路新局。',
    tags: ['野逸', '禽兔', '崔白'],
    art: { kind: 'flowerbird', motif: 'magpie' },
    accent: '#9b7a56',
    order: 303
  },
  {
    id: 'ink-plum',
    title: '墨梅图',
    artist: '王冕',
    dynasty: '元',
    year: '元 · 14 世纪',
    domain: '绘画',
    medium: '纸本水墨 · 立轴',
    location: '上海博物馆',
    subjectIds: ['flower-bird'],
    matter: '一枝报春的墨梅',
    composition: '折枝自右横贯，千花万蕊而疏密有致',
    focus: '“不要人夸颜色好”的水墨点瓣与文人寄托',
    summary: '没有颜色的梅花，香的是人格。',
    detail: '王冕以淡墨勾瓣、浓墨点萼，枝条拉得修长挺健。画上自题“只留清气满乾坤”，梅花从此成为遗民品格的符号，写意花鸟的精神浓度被提到新高度。',
    tags: ['墨梅', '写意', '文人画'],
    art: { kind: 'flowerbird', motif: 'plum', ink: true },
    accent: '#5f5f61',
    order: 304
  },
  {
    id: 'lotus-out-of-water',
    title: '出水芙蓉图',
    artist: '吴炳（传）',
    dynasty: '南宋',
    year: '南宋 · 12 世纪',
    domain: '绘画',
    medium: '绢本设色 · 团扇册页',
    location: '故宫博物院',
    subjectIds: ['flower-bird'],
    matter: '一朵初绽的荷花',
    composition: '斗方满构图：花头居中，绿叶环绕，不露水面',
    focus: '花瓣的向背晕染与“夺造化”的写生功力',
    summary: '一朵花占满整开册页，香气几乎透出纸面。',
    detail: '宋代团扇册页善于截取自然一瞬。此图花瓣粉白透红、筋脉隐然，荷叶以花青分染出正背与残缺，构图饱满却空灵，是“折枝”美学的极致。',
    tags: ['册页团扇', '折枝', '设色'],
    art: { kind: 'flowerbird', motif: 'lotus' },
    accent: '#a65f78',
    order: 305
  },

  /* ---------------- 界画 ---------------- */
  {
    id: 'spring-dawn-han-palace',
    title: '汉宫春晓图',
    artist: '仇英',
    dynasty: '明',
    year: '明 · 16 世纪',
    domain: '绘画',
    medium: '绢本设色 · 长卷',
    location: '台北故宫博物院',
    subjectIds: ['jiehua', 'figure'],
    matter: '汉代宫苑的楼阁回廊与宫人的春日生活',
    composition: '横向长卷，建筑以连廊逐段开合',
    focus: '界画台榭的折算精严与人物点缀的尺度',
    summary: '建筑是骨架，人事是血肉：界画与人物在一卷之内共生。',
    detail: '仇英为明四家之一，此卷是其工笔重彩代表。殿宇、栏杆、水榭皆以界尺引线，比例准确；其间布置妆台、弈棋、戏雀、浇花等百余人物，须在人物画语境中观看其生活叙事。',
    tags: ['明四家', '工笔重彩', '多重归类'],
    subjectViews: {
      figure: {
        matter: '宫眷的妆扮、弈棋、戏雀、演乐等节令活动',
        composition: '人物被安放进一间间建筑“舞台”依次亮相',
        focus: '小如豆人而姿态、身份各有区分的笔力'
      }
    },
    art: { kind: 'jiehua', structure: 'palace', bluegreen: true, figures: 6 },
    accent: '#9e6f63',
    order: 401
  },

  /* ---------------- 非绘画门类（保留在总库中，不进入画科分类） ---------------- */
  {
    id: 'tao-tea',
    title: '青花缠枝莲纹梅瓶',
    artist: '景德镇窑',
    dynasty: '明',
    year: '明 · 永乐',
    domain: '陶瓷',
    medium: '青花瓷',
    location: '故宫博物院',
    subjectIds: [],
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1200&q=85',
    summary: '青花在白釉上留下可辨认的呼吸，一件器物容纳了秩序、礼制与手的温度。',
    detail: '胎体匀净，青料发色浓艳。缠枝莲纹在瓶肩、瓶腹间连续展开，器形与绘画共同构成明代宫廷的秩序感。',
    tags: ['永乐', '青花', '纹样'],
    accent: '#6f94a5',
    order: 901
  },
  {
    id: 'calligraphy-orchid',
    title: '兰亭序（神龙本）',
    artist: '王羲之',
    dynasty: '唐',
    year: '唐摹本 · 约 672',
    domain: '书法',
    medium: '纸本墨迹',
    location: '故宫博物院',
    subjectIds: [],
    image: 'https://images.unsplash.com/photo-1547981609-4b6bf67db6d1?auto=format&fit=crop&w=1200&q=85',
    summary: '笔锋的提按、转折与呼吸，让一场春日雅集穿越一千六百年抵达今日。',
    detail: '行书的流动感来自速度的变化。字与字互相牵引，笔画在转折处留下身体运动的证据；神龙本被认为最接近原迹精神。',
    tags: ['行书', '临摹', '魏晋风度'],
    accent: '#a7745b',
    order: 902
  },
  {
    id: 'bronze-mask',
    title: '青铜纵目面具',
    artist: '三星堆祭祀区',
    dynasty: null,
    year: '商 · 约公元前 1200',
    domain: '雕塑',
    medium: '青铜铸造',
    location: '四川广汉三星堆博物馆',
    subjectIds: [],
    image: 'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=1200&q=85',
    summary: '夸张的双眼把凝视推向神话，是一个文明对观看与沟通的想象。',
    detail: '器官被转化为符号，造型超出人脸比例。青铜铸造工艺与祭祀用途共同塑造了它不可亲近的神性。',
    tags: ['三星堆', '青铜', '祭祀'],
    accent: '#7c8b6d',
    order: 903
  },
  {
    id: 'lacquer-box',
    title: '剔红花鸟纹圆盒',
    artist: '雕漆作',
    dynasty: '明',
    year: '明 · 宣德',
    domain: '工艺美术',
    medium: '剔红漆器',
    location: '台北故宫博物院',
    subjectIds: [],
    image: 'https://images.unsplash.com/photo-1582561833407-b95380302c7b?auto=format&fit=crop&w=1200&q=85',
    summary: '数十层漆的厚度给花鸟纹制造出微小的山谷，触觉在这里变成了观看。',
    detail: '剔红需反复髹漆、积累厚度后再雕刻。刀锋切入漆层的深浅，决定花叶的起伏与光线的停留。',
    tags: ['雕漆', '宫廷', '手工'],
    accent: '#b34f3d',
    order: 904
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

const artworkById = new Map(artworks.map((artwork) => [artwork.id, artwork]))

export function getArtwork(id) {
  return artworkById.get(id) ?? null
}

export function getFeatured() {
  return artworkById.get('thousand-li') ?? artworks[0]
}

function includesQuery(artwork, normalized) {
  if (!normalized) return true
  const haystack = [
    artwork.title,
    artwork.artist,
    artwork.dynasty,
    artwork.year,
    artwork.domain,
    artwork.medium,
    artwork.matter,
    artwork.composition,
    artwork.focus,
    artwork.summary,
    ...(artwork.tags ?? [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('zh-CN')
  return haystack.includes(normalized)
}

/** 通用检索（服务端仓库共用同一份逻辑）。subjectId 为可选的画科过滤。 */
export function getArtworks({ domain = '全部', query = '', subjectId = null, subjectIds = null } = {}) {
  const normalized = query.trim().toLocaleLowerCase('zh-CN')
  const wantedSubjects = subjectIds ?? (subjectId ? [subjectId] : null)
  return artworks.filter((item) => {
    const matchesDomain = domain === '全部' || item.domain === domain
    const matchesSubject = !wantedSubjects || wantedSubjects.some((id) => (item.subjectIds ?? []).includes(id))
    return matchesDomain && matchesSubject && includesQuery(item, normalized)
  })
}
