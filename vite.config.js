import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        // Split the heavy 3D + animation libs into their own chunks so the
        // initial hero paint isn't blocked by the whole Three.js runtime.
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber'],
          gsap: ['gsap'],
        },
      },
    },
  },
})
