export default defineNuxtConfig({
  compatibilityDate: '2026-07-22',
  modules: [
    '@tresjs/nuxt'
  ],
  // Add the lines below:
  app: {
    baseURL: '/Kairo-Site/' 
  },
  nitro: {
    preset: 'github-pages'
  }
})
