<!-- app/components/CubeSceneContent.vue -->
<template>
  <TresGroup ref="rootRef">
    <TresPerspectiveCamera ref="cameraRef" :position="[0, 2, 8]" :look-at="[0, 0, 0]" />

    <TresAmbientLight :intensity="0.4" />
    <TresDirectionalLight :position="[10, 10, 10]" :intensity="1.2" />
    <TresHemisphereLight :intensity="0.3" />

    <!-- Render scene root once ready -->
    <TresGroup v-if="loadedScene" ref="modelRef">
      <primitive :object="loadedScene" />
    </TresGroup>
  </TresGroup>
</template>

<script setup>
import { shallowRef, onMounted } from 'vue'
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

const props = defineProps({
  progress: {
    type: Number,
    default: 0
  }
})

const modelRef = shallowRef(null)
const cameraRef = shallowRef(null)
const loadedScene = shallowRef(null)

const rawBase = '/Kairo-Site/'
const modelPath = `${rawBase}models/robot.glb`.replace(/\/+/g, '/')

// Load the GLTF after mount so setup stays synchronous (no Suspense needed)
onMounted(async () => {
  console.log('🔄 [CubeSceneContent] onMounted — starting GLTF load for:', modelPath)

  try {
    // Use a raw GLTFLoader with a DRACOLoader — the model is Draco-compressed
    // and useGLTF's draco option isn't providing a DRACOLoader instance.
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')

    const loader = new GLTFLoader()
    loader.setDRACOLoader(dracoLoader)

    const gltf = await new Promise((resolve, reject) => {
      loader.load(
        modelPath,
        (result) => resolve(result),
        (progress) => {
          if (progress.total > 0) {
            console.log(`⬇️ Loading: ${Math.round((progress.loaded / progress.total) * 100)}%`)
          }
        },
        (err) => reject(err)
      )
    })

    console.log('📦 [CubeSceneContent] GLTFLoader returned:', gltf)

    if (gltf && gltf.scene) {
      const rawScene = gltf.scene
      console.log('📦 [CubeSceneContent] rawScene resolved:', rawScene)

      // Load the texture to apply to the model
      const texturePath = `${rawBase}textures/texture.webp`.replace(/\/+/g, '/')
      console.log('🖼️ [CubeSceneContent] Loading texture:', texturePath)

      const texture = await new Promise((resolve, reject) => {
        new THREE.TextureLoader().load(
          texturePath,
          (tex) => resolve(tex),
          undefined,
          (err) => reject(err)
        )
      })

      // Configure texture for proper color rendering
      texture.colorSpace = THREE.SRGBColorSpace
      texture.flipY = false

      console.log('✅ [CubeSceneContent] Texture loaded:', texture)

      const cloned = rawScene.clone(true)
      let meshCount = 0

      // Standardize material and apply the texture
      cloned.traverse((child) => {
        if (child.isMesh) {
          meshCount++
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

      console.log(`✅ Total Meshes Found in GLB: ${meshCount}`)

      // Scale first
      const boxInitial = new THREE.Box3().setFromObject(cloned)
      const sizeInitial = boxInitial.getSize(new THREE.Vector3())
      console.log('Raw Model Size:', sizeInitial)

      const maxDim = Math.max(sizeInitial.x, sizeInitial.y, sizeInitial.z)
      if (maxDim > 0) {
        const scale = 3 / maxDim
        cloned.scale.set(scale, scale, scale)
      }

      // Center second
      const boxFinal = new THREE.Box3().setFromObject(cloned)
      const centerFinal = boxFinal.getCenter(new THREE.Vector3())
      cloned.position.sub(centerFinal)

      const containerGroup = new THREE.Group()
      containerGroup.add(cloned)
      loadedScene.value = containerGroup

      console.log('✅ [CubeSceneContent] loadedScene set:', loadedScene.value)

      // Clean up the Draco loader
      dracoLoader.dispose()
    } else {
      console.warn('⚠️ [CubeSceneContent] GLTF loaded but has no scene')
    }
  } catch (err) {
    console.error('❌ [CubeSceneContent] Error during GLTF load:', err)
  }
})

// Render Loop Animation
const { onBeforeRender } = useLoop()

onBeforeRender(() => {
  const p = typeof props.progress === 'number' && !isNaN(props.progress) ? props.progress : 0

  if (modelRef.value) {
    const group = modelRef.value.instance || modelRef.value
    if (group && group.rotation) {
      group.rotation.y = p * Math.PI * 3 + 0.4
      group.rotation.x = p * Math.PI * 1.5 + 0.4
    }
  }

  if (cameraRef.value) {
    const cam = cameraRef.value.instance || cameraRef.value
    if (cam && cam.position) {
      cam.position.set(0, 2, 8 - p * 4.5)
    }
  }
})
</script>