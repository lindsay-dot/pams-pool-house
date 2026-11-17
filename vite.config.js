import { defineConfig } from 'vite';

// Relative base so the same build works on GitHub Pages and from any folder.
export default defineConfig({ base: './', build: { chunkSizeWarningLimit: 1200 } });
