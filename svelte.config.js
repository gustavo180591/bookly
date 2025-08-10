import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Enable TypeScript
  kit: {
    adapter: adapter({
      out: 'build',
      precompress: false,
      env: {
        port: '3001'
      }
    }),
    // Ensure types are generated
    typescript: {
      config: (config) => {
        return config;
      }
    }
  },
  // Preprocessing
  preprocess: [vitePreprocess()]
};

export default config;
