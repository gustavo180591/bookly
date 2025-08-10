import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true
  },
  plugins: [
    tailwindcss(),
    sveltekit(),
    nodePolyfills({
      protocolImports: true,
      include: [
        'buffer',
        'stream',
        'util',
        'url',
        'path',
        'os',
        'net',
        'tls',
        'fs',
        'child_process',
        'crypto',
        'http',
        'https',
        'zlib',
        'querystring',
        'process'
      ]
    })
  ],
  ssr: {
    // Bundle all dependencies with the server build
    noExternal: true
  },
  define: {
    // Ensure process.env is available
    'process.env': {},
    // Polyfill global object
    global: 'globalThis'
  },
  resolve: {
    alias: {
      // Fix for Node.js built-ins
      'node:buffer': 'buffer',
      'node:stream': 'stream-browserify',
      'node:util': 'util',
      'node:url': 'url',
      'node:path': 'path-browserify',
      'node:os': 'os-browserify/browser',
      'node:net': 'net-browserify',
      'node:tls': 'tls-browserify',
      'node:fs': 'browserify-fs',
      'node:child_process': 'child_process',
      'node:crypto': 'crypto-browserify',
      'node:http': 'stream-http',
      'node:https': 'https-browserify',
      'node:zlib': 'browserify-zlib',
      // Nodemailer specific aliases
      'nodemailer/lib/mailer': 'nodemailer/lib/mailer/index.js',
      'nodemailer/lib/smtp-transport': 'nodemailer/lib/smtp-transport/index.js',
      'nodemailer/lib/smtp-connection': 'nodemailer/lib/smtp-connection/index.js',
      // Add any other problematic modules here
    }
  },
  build: {
    // Ensure all dependencies are bundled
    rollupOptions: {
      external: [
        // Mark Node.js modules as external
        'nodemailer',
        'nodemailer/lib/mailer',
        'nodemailer/lib/smtp-transport',
        'nodemailer/lib/smtp-connection',
        // Prisma client
        '@prisma/client',
        '.prisma/client',
        '.prisma/client/default',
        // Node.js built-ins
        'node:buffer',
        'node:stream',
        'node:util',
        'node:url',
        'node:path',
        'node:os',
        'node:net',
        'node:tls',
        'node:fs',
        'node:child_process',
        'node:crypto',
        'node:http',
        'node:https',
        'node:zlib'
      ],
      output: {
        // Ensure proper handling of dynamic imports
        manualChunks: undefined,
        // Handle external modules
        globals: {
          'nodemailer': 'nodemailer',
          'nodemailer/lib/mailer': 'nodemailer/lib/mailer',
          'nodemailer/lib/smtp-transport': 'nodemailer/lib/smtp-transport',
          'nodemailer/lib/smtp-connection': 'nodemailer/lib/smtp-connection',
          '@prisma/client': '@prisma/client',
          '.prisma/client': '.prisma/client',
          '.prisma/client/default': '.prisma/client/default'
        }
      }
    },
    // Enable CommonJS module transformation
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
      // Explicitly mark problematic modules as external
      exclude: []
    },
    // Ensure proper module resolution
    target: 'es2020',
    // Enable source maps for debugging
    sourcemap: true
  },
  // Ensure proper module resolution
  optimizeDeps: {
    include: [
      'nodemailer',
      '@prisma/client',
      'crypto-browserify',
      'stream-browserify',
      'util',
      'buffer',
      'stream',
      'url',
      'path',
      'os',
      'net',
      'tls',
      'fs',
      'http',
      'https',
      'zlib',
      'querystring',
      'process'
    ],
    // Force dependency optimization
    force: true
  }
});
