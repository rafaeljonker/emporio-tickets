import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// `server-only` throws outside the react-server condition; tests import server modules directly.
const serverOnlyStub = fileURLToPath(new URL('./src/test-support/empty-module.ts', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true, alias: { 'server-only': serverOnlyStub } },
  test: {
    passWithNoTests: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: { name: 'jsdom', environment: 'jsdom', include: ['src/**/*.test.tsx'], setupFiles: ['./src/test-support/setup-dom.ts'] },
      },
    ],
  },
});
