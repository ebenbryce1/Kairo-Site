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

// Safe to call here because this component is rendered inside <TresCanvas>
const { onBeforeRender } = useLoop()

onBeforeRender(() => {
  const p = typeof props.progress === 'number' && !isNaN(props.progress) ? props.progress : 0

  if (cubeRef.value) {
    const mesh = cubeRef.value.instance || cubeRef.value
    if (mesh && mesh.rotation) {
      mesh.rotation.y = p * Math.PI * 3 + 0.4
      mesh.rotation.x = p * Math.PI * 1.5 + 0.4
    }
  }

  if (cameraRef.value) {
    const cam = cameraRef.value.instance || cameraRef.value
    if (cam && cam.position) {
      cam.position.set(3 - p * 1.8, 2 - p * 1.2, 5 - p * 2.8)
    }
  }
})
</script>