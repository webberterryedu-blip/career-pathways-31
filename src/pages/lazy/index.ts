/**
 * Lazy-loaded page components for better performance
 */
import { lazyWithRetry } from '@/utils/lazyLoading';

// Lazy load main pages
export const LazyDashboard = lazyWithRetry(() => import('../Dashboard'));
export const LazyEstudantesPage = lazyWithRetry(() => import('../EstudantesPage'));
export const LazyProgramasPage = lazyWithRetry(() => import('../ProgramasPage'));
export const LazyDesignacoesPage = lazyWithRetry(() => import('../DesignacoesPage'));
export const LazyRelatoriosPage = lazyWithRetry(() => import('../RelatoriosPage'));

// Lazy load heavy components
export const LazyAssignmentGenerationModal = lazyWithRetry(() => 
  import('@/components/assignment/AssignmentGenerationModal')
);

export const LazyReportingDashboard = lazyWithRetry(() => 
  import('@/components/analytics/ReportingDashboard')
);

export const LazyStudentProgressTracker = lazyWithRetry(() => 
  import('@/components/analytics/StudentProgressTracker')
);

export const LazyAssignmentPerformanceAnalytics = lazyWithRetry(() => 
  import('@/components/analytics/AssignmentPerformanceAnalytics')
);

// Preload critical components
export const preloadCriticalComponents = () => {
  // Preload dashboard and navigation components
  import('../Dashboard');
  import('@/components/layout/UnifiedLayout');
  import('@/components/UnifiedNavigation');
};