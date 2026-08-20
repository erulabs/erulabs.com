// Three.js lifecycle for the procedural flora renderer.
//
// Deliberately framework-free: components/AnimationThree.js is a thin shell that
// mounts this and pushes params in. Nothing here touches React, so a SiteHeader
// re-render (which happens on every scroll event) costs nothing.

import { ColorManagement, OrthographicCamera, Group, Scene, WebGLRenderer } from 'three'

import { buildPlant, disposePlant, updatePlant } from './plant.js'

// Matches the p5 renderer's fixed canvas height so the two are interchangeable.
const CANVAS_HEIGHT = 1000

// Capped well below 2 on purpose. Paper tooth and graphite grain are screen-space
// noise fields that read correctly when one grain is about one device pixel; at
// DPR 2 the grain is sub-perceptual and costs 4x the fragments for nothing.
const MAX_DPR = 1.25

const FIXED_DT = 1 / 60
const MAX_SUBSTEPS = 3

function viewportWidth() {
  return window.innerWidth
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function createFloraScene({ container, seed, isStatic = false, debug = false }) {
  ColorManagement.enabled = false

  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: true,
    stencil: false,
    depth: true,
    powerPreference: 'high-performance',
  })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR))
  renderer.domElement.style.display = 'block'
  container.appendChild(renderer.domElement)

  const scene = new Scene()

  // One world unit == one CSS pixel. This is what lets centerX/centerY/scale from
  // SiteHeader map straight onto the group with no conversion, and it makes the
  // outline width in the shader exactly computable (no perspective divide).
  const camera = new OrthographicCamera(0, 1, 0, -1, -2000, 2000)
  camera.position.z = 1000

  // The plant's bones live under this group, so AttachedBindMode cancels the group
  // transform before skinning and modelViewMatrix reapplies it. Bones parented
  // anywhere else double-scale the plant, but only while scrolling.
  const group = new Group()
  scene.add(group)

  const params = { centerX: 0, centerY: 250, scale: 1 }
  const state = { width: 0, height: CANVAS_HEIGHT, running: false, visible: !document.hidden, onScreen: true }

  let plant = null
  let clockStart = 0
  let elapsed = 0
  let accumulator = 0
  let lastFrame = 0
  const reducedMotion = prefersReducedMotion()

  // isStatic (the resume page) and reduced motion both mean: settle, draw one
  // frame, stop the loop entirely. The plant rests in its gravity-drooped pose.
  const staticPose = isStatic || reducedMotion

  let overlay = null
  let overlayTimer = 0
  let frameMs = 0

  function resize() {
    const width = viewportWidth()
    if (width === state.width) return
    state.width = width
    renderer.setSize(width, CANVAS_HEIGHT)
    camera.left = 0
    camera.right = width
    camera.top = 0
    camera.bottom = -CANVAS_HEIGHT
    camera.updateProjectionMatrix()
    requestRender()
  }

  function applyParams() {
    group.position.set(params.centerX, -params.centerY, 0)
    group.scale.setScalar(params.scale)
  }

  function renderFrame() {
    const t0 = debug ? performance.now() : 0
    renderer.render(scene, camera)
    if (debug) {
      frameMs = frameMs * 0.9 + (performance.now() - t0) * 0.1
    }
  }

  function tick(now) {
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.25) : FIXED_DT
    lastFrame = now
    elapsed = (now - clockStart) / 1000

    accumulator += dt
    let steps = 0
    while (accumulator >= FIXED_DT && steps < MAX_SUBSTEPS) {
      accumulator -= FIXED_DT
      steps++
      if (plant) updatePlant(plant, FIXED_DT, elapsed)
    }
    if (steps === MAX_SUBSTEPS) accumulator = 0

    applyParams()
    renderFrame()

    if (debug && overlay) {
      overlayTimer += dt
      if (overlayTimer > 0.25) {
        overlayTimer = 0
        const info = renderer.info
        overlay.textContent = [
          `render ${frameMs.toFixed(2)}ms`,
          `calls ${info.render.calls}`,
          `tris ${info.render.triangles}`,
          `geom ${info.memory.geometries}`,
          `bones ${plant ? plant.bones.length : 0}`,
        ].join('  ·  ')
      }
    }
  }

  function start() {
    if (state.running || staticPose) return
    if (!state.visible || !state.onScreen) return
    state.running = true
    lastFrame = 0
    renderer.setAnimationLoop(tick)
  }

  function stop() {
    if (!state.running) return
    state.running = false
    renderer.setAnimationLoop(null)
  }

  // Draw exactly one frame without starting the loop (resize while paused, static pose).
  function requestRender() {
    if (state.running) return
    applyParams()
    renderFrame()
  }

  function rebuild(nextSeed) {
    if (plant) {
      disposePlant(plant)
      plant = null
    }
    plant = buildPlant(nextSeed)
    plant.setPixelRatio(renderer.getPixelRatio())
    plant.setScale(params.scale)
    group.add(plant.container)

    clockStart = performance.now()
    elapsed = 0
    accumulator = 0
    lastFrame = 0

    if (staticPose) {
      // Settle the physics silently, then draw the resting pose once.
      for (let i = 0; i < 90; i++) updatePlant(plant, FIXED_DT, i * FIXED_DT, { wind: false })
      updatePlant(plant, 0, 0, { growth: 1 })
    } else {
      start()
    }

    // Always paint once. start() may be a no-op (hidden tab, off-screen), and a
    // canvas that has never rendered is a blank canvas until something wakes it.
    applyParams()
    renderFrame()
  }

  const onResize = () => resize()
  const onVisibility = () => {
    state.visible = !document.hidden
    if (state.visible) start()
    else stop()
  }

  window.addEventListener('resize', onResize, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)

  let observer = null
  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(
      entries => {
        state.onScreen = entries[0].isIntersecting
        if (state.onScreen) start()
        else stop()
      },
      { rootMargin: '64px' }
    )
    observer.observe(container)
  }

  if (debug) {
    overlay = document.createElement('div')
    overlay.style.cssText =
      'position:absolute;top:4px;left:8px;font:11px ui-monospace,monospace;color:#555;' +
      'background:rgba(255,255,255,.7);padding:2px 6px;border-radius:3px;white-space:nowrap'
    container.appendChild(overlay)
  }

  if (debug) {
    // Handle for poking at the live scene from the console.
    window.__flora = {
      renderer,
      scene,
      camera,
      group,
      state,
      getPlant: () => plant,
      setSeed: nextSeed => rebuild(nextSeed),
      // Advance the simulation by hand, for measuring behaviour without rAF.
      step: (dt, t) => updatePlant(plant, dt, t),
    }
  }

  resize()
  rebuild(seed)

  return {
    setParams(centerX, centerY, scale) {
      params.centerX = centerX
      params.centerY = centerY
      params.scale = scale
      if (plant) plant.setScale(scale)
      requestRender()
    },
    setSeed(nextSeed) {
      rebuild(nextSeed)
    },
    dispose() {
      stop()
      if (observer) observer.disconnect()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      if (plant) {
        disposePlant(plant)
        plant = null
      }
      renderer.dispose()
      renderer.forceContextLoss()
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay)
      overlay = null
      if (debug && window.__flora && window.__flora.renderer === renderer) delete window.__flora
    },
  }
}
