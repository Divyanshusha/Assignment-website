import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '../lib/gsap'

/**
 * Drives Lenis smooth scrolling from GSAP's ticker and keeps ScrollTrigger
 * in sync. Running both off a single RAF loop avoids the scroll-position
 * drift you get when Lenis and ScrollTrigger each animate on their own clock.
 * Disabled automatically when the user prefers reduced motion.
 */
export function useSmoothScroll() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    // Disable lag smoothing so Lenis stays in lockstep with the ticker. This is
    // a global GSAP setting, so restore GSAP's defaults on unmount rather than
    // leaving it clamped for any animation that outlives this hook.
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      // GSAP's out-of-the-box defaults: 500ms threshold, 33ms adjusted step.
      gsap.ticker.lagSmoothing(500, 33)
    }
  }, [])
}
