import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Image from 'next/future/image'
import styles from '../styles/Home.module.css'
import { noise } from './game/perlin'

const apiRequest = async (path = '/', opts = {}) => {
  if (!opts.headers) opts.headers = {}
  const res = await window.fetch(`/api${path}`, opts)
  let json = {}
  try {
    json = await res.json()
  } catch (err) {
    console.error('failed to parse json from ', path)
  }
  return { status: res?.status || 500, headers: res?.headers, json, res }
}

const cellAutomata = (canvas, height, width) => {
  const WIDTH = width
  const HEIGHT = height
  const VOID = 0
  const SOLID = 1
  const SAND = 2

  const colors = []
  colors[VOID] = [180, 180, 180, 255]
  colors[SOLID] = [0, 0, 0, 255]
  colors[SAND] = [194, 178, 128, 255]

  noise.seed(0.342374)

  const ctx = canvas.getContext('2d')
  ctx.scale(4, 4)
  const imgData = ctx.createImageData(WIDTH, HEIGHT)
  let pen_down = false

  function ri(n) {
    return Math.floor(Math.random() * n + 1)
  }

  function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect()
    const pos = {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    }
    return pos
  }

  // init matrix
  const matrix = []
  const matrixClone = []
  for (let i = 0; i < WIDTH; i++) {
    matrix[i] = []
    matrixClone[i] = []
    for (let j = 0; j < HEIGHT; j++) {
      if (i === 0 || j === 0 || i === WIDTH - 1 || j === HEIGHT - 1) matrix[i][j] = SOLID
      else matrix[i][j] = VOID
    }
  }

  function cloneMatrix() {
    for (let i = 0; i < WIDTH; i++) {
      for (let j = 0; j < HEIGHT; j++) {
        matrixClone[i][j] = matrix[i][j]
      }
    }
  }

  // find the position of sand
  function calculateNewMatrix() {
    // clone the current matrix
    cloneMatrix()
    for (let i = 1; i < WIDTH - 1; i++) {
      for (let j = 0; j < HEIGHT - 1; j++) {
        if (matrixClone[i][j] === SAND) {
          if (matrixClone[i][j + 1] === VOID) {
            matrix[i][j] = VOID
            matrix[i][j + 1] = SAND
          } else if (matrixClone[i - 1][j + 1] === VOID) {
            matrix[i][j] = VOID
            matrix[i - 1][j + 1] = SAND
          } else if (matrixClone[i + 1][j + 1] === VOID) {
            matrix[i][j] = VOID
            matrix[i + 1][j + 1] = SAND
          }
        }
      }
    }
  }

  // add perlin noise alpha
  const noiseAlpha = []
  for (let i = 0; i < imgData.data.length; i += 4) {
    const x = (i / 4) % WIDTH
    const y = Math.floor(i / 4 / WIDTH)
    noiseAlpha[i] = 125 + Math.floor(((noise.simplex2(x / 3, y / 3) + 1) / 2) * 125)
  }

  function matrixToImageData() {
    for (let i = 0; i < imgData.data.length; i += 4) {
      const x = (i / 4) % WIDTH
      const y = Math.floor(i / 4 / WIDTH)
      imgData.data[i + 0] = colors[matrix[x][y]][0]
      imgData.data[i + 1] = colors[matrix[x][y]][1]
      imgData.data[i + 2] = colors[matrix[x][y]][2]
      if (matrix[x][y] === SAND) {
        imgData.data[i + 3] = noiseAlpha[i]
      } else {
        imgData.data[i + 3] = 255
      }
    }
  }

  const radius = 40

  canvas.addEventListener(
    'mousemove',
    function (evt) {
      if (pen_down) {
        const mousePos = getMousePos(canvas, evt)
        for (let i = 0; i < radius; i++)
          if (matrix?.[mousePos.x] && matrix[mousePos.x][mousePos.y] !== SOLID) {
            const nX = mousePos.x + ri(radius)
            const nY = mousePos.y + ri(radius)
            console.log('setting', nX, nY)
            if (matrix[nX]) matrix[nX][nY] = SAND
          }
      }
    },
    false
  )

  canvas.addEventListener(
    'mousedown',
    function (evt) {
      pen_down = true
    },
    false
  )

  canvas.addEventListener(
    'mouseup',
    function (evt) {
      pen_down = false
    },
    false
  )

  function loop() {
    calculateNewMatrix()
    matrixToImageData()
    ctx.putImageData(imgData, 0, 0)
    window.requestAnimationFrame(loop)
  }

  window.requestAnimationFrame(loop)
}

export default function Home() {
  const canvas = useRef(null)
  const height = typeof window !== 'undefined' ? Math.min(window.innerHeight, 812) : 812
  const width = typeof window !== 'undefined' ? Math.min(window.innerWidth, 375) : 375

  useEffect(() => {
    cellAutomata(canvas.current, Math.floor(height / 2), Math.floor(width / 2))
  }, [])
  return (
    <>
      <div className={styles.siteContainer}>
        <div className={styles.container}>
          <Head>
            <title>-&gt; ...</title>
            <meta name="description" content="Seandon 'erulabs' Mooy's personal website" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <div
            style={{
              display: 'flex',
              alignContent: 'center',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <canvas
              width={Math.floor(width / 2)}
              height={Math.floor(height / 2)}
              style={{ height, width }}
              ref={canvas}
            ></canvas>
          </div>
        </div>
      </div>
    </>
  )
}
