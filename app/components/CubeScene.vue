<!-- components/CubeScene.vue -->
<template>
  <!-- 1. The Canvas container (ClientOnly handled by app.vue wrapper) -->
  <TresCanvas window-size clear-color="#0a0a0a">
    
    <!-- 2. Pure ThreeJS Scene Elements -->
    <TresPerspectiveCamera ref="cameraRef" :position="[3, 2, 5]" :look-at="[0, 0, 0]" />
    <TresAmbientLight :intensity="1.5" />
    <TresDirectionalLight :position="[5, 5, 5]" :intensity="3" />

    <TresMesh ref="cubeRef" :rotation="[0.4, 0.4, 0]">
      <TresBoxGeometry :args="[1.5, 1.5, 1.5]" />
      <TresMeshStandardMaterial color="#00ffcc" :roughness="0.2" :metalness="0.8" />
    </TresMesh>

    <!-- 3. An inline sub-component containing the useLoop hook -->
    <RenderLoopDriver :progress="progress" @update:scene="handleSceneUpdates" />

  </TresCanvas>
</template>

<script setup>
import { shallowRef, defineComponent, h } from 'vue'
import { useLoop } from '@tresjs/core'

const props = defineProps({
  progress: {
    type: Number,
    default: 0
  }
})

const cubeRef = shallowRef(null)
const cameraRef = shallowRef(null)

// Safe engine runtime update logic
const handleSceneUpdates = ({ cube, camera, currentProgress }) => {
  if (cube) {
    const mesh = cube.instance || cube
    if (mesh && mesh.rotation) {
      mesh.rotation.y = currentProgress * Math.PI * 3 + 0.4
      mesh.rotation.x = currentProgress * Math.PI * 1.5 + 0.4
    }
  }

  if (camera) {
    const cam = camera.instance || camera
    if (cam && cam.position) {
      const targetZ = 5 - currentProgress * 2.8
      const targetX = 3 - currentProgress * 1.8
      const targetY = 2 - currentProgress * 1.2
      cam.position.set(targetX, targetY, targetZ)
    }
  }
}

// Child loop engine component defined inline to avoid file linking issues on GitHub
const RenderLoopDriver = defineComponent({
  props: { progress: Number },
  emits: ['update:scene'],
  setup(inlineProps, { emit }) {
    const { onBeforeRender } = useLoop()
    
    onBeforeRender(() => {
      emit('update:scene', {
        cube: cubeRef.value,
        camera: cameraRef.value,
        currentProgress: inlineProps.progress
      })
    })
    return () => null // Visuals are handled by parent template mesh elements
  }
})
</script>
