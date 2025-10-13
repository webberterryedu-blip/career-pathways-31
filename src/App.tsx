import React, { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/queryClient";
import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext"; // Using named import to match export
import { OnboardingProvider } from "@/contexts/OnboardingContext"; 
import { TutorialProvider } from "@/contexts/TutorialContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProgramProvider } from "@/contexts/ProgramContext";
import { AssignmentProvider } from "@/contexts/AssignmentContext";
import { StudentProvider } from "@/contexts/StudentContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { TutorialOverlay } from "@/components/tutorial";
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineErrorBoundary } from "@/components/OfflineErrorBoundary";
import { initializeDebugUtils } from "@/utils/debugOffline";
import { initializeAuthDebugUtils } from "@/utils/debugAuth";

// Eager load critical components
// import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthRecoveryButton from "./components/AuthRecoveryButton";
import { Button } from "@/components/ui/button";

// Lazy load heavy components
const InstrutorDashboard = lazy(() => import("./pages/InstrutorDashboard"));
const EstudantesPage = lazy(() => import("./pages/EstudantesPage"));
const ProgramasPage = lazy(() => import("./pages/ProgramasPage"));
const DesignacoesPage = lazy(() => import("./pages/DesignacoesPage"));
const TreasuresAssignmentsPage = lazy(() => import("./pages/TreasuresAssignmentsPage"));
const AssignmentsPage = lazy(() => import("./pages/AssignmentsPage"));
const RelatoriosPage = lazy(() => import("./pages/RelatoriosPage"));
const UnifiedDashboard = lazy(() => import("./components/UnifiedDashboard"));

// Lazy load secondary pages
const Demo = lazy(() => import("./pages/Demo"));
const Funcionalidades = lazy(() => import("./pages/Funcionalidades"));
const Congregacoes = lazy(() => import("./pages/Congregacoes"));
const Suporte = lazy(() => import("./pages/Suporte"));
const Sobre = lazy(() => import("./pages/Sobre"));
const Doar = lazy(() => import("./pages/Doar"));
const BemVindo = lazy(() => import("./pages/BemVindo"));
const ConfiguracaoInicial = lazy(() => import("./pages/ConfiguracaoInicial"));
const PrimeiroPrograma = lazy(() => import("./pages/PrimeiroPrograma"));
const Reunioes = lazy(() => import("./pages/Reunioes"));
const OfflineTestPage = lazy(() => import("./pages/Demo")); // Placeholder

// Dev-only lazy loads
const ProgramasTest = lazy(() => import("./pages/ProgramasTest"));
const DensityToggleTestPage = lazy(() => import("./pages/DensityToggleTest"));
const ZoomResponsivenessTestPage = lazy(() => import("./pages/ZoomResponsivenessTest"));

// Create optimized query client with enhanced caching
const queryClient = createQueryClient();

// Loading component with better UX
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-background">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
    <p className="text-sm text-muted-foreground">Carregando...</p>
  </div>
);

// Route-specific loading component
const RouteLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Conditional debug tools loading - only in development
if (import.meta.env.DEV && import.meta.env.VITE_LOG_LEVEL !== 'error') {
  console.log('🔧 Loading debug tools for development environment...');
  
  // Load debug tools asynchronously to avoid blocking startup
  Promise.all([
    import("@/utils/forceLogout"),
    import("@/utils/supabaseHealthCheck"),
    import("@/utils/logoutDiagnostics"),
    import("@/utils/emergencyLogout")
  ]).then(() => {
    console.log('✅ Debug tools loaded successfully');
  }).catch(error => {
    console.warn('⚠️ Some debug tools failed to load:', error);
  });
}

// Floating navigation between key instructor pages
const FlowNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const steps = ["/dashboard", "/estudantes", "/programas", "/designacoes"] as const;
  const labels: Record<string, string> = {
    "/dashboard": "Estudantes",
    "/estudantes": "Programas",
    "/programas": "Designações",
  };

  const idx = steps.indexOf(location.pathname as typeof steps[number]);
  if (idx === -1 || idx === steps.length - 1) return null;

  const nextPath = steps[idx + 1];
  const nextLabel = labels[location.pathname] || "Próximo";

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button size="lg" className="shadow-lg" onClick={() => navigate(nextPath)}>
        Continuar para {nextLabel}
      </Button>
    </div>
  );
};

const App = () => {
  // Performance monitoring for the main app
  usePerformanceMonitoring('App');
  
  // Initialize debug utilities in development
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      initializeDebugUtils();
      initializeAuthDebugUtils();
      
      // Show helpful message about errors
      setTimeout(() => {
        console.log('%c🔧 Debug Tools Loaded', 'color: #2196F3; font-weight: bold; font-size: 16px;');
        console.log('%c📱 Offline Storage:', 'color: #4CAF50; font-weight: bold;');
        console.log('  debugOffline.checkHealth() - Check database health');
        console.log('  debugOffline.resetDatabase() - Reset if corrupted');
        console.log('%c🔐 Authentication:', 'color: #FF9800; font-weight: bold;');
        console.log('  debugAuth.checkConnection() - Test Supabase connection');
        console.log('  debugAuth.createTestUser("test@example.com", "123456") - Create test user');
        console.log('  debugAuth.resetPassword("email") - Reset password');
        console.log('%c💡 Quick Fix for Login Issues:', 'color: #E91E63; font-weight: bold;');
        console.log('  debugAuth.createTestUser("admin@test.com", "123456")');
      }, 2000);
    }
  }, []);
  
  return (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <OfflineErrorBoundary>
              <OfflineProvider>
              <OnboardingProvider>
                <ProgramProvider>
                  <AssignmentProvider>
                    <StudentProvider>
                      <TutorialProvider>
                        <TooltipProvider>
                          <Sonner />
                          <TutorialOverlay />
                          <BrowserRouter
                            future={{
                              v7_startTransition: true,
                              v7_relativeSplatPath: true
                            }}
                          >
                            <NavigationProvider>
                              <ErrorBoundary>
                                <Suspense fallback={<PageLoader />}>
                                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Navigate to="/auth" replace />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/demo" element={<Demo />} />
                    <Route path="/funcionalidades" element={<Funcionalidades />} />
                    <Route path="/congregacoes" element={<Congregacoes />} />
                    <Route path="/suporte" element={<Suporte />} />
                    <Route path="/sobre" element={<Sobre />} />
                    <Route path="/doar" element={<Doar />} />

                    {/* Onboarding Routes */}
                    <Route
                      path="/bem-vindo"
                      element={
                        <ProtectedRoute allowedRoles={['instrutor']}>
                          <BemVindo />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/configuracao-inicial"
                      element={
                        <ProtectedRoute allowedRoles={['instrutor']}>
                          <ConfiguracaoInicial />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/primeiro-programa"
                      element={
                        <ProtectedRoute allowedRoles={['instrutor']}>
                          <PrimeiroPrograma />
                        </ProtectedRoute>
                      }
                    />

                    {/* Debug Routes - Only in development */}
                    {import.meta.env.DEV && (
                      <>
                        <Route path="/density-toggle-test" element={<DensityToggleTestPage />} />
                        <Route path="/zoom-responsiveness-test" element={<ZoomResponsivenessTestPage />} />
                        <Route path="/offline-test" element={<OfflineTestPage />} />
                        <Route
                          path="/programas-test"
                          element={
                            <ProtectedRoute allowedRoles={['instrutor']}>
                              <ProgramasTest />
                            </ProtectedRoute>
                          }
                        />
                      </>
                    )}

                                  {/* Protected Routes with Unified Layout */}
                                  <Route
                                    path="/"
                                    element={
                                      <ProtectedRoute allowedRoles={['instrutor', 'estudante', 'admin']}>
                                        <UnifiedLayout />
                                      </ProtectedRoute>
                                    }
                                  >
                                    {/* Dashboard Principal */}
                                    <Route 
                                      path="dashboard" 
                                      element={
                                        <Suspense fallback={<RouteLoader />}>
                                          <InstrutorDashboard />
                                        </Suspense>
                                      } 
                                    />

                                    {/* Instrutor Routes */}
                                    <Route 
                                      path="estudantes" 
                                      element={
                                        <Suspense fallback={<RouteLoader />}>
                                          <EstudantesPage />
                                        </Suspense>
                                      } 
                                    />
                                    <Route 
                                      path="programas" 
                                      element={
                                        <Suspense fallback={<RouteLoader />}>
                                          <ProgramasPage />
                                        </Suspense>
                                      } 
                                    />
                                    <Route 
                                      path="designacoes" 
                                      element={
                                        <Suspense fallback={<RouteLoader />}>
                                          <DesignacoesPage />
                                        </Suspense>
                                      } 
                                    />
                                    <Route 
                                      path="treasures-designacoes" 
                                      element={
                                        <Suspense fallback={<RouteLoader />}>
                                          <TreasuresAssignmentsPage />
                                        </Suspense>
                                      } 
                                    />
                                    <Route 
                                      path="assignments" 
                                      element={
                                        <Suspense fallback={<RouteLoader />}>
                                          <AssignmentsPage />
                                        </Suspense>
                                      } 
                                    />
                                    <Route 
                                      path="relatorios" 
                                      element={
                                        <Suspense fallback={<RouteLoader />}>
                                          <RelatoriosPage />
                                        </Suspense>
                                      } 
                                    />
                                    <Route 
                                      path="reunioes" 
                                      element={
                                        <Suspense fallback={<RouteLoader />}>
                                          <Reunioes />
                                        </Suspense>
                                      } 
                                    />

                                    {/* Estudante Routes */}
                                    <Route 
                                      path="estudante/:id" 
                                      element={
                                        <Suspense fallback={<RouteLoader />}>
                                          <UnifiedDashboard />
                                        </Suspense>
                                      } 
                                    />
                                    <Route 
                                      path="estudante/:id/familia" 
                                      element={<div className="p-8 text-center text-muted-foreground">Portal Familiar em construção</div>} 
                                    />
                                    <Route 
                                      path="estudante/:id/designacoes" 
                                      element={<div className="p-8 text-center text-muted-foreground">Minhas Designações em construção</div>} 
                                    />
                                    <Route 
                                      path="estudante/:id/materiais" 
                                      element={<div className="p-8 text-center text-muted-foreground">Materiais em construção</div>} 
                                    />
                                    <Route 
                                      path="estudante/:id/historico" 
                                      element={<div className="p-8 text-center text-muted-foreground">Histórico em construção</div>} 
                                    />
                                  </Route>

                    {/* Removed problematic routes */}

                                  <Route path="*" element={<NotFound />} />
                                </Routes>
                                </Suspense>
                              </ErrorBoundary>
                              <FlowNav />
                            </NavigationProvider>
                          </BrowserRouter>

                          {/* Auth Recovery Button */}
                          <div className="fixed top-4 right-4 z-50">
                            <AuthRecoveryButton />
                          </div>
                        </TooltipProvider>
                      </TutorialProvider>
                    </StudentProvider>
                  </AssignmentProvider>
                </ProgramProvider>
              </OnboardingProvider>
            </OfflineProvider>
            </OfflineErrorBoundary>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;