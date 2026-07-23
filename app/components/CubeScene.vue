<!-- components/CubeScene.vue -->
<template>
  <ClientOnly>
    <!-- FIX 1: Wrap TresCanvas in a div with explicit dimensions -->
    <div class="canvas-wrapper">
      <TresCanvas clear-color="#0a0a0a">
        <TresPerspectiveCamera ref="cameraRef" :position="[3, 2, 5]" :look-at="[0, 0, 0]" />
        <TresAmbientLight :intensity="1.5" />
        <TresDirectionalLight :position="[5, 5, 5]" :intensity="3" />

        <TresMesh ref="cubeRef" :rotation="[0.4, 0.4, 0]">
          <TresBoxGeometry :args="[1.5, 1.5, 1.5]" />
          <TresMeshStandardMaterial color="#00ffcc" :roughness="0.2" :metalness="0.8" />
        </TresMesh>

        <RenderLoopDriver :progress="progress" @update:scene="handleSceneUpdates" />
      </TresCanvas>
    </div>
  </ClientOnly>
</template>

<script setup>
import { shallowRef, defineComponent } from 'vue' // cite: 3
import { useLoop } from '@tresjs/core' // cite: 3

const props = defineProps({
  progress: {
    type: Number,
    default: 0
  }
}) // cite: 3

const cubeRef = shallowRef(null) // cite: 3
const cameraRef = shallowRef(null) // cite: 3

const handleSceneUpdates = ({ cube, camera, currentProgress }) => {
  const progress = typeof currentProgress === 'number' && !isNaN(currentProgress) ? currentProgress : 0 // cite: 3

  if (cube) { // cite: 3
    const mesh = cube.instance || cube // cite: 3
    if (mesh && mesh.rotation) { // cite: 3
      mesh.rotation.y = progress * Math.PI * 3 + 0.4 // cite: 3
      mesh.rotation.x = progress * Math.PI * 1.5 + 0.4 // cite: 3
    }
  }

  if (camera) { // cite: 3
    const cam = camera.instance || camera // cite: 3
    if (cam && cam.position) { // cite: 3
      const targetZ = 5 - progress * 2.8 // cite: 3
      const targetX = 3 - progress * 1.8 // cite: 3
      const targetY = 2 - progress * 1.2 // cite: 3
      cam.position.set(targetX, targetY, targetZ) // cite: 3
    }
  }
}

const RenderLoopDriver = defineComponent({
  props: { progress: Number }, // cite: 3
  emits: ['update:scene'], // cite: 3
  setup(inlineProps, { emit }) { // cite: 3
    const { onBeforeRender } = useLoop() // cite: 3
    
    onBeforeRender(() => { // cite: 3
      emit('update:scene', { // cite: 3
        cube: cubeRef.value, // cite: 3
        camera: cameraRef.value, // cite: 3
        currentProgress: inlineProps.progress // cite: 3
      })
    })
    return () => null // cite: 3
  }
})
</script>

<!-- FIX 1 STYLES: Add this section at the bottom of CubeScene.vue -->
<style scoped>
.canvas-wrapper {
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
}
</style>