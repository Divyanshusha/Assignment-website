import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import styles from './Fleet.module.css'

const FLEET = [
  {
    id: '01',
    name: 'Long-haul tractors',
    spec: 'Class 8 · 400+ mi range',
    metric: '6,200',
    unit: 'active units',
  },
  {
    id: '02',
    name: 'Refrigerated trailers',
    spec: 'Multi-temp · IoT-monitored',
    metric: '3,850',
    unit: 'active units',
  },
  {
    id: '03',
    name: 'Container chassis',
    spec: 'Port drayage · 40ft / 20ft',
    metric: '4,100',
    unit: 'active units',
  },
  {
    id: '04',
    name: 'Last-mile EV vans',
    spec: 'Zero-emission · urban',
    metric: '2,600',
    unit: 'active units',
  },
  {
    id: '05',
    name: 'Heavy flatbeds',
    spec: 'Oversize · project cargo',
    metric: '1,250',
    unit: 'active units',
  },
]

export default function Fleet() {
  const rootRef = useRef(null)
  const trackRef = useRef(null)
  const viewportRef = useRef(null)

  useEffect(() => {
    // Reduced motion skips the pinned scroll-jack; the CSS fallback lets the
    // track scroll horizontally on its own so every card stays reachable.
    const mm = gsap.matchMedia(rootRef)

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const track = trackRef.current
      // Measure the overflow against the viewport container's own clientWidth,
      // not window.innerWidth. clientWidth excludes any vertical scrollbar and
      // tracks browser zoom / responsive sizing, so the last card lands flush
      // instead of being clipped or leaving a blank gap. Clamp to >= 0 so a
      // non-overflowing track (very wide screens) never produces negative x.
      const getScrollAmount = () =>
        Math.max(0, track.scrollWidth - viewportRef.current.clientWidth)

      // Pin the section and translate the card track sideways by exactly the
      // overflow width, so vertical scroll reads as a horizontal pan. end is a
      // function so it recomputes on resize instead of caching a stale width.
      const tween = gsap.to(track, {
        x: () => -getScrollAmount(),
        ease: 'none',
      })

      ScrollTrigger.create({
        trigger: rootRef.current,
        start: 'top top',
        end: () => `+=${getScrollAmount()}`,
        pin: true,
        scrub: 0.8,
        animation: tween,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      })
    })

    return () => mm.revert()
  }, [])

  return (
    <section id="fleet" className={styles.fleet} ref={rootRef}>
      <div className={styles.header}>
        <div className="container">
          <span className="eyebrow">The fleet</span>
          <h2 className="section-title">Purpose-built equipment for every lane.</h2>
        </div>
      </div>

      <div className={styles.viewport} ref={viewportRef}>
        <div className={styles.track} ref={trackRef}>
          {FLEET.map((v) => (
            <article className={styles.card} key={v.id}>
              <span className={styles.cardId}>{v.id}</span>
              <div className={styles.cardVisual} aria-hidden="true">
                <span className={styles.pulse} />
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardName}>{v.name}</h3>
                <p className={styles.cardSpec}>{v.spec}</p>
                <p className={styles.cardMetric}>
                  <span>{v.metric}</span> {v.unit}
                </p>
              </div>
            </article>
          ))}
          <div className={styles.endCard}>
            <p className={styles.endText}>
              One platform.
              <br />
              Every asset accounted for.
            </p>
            <a href="#contact" className="btn btn-primary">
              Talk to fleet ops
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
