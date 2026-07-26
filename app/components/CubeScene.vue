<!-- components/CubeScene.vue -->
<template>
  <ClientOnly>
    <div class="canvas-wrapper">
      <TresCanvas window-size clear-color="#0a0a0a">
        <CubeSceneContent
          :progress="progress"
          :scene-id="sceneId"
          @caption-change="(name) => $emit('caption-change', name)"
        />
      </TresCanvas>
    </div>
  </ClientOnly>
</template>

<script setup>
defineProps({
  progress: {
    type: Number,
    default: 0
  },
  sceneId: {
    type: String,
    default: 'hero'
  }
})

defineEmits(['caption-change'])
</script>

<style scoped>
.canvas-wrapper {
  /* inset: 0 uses the viewport MINUS the scrollbar; 100vw/100vh include the
     scrollbar and cause a horizontal scrollbar to appear. /
  position: absolute;
  inset: 0;
  / Crucial for mobile: passes touch gestures straight through to the scroll container */
  pointer-events: none;
}
</style>