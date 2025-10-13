/**
 * Test setup configuration for comprehensive testing
 */
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock performance API
Object.defineProperty(global, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    timing: {
      navigationStart: Date.now() - 1000,
      responseStart: Date.now() - 500,
    },
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000,
    },
  },
});

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => Promise.resolve({ data: [], error: null })),
      delete: vi.fn(() => Promise.resolve({ data: [], error: null })),
      upsert: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({ subscribe: vi.fn() })),
      unsubscribe: vi.fn(),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: null, error: null })),
        download: vi.fn(() => Promise.resolve({ data: null, error: null })),
        remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    },
  })),
}));

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    useLocation: vi.fn(() => ({ pathname: '/', search: '', hash: '', state: null })),
    useParams: vi.fn(() => ({})),
  };
});

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
      language: 'pt',
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Custom matchers for accessibility testing
expect.extend({
  toHaveNoViolations: (received: any) => {
    if (received.violations && received.violations.length === 0) {
      return {
        pass: true,
        message: () => 'Expected accessibility violations, but none were found',
      };
    }
    
    const violations = received.violations || [];
    return {
      pass: false,
      message: () => {
        const violationMessages = violations.map((violation: any) => 
          `${violation.id}: ${violation.description}\n  ${violation.nodes.map((node: any) => node.target).join(', ')}`
        ).join('\n');
        
        return `Expected no accessibility violations, but found:\n${violationMessages}`;
      },
    };
  },
});

// Performance testing utilities
export const measurePerformance = <T>(name: string, fn: () => T): T => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
  return result;
};

export const measureAsyncPerformance = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
  return result;
};

// Memory usage utilities
export const getMemoryUsage = () => {
  if (typeof window !== 'undefined' && (window.performance as any).memory) {
    return (window.performance as any).memory;
  }
  return null;
};

// Accessibility testing utilities
export const axeConfig = {
  rules: {
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'focus-management': { enabled: true },
    'aria-labels': { enabled: true },
  },
};

// Test data factories
export const createMockStudent = (overrides = {}) => ({
  id: 'student-1',
  name: 'João Silva',
  email: 'joao@example.com',
  phone: '(11) 99999-9999',
  qualifications: ['reading', 'demonstration'],
  isActive: true,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockProgram = (overrides = {}) => ({
  id: 'program-1',
  weekDate: new Date().toISOString(),
  title: 'Programa da Semana',
  treasuresSection: {
    reading: 'Gênesis 1:1-10',
    gems: 'Por que a criação é importante?',
  },
  ministrySection: {
    parts: [
      {
        id: 'part-1',
        title: 'Iniciando Conversas',
        type: 'demonstration',
        timeAllotted: 3,
        studyPoint: 'Como iniciar uma conversa sobre a Bíblia',
      },
    ],
  },
  livingSection: {
    parts: [
      {
        id: 'part-2',
        title: 'Vida Cristã',
        type: 'talk',
        timeAllotted: 15,
      },
    ],
  },
  isActive: true,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockAssignment = (overrides = {}) => ({
  id: 'assignment-1',
  programId: 'program-1',
  studentId: 'student-1',
  assistantId: null,
  partType: 'demonstration',
  studyPoint: 'Como iniciar uma conversa sobre a Bíblia',
  weekDate: new Date().toISOString(),
  status: 'pending',
  createdAt: new Date().toISOString(),
  ...overrides,
});