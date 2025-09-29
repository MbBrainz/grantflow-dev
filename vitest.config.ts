import path from 'node:path'
import dotenv from 'dotenv'
import { defineConfig } from 'vitest/config'

dotenv.config()

export default defineConfig({
  esbuild: {
    target: 'node18',
  },
  test: {
    environment: 'node',
    setupFiles: ['./__tests__/setup.ts'],
    globals: true,
    // Timeout for tests that might need more time
    testTimeout: 10000,
    hookTimeout: 10000,
    // Exclude Twilio validation tests by default to avoid overloading the service
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'test/services/twilio-message-validation.test.ts',
    ],
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        'coverage/',
        'dist/',
        'drizzle/',
        'scripts/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './src'),
    },
  },
})
