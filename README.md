# NINETY-NINE — A Field Guide to Breaking 100

An Awwwards-style, single-page scroll narrative about the quiet arithmetic of breaking 100 at golf:
par is not your business — your business is ninety-nine, and ninety-nine is twenty-seven strokes of
spending money.

## Run it

Any static server from this directory:

```bash
python3 -m http.server 8137
# → http://localhost:8137
```

No build step. Fonts via Google Fonts; GSAP 3.13 (ScrollTrigger, ScrollSmoother, SplitText,
MotionPathPlugin, CustomEase — all free since 3.13) via CDN script tags; Three.js as an ES module
via importmap. Zero image assets — every visual is WebGL, SVG, CSS, or typography.

## Structure

- `index.html` — the nine spreads: preloader card, hero, the arithmetic of 27, the half who never,
  doctrine (proofreader's corrections), the pinned 3D flyover, the hundred-yard religion, the
  three-putt tax, the mental game, and the closing editable scorecard.
- `css/style.css` — letterpress/ledger design system. Pine `#0A211A` · cream `#F3EDDF` ·
  gold `#C8A45C` (dark surfaces) / gold-ink `#7E5F26` (cream surfaces) · cardinal, rationed.
  Fraunces (display) · Newsreader (body) · IBM Plex Mono (everything numeric).
- `js/scene.js` — one procedural Three.js scene: engraved contour-line terrain (custom shader,
  screen-space hairline isolines), dimpled ball (runtime canvas bump map), ballistic shot-tracer
  tubes revealed by drawRange, and a dusk-to-night grade driven by one `uDusk` uniform.
- `js/main.js` — GSAP choreography: split-flap digits, odometers, rubber stamps, two pinned
  scrub sections (300% flyover, 180% mental game), the scroll-velocity EKG, the running ledger
  chip (108 → 99), and the interactive closing scorecard with BUDGET BLOWN / ATTESTED states.

## Notes

- The whole page is one round played from dusk into night: a single scroll-driven value grades the
  WebGL fog/light and the dark sections' CSS at once. "Play the round again" rewinds it.
- Reduced-motion users get a fully readable static edition (no smoother, no pins, one rendered
  frame of the 3D scene).
- The scorecard is the proof: nine bogeys + nine doubles on a par-72 = 99. Tap any hole to trade
  one for the other; spend past 27 and the card stamps BUDGET BLOWN until you correct it.
