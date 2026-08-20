import { useEffect, useRef } from 'react'

// Thin shell around lib/flora/scene. SiteHeader calls setState on every scroll
// event, so this component re-renders constantly -- it must therefore stay
// structurally inert: one div, no children, params pushed through a ref.

const AnimationThree = ({ centerX, centerY, scale = 1, seed = null, isStatic = false }) => {
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const seedRef = useRef(null)
  const paramsRef = useRef({ centerX, centerY, scale })

  // Declared before the mount effect on purpose: effects run in declaration
  // order, so seedRef is populated by the time the scene is constructed.
  useEffect(() => {
    const resolved = seed ?? Math.floor(Math.random() * 1_000_000)
    seedRef.current = resolved
    // eslint-disable-next-line no-console
    console.log(`https://seandonmooy.com?seed=${resolved} 🌸`)
    if (sceneRef.current) sceneRef.current.setSeed(resolved)
  }, [seed])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let scene = null
    let cancelled = false

    import('../lib/flora/scene')
      .then(({ createFloraScene }) => {
        if (cancelled) return
        scene = createFloraScene({
          container,
          seed: seedRef.current,
          isStatic,
          debug: new URLSearchParams(window.location.search).get('debug') === '1',
        })
        sceneRef.current = scene
        const p = paramsRef.current
        scene.setParams(p.centerX, p.centerY, p.scale)
      })
      .catch(err => {
        // Without this the renderer fails silently and the canvas never appears.
        console.error('flora: failed to start renderer', err)
      })

    return () => {
      cancelled = true
      if (scene) scene.dispose()
      sceneRef.current = null
    }
  }, [isStatic])

  useEffect(() => {
    paramsRef.current = { centerX, centerY, scale }
    if (sceneRef.current) sceneRef.current.setParams(centerX, centerY, scale)
  }, [centerX, centerY, scale])

  return <div ref={containerRef} style={{ position: 'relative' }} />
}

export default AnimationThree
