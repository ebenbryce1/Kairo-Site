// nuxt.config.ts
export default defineNuxtConfig({
  ssr: false,

  compatibilityDate: '2026-07-22', // cite: 1
  modules: [
    '@tresjs/nuxt' // cite: 1
  ],
  tres: {
    glsl: true, // cite: 1
    devtools: false // cite: 1
  },
  app: {
    baseURL: '/Kairo-Site/' // cite: 1
  },
  nitro: {
    preset: 'github-pages' // cite: 1
  },
  
  // FIX: Force Nuxt/Vite to inline and process Three.js and TresJS for client builds
  build: {
    transpile: ['three', '@tresjs/core', '@tresjs/nuxt']
  },
  vite: {
    base: '/Kairo-Site/', // cite: 1
    resolve: {
      dedupe: ['vue', 'three'] // cite: 1
    },
    optimizeDeps: {
      include: ['three', '@tresjs/core']
    }
  }
})