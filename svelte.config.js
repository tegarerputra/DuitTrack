import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: true
    }),

    // Path configuration for Netlify deployment
    paths: {
      base: process.env.NODE_ENV === 'production' ? '' : '',
    },

    // Prerendering configuration for better SEO
    prerender: {
      handleHttpError: 'warn',
      handleMissingId: 'warn',
      entries: [
        '/',
        '/dashboard',
        '/budget',
        '/expenses',
        '/analytics'
      ]
    },

    // Security configuration for fintech app
    csp: {
      mode: 'auto',
      directives: {
        'script-src': ['self', 'unsafe-inline', 'https://www.gstatic.com', 'https://apis.google.com'],
        'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
        'font-src': ['self', 'https://fonts.gstatic.com'],
        'connect-src': ['self', 'https://*.firebaseapp.com', 'https://*.googleapis.com'],
        'img-src': ['self', 'data:', 'https:'],
      }
    },

    // Service worker configuration
    serviceWorker: {
      register: true,
      files: (filepath) => !/\.DS_Store/.test(filepath)
    },

    // Alias configuration matching vite.config.js
    alias: {
      '$components': 'src/lib/components',
      '$stores': 'src/lib/stores',
      '$utils': 'src/lib/utils',
      '$types': 'src/lib/types',
      '$config': 'src/lib/config'
    }
  },

  // Svelte compiler options
  compilerOptions: {
    dev: process.env.NODE_ENV !== 'production',
    hydratable: true,
    legacy: false
  },

  // Vite plugin options
  vitePlugin: {
    inspector: {
      holdMode: true,
      showToggleButton: 'always',
      toggleButtonPos: 'bottom-right'
    }
  }
};

export default config;