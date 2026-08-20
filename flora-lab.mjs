// Throwaway harness: software rasteriser for the flora geometry (graphite pass,
// blush wash, inverted-hull outline, no hatching) plus corolla coverage stats, so
// silhouette and framing can be judged without a browser.
import sharp from 'sharp'
import { Matrix4, Vector3 } from 'three'

import { buildGeometry } from './lib/flora/geometry.js'
import { KIND_LEAF, KIND_PETAL, KIND_RECEPTACLE, KIND_STEM, createGenome } from './lib/flora/genome.js'
import { BLUSH_AMOUNT, BLUSH_SPREAD, FOLIAGE_AMOUNT, GRAPHITE } from './lib/flora/palette.js'
import { createSolver, stepSolver, writePose } from './lib/flora/physics.js'
import { buildSkeletonSpec, instantiateSkeleton } from './lib/flora/skeleton.js'

const W = Number(process.env.VW || 500)
const H = Number(process.env.VH || 700)
const COLS = Number(process.env.COLS || 2)
const SEEDS = (process.env.SEEDS || '1,7,42,4242,555,90210').split(',').map(Number)
const SCROLLED = process.env.SCROLLED === '1'
const KEY = new Vector3(-0.45, 0.78, 0.44).normalize()
const FILL = new Vector3(0.55, -0.35, 0.76).normalize()

function hsv2rgb(h, s, v) {
  h = ((h % 1) + 1) % 1
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  return [
    [v, t, p],
    [q, v, p],
    [p, v, t],
    [p, q, v],
    [t, p, v],
    [v, p, q],
  ][i % 6]
}

// plant.js without the meshes: the rasteriser skins the geometry itself.
function build(seed) {
  const genome = createGenome(seed)
  const spec = buildSkeletonSpec(genome)
  const { bones, root, skeleton } = instantiateSkeleton(spec)
  const geometry = buildGeometry(spec, genome)
  const solver = createSolver(spec, genome)
  for (let i = 0; i < 120; i++) stepSolver(solver, null, 1 / 60, i / 60, false)
  writePose(solver, bones)
  root.updateMatrixWorld(true)
  const anchor = new Vector3(0, spec.bloomLift, 0).applyMatrix4(bones[spec.bloomBone].matrixWorld)
  const geo = geometry
  const pos = geo.attributes.position.array
  const nor = geo.attributes.normal.array
  const dir = geo.attributes.aOutlineDir.array
  const si = geo.attributes.skinIndex.array
  const sw = geo.attributes.skinWeight.array
  const count = geo.attributes.position.count
  const inv = skeleton.boneInverses
  const skinned = new Float32Array(count * 3)
  const normals = new Float32Array(count * 3)
  const outDir = new Float32Array(count * 3)
  const p = new Vector3()
  const n = new Vector3()
  const d = new Vector3()
  const accP = new Vector3()
  const accN = new Vector3()
  const accD = new Vector3()
  const m = new Matrix4()
  for (let v = 0; v < count; v++) {
    accP.set(0, 0, 0)
    accN.set(0, 0, 0)
    accD.set(0, 0, 0)
    for (let k = 0; k < 2; k++) {
      const w = sw[v * 4 + k]
      if (w === 0) continue
      const b = si[v * 4 + k]
      m.multiplyMatrices(bones[b].matrixWorld, inv[b])
      accP.add(p.set(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]).applyMatrix4(m).multiplyScalar(w))
      accN.add(n.set(nor[v * 3], nor[v * 3 + 1], nor[v * 3 + 2]).transformDirection(m).multiplyScalar(w))
      accD.add(d.set(dir[v * 3], dir[v * 3 + 1], dir[v * 3 + 2]).transformDirection(m).multiplyScalar(w))
    }
    accN.normalize()
    for (let c = 0; c < 3; c++) {
      skinned[v * 3 + c] = accP.getComponent(c)
      normals[v * 3 + c] = accN.getComponent(c)
      outDir[v * 3 + c] = accD.getComponent(c)
    }
    // aOutlineDir is zero on interior vertices; only boundaries extrude.
    if (dir[v * 3] === 0 && dir[v * 3 + 1] === 0 && dir[v * 3 + 2] === 0) {
      outDir[v * 3] = 0
      outDir[v * 3 + 1] = 0
      outDir[v * 3 + 2] = 0
    }
  }
  return { genome, spec, geo, skinned, normals, outDir, off: { x: -anchor.x, y: -anchor.y } }
}

function render(seed) {
  const plant = build(seed)
  const { geo, skinned, normals, outDir } = plant
  const hsv = geo.attributes.aHSV.array
  const param = geo.attributes.aParam.array
  const kind = geo.attributes.aKind.array
  const radius = geo.attributes.aRadius.array
  const idx = geo.index.array

  const heroScale = Math.min(1, W / 470)
  const collapsedScale = W > 768 ? 0.26 : 0.21
  const scale = SCROLLED ? collapsedScale : heroScale
  const cx = SCROLLED ? 44 : W / 2
  const cy = SCROLLED ? 36 : 245

  const rgb = new Uint8Array(W * H * 3).fill(255)
  const depth = new Float32Array(W * H).fill(-Infinity)
  const px = new Float32Array(3)
  const py = new Float32Array(3)
  const pz = new Float32Array(3)

  function project(v, j, outline) {
    let x = cx + (skinned[v * 3] + plant.off.x) * scale
    let y = cy - (skinned[v * 3 + 1] + plant.off.y) * scale
    if (outline) {
      const dx = outDir[v * 3]
      const dy = -outDir[v * 3 + 1]
      const l = Math.hypot(dx, dy)
      if (l > 1e-5) {
        const minW = 1.8 * (scale < 0.35 ? 0.55 : scale < 1 ? 0.55 + 0.45 * (scale - 0.35) / 0.65 : 1)
        const w = Math.max(minW, Math.min(2.6, 0.45 * radius[v] * scale))
        x += (dx / l) * w
        y += (dy / l) * w
      }
    }
    px[j] = x
    py[j] = y
    pz[j] = skinned[v * 3 + 2] - (outline ? 1.5 : 0)
  }

  // Stand-in for the shader's three screen-space hatch layers: same angles,
  // periods and tone gates, without the noise wobble that breaks the strokes up.
  function hatchAt(x, y, ang, period, widthPx) {
    const across = -Math.sin(ang) * x + Math.cos(ang) * y
    const f = Math.abs((((across / period) % 1) + 1) % 1 - 0.5) * period
    return f < widthPx * 0.5 ? 1 : 0
  }

  function hatchCover(x, y, tone, seed) {
    const a0 = 0.62 + seed * 0.9
    let h = 0
    h = Math.max(h, hatchAt(x, y, a0, 9, 1.3) * smoothstep(0.22, 0.46, tone))
    h = Math.max(h, hatchAt(x, y, a0 + 1.05, 9, 1.2) * smoothstep(0.46, 0.68, tone))
    h = Math.max(h, hatchAt(x, y, a0 - 0.9, 5.94, 1.1) * smoothstep(0.68, 0.9, tone))
    return h * 0.94
  }

  function fill(col) {
    const minX = Math.max(0, Math.floor(Math.min(px[0], px[1], px[2])))
    const maxX = Math.min(W - 1, Math.ceil(Math.max(px[0], px[1], px[2])))
    const minY = Math.max(0, Math.floor(Math.min(py[0], py[1], py[2])))
    const maxY = Math.min(H - 1, Math.ceil(Math.max(py[0], py[1], py[2])))
    const area = (px[1] - px[0]) * (py[2] - py[0]) - (px[2] - px[0]) * (py[1] - py[0])
    if (area === 0) return
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const w0 = ((px[1] - x) * (py[2] - y) - (px[2] - x) * (py[1] - y)) / area
        const w1 = ((px[2] - x) * (py[0] - y) - (px[0] - x) * (py[2] - y)) / area
        const w2 = 1 - w0 - w1
        if (w0 < 0 || w1 < 0 || w2 < 0) continue
        const z = w0 * pz[0] + w1 * pz[1] + w2 * pz[2]
        const o = y * W + x
        if (z <= depth[o]) continue
        depth[o] = z
        const c = typeof col === 'function' ? col(x, y) : col
        rgb[o * 3] = c[0]
        rgb[o * 3 + 1] = c[1]
        rgb[o * 3 + 2] = c[2]
      }
    }
  }

  const graphiteCol = GRAPHITE.map(c => 255 * c)

  // Hull pass first, exactly like the renderer's renderOrder 0.
  for (let t = 0; t < idx.length; t += 3) {
    project(idx[t], 0, true)
    project(idx[t + 1], 1, true)
    project(idx[t + 2], 2, true)
    fill(graphiteCol)
  }

  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t]
    project(a, 0, false)
    project(idx[t + 1], 1, false)
    project(idx[t + 2], 2, false)

    let nx = 0
    let ny = 0
    let nz = 0
    for (const v of [a, idx[t + 1], idx[t + 2]]) {
      nx += normals[v * 3]
      ny += normals[v * 3 + 1]
      nz += normals[v * 3 + 2]
    }
    const nl = Math.hypot(nx, ny, nz) || 1
    nx /= nl
    ny /= nl
    nz /= nl
    if (nz < 0) {
      nx = -nx
      ny = -ny
      nz = -nz
    }
    const key = (nx * KEY.x + ny * KEY.y + nz * KEY.z) * 0.5 + 0.5
    const fillL = (nx * FILL.x + ny * FILL.y + nz * FILL.z) * 0.5 + 0.5
    const lum = Math.min(Math.max(key * 0.75 + fillL * 0.25, 0), 1)
    const shade = Math.min(Math.max(1 - lum, 0), 1)

    const isStem = kind[a] === KIND_STEM
    const isLeaf = kind[a] === KIND_LEAF
    const isPetal = kind[a] === KIND_PETAL
    const isReceptacle = kind[a] === KIND_RECEPTACLE
    let radial = 1 - smoothstep(0, BLUSH_SPREAD, param[a])
    radial *= radial
    const blush = isPetal ? radial : isReceptacle ? 0.95 : 0
    const foliage = isStem ? 0.7 : isLeaf ? 0.28 : 0
    const bloom = isPetal || isReceptacle ? 1 : 0
    const washAmt = (blush * BLUSH_AMOUNT + foliage * FOLIAGE_AMOUNT) * (0.85 + 0.15 * shade)
    const wash = hsv2rgb(hsv[a * 3], hsv[a * 3 + 1] * (0.55 + 0.35 * bloom), 0.93 - 0.19 * shade)

    fill([0, 1, 2].map(i => 255 * (1 - washAmt + washAmt * wash[i])))
  }

  for (let y = 0; y < H; y++) {
    for (const x of [0, W - 1]) {
      const o = (y * W + x) * 3
      rgb[o] = 220
      rgb[o + 1] = 60
      rgb[o + 2] = 60
    }
  }

  const g = plant.genome
  console.log(
    `seed ${seed}  ${g.petalCount}x${g.petalRows}  full ${g.corollaFullness.toFixed(2)}  ` +
      `len ${g.petalLength.toFixed(0)}  wid ${g.petalWidth.toFixed(0)}  base ${g.petalBaseWidth.toFixed(2)}  ` +
      `tilt ${g.petalTilt.toFixed(2)}  bones ${plant.spec.count}  cover ${coverage(plant).toFixed(2)}`
  )
  return sharp(Buffer.from(rgb), { raw: { width: W, height: H, channels: 3 } }).png().toBuffer()
}

function smoothstep(a, b, x) {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

// Fraction of the corolla's own inscribed disc that the petals actually cover,
// seen from the camera. This is the "no gaps" number.
function coverage(plant) {
  const { geo, skinned } = plant
  const kind = geo.attributes.aKind.array
  const idx = geo.index.array
  const S = 160
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (let v = 0; v < kind.length; v++) {
    if (kind[v] !== KIND_PETAL && kind[v] !== KIND_RECEPTACLE) continue
    minX = Math.min(minX, skinned[v * 3])
    maxX = Math.max(maxX, skinned[v * 3])
    minY = Math.min(minY, skinned[v * 3 + 1])
    maxY = Math.max(maxY, skinned[v * 3 + 1])
  }
  const span = Math.max(maxX - minX, maxY - minY)
  const mx = (minX + maxX) / 2
  const my = (minY + maxY) / 2
  const hit = new Uint8Array(S * S)
  const to = (x, y) => [((x - mx) / span + 0.5) * (S - 1), ((y - my) / span + 0.5) * (S - 1)]
  for (let t = 0; t < idx.length; t += 3) {
    const vs = [idx[t], idx[t + 1], idx[t + 2]]
    if (vs.some(v => kind[v] !== KIND_PETAL && kind[v] !== KIND_RECEPTACLE)) continue
    const p = vs.map(v => to(skinned[v * 3], skinned[v * 3 + 1]))
    const area = (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) - (p[2][0] - p[0][0]) * (p[1][1] - p[0][1])
    if (area === 0) continue
    const x0 = Math.max(0, Math.floor(Math.min(p[0][0], p[1][0], p[2][0])))
    const x1 = Math.min(S - 1, Math.ceil(Math.max(p[0][0], p[1][0], p[2][0])))
    const y0 = Math.max(0, Math.floor(Math.min(p[0][1], p[1][1], p[2][1])))
    const y1 = Math.min(S - 1, Math.ceil(Math.max(p[0][1], p[1][1], p[2][1])))
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const w0 = ((p[1][0] - x) * (p[2][1] - y) - (p[2][0] - x) * (p[1][1] - y)) / area
        const w1 = ((p[2][0] - x) * (p[0][1] - y) - (p[0][0] - x) * (p[2][1] - y)) / area
        if (w0 < 0 || w1 < 0 || 1 - w0 - w1 < 0) continue
        hit[y * S + x] = 1
      }
    }
  }
  let inside = 0
  let filled = 0
  const r = S / 2
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      if (Math.hypot(x - r, y - r) > r) continue
      inside++
      filled += hit[y * S + x]
    }
  }
  return filled / inside
}

if (process.env.STATS === '1') {
  const N = Number(process.env.N || 300)
  const rows = []
  for (let i = 0; i < N; i++) {
    const plant = build(i * 7919 + 3)
    rows.push({ cover: coverage(plant), bones: plant.spec.count, rows: plant.genome.petalRows })
  }
  const pct = (key, q) => {
    const v = rows.map(r => r[key]).sort((a, b) => a - b)
    return v[Math.min(v.length - 1, Math.floor(q * v.length))]
  }
  for (const key of ['cover', 'bones']) {
    console.log(
      `${key.padEnd(6)} p05 ${pct(key, 0.05).toFixed(2).padStart(6)}  p50 ${pct(key, 0.5).toFixed(2).padStart(6)}  ` +
        `p95 ${pct(key, 0.95).toFixed(2).padStart(6)}  max ${Math.max(...rows.map(r => r[key])).toFixed(2)}`
    )
  }
  console.log(`3-whorl heads: ${rows.filter(r => r.rows === 3).length} / ${N}`)
  console.log(`over bone budget: ${rows.filter(r => r.bones > 128).length} / ${N}`)
} else {
  const tiles = []
  for (const seed of SEEDS) tiles.push(await render(seed))
  const rowCount = Math.ceil(tiles.length / COLS)
  await sharp({ create: { width: W * COLS, height: H * rowCount, channels: 3, background: '#eeeeee' } })
    .composite(tiles.map((input, i) => ({ input, left: (i % COLS) * W, top: Math.floor(i / COLS) * H })))
    .png()
    .toFile(process.env.OUT || 'flora-preview.png')
  console.log('wrote', process.env.OUT || 'flora-preview.png')
}
