// 相机视角预设。
// “艺术家视角”还原卷轴正面构图；其余视角把“三远”从正面图式里抽离出来，
// 让用户在真实三维透视中辨认高远 / 深远 / 平远的组织方式。

export const ARTIST_VIEW = 'artist'

export const VIEW_PRESETS = [
  {
    id: ARTIST_VIEW,
    label: '艺术家视角',
    hint: '正面平视，还原卷轴原构图：各深度层在二维上重叠，是画家安排给观看者的位置。',
    method: null,
    position: [0, 1.7, 21.5],
    target: [0, 1.4, -4],
    fov: 38
  },
  {
    id: 'side',
    label: '侧视',
    hint: '从侧面看，层与层之间的深度落差被拉开：中国画的“空间”是并置的段落，不是统一的灭点。',
    method: null,
    position: [26, 5.5, 1.5],
    target: [0, 1.4, -4],
    fov: 42
  },
  {
    id: 'oblique',
    label: '斜视',
    hint: '斜视接近真实三维透视，注意远近山体几乎等大等清晰——散点透视拒绝单焦镜头。',
    method: null,
    position: [17, 9.5, 15],
    target: [0, 1.2, -4],
    fov: 40
  },
  {
    id: 'high-far',
    label: '高远',
    hint: '自山下而仰山巅：主峰被垂直推高、层层叠压，获得纪念碑式的崇高感。',
    method: '高远 · 仰视',
    position: [1.5, 2.1, 6.5],
    target: [0, 8.2, -13],
    fov: 40
  },
  {
    id: 'deep-far',
    label: '深远',
    hint: '自山前而窥山后：俯视并向画面深处穿行，层次重叠最重，“重峦叠嶂”由此而来。',
    method: '深远 · 俯瞰',
    position: [11, 11.8, 8],
    target: [-2, 2.2, -13],
    fov: 42
  },
  {
    id: 'level-far',
    label: '平远',
    hint: '自近山而望远山：视线压低、江面开阔，《富春山居图》式的平远舒朗。',
    method: '平远 · 远眺',
    position: [14, 2.6, 7],
    target: [-4, 1.2, -14],
    fov: 35
  }
]

export const VIEW_MAP = Object.fromEntries(VIEW_PRESETS.map((preset) => [preset.id, preset]))
