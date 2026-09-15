// 字体资源构建管线：下载开源书体字体 → 子集化 → 生成覆盖清单。
//
// 用法：node scripts/build-fonts.mjs
// 产物：public/fonts/{seal,li,kai,xing,cao}.woff2 + src/data/fontManifest.json
//
// 字体来源（均为开源许可，许可文本已存于 public/fonts/licenses/）：
//   篆  LXGW Seal 霞鹜篆书  OFL-1.1        据《说文》小篆，含今字映射
//   隶  Qinggu Li 清骨隸    Arphic PL      金农隶意，千字文范围
//   楷  Ma Shan Zheng       OFL-1.1        毛笔楷书
//   行  Zhi Mang Xing       OFL-1.1        行书
//   草  Liu Jian Mao Cao    OFL-1.1        毛草
//
// 子集策略：
//   seal —— 保留全部码位（小篆区块 + 今字映射），字体本身很小；
//   li   —— 直接使用作者发布的千字文子集；
//   其余 —— 子集化为 GB2312 一级字（3755 字，按使用频率排列的常用集）。
// manifest 从最终产物字体的真实 cmap 生成，是应用判断「字库未收录」的唯一依据。

import { createWriteStream, mkdirSync, writeFileSync, copyFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import * as fontkit from 'fontkit'
import subsetFont from 'subset-font'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public', 'fonts')
const CACHE_DIR = join(ROOT, '.font-cache')
const MANIFEST_PATH = join(ROOT, 'src', 'data', 'fontManifest.json')

const SOURCES = {
  seal: 'https://github.com/lxgw/LxgwSeal/releases/download/v0.001-alpha.7.24/LXGWSeal-Regular.ttf',
  li: 'https://raw.githubusercontent.com/IIzzaya/project-qing-font/main/public/fonts/QingguLi-TC-Regular.woff2',
  kai: 'https://raw.githubusercontent.com/google/fonts/main/ofl/mashanzheng/MaShanZheng-Regular.ttf',
  xing: 'https://raw.githubusercontent.com/google/fonts/main/ofl/zhimangxing/ZhiMangXing-Regular.ttf',
  cao: 'https://raw.githubusercontent.com/google/fonts/main/ofl/liujianmaocao/LiuJianMaoCao-Regular.ttf'
}

async function download(id, url) {
  const ext = url.endsWith('.woff2') ? 'woff2' : 'ttf'
  const target = join(CACHE_DIR, `${id}.${ext}`)
  try {
    readFileSync(target)
    console.log(`cached  ${id}`)
    return target
  } catch {}
  console.log(`fetch   ${id} ← ${url}`)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`下载失败 ${url}: HTTP ${response.status}`)
  writeFileSync(target, Buffer.from(await response.arrayBuffer()))
  return target
}

function gb2312LevelOne() {
  // GB2312 0xB0A1—0xD7FE 为一级字库（3755 字，按拼音频率排列）。
  return execFileSync('python3', ['-c',
    "print(''.join(bytes([h,l]).decode('gb2312','ignore') for h in range(0xB0,0xD8) for l in range(0xA1,0xFF)),end='')"]
  ).toString()
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  mkdirSync(CACHE_DIR, { recursive: true })

  const paths = {}
  for (const [id, url] of Object.entries(SOURCES)) paths[id] = await download(id, url)

  const common = gb2312LevelOne()
  console.log(`common  GB2312 一级字 ${common.length} 字`)

  const sealFont = fontkit.openSync(paths.seal)
  const sealText = sealFont.characterSet.map((cp) => String.fromCodePoint(cp)).join('')

  const jobs = [
    { id: 'kai', text: common },
    { id: 'xing', text: common },
    { id: 'cao', text: common },
    { id: 'seal', text: sealText }
  ]
  for (const job of jobs) {
    const out = await subsetFont(readFileSync(paths[job.id]), job.text, { targetFormat: 'woff2' })
    writeFileSync(join(OUT_DIR, `${job.id}.woff2`), out)
    console.log(`subset  ${job.id} → ${(out.length / 1024).toFixed(0)}KB`)
  }
  copyFileSync(paths.li, join(OUT_DIR, 'li.woff2'))
  console.log('copy    li（作者已子集化）')

  const manifest = {}
  for (const id of Object.keys(SOURCES)) {
    const font = fontkit.openSync(join(OUT_DIR, `${id}.woff2`))
    const chars = font.characterSet
      .filter((cp) => cp >= 0x4e00 && cp <= 0x9fff)
      .map((cp) => String.fromCodePoint(cp))
      .sort()
    manifest[id] = chars.join('')
    console.log(`map     ${id}: ${chars.length} 字`)
  }
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest))
  console.log(`done    manifest → ${MANIFEST_PATH}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
