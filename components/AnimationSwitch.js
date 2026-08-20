import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

// Picks between the original p5 bloom and the Three.js flora. Both are loaded
// through next/dynamic so a visitor downloads p5 *or* three, never both.
const AnimationCanvas = dynamic(() => import('./Animation'), { ssr: false })
const AnimationThree = dynamic(() => import('./AnimationThree'), { ssr: false })

const STORAGE_KEY = 'floraRenderer'
const DEFAULT_RENDERER = 'three'

// WebGL contexts are a capped resource (~16 live), so probe exactly once.
let webglSupport = null
function hasWebGL() {
  if (webglSupport !== null) return webglSupport
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    webglSupport = !!gl
    if (gl) gl.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webglSupport = false
  }
  return webglSupport
}

function chooseRenderer() {
  let choice = DEFAULT_RENDERER
  const param = new URLSearchParams(window.location.search).get('renderer')

  if (param === 'canvas' || param === 'three') {
    choice = param
    try {
      window.localStorage.setItem(STORAGE_KEY, param)
    } catch {
      // Private browsing; the URL param still wins for this page view.
    }
  } else {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === 'canvas' || stored === 'three') choice = stored
    } catch {
      // Ignore and fall through to the default.
    }
  }

  return choice === 'three' && !hasWebGL() ? 'canvas' : choice
}

export default function AnimationSwitch(props) {
  // Rendering nothing on the first pass keeps the server and client markup in
  // agreement; location/localStorage are only readable after mount.
  const [renderer, setRenderer] = useState(null)

  useEffect(() => {
    setRenderer(chooseRenderer())
  }, [])

  if (renderer === null) return null
  if (renderer === 'canvas') return <AnimationCanvas {...props} />
  return <AnimationThree {...props} />
}
