import { beforeAll, vi } from 'vitest'

beforeAll(() => {
  console.log('Setting up tests')

  vi.mock('../src/lib/logger', () => ({
    default: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
  }))
})
