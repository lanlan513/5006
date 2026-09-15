// WebGL 不可用 / 上下文丢失时的备用界面：
// 用 SVG 把“分层山水”静态呈现，并解释三远，保证信息与功能意图仍然可达。
import { useState } from 'react'
import { AlertTriangle, Layers } from 'lucide-react'

const SVG_LAYERS = [
  { fill: '#9b958b', opacity: 0.5, transform: 'translate(0,56)', path: 'M0,210 L0,150 C70,96 120,128 190,104 C260,80 310,126 380,100 C460,72 520,120 590,96 C660,74 710,112 760,92 L760,210 Z', depth: 0 },
  { fill: '#7c786f', opacity: 0.62, transform: 'translate(0,74)', path: 'M0,210 L0,138 C60,104 110,132 170,70 C210,30 250,96 300,84 C360,70 390,26 440,64 C500,110 540,92 600,104 C660,116 710,90 760,118 L760,210 Z', depth: 1 },
  { fill: '#5c574d', opacity: 0.78, transform: 'translate(0,94)', path: 'M0,210 L0,158 C80,128 140,150 220,128 C300,106 360,142 440,132 C520,122 590,146 660,134 C710,126 740,140 760,136 L760,210 Z', depth: 2 },
  { fill: '#3d382f', opacity: 0.95, transform: 'translate(0,132)', path: 'M0,210 L0,176 C90,164 170,182 260,170 C350,158 430,178 520,168 C610,158 690,176 760,168 L760,210 Z', depth: 3 }
]

const METHODS = [
  { term: '高远', text: '自山下仰山巅，主峰垂直叠压，强调崇高。' },
  { term: '深远', text: '自山前窥山后，重峦向纵深重叠，强调可游。' },
  { term: '平远', text: '自近山望远山，江面开阔、视线低平，强调旷远。' }
]

export default function LandscapeFallback({ reason }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const handleMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    setOffset({ x, y })
  }
  return (
    <div className="space-fallback">
      <div className="fallback-art" onMouseMove={handleMove} onMouseLeave={() => setOffset({ x: 0, y: 0 })}>
        <svg viewBox="0 0 760 300" role="img" aria-label="分层山水画意示意图">
          <rect width="760" height="300" fill="#e7e0cf" />
          <circle cx="560" cy="70" r="34" fill="#e9dcc0" opacity="0.9" />
          {SVG_LAYERS.map((layer) => (
            <g key={layer.depth} style={{ transform: `translate(${offset.x * layer.depth * -10}px, ${offset.y * layer.depth * -5}px)`, transition: 'transform .3s ease-out' }}>
              <path d={layer.path} transform={layer.transform} fill={layer.fill} opacity={layer.opacity} />
            </g>
          ))}
          <g transform="translate(360,132)" opacity="0.92">
            <polygon points="0,26 -18,10 18,10" fill="#2b271f" />
            <rect x="-14" y="10" width="28" height="4" fill="#3a2f20" />
            <rect x="-10" y="14" width="3" height="14" fill="#3a2f20" />
            <rect x="7" y="14" width="3" height="14" fill="#3a2f20" />
          </g>
          <rect x="0" y="238" width="760" height="62" fill="#6d7163" opacity="0.28" />
        </svg>
        <span className="fallback-parallax-hint"><Layers size={13} /> 移动光标可查看分层视差</span>
      </div>
      <div className="fallback-note">
        <h3><AlertTriangle size={16} /> 当前设备无法启动三维渲染</h3>
        <p>{reason === 'unsupported' ? '此浏览器不支持 WebGL。' : 'WebGL 被浏览器或显卡驱动阻止，或渲染上下文已丢失。'}你仍可通过下方示意图理解“分层山水”的空间组织；更换支持 WebGL 的浏览器或设备后，即可进入可旋转、可调焦的三维空间。</p>
        <div className="fallback-methods">
          {METHODS.map((method) => <div key={method.term}><b>{method.term}</b><span>{method.text}</span></div>)}
        </div>
      </div>
    </div>
  )
}
