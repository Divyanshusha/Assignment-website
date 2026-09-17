import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import styles from './Services.module.css'

const SERVICES = [
  {
    id: '01',
    tag: 'Managed Freight',
    title: 'Full-truckload & LTL, orchestrated end to end.',
    body: 'Tender, track and settle every shipment from a single pane. Dynamic lane pricing and automated carrier matching keep capacity flowing even when the market tightens.',
    points: [
      'Dynamic lane pricing',
      'Automated carrier matching',
      'Digital proof-of-delivery',
    ],
  },
  {
    id: '02',
    tag: 'Fleet Intelligence',
    title: 'Telematics that turn every mile into a decision.',
    body: 'Live vehicle health, driver-safety scoring and predictive maintenance alerts. FreightCore flags the failing part before it strands a load on the corridor.',
    points: [
      'Predictive maintenance',
      'Driver-safety scoring',
      'Fuel & idle analytics',
    ],
  },
  {
    id: '03',
    tag: 'Control Tower',
    title: 'One command view across the entire supply chain.',
    body: 'Unified visibility over carriers, warehouses and last-mile partners. Exception-based alerts and ETA prediction models keep customers ahead of every delay.',
    points: [
      'Real-time ETA models',
      'Exception-based alerting',
      'Customer visibility portal',
    ],
  },
]

export default function Services() {
  const rootRef = useRef(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    // With reduced motion, the matchMedia branch is skipped and the panels fall
    // back to a static vertical stack (see the media query in the CSS module).
    const mm = gsap.matchMedia(rootRef)

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const panels = gsap.utils.toArray(`.${styles.panel}`)
      // Hide everything but the first panel up front (JS-controlled so the CSS
      // fallback can keep them all visible for reduced motion).
      gsap.set(panels.slice(1), { autoAlpha: 0 })

      // Pin the stage and scrub through the panels. Each panel gets an equal
      // slice of the scroll distance; the visual only changes when a slice is
      // fully entered, so the transitions feel deliberate rather than jittery.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: () => `+=${panels.length * 100}%`,
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            const idx = Math.min(
              panels.length - 1,
              Math.floor(self.progress * panels.length),
            )
            setActive(idx)
          },
        },
      })

      panels.forEach((panel, i) => {
        if (i === 0) return
        // Scrub-tied movement: linear ease so the crossfade tracks scroll
        // position 1:1 (consistent with the Fleet / Stages scrub convention).
        tl.fromTo(
          panel,
          { autoAlpha: 0, yPercent: 12 },
          { autoAlpha: 1, yPercent: 0, ease: 'none' },
          i,
        ).to(panels[i - 1], { autoAlpha: 0, yPercent: -12, ease: 'none' }, i)
      })
    })

    return () => mm.revert()
  }, [])

  return (
    <section id="services" className={styles.services} ref={rootRef}>
      <div className={`container ${styles.layout}`}>
        <aside className={styles.rail}>
          <span className="eyebrow">What we operate</span>
          <ol className={styles.nav}>
            {SERVICES.map((s, i) => (
              <li
                key={s.id}
                className={`${styles.navItem} ${active === i ? styles.navActive : ''}`}
              >
                <span className={styles.navNum}>{s.id}</span>
                <span className={styles.navTag}>{s.tag}</span>
              </li>
            ))}
          </ol>
          <div className={styles.progress}>
            <span
              className={styles.progressBar}
              style={{ transform: `scaleX(${(active + 1) / SERVICES.length})` }}
            />
          </div>
        </aside>

        <div className={styles.stage}>
          {SERVICES.map((s) => (
            <article key={s.id} className={styles.panel}>
              <span className={styles.ghost}>{s.id}</span>
              <span className={styles.tag}>{s.tag}</span>
              <h3 className={styles.title}>{s.title}</h3>
              <p className={styles.body}>{s.body}</p>
              <ul className={styles.points}>
                {s.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
