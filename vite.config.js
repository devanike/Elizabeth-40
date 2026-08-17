import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2019',   
    assetsInlineLimit: 2048,
    cssCodeSplit: false,       
  },
});
