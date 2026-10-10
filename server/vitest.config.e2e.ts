import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    hookTimeout: 60_000,
    testTimeout: 30_000,
    env: {
      QUEUE_PREFIX: 'test',
      ANTHROPIC_API_KEY: '',
      REVALIDATE_SECRET: '',
      RESEND_API_KEY: '',
      GOOGLE_CLIENT_ID: 'test-client.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: 'test-secret',
      API_URL: 'http://localhost:4000',
    },
  },
});
