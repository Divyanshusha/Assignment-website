import { useEffect } from 'react'
import { gsap } from '../lib/gsap'

/**
 * Adds a "magnetic" pull to every element matching `selector`: while the cursor
 * is within `radius` px of the element's edge, the element offsets toward the
 * cursor (capped at `strength` px), then springs back with an elastic ease on
 * leave. Mount once (e.g. in App) — it binds all current matches.
 *
 * A no-op on touch / no-hover devices and when the user prefers reduced motion,
 * so the CTAs stay perfectly usable without any motion.
 *
 * @param {string} selector - defaults to primary CTAs.
 * @param {{ radius?: number, strength?: number, factor?: number }} [opts]
 */
export function useMagnetic(selector = '.btn-primary', opts = {}) {
  const { radius = 40, strength = 8, factor = 0.35 } = opts

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduced) return

    const els = Array.from(document.querySelectorAll(selector))
    if (els.length === 0) return

    // Track which elements are currently pulled so we only fire the elastic
    // spring-back once, on the frame the cursor leaves the reach zone.
    const active = new Map()

    // One window listener drives all CTAs (there are only a handful), so the
    // pull can begin *before* the cursor reaches the button, not just on hover.
    const onMove = (e) => {
      for (const el of els) {
        const r = el.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height / 2)
        const dist = Math.hypot(dx, dy)
        const reach = Math.max(r.width, r.height) / 2 + radius

        if (dist < reach) {
          let ox = dx * factor
          let oy = dy * factor
          const mag = Math.hypot(ox, oy)
          if (mag > strength) {
            ox = (ox / mag) * strength
            oy = (oy / mag) * strength
          }
          gsap.to(el, { x: ox, y: oy, duration: 0.4, ease: 'power3.out', overwrite: true })
          active.set(el, true)
        } else if (active.get(el)) {
          active.set(el, false)
          gsap.to(el, {
            x: 0,
            y: 0,
            duration: 0.7,
            ease: 'elastic.out(1, 0.3)',
            overwrite: true,
            // Drop the inline transform once settled so the button's CSS
            // hover-lift works normally again.
            onComplete: () => gsap.set(el, { clearProps: 'transform' }),
          })
        }
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      els.forEach((el) => {
        gsap.killTweensOf(el)
        gsap.set(el, { clearProps: 'transform' })
      })
    }
  }, [selector, radius, strength, factor])
}
