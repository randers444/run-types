import {resolve} from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'


const LIBRARY_NAME = 'run-types'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/main.ts'),
      name: LIBRARY_NAME,
      fileName: (format) => `${LIBRARY_NAME}.${format}.js`
    }
  },
  plugins: [dts()]
});