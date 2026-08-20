// Assembles a plant from a seed: genome -> skeleton -> geometry -> materials.

import { Group, Matrix4, SkinnedMesh, Vector3 } from 'three'

import { buildGeometry } from './geometry.js'
import { createGenome } from './genome.js'
import { createOutlineMaterial, createSharedUniforms, createSketchMaterial } from './materials.js'
import { createSolver, stepSolver, writePose } from './physics.js'
import { buildSkeletonSpec, instantiateSkeleton } from './skeleton.js'
import { createWind } from './wind.js'

// Geometry is authored in the skeleton's own bind space, so the bind matrix is
// identity. AttachedBindMode then cancels the parent group's transform before
// skinning and modelViewMatrix reapplies it -- which is why the bones must be
// parented to the same group as the mesh.
const BIND_MATRIX = new Matrix4()

export function buildPlant(seed) {
  const genome = createGenome(seed)
  const spec = buildSkeletonSpec(genome)
  const { bones, root, skeleton } = instantiateSkeleton(spec)
  const geometry = buildGeometry(spec, genome)

  const solver = createSolver(spec, genome)
  const wind = createWind(genome)

  const shared = createSharedUniforms()
  const material = createSketchMaterial(shared)
  const outlineMaterial = createOutlineMaterial(shared)

  // Two meshes over one geometry and one skeleton. three guards Skeleton.update
  // with `skeleton.frame !== info.render.frame`, so the second mesh costs no
  // extra bone work -- just the draw call.
  const mesh = new SkinnedMesh(geometry, material)
  const outline = new SkinnedMesh(geometry, outlineMaterial)

  for (const m of [mesh, outline]) {
    // A SkinnedMesh bounding sphere is computed from the bind pose; droop and
    // wind push vertices outside it and the plant pops out of existence
    // mid-scroll.
    m.frustumCulled = false
    m.bind(skeleton, BIND_MATRIX)
  }

  // Hull first so it writes depth, then the plant over the top. three's default
  // depthFunc is LessEqual, so the coplanar ribbon faces still win.
  outline.renderOrder = 0
  mesh.renderOrder = 1

  // Bones and meshes go in one container so the scene adds and removes the plant
  // as a single unit -- removing the meshes and forgetting the bone root (or vice
  // versa) silently leaks a whole plant per regeneration.
  //
  // The container itself must stay at identity: AttachedBindMode derives
  // bindMatrixInverse from the mesh's world matrix to cancel the parent group's
  // transform, and a transform here would be applied twice.
  const container = new Group()

  // Measure where the bloom actually lands once the rest pose and gravity droop
  // are applied, then shift the plant so it sits on the origin. Without this a
  // strongly curved stem carries its flower well off to one side of the avatar.
  // The container transform is safe here: AttachedBindMode cancels the mesh's
  // whole world matrix before skinning and modelViewMatrix reapplies it.
  writePose(solver, bones)
  root.updateMatrixWorld(true)
  const anchor = new Vector3(0, spec.bloomLift, 0).applyMatrix4(bones[spec.bloomBone].matrixWorld)
  container.position.set(-anchor.x, -anchor.y, 0)

  container.add(root, outline, mesh)

  return {
    seed,
    genome,
    spec,
    container,
    root,
    bones,
    solver,
    wind,
    skeleton,
    meshes: [outline, mesh],
    geometries: [geometry],
    materials: [material, outlineMaterial],
    shared,
    setScale(scale) {
      shared.uScale.value = scale
    },
    setPixelRatio(dpr) {
      shared.uPixelRatio.value = dpr
    },
    setGrowth(g) {
      shared.uGrowth.value = g
    },
  }
}

// How long the plant takes to draw itself in. aGrowth staggers organs within it.
const GROW_SECONDS = 2.6

export function updatePlant(plant, dt, elapsed, opts) {
  const windEnabled = !opts || opts.wind !== false
  plant.shared.uTime.value = elapsed
  if (!opts || opts.growth === undefined) {
    plant.shared.uGrowth.value = Math.min(elapsed / GROW_SECONDS, 1)
  } else {
    plant.shared.uGrowth.value = opts.growth
  }
  if (dt > 0) stepSolver(plant.solver, plant.wind, dt, elapsed, windEnabled)
  writePose(plant.solver, plant.bones)
}

export function disposePlant(plant) {
  plant.container.removeFromParent()
  for (let i = 0; i < plant.geometries.length; i++) plant.geometries[i].dispose()
  for (let i = 0; i < plant.materials.length; i++) plant.materials[i].dispose()
  // Frees the bone texture, which is one GPU texture per plant.
  if (plant.skeleton) plant.skeleton.dispose()
  plant.container.clear()
  plant.geometries.length = 0
  plant.materials.length = 0
  plant.meshes.length = 0
}
