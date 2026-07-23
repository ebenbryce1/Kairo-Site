<!-- components/CubeScene.vue -->
<template>
  <!-- The Canvas sets up the context provider first -->
  <TresCanvas window-size clear-color="#0a0a0a">
    <!-- Updated tag to match lowercase file auto-import resolution -->
    <cubescenecontent :progress="progress" />
  </TresCanvas>
</template>

<script setup>
defineProps({
  progress: {
    type: Number,
    default: 0
  }
})
</script>
