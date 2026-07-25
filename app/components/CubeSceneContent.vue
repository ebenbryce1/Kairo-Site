<!-- app/components/CubeSceneContent.vue -->
<template>
  <TresGroup ref="rootRef">
    <!-- Camera without reactive template props so render loop has 100% smooth control -->
    <TresPerspectiveCamera ref="cameraRef" />

    <TresAmbientLight :intensity="0.55" />
    <TresDirectionalLight :position="[10, 10, 10]" :intensity="1.6" />
    <TresHemisphereLight :intensity="0.4" />

    <!-- Accent rim lights (subtle pulse in render loop) -->
    <TresPointLight ref="cyanLightRef" :position="[-4, 2, -3]" :intensity="0.0" color="#00ffcc" :distance="20" />
    <TresPointLight ref="warmLightRef" :position="[4, 1, 4]" :intensity="0.0" color="#ff7733" :distance="20" />

    <!-- Render scene root once ready (upright offset baked into inner cloned group) -->
    <TresGroup v-if="loadedScene" ref="modelRef">
      <primitive :object="loadedScene" />
    </TresGroup>
  </TresGroup>
</template>

<script setup>
import { shallowRef, onMounted, onBeforeUnmount, watch, inject } from 'vue'
import { useLoop, useTresContext } from '@tresjs/core'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { gsap } from 'gsap'

const DEG2RAD = Math.PI / 180
const UPRIGHT_ROTATION_X = 286.4788 * DEG2RAD // Upright model base offset (baked into inner group)
const isProd = import.meta.env.PROD

const props = defineProps({
  progress: {
    type: Number,
    default: 0
  },
  sceneId: {
    type: String,
    default: 'hero' // 'hero' | 'showcase'
  }
})

const emit = defineEmits(['caption-change'])

const modelRef = shallowRef(null)
const cameraRef = shallowRef(null)
const cyanLightRef = shallowRef(null)
const warmLightRef = shallowRef(null)
const loadedScene = shallowRef(null)

// Grab this scene's own TresJS context (renderer, camera, scene) so we can drive
// the renderer's clear color from the render loop. This is critical for the outro
// fade-to-white to actually appear instead of staying at the canvas's static clear.
const tres = useTresContext()
const renderer = tres?.renderer
const clearColorObj = new THREE.Color()

const rawBase = '/Kairo-Site/'
const modelPath = `${rawBase}models/robot.glb`.replace(/\/+/g, '/')

// 1. Reactive State Object. rotX stays 0 — model stays upright via baked offset.
// Two scene presets: 'hero' (intro + spin) and 'showcase' (caption zoom sequence).
const isHero = props.sceneId === 'hero'

const animState = {
  rotY: 0,
  posX: 0,                 // model container hard translate (hero pushes this right)
  camX: 0,
  camY: 1.5,
  camZ: 7.5,
  targetX: 0,
  targetY: 0,
  targetZ: 0,
  opacity: 1,
  clearR: 0.04, // deep navy tint (animated)
  clearG: 0.04,
  clearB: 0.05,
}

if (isHero) {
  // Hero preset: big model translated to the right side of the screen. Camera aimed
  // at the model (not world origin) so the model fills the right half.
  animState.posX = 2.0
  animState.camX = 0
  animState.camY = 0.5
  animState.camZ = 3.2
  animState.targetX = 2.0
  animState.targetY = 0
  animState.targetZ = 0
} else {
  // Showcase preset: model is visible from frame 1; starts at classic centered hero
  // framing and zooms through the caption sequence.
  animState.posX = 0
  animState.camX = 0.6
  animState.camY = 1.3
  animState.camZ = 6.5
  animState.targetX = 0
  animState.targetY = 0
  animState.targetZ = 0
  animState.opacity = 1
  animState.rotY = Math.PI * 0.25 // pre-angled for opener
}

// GUI State (dev only)
const guiState = {
  rotYDeg: animState.rotY / DEG2RAD,
  camX: animState.camX,
  camY: animState.camY,
  camZ: animState.camZ,
  targetX: animState.targetX,
  targetY: animState.targetY,
  targetZ: animState.targetZ,
}

let gui = null
if (!isProd) {
  gui = new GUI({ title: `Scene Controls — ${props.sceneId}` })

  const rotFolder = gui.addFolder('Model Rotation (deg)')
  rotFolder.add(guiState, 'rotYDeg', -360, 720, 1).name('rotY').onChange((v) => { animState.rotY = v * DEG2RAD })

  const camFolder = gui.addFolder('Camera Position')
  camFolder.add(guiState, 'camX', -10, 10, 0.01).name('x').onChange((v) => { animState.camX = v })
  camFolder.add(guiState, 'camY', -10, 10, 0.01).name('y').onChange((v) => { animState.camY = v })
  camFolder.add(guiState, 'camZ', -10, 20, 0.01).name('z').onChange((v) => { animState.camZ = v })

  const tgtFolder = gui.addFolder('Camera LookAt')
  tgtFolder.add(guiState, 'targetX', -5, 5, 0.01).name('x').onChange((v) => { animState.targetX = v })
  tgtFolder.add(guiState, 'targetY', -5, 5, 0.01).name('y').onChange((v) => { animState.targetY = v })
  tgtFolder.add(guiState, 'targetZ', -5, 5, 0.01).name('z').onChange((v) => { animState.targetZ = v })

  const posFolder = gui.addFolder('Model Translate')
  posFolder.add(animState, 'posX', -5, 5, 0.01).name('x')
}

onBeforeUnmount(() => {
  if (gui) { gui.destroy(); gui = null }
})

let tl = null

// Load GLTF on mount
onMounted(async () => {
  try {
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)

    const gltf = await new Promise((resolve, reject) => {
      loader.load(
        modelPath,
        (result) => resolve(result),
        undefined,
        (err) => reject(err)
      )
    })

    if (gltf && gltf.scene) {
      const rawScene = gltf.scene
      const texturePath = `${rawBase}textures/texture.webp`.replace(/\/+/g, '/')

      const texture = await new Promise((resolve, reject) => {
        new THREE.TextureLoader().load(
          texturePath,
          (tex) => resolve(tex),
          undefined,
          (err) => reject(err)
        )
      })

      texture.colorSpace = THREE.SRGBColorSpace
      texture.flipY = false

      const cloned = rawScene.clone(true)

      // Apply upright rotation offset directly to the loaded mesh root.
      cloned.rotation.x = UPRIGHT_ROTATION_X

      cloned.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            map: texture,
            color: 0xffffff,
            side: THREE.DoubleSide,
            roughness: 0.35,
            metalness: 0.5,
            transparent: true,
            opacity: 1,
            emissive: 0x111111,
          })
        }
      })

      // Normalize Scale & Center
      const boxInitial = new THREE.Box3().setFromObject(cloned)
      const sizeInitial = boxInitial.getSize(new THREE.Vector3())
      const maxDim = Math.max(sizeInitial.x, sizeInitial.y, sizeInitial.z)
      if (maxDim > 0) {
        const scale = 3 / maxDim
        cloned.scale.set(scale, scale, scale)
      }

      const boxFinal = new THREE.Box3().setFromObject(cloned)
      const centerFinal = boxFinal.getCenter(new THREE.Vector3())
      cloned.position.sub(centerFinal)

      const containerGroup = new THREE.Group()
      containerGroup.add(cloned)
      innerGroup = cloned
      loadedScene.value = containerGroup

      dracoLoader.dispose()

      initTimeline()
    }
  } catch (err) {
    console.error('Error during GLTF load:', err)
  }
})

let innerGroup = null

function applyOpacity(o) {
  if (!innerGroup) return
  innerGroup.traverse((child) => {
    if (child.isMesh && child.material) {
      child.material.opacity = o
    }
  })
}

// 2. Linear timeline (ease:'none' keeps scrubbed reverse smooth). Two variants.
function initTimeline() {
  tl = gsap.timeline({ paused: true })

  if (isHero) {
    // ====== HERO SCENE ======
    // One slow 360-degree spin starting immediately on scroll, then hold front-facing.
    // Model stays stationary on the right (no vertical drift, no camera movement).

    // STAGE A (0.00 -> 0.70): single slow 360 spin. Camera & model positions fixed.
    tl.to(animState, {
      rotY: Math.PI * 2.0,  // one full revolution
      posX: 2.0,
      camX: 0,
      camY: 0.5,
      camZ: 3.2,
      targetX: 2.0,
      targetY: 0,
      targetZ: 0,
      opacity: 1,
      clearR: 0.04, clearG: 0.04, clearB: 0.05,
      duration: 0.70,
      ease: 'none'
    })

    // STAGE B (0.70 -> 0.90): hold front-facing. No further rotation.
    .to(animState, {
      rotY: Math.PI * 2.0,  // hold at front
      posX: 2.0,
      camX: 0,
      camY: 0.5,
      camZ: 3.2,
      targetX: 2.0,
      targetY: 0,
      targetZ: 0,
      opacity: 1,
      clearR: 0.04, clearG: 0.04, clearB: 0.05,
      duration: 0.20,
      ease: 'none'
    })

    // STAGE C (0.90 -> 1.00): fade model out + crossfade to white as user enters
    // the white intro section. Camera stays put; only opacity & clear color change.
    .to(animState, {
      opacity: 0,
      clearR: 1.0, clearG: 1.0, clearB: 1.0,
      duration: 0.10,
      ease: 'none'
    })

    return
  }

  // ====== SHOWCASE SCENE (caption zoom sequence) ======
  // Model is at full opacity from frame 1 — no fade-in here. Camera starts angled.

  // STAGE A (0.00 -> 0.08): settle framed front-angled view (model already visible).
  tl.to(animState, {
    rotY: Math.PI * 0.25,
    camX: 0.6,
    camY: 1.3,
    camZ: 6.5,
    targetX: 0,
    targetY: 0,
    targetZ: 0,
    opacity: 1,
    clearR: 0.04, clearG: 0.04, clearB: 0.05,
    duration: 0.08,
    ease: 'none'
  })

  // STAGE C1 (0.08 -> 0.24): Zoom to CLAW (top, left caption).
  .to(animState, {
    camX: -0.35,
    camY: 1.3,
    camZ: 2.4,
    targetX: 0.05,
    targetY: 0.95,
    targetZ: 0,
    opacity: 1,
    clearR: 0.04, clearG: 0.04, clearB: 0.05,
    duration: 0.16,
    ease: 'none'
  })

  // STAGE C2 (0.24 -> 0.40): Zoom to BASE GEAR (bottom, right caption).
  .to(animState, {
    camX: 0.45,
    camY: -0.8,
    camZ: 2.7,
    targetX: 0,
    targetY: -1.15,
    targetZ: 0,
    opacity: 1,
    clearR: 0.04, clearG: 0.04, clearB: 0.05,
    duration: 0.16,
    ease: 'none'
  })

  // STAGE C3 (0.40 -> 0.56): Zoom to MIDDLE GEAR (center rod, left caption).
  .to(animState, {
    camX: -0.25,
    camY: 0.15,
    camZ: 2.6,
    targetX: 0,
    targetY: 0.05,
    targetZ: 0,
    opacity: 1,
    clearR: 0.04, clearG: 0.04, clearB: 0.05,
    duration: 0.16,
    ease: 'none'
  })

  // STAGE D (0.56 -> 0.687): Fade model out + zoom back + crossfade to white.
  // Completes at progress 0.687 = 220/320 (exactly end of the showcase section).
  .to(animState, {
    camX: 0,
    camY: 1.8,
    camZ: 9.5,
    targetX: 0,
    targetY: 0,
    targetZ: 0,
    opacity: 0,
    clearR: 1.0, clearG: 1.0, clearB: 1.0,
    duration: 0.127,
    ease: 'none'
  })

  // STAGE E (0.687 -> 1.00): hold blank white through the outro section.
  .to(animState, {
    opacity: 0,
    clearR: 1.0, clearG: 1.0, clearB: 1.0,
    duration: 0.313,
    ease: 'none'
  })
}

// 3. Smooth damping setup
let targetProgress = 0
let currentProgress = 0
let activeCaption = null

watch(() => props.progress, (newVal) => {
  targetProgress = newVal
})

// 4. Render loop
const { onBeforeRender } = useLoop()

let t = 0

onBeforeRender(() => {
  // Snappy following with anti-lag snap for fast scrubs
  const delta = targetProgress - currentProgress
  if (Math.abs(delta) > 0.3) {
    currentProgress = targetProgress
  } else {
    currentProgress += delta * 0.14
  }

  if (tl) {
    tl.progress(currentProgress)
  }

  // Active-caption bands for the showcase scene (mid-band boundaries avoid flicker).
  let currentCaption = null
  if (!isHero) {
    if (currentProgress >= 0.105 && currentProgress < 0.295) {
      currentCaption = 'claw'
    } else if (currentProgress >= 0.295 && currentProgress < 0.495) {
      currentCaption = 'base'
    } else if (currentProgress >= 0.495 && currentProgress < 0.695) {
      currentCaption = 'middle'
    }
  }

  if (currentCaption !== activeCaption) {
    activeCaption = currentCaption
    emit('caption-change', currentCaption)
  }

  // Apply transforms (only rotY — rotX stays 0 to keep model upright via baked offset)
  const group = modelRef.value?.instance || modelRef.value
  const cam = cameraRef.value?.instance || cameraRef.value

  if (group && group.rotation) {
    group.rotation.y = animState.rotY
    // Intentionally NOT setting rotation.x — upright offset is baked into inner group
    if (group.position) {
      group.position.x = animState.posX
    }
  }

  if (cam) {
    // Idle float around the base camera position. Hero scene: never (fixed stationary
    // hold after spin completes). Showcase scene: only in the opener + outro plateaus.
    let extraY = 0
    let extraTargetY = 0
    if (!isHero && (currentProgress < 0.06 || currentProgress > 0.58)) {
      extraY = Math.sin(t * 0.0009) * 0.04
      extraTargetY = Math.sin(t * 0.0009 + 0.6) * 0.02
    }
    cam.position.set(animState.camX, animState.camY + extraY, animState.camZ)
    cam.lookAt(animState.targetX, animState.targetY + extraTargetY, animState.targetZ)
  }

  // Accent rim light pulse
  const pulse = 0.6 + Math.sin(t * 0.002) * 0.25
  const cyan = cyanLightRef.value?.instance
  const warm = warmLightRef.value?.instance
  if (cyan) cyan.intensity = pulse * 1.1
  if (warm) warm.intensity = (0.6 + Math.cos(t * 0.002) * 0.25) * 0.9

  // Apply material opacity whenever it differs from 1 (hero outro + showcase outro).
  if (animState.opacity !== 1) {
    applyOpacity(animState.opacity)
  }

  // Drive the renderer's clear color from animState so fade-to-white actually appears.
  if (renderer) {
    clearColorObj.setRGB(animState.clearR, animState.clearG, animState.clearB)
    renderer.setClearColor(clearColorObj, 1)
  }

  t += 16
})
</script>
