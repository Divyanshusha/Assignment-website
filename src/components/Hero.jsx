import { lazy, Suspense, useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'
import ErrorBoundary from './ErrorBoundary'
import GlobeFallback from './three/GlobeFallback'
import styles from './Hero.module.css'

// Code-split the Three.js scene: the hero copy paints from the main bundle
// while the ~180KB (gzip) 3D runtime streams in behind the preloader.
const GlobeScene = lazy(() => import('./three/GlobeScene'))

/**
 * @param {boolean} ready - flips true once the preloader has curtained away,
 *   so the hero intro doesn't play behind the loading screen.
 */
export default function Hero({ ready }) {
  const rootRef = useRef(null)

  useEffect(() => {
    if (!ready) return
    // matchMedia only runs the intro when motion is allowed; reduced-motion
    // users get the final (already visible) layout with no tweens.
    const mm = gsap.matchMedia(rootRef)
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.from(`.${styles.reveal}`, {
        yPercent: 120,
        duration: 1.1,
        stagger: 0.08,
      })
        .from(
          `.${styles.fade}`,
          { opacity: 0, y: 24, duration: 0.9, stagger: 0.12 },
          '-=0.7',
        )
        .from(
          `.${styles.canvas}`,
          { opacity: 0, scale: 0.92, duration: 1.6, ease: 'power2.out' },
          0,
        )
    })
    return () => mm.revert()
  }, [ready])

  return (
    <section id="top" className={styles.hero} ref={rootRef}>
      <div className={styles.canvas}>
        {/* If the 3D chunk fails to load or the scene throws (e.g. WebGL
            context loss), fall back to the static globe instead of a blank
            hero. GlobeScene also renders GlobeFallback itself when WebGL is
            unavailable up front. */}
        <ErrorBoundary fallback={<GlobeFallback />}>
          <Suspense fallback={null}>
            <GlobeScene />
          </Suspense>
        </ErrorBoundary>
      </div>
      <div className={styles.grid} aria-hidden="true" />

      <div className={`container ${styles.content}`}>
        <div className={styles.fade}>
          <span className="eyebrow">Freight &amp; Fleet, engineered</span>
        </div>

        <h1 className={styles.title}>
          <span className={styles.line}>
            <span className={styles.reveal}>Move freight</span>
          </span>
          <span className={styles.line}>
            <span className={styles.reveal}>
              like it&apos;s <span className={styles.accent}>weightless.</span>
            </span>
          </span>
        </h1>

        <p className={`${styles.sub} ${styles.fade}`}>
          FreightCore gives enterprise shippers real-time visibility across a global
          network — 18,000 vehicles, 60+ countries, one control tower.
        </p>

        <div className={`${styles.actions} ${styles.fade}`}>
          <a href="#services" className="btn btn-primary">
            Explore the platform
          </a>
          <a href="#stats" className="btn btn-ghost">
            See the network
          </a>
        </div>
      </div>

      <a
        href="#stats"
        className={`${styles.scrollCue} ${styles.fade}`}
        aria-label="Scroll down"
      >
        <span>Scroll</span>
        <span className={styles.cueLine} />
      </a>
    </section>
  )
}
