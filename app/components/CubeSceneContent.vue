<!-- app/components/CubeSceneContent.vue -->
<template>
  <TresGroup ref="rootRef">
    <!-- Camera without reactive template props so render loop has 100% smooth control -->
    <TresPerspectiveCamera ref="cameraRef" />

    <TresAmbientLight :intensity="0.6" />
    <TresDirectionalLight :position="[10, 10, 10]" :intensity="1.5" />
    <TresHemisphereLight :intensity="0.4" />

    <!-- Render scene root once ready -->
    <TresGroup v-if="loadedScene" ref="modelRef">
      <primitive :object="loadedScene" />
    </TresGroup>
  </TresGroup>
</template>

<script setup>
import { shallowRef, onMounted, onBeforeUnmount, watch } from 'vue'
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { gsap } from 'gsap'

const DEG2RAD = Math.PI / 180
const UPRIGHT_ROTATION_X = 286.4788 * DEG2RAD // Upright model base offset
const isProd = import.meta.env.PROD

const props = defineProps({
  progress: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['caption-change'])

const modelRef = shallowRef(null)
const cameraRef = shallowRef(null)
const loadedScene = shallowRef(null)

const rawBase = '/Kairo-Site/'
const modelPath = `${rawBase}models/robot.glb`.replace(/\/+/g, '/')

// 1. Reactive State Object (Model stays upright, rotX stays 0)
const animState = {
  rotX: 0,
  rotY: 0,
  camX: 0,
  camY: 1.2,
  camZ: 3.0,
  targetX: 0,
  targetY: 0.5,
  targetZ: 0,
}

// GUI State
const guiState = {
  rotXDeg: animState.rotX / DEG2RAD,
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
  gui = new GUI({ title: 'Scene Controls' })

  const rotFolder = gui.addFolder('Model Rotation (deg)')
  rotFolder.add(guiState, 'rotXDeg', -180, 180, 1).name('rotX').onChange((v) => { animState.rotX = v * DEG2RAD })
  rotFolder.add(guiState, 'rotYDeg', -360, 360, 1).name('rotY').onChange((v) => { animState.rotY = v * DEG2RAD })

  const camFolder = gui.addFolder('Camera Position')
  camFolder.add(guiState, 'camX', -10, 10, 0.01).name('x').onChange((v) => { animState.camX = v })
  camFolder.add(guiState, 'camY', -10, 10, 0.01).name('y').onChange((v) => { animState.camY = v })
  camFolder.add(guiState, 'camZ', -10, 20, 0.01).name('z').onChange((v) => { animState.camZ = v })

  const tgtFolder = gui.addFolder('Camera LookAt Target')
  tgtFolder.add(guiState, 'targetX', -5, 5, 0.01).name('x').onChange((v) => { animState.targetX = v })
  tgtFolder.add(guiState, 'targetY', -5, 5, 0.01).name('y').onChange((v) => { animState.targetY = v })
  tgtFolder.add(guiState, 'targetZ', -5, 5, 0.01).name('z').onChange((v) => { animState.targetZ = v })
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

      // Apply upright rotation offset directly to loaded mesh root
      cloned.rotation.x = UPRIGHT_ROTATION_X

      cloned.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            map: texture,
            color: 0xffffff,
            side: THREE.DoubleSide,
            roughness: 0.4,
            metalness: 0.2,
            transparent: false,
            opacity: 1
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
      loadedScene.value = containerGroup

      dracoLoader.dispose()

      // Initialize master GSAP timeline
      initTimeline()
    }
  } catch (err) {
    console.error('❌ Error during GLTF load:', err)
  }
})

// 2. Linear Timeline Setup (ease: 'none' prevents acceleration jerks when scrubbed)
function initTimeline() {
  tl = gsap.timeline({ paused: true })

  // STAGE 0 -> STAGE 1 (0.00 -> 0.15): Zoom Out + Smooth 360 Spin to Front View
  tl.to(animState, {
    rotY: Math.PI * 2.0,
    camX: 0,
    camY: 1.5,
    camZ: 7.5,
    targetX: 0,
    targetY: 0,
    targetZ: 0,
    duration: 0.15,
    ease: 'none'
  })

  // STAGE 2 (0.15 -> 0.25): White Section 1 Hold
  .to(animState, {
    camZ: 7.8,
    duration: 0.10,
    ease: 'none'
  })

  // STAGE 3 (0.25 -> 0.35): Black Section - Angled Front View
  .to(animState, {
    rotY: Math.PI * 2.25,
    camX: 0.5,
    camY: 1.2,
    camZ: 6.5,
    targetY: 0,
    duration: 0.10,
    ease: 'none'
  })

  // STAGE 4 (0.35 -> 0.45): Rotate Smoothly to Front View
  .to(animState, {
    rotY: Math.PI * 2.5,
    camX: 0,
    camY: 1.5,
    camZ: 7.5,
    targetY: 0,
    duration: 0.10,
    ease: 'none'
  })

  // STAGE 5 (0.45 -> 0.55): Zoom to Claw
  .to(animState, {
    camX: -0.3,
    camY: 1.2,
    camZ: 2.5,
    targetY: 0.9,
    duration: 0.10,
    ease: 'none'
  })

  // STAGE 6 (0.55 -> 0.62): Zoom Out
  .to(animState, {
    camX: 0,
    camY: 1.5,
    camZ: 7.5,
    targetY: 0,
    duration: 0.07,
    ease: 'none'
  })

  // STAGE 7 (0.62 -> 0.72): Zoom to Base
  .to(animState, {
    camX: 0.4,
    camY: -0.8,
    camZ: 2.8,
    targetY: -1.1,
    duration: 0.10,
    ease: 'none'
  })

  // STAGE 8 (0.72 -> 0.78): Zoom Out
  .to(animState, {
    camX: 0,
    camY: 1.5,
    camZ: 7.5,
    targetY: 0,
    duration: 0.06,
    ease: 'none'
  })

  // STAGE 9 (0.78 -> 0.88): Zoom to Middle Joint / Gear
  .to(animState, {
    camX: 0,
    camY: 0.1,
    camZ: 3.2,
    targetY: 0,
    duration: 0.10,
    ease: 'none'
  })

  // STAGE 10 (0.88 -> 1.00): Final Zoom Out
  .to(animState, {
    camX: 0,
    camY: 1.8,
    camZ: 8.5,
    targetY: 0,
    duration: 0.12,
    ease: 'none'
  })
}

// 3. Smooth Damping (Lerp) Setup
let targetProgress = 0
let currentProgress = 0
let activeCaption = null

watch(() => props.progress, (newVal) => {
  targetProgress = newVal
})

// 4. Render Loop: Smooth Lerp & Apply to Three.js objects
const { onBeforeRender } = useLoop()

onBeforeRender(() => {
  // Smoothly interpolate currentProgress towards targetProgress (0.08 = silky smooth damping)
  currentProgress += (targetProgress - currentProgress) * 0.08

  if (tl) {
    tl.progress(currentProgress)
  }

  // Update active captions based on smooth rendered progress
  let currentCaption = null
  if (currentProgress >= 0.25 && currentProgress < 0.35) {
    currentCaption = 'angled'
  } else if (currentProgress >= 0.45 && currentProgress < 0.55) {
    currentCaption = 'claw'
  } else if (currentProgress >= 0.62 && currentProgress < 0.72) {
    currentCaption = 'base'
  } else if (currentProgress >= 0.78 && currentProgress < 0.88) {
    currentCaption = 'middle'
  }

  if (currentCaption !== activeCaption) {
    activeCaption = currentCaption
    emit('caption-change', currentCaption)
  }

  // Update ThreeJS scene
  const group = modelRef.value?.instance || modelRef.value
  const cam = cameraRef.value?.instance || cameraRef.value

  if (group && group.rotation) {
    group.rotation.x = animState.rotX
    group.rotation.y = animState.rotY
  }

  if (cam) {
    cam.position.set(animState.camX, animState.camY, animState.camZ)
    cam.lookAt(animState.targetX, animState.targetY, animState.targetZ)
  }
})
</script>