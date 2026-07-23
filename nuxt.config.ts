export default defineNuxtConfig({
  ssr: false, // cite: 1
  
  compatibilityDate: '2026-07-22', // cite: 1
  modules: [
    '@tresjs/nuxt' // cite: 1
  ],
  tres: {
    devtools: false // Remove glsl: true unless actively writing GLSL shaders
  },
  app: {
    baseURL: '/Kairo-Site/' // cite: 1
  },
  nitro: {
    preset: 'github-pages' // cite: 1
  },
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