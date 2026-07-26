<template>
  <main class="page">
    <!-- Fixed instrumentation frame: corner crosshairs, ruler, section index -->
    <div class="frame-overlay" aria-hidden="false">
      <!-- Crosshairs -->
      <span class="x-hair x-tl"></span>
      <span class="x-hair x-tr"></span>
      <span class="x-hair x-bl"></span>
      <span class="x-hair x-br"></span>

      <!-- Left vertical ruler -->
      <div class="vruler" aria-hidden="true">
        <span class="v-tick" v-for="n in 11" :key="n" :data-v="n - 1"></span>
      </div>

      <!-- Right clickable section index (1..4) -->
      <nav class="vindex" aria-label="Section navigation">
        <span class="vi-label">SECTION</span>
        <ol class="vi-list">
          <li>
            <button class="vi-btn" type="button" data-section="hero-section" @click="goToSection('hero-section')">
              <span class="vi-num">1</span>
              <span class="vi-name">Opening</span>
            </button>
          </li>
          <li>
            <button class="vi-btn" type="button" data-section="white-intro-section" @click="goToSection('white-intro-section')">
              <span class="vi-num">2</span>
              <span class="vi-name">Specification</span>
            </button>
          </li>
          <li>
            <button class="vi-btn" type="button" data-section="showcase-section" @click="goToSection('showcase-section')">
              <span class="vi-num">3</span>
              <span class="vi-name">Showcase</span>
            </button>
          </li>
          <li>
            <button class="vi-btn" type="button" data-section="outro-section" @click="goToSection('outro-section')">
              <span class="vi-num">4</span>
              <span class="vi-name">Build Notes</span>
            </button>
          </li>
        </ol>
      </nav>
    </div>

    <!-- ───────────── Fixed 3D Viewport (single shared canvas) ───────────── -->
    <div class="scene-stack" aria-hidden="true">
      <ClientOnly>
        <div class="scene-layer is-on">
          <CubeScene
            :progress="combinedProgress"
            :scene-id="currentScene"
            @caption-change="onCaptionChange"
          />
        </div>
      </ClientOnly>
    </div>

    <!-- ───────────── Scroll Sections Overlay ───────────── -->
    <div id="scroll-container" style="position: relative; z-index: 2; pointer-events: none;">

      <!-- Section 1: Opening -->
      <section class="section hero-sec" id="hero-section">
        <div class="hero-grid">
          <div class="hero-left">
            <div class="row-meta">
              <span class="eyebrow">01 / OPENING</span>
              <span class="rule-t"></span>
              <span class="meta-mono">KAIRO.CORE</span>
            </div>
            <div class="hero-heading">
              <span class="ghost-num" aria-hidden="true">01</span>
              <h1>Kairo</h1>
            </div>
            <p class="hero-lede">An open robotics platform assembled from three machined subsystems, measured to sub-millimeter tolerance, documented for reproduction.</p>
            <div class="scroll-hint" aria-hidden="true">
              <span class="scroll-hint-line"></span>
              <span class="scroll-hint-label">SCROLL OR PICK A SECTION</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2: Specification of the System -->
      <section class="section white-section" id="white-intro-section">
        <div class="spec-sheet">
          <header class="spec-header">
            <span class="tag dark-tag">02 / SPECIFICATION</span>
            <span class="rule-t"></span>
          </header>
          <div class="spec-body">
            <h2>Specification<br />of the System</h2>
            <p>Kairo is an open robotics platform assembled from three machined subsystems: a precision gripper, a transfer shaft coupling, and a high-torque drive base. Each module is documented, replaceable, and measured against a repeatable reference rig.</p>
          </div>
        </div>
      </section>

      <!-- Section 3: Showcase — drives the 3 caption zooms -->
      <section class="section showcase-sec" id="showcase-section">
        <div id="caption-claw" class="feature-label caption-left">
          <header class="cap-header">
            <span class="cap-idx">[01]</span>
            <span class="tag">CLAW · TOP / -Z</span>
          </header>
          <div class="cap-rule"></div>
          <h2>Precision Gripper</h2>
          <p>Articulated claw assembly engineered for repeatable sub-millimeter pick-and-place cycles across the workspace envelope.</p>
        </div>

        <div id="caption-middle" class="feature-label caption-right">
          <header class="cap-header">
            <span class="cap-idx">[02]</span>
            <span class="tag">TRANSFER · ROD</span>
          </header>
          <div class="cap-rule"></div>
          <h2>Transfer Shaft</h2>
          <p>Central rod couples the drive stack to the gripper axis with matched inertia, eliminating backlash under load reversals.</p>
        </div>

        <div id="caption-base" class="feature-label caption-left">
          <header class="cap-header">
            <span class="cap-idx">[03]</span>
            <span class="tag">BASE · HOME / +Z</span>
          </header>
          <div class="cap-rule"></div>
          <h2>Drive Foundation</h2>
          <p>High-torque base gear train delivers smooth rotational anchoring and zero-slip positioning during precision moves.</p>
        </div>
      </section>

      <!-- Section 4: Build Notes -->
      <section class="section white-section" id="outro-section">
        <div class="spec-sheet">
          <header class="spec-header">
            <span class="tag dark-tag">04 / BUILD</span>
            <span class="rule-t"></span>
          </header>
          <div class="spec-body">
            <h2>Build<br />Notes</h2>
            <p>Drawings, bill of materials, and firmware references are maintained alongside the physical assemblies. Iteration continues on the bench between revisions.</p>
          </div>
        </div>
      </section>

    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CubeScene from '~/components/CubeScene.vue'

// Single shared scene: 'hero' through hero+white-intro, 'showcase' through showcase+outro.
const currentScene = ref('hero')
const combinedProgress = ref(0)
const activeCaption = ref(null)

function onCaptionChange(name) {
  activeCaption.value = name
}

// Scroll to a named section, smoothly. Used by the right-side section index.
function goToSection(id) {
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY
  window.scrollTo({ top, behavior: 'smooth' })
}

// Highlight the active section button (1..4) as the user scrolls.
const sections = ['hero-section', 'white-intro-section', 'showcase-section', 'outro-section']
function updateSectionIndex() {
  let idx = 0
  for (let i = 0; i < sections.length; i++) {
    const el = document.getElementById(sections[i])
    if (!el) continue
    const rect = el.getBoundingClientRect()
    if (rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.5) {
      idx = i
      break
    }
  }
  document.querySelectorAll('.vi-btn').forEach((btn) => {
    const i = sections.indexOf(btn.dataset.section)
    btn.classList.toggle('is-active', i === idx)
  })
}

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger)
  ScrollTrigger.config({ ignoreMobileResize: true })

  updateSectionIndex()
  window.addEventListener('scroll', updateSectionIndex, { passive: true })

  // ===== Hero scene master timeline. Spans the HERO SECTION ONLY so the spin + fade
  // complete entirely within the black hero section and never bleed into the white
  // intro section below it. Drives combinedProgress 0->1 while currentScene === 'hero'.
  const heroTL = gsap.timeline({
    scrollTrigger: {
      trigger: '#hero-section',
      start: 'top top',
      end: 'bottom top',
      scrub: 0.8,
    }
  })

  heroTL.to(combinedProgress, {
    value: 1,
    ease: 'none',
    duration: 3
  }, 0)

  // Hero text fades out as user begins scrolling (spin begins immediately).
  heroTL.to('.hero-left', {
    opacity: 0,
    y: -40,
    duration: 0.08 * 3,
    ease: 'power2.out'
  }, 0)

  // ===== Swap to showcase scene at the showcase/white-intro boundary.
  ScrollTrigger.create({
    trigger: '#showcase-section',
    start: 'top top',
    onEnter: () => {
      currentScene.value = 'showcase'
      combinedProgress.value = 0
    },
    onLeaveBack: () => {
      currentScene.value = 'hero'
    },
  })

  // ===== Showcase scene master timeline. Spans showcase + outro region.
  const showcaseTL = gsap.timeline({
    scrollTrigger: {
      trigger: '#showcase-section',
      start: 'top top',
      endTrigger: '#outro-section',
      end: 'bottom bottom',
      scrub: 0.8,
    }
  })

  showcaseTL.to(combinedProgress, {
    value: 1,
    ease: 'none',
    duration: 3
  }, 0)

  // ===== Caption fade in/out, keyed to SHOWCASE scene progress bands =====
  // Bands in showcase 0-1 space:
  //   claw    0.08 - 0.24  (in 0.08-0.12, hold, out 0.20-0.24)
  //   middle  0.24 - 0.40  (in 0.24-0.28, hold, out 0.36-0.40)
  //   base    0.40 - 0.56  (in 0.40-0.44, hold, out 0.52-0.56)
  // Showcase master tl duration = 3, so multiply progress by 3.

  showcaseTL.fromTo('#caption-claw',
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.04 * 3, ease: 'power3.out' },
    0.08 * 3
  )
  .to('#caption-claw', {
    opacity: 0, y: -20, duration: 0.04 * 3, ease: 'power2.in'
  }, 0.20 * 3)

  showcaseTL.fromTo('#caption-middle',
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.04 * 3, ease: 'power3.out' },
    0.24 * 3
  )
  .to('#caption-middle', {
    opacity: 0, y: -20, duration: 0.04 * 3, ease: 'power2.in'
  }, 0.36 * 3)

  showcaseTL.fromTo('#caption-base',
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.04 * 3, ease: 'power3.out' },
    0.40 * 3
  )
  .to('#caption-base', {
    opacity: 0, y: -20, duration: 0.04 * 3, ease: 'power2.in'
  }, 0.52 * 3)


  // ===== White section content: subtle fade-up entrance via view triggers =====
  gsap.utils.toArray('.spec-sheet').forEach((el) => {
    gsap.fromTo(el,
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        }
      }
    )
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateSectionIndex)
})
</script>

<style scoped>
/* ────────────────────────────────────────────────────────────────────────
   KAIRO — overhaul: Engineering logbook.
   Deviations from the previous design (and from AI defaults):
   - H1 is smaller, paired with ghost counter behind it (editorial, not
     landing-page hero). Letter-spacing -0.06em.
   - Sections swap on hairline rules, not padded gradients.
   - White sections are bone (#f0ead6) with a fine 4px engineering grid at
     5% opacity — drawn with actual vector lines, not noise.
   - Caption cards are flat editorial spec-panels with mono data lists, not
     glassmorphic floating cards.
   - Persistent instrumentation frame: corner crosshairs, top mono ticker
     showing live progress / scene, left vertical ruler (0..10), right
     index column (section number).
   - Red (#ff2b2b) used only as a signal — accent rules, the live dot,
     the index number, the spec idx brackets. Never on section bodies.
   - Bone-yellow (#f0ead6) is the contrasting color (per brief — not red).
   ──────────────────────────────────────────────────────────────────────── */

:root {
  --ink:        #0a0a0d;
  --ink-2:      #14141a;
  --bone:       #f0ead6;
  --bone-2:     #e8e2cc;
  --red:        #ff2b2b;
  --red-soft:   rgba(255, 43, 43, 0.55);
  --gray-1:     #8c8c95;
  --gray-2:     #4a4a52;
  --rule-light: rgba(255, 255, 255, 0.12);
  --rule-dark:  rgba(10, 10, 13, 0.18);
  --font-display: 'Space Grotesk', 'Inter', sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
}

:global(html),
:global(body) {
  margin: 0;
  overflow-x: hidden;
  background: var(--ink);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

:global(*) { box-sizing: border-box; }

.page {
  position: relative;
  min-height: 550vh;
  background: var(--ink);
  color: #fff;
}

.section { width: 100%; position: relative; }

/* ═══════════════════ Persistent instrumentation frame ═══════════════════ */
.frame-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  font-family: var(--font-mono);
}
.x-hair {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 1px solid var(--rule-light);
}
.x-tl { top: 18px; left: 18px; border-right: none; border-bottom: none; }
.x-tr { top: 18px; right: 18px; border-left: none; border-bottom: none; }
.x-bl { bottom: 18px; left: 18px; border-right: none; border-top: none; }
.x-br { bottom: 18px; right: 18px; border-left: none; border-top: none; }

/* Left vertical ruler — 11 ticks 0..10 */
.vruler {
  position: absolute;
  left: 22px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.v-tick {
  display: block;
  width: 14px;
  height: 1px;
  background: var(--rule-light);
  position: relative;
}
.v-tick::after {
  content: attr(data-v);
  position: absolute;
  left: 18px;
  top: -7px;
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  color: #6c6c74;
  font-variant-numeric: tabular-nums;
}

/* Right clickable section index (1..4) */
.vindex {
  position: fixed;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 14px;
  z-index: 10000;
  pointer-events: auto;
}
.vi-label {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.22em;
  color: #6c6c74;
  text-transform: uppercase;
}
.vi-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.vi-list li { margin: 0; padding: 0; }
.vi-btn {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.7rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.32rem 0;
  color: #6c6c74;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  transition: color 140ms ease, gap 140ms ease;
}
.vi-btn:hover { color: #fff; }
.vi-btn:focus-visible {
  outline: 1px solid var(--red);
  outline-offset: 4px;
}
.vi-btn.is-active { color: var(--red); }
.vi-num {
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  width: 1.4rem;
  text-align: right;
}
.vi-name {
  font-size: 0.66rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0;
  transform: translateX(6px);
  transition: opacity 160ms ease, transform 160ms ease;
}
.vi-btn:hover .vi-name,
.vi-btn.is-active .vi-name {
  opacity: 1;
  transform: translateX(0);
}

/* ═══════════════════ Fixed 3D viewport ═══════════════════ */
.scene-stack {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}
.scene-layer {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}
.scene-layer.is-on { opacity: 1; }

/* ═══════════════════ Hero ═══════════════════ */
.hero-sec {
  height: 130vh;
  display: flex;
  align-items: flex-start;
  padding: 16vh 6vw 0;
}
.hero-grid {
  width: 100%;
  max-width: 1400px;
}
.hero-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}
.row-meta {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-bottom: 1.4rem;
}
.rule-t {
  flex: 1;
  height: 1px;
  background: var(--red-soft);
  max-width: 60px;
}
.meta-mono {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.22em;
  color: var(--gray-1);
  text-transform: uppercase;
}

.hero-heading {
  position: relative;
  display: inline-block;
  line-height: 0.9;
  margin-bottom: 1.6rem;
}
.ghost-num {
  position: absolute;
  top: -1rem;
  left: -2.4rem;
  font-family: var(--font-mono);
  font-size: 7rem;
  font-weight: 500;
  color: transparent;
  -webkit-text-stroke: 1px rgba(255, 43, 43, 0.32);
  line-height: 1;
  letter-spacing: -0.04em;
  pointer-events: none;
  user-select: none;
}
.hero-heading h1 {
  font-family: var(--font-display);
  font-size: clamp(4rem, 9vw, 9rem);
  font-weight: 700;
  letter-spacing: -0.06em;
  line-height: 0.88;
  margin: 0;
  color: #fff;
  background: none;
  -webkit-text-fill-color: #fff;
}

.hero-lede {
  font-family: var(--font-body);
  font-size: 1.05rem;
  font-weight: 400;
  line-height: 1.55;
  color: var(--gray-1);
  max-width: 38ch;
  margin: 0 0 2rem;
}

.scroll-hint {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}
.scroll-hint > .scroll-hint-line {
  display: block;
  width: 1px;
  height: 30px;
  background: linear-gradient(180deg, transparent, var(--red), transparent);
  animation: scrollHint 1.8s ease-in-out infinite;
}
.scroll-hint-label {
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.24em;
  color: var(--gray-1);
  text-transform: uppercase;
}
@keyframes scrollHint {
  0%   { transform: translateY(-30px); opacity: 0; }
  40%  { opacity: 1; }
  100% { transform: translateY(30px); opacity: 0; }
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.24em;
  color: var(--red);
  text-transform: uppercase;
}

/* ═══════════════════ White sections — engineering logbook ═══════════════════ */
.white-section {
  height: 100vh;
  background: var(--bone);
  color: var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14vh 12vw;
  position: relative;
}
/* Fine engineering grid */
.white-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(10, 10, 13, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(10, 10, 13, 0.05) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
}
/* Second L-shape, top-right corner */
.white-section::after {
  content: '';
  position: absolute;
  top: 28px; right: 28px;
  width: 22px; height: 22px;
  border-top: 1px solid var(--ink);
  border-right: 1px solid var(--ink);
  pointer-events: none;
}

#white-intro-section { height: 100vh; }

.spec-sheet {
  position: relative;
  max-width: 640px;
  width: 100%;
  z-index: 1;
}
.spec-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1.2rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(10, 10, 13, 0.3);
}
.spec-date {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  color: var(--gray-2);
  margin-left: auto;
}
.spec-body h2 {
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 5vw, 4.4rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 0.96;
  margin: 0 0 1.4rem;
  color: var(--ink);
}
.spec-body p {
  font-size: 1.05rem;
  line-height: 1.65;
  color: #2c2c35;
  margin: 0 0 2rem;
  max-width: 42ch;
}
.spec-list {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.4rem 1.4rem;
  margin: 0;
  padding: 1.2rem 0;
  border-top: 1px solid rgba(10, 10, 13, 0.18);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
}
.spec-list dt {
  color: var(--gray-2);
  text-transform: uppercase;
  font-weight: 500;
}
.spec-list dd {
  margin: 0;
  color: var(--ink);
  font-weight: 500;
}

.dark-tag {
  color: var(--red);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
.tag {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  color: var(--red);
  text-transform: uppercase;
}

/* ═══════════════════ Showcase ═══════════════════ */
.showcase-sec {
  height: 220vh;
  background: transparent;
}

/* Editorial flat spec-panel caption */
.feature-label {
  position: fixed;
  z-index: 3;
  max-width: 320px;
  background: rgba(18, 18, 24, 0.92);
  padding: 1.4rem 1.5rem 1.5rem;
  border-radius: 0;
  border: none;
  border-left: 2px solid var(--red);
  font-family: var(--font-body);
  opacity: 0;
  backdrop-filter: blur(8px);
}
.cap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.9rem;
}
.cap-idx {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--red);
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}
.cap-rule {
  height: 1px;
  background: var(--rule-light);
  margin: 0.3rem 0 1rem;
}
.feature-label h2 {
  font-family: var(--font-display);
  font-size: 1.55rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.05;
  margin: 0 0 0.7rem;
  color: #fff;
}
.feature-label p {
  font-size: 0.86rem;
  line-height: 1.55;
  color: #b6b6bd;
  margin: 0 0 1.2rem;
}
.cap-spec {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.3rem 1rem;
  margin: 0;
  padding-top: 0.9rem;
  border-top: 1px solid var(--rule-light);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.04em;
}
.cap-spec dt {
  color: var(--gray-1);
  text-transform: uppercase;
  font-weight: 500;
}
.cap-spec dd {
  margin: 0;
  color: #e0e0e5;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.caption-left  { left: 8vw;  top: 28vh; }
.caption-right { right: 8vw; top: 28vh; }

@media (max-width: 768px) {
  .ticker { display: none; }
  .vruler, .vindex { display: none; }
  .feature-label { max-width: 86vw; }
  .caption-left, .caption-right { left: 6vw; right: 6vw; top: auto; bottom: 12vh; }
}

@media (prefers-reduced-motion: reduce) {
  .scroll-hint > .scroll-hint-line { animation: none; opacity: 0.5; }
  .t-dot { animation: none; }
  .scene-layer { transition: none; }
  /* No spacer/eyebrow ghost animations to disable — they're static. */
}
</style>
