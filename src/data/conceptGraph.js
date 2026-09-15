// 近现代中国美术观念变迁 · 关系型数据层
// ------------------------------------------------------------------
// 设计说明：
// 1. 所有实体（观念 / 事件 / 人物 / 机构）归一化存放在 nodes 中，
//    通过 id 互相引用，避免数据重复，类似关系数据库的表结构。
// 2. edges 表达实体间的有向关系（冲击、奠基、反抗、延续……），
//    页面中的「此前 / 此后」「相关人物」等视图都由边查询得出。
// 3. turningPoints 是关系链上的转折点。每个转折点不绑定单一时间线，
//    而是挂接多条「解释路径」（paths），每条路径是一棵可无限下钻的
//    原因树（causes 嵌套），由前端按需展开、控制渲染深度。
// ------------------------------------------------------------------

export const nodeTypes = {
  concept: { label: '观念', color: '#c79a6b' },
  event: { label: '事件', color: '#8fa8c8' },
  person: { label: '人物', color: '#a3b18a' },
  institution: { label: '机构', color: '#cd8fa0' }
}

export const nodes = {
  // —— 观念 ——
  c_wenren: { type: 'concept', name: '文人画正统观', years: '宋元以降', summary: '以笔墨气韵、诗书画一体为最高标准，重「写」轻「形」，画品即人品。' },
  c_xieyi: { type: 'concept', name: '写意为本', years: '明清主流', summary: '「不求形似求生韵」，造型让位于笔墨趣味与性情表达。' },
  c_gongbi: { type: 'concept', name: '院体与民间画工传统', years: '清以前并行', summary: '院体精工与民间画工的写实技艺，在文人话语中长期处于边缘。' },
  c_shiyong: { type: 'concept', name: '师夷长技的实用美术观', years: '1860s—1890s', summary: '把西画视为「格致」之学：透视、解剖、明暗是可用于图强的技术。' },
  c_hunhe: { type: 'concept', name: '中西折中观', years: '1900s—1910s', summary: '口岸商业美术与海派实践中，中西画法开始自然混杂，尚未上升为理论。' },
  c_meishugeming: { type: 'concept', name: '美术革命论', years: '1917—', summary: '陈独秀、康有为等主张以西方写实主义「革王画的命」，改造中国画。' },
  c_xieshi: { type: 'concept', name: '写实主义改造论', years: '1910s—1950s', summary: '以素描、解剖、透视为中国画「科学」基础，徐悲鸿体系的核心。' },
  c_tiaohé: { type: 'concept', name: '调和中西论', years: '1920s—', summary: '林风眠等主张「介绍西洋艺术，整理中国艺术，调和中西艺术」。' },
  c_xueyuan: { type: 'concept', name: '学院分科体系观', years: '1928—', summary: '美术成为现代学科：国画、西画、雕塑、图案分科，素描为共同基础。' },
  c_weiyishu: { type: 'concept', name: '为艺术而艺术', years: '1920s—1930s', summary: '受现代主义影响，强调形式自律与个性表现，与救亡话语形成张力。' },
  c_dazhonghua: { type: 'concept', name: '美术大众化', years: '1930s—', summary: '艺术走出画室面向民众，木刻、漫画、新年画成为动员媒介。' },
  c_gemingmeishu: { type: 'concept', name: '革命美术观', years: '1942—', summary: '《在延安文艺座谈会上的讲话》确立「文艺为工农兵服务」的方向。' },
  c_sheshe: { type: 'concept', name: '社会主义现实主义', years: '1950s—1970s', summary: '以苏联为范本，主题先行、典型化，服务国家叙事。' },
  c_xiandai: { type: 'concept', name: '现代艺术多元观', years: '1979—', summary: '形式美、抽象、观念艺术重新合法化，艺术回到对语言自身的探索。' },

  // —— 事件 ——
  e_yapian: { type: 'event', name: '鸦片战争与开埠', years: '1840—1842', summary: '五口通商，西洋图像、照相术与石印技术随通商口岸进入。' },
  e_tushanwan: { type: 'event', name: '土山湾画馆设立', years: '1864', summary: '上海徐家汇教会画馆系统传授西洋画法，成为西画东渐的源头之一。' },
  e_dianshizhai: { type: 'event', name: '《点石斋画报》创刊', years: '1884', summary: '石印画报以新闻图像面向市民，改变图像的生产与观看方式。' },
  e_wuxu: { type: 'event', name: '戊戌变法', years: '1898', summary: '变法虽败，「废科举、兴学堂」的方向使美术教育改制不可逆转。' },
  e_xinwenhua: { type: 'event', name: '新文化运动', years: '1915—1923', summary: '「德先生」「赛先生」话语下，传统文人画被贴上「不科学」标签。' },
  e_luxunmuke: { type: 'event', name: '鲁迅倡导新兴木刻', years: '1931', summary: '木刻讲习会开班，木刻因可复制、易传播成为左翼美术的利器。' },
  e_kangzhan: { type: 'event', name: '全面抗战爆发', years: '1937', summary: '艺术家内迁与战地写生，「艺术救国」压倒形式实验。' },
  e_yananjianghua: { type: 'event', name: '延安文艺座谈会', years: '1942', summary: '确立文艺为工农兵服务的方针，重塑此后三十年的美术体制。' },
  e_sulian: { type: 'event', name: '苏联模式全面引入', years: '1953—1957', summary: '马克西莫夫训练班与契斯恰科夫素描体系进入学院教学。' },
  e_xingxing: { type: 'event', name: '星星美展', years: '1979', summary: '业余艺术家在中国美术馆外自办展览，喊出「要艺术自由」。' },
  e_bawu: { type: 'event', name: '85 美术新潮', years: '1985—1986', summary: '各地青年群体蜂拥而起，理性绘画、生命之流、观念艺术并出。' },

  // —— 人物 ——
  p_kangyouwei: { type: 'person', name: '康有为', years: '1858—1927', summary: '《万木草堂藏画目》推崇宋院画写实，贬抑文人写意，开「美术革命」先声。' },
  p_chenduxiu: { type: 'person', name: '陈独秀', years: '1879—1942', summary: '在《新青年》倡言「美术革命」，主张输入西洋写实精神。' },
  p_xubeihong: { type: 'person', name: '徐悲鸿', years: '1895—1953', summary: '以素描为一切造型艺术之基础，建立写实主义教学体系。' },
  p_linfengmian: { type: 'person', name: '林风眠', years: '1900—1991', summary: '国立艺术院首任院长，走调和中西、形式自律的现代路线。' },
  p_luxun: { type: 'person', name: '鲁迅', years: '1881—1936', summary: '新兴木刻运动的精神领袖，视木刻为「好的大众的艺术」。' },
  p_mao: { type: 'person', name: '毛泽东《讲话》', years: '1942', summary: '文艺为什么人服务、如何服务，成为革命美术的根本问题。' },
  p_wuguanzhong: { type: 'person', name: '吴冠中', years: '1919—2010', summary: '1979 年发表《绘画的形式美》，为形式与抽象正名。' },

  // —— 机构 ——
  i_beiping: { type: 'institution', name: '国立北京美术学校', years: '1918', summary: '中国第一所国立美术学校，现代美术教育的起点。' },
  i_hangzhou: { type: 'institution', name: '国立艺术院（杭州）', years: '1928', summary: '蔡元培「以美育代宗教」理念的实践地，现代主义的大本营。' },
  i_luyi: { type: 'institution', name: '鲁迅艺术文学院', years: '1938', summary: '延安鲁艺：革命美术人才的培养机器，木刻、新年画的中心。' },
  i_cafa: { type: 'institution', name: '中央美术学院', years: '1950', summary: '徐悲鸿体系与苏联模式合流，写实主义学院体制定型。' }
}

// 有向关系边：from —relation→ to
export const edges = [
  { from: 'e_yapian', to: 'c_shiyong', relation: '催生' },
  { from: 'e_tushanwan', to: 'c_hunhe', relation: '技术输入' },
  { from: 'e_dianshizhai', to: 'c_hunhe', relation: '媒介铺垫' },
  { from: 'e_wuxu', to: 'c_meishugeming', relation: '政治先导' },
  { from: 'e_xinwenhua', to: 'c_meishugeming', relation: '话语场' },
  { from: 'p_kangyouwei', to: 'c_meishugeming', relation: '理论先声' },
  { from: 'p_chenduxiu', to: 'c_meishugeming', relation: '命名倡导' },
  { from: 'c_meishugeming', to: 'c_xieshi', relation: '落实为' },
  { from: 'p_xubeihong', to: 'c_xieshi', relation: '体系化' },
  { from: 'p_linfengmian', to: 'c_tiaohé', relation: '另辟路径' },
  { from: 'i_beiping', to: 'c_xueyuan', relation: '制度起点' },
  { from: 'i_hangzhou', to: 'c_weiyishu', relation: '庇护' },
  { from: 'c_xueyuan', to: 'c_xieshi', relation: '教学固化' },
  { from: 'p_luxun', to: 'c_dazhonghua', relation: '倡导' },
  { from: 'e_luxunmuke', to: 'c_dazhonghua', relation: '媒介革命' },
  { from: 'e_kangzhan', to: 'c_dazhonghua', relation: '战时加速' },
  { from: 'e_yananjianghua', to: 'c_gemingmeishu', relation: '方针确立' },
  { from: 'i_luyi', to: 'c_gemingmeishu', relation: '组织生产' },
  { from: 'c_gemingmeishu', to: 'c_sheshe', relation: '建国后升级为' },
  { from: 'e_sulian', to: 'c_sheshe', relation: '范本输入' },
  { from: 'i_cafa', to: 'c_sheshe', relation: '体制承载' },
  { from: 'e_xingxing', to: 'c_xiandai', relation: '破冰' },
  { from: 'p_wuguanzhong', to: 'c_xiandai', relation: '理论正名' },
  { from: 'e_bawu', to: 'c_xiandai', relation: '全面爆发' },
  { from: 'c_wenren', to: 'c_xieyi', relation: '内含' },
  { from: 'c_xieyi', to: 'c_meishugeming', relation: '被革命对象' },
  { from: 'c_weiyishu', to: 'c_xiandai', relation: '隔代回响' }
]

// 关系链上的转折点
// before / after：由边关系推导出的观念对照
// works：该转折点前后的代表作品（左旧右新）
// paths：多条解释路径，每条是一棵可下钻的原因树
export const turningPoints = [
  {
    id: 'tp-kaibu',
    name: '开埠与西画东渐',
    year: '1840—1900',
    trigger: 'e_yapian',
    before: ['c_wenren', 'c_xieyi', 'c_gongbi'],
    after: ['c_shiyong', 'c_hunhe'],
    worksBefore: [
      { title: '《仿黄公望山水》', artist: '四王一路的文人正统', note: '笔墨程式的高度成熟，也是变革者眼中的停滞' },
      { title: '《海上画派册页》', artist: '任伯年等', note: '文人画向市民趣味的第一次松动' }
    ],
    worksAfter: [
      { title: '土山湾宗教油画', artist: '土山湾画馆学徒', note: '中国最早的系统西画训练产物' },
      { title: '《点石斋画报》插图', artist: '吴友如等', note: '新闻图像让「写实」进入日常观看' }
    ],
    paths: [
      {
        id: 'path-jishu',
        label: '技术冲击路径',
        summary: '照相术与石印证明：图像可以比笔墨更「真」。',
        root: {
          node: 'e_yapian',
          note: '通商口岸打开，西洋器物与图像一并涌入。',
          causes: [
            {
              node: 'e_tushanwan',
              note: '教会画馆以作坊制传授油画、水彩、素描。',
              causes: [
                { node: 'c_shiyong', note: '西画被理解为可学的「技术」，而非艺术竞争。' }
              ]
            },
            {
              node: 'e_dianshizhai',
              note: '石印画报让写实图像大规模复制传播。',
              causes: [
                { node: 'c_hunhe', note: '市民读者习惯了焦点透视的新闻画。', causes: [
                  { node: 'c_hunhe', note: '月份牌、连环画进一步混合中西画法。', causes: [
                    { node: 'c_meishugeming', note: '为日后「美术革命」准备了视觉经验的土壤。' }
                  ] }
                ] }
              ]
            }
          ]
        }
      },
      {
        id: 'path-shizhi',
        label: '士人自信动摇路径',
        summary: '「中体西用」框架下，绘画被重新分类为「艺学」。',
        root: {
          node: 'e_wuxu',
          note: '变法把「格致」「图画」纳入新学堂课程。',
          causes: [
            { node: 'c_shiyong', note: '图画课先作为工科辅助（地图、机器图）存在。', causes: [
              { node: 'i_beiping', note: '最终走向独立的美术学校建制。' }
            ] },
            { node: 'p_kangyouwei', note: '游历欧洲博物馆后，回头批判文人写意「衰败」。', causes: [
              { node: 'c_meishugeming', note: '「以院体为正法」的论断直接点燃美术革命论。' }
            ] }
          ]
        }
      }
    ]
  },
  {
    id: 'tp-geming',
    name: '美术革命论',
    year: '1917—1927',
    trigger: 'e_xinwenhua',
    before: ['c_wenren', 'c_xieyi'],
    after: ['c_meishugeming', 'c_xieshi', 'c_tiaohé'],
    worksBefore: [
      { title: '《仿大痴山水》', artist: '民初画坛临古风气', note: '被陈独秀点名要「革」的「王画」传统' }
    ],
    worksAfter: [
      { title: '《田横五百士》', artist: '徐悲鸿', note: '写实主义改造论的里程碑式实践' },
      { title: '《裸女》系列', artist: '林风眠', note: '调和中西的另一条现代路线' }
    ],
    paths: [
      {
        id: 'path-kexue',
        label: '科学主义路径',
        summary: '「科学」成为最高判准，写实被等同于科学。',
        root: {
          node: 'e_xinwenhua',
          note: '新文化运动把「赛先生」树立为价值尺度。',
          causes: [
            { node: 'p_chenduxiu', note: '「若想把中国画改良，首先要革王画的命。」', causes: [
              { node: 'c_meishugeming', note: '写实主义获得道德与进步的双重正当性。', causes: [
                { node: 'c_xieshi', note: '素描成为「科学」的造型基础。', causes: [
                  { node: 'i_cafa', note: '最终固化为学院入学考试与基础教学。' }
                ] }
              ] }
            ] },
            { node: 'p_kangyouwei', note: '以宋代院画之「真」反衬文人画之「空」。', causes: [
              { node: 'c_xieshi', note: '为写实路线提供了本土画史依据。' }
            ] }
          ]
        }
      },
      {
        id: 'path-liuxue',
        label: '留洋取法路径',
        summary: '留学生带回的「西方」并不相同，路线由此分化。',
        root: {
          node: 'p_xubeihong',
          note: '留法学院派：带回素描—油画体系。',
          causes: [
            { node: 'c_xieshi', note: '「素描为一切造型艺术之基础」。' }
          ]
        },
        altRoots: [
          {
            node: 'p_linfengmian',
            note: '同样留法，却选择了现代主义。',
            causes: [
              { node: 'c_tiaohé', note: '「调和中西艺术，创造时代艺术」。', causes: [
                { node: 'c_weiyishu', note: '形式自律的种子，半个世纪后在 85 新潮回响。' }
              ] }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'tp-xueyuan',
    name: '学院体系确立',
    year: '1918—1937',
    trigger: 'i_beiping',
    before: ['c_hunhe', 'c_meishugeming'],
    after: ['c_xueyuan', 'c_weiyishu'],
    worksBefore: [
      { title: '画会课徒稿', artist: '湖社、中国画学研究会', note: '传统师徒制与画会授受的最后形态' }
    ],
    worksAfter: [
      { title: '《嘉陵江边》', artist: '徐悲鸿（教学示范体系）', note: '素描—写生—创作的学院流程产物' },
      { title: '《人道》', artist: '林风眠', note: '杭州艺专现代主义路线的代表' }
    ],
    paths: [
      {
        id: 'path-zhidu',
        label: '教育制度路径',
        summary: '美术从「雅集」变成「学科」，评价权交给学校。',
        root: {
          node: 'i_beiping',
          note: '1918 年国立北京美术学校成立。',
          causes: [
            { node: 'c_xueyuan', note: '分科教学：国画、西画、图案各自成系。', causes: [
              { node: 'c_xieshi', note: '素描成为所有科系的共同基础课。', causes: [
                { node: 'i_cafa', note: '1950 年中央美院成立，体系定型并推向全国。', causes: [
                  { node: 'c_sheshe', note: '学院与革命美术合流，写实成为唯一正统。' }
                ] }
              ] }
            ] },
            { node: 'i_hangzhou', note: '1928 年国立艺术院，蔡元培美育理念的实验场。', causes: [
              { node: 'c_weiyishu', note: '现代主义在学院围墙内获得短暂庇护。' }
            ] }
          ]
        }
      },
      {
        id: 'path-mingfen',
        label: '身份重构路径',
        summary: '「画家」从文人余事变为现代职业。',
        root: {
          node: 'c_xueyuan',
          note: '文凭、展览、社团构成新的职业认证体系。',
          causes: [
            { node: 'c_weiyishu', note: '职业艺术家需要区别于匠人的「艺术自律」话语。' },
            { node: 'c_dazhonghua', note: '职业化也埋下与大众脱节的焦虑，催生反向运动。' }
          ]
        }
      }
    ]
  },
  {
    id: 'tp-yanan',
    name: '革命美术转向',
    year: '1937—1949',
    trigger: 'e_yananjianghua',
    before: ['c_weiyishu', 'c_xueyuan'],
    after: ['c_dazhonghua', 'c_gemingmeishu'],
    worksBefore: [
      { title: '《鼓浪屿》等现代派探索', artist: '决澜社诸家', note: '1930 年代现代主义的短暂春天' }
    ],
    worksAfter: [
      { title: '《减租会》', artist: '古元', note: '延安木刻：从西洋木刻到民间趣味的转化' },
      { title: '《翻身人》新年画', artist: '鲁艺木刻工作团', note: '旧年画形式装上革命内容' }
    ],
    paths: [
      {
        id: 'path-zhanzheng',
        label: '战争动员路径',
        summary: '抗战把「艺术为谁」从选择题变成必答题。',
        root: {
          node: 'e_kangzhan',
          note: '艺术家团体随战火内迁，画室里的大作品失去条件。',
          causes: [
            { node: 'e_luxunmuke', note: '木刻刀与木板是最轻便的「武器」。', causes: [
              { node: 'c_dazhonghua', note: '可复制、可张贴的木刻成为战时图像主力。', causes: [
                { node: 'i_luyi', note: '鲁艺把木刻教学组织化、规模化。', causes: [
                  { node: 'c_gemingmeishu', note: '木刻语言被整合进革命美术体系。' }
                ] }
              ] }
            ] },
            { node: 'p_luxun', note: '「当革命时，版画之用最广，虽极匆忙，顷刻能办。」', causes: [
              { node: 'c_dazhonghua', note: '为木刻运动提供了精神合法性。' }
            ] }
          ]
        }
      },
      {
        id: 'path-fangzhen',
        label: '文艺方针路径',
        summary: '《讲话》把分散的救亡实践统一为体制化方向。',
        root: {
          node: 'e_yananjianghua',
          note: '1942 年座谈会：文艺为工农兵服务。',
          causes: [
            { node: 'p_mao', note: '「普及第一」：先向工农兵普及，再谈提高。', causes: [
              { node: 'c_gemingmeishu', note: '民间形式（年画、剪纸）被改造为革命载体。', causes: [
                { node: 'c_sheshe', note: '建国后与苏联社会主义现实主义对接。', causes: [
                  { node: 'e_sulian', note: '马克西莫夫训练班输入完整的苏式教学。' }
                ] }
              ] }
            ] },
            { node: 'c_weiyishu', note: '形式探索被判定为「脱离群众」，转入地下。', causes: [
              { node: 'c_xiandai', note: '压抑的形式冲动在 1979 年后集中释放。' }
            ] }
          ]
        }
      }
    ]
  },
  {
    id: 'tp-xinchao',
    name: '现代艺术重启',
    year: '1979—1989',
    trigger: 'e_xingxing',
    before: ['c_sheshe', 'c_gemingmeishu'],
    after: ['c_xiandai'],
    worksBefore: [
      { title: '《毛主席去安源》', artist: '刘春华等', note: '社会主义现实主义的极端样本' }
    ],
    worksAfter: [
      { title: '《父亲》', artist: '罗中立', note: '用超级写实把「人民」还原为具体的人' },
      { title: '《在新时代——亚当夏娃的启示》', artist: '孟禄丁、张群', note: '85 新潮理性绘画的开端' }
    ],
    paths: [
      {
        id: 'path-jiefang',
        label: '思想解放路径',
        summary: '「形式美」合法化，为抽象与现代主义打开缺口。',
        root: {
          node: 'p_wuguanzhong',
          note: '1979 年《绘画的形式美》引发全国论战。',
          causes: [
            { node: 'c_xiandai', note: '形式不再是「资产阶级趣味」，而是艺术本体。', causes: [
              { node: 'e_xingxing', note: '同年星星美展把口号变成行动。', causes: [
                { node: 'e_bawu', note: '85 新潮：上百个青年艺术群体同时涌现。', causes: [
                  { node: 'c_xiandai', note: '观念、装置、行为艺术全面进入中国美术现场。' }
                ] }
              ] }
            ] }
          ]
        }
      },
      {
        id: 'path-duihua',
        label: '内部对话路径',
        summary: '现代艺术并非单纯西来，也是与三十年体制的对话。',
        root: {
          node: 'c_sheshe',
          note: '被反叛的对象，反而塑造了反叛的语言。',
          causes: [
            { node: 'c_xieshi', note: '学院写实功底被用来画「反英雄」的《父亲》。', causes: [
              { node: 'c_xiandai', note: '写实技术与现代观念嫁接出独特路径。' }
            ] },
            { node: 'c_weiyishu', note: '1930 年代被中断的现代主义隔代复活。', causes: [
              { node: 'c_xiandai', note: '林风眠、吴大羽一脉在 80 年代被重新发现。' }
            ] }
          ]
        }
      }
    ]
  }
]

// —— 关系查询工具（模拟关系型数据库的查询层）——

const nodeIndex = new Map(Object.entries(nodes))

export function getNode(id) {
  return nodeIndex.get(id) || { type: 'concept', name: id, years: '', summary: '' }
}

// 查询与某实体相关的所有边（双向）
export function edgesOf(id) {
  return edges.filter((edge) => edge.from === id || edge.to === id)
}

// 查询某转折点涉及的人物（扫描 trigger/before/after 及全部解释路径树引用的节点）
export function peopleOfTurningPoint(tp) {
  const seeds = new Set([tp.trigger, ...tp.before, ...tp.after])
  const collect = (causeNode) => {
    seeds.add(causeNode.node)
    ;(causeNode.causes || []).forEach(collect)
  }
  tp.paths.forEach((path) => {
    collect(path.root)
    ;(path.altRoots || []).forEach(collect)
  })
  const people = new Map()
  edges.forEach((edge) => {
    // 边的任一端命中种子时，把另一端（若为人）纳入关系网；
    // 两端都是种子时，人物端也要保留，因此逐端独立判断
    ;[edge.from, edge.to].forEach((id) => {
      if (seeds.has(id)) return
      if (nodeIndex.get(id)?.type === 'person' && (seeds.has(edge.from) || seeds.has(edge.to))) {
        people.set(id, edge.relation)
      }
    })
    // 人物本身在种子中（路径树直接引用）时也要收录
    ;[edge.from, edge.to].forEach((id) => {
      if (seeds.has(id) && nodeIndex.get(id)?.type === 'person') people.set(id, edge.relation)
    })
  })
  return [...people.entries()].map(([id, relation]) => ({ id, relation, ...getNode(id) }))
}

// 统计原因树的深度与节点数（用于 UI 提示与性能预算）
export function treeStats(root) {
  let maxDepth = 1
  let count = 0
  const walk = (node, depth) => {
    count += 1
    maxDepth = Math.max(maxDepth, depth)
    ;(node.causes || []).forEach((child) => walk(child, depth + 1))
  }
  walk(root, 1)
  return { maxDepth, count }
}
