
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-ext-assets',
      closeBundle() {
        // 1. Copy manifest.json to dist
        const manifestSrc = resolve('manifest.json');
        const manifestDest = resolve('dist', 'manifest.json');
        if (fs.existsSync(manifestSrc)) {
          fs.copyFileSync(manifestSrc, manifestDest);
          console.log('Copied manifest.json to dist/');
        }
        
        // 2. Copy metadata.json to dist (if exists)
        const metaSrc = resolve('metadata.json');
        const metaDest = resolve('dist', 'metadata.json');
        if (fs.existsSync(metaSrc)) {
          fs.copyFileSync(metaSrc, metaDest);
        }

        // 3. Copy Icons folder
        const iconsSrc = resolve('icons');
        const iconsDest = resolve('dist', 'icons');
        if (fs.existsSync(iconsSrc)) {
            if (!fs.existsSync(iconsDest)) {
                fs.mkdirSync(iconsDest, { recursive: true });
            }
            fs.readdirSync(iconsSrc).forEach(file => {
                // simple file copy, non-recursive for icons root
                fs.copyFileSync(resolve(iconsSrc, file), resolve(iconsDest, file));
            });
            console.log('Copied icons/ to dist/icons/');
        }
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve('popup.html'),
        panel: resolve('panel.html'),
        devtools: resolve('devtools.html'),
        background: resolve('background.ts') 
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  }
});
