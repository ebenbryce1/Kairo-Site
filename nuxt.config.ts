// nuxt.config.ts
export default defineNuxtConfig({
  ssr: false,

  compatibilityDate: '2026-07-22',
  modules: [
    '@tresjs/nuxt'
  ],
  
  app: {
    baseURL: '/Kairo-Site/',
    buildAssetsDir: '/_nuxt/',
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap'
        }
      ]
    }
  },

  nitro: {
    preset: 'github-pages'
  },

  vite: {
    base: '/Kairo-Site/',
    assetsInclude: ['**/*.glb', '**/*.gltf'], // Tells Vite to handle 3D models properly
    resolve: {
      dedupe: ['vue', 'three']
    }
  }
})