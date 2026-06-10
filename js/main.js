// NINETY-NINE — A Field Guide to Breaking 100
// GSAP choreography. The design practices subtraction; the code shouldn't.

import { HoleScene } from './scene.js';

const { gsap, ScrollTrigger, ScrollSmoother, SplitText, MotionPathPlugin, CustomEase } = window;
gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, MotionPathPlugin, CustomEase);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(pointer: coarse)').matches;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

const PARS = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 5, 3, 4, 4, 5, 3, 4, 4];
const NOTES = [
  'TEE: MOST-LOFTED CLUB — POSTED',
  'WEDGE: ONE NUMBER — POSTED',
  'GREEN: MIDDLE, NOT FLAG — POSTED',
  'PUTTS: TWO, NEVER THREE — POSTED',
  'CARD: NO MEMORY — POSTED',
];

/* ============================================================
   COMPONENT · split-flap digits
   ============================================================ */
function flipFlap(flapEl, ch, delay = 0) {
  const card = flapEl.querySelector('.flap-card');
  // compare against the pending target, not the live DOM — the text only
  // mutates mid-flip, so rapid checkpoint crossings would otherwise no-op
  const current = flapEl._pending ?? card.textContent;
  if (current === ch) return gsap.timeline();
  flapEl._pending = ch;
  if (reduced) { card.textContent = ch; return gsap.timeline(); }
  if (flapEl._flipTl) flapEl._flipTl.kill();
  const tl = gsap.timeline({ delay })
    .to(card, { rotateX: -88, duration: 0.13, ease: 'power2.in' })
    .add(() => { card.textContent = ch; })
    .set(card, { rotateX: 88 })
    .to(card, { rotateX: 0, duration: 0.22, ease: 'back.out(1.8)' });
  flapEl._flipTl = tl;
  return tl;
}

function flapNumber(container, value) {
  const str = String(value);
  let slots = $$('.flap', container);
  // grow / shrink the slot count to match
  while (slots.length < str.length) {
    const clone = slots[0].cloneNode(true);
    container.insertBefore(clone, slots[0]);
    slots = $$('.flap', container);
  }
  while (slots.length > str.length) {
    slots[0].remove();
    slots = $$('.flap', container);
  }
  const tl = gsap.timeline();
  slots.forEach((slot, i) => tl.add(flipFlap(slot, str[i], 0), i * 0.05));
  return tl;
}

/* ============================================================
   COMPONENT · odometer
   ============================================================ */
function odoTo(el, target, { decimals = 0, duration = 1.4 } = {}) {
  const from = parseFloat(el.textContent) || 0;
  const o = { v: from };
  return gsap.to(o, {
    v: target,
    duration: reduced ? 0 : duration,
    ease: 'expo.inOut',
    onUpdate: () => { el.textContent = o.v.toFixed(decimals); },
  });
}

/* ============================================================
   COMPONENT · stamp slam
   ============================================================ */
function stampIn(el, { rotate = -7, shakeTarget = null } = {}) {
  const tl = gsap.timeline();
  tl.fromTo(el,
    { scale: 1.5, rotation: rotate - 3, autoAlpha: 0 },
    { scale: 1, rotation: rotate, autoAlpha: 1, duration: 0.25, ease: 'power4.in' });
  if (shakeTarget && !reduced) {
    tl.to(shakeTarget, { x: '+=2', duration: 0.05, repeat: 3, yoyo: true, ease: 'none' })
      .set(shakeTarget, { x: 0 });
  }
  return tl;
}

/* ============================================================
   BUILD · dynamic DOM
   ============================================================ */
function buildBudgetTable() {
  const wrap = $('#budgetTable');
  const rows = [
    { head: 'HOLE', cells: PARS.map((_, i) => i + 1), cls: '' },
    { head: 'PAR', cells: PARS, cls: 'zebra' },
    { head: 'BUDGET', cells: PARS.map((_, i) => (i % 2 === 0 ? '+2' : '+1')), cls: 'bt-budget' },
  ];
  wrap.innerHTML = rows.map(r => `
    <div class="bt-row ${r.cls}">
      <span class="bt-cell bt-head">${r.head}</span>
      ${r.cells.map(c => `<span class="bt-cell">${c}</span>`).join('')}
    </div>`).join('');
}

function buildGolferPlate() {
  const plate = $('#golferPlate');
  const glyph = `
    <svg class="golfer" viewBox="0 0 24 36" aria-hidden="true">
      <circle cx="11" cy="5" r="3" pathLength="1"/>
      <path d="M11,8.4 C11.6,13 11.2,18 10.4,23.5" pathLength="1"/>
      <path d="M10.4,23.5 L6.8,33 M10.4,23.5 L14.6,33" pathLength="1"/>
      <path d="M11.4,11 C14.5,9.4 18.5,6.5 21.5,2.5" pathLength="1"/>
      <circle cx="22" cy="2" r="0.9" pathLength="1"/>
    </svg>`;
  // the median, drawn literally: the top half sign cards in the 90s, the bottom half never do
  const kinds = [];
  for (let i = 0; i < 100; i++) kinds.push(i < 50 ? 'gold' : 'haze');
  plate.innerHTML = kinds.map(k => glyph.replace('class="golfer"', `class="golfer ${k}"`)).join('');
}

function buildScorecard() {
  const card = $('#scorecard');
  const nine = (start) => {
    const idx = Array.from({ length: 9 }, (_, i) => start + i);
    const isOut = start === 0;
    return `
    <div class="nine">
      <div class="sc-row sc-head">
        <span class="sc-cell">HOLE</span>
        ${idx.map(i => `<span class="sc-cell">${i + 1}</span>`).join('')}
        <span class="sc-cell">${isOut ? 'OUT' : 'IN'}</span>
      </div>
      <div class="sc-row">
        <span class="sc-cell">PAR</span>
        ${idx.map(i => `<span class="sc-cell">${PARS[i]}</span>`).join('')}
        <span class="sc-cell sc-tot">${isOut ? 36 : 36}</span>
      </div>
      <div class="sc-row sc-score">
        <span class="sc-cell">YOUR CARD</span>
        ${idx.map(i => {
          const dbl = i % 2 === 0;
          return `<span class="sc-cell"><button class="sc-btn ${dbl ? 'is-double' : ''}" data-hole="${i}"
            data-note="${NOTES[i % NOTES.length]}" aria-pressed="${dbl}"
            aria-label="Hole ${i + 1}, ${dbl ? 'double bogey' : 'bogey'} — tap to toggle">${PARS[i] + (dbl ? 2 : 1)}</button></span>`;
        }).join('')}
        <span class="sc-cell sc-tot" id="${isOut ? 'nineOut' : 'nineIn'}">—</span>
      </div>
    </div>`;
  };
  card.innerHTML = nine(0) + nine(9);
}

/* ============================================================
   SCORECARD · interactive proof
   ============================================================ */
function initScorecard() {
  const state = PARS.map((_, i) => (i % 2 === 0 ? 2 : 1)); // strokes over par
  const blown = $('#blownStamp');
  const seal = $('#sealWrap');
  let wasBlown = false;

  const tally = (animate = true) => {
    const out = state.slice(0, 9).reduce((s, o, i) => s + PARS[i] + o, 0);
    const inn = state.slice(9).reduce((s, o, i) => s + PARS[i + 9] + o, 0);
    const tot = out + inn;
    $('#nineOut').textContent = out;
    $('#nineIn').textContent = inn;
    $('#outTotal').textContent = out;
    $('#inTotal').textContent = inn;
    if (animate) odoTo($('#grandTotal'), tot, { duration: 0.9 });
    else $('#grandTotal').textContent = tot;

    const isBlown = tot > 99;
    if (isBlown && !wasBlown) {
      stampIn(blown, { rotate: -7, shakeTarget: $('#scorecard') });
      gsap.to(seal, { autoAlpha: 0.15, scale: 0.92, duration: 0.4, ease: 'power2.out' });
    } else if (!isBlown && wasBlown) {
      gsap.to(blown, { autoAlpha: 0, scale: 0, duration: 0.3, ease: 'power2.in' });
      gsap.to(seal, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' });
    }
    wasBlown = isBlown;
    return tot;
  };

  $('#scorecard').addEventListener('click', (e) => {
    const btn = e.target.closest('.sc-btn');
    if (!btn) return;
    const i = +btn.dataset.hole;
    state[i] = state[i] === 1 ? 2 : 1;
    btn.classList.toggle('is-double', state[i] === 2);
    btn.setAttribute('aria-pressed', state[i] === 2);
    btn.setAttribute('aria-label', `Hole ${i + 1}, ${state[i] === 2 ? 'double bogey' : 'bogey'} — tap to toggle`);
    flipScore(btn, PARS[i] + state[i]);
    const tot = tally();
    const st = $('#scoreStatus');
    if (st) st.textContent = `Total ${tot} — ${tot > 99 ? 'budget blown' : 'attested'}`;
  });

  function flipScore(btn, val) {
    if (reduced) { btn.textContent = val; return; }
    gsap.timeline()
      .to(btn, { rotateX: -88, duration: 0.12, ease: 'power2.in' })
      .add(() => { btn.textContent = val; })
      .set(btn, { rotateX: 88 })
      .to(btn, { rotateX: 0, duration: 0.2, ease: 'back.out(1.7)' });
  }

  tally(false);
  return { state };
}

/* ============================================================
   TAX · re-rollable hierarchy
   ============================================================ */
function initHierarchy() {
  const PROFILES = {
    putt: { base: 3.2, pOn: 0.9, pDis: 0.0 },
    chip: { base: 3.8, pOn: 0.68, pDis: 0.06 },
    flop: { base: 4.6, pOn: 0.42, pDis: 0.28 },
  };

  $$('.h-col').forEach(col => {
    const dotsWrap = $('.h-dots', col);
    dotsWrap.innerHTML = Array.from({ length: 10 }, () => '<span class="h-dot"></span>').join('');

    const roll = (first = false) => {
      const p = PROFILES[col.dataset.club];
      const dots = $$('.h-dot', dotsWrap);
      gsap.killTweensOf(dots); // pending stagger callbacks from a prior roll
      let disasters = 0, greens = 0;
      dots.forEach((d, i) => {
        d.className = 'h-dot';
        const r = first ? (i + 0.5) / 10 : Math.random();
        let cls = '';
        if (r < p.pDis) { cls = 'disaster'; disasters++; }
        else if (r < p.pDis + p.pOn) { cls = 'on-green'; greens++; }
        if (!reduced) {
          gsap.fromTo(d, { scale: 0.3, opacity: 0.2 }, {
            scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2.5)', delay: i * 0.035,
            onStart: () => { d.className = cls ? 'h-dot ' + cls : 'h-dot'; },
          });
        } else if (cls) d.classList.add(cls);
      });
      const ev = p.base + disasters * 0.35 - greens * 0.02 + (first ? 0 : (Math.random() * 0.12 - 0.06));
      const shown = first ? p.base : Math.max(ev, p.base - 0.3);
      odoTo($('.h-ev-num', col), shown, { decimals: 1, duration: 0.8 });
      const name = $('.h-name', col).textContent;
      const summary = `${name}: ${greens} of 10 on the green, expected ${shown.toFixed(1)} strokes${disasters >= 3 ? ', blow-up risk' : ''}`;
      col.setAttribute('aria-label', `${summary} — tap to re-roll`);
      if (!first) { const st = $('#rollStatus'); if (st) st.textContent = summary; }
      const blowup = $('.h-blowup', col);
      if (blowup) {
        if (disasters >= 3) stampIn(blowup, { rotate: 8 });
        else gsap.to(blowup, { scale: 0, autoAlpha: 0, duration: 0.2 });
      }
    };

    roll(true);
    col.addEventListener('click', () => roll(false));
  });
}

/* ============================================================
   CHIP · the running ledger
   ============================================================ */
const CHECKPOINTS = [
  { sel: '#hero',       line: 'HOLE 01 · SPENT 0 OF 27',        card: 108 },
  { sel: '#arithmetic', line: 'HOLE 03 · BUDGET POSTED +27',    card: 107 },
  { sel: '#half-never', line: 'HOLE 05 · THE GOOD SIDE OF 50',  card: 106 },
  { sel: '#doctrine',   line: 'HOLE 06 · HERO SHOTS RETIRED',   card: 105 },
  { sel: '#flyover',    line: 'HOLE 08 · SPENT 11 OF 27',       card: 104 },
  { sel: '#wedge',      line: 'HOLE 10 · ONE NUMBER OWNED',     card: 103 },
  { sel: '#tax',        line: 'HOLE 13 · 3-PUTT TAX PAID',      card: 101 },
  { sel: '#mental',     line: 'HOLE 16 · MEDICINE TAKEN',       card: 100 },
  { sel: '#ledger',     line: 'HOLE 18 · SIGNED & ATTESTED',    card: 99 },
];

function setChip(i) {
  const cp = CHECKPOINTS[Math.max(0, Math.min(i, CHECKPOINTS.length - 1))];
  $('#chipLine').textContent = cp.line;
  flapNumber($('#chipDigits'), cp.card);
}

function initChip() {
  CHECKPOINTS.forEach((cp, i) => {
    if (i === 0) return;
    ScrollTrigger.create({
      trigger: cp.sel,
      start: 'top 55%',
      onEnter: () => setChip(i),
      onLeaveBack: () => setChip(i - 1),
    });
  });
}

/* ============================================================
   GENERIC REVEALS
   ============================================================ */
function initReveals() {
  // never attach reveal triggers to non-rendered elements (display:none) —
  // they instant-fire + self-kill during creation and corrupt the trigger list
  const rendered = (el) => el.offsetParent !== null || getComputedStyle(el).position === 'fixed';

  // masked line reveals
  $$('.split').filter(rendered).forEach(el => {
    const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-l' });
    gsap.from(split.lines, {
      yPercent: 110,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.07,
      scrollTrigger: { trigger: el, start: 'top 78%', toggleActions: 'play none none none' },
      onComplete: () => split.revert(), // unmask so descenders aren't clipped at rest
    });
  });

  // eyebrows
  $$('.eyebrow').filter(rendered).forEach(el => {
    gsap.from(el, {
      autoAlpha: 0, y: 14, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
    });
  });

  // gold footnote rules
  $$('.footnote').filter(rendered).forEach(fn => {
    const rule = $('.rule', fn);
    const txt = $('p', fn);
    const tl = gsap.timeline({ scrollTrigger: { trigger: fn, start: 'top 88%', toggleActions: 'play none none none' } });
    if (rule) tl.to(rule, { scaleX: 1, duration: 0.9, ease: 'power3.inOut' });
    if (txt) tl.from(txt, { autoAlpha: 0, y: 8, duration: 0.6, ease: 'power2.out' }, '-=0.4');
  });
}

/* ============================================================
   MAIN
   ============================================================ */
buildBudgetTable();
buildGolferPlate();
buildScorecard();

// the round always starts on the first tee — no mid-scroll restores
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

document.body.classList.add('is-loading');
const scene = new HoleScene($('#gl'));
scene.loop();
window.NN = { scene };

let smoother = null;

document.fonts.ready.then(() => {
  try {
    reduced ? initReduced() : init();
  } catch (e) {
    console.error('INIT FAILED:', e && e.stack || e);
  }
});

function init() {
  smoother = ScrollSmoother.create({
    smooth: 1.1,
    smoothTouch: 0.8,
    effects: false,
  });
  smoother.paused(true);

  initChip();
  initReveals();
  initHero();
  initArithmetic();
  initHalfNever();
  initDoctrine();
  initFlyover();
  initWedge();
  initTaxSection();
  initMental();
  initLedgerSection();
  initDusk();
  initCursor();
  initSceneActivity();

  preloaderSequence();
}

/* ---------- preloader ---------- */
function preloaderSequence() {
  const tl = gsap.timeline();
  tl.add(flapNumber($('#preScore'), 112), 0.4)
    .add(flapNumber($('#preScore'), 104), '+=0.55')
    .add(flapNumber($('#preScore'), 100), '+=0.55')
    .add(stampIn($('#preStamp'), { rotate: -8, shakeTarget: $('.pre-card') }), '+=0.45')
    .to('#preloader', {
      clipPath: 'inset(0% 0% 100% 0%)',
      duration: 0.9,
      ease: 'expo.inOut',
      delay: 0.7,
    })
    .add(() => {
      $('#preloader').style.display = 'none';
      document.body.classList.remove('is-loading');
      smoother.paused(false);
      ScrollTrigger.refresh();
      heroIntro();
    });
}

/* ---------- hero ---------- */
let heroIntroPlayed = false;
function heroIntro() {
  if (heroIntroPlayed) return;
  heroIntroPlayed = true;
  gsap.timeline()
    .from('.hn', { yPercent: 118, duration: 1.3, ease: 'power4.out', stagger: 0.09 }, 0.1)
    .from('.hero-eyebrow', { autoAlpha: 0, y: 16, duration: 0.9, ease: 'power3.out' }, 0.5)
    .from('.hero-sub', { autoAlpha: 0, y: 14, duration: 0.9, ease: 'power3.out' }, 0.65)
    .from('.hero-body', { autoAlpha: 0, y: 14, duration: 0.9, ease: 'power3.out' }, 0.8)
    .from('.scroll-cue', { autoAlpha: 0, duration: 1 }, 1.1)
    .to('#chip', { y: 0, translateY: 0, duration: 0.8, ease: 'power3.out', onStart: () => gsap.set('#chip', { clearProps: 'transform' }) }, 1.2)
    .from('#chip', { yPercent: 140, duration: 0.8, ease: 'power3.out' }, 1.2);
}

function initHero() {
  // overflow mask for the big digits
  gsap.set('.hero-num', { overflow: 'hidden' });

  // the 100 → 99 transition, once, on first real scroll
  ScrollTrigger.create({
    trigger: '#hero',
    start: '80 top',
    end: 'bottom top',
    onEnter: (self) => {
      if (self.__fired) return; self.__fired = true;
      const zero = $('#hn3');
      const cup = $('#heroCup');
      const zr = zero.getBoundingClientRect();
      const cr = cup.getBoundingClientRect();
      const dx = cr.left + cr.width / 2 - (zr.left + zr.width / 2);
      const dy = cr.top + cr.height / 2 - (zr.top + zr.height / 2);

      gsap.set('.hero-num', { overflow: 'visible' });
      const tl = gsap.timeline();
      tl.to(cup, { opacity: 1, duration: 0.3 }, 0)
        .to(zero, {
          motionPath: {
            path: [{ x: 0, y: 0 }, { x: dx * 0.35, y: dy * 0.2 }, { x: dx * 0.8, y: dy * 0.7 }, { x: dx, y: dy }],
            curviness: 1.4,
          },
          rotation: 420,
          scale: 0.12,
          duration: 1.25,
          ease: 'power2.in',
        }, 0)
        .to(zero, { opacity: 0, duration: 0.18 }, 1.1)
        .to(zero, { width: 0, duration: 0.45, ease: 'power3.inOut' }, 1.15)
        .to(cup, { scaleY: 0.85, transformOrigin: 'center', duration: 0.12, yoyo: true, repeat: 1 }, 1.25)
        .add(flipDigit($('#hn1'), '9'), 0.95)
        .add(flipDigit($('#hn2'), '9'), 1.05)
        .to('.scroll-cue', { autoAlpha: 0, duration: 0.4 }, 0);
    },
  });

  function flipDigit(el, ch) {
    return gsap.timeline()
      .to(el, { rotateX: -88, duration: 0.16, ease: 'power2.in' })
      .add(() => { el.textContent = ch; })
      .set(el, { rotateX: 88 })
      .to(el, { rotateX: 0, duration: 0.3, ease: 'back.out(1.6)' });
  }

  // mouse → scene parallax
  if (!isTouch) {
    window.addEventListener('mousemove', (e) => {
      scene.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
  }
}

/* ---------- 02 arithmetic ---------- */
function initArithmetic() {
  gsap.from('#dropcap27', {
    autoAlpha: 0, y: 60, duration: 1.2, ease: 'power4.out',
    scrollTrigger: { trigger: '#dropcap27', start: 'top 80%', toggleActions: 'play none none none' },
  });

  $$('.ledger-line').forEach((line, i) => {
    gsap.from(line.children, {
      autoAlpha: 0, y: 18, duration: 0.8, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: line, start: 'top 85%', toggleActions: 'play none none none' },
    });
  });

  gsap.to('.kicker-rule', {
    scaleX: 1, duration: 0.9, ease: 'power3.inOut',
    scrollTrigger: { trigger: '#kicker', start: 'top 82%', toggleActions: 'play none none none' },
  });

  // budget table cascade + total
  const cells = $$('#budgetTable .bt-budget .bt-cell:not(.bt-head)');
  ScrollTrigger.create({
    trigger: '#budgetTable',
    start: 'top 80%',
    onEnter: (self) => {
      if (self.__fired) return; self.__fired = true;
      gsap.from('#budgetTable .bt-row', { autoAlpha: 0, y: 16, duration: 0.6, stagger: 0.12, ease: 'power2.out' });
      gsap.from(cells, {
        scale: 1.5, autoAlpha: 0, duration: 0.3, ease: 'power3.in', stagger: 0.04, delay: 0.5,
      });
      odoTo($('#budgetTotal'), 99, { duration: 1.6 });
    },
  });
}

/* ---------- 03 half never ---------- */
function initHalfNever() {
  const golfers = $$('.golfer');
  golfers.forEach(g => $$('path, circle', g).forEach(p => {
    p.style.strokeDasharray = '1';
    p.style.strokeDashoffset = '1';
  }));

  ScrollTrigger.create({
    trigger: '#golferPlate',
    start: 'top 78%',
    onEnter: (self) => {
      if (self.__fired) return; self.__fired = true;
      gsap.to('#golferPlate path, #golferPlate circle', {
        strokeDashoffset: 0,
        duration: 0.9,
        ease: 'power2.out',
        stagger: { each: 0.004, from: 'random' },
      });
      gsap.to('#neverPath', { strokeDashoffset: 0, duration: 0.5, ease: 'power2.in', delay: 1.2 });
    },
  });

  // the half who never recede
  gsap.to('.golfer.haze', {
    opacity: 0.28,
    duration: 1.2,
    ease: 'power2.inOut',
    scrollTrigger: { trigger: '#golferPlate', start: 'top 45%', toggleActions: 'play none none none' },
  });

  gsap.from('.plate-key', {
    autoAlpha: 0, duration: 0.8,
    scrollTrigger: { trigger: '.plate-key', start: 'top 92%', toggleActions: 'play none none none' },
  });
}

/* ---------- 04 doctrine ---------- */
function initDoctrine() {
  $$('.commandment').forEach(cmd => {
    const strike = $('.strike-path', cmd);
    const correction = $('.correction', cmd);
    const len = strike.getTotalLength();
    gsap.set(strike, { strokeDasharray: len, strokeDashoffset: len });

    const tl = gsap.timeline({
      scrollTrigger: { trigger: cmd, start: 'top 62%', toggleActions: 'play none none none' },
    });
    tl.from($('.cline', cmd), { autoAlpha: 0, y: 30, duration: 0.9, ease: 'power4.out' })
      .from($('.cnum', cmd), { autoAlpha: 0, duration: 0.5 }, 0.1)
      .to(strike, { strokeDashoffset: 0, duration: 0.55, ease: 'power2.inOut' }, 0.7)
      .fromTo(correction,
        { autoAlpha: 0, y: 10, rotation: -1 },
        { autoAlpha: 1, y: 0, rotation: -2.5, duration: 0.45, ease: 'back.out(1.7)' }, 1.1);
  });
}

/* ---------- 05 flyover ---------- */
function initFlyover() {
  CustomEase.create('flyLinger', 'M0,0 C0.25,0.08 0.45,0.5 0.62,0.62 0.8,0.75 0.9,0.95 1,1');

  const annos = [
    { el: $('#annoCarry'), anchor: 'carry', inAt: 0.07, outAt: 0.32, dy: -120 },
    { el: $('#annoOB'), anchor: 'ob', inAt: 0.30, outAt: 0.46, dy: -90, stamp: true },
    { el: $('#annoA'), anchor: 'a', inAt: 0.58, outAt: 0.75, dy: -110 },
    { el: $('#annoB'), anchor: 'b', inAt: 0.74, outAt: 0.88, dy: -110 },
    { el: $('#annoC'), anchor: 'c', inAt: 0.88, outAt: 1.01, dy: -130 },
  ];
  let obPlayed = false;

  const place = () => {
    const vw = window.innerWidth, vh = window.innerHeight;
    annos.forEach(a => {
      const p = scene.project(scene.anchors[a.anchor]);
      const x = gsap.utils.clamp(140, vw - 140, p.x);
      const y = gsap.utils.clamp(190, vh - 170, p.y);
      gsap.set(a.el, { x, y, xPercent: -50, yPercent: -120, top: 0, left: 0 });
    });
  };

  ScrollTrigger.create({
    trigger: '#flyover',
    start: 'top top',
    end: '+=300%',
    pin: true,
    anticipatePin: 1,
    scrub: 0.8,
    refreshPriority: 2,
    onUpdate: (self) => {
      const t = self.progress;
      scene.setFlyProgress(t, gsap.parseEase('flyLinger')(t));
      // DOM choreography keyed to raw progress
      annos.forEach(a => {
        const vis = t >= a.inAt && t < a.outAt;
        const o = vis ? Math.min((t - a.inAt) / 0.03, 1) : 0;
        a.el.style.opacity = o;
        a.el.style.visibility = o > 0.01 ? 'visible' : 'hidden';
      });
      if (!obPlayed && t >= 0.30) {
        obPlayed = true;
        stampIn($('#annoOB .stamp'), { rotate: -9, shakeTarget: '#flyoverPin' });
      } else if (obPlayed && t < 0.28) {
        obPlayed = false;
      }
      // apex copy
      setWindowOpacity($('#apex1'), t, 0.32, 0.45);
      setWindowOpacity($('#apex2'), t, 0.45, 0.58);
      // the law
      const law = $('#flyLaw');
      const lo = gsap.utils.clamp(0, 1, (t - 0.90) / 0.05);
      law.style.opacity = lo;
      law.style.visibility = lo > 0.01 ? 'visible' : 'hidden';
      place();
    },
    onLeave: () => { },
    onEnterBack: () => { },
  });

  function setWindowOpacity(el, t, a, b) {
    const ramp = 0.035;
    let o = 0;
    if (t > a && t < b) o = Math.min((t - a) / ramp, 1, Math.max((b - t) / ramp, 0));
    el.style.opacity = gsap.utils.clamp(0, 1, o);
  }

  window.addEventListener('resize', place);
}

/* ---------- 06 wedge ---------- */
function buildWedgeHash() {
  // ladder hashes: 100y out → 0y at the green, 1y = 9.3px
  const hash = $('#wedgeHash');
  let marks = '';
  for (let y = 0; y <= 100; y += 5) {
    const x = 1020 - y * 9.3;
    const major = y % 25 === 0;
    marks += `<line x1="${x}" y1="380" x2="${x}" y2="${380 + (major ? 14 : 7)}" class="plate-ink" stroke-width="${major ? 1.5 : 0.8}"/>`;
    if (major && y > 0 && y < 100) marks += `<text x="${x}" y="${410}" text-anchor="middle" class="svg-mono">${y}y</text>`;
  }
  hash.innerHTML = marks;
}

function initWedge() {
  buildWedgeHash();

  const arc = $('#wedgeArc');
  const len = arc.getTotalLength();
  gsap.set(arc, { strokeDasharray: len, strokeDashoffset: len });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.wedge-plate',
      start: 'top 75%',
      end: 'bottom 55%',
      scrub: 1,
    },
  });
  tl.from('#wedgeHash line', { scaleY: 0, transformOrigin: 'top', stagger: 0.012, duration: 0.4, ease: 'power2.out' }, 0)
    .to(arc, { strokeDashoffset: 0, duration: 2.4, ease: 'none' }, 0.2)
    .to('#wedgeBall', {
      motionPath: { path: '#wedgeArc', align: '#wedgeArc', alignOrigin: [0.5, 0.5] },
      duration: 2.4, ease: 'none',
    }, 0.2)
    .fromTo('#landingRing', { scale: 0.4, transformOrigin: 'center', opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' }, 2.4)
    .from('#wedgeFlag', { autoAlpha: 0, duration: 0.4 }, 2.2)
    .from('#clockNotes text', { autoAlpha: 0, stagger: 0.15, duration: 0.4 }, 1.4);
}

/* ---------- 07 tax ---------- */
function initTaxSection() {
  initHierarchy();

  // lag putt: one long expo.out that dies inside the circle
  ScrollTrigger.create({
    trigger: '#lagSvg',
    start: 'top 70%',
    onEnter: (self) => {
      if (self.__fired) return; self.__fired = true;
      gsap.set('#threeFoot', { transformOrigin: 'center', transformBox: 'fill-box' });
      const tl = gsap.timeline();
      tl.to('#lagPath', { strokeDashoffset: 0, duration: 2.2, ease: 'expo.out' })
        .to('#lagBall', {
          motionPath: { path: '#lagPath', align: '#lagPath', alignOrigin: [0.5, 0.5] },
          duration: 2.2, ease: 'expo.out',
        }, 0)
        .fromTo('#threeFoot', { scale: 1.6, opacity: 0.2 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'power3.out' }, 1.4);
    },
  });

  gsap.from('#taxLedger', {
    autoAlpha: 0, y: 20, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '#taxLedger', start: 'top 85%', toggleActions: 'play none none none' },
  });
}

/* ---------- 08 mental ---------- */
function initMental() {
  const sentences = ['#ms1', '#ms2', '#ms3', '#ms4'].map(s => $(s));

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#mental',
      start: 'top top',
      end: '+=180%',
      pin: true,
      anticipatePin: 1,
      scrub: 0.6,
      refreshPriority: 1,
    },
  });

  sentences.forEach((s, i) => {
    const at = i * 2.2;
    tl.fromTo(s, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, at);
    if (i < sentences.length - 1) {
      tl.to(s, { autoAlpha: 0, y: -40, duration: 0.8, ease: 'power3.in' }, at + 1.6);
    }
  });
  tl.to({}, { duration: 0.6 }); // hold the last line

  // velocity EKG
  const path = $('#ekgPath');
  const N = 90;
  let amp = 0;
  const phases = Array.from({ length: N }, (_, i) => i * 1.7);
  let ekgActive = false;
  let lastY = 0, vel = 0;

  ScrollTrigger.create({
    trigger: '#mental',
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      if (self.isActive) { lastY = smoother ? smoother.scrollTop() : window.scrollY; vel = 0; }
      ekgActive = self.isActive;
    },
  });
  gsap.ticker.add((time) => {
    if (!ekgActive) return;
    const y = smoother ? smoother.scrollTop() : window.scrollY;
    vel += ((y - lastY) * 60 - vel) * 0.08; // px/s, smoothed
    lastY = y;
    const target = gsap.utils.clamp(0, 36, Math.abs(vel) / 90);
    amp += (target - amp) * 0.08;

    let d = `M0,60`;
    for (let i = 1; i < N; i++) {
      const x = (i / (N - 1)) * 1200;
      const jitter = Math.sin(time * 14 + phases[i]) * Math.sin(time * 23 + phases[i] * 0.7);
      d += ` L${x.toFixed(1)},${(60 + jitter * amp).toFixed(1)}`;
    }
    path.setAttribute('d', d);
    const hot = amp > 14;
    path.setAttribute('stroke', hot ? '#8C2F28' : '#C8A45C');
    $('#ekgLabel').textContent = hot
      ? 'YOUR HANDS · YOU ARE RUSHING'
      : 'YOUR HANDS · STEADY. GOOD.';
  });
}

/* ---------- 09 ledger ---------- */
function initLedgerSection() {
  initScorecard();

  gsap.set('#sealWrap', { autoAlpha: 0, scale: 1.6 });
  gsap.set('#blownStamp', { autoAlpha: 0 });

  ScrollTrigger.create({
    trigger: '#scorecard',
    start: 'top 70%',
    onEnter: (self) => {
      if (self.__fired) return; self.__fired = true;
      const tl = gsap.timeline();
      tl.from('#scorecard .sc-row', { autoAlpha: 0, y: 14, duration: 0.5, stagger: 0.08, ease: 'power2.out' })
        .from('#scorecard .sc-btn', {
          scale: 1.6, autoAlpha: 0, duration: 0.28, ease: 'power3.in',
          stagger: { each: 0.05, from: 'start' },
        }, 0.4)
        .to('#sealWrap', { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.35, ease: 'power4.in' }, 1.9)
        .to('#sigPath', { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' }, 2.1);
    },
  });

  // play the round again — rewind the dusk
  $('#playAgain').addEventListener('click', () => {
    if (smoother) {
      gsap.to(smoother, { scrollTop: 0, duration: 2, ease: 'power2.inOut' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

/* ---------- global dusk grade ---------- */
function initDusk() {
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    scrub: 0.5,
    onUpdate: (self) => {
      scene.setDusk(self.progress);
      document.documentElement.style.setProperty('--dusk', self.progress.toFixed(3));
    },
  });
}

/* ---------- scene activity / power management ---------- */
function initSceneActivity() {
  let heroVis = true, flyVis = false;
  const update = () => {
    scene.active = heroVis || flyVis;
    const target = heroVis && !flyVis ? 1 : 0;
    gsap.to(scene, { heroBlend: target, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
  };
  ScrollTrigger.create({
    trigger: '#hero',
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => { heroVis = self.isActive; update(); },
  });
  ScrollTrigger.create({
    trigger: '#flyover',
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => { flyVis = self.isActive; update(); },
  });
}

/* ---------- cursor ---------- */
function initCursor() {
  if (isTouch || !window.matchMedia('(pointer: fine)').matches) return;
  document.body.classList.add('has-cursor');
  const cur = $('#cursor');
  cur.style.opacity = '0';
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const target = { x: pos.x, y: pos.y };
  let seen = false;
  window.addEventListener('mousemove', (e) => {
    target.x = e.clientX; target.y = e.clientY;
    if (!seen) { seen = true; pos.x = e.clientX; pos.y = e.clientY; cur.style.opacity = '1'; }
  }, { passive: true });
  gsap.ticker.add(() => {
    pos.x += (target.x - pos.x) * 0.16;
    pos.y += (target.y - pos.y) * 0.16;
    cur.style.left = pos.x + 'px';
    cur.style.top = pos.y + 'px';
  });
  const hoverables = 'button, a, .sc-btn, .h-col';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverables)) cur.classList.add('is-hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverables)) cur.classList.remove('is-hover');
  });
  document.addEventListener('mousedown', () => cur.classList.add('is-down'));
  document.addEventListener('mouseup', () => cur.classList.remove('is-down'));
}

/* ============================================================
   REDUCED MOTION — the static edition
   ============================================================ */
function initReduced() {
  document.body.classList.remove('is-loading');
  gsap.set('#preloader', { display: 'none' });
  gsap.set('#chip', { y: 0 }); // inline transform beats the stylesheet's translateY(140%)
  gsap.set('.footnote .rule, .kicker-rule', { scaleX: 1 });
  gsap.set(['.anno', '#flyLaw', '.apex-line'], { autoAlpha: 1, position: 'static', transform: 'none', margin: '12px auto' });
  gsap.set('.m-sentence', { autoAlpha: 1, position: 'static', marginBottom: '1em' });
  gsap.set('.correction', { autoAlpha: 1 });
  gsap.set('#lagPath', { strokeDashoffset: 0 });
  gsap.set('#sigPath', { strokeDashoffset: 0 });
  gsap.set('#heroCup', { opacity: 1 });
  $$('.golfer path, .golfer circle').forEach(p => { p.style.strokeDasharray = 'none'; });
  gsap.set('.golfer.haze', { opacity: 0.28 });
  buildWedgeHash();
  const arc = $('#wedgeArc');
  gsap.set(arc, { strokeDasharray: 'none' });
  scene.setDusk(0.4);
  scene.setFlyProgress(0.95);
  scene.render();
  scene.active = false; // one static frame is the whole show — stop the loop
  window.addEventListener('resize', () => scene.render());
  setChip(8);
  initScorecard();
  initHierarchy();
  gsap.set('#sealWrap', { autoAlpha: 1 });
  $('#playAgain').addEventListener('click', () => window.scrollTo(0, 0));
}
