import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    emptyOutDir: false,
    publicDir: false,
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.js'),
      name: 'ProofFlowEmbed',
      fileName: () => 'embed.js',
      formats: ['iife'],
    },
    outDir: resolve(import.meta.dirname, '../dist'),
  },
})
