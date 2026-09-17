import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import styles from './NetworkMap.module.css'

// The SVG uses a 160×90 (16:9) coordinate space matching the stage aspect, so a
// `preserveAspectRatio="none"` stretch keeps nodes/arcs undistorted while still
// mapping 1:1 to the percentage-positioned hub buttons.
const VB_W = 160
const VB_H = 90
const sx = (x) => (x / 100) * VB_W
const sy = (y) => (y / 100) * VB_H

// Primary logistics hubs (orange). A few carry realistic labels; the rest are
// unlabeled anchor hubs. Positions form intentional regional clusters with
// negative space between them rather than a random scatter.
const PRIMARY = [
  { code: 'LAX', role: 'Regional Center', x: 13, y: 47 },
  { code: 'JFK', x: 27, y: 30 },
  { code: 'AMS', role: 'Freight Network', x: 43, y: 22 },
  { code: 'DXB', role: 'Global Hub', x: 59, y: 49 },
  { code: 'DEL', role: 'Distribution Hub', x: 71, y: 34 },
  { code: 'SIN', role: 'Logistics Gateway', x: 85, y: 64 },
  { code: 'HKG', x: 90, y: 42 },
]

// Secondary facilities / delivery points (cyan), each tied to a nearby hub —
// this is what makes each region read as a cluster, not loose dots.
const SECONDARY = [
  { x: 6, y: 39, hub: 0 }, { x: 9, y: 56, hub: 0 }, { x: 20, y: 52, hub: 0 },
  { x: 21, y: 20, hub: 1 }, { x: 34, y: 24, hub: 1 }, { x: 30, y: 40, hub: 1 },
  { x: 37, y: 14, hub: 2 }, { x: 49, y: 15, hub: 2 }, { x: 50, y: 31, hub: 2 },
  { x: 53, y: 41, hub: 3 }, { x: 56, y: 60, hub: 3 }, { x: 65, y: 56, hub: 3 },
  { x: 66, y: 25, hub: 4 }, { x: 77, y: 25, hub: 4 }, { x: 78, y: 43, hub: 4 },
  { x: 80, y: 55, hub: 5 }, { x: 89, y: 73, hub: 5 }, { x: 93, y: 59, hub: 5 },
  { x: 84, y: 34, hub: 6 }, { x: 95, y: 35, hub: 6 }, { x: 88, y: 51, hub: 6 },
]

// Long-distance trunk lanes between hubs (cyan, brighter). A couple span the
// whole grid (LAX→HKG trans-Pacific) to tie the regions together.
const LINKS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 6], [6, 5], [3, 5], [0, 6],
]

// Curved great-circle-style arc between two hubs.
function lanePath(a, b) {
  const x1 = sx(a.x)
  const y1 = sy(a.y)
  const x2 = sx(b.x)
  const y2 = sy(b.y)
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const dist = Math.hypot(dx, dy) || 1
  const bow = dist * 0.14
  const cx = mx + (-dy / dist) * bow
  const cy = my + (dx / dist) * bow
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
}

// Straight spoke from a secondary node to its parent hub.
function spokePath(n) {
  const p = PRIMARY[n.hub]
  return `M ${sx(n.x)} ${sy(n.y)} L ${sx(p.x)} ${sy(p.y)}`
}

export default function NetworkMap() {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const frontRef = useRef(null)
  const backRef = useRef(null)
  const [active, setActive] = useState(null)

  useEffect(() => {
    const mm = gsap.matchMedia(rootRef)

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const routes = gsap.utils.toArray(`.${styles.route}`)
      const links = gsap.utils.toArray(`.${styles.link}`)
      const particles = gsap.utils.toArray(`.${styles.particle}`)

      // Prime every route for a progressive stroke-dashoffset draw.
      routes.forEach((r) => {
        const len = r.getTotalLength()
        gsap.set(r, { strokeDasharray: len, strokeDashoffset: len })
      })

      // Draw the grid in once on scroll-in, then send cyan data particles down
      // the trunk lanes (one persistent loop each — no ad-hoc RAF).
      ScrollTrigger.create({
        trigger: stageRef.current,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.to(routes, {
            strokeDashoffset: 0,
            duration: 1.2,
            ease: 'power3.out',
            stagger: 0.035,
          })
          links.forEach((path, i) => {
            const p = particles[i]
            if (!p) return
            gsap.set(p, { opacity: 1 })
            gsap.fromTo(
              p,
              { motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
              {
                motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 1 },
                duration: 3 + (i % 3),
                ease: 'none',
                repeat: -1,
                delay: 0.7 + i * 0.28,
              },
            )
          })
        },
      })

      // Gentle mouse parallax (desktop pointers only). Two layers move at
      // different depths for a subtle 3D feel.
      let detachParallax
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const xF = gsap.quickTo(frontRef.current, 'x', { duration: 0.6, ease: 'power3' })
        const yF = gsap.quickTo(frontRef.current, 'y', { duration: 0.6, ease: 'power3' })
        const xB = gsap.quickTo(backRef.current, 'x', { duration: 0.9, ease: 'power3' })
        const yB = gsap.quickTo(backRef.current, 'y', { duration: 0.9, ease: 'power3' })
        const el = stageRef.current
        const onMove = (e) => {
          const r = el.getBoundingClientRect()
          const nx = (e.clientX - r.left) / r.width - 0.5
          const ny = (e.clientY - r.top) / r.height - 0.5
          xF(nx * 16)
          yF(ny * 12)
          xB(nx * 7)
          yB(ny * 5)
        }
        const onLeave = () => {
          xF(0)
          yF(0)
          xB(0)
          yB(0)
        }
        el.addEventListener('pointermove', onMove)
        el.addEventListener('pointerleave', onLeave)
        detachParallax = () => {
          el.removeEventListener('pointermove', onMove)
          el.removeEventListener('pointerleave', onLeave)
        }
      }

      return () => detachParallax?.()
    })

    return () => mm.revert()
  }, [])

  // A route is "connected" to the hovered hub if it terminates there.
  const isLinkActive = (a, b) => active != null && (a === active || b === active)

  return (
    <section id="network" className={styles.network} ref={rootRef}>
      <div className={`container ${styles.header}`}>
        <span className="eyebrow">The network</span>
        <h2 className="section-title">The intelligent logistics grid.</h2>
        <p className="lead">
          A live view of the FreightCore network — hubs, distribution centers and the
          lanes that connect them. Hover a hub to trace its routes.
        </p>
      </div>

      <div className="container">
        <div className={styles.stage} ref={stageRef}>
          {/* back depth layer: dotted infrastructure basemap */}
          <div className={styles.parallaxBack} ref={backRef}>
            <svg
              className={styles.basemap}
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <pattern id="netdots" width="3.6" height="3.6" patternUnits="userSpaceOnUse">
                  <circle className={styles.fieldDot} cx="0.5" cy="0.5" r="0.42" />
                </pattern>
              </defs>
              <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#netdots)" />
            </svg>
          </div>

          {/* front layer: routes, nodes, particles + interactive hubs */}
          <div
            className={`${styles.parallaxFront} ${active != null ? styles.dimmed : ''}`}
            ref={frontRef}
          >
            <svg
              className={styles.lines}
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* hub-to-node spokes (muted blue) */}
              {SECONDARY.map((n, i) => (
                <path
                  key={`spoke-${i}`}
                  className={`${styles.route} ${styles.spoke} ${active === n.hub ? styles.hl : ''}`}
                  d={spokePath(n)}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {/* trunk lanes (cyan) */}
              {LINKS.map(([a, b], i) => (
                <path
                  key={`link-${i}`}
                  className={`${styles.route} ${styles.link} ${isLinkActive(a, b) ? styles.hl : ''}`}
                  d={lanePath(PRIMARY[a], PRIMARY[b])}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {/* secondary nodes */}
              {SECONDARY.map((n, i) => (
                <circle
                  key={`node-${i}`}
                  className={`${styles.node} ${active === n.hub ? styles.hl : ''}`}
                  cx={sx(n.x)}
                  cy={sy(n.y)}
                  r={i % 3 === 0 ? 1.15 : 0.85}
                />
              ))}
              {/* travelling data particles (one per trunk lane) */}
              {LINKS.map((_, i) => (
                <circle key={`particle-${i}`} className={styles.particle} r="0.9" />
              ))}
            </svg>

            {PRIMARY.map((hub, i) => {
              const labelLeft = hub.x > 62
              return (
                <button
                  key={hub.code}
                  type="button"
                  className={`${styles.hub} ${active === i ? styles.hubActive : ''}`}
                  style={{ left: `${hub.x}%`, top: `${hub.y}%` }}
                  aria-label={
                    hub.role
                      ? `${hub.code}, ${hub.role}. Logistics hub.`
                      : `${hub.code}. Logistics hub.`
                  }
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive((cur) => (cur === i ? null : cur))}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive((cur) => (cur === i ? null : cur))}
                >
                  <span className={styles.hubGlow} aria-hidden="true" />
                  <span className={styles.hubCore} aria-hidden="true" />
                  {hub.role && (
                    <span
                      className={`${styles.label} ${labelLeft ? styles.labelLeft : ''}`}
                      aria-hidden="true"
                    >
                      <b>{hub.code}</b> · {hub.role}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
