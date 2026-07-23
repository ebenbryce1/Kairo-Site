<!-- components/CubeSceneContent.vue -->
<template>
  <TresPerspectiveCamera ref="cameraRef" :position="[3, 2, 5]" :look-at="[0, 0, 0]" />
  <TresAmbientLight :intensity="1.5" />
  <TresDirectionalLight :position="[5, 5, 5]" :intensity="3" />

  <TresMesh ref="cubeRef" :rotation="[0.4, 0.4, 0]">
    <TresBoxGeometry :args="[1.5, 1.5, 1.5]" />
    <TresMeshStandardMaterial color="#00ffcc" :roughness="0.2" :metalness="0.8" />
  </TresMesh>
</template>

<script setup>
import { shallowRef } from 'vue'
import { useLoop } from '@tresjs/core'

const props = defineProps({
  progress: {
    type: Number,
    default: 0
  }
})

const cubeRef = shallowRef(null)
const cameraRef = shallowRef(null)

const { onBeforeRender } = useLoop()

onBeforeRender(() => {
  // 1. Rotate Cube based on scroll progress
  if (cubeRef.value) {
    const mesh = cubeRef.value.instance || cubeRef.value
    if (mesh && mesh.rotation) {
      mesh.rotation.y = props.progress * Math.PI * 3 + 0.4
      mesh.rotation.x = props.progress * Math.PI * 1.5 + 0.4
    }
  }

  // 2. Zoom Camera closer as scroll progresses
  if (cameraRef.value) {
    const cam = cameraRef.value.instance || cameraRef.value
    if (cam && cam.position) {
      const targetZ = 5 - props.progress * 2.8
      const targetX = 3 - props.progress * 1.8
      const targetY = 2 - props.progress * 1.2

      cam.position.set(targetX, targetY, targetZ)
    }
  }
})
</script>
