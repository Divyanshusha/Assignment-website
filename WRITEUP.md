# Write-up — FreightCore Logistics

## Process & how I prompted the AI tools

I built this with **Claude Code**, treating it like a junior pair I had to direct rather than
a code vending machine. I started by having it read the brief and turn it into a concrete plan
— stack choice, section list, and which ScrollTrigger technique went where — before a single
line of code. I locked the decisions I cared about (Vite + React + react-three-fiber + GSAP,
a dark "enterprise" palette, a globe-with-freight-lanes as the WebGL piece) and let it
scaffold from there.

My prompting pattern was **vertical slices, not one big dump**: "build the pinned services
section with a scrubbed crossfade and a progress rail," then review the output, then "now the
horizontal-scroll fleet section, reuse the gsap.context pattern." After each slice I had it
run a headless Chrome pass (Puppeteer against the dev server) to screenshot every section and
capture console errors, so I was reviewing _rendered_ output and real error logs, not just
diffs. That caught issues a code read wouldn't — e.g. a section that was technically correct
but visually mis-timed. I also kept it honest on performance by having it run an actual
Lighthouse audit rather than guessing.

## One technical decision: Lenis and GSAP on a single RAF loop

I wanted premium smooth scrolling (Lenis) _and_ pinned/scrubbed ScrollTrigger animations. Run
naively, they each keep their own `requestAnimationFrame` loop and disagree about the current
scroll position by a frame, which shows up as pinned sections that jitter or drift. The fix
was to stop letting Lenis self-drive and instead **tick it from GSAP's ticker** and call
`ScrollTrigger.update()` on every Lenis scroll event (`hooks/useSmoothScroll.js`). One clock,
one source of truth. I also gated the whole thing behind `prefers-reduced-motion` so the site
degrades to native scroll for users who ask for less motion.

## One bug: pinned triggers measuring the wrong height

The horizontal-scroll section initially either over- or under-scrolled — the cards stopped
short or ran past the end. Two causes: the pin distance was computed **once** from
`scrollWidth - innerWidth`, and a full-screen preloader was locking layout while fonts and the
WebGL canvas were still settling, so ScrollTrigger cached stale measurements. The freight
lanes shifted the layout height _after_ the triggers were created.

I fixed it three ways: made the `end` value a **function** so it re-evaluates on refresh, added
`invalidateOnRefresh: true` so the tween recomputes its distance on resize, and called
`ScrollTrigger.refresh()` once, on the frame after the preloader curtains away. After that the
horizontal pan lands exactly on the final card at every breakpoint.

## Performance

Lighthouse (desktop) reports **LCP 0.7s, CLS 0.009, Best Practices 100**. Total Blocking Time
is high in my headless run because Chrome compiles WebGL shaders on the CPU under SwiftShader;
on real GPU hardware that cost largely disappears. The 3D bundle is code-split and lazy-loaded
so it never blocks first paint.
