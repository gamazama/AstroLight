import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkg from './package.json' with { type: 'json' };

export default defineConfig(({ mode }) => {
    return {
      base: mode === 'production' ? '/AstroLight/' : '/',
      define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
