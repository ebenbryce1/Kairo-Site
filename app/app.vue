<template>
  <main style="height: 400vh; background: #0a0a0a; color: white;">
    <!-- Fixed Viewport -->
    <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh; z-index: 1;">
      <ClientOnly>
        <CubeScene :progress="scrollProgress" />
      </ClientOnly>
    </div>

    <!-- Scroll Sections Overlay -->
    <div id="scroll-container" style="position: relative; z-index: 2; pointer-events: none;">
      
      <!-- Section 1: Hero Header -->
      <section class="section hero-sec" style="height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center;">
        <div id="hero-text">
          <h1 style="font-size: 3.5rem; font-family: sans-serif; margin-bottom: 0.5rem;">Robotics Core</h1>
          <p style="color: #a1a1aa; font-size: 1.2rem;">Scroll down to inspect system architecture</p>
        </div>
      </section>

      <!-- Section 2: Zoomed In - Label 1 -->
      <section class="section" style="height: 100vh; display: flex; align-items: center; padding-left: 10vw;">
        <div id="label-1" class="feature-label">
          <span class="tag">01 / CHASSIS</span>
          <h2>Anodized Aluminum Frame</h2>
          <p>Ultra-lightweight high-durability alloy body designed for autonomous mobility.</p>
        </div>
      </section>

      <!-- Section 3: Zoomed In - Label 2 -->
      <section class="section" style="height: 100vh; display: flex; align-items: center; padding-left: 60vw;">
        <div id="label-2" class="feature-label">
          <span class="tag">02 / ACTUATOR</span>
          <h2>Precision Servo Array</h2>
          <p>High-torque custom brushless motor units with sub-millimeter positioning accuracy.</p>
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

const scrollProgress = ref(0)

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger)

  ScrollTrigger.config({ ignoreMobileResize: true })

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
    }
  })

  tl.to(scrollProgress, {
    value: 1,
    ease: 'none',
    duration: 3
  }, 0)

  tl.to('#hero-text', {
    opacity: 0,
    y: -50,
    duration: 0.6,
    ease: 'power1.out'
  }, 0)

  tl.fromTo('#label-1', 
    { opacity: 0, x: -30 }, 
    { opacity: 1, x: 0, duration: 0.8 }, 
    0.8
  )
  .to('#label-1', { opacity: 0, x: -30, duration: 0.5 }, 1.8)

  tl.fromTo('#label-2', 
    { opacity: 0, x: 30 }, 
    { opacity: 1, x: 0, duration: 0.8 }, 
    2.0
  )
})
</script>

<style scoped>
.feature-label {
  opacity: 0;
  max-width: 320px;
  background: rgba(18, 18, 22, 0.75);
  backdrop-filter: blur(12px);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-family: sans-serif;
}

.tag {
  font-size: 0.75rem;
  color: #00ffcc;
  font-weight: bold;
  letter-spacing: 0.1em;
}

.feature-label h2 {
  font-size: 1.4rem;
  margin: 0.5rem 0;
}

.feature-label p {
  font-size: 0.9rem;
  color: #a1a1aa;
  line-height: 1.4;
  margin: 0;
}
</style>