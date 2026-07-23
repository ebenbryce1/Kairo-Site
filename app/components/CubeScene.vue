<!-- components/CubeScene.vue -->
<template>
  <ClientOnly>
    <div class="canvas-wrapper">
      <TresCanvas clear-color="#0a0a0a">
        <CubeSceneContent :progress="progress" />
      </TresCanvas>
    </div>
  </ClientOnly>
</template>

<script setup>
import CubeSceneContent from './CubeSceneContent.vue'

defineProps({
  progress: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
.canvas-wrapper {
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
}
</style>