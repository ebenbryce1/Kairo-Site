export default defineNuxtConfig({
  compatibilityDate: '2026-07-22',
  modules: [
    '@tresjs/nuxt'
  ],
  // ADD THIS SCRIPT LOADING LAYER BELOW:
  tres: {
    glsl: true,
    devtools: false
  },
  app: {
    baseURL: '/Kairo-Site/' 
  },
  nitro: {
    preset: 'github-pages'
  },
  vite: {
    base: '/Kairo-Site/',
    resolve: {
      dedupe: ['vue', 'three']
    }
  }
})