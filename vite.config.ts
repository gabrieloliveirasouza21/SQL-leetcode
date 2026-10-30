import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  // GitHub Pages serve o site em /SQL-leetcode/, não na raiz.
  base: command === 'build' ? '/SQL-leetcode/' : '/',
  plugins: [react()],
  worker: { format: 'es' },
}));
