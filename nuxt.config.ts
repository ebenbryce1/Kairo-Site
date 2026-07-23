// nuxt.config.ts
export default defineNuxtConfig({
  ssr: false,

  compatibilityDate: '2026-07-22',
  modules: [
    '@tresjs/nuxt'
  ],
  
  app: {
    baseURL: '/Kairo-Site/',
    buildAssetsDir: '/_nuxt/'
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