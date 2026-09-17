// Central GSAP setup so ScrollTrigger is only registered once and every
// component imports the same configured instances.
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

// MotionPathPlugin ships inside the gsap package (no extra dependency); used to
// animate a dot along an SVG route path in the journey stages.
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin)

// Fewer sub-pixel recalcs on scroll -> steadier frame times.
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger, MotionPathPlugin }
