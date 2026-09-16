import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/gsap'
import styles from './Preloader.module.css'

/**
 * Brand loading state. Counts to 100 while the app mounts, then curtains up.
 * Calls onComplete so the hero can start its intro only once we're out of view.
 * The progress bar fill, collapse and curtain are all driven by this single
 * GSAP timeline — there's no competing CSS keyframe animation.
 */
export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const rootRef = useRef(null)

  useEffect(() => {
    const counter = { value: 0 }
    const tl = gsap.timeline()

    tl.to(
      counter,
      {
        value: 100,
        duration: 1.6,
        ease: 'power2.inOut',
        onUpdate: () => setProgress(Math.round(counter.value)),
      },
      0,
    )
      // fill the bar in lockstep with the counter
      .fromTo(
        `.${styles.bar}`,
        { scaleX: 0 },
        { scaleX: 1, transformOrigin: 'left', duration: 1.6, ease: 'power2.inOut' },
        0,
      )
      .to(`.${styles.bar}`, {
        scaleX: 0,
        transformOrigin: 'right',
        duration: 0.5,
        ease: 'power2.in',
      })
      .to(rootRef.current, {
        yPercent: -100,
        duration: 0.9,
        ease: 'expo.inOut',
        onComplete: () => onComplete?.(),
      })

    return () => tl.kill()
    // onComplete is stabilised with useCallback in App, so this runs once.
  }, [onComplete])

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true">
      <div className={styles.inner}>
        <span className={styles.brand}>
          FREIGHT<span className={styles.brandAccent}>CORE</span>
        </span>
        <div className={styles.track}>
          <div className={styles.bar} />
        </div>
        <span className={styles.count}>{progress}%</span>
      </div>
    </div>
  )
}
