import { defineConfig } from 'vite';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { aiGateway } from './server/aiGateway.ts';

export default defineConfig(({ mode }) => ({
  base: loadEnv(mode, '.', '').VITE_BASE_PATH || '/',
  plugins: [react(), aiGateway()],
}));
