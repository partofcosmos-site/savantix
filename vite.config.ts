import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    define: {
      '__GEMINI_API_KEY__': JSON.stringify(env.GEMINI_API_KEY),
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'vendor-charts': ['recharts'],
            'vendor-math': ['katex', 'marked', 'react-markdown'],
            'vendor-icons': ['lucide-react']
          }
        }
      }
    }
  };
});
