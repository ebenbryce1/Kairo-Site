<!-- components/CubeScene.vue -->
<template>
  <!-- The Canvas sets up the context provider first -->
  <TresCanvas window-size clear-color="#0a0a0a">
    <!-- The actual scene content runs as a child, solving the context error -->
    <CubeSceneContent :progress="progress" />
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
