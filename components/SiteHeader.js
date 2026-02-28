import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FaGithub, FaLinkedin, FaEnvelope } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { SiReaddotcv } from 'react-icons/si'
import Animation from './Animation'
import avatar from '../public/avatar.jpg'

export default function SiteHeader({ alwaysCollapsed = false, staticFlower = false }) {
  const [scrollProgress, setScrollProgress] = useState(alwaysCollapsed ? 1 : 0)
  const [headerOffset, setHeaderOffset] = useState(0)
  const [windowWidth, setWindowWidth] = useState(1200)
  const [flowerSeed, setFlowerSeed] = useState(null)
  const [isPositioned, setIsPositioned] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (alwaysCollapsed) return
      const progress = Math.min(1, window.scrollY / 250)
      setScrollProgress(progress)
      // Once collapsed, slide header out as content approaches
      const collapsedHeaderHeight = 72
      const contentStart = 450
      const hideStart = contentStart - collapsedHeaderHeight
      if (window.scrollY > hideStart) {
        setHeaderOffset(-(window.scrollY - hideStart))
      } else {
        setHeaderOffset(0)
      }
    }

    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    // Read seed from URL param
    const params = new URLSearchParams(window.location.search)
    const seedParam = params.get('seed')
    if (seedParam) {
      const parsed = parseInt(seedParam, 10)
      if (!isNaN(parsed)) {
        setFlowerSeed(parsed)
      }
    }

    handleResize()
    if (alwaysCollapsed) {
      setScrollProgress(1)
    }

    requestAnimationFrame(() => {
      setIsPositioned(true)
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    })

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [alwaysCollapsed])

  const collapsed = scrollProgress > 0.5

  // Photo size: 110px -> 48px
  const photoSize = 110 - scrollProgress * 62

  // Icon size: 1.5rem (24px) -> 1rem (16px)
  const iconSize = 1.5 - scrollProgress * 0.5

  // Mojo size: 32px -> 20px
  const mojoSize = 32 - scrollProgress * 12

  // Animation scale
  const isLargeScreen = windowWidth > 768
  const collapsedScale = isLargeScreen ? 0.5 : 0.4
  const animationScale = 1 - scrollProgress * (1 - collapsedScale)

  // Photo/bloom center position
  const initialPhotoX = windowWidth / 2
  const collapsedPhotoX = 20 + photoSize / 2
  const bloomCenterX = initialPhotoX + scrollProgress * (collapsedPhotoX - initialPhotoX)

  const initialPhotoY = 190 + 55
  const collapsedPhotoY = 12 + photoSize / 2
  const bloomCenterY = initialPhotoY + scrollProgress * (collapsedPhotoY - initialPhotoY)

  return (
    <>
      {/* Animation - full width canvas */}
      <div
        style={{
          position: 'fixed',
          top: headerOffset,
          left: 0,
          width: '100%',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        <Animation
          centerX={bloomCenterX}
          centerY={bloomCenterY}
          scale={animationScale}
          seed={flowerSeed}
          isStatic={staticFlower}
        />
      </div>

      {/* Header */}
      <header
        style={{
          position: 'fixed',
          top: headerOffset,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      >
        {/* Profile photo */}
        <div
          onClick={e => {
            e.preventDefault()
            if (alwaysCollapsed) {
              window.location.href = '/'
            } else {
              setFlowerSeed(Math.floor(Math.random() * 1_000_000))
            }
          }}
          style={{
            position: 'absolute',
            left: bloomCenterX,
            top: bloomCenterY,
            transform: 'translate(-50%, -50%)',
            opacity: isVisible ? 1 : 0,
            transition: isPositioned
              ? `opacity 2s ease-out, left 0.3s ease-out, top 0.3s ease-out, transform 0.3s ease-out`
              : 'none',
            cursor: 'pointer',
          }}
        >
          <Image
            src={avatar}
            title="Well, hello!"
            alt="A picture of the author, Seandon!"
            height={photoSize}
            width={photoSize}
            style={{
              borderRadius: '100px',
              transition: isPositioned ? 'all 0.3s ease' : 'none',
            }}
          />
        </div>

        {/* Social icons */}
        <div
          style={{
            position: 'absolute',
            left: collapsed ? bloomCenterX + photoSize / 2 + 16 : bloomCenterX,
            top: collapsed ? bloomCenterY : bloomCenterY + photoSize / 2 + 24,
            transform: collapsed ? 'translateY(-50%)' : 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? '0.75rem' : '1.5rem',
            opacity: isVisible ? 1 : 0,
            transition: isPositioned
              ? `opacity 2s ease-out, left 0.3s ease-out, top 0.3s ease-out, transform 0.3s ease-out, gap 0.3s ease-out`
              : 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: collapsed ? '0.75rem' : '1.5rem',
              transition: 'gap 0.3s ease',
            }}
          >
            <a
              href="https://github.com/erulabs"
              rel="noreferrer nofollow"
              target="_blank"
              title="Checkout some of my code"
              style={{
                fontSize: `${iconSize}rem`,
                display: 'flex',
                alignItems: 'center',
                height: mojoSize,
                transition: 'font-size 0.3s ease',
              }}
            >
              <FaGithub />
            </a>
            <a
              href="https://twitter.com/erulabs"
              rel="noreferrer nofollow"
              target="_blank"
              title="I do the bird-app"
              style={{
                fontSize: `${iconSize}rem`,
                display: 'flex',
                alignItems: 'center',
                height: mojoSize,
                transition: 'font-size 0.3s ease',
              }}
            >
              <FaXTwitter />
            </a>
            <a
              href="mailto:seandon.mooy@gmail.com"
              rel="noreferrer nofollow"
              target="_blank"
              title="Send an email to Seandon"
              style={{
                fontSize: `${iconSize}rem`,
                display: 'flex',
                alignItems: 'center',
                height: mojoSize,
                transition: 'font-size 0.3s ease',
              }}
            >
              <FaEnvelope />
            </a>
            <a
              href="/resume"
              rel="noreferrer nofollow"
              target="_blank"
              title="View my resume"
              style={{
                fontSize: `${iconSize}rem`,
                display: 'flex',
                alignItems: 'center',
                height: mojoSize,
                transition: 'font-size 0.3s ease',
              }}
            >
              <SiReaddotcv />
            </a>
            <a
              href="https://www.linkedin.com/in/seandonmooy/"
              rel="noreferrer nofollow"
              target="_blank"
              title="super srs now"
              style={{
                fontSize: `${iconSize}rem`,
                display: 'flex',
                alignItems: 'center',
                height: mojoSize,
                transition: 'font-size 0.3s ease',
              }}
            >
              <FaLinkedin />
            </a>
            <a
              href="https://classdojo.com"
              rel="noreferrer nofollow"
              target="_blank"
              title="I am an Engineering Leader at ClassDojo, an amazing education company"
              style={{
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.3s ease',
                marginTop: -6,
              }}
            >
              <Image
                src="/mojo-shuffle.gif"
                alt="ClassDojo Mojo"
                width={mojoSize}
                height={mojoSize}
                unoptimized
                style={{ transition: 'all 0.3s ease' }}
              />
            </a>
          </div>
        </div>
      </header>
    </>
  )
}
