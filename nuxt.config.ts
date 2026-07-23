export default defineNuxtConfig({
  // 🚀 CRITICAL FIX: Disables server-side pre-rendering so WebGL meshes aren't stripped
  ssr: false, 
  
  compatibilityDate: '2026-07-22',
  modules: [
    '@tresjs/nuxt'
  ],
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