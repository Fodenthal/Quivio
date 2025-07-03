import '@testing-library/jest-dom'
import { beforeAll, afterAll } from 'vitest'

// Global test setup
// You can add global mocks, setup functions, etc. here

// Mock console.warn for cleaner test output
const originalWarn = console.warn
beforeAll(() => {
  console.warn = (...args: unknown[]) => {
    // Suppress React 19 warnings during tests
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) {
      return
    }
    originalWarn(...args)
  }
})

afterAll(() => {
  console.warn = originalWarn
}) 