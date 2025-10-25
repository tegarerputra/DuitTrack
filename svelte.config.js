import adapter from '@sveltejs/adapter-netlify';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      edge: false,
      split: false
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