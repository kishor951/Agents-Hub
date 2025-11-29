import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(), 
    wasm(),
    nodePolyfills({
      // Enable polyfills for process, buffer, util, etc.
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // Python backend on port 8000
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      // Node polyfills are handled by @vitejs/plugin-node-polyfills
      // Keep these for explicit imports if needed
      crypto: 'crypto-browserify',
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['@emurgo/cardano-serialization-lib-browser'],
    include: ['process', 'buffer', 'util', 'events'],
    esbuildOptions: {
      target: 'esnext',
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    target: 'esnext',
  },
  worker: {
    format: 'es',
  },
  // WebAssembly support for CIP-68 generator
  assetsInclude: ['**/*.wasm'],
})
