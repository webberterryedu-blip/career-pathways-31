import { ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import UnifiedNavigation from '@/components/UnifiedNavigation';
import UnifiedBreadcrumbs from '@/components/layout/UnifiedBreadcrumbs';
import PageHeader from '@/components/layout/PageHeader';
import NotificationArea from '@/components/layout/NotificationArea';
import RealTimeStatusIndicator from '@/components/realtime/RealTimeStatusIndicator';
import ConflictResolutionPanel from '@/components/realtime/ConflictResolutionPanel';

interface UnifiedLayoutProps {
  children?: ReactNode;
}

/**
 * UnifiedLayout - The main layout shell that provides consistent structure
 * across all pages in the meeting management system.
 * 
 * Features:
 * - Role-based navigation
 * - Responsive design (mobile/desktop)
 * - Consistent page structure
 * - Breadcrumb navigation
 * - Global notifications
 * - Proper content spacing and scrolling
 */
export default function UnifiedLayout({ children }: UnifiedLayoutProps) {
  const { profile, loading } = useAuth();
  const location = useLocation();

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" role="status" aria-label="Loading"></div>
      </div>
    );
  }

  // Don't render layout if no profile (user not authenticated)
  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Global Notifications */}
      <NotificationArea />
      
      {/* Main Navigation */}
      <UnifiedNavigation />
      
      {/* Main Content Area */}
      <div className="flex min-h-[calc(100vh-64px)]"> {/* Subtract nav height */}
        
        {/* Desktop Sidebar - Hidden on mobile */}
        <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-200 shadow-sm" role="complementary">
          <div className="flex-1 overflow-y-auto">
            <SidebarContent />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Breadcrumbs */}
          <div className="bg-white border-b border-gray-200 px-4 py-2">
            <UnifiedBreadcrumbs />
          </div>
          
          {/* Page Header */}
          <PageHeader />
          
          {/* Page Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * Sidebar content with contextual information and quick actions
 */
function SidebarContent() {
  const { profile } = useAuth();
  const location = useLocation();

  // Get current page context
  const getCurrentPageInfo = () => {
    const path = location.pathname;
    
    if (path.includes('/dashboard')) {
      return {
        title: 'Dashboard',
        description: 'Visão geral do sistema',
        quickActions: [
          { label: 'Nova Designação', action: () => console.log('Nova designação') },
          { label: 'Importar Estudantes', action: () => console.log('Importar') }
        ]
      };
    }
    
    if (path.includes('/estudantes')) {
      return {
        title: 'Estudantes',
        description: 'Gestão de publicadores',
        quickActions: [
          { label: 'Adicionar Estudante', action: () => console.log('Adicionar') },
          { label: 'Importar Planilha', action: () => console.log('Importar') }
        ]
      };
    }
    
    if (path.includes('/programas')) {
      return {
        title: 'Programas',
        description: 'Gestão de programações',
        quickActions: [
          { label: 'Upload MWB', action: () => console.log('Upload') },
          { label: 'Ativar Programa', action: () => console.log('Ativar') }
        ]
      };
    }
    
    if (path.includes('/designacoes')) {
      return {
        title: 'Designações',
        description: 'Motor de designações S-38',
        quickActions: [
          { label: 'Gerar Automático', action: () => console.log('Gerar') },
          { label: 'Validar Regras', action: () => console.log('Validar') }
        ]
      };
    }
    
    if (path.includes('/relatorios')) {
      return {
        title: 'Relatórios',
        description: 'Análises e estatísticas',
        quickActions: [
          { label: 'Exportar PDF', action: () => console.log('PDF') },
          { label: 'Gerar Relatório', action: () => console.log('Relatório') }
        ]
      };
    }
    
    return {
      title: 'Sistema Ministerial',
      description: 'Gestão de reuniões',
      quickActions: []
    };
  };

  const pageInfo = getCurrentPageInfo();

  return (
    <div className="p-4 space-y-6">
      {/* Page Context */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          {pageInfo.title}
        </h3>
        <p className="text-xs text-gray-600">
          {pageInfo.description}
        </p>
      </div>

      {/* User Info */}
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {profile.nome.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile.nome}
            </p>
            <p className="text-xs text-gray-600 capitalize">
              {profile.role}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {pageInfo.quickActions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Ações Rápidas
          </h4>
          <div className="space-y-1">
            {pageInfo.quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Status */}
      <div className="border-t pt-4">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Status do Sistema
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Tempo Real</span>
            <RealTimeStatusIndicator />
          </div>
          <ConflictResolutionPanel />
        </div>
      </div>

      {/* Help Section */}
      <div className="border-t pt-4">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Ajuda
        </h4>
        <div className="space-y-1">
          <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
            Manual S-38
          </button>
          <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
            Suporte
          </button>
        </div>
      </div>
    </div>
  );
}