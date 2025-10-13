/**
 * Enhanced React Query configuration with optimized caching strategies
 */
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

// Cache configuration for different data types
const cacheConfig = {
  // Static data that rarely changes
  static: {
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  },
  // Dynamic data that changes frequently
  dynamic: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  },
  // Real-time data
  realtime: {
    staleTime: 0, // Always stale
    gcTime: 1000 * 60 * 5, // 5 minutes
  },
  // User-specific data
  user: {
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  },
};

// Query key factories for consistent caching
export const queryKeys = {
  // Students
  students: {
    all: ['students'] as const,
    lists: () => [...queryKeys.students.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.students.lists(), { filters }] as const,
    details: () => [...queryKeys.students.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.students.details(), id] as const,
  },
  
  // Programs
  programs: {
    all: ['programs'] as const,
    lists: () => [...queryKeys.programs.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.programs.lists(), { filters }] as const,
    details: () => [...queryKeys.programs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.programs.details(), id] as const,
    active: () => [...queryKeys.programs.all, 'active'] as const,
  },
  
  // Assignments
  assignments: {
    all: ['assignments'] as const,
    lists: () => [...queryKeys.assignments.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.assignments.lists(), { filters }] as const,
    details: () => [...queryKeys.assignments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.assignments.details(), id] as const,
    byStudent: (studentId: string) => [...queryKeys.assignments.all, 'byStudent', studentId] as const,
    byProgram: (programId: string) => [...queryKeys.assignments.all, 'byProgram', programId] as const,
  },
  
  // Analytics
  analytics: {
    all: ['analytics'] as const,
    participation: (filters: Record<string, any>) => [...queryKeys.analytics.all, 'participation', { filters }] as const,
    performance: (filters: Record<string, any>) => [...queryKeys.analytics.all, 'performance', { filters }] as const,
    reports: (type: string, filters: Record<string, any>) => [...queryKeys.analytics.all, 'reports', type, { filters }] as const,
  },
};

// Error handler for queries
const handleQueryError = (error: Error) => {
  console.error('Query error:', error);
  // You can add error reporting here (e.g., Sentry)
};

// Success handler for mutations
const handleMutationSuccess = () => {
  // You can add success tracking here
};

// Create optimized query client
export const createQueryClient = () => {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: handleQueryError,
    }),
    mutationCache: new MutationCache({
      onSuccess: handleMutationSuccess,
      onError: handleQueryError,
    }),
    defaultOptions: {
      queries: {
        // Default cache configuration
        staleTime: cacheConfig.dynamic.staleTime,
        gcTime: cacheConfig.dynamic.gcTime,
        
        // Retry configuration
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Network mode
        networkMode: 'online',
        
        // Refetch configuration
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        // Retry configuration for mutations
        retry: 1,
        networkMode: 'online',
      },
    },
  });
};

// Cache invalidation utilities
export const cacheUtils = {
  // Invalidate all student-related queries
  invalidateStudents: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
  },
  
  // Invalidate all program-related queries
  invalidatePrograms: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.programs.all });
  },
  
  // Invalidate all assignment-related queries
  invalidateAssignments: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
  },
  
  // Invalidate analytics queries
  invalidateAnalytics: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all });
  },
  
  // Clear all caches
  clearAll: (queryClient: QueryClient) => {
    queryClient.clear();
  },
};

// Prefetch utilities
export const prefetchUtils = {
  // Prefetch student list
  prefetchStudents: async (queryClient: QueryClient, filters = {}) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.students.list(filters),
      staleTime: cacheConfig.user.staleTime,
    });
  },
  
  // Prefetch active program
  prefetchActiveProgram: async (queryClient: QueryClient) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.programs.active(),
      staleTime: cacheConfig.static.staleTime,
    });
  },
  
  // Prefetch assignments for current week
  prefetchCurrentAssignments: async (queryClient: QueryClient) => {
    const currentWeek = new Date().toISOString().split('T')[0];
    await queryClient.prefetchQuery({
      queryKey: queryKeys.assignments.list({ week: currentWeek }),
      staleTime: cacheConfig.dynamic.staleTime,
    });
  },
};

// Cache size monitoring
export const getCacheStats = (queryClient: QueryClient) => {
  const cache = queryClient.getQueryCache();
  const queries = cache.getAll();
  
  return {
    totalQueries: queries.length,
    activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
    staleQueries: queries.filter(q => q.isStale()).length,
    cacheSize: JSON.stringify(queries).length,
  };
};