import dynamic from 'next/dynamic'
import ColorScheme from 'color-scheme'
import React from 'react'

// Based on "SAKURA BLOSSOM" by natalieyeye (https://editor.p5js.org/natalieyeye/sketches/ceBrnMFZr)

const HEIGHT = 1000
const TARGET_FPS = 30

const Sketch = dynamic(() => import('react-p5').then(mod => mod.default), {
  ssr: false,
})

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null
}

// organic is used to store the list of instances of Organic objects that we will create
const organics = []
// The variable change stores the rate of rotation and the y coordinate for noise later
let change, colorsPalette
let isVisible = true
let currentRotationSpeed = 0 // current speed (will decelerate over time)
let hasReachedFullSize = false // track when bloom animation is complete
let isStaticMode = false // when true, flower is instantly fully grown and non-rotating

// Target position and scale for the bloom (updated via props)
let targetCenterX = null // null means use default (center of screen)
let targetCenterY = 250
let targetScale = 1

// Flower parameters (randomized per page load)
let flowerParams = null
let providedSeed = null // seed from URL param

function windowResized(p5) {
  p5.resizeCanvas(p5.windowWidth, HEIGHT)
  if (targetCenterX === null) {
    for (let i = 0; i < organics.length; i++) {
      organics[i].baseXpos = p5.windowWidth / 2
    }
  }
}

// Generate flower parameters from a seed
function generateFlowerParams(p5, seed) {
  p5.randomSeed(seed)
  p5.noiseSeed(seed)

  // Color scheme
  const schemes = ['mono', 'contrast', 'triade', 'tetrade', 'analogic']
  const variations = ['pastel', 'soft', 'light', 'hard', 'pale']
  const scheme = schemes[p5.floor(p5.random(schemes.length))]
  const variation = variations[p5.floor(p5.random(variations.length))]

  return {
    seed,
    // Structure
    numShapes: p5.floor(p5.random(30, 70)), // 30-70 petals
    vertexStep: p5.random(0.2, 0.5), // sharpness (higher = fewer vertices = sharper petals)

    // Shape characteristics
    baseRadiusMin: p5.random(3, 10), // starting radius range
    baseRadiusMax: p5.random(10, 20),
    radiusGrowth: p5.random(2, 5), // how fast radius grows per petal
    roughnessMin: p5.random(5, 15), // waviness range (higher = more pointed)
    roughnessMax: p5.random(12, 25),
    angleSpread: p5.random(30, 120), // how petals are distributed angularly

    // Color
    colorScheme: scheme,
    colorVariation: variation,
    alphaMin: p5.random(15, 40),
    alphaMax: p5.random(70, 100),
    useComplement: p5.random() > 0.7, // 30% chance of complement colors

    // Style
    strokeProbability: p5.random(0.2, 0.8), // chance each petal has stroke
    strokeWeight: p5.random(0.2, 0.8),
    strokeAlpha: p5.random(30, 80),

    // Animation
    rotationSpeed: p5.random(0.001, 0.004),
    growthSpeed: p5.random(0.005, 0.02),
  }
}

function setup(p5, canvasParentRef) {
  p5.createCanvas(p5.windowWidth, HEIGHT).parent(canvasParentRef)
  p5.frameRate(TARGET_FPS)

  // Use provided seed, existing seed (hot reload), or generate new one
  const seed = providedSeed ?? flowerParams?.seed ?? p5.floor(p5.random(999999))
  flowerParams = generateFlowerParams(p5, seed)

  // Log seed with usage hint
  console.log(`https://seandonmooy.com?seed=${seed} 🌸`)

  // Set up colors based on params
  const colorScheme = new ColorScheme()
  const colors = colorScheme
    .scheme(flowerParams.colorScheme)
    .variation(flowerParams.colorVariation)
    .add_complement(flowerParams.useComplement)
    .web_safe(true)
    .colors()

  colorsPalette = colors.map(c => {
    const alpha = p5.random(flowerParams.alphaMin, flowerParams.alphaMax)
    return p5.color(...hexToRgb(c), alpha)
  })

  change = 0
  currentRotationSpeed = flowerParams.rotationSpeed
  hasReachedFullSize = false

  // Clear any existing organics (in case of hot reload)
  organics.length = 0

  for (let i = 0; i < flowerParams.numShapes; i++) {
    const baseRadius = p5.random(flowerParams.baseRadiusMin, flowerParams.baseRadiusMax)
    const radius = baseRadius + i * flowerParams.radiusGrowth
    const roughness = i * p5.random(flowerParams.roughnessMin, flowerParams.roughnessMax)

    organics.push(
      new Organic({
        p5,
        radius,
        baseXpos: p5.windowWidth / 2,
        baseYpos: 250,
        roughness,
        angle: i * p5.random(flowerParams.angleSpread),
        color: colorsPalette[p5.floor(p5.random(colorsPalette.length))],
        useStroke: p5.random() < flowerParams.strokeProbability,
        vertexStep: flowerParams.vertexStep,
        strokeWeight: flowerParams.strokeWeight,
        strokeAlpha: flowerParams.strokeAlpha,
        growthSpeed: flowerParams.growthSpeed,
      })
    )
  }

  if (isStaticMode) {
    currentRotationSpeed = 0
    hasReachedFullSize = true
    for (let i = 0; i < organics.length; i++) {
      organics[i].growthScale = 1
    }
  }

  // Pause animation when tab is not visible
  document.addEventListener('visibilitychange', () => {
    isVisible = !document.hidden
  })
}

function draw(p5) {
  if (!isVisible) return

  p5.clear()

  const centerX = targetCenterX !== null ? targetCenterX : p5.windowWidth / 2
  const centerY = targetCenterY

  // Check if all organics have reached full size
  if (!hasReachedFullSize && organics.length > 0) {
    const allFullSize = organics.every(o => o.growthScale >= 1)
    if (allFullSize) {
      hasReachedFullSize = true
    }
  }

  for (let i = 0; i < organics.length; i++) {
    organics[i].show(change, centerX, centerY, targetScale)
  }

  // Decelerate rotation after reaching full size
  if (hasReachedFullSize && currentRotationSpeed > 0) {
    // Deceleration rate: slower over ~30 seconds (900 frames at 30fps)
    // Faster deceleration when collapsed (targetScale < 1)
    const baseDeceleration = (flowerParams?.rotationSpeed ?? 0.002) / 900
    const collapseMultiplier = 1 + (1 - targetScale) * 3 // 1x at full size, up to 4x when collapsed
    currentRotationSpeed = Math.max(0, currentRotationSpeed - baseDeceleration * collapseMultiplier)
  }

  change += currentRotationSpeed
}

function Organic({
  p5,
  radius,
  baseXpos,
  baseYpos,
  roughness,
  angle,
  color,
  useStroke,
  vertexStep,
  strokeWeight,
  strokeAlpha,
  growthSpeed,
}) {
  this.radius = radius
  this.baseXpos = baseXpos
  this.baseYpos = baseYpos
  this.roughness = roughness
  this.angle = angle
  this.color = color
  this.useStroke = useStroke
  this.vertexStep = vertexStep
  this.strokeWeight = strokeWeight
  this.strokeAlpha = strokeAlpha
  this.growthSpeed = growthSpeed
  this.growthScale = 0.1

  this.show = function (change, centerX, centerY, scale) {
    if (this.useStroke) {
      p5.strokeWeight(this.strokeWeight * scale)
      p5.stroke(0, 0, 0, this.strokeAlpha)
    } else {
      p5.noStroke()
    }

    p5.fill(this.color)

    p5.push()
    p5.translate(centerX, centerY)
    p5.scale(scale)
    p5.rotate(this.angle + change)
    p5.beginShape()

    this.growthScale = this.growthScale + this.growthSpeed
    if (this.growthScale > 1) this.growthScale = 1
    p5.scale(p5.sin(this.growthScale))

    let off = 0
    for (let i = 0; i < p5.TWO_PI; i += this.vertexStep) {
      const offset = p5.map(p5.noise(off, change), 0, 1, -this.roughness, this.roughness)
      const r = this.radius + offset
      const x = r * p5.cos(i)
      const y = r * p5.sin(i)
      p5.curveVertex(x, y)
      off += this.vertexStep
    }
    p5.endShape(p5.CLOSE)
    p5.pop()
  }
}

export function setAnimationParams(centerX, centerY, scale) {
  targetCenterX = centerX
  targetCenterY = centerY
  targetScale = scale
}

const Animation = ({ centerX, centerY, scale = 1, seed = null, isStatic = false }) => {
  // Set seed and static mode synchronously so they're available when setup runs
  React.useMemo(() => {
    providedSeed = seed
    isStaticMode = isStatic
  }, [seed, isStatic])

  React.useEffect(() => {
    targetCenterX = centerX
    targetCenterY = centerY
    targetScale = scale
  }, [centerX, centerY, scale])

  React.useEffect(() => {
    return () => {
      const canvases = document.querySelectorAll('#animation canvas')
      canvases.forEach(canvas => canvas.remove())
    }
  }, [])

  return <Sketch id="animation" setup={setup} draw={draw} windowResized={windowResized} />
}

export default Animation
