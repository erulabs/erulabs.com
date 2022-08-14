import { useState, useEffect } from 'react'
import Head from 'next/head'
import Image from 'next/future/image'
import styles from '../styles/Home.module.css'

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

export default function Home() {
  return (
    <div className={styles.siteContainer}>
      <div className={styles.container}>
        <Head>
          <title>-&gt; ...</title>
          <meta name="description" content="Seandon 'erulabs' Mooy's personal website" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <div>Body</div>
      </div>
    </div>
  )
}
