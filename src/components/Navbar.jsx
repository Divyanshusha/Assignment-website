import { useEffect, useState } from 'react'
import styles from './Navbar.module.css'

const LINKS = [
  { label: 'Network', href: '#stats' },
  { label: 'Services', href: '#services' },
  { label: 'Fleet', href: '#fleet' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <a href="#top" className={styles.brand} aria-label="FreightCore home">
          FREIGHT<span className={styles.accent}>CORE</span>
        </a>

        <nav className={`${styles.links} ${open ? styles.linksOpen : ''}`}>
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={styles.link}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a href="#contact" className={`btn btn-primary ${styles.cta}`}>
          Request a demo
        </a>

        <button
          className={styles.burger}
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={open ? styles.barTop : ''} />
          <span className={open ? styles.barMid : ''} />
          <span className={open ? styles.barBot : ''} />
        </button>
      </div>
    </header>
  )
}
