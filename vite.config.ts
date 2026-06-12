import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

// Custom plugin to copy raw images to dist/src/assets/images to preserve production image links
const copySrcImagesToDist = () => {
  return {
    name: 'copy-src-images-to-dist',
    closeBundle() {
      const srcDir = path.resolve(__dirname, 'src/assets/images');
      const destDir = path.resolve(__dirname, 'dist/src/assets/images');
      
      if (fs.existsSync(srcDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        const files = fs.readdirSync(srcDir);
        for (const file of files) {
          const srcFile = path.join(srcDir, file);
          const destFile = path.join(destDir, file);
          if (fs.statSync(srcFile).isFile()) {
            fs.copyFileSync(srcFile, destFile);
          }
        }
        console.log('Successfully copied src/assets/images to dist/src/assets/images for production parity');
      }
    }
  };
};

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), copySrcImagesToDist()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
