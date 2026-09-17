import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import ErrorBoundary from './ErrorBoundary'
import TruckFallback from './three/TruckFallback'
import styles from './Journey3D.module.css'

// Code-split the Three.js scene, same as the hero globe — the section copy
// paints from the main bundle while the 3D runtime streams in behind it.
const TruckScene = lazy(() => import('./three/TruckScene'))

/**
 * Standalone pinned section housing the scroll-driven 3D truck. This component
 * owns the ScrollTrigger and writes normalized progress (0→1) into a ref that
 * the r3f scene reads inside its own render loop — so no second RAF loop is
 * introduced and the truck only moves when the user scrolls.
 */
export default function Journey3D() {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const progressRef = useRef(0)
  const [inView, setInView] = useState(true)

  // Reduced-motion / SSR guard resolved once. When reduced, we skip the pinned
  // scrub entirely and show the static truck so the content is still present.
  const [reduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const mm = gsap.matchMedia(rootRef)

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Pin the stage and scrub scroll into progressRef. The scene lerps toward
      // this value, so scrubbing feels smooth without a second animation clock.
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top top',
        end: '+=240%',
        pin: stageRef.current,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progressRef.current = self.progress
        },
      })
    })

    return () => mm.revert()
  }, [])

  // Pause the WebGL render loop while the section is scrolled out of view.
  useEffect(() => {
    if (reduced) return
    const el = stageRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  return (
    <section id="journey-3d" className={styles.journey} ref={rootRef}>
      <div className={styles.stage} ref={stageRef}>
        <div className={styles.canvasWrap}>
          {reduced ? (
            <TruckFallback />
          ) : (
            <ErrorBoundary fallback={<TruckFallback />}>
              <Suspense fallback={null}>
                <TruckScene progressRef={progressRef} inView={inView} />
              </Suspense>
            </ErrorBoundary>
          )}
        </div>

        <div className={`container ${styles.overlay}`}>
          <span className="eyebrow">The journey</span>
          <h2 className={styles.title}>
            Every load, in motion — <span className={styles.accent}>on your scroll.</span>
          </h2>
          <p className={styles.sub}>
            Watch a shipment travel the corridor from pickup to delivery. Scroll to
            drive it forward.
          </p>
        </div>
      </div>
    </section>
  )
}
