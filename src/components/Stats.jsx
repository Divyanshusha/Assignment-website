import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'
import styles from './Stats.module.css'

const STATS = [
  { value: 18000, suffix: '+', label: 'Vehicles under management', format: 'k' },
  { value: 60, suffix: '+', label: 'Countries in the network' },
  { value: 99.4, suffix: '%', label: 'On-time delivery rate', decimals: 1 },
  {
    value: 2.4,
    prefix: '$',
    suffix: 'B',
    label: 'Freight moved annually',
    decimals: 1,
  },
]

function formatValue(v, stat) {
  let body
  if (stat.format === 'k') {
    // Show a compact "k" form only once we're comfortably into the thousands,
    // so the count-up doesn't flip to "1k" the instant it crosses 1000.
    body =
      v >= 1000
        ? (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'k'
        : Math.round(v).toString()
  } else if (stat.decimals) {
    body = v.toFixed(stat.decimals)
  } else {
    body = Math.round(v).toLocaleString()
  }
  return (stat.prefix || '') + body + (stat.suffix || '')
}

export default function Stats() {
  const rootRef = useRef(null)

  useEffect(() => {
    // Numbers render at their final value in the markup, so with reduced motion
    // (no matchMedia branch) they simply stay correct — no stuck "0".
    const mm = gsap.matchMedia(rootRef)

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const numbers = gsap.utils.toArray(`.${styles.number}`)

      numbers.forEach((el) => {
        const stat = STATS[Number(el.dataset.index)]
        const counter = { value: 0 }
        el.textContent = formatValue(0, stat) // reset to start before it scrolls in
        gsap.to(counter, {
          value: stat.value,
          duration: 2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          onUpdate: () => {
            el.textContent = formatValue(counter.value, stat)
          },
        })
      })

      gsap.from(`.${styles.item}`, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: rootRef.current, start: 'top 80%' },
      })
    })

    return () => {
      mm.revert()
      ScrollTrigger.refresh()
    }
  }, [])

  return (
    <section id="stats" className={`section ${styles.stats}`} ref={rootRef}>
      <div className="container">
        <div className={styles.head}>
          <span className="eyebrow">The network at a glance</span>
          <h2 className="section-title">
            One control tower for a planet-scale supply chain.
          </h2>
        </div>

        <div className={styles.grid}>
          {STATS.map((stat, i) => (
            <div className={styles.item} key={stat.label}>
              <span className={styles.number} data-index={i}>
                {formatValue(stat.value, stat)}
              </span>
              <span className={styles.label}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
