import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/gsap'
import styles from './Footer.module.css'

// Basic RFC-ish email check — enough to catch obvious typos before we "submit".
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Stand-in for a real API call. Resolves after a short delay so the form can
// show a submitting state; rejects for one address so the error path is
// demonstrable in this backend-less demo.
function submitDemoRequest(email) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email.toLowerCase() === 'fail@example.com') {
        reject(new Error('network'))
      } else {
        resolve()
      }
    }, 900)
  })
}

// In-page anchors point at the real sections; items without a matching section
// on this single-page demo fall back to '#top'.
const COLUMNS = [
  {
    title: 'Platform',
    links: [
      { label: 'Managed Freight', href: '#services' },
      { label: 'Fleet Intelligence', href: '#fleet' },
      { label: 'Control Tower', href: '#services' },
      { label: 'The network', href: '#stats' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#stats' },
      { label: 'Careers', href: '#top' },
      { label: 'Newsroom', href: '#top' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#top' },
      { label: 'Fleet', href: '#fleet' },
      { label: 'Case Studies', href: '#services' },
      { label: 'Request a demo', href: '#contact' },
    ],
  },
]

export default function Footer() {
  const ctaRef = useRef(null)
  const [email, setEmail] = useState('')
  // status: 'idle' | 'submitting' | 'success' | 'error'
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (status === 'submitting') return

    const trimmed = email.trim()
    if (!EMAIL_RE.test(trimmed)) {
      setStatus('error')
      setMessage('Please enter a valid work email.')
      return
    }

    setStatus('submitting')
    setMessage('')
    try {
      await submitDemoRequest(trimmed)
      setStatus('success')
      setMessage("Thanks — we'll be in touch within one business day.")
      setEmail('')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  useEffect(() => {
    const mm = gsap.matchMedia(ctaRef)
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(`.${styles.ctaInner} > *`, {
        opacity: 0,
        y: 40,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: ctaRef.current, start: 'top 75%' },
      })
    })
    return () => mm.revert()
  }, [])

  return (
    <>
      <section id="contact" className={styles.cta} ref={ctaRef}>
        <div className={`container ${styles.ctaInner}`}>
          <span className="eyebrow">Ready when you are</span>
          <h2 className={styles.ctaTitle}>Let&apos;s put your freight on autopilot.</h2>
          <p className="lead">
            Book a 30-minute walkthrough and we&apos;ll model your lanes against the
            FreightCore network — no commitment, just numbers.
          </p>
          {status === 'success' ? (
            <p className={styles.success} role="status">
              {message}
            </p>
          ) : (
            <form
              className={styles.form}
              onSubmit={handleSubmit}
              aria-label="Request a demo"
              noValidate
            >
              <input
                type="email"
                required
                placeholder="Work email"
                className={styles.input}
                aria-label="Work email"
                aria-invalid={status === 'error'}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (status === 'error') {
                    setStatus('idle')
                    setMessage('')
                  }
                }}
                disabled={status === 'submitting'}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={status === 'submitting'}
              >
                {status === 'submitting' ? 'Sending…' : 'Request a demo'}
              </button>
            </form>
          )}
          <p
            className={styles.formMessage}
            data-error={status === 'error' || undefined}
            role={status === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            {status === 'error' ? message : ''}
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`container ${styles.footerGrid}`}>
          <div className={styles.brandCol}>
            <a href="#top" className={styles.brand}>
              FREIGHT<span className={styles.accent}>CORE</span>
            </a>
            <p className={styles.tagline}>
              Freight &amp; fleet management for the enterprise supply chain.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav className={styles.col} key={col.title} aria-label={col.title}>
              <h4 className={styles.colTitle}>{col.title}</h4>
              {col.links.map((l) => (
                <a key={l.label} href={l.href} className={styles.colLink}>
                  {l.label}
                </a>
              ))}
            </nav>
          ))}
        </div>

        <div className={`container ${styles.legal}`}>
          <span>
            © {new Date().getFullYear()} FreightCore Logistics. Fictional brand — built
            as a demo.
          </span>
          <div className={styles.legalLinks}>
            <a href="#top">Privacy</a>
            <a href="#top">Terms</a>
            <a href="#top">Cookies</a>
          </div>
        </div>
      </footer>
    </>
  )
}
