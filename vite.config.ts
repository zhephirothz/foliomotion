import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { aiGateway } from './server/aiGateway.ts';

export default defineConfig({ plugins: [react(), aiGateway()] });
