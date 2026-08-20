// Throwaway probe: is each petal presenting its face to the camera, or standing
// on edge like a windmill vane?
import { Matrix4, Vector3 } from 'three'

import { buildGeometry } from './lib/flora/geometry.js'
import { KIND_PETAL, createGenome } from './lib/flora/genome.js'
import { createSolver, stepSolver, writePose } from './lib/flora/physics.js'
import { buildSkeletonSpec, instantiateSkeleton } from './lib/flora/skeleton.js'

const seed = Number(process.env.SEED || 90210)
const genome = createGenome(seed)
const spec = buildSkeletonSpec(genome)
const { bones, root, skeleton } = instantiateSkeleton(spec)
const geo = buildGeometry(spec, genome)
const solver = createSolver(spec, genome)
for (let i = 0; i < 120; i++) stepSolver(solver, null, 1 / 60, i / 60, false)
writePose(solver, bones)
root.updateMatrixWorld(true)

const pos = geo.attributes.position.array
const nor = geo.attributes.normal.array
const si = geo.attributes.skinIndex.array
const sw = geo.attributes.skinWeight.array
const kind = geo.attributes.aKind.array
const param = geo.attributes.aParam.array
const inv = skeleton.boneInverses

const m = new Matrix4()
const p = new Vector3()
const n = new Vector3()

function skinnedAt(v, arr, isDir) {
  const acc = new Vector3()
  const tmp = isDir ? n : p
  for (let k = 0; k < 2; k++) {
    const w = sw[v * 4 + k]
    if (w === 0) continue
    const b = si[v * 4 + k]
    m.multiplyMatrices(bones[b].matrixWorld, inv[b])
    tmp.set(arr[v * 3], arr[v * 3 + 1], arr[v * 3 + 2])
    if (isDir) tmp.transformDirection(m)
    else tmp.applyMatrix4(m)
    acc.add(tmp.multiplyScalar(w))
  }
  return acc
}

// One representative vertex per petal: mid-length, on the midrib.
const rows = []
for (let v = 0; v < kind.length; v++) {
  if (kind[v] !== KIND_PETAL) continue
  if (param[v] < 0.45 || param[v] > 0.55) continue
  const nrm = skinnedAt(v, nor, true).normalize()
  rows.push(Math.abs(nrm.z))
}
rows.sort((a, b) => a - b)
const q = f => rows[Math.floor(f * (rows.length - 1))]
console.log(`seed ${seed}  ${genome.petalCount}x${genome.petalRows}  tilt ${genome.petalTilt.toFixed(2)}  head ${genome.headTilt.toFixed(2)}`)
console.log(`|dot(face normal, view)| over ${rows.length} mid-petal samples:`)
console.log(`  p10 ${q(0.1).toFixed(2)}  p50 ${q(0.5).toFixed(2)}  p90 ${q(0.9).toFixed(2)}`)
console.log(`  edge-on (<0.35): ${((rows.filter(r => r < 0.35).length / rows.length) * 100).toFixed(0)}%`)
