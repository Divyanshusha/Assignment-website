import { useCallback, useEffect, useState } from 'react'
import { ScrollTrigger } from './lib/gsap'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import Preloader from './components/Preloader'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Stats from './components/Stats'
import Services from './components/Services'
import Fleet from './components/Fleet'
import Footer from './components/Footer'

export default function App() {
  const [ready, setReady] = useState(false)

  // Stable identity so Preloader's one-shot effect doesn't re-run when `ready`
  // flips and re-renders App.
  const handleReady = useCallback(() => setReady(true), [])

  useSmoothScroll()

  // Once the hero is revealed, pinned/scrubbed triggers need a recalc because
  // the preloader briefly locked layout at a different height.
  useEffect(() => {
    if (!ready) return
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [ready])

  return (
    <>
      <Preloader onComplete={handleReady} />
      {/* While the preloader curtain is up the page is visually hidden, so it
          must also be inert — otherwise keyboard users can tab into offscreen
          links/buttons behind the loader. `inert=""` (vs undefined) is the
          React 18-safe way to emit the boolean attribute. */}
      <div inert={ready ? undefined : ''}>
        <Navbar />
        <main>
          <Hero ready={ready} />
          <Stats />
          <Services />
          <Fleet />
        </main>
        <Footer />
      </div>
    </>
  )
}
