import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'
import styles from './Cursor.module.css'

// Elements that make the ring swell — links, buttons, cards, or anything that
// opts in with data-cursor="ring".
const INTERACTIVE = 'a, button, .card, [data-cursor="ring"]'

/**
 * Two-part custom cursor: a fast dot pinned to the raw pointer position and a
 * larger ring that lags behind. Both axes use gsap.quickTo (one cached setter
 * per axis) rather than a fresh gsap.to per frame. The ring scales up over
 * interactive elements.
 *
 * Renders nothing and does nothing on touch / no-hover devices or when the user
 * prefers reduced motion — the OS cursor is left completely alone in that case.
 */
export default function Cursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return

    const dot = dotRef.current
    const ring = ringRef.current

    // Hide the native cursor everywhere only while the custom one is live.
    document.documentElement.classList.add('custom-cursor')

    // Cheap per-axis setters. Dot tracks tightly; ring trails for the lag.
    const xDot = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' })
    const yDot = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' })
    const xRing = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' })
    const yRing = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' })

    let shown = false
    const onMove = (e) => {
      if (!shown) {
        shown = true
        gsap.to([dot, ring], { autoAlpha: 1, duration: 0.25 })
      }
      xDot(e.clientX)
      yDot(e.clientY)
      xRing(e.clientX)
      yRing(e.clientY)
    }

    const onOver = (e) => {
      if (e.target.closest?.(INTERACTIVE)) {
        gsap.to(ring, { scale: 1.8, duration: 0.3, ease: 'power3.out' })
        gsap.to(dot, { scale: 0.6, duration: 0.3, ease: 'power3.out' })
      }
    }
    const onOut = (e) => {
      if (e.target.closest?.(INTERACTIVE)) {
        gsap.to(ring, { scale: 1, duration: 0.3, ease: 'power3.out' })
        gsap.to(dot, { scale: 1, duration: 0.3, ease: 'power3.out' })
      }
    }

    // Fade the cursor out when the pointer leaves the window.
    const onLeave = () => {
      shown = false
      gsap.to([dot, ring], { autoAlpha: 0, duration: 0.2 })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('pointerout', onOut, { passive: true })
    document.addEventListener('pointerleave', onLeave)

    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
      document.removeEventListener('pointerleave', onLeave)
      document.documentElement.classList.remove('custom-cursor')
      gsap.killTweensOf([dot, ring])
    }
  }, [])

  return (
    <>
      <div ref={ringRef} className={styles.ring} aria-hidden="true" />
      <div ref={dotRef} className={styles.dot} aria-hidden="true" />
    </>
  )
}
