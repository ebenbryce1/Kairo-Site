<template>
  <main style="height: 640vh; background: #0a0a0a; color: white;">
    <!-- ───────────── Fixed 3D Viewports (two stacked, independent scenes) ───────────── -->
    <div class="scene-stack" aria-hidden="true">
      <ClientOnly>
        <div class="scene-layer" :class="{ 'is-on': heroActive }">
          <CubeScene :progress="heroProgress" :scene-id="'hero'" />
        </div>
        <div class="scene-layer" :class="{ 'is-on': showcaseActive }">
          <CubeScene :progress="showcaseProgress" :scene-id="'showcase'" @caption-change="onCaptionChange" />
        </div>
      </ClientOnly>
    </div>

    <!-- ───────────── Scroll Sections Overlay ───────────── -->
    <div id="scroll-container" style="position: relative; z-index: 2; pointer-events: none;">

      <!-- Section 1: Hero — Kairo text on the left, big stationary robot on the right
           that does a single slow 360° spin, then holds facing front. -->
      <section class="section hero-sec" id="hero-section">
        <div id="hero-text">
          <span class="eyebrow">ROBOTICS CORE // KAIRO</span>
          <h1>Kairo</h1>
          <p>Scroll to inspect system architecture</p>
          <div class="scroll-hint" aria-hidden="true">
            <span class="scroll-hint-line"></span>
          </div>
        </div>
      </section>

      <!-- Section 2: White intro section (text TBD; hero-scene model fades out here) -->
      <section class="section white-section" id="white-intro-section">
        <div class="white-block">
          <span class="tag dark-tag">INTRO</span>
          <h2>Specification</h2>
          <p>Reserved for overview copy.</p>
        </div>
      </section>

      <!-- Section 3: Black robot showcase section (tall — drives the 3 caption zooms) -->
      <section class="section showcase-sec" id="showcase-section">
        <!-- Caption overlays, fixed to the viewport, animated by app.vue master timeline -->
        <div id="caption-claw" class="feature-label caption-left">
          <span class="gradient-bar"></span>
          <span class="tag">01 / CLAW</span>
          <h2>Precision Gripper</h2>
          <p>Articulated claw assembly engineered for repeatable sub-millimeter pick-and-place cycles.</p>
        </div>

        <div id="caption-base" class="feature-label caption-right">
          <span class="gradient-bar"></span>
          <span class="tag">02 / BASE GEAR</span>
          <h2>Drive Foundation</h2>
          <p>High-torque base gear train delivers smooth rotational anchoring and zero-backlash positioning.</p>
        </div>

        <div id="caption-middle" class="feature-label caption-left">
          <span class="gradient-bar"></span>
          <span class="tag">03 / MIDDLE GEAR</span>
          <h2>Transfer Shaft</h2>
          <p>Central rod-like transfer gear couples the drive stack to the gripper axis with matched inertia.</p>
        </div>
      </section>

      <!-- Section 4: White outro section (showcase scene model fades to truly blank) -->
      <section class="section white-section" id="outro-section">
        <div class="white-block">
          <span class="tag dark-tag">END</span>
          <h2>Reserved</h2>
          <p>Blank outro copy.</p>
        </div>
      </section>

    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CubeScene from '~/components/CubeScene.vue'

const heroProgress = ref(0)
const showcaseProgress = ref(0)
const heroActive = ref(true)
const showcaseActive = ref(false)
const activeCaption = ref(null)

function onCaptionChange(name) {
  activeCaption.value = name
}

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger)
  ScrollTrigger.config({ ignoreMobileResize: true })

  // ===== Hero scene master timeline. Spans hero + white intro region.
  const heroTL = gsap.timeline({
    scrollTrigger: {
      trigger: '#hero-section',
      start: 'top top',
      endTrigger: '#white-intro-section',
      end: 'bottom bottom',
      scrub: 0.8,
    }
  })

  heroTL.to(heroProgress, {
    value: 1,
    ease: 'none',
    duration: 3
  }, 0)

  // Hero text fades out as user begins scrolling (spin begins immediately).
  heroTL.to('#hero-text', {
    opacity: 0,
    y: -40,
    duration: 0.08 * 3,
    ease: 'power2.out'
  }, 0)

  // Switch scenes at the showcase/white-intro boundary (both fire at the same instant).
  ScrollTrigger.create({
    trigger: '#showcase-section',
    start: 'top top',
    onEnter: () => {
      heroActive.value = false
      showcaseActive.value = true
    },
    onLeaveBack: () => {
      heroActive.value = true
      showcaseActive.value = false
    },
  })


  // ===== Showcase scene master timeline. Spans showcase + outro region.
  // Activation toggling is handled above at the showcase/white-intro boundary
  // so the hero scene crossfades cleanly into the showcase scene.
  const showcaseTL = gsap.timeline({
    scrollTrigger: {
      trigger: '#showcase-section',
      start: 'top top',
      endTrigger: '#outro-section',
      end: 'bottom bottom',
      scrub: 0.8,
    }
  })

  showcaseTL.to(showcaseProgress, {
    value: 1,
    ease: 'none',
    duration: 3
  }, 0)

  // Deactivate the showcase scene once its outro fade is complete (after the user has
  // scrolled into the blank outro white section).
  ScrollTrigger.create({
    trigger: '#outro-section',
    start: 'top 50%',
    onEnter: () => { showcaseActive.value = false },
    onLeaveBack: () => { showcaseActive.value = true },
  })

  showcaseTL.to(showcaseProgress, {
    value: 1,
    ease: 'none',
    duration: 3
  }, 0)

  // Deactivate the showcase scene once its outro fade is complete (after the user has
  // scrolled into the blank outro white section).
  ScrollTrigger.create({
    trigger: '#outro-section',
    start: 'top 50%',
    onEnter: () => { showcaseActive.value = false },
    onLeaveBack: () => { showcaseActive.value = true },
  })


  // ===== Caption fade in/out, keyed to SHOWCASE scene progress bands =====
  // Bands in showcase 0-1 space:
  //   claw    0.08 - 0.24  (in 0.08-0.12, hold, out 0.20-0.24)
  //   base    0.24 - 0.40  (in 0.24-0.28, hold, out 0.36-0.40)
  //   middle  0.40 - 0.56  (in 0.40-0.44, hold, out 0.52-0.56)
  // Showcase master tl duration = 3, so multiply progress by 3.

  showcaseTL.fromTo('#caption-claw',
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.04 * 3, ease: 'power3.out' },
    0.08 * 3
  )
  .to('#caption-claw', {
    opacity: 0, y: -20, duration: 0.04 * 3, ease: 'power2.in'
  }, 0.20 * 3)

  showcaseTL.fromTo('#caption-base',
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.04 * 3, ease: 'power3.out' },
    0.24 * 3
  )
  .to('#caption-base', {
    opacity: 0, y: -20, duration: 0.04 * 3, ease: 'power2.in'
  }, 0.36 * 3)

  showcaseTL.fromTo('#caption-middle',
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, duration: 0.04 * 3, ease: 'power3.out' },
    0.40 * 3
  )
  .to('#caption-middle', {
    opacity: 0, y: -20, duration: 0.04 * 3, ease: 'power2.in'
  }, 0.52 * 3)


  // ===== White section content: subtle fade-up entrance via view triggers =====
  gsap.utils.toArray('.white-block').forEach((el) => {
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
</script>

<style scoped>
:global(body) {
  margin: 0;
}

.section {
  width: 100%;
  position: relative;
}

/* Two stacked, fixed-full-viewport 3D layers. Each holds an independent TresCanvas
   loading its own model. Their per-layer opacity gates which one is visibly rendering. */
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
.scene-layer.is-on {
  opacity: 1;
}

/* ===== Hero ===== */
.hero-sec {
  /* Tall hero: gives the single 360° spin plenty of scroll room while the model
     stays stationary on the right side of the viewport. */
  height: 220vh;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 14vh 6vw 0;
}

#hero-text {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
  max-width: 48vw;
}

.eyebrow {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  letter-spacing: 0.24em;
  color: #00ffcc;
  text-transform: uppercase;
  margin-bottom: 0.6rem;
  opacity: 0.92;
}

#hero-text h1 {
  font-size: clamp(4.5rem, 11vw, 11rem);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 0.95;
  margin: 0;
  background: linear-gradient(180deg, #ffffff 0%, #9595a8 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

#hero-text p {
  color: #a1a1aa;
  font-size: 1.15rem;
  font-family: system-ui, sans-serif;
  margin: 0.4rem 0 0;
}

.scroll-hint {
  margin-top: 1.6rem;
  width: 1px;
  height: 60px;
  position: relative;
  overflow: hidden;
}
.scroll-hint-line {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 30px;
  background: linear-gradient(180deg, transparent, #00ffcc, transparent);
  animation: scrollHint 1.8s ease-in-out infinite;
}
@keyframes scrollHint {
  0%   { transform: translateY(-30px); opacity: 0; }
  40%  { opacity: 1; }
  100% { transform: translateY(60px); opacity: 0; }
}

/* ===== White sections ===== */
.white-section {
  height: 100vh;
  background: #ededed;
  color: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10vw;
}

#white-intro-section {
  /* Single viewport — the hero scene completes its framed hold within this view. */
  height: 100vh;
}

.white-block {
  max-width: 460px;
  font-family: system-ui, sans-serif;
}

.white-block h2 {
  font-size: 2.5rem;
  margin: 0.6rem 0 0.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.white-block p {
  color: #555;
  font-size: 1rem;
  margin: 0;
}

.dark-tag {
  color: #007a66;
}

/* ===== Showcase (black) section driving the 3 caption zooms ===== */
.showcase-sec {
  /* 3 caption bands (~80vh each) + opener/outro padding. */
  height: 220vh;
  background: linear-gradient(180deg, #0a0a0a 0%, #05060a 100%);
}

/* Caption overlay labels — fixed to the viewport so they stay put as the
   showcase section scrolls past, matching the fixed 3D canvas. */
.feature-label {
  position: fixed;
  z-index: 3;
  max-width: 320px;
  background: rgba(14, 16, 22, 0.72);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  padding: 1.5rem 1.6rem;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  font-family: system-ui, sans-serif;
  opacity: 0;
}

.caption-left {
  left: 10vw;
  top: 38vh;
}

.caption-right {
  right: 10vw;
  top: 38vh;
}

.gradient-bar {
  display: block;
  width: 36px;
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(90deg, #00ffcc 0%, #ff5fa2 100%);
  margin-bottom: 0.9rem;
}

.tag {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  color: #00ffcc;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.feature-label h2 {
  font-size: 1.55rem;
  margin: 0.6rem 0 0.45rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.feature-label p {
  font-size: 0.92rem;
  color: #b6b8c2;
  line-height: 1.5;
  margin: 0;
}
</style>
