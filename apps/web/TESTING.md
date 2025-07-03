# Client-Side Testing Setup

## ✅ **Setup Complete!**

Your client-side testing infrastructure is now fully configured and working.

## 🧪 **What's Available**

### **Testing Stack**
- **Vitest** - Fast unit test runner
- **@testing-library/react** - React component testing utilities
- **@testing-library/jest-dom** - Additional matchers for DOM testing
- **jsdom** - DOM environment for tests
- **TypeScript** - Full type safety in tests

### **Available Commands**
```bash
# Run tests once
pnpm test

# Run tests in watch mode (auto-rerun on changes)
pnpm test:watch

# Run tests with UI (browser-based test interface)
pnpm test:ui
```

## 📁 **Project Structure**

```
apps/web/src/
├── test/
│   ├── setup.ts                    # Global test configuration
│   └── components/
│       └── page.test.tsx           # Example component test
├── app/
│   └── page.tsx                    # Component being tested
└── vitest.config.ts                # Vitest configuration
```

## 🎯 **Test Examples**

### **Component Testing**
```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})
```

### **Shared Package Integration**
```typescript
import { MSG } from '@shared'

it('should use shared constants', () => {
  expect(MSG.CHAT).toBe('chat')
})
```

## 🚀 **Next Steps**

As you build components, add tests alongside them:

1. **Create component** → `src/components/GameLobby.tsx`
2. **Add test** → `src/test/components/GameLobby.test.tsx`
3. **Run tests** → `pnpm test:watch`

## 🔧 **Configuration Details**

- **Global functions**: `describe`, `it`, `expect` available without imports
- **Path aliases**: `@/` for src, `@shared` for shared package
- **React support**: Full JSX/TSX support with React Testing Library
- **DOM matchers**: `.toBeInTheDocument()`, `.toHaveClass()`, etc.

---

**Your TDD flow is now ready to go! 🎮** 