// 程序化构建“分层山水”场景：
// 每一层都是一张被挤出厚度的山脊切片（front 立面保留皴法纹理），
// 层与层沿 z 轴拉开深度——侧视时即可看到中国画“叠层”式空间与三维透视的差别。
import * as THREE from 'three'
import { makeLabelTexture, makeMistTexture, makePaperTexture, makeRidgeTexture, makeSunTexture } from './textures'
import { mulberry32 } from './random'

// 山脊轮廓：若干高斯峰叠加，确定性、无需资源加载
function ridgeProfile(peaks, baseY) {
  return (x) => {
    let height = baseY
    for (const peak of peaks) {
      const delta = (x - peak.cx) / peak.w
      height += peak.amp * Math.exp(-0.5 * delta * delta)
    }
    return height
  }
}

// 挤出山脊切片，front 立面（z=0）朝向艺术家视角
function makeRidgeMesh({ profile, width, depth, baseY, material, xSeg = 72, dSeg = 4 }) {
  const positions = []
  const uvs = []
  const grid = []
  for (let d = 0; d <= dSeg; d += 1) {
    const t = d / dSeg
    const z = -depth * t
    // 越往山后体量越低，侧视时呈楔形山块
    const backFactor = 1 - 0.42 * t * t
    const row = []
    for (let i = 0; i <= xSeg; i += 1) {
      const x = -width / 2 + (width * i) / xSeg
      const top = baseY + (profile(x) - baseY) * backFactor
      row.push(positions.length / 3)
      positions.push(x, top, z)
      uvs.push(i / xSeg, THREE.MathUtils.clamp(top / 12, 0, 1))
    }
    grid.push(row)
  }
  const frontBottom = []
  for (let i = 0; i <= xSeg; i += 1) {
    const x = -width / 2 + (width * i) / xSeg
    frontBottom.push(positions.length / 3)
    positions.push(x, baseY, 0)
    uvs.push(i / xSeg, 0)
  }
  const backBottom = []
  for (let i = 0; i <= xSeg; i += 1) {
    const x = -width / 2 + (width * i) / xSeg
    backBottom.push(positions.length / 3)
    positions.push(x, baseY, -depth)
    uvs.push(i / xSeg, 0)
  }
  const indices = []
  const quad = (a, b, c, d) => indices.push(a, b, c, a, c, d)
  // 表面
  for (let d = 0; d < dSeg; d += 1) {
    for (let i = 0; i < xSeg; i += 1) {
      quad(grid[d][i], grid[d + 1][i], grid[d + 1][i + 1], grid[d][i + 1])
    }
  }
  // front / back 立面
  for (let i = 0; i < xSeg; i += 1) {
    indices.push(grid[0][i], frontBottom[i], frontBottom[i + 1], grid[0][i], frontBottom[i + 1], grid[0][i + 1])
    indices.push(grid[dSeg][i], grid[dSeg][i + 1], backBottom[i + 1], grid[dSeg][i], backBottom[i + 1], backBottom[i])
  }
  // 两侧封口
  quad(grid[0][0], grid[dSeg][0], backBottom[0], frontBottom[0])
  quad(grid[0][xSeg], frontBottom[xSeg], backBottom[xSeg], grid[dSeg][xSeg])
  // 底面
  for (let i = 0; i < xSeg; i += 1) {
    quad(frontBottom[i], backBottom[i], backBottom[i + 1], frontBottom[i + 1])
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

// 近岸地表高度，供树木 / 建筑落脚
function bankHeightFactory(profile, baseY, depth) {
  return (x, z) => {
    const t = THREE.MathUtils.clamp(-z / depth, 0, 1)
    const backFactor = 1 - 0.42 * t * t
    return baseY + (profile(x) - baseY) * backFactor
  }
}

function makeTrees(count, bankHeight) {
  const rand = mulberry32(20260915)
  const group = new THREE.Group()
  const trunkGeometry = new THREE.CylinderGeometry(0.045, 0.085, 1, 5)
  const crownGeometry = new THREE.ConeGeometry(0.55, 1.55, 6)
  const lowerCrownGeometry = new THREE.ConeGeometry(0.72, 1.25, 6)
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x2c2519, roughness: 1 })
  const crownMaterial = new THREE.MeshStandardMaterial({ color: 0x2e3528, roughness: 1 })
  const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, count)
  const upper = new THREE.InstancedMesh(crownGeometry, crownMaterial, count)
  const lower = new THREE.InstancedMesh(lowerCrownGeometry, crownMaterial, count)
  const dummy = new THREE.Object3D()
  let planted = 0
  let guard = 0
  while (planted < count && guard < count * 12) {
    guard += 1
    const x = -12.5 + rand() * 23
    const z = -3.45 + rand() * 3.1
    const ground = bankHeight(x, z)
    if (ground < 0.18) continue // 不把树种进水里
    const i = planted
    const scale = 0.42 + rand() * 0.34
    dummy.rotation.y = rand() * Math.PI
    dummy.position.set(x, ground + 0.5 * scale, z)
    dummy.scale.set(scale, scale, scale)
    dummy.updateMatrix()
    trunks.setMatrixAt(i, dummy.matrix)
    dummy.position.y = ground + 1.55 * scale
    dummy.updateMatrix()
    upper.setMatrixAt(i, dummy.matrix)
    dummy.position.y = ground + 1.02 * scale
    dummy.scale.set(scale * 0.92, scale * 0.92, scale * 0.92)
    dummy.updateMatrix()
    lower.setMatrixAt(i, dummy.matrix)
    planted += 1
  }
  if (planted < count) {
    trunks.count = planted
    upper.count = planted
    lower.count = planted
  }
  for (const mesh of [trunks, upper, lower]) {
    mesh.instanceMatrix.needsUpdate = true
    mesh.castShadow = true
    mesh.receiveShadow = true
  }
  group.add(trunks, upper, lower)
  group.name = 'trees'
  return group
}

function makePavilion() {
  const group = new THREE.Group()
  const wood = new THREE.MeshStandardMaterial({ color: 0x4a3826, roughness: 0.9 })
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x26231d, roughness: 1 })
  const platform = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.16, 1.25), wood)
  platform.position.y = 0.08
  const eave = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.07, 1.5), roofMaterial)
  eave.position.y = 1.02
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.28, 0.62, 4), roofMaterial)
  roof.rotation.y = Math.PI / 4
  roof.position.y = 1.36
  const postGeometry = new THREE.BoxGeometry(0.09, 0.92, 0.09)
  for (const [px, pz] of [[-0.68, -0.46], [0.68, -0.46], [-0.68, 0.46], [0.68, 0.46]]) {
    const post = new THREE.Mesh(postGeometry, wood)
    post.position.set(px, 0.58, pz)
    group.add(post)
  }
  group.add(platform, eave, roof)
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })
  group.name = 'pavilion'
  return group
}

function makeBoat() {
  const group = new THREE.Group()
  const wood = new THREE.MeshStandardMaterial({ color: 0x3a2d1d, roughness: 1 })
  const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.5, 6), wood)
  hull.rotation.z = Math.PI / 2
  hull.scale.set(1, 1, 0.55)
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 4), wood)
  pole.position.set(0.45, 0.65, 0)
  pole.rotation.z = -0.35
  const awning = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.6, 8, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x554833, roughness: 1 }))
  awning.rotation.z = Math.PI / 2
  awning.position.set(-0.25, 0.2, 0)
  group.add(hull, pole, awning)
  group.traverse((child) => { if (child.isMesh) child.castShadow = true })
  group.name = 'boat'
  return group
}

function makeWater() {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: true,
    uniforms: {
      uTime: { value: 0 },
      uTint: { value: new THREE.Color('#5f6558').convertSRGBToLinear() },
      uLight: { value: 1.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uTint;
      uniform float uLight;
      varying vec2 vUv;
      #include <fog_pars_fragment>
      void main() {
        float ripple = sin(vUv.x * 130.0 + uTime * 0.7) * sin(vUv.y * 80.0 - uTime * 0.55);
        float thread = smoothstep(0.96, 1.0, sin(vUv.y * 56.0 + uTime * 0.35) * 0.5 + 0.5);
        vec3 deep = uTint * 0.45;
        vec3 color = mix(deep, uTint, uLight);
        color += (ripple * 0.025 + thread * 0.035) * uLight;
        gl_FragColor = vec4(color, 0.52);
        #include <fog_fragment>
      }
    `
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(34, 9.5), material)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(0, 0.02, -6.2)
  mesh.receiveShadow = true
  mesh.name = 'water'
  return mesh
}

function makeLabel(text) {
  const { texture, aspect, height } = makeLabelTexture(text)
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: true, depthWrite: false })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(aspect * height, height, 1)
  sprite.visible = false
  return sprite
}

export function buildLandscape(tier) {
  const group = new THREE.Group()
  group.name = 'landscape'
  const shadow = tier === 'high'
  const ridgeMaterial = (seed, options) => new THREE.MeshStandardMaterial({
    map: makeRidgeTexture(seed, options),
    color: 0xffffff,
    roughness: 1,
    metalness: 0
  })

  const baseY = -4
  const layers = []

  const addRidge = (config) => {
    const material = ridgeMaterial(config.seed, { tint: config.tint, mist: config.mist, cun: config.cun })
    const profile = ridgeProfile(config.peaks, baseY)
    const mesh = makeRidgeMesh({ profile, width: config.width, depth: config.depth, baseY, material, xSeg: config.segments })
    mesh.position.set(config.x || 0, 0, config.z)
    mesh.name = config.id
    group.add(mesh)
    const heightAt = bankHeightFactory(profile, baseY, config.depth)
    layers.push({ config, profile, mesh, heightAt })
    return { mesh, profile, heightAt }
  }

  // 由远及近（z 由小到大）
  addRidge({
    id: 'far-ridge', x: 1.5, z: -17, width: 34, depth: 2.4, seed: 11, tint: '#77716a', mist: 0.95, cun: 0.4, segments: 56,
    peaks: [{ cx: -8, amp: 8, w: 4.4 }, { cx: 2.5, amp: 7, w: 5.6 }, { cx: 11, amp: 8.4, w: 3.8 }]
  })
  addRidge({
    id: 'main-ridge', x: -0.5, z: -12.5, width: 30, depth: 4.2, seed: 23, tint: '#45423b', mist: 0.5, cun: 1, segments: 80,
    peaks: [
      { cx: 1.5, amp: 11.6, w: 3.1 }, { cx: -4.6, amp: 7.6, w: 2.5 }, { cx: 6.8, amp: 6.2, w: 3.4 },
      { cx: -9.5, amp: 4.4, w: 2.2 }, { cx: 9.6, amp: 3.6, w: 2.6 }
    ]
  })
  addRidge({
    id: 'mid-ridge', x: -1, z: -8.1, width: 32, depth: 3, seed: 37, tint: '#555148', mist: 0.72, cun: 0.7, segments: 64,
    peaks: [{ cx: -7, amp: 7.2, w: 3.2 }, { cx: 3.4, amp: 7.8, w: 3.8 }, { cx: 10, amp: 5.6, w: 3 }]
  })
  const nearBank = addRidge({
    id: 'near-bank', x: 0, z: 0, width: 34, depth: 3.8, seed: 51, tint: '#36302a', mist: 0.18, cun: 1.25, segments: 72,
    // 4.7 的常量峰保证整条江岸高出水线，额外峰头制造起伏
    peaks: [{ cx: 0, amp: 4.7, w: 26 }, { cx: -9, amp: 1.5, w: 3.6 }, { cx: -3, amp: 1.9, w: 3 }, { cx: 3.5, amp: 1.6, w: 3.4 }, { cx: 9.5, amp: 1.2, w: 4 }]
  })

  // 承载底面：与纸色一致，让挤出山块在侧视时仍“落”在画面上
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ map: makePaperTexture(), color: 0xffffff, roughness: 1 })
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.set(0, -0.18, -8)
  ground.receiveShadow = true
  group.add(ground)

  // 水面
  const water = makeWater()
  group.add(water)

  // 林木
  const treeCount = tier === 'high' ? 46 : tier === 'medium' ? 28 : 14
  const trees = makeTrees(treeCount, (x, z) => nearBank.heightAt(x, z))
  group.add(trees)

  // 建筑：半山亭（缩小到与人物尺度相近，贴合手卷比例）
  const pavilion = makePavilion()
  pavilion.scale.setScalar(0.62)
  pavilion.position.set(4.2, nearBank.heightAt(4.2, -1.5) - 0.02, -1.5)
  pavilion.rotation.y = -0.15
  group.add(pavilion)

  // 近景礁石
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(1.05, 0),
    new THREE.MeshStandardMaterial({ color: 0x2b2823, roughness: 1, flatShading: true })
  )
  rock.scale.set(1.7, 0.85, 1)
  rock.position.set(-8.6, 0.28, 1.9)
  rock.rotation.set(0.2, 0.7, 0.1)
  rock.castShadow = true
  rock.receiveShadow = true
  group.add(rock)

  // 江上小舟
  const boat = makeBoat()
  boat.position.set(-3.4, 0.1, -4.6)
  boat.rotation.y = 0.25
  group.add(boat)

  // 远山雾带
  const mistTexture = makeMistTexture()
  const mistGroup = new THREE.Group()
  mistGroup.name = 'mist'
  const rand = mulberry32(99)
  const mistSprites = []
  for (let i = 0; i < 6; i += 1) {
    const material = new THREE.SpriteMaterial({
      map: mistTexture,
      color: 0xf0ece0,
      transparent: true,
      opacity: 0.26 + rand() * 0.2,
      depthWrite: false
    })
    const sprite = new THREE.Sprite(material)
    const onWater = i < 4
    const z = onWater ? -4.7 - rand() * 4.2 : -10.4 - rand() * 1.6
    sprite.position.set(-12 + rand() * 24, onWater ? 0.45 + rand() * 0.7 : 1.5 + rand() * 1.1, z)
    const scale = 4.5 + rand() * 4
    sprite.scale.set(scale, scale * 0.34, 1)
    sprite.userData.baseX = sprite.position.x
    sprite.userData.phase = rand() * Math.PI * 2
    sprite.userData.drift = 0.5 + rand() * 0.8
    mistSprites.push(sprite)
    mistGroup.add(sprite)
  }
  group.add(mistGroup)

  // 远景日月
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeSunTexture(),
    color: 0xfff3d4,
    transparent: true,
    opacity: 0.9,
    depthWrite: false
  }))
  sun.scale.set(3.4, 3.4, 1)
  sun.position.set(-6.2, 9.4, -20.6)
  group.add(sun)

  // 纸本背景
  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(64, 38),
    new THREE.MeshStandardMaterial({ map: makePaperTexture(), color: 0xffffff, roughness: 1 })
  )
  backdrop.position.set(0, 6, -21.4)
  backdrop.receiveShadow = true
  group.add(backdrop)

  // 分层标注
  const labelGroup = new THREE.Group()
  labelGroup.name = 'labels'
  const labelSpecs = [
    { name: '远景山峦', position: [-9.5, 5.0, -16.4] },
    { name: '主峰 · 高远', position: [5.8, 9.2, -12] },
    { name: '水面 · 平远', position: [-8.4, 0.7, -6.2] },
    { name: '林木', position: [-6.2, 3.1, -0.4] },
    { name: '建筑 · 山亭', position: [6.5, 3.2, -1.4] },
    { name: '近景礁石', position: [-8.4, 1.9, 2.4] }
  ]
  for (const spec of labelSpecs) {
    const label = makeLabel(spec.name)
    label.position.set(...spec.position)
    labelGroup.add(label)
  }
  group.add(labelGroup)

  if (!shadow) {
    group.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false
        child.receiveShadow = false
      }
    })
  }

  return {
    group,
    waterMaterial: water.material,
    mistSprites,
    labelGroup,
    boat,
    setLabelsVisible(visible) {
      labelGroup.children.forEach((label) => { label.visible = visible })
    }
  }
}
