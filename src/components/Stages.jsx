import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import styles from './Stages.module.css'

const STAGES = [
  {
    n: '01',
    title: 'Plan',
    tag: 'Design the lane',
    body: 'Model origin, destination and constraints. FreightCore prices the corridor and reserves capacity before a wheel turns.',
    // Gentle rising curve — "mapping the route".
    path: 'M12 130 C 70 120, 90 40, 150 55 S 250 40, 288 30',
  },
  {
    n: '02',
    title: 'Move',
    tag: 'Dispatch & haul',
    body: 'The load is tendered, a carrier is matched automatically, and the truck rolls with a digital manifest attached.',
    path: 'M12 90 C 80 40, 120 150, 190 90 S 260 30, 288 80',
  },
  {
    n: '03',
    title: 'Track',
    tag: 'Live visibility',
    body: 'Telematics stream position, temperature and ETA. Exceptions surface as alerts long before they become delays.',
    path: 'M12 40 C 70 60, 90 140, 150 120 S 240 130, 288 100',
  },
  {
    n: '04',
    title: 'Deliver',
    tag: 'Proof & settle',
    body: 'Digital proof-of-delivery closes the loop, the invoice reconciles itself, and the lane data feeds the next plan.',
    path: 'M12 120 C 80 130, 120 40, 180 60 S 250 120, 288 40',
  },
]

export default function Stages() {
  const rootRef = useRef(null)
  const trackRef = useRef(null)
  const viewportRef = useRef(null)

  useEffect(() => {
    const mm = gsap.matchMedia(rootRef)

    // Wire the per-stage reveals. On desktop these ride the horizontal
    // container animation; on mobile they use ordinary vertical triggers. The
    // `scrollTween` is the pinned horizontal tween (undefined on mobile).
    const buildStageReveals = (scrollTween) => {
      const panels = gsap.utils.toArray(`.${styles.panel}`)

      panels.forEach((panel) => {
        const copy = panel.querySelectorAll(`.${styles.reveal}`)
        const path = panel.querySelector(`.${styles.route}`)
        const dot = panel.querySelector(`.${styles.dot}`)

        // Prep the route line for a stroke-dashoffset draw.
        let len = 0
        if (path) {
          len = path.getTotalLength()
          gsap.set(path, { strokeDasharray: len, strokeDashoffset: len })
        }

        // With containerAnimation the start/end read as HORIZONTAL positions,
        // so the reveal fires when the panel scrolls into view sideways. On
        // mobile scrollTween is undefined, so it falls back to vertical.
        const st = scrollTween
          ? { trigger: panel, containerAnimation: scrollTween, start: 'left 65%' }
          : { trigger: panel, start: 'top 78%' }

        const tl = gsap.timeline({
          scrollTrigger: { ...st, toggleActions: 'play none none reverse' },
        })

        // Entrance easing: power3.out for the copy stagger-in.
        tl.from(copy, {
          opacity: 0,
          y: 32,
          duration: 0.7,
          stagger: 0.08,
          ease: 'power3.out',
        })

        if (path) {
          tl.to(path, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' }, 0.15)
        }
        if (dot && path) {
          // Dot travels the same path as it draws (motion-path along the route).
          // Revealed only as it starts moving so it never sits in the corner.
          tl.set(dot, { opacity: 1 }, 0.15).to(
            dot,
            {
              motionPath: { path, align: path, alignOrigin: [0.5, 0.5] },
              duration: 1,
              ease: 'power1.inOut',
            },
            0.15,
          )
        }
      })
    }

    mm.add(
      {
        // Horizontal pinned track only on real pointers/large screens with
        // motion allowed; everything else stacks vertically.
        isDesktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
        isMobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
      },
      (ctx) => {
        const { isDesktop } = ctx.conditions

        if (isDesktop) {
          const track = trackRef.current
          const getScrollAmount = () =>
            Math.max(0, track.scrollWidth - viewportRef.current.clientWidth)

          // The master horizontal tween — pinned + scrubbed — doubles as the
          // containerAnimation for the nested per-stage reveals.
          const scrollTween = gsap.to(track, {
            x: () => -getScrollAmount(),
            ease: 'none',
          })

          ScrollTrigger.create({
            trigger: rootRef.current,
            start: 'top top',
            end: () => `+=${getScrollAmount()}`,
            pin: true,
            scrub: 0.8,
            animation: scrollTween,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          })

          buildStageReveals(scrollTween)
        } else {
          // Mobile: same content, stacked, ordinary scroll-triggered reveals.
          buildStageReveals(null)
        }
      },
    )

    return () => mm.revert()
  }, [])

  return (
    <section id="stages" className={styles.stages} ref={rootRef}>
      <div className={styles.header}>
        <div className="container">
          <span className="eyebrow">How a load moves</span>
          <h2 className="section-title">Four stages, one continuous journey.</h2>
        </div>
      </div>

      <div className={styles.viewport} ref={viewportRef}>
        <div className={styles.track} ref={trackRef}>
          {STAGES.map((s) => (
            <article className={styles.panel} key={s.n}>
              <div className={styles.panelInner}>
                <span className={`${styles.num} ${styles.reveal}`}>{s.n}</span>
                <span className={`${styles.tag} ${styles.reveal}`}>{s.tag}</span>
                <h3 className={`${styles.title} ${styles.reveal}`}>{s.title}</h3>
                <p className={`${styles.body} ${styles.reveal}`}>{s.body}</p>

                <svg
                  className={`${styles.diagram} ${styles.reveal}`}
                  viewBox="0 0 300 160"
                  aria-hidden="true"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <path className={styles.routeGhost} d={s.path} />
                  <path className={styles.route} d={s.path} />
                  <circle className={styles.dot} r="6" cx="0" cy="0" />
                </svg>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
