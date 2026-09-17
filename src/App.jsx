import { useCallback, useEffect, useState } from 'react'
import { ScrollTrigger } from './lib/gsap'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { useMagnetic } from './hooks/useMagnetic'
import Cursor from './components/Cursor'
import Preloader from './components/Preloader'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Stats from './components/Stats'
import Journey3D from './components/Journey3D'
import Stages from './components/Stages'
import Services from './components/Services'
import Fleet from './components/Fleet'
import NetworkMap from './components/NetworkMap'
import Footer from './components/Footer'

export default function App() {
  const [ready, setReady] = useState(false)

  // Stable identity so Preloader's one-shot effect doesn't re-run when `ready`
  // flips and re-renders App.
  const handleReady = useCallback(() => setReady(true), [])

  useSmoothScroll()
  // Magnetic pull on the primary CTAs (no-op on touch / reduced-motion).
  useMagnetic()

  // Once the hero is revealed the Preloader unmounts; pinned/scrubbed triggers
  // then need a recalc so pin start/end points are measured against the final
  // layout rather than the height the loader briefly locked in.
  useEffect(() => {
    if (!ready) return
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [ready])

  // Web fonts load asynchronously and reflow every heading/paragraph when they
  // swap in — which moves every pin start/end. Refresh once they're ready so
  // the triggers are calibrated against the final, font-laid-out layout.
  useEffect(() => {
    if (!document.fonts?.ready) return
    let cancelled = false
    document.fonts.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh()
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <Cursor />
      {/* Unmount the loader once it has curtained away so it leaves the DOM
          (and the ready-effect above refreshes ScrollTrigger afterwards). */}
      {!ready && <Preloader onComplete={handleReady} />}
      {/* While the preloader curtain is up the page is visually hidden, so it
          must also be inert — otherwise keyboard users can tab into offscreen
          links/buttons behind the loader. `inert=""` (vs undefined) is the
          React 18-safe way to emit the boolean attribute. */}
      <div inert={ready ? undefined : ''}>
        <Navbar />
        <main>
          <Hero ready={ready} />
          <Stats />
          <Journey3D />
          <Stages />
          <Services />
          <Fleet />
          <NetworkMap />
        </main>
        <Footer />
      </div>
    </>
  )
}
