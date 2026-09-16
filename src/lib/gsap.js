// Central GSAP setup so ScrollTrigger is only registered once and every
// component imports the same configured instances.
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Fewer sub-pixel recalcs on scroll -> steadier frame times.
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger }
