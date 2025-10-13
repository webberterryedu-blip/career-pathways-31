import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigation } from '@/contexts/NavigationContext';
import { 
  Plus, 
  Upload, 
  Download, 
  Settings, 
  RefreshCw,
  FileText,
  Calendar,
  MoreHorizontal
} from 'lucide-react';

interface PageAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  primary?: boolean;
  disabled?: boolean;
  badge?: {
    count: number;
    variant: 'default' | 'destructive' | 'secondary' | 'outline';
  };
}

interface PageInfo {
  title: string;
  description?: string;
  actions: PageAction[];
  status?: {
    label: string;
    variant: 'default' | 'destructive' | 'secondary' | 'outline';
  };
}

/**
 * PageHeader - Provides consistent page titles and actions
 * Uses NavigationContext for consistent page title management
 */
export default function PageHeader() {
  const location = useLocation();
  const { pageTitle } = useNavigation();
  
  const getPageInfo = (): PageInfo => {
    const path = location.pathname;
    
    if (path === '/dashboard') {
      return {
        title: 'Dashboard',
        description: 'Visão geral do sistema de designações',
        status: {
          label: 'Sistema Ativo',
          variant: 'secondary'
        },
        actions: [
          {
            label: 'Atualizar',
            icon: RefreshCw,
            onClick: () => window.location.reload(),
            variant: 'outline' as const
          },
          {
            label: 'Nova Designação',
            icon: Plus,
            onClick: () => console.log('Nova designação'),
            primary: true,
            badge: {
              count: 3,
              variant: 'secondary'
            }
          }
        ]
      };
    }
    
    if (path.includes('/estudantes')) {
      return {
        title: 'Estudantes',
        description: 'Gestão de publicadores e qualificações',
        status: {
          label: '24 Ativos',
          variant: 'secondary'
        },
        actions: [
          {
            label: 'Importar Planilha',
            icon: Upload,
            onClick: () => console.log('Importar planilha'),
            variant: 'outline' as const
          },
          {
            label: 'Adicionar Estudante',
            icon: Plus,
            onClick: () => console.log('Adicionar estudante'),
            primary: true
          }
        ]
      };
    }
    
    if (path.includes('/programas')) {
      return {
        title: 'Programas',
        description: 'Gestão de programações semanais',
        status: {
          label: 'Programa Ativo',
          variant: 'secondary'
        },
        actions: [
          {
            label: 'Configurações',
            icon: Settings,
            onClick: () => console.log('Configurações'),
            variant: 'outline' as const
          },
          {
            label: 'Upload MWB',
            icon: Upload,
            onClick: () => console.log('Upload MWB'),
            primary: true
          }
        ]
      };
    }
    
    if (path.includes('/designacoes')) {
      return {
        title: 'Designações',
        description: 'Motor de designações seguindo regras S-38',
        status: {
          label: '2 Pendentes',
          variant: 'destructive'
        },
        actions: [
          {
            label: 'Validar Regras',
            icon: FileText,
            onClick: () => console.log('Validar regras'),
            variant: 'outline' as const
          },
          {
            label: 'Gerar Automático',
            icon: RefreshCw,
            onClick: () => console.log('Gerar automático'),
            primary: true,
            badge: {
              count: 2,
              variant: 'destructive'
            }
          }
        ]
      };
    }
    
    if (path.includes('/relatorios')) {
      return {
        title: 'Relatórios',
        description: 'Análises e estatísticas de participação',
        status: {
          label: 'Dados Atualizados',
          variant: 'secondary'
        },
        actions: [
          {
            label: 'Configurar',
            icon: Settings,
            onClick: () => console.log('Configurar relatórios'),
            variant: 'outline' as const
          },
          {
            label: 'Exportar PDF',
            icon: Download,
            onClick: () => console.log('Exportar PDF'),
            primary: true
          }
        ]
      };
    }
    
    if (path.includes('/reunioes')) {
      return {
        title: 'Reuniões',
        description: 'Gestão de reuniões e cronogramas',
        status: {
          label: 'Próxima: Quinta',
          variant: 'secondary'
        },
        actions: [
          {
            label: 'Histórico',
            icon: Calendar,
            onClick: () => console.log('Ver histórico'),
            variant: 'outline' as const
          },
          {
            label: 'Nova Reunião',
            icon: Plus,
            onClick: () => console.log('Nova reunião'),
            primary: true
          }
        ]
      };
    }
    
    // Student pages
    if (path.includes('/estudante/')) {
      const segments = path.split('/');
      
      if (segments.includes('designacoes')) {
        return {
          title: 'Minhas Designações',
          description: 'Suas designações e materiais de estudo',
          actions: []
        };
      } else if (segments.includes('materiais')) {
        return {
          title: 'Materiais',
          description: 'Recursos e materiais de estudo',
          actions: []
        };
      } else if (segments.includes('familia')) {
        return {
          title: 'Família',
          description: 'Gestão familiar e designações',
          actions: []
        };
      } else if (segments.includes('historico')) {
        return {
          title: 'Histórico',
          description: 'Histórico de participações e progresso',
          actions: []
        };
      } else {
        return {
          title: 'Meu Dashboard',
          description: 'Sua visão pessoal do sistema',
          actions: []
        };
      }
    }
    
    // Onboarding pages
    if (path.includes('/bem-vindo')) {
      return {
        title: 'Bem-vindo',
        description: 'Configuração inicial do sistema',
        actions: []
      };
    }
    
    if (path.includes('/configuracao-inicial')) {
      return {
        title: 'Configuração Inicial',
        description: 'Configure seu sistema pela primeira vez',
        actions: []
      };
    }
    
    if (path.includes('/primeiro-programa')) {
      return {
        title: 'Primeiro Programa',
        description: 'Configure seu primeiro programa de reunião',
        actions: []
      };
    }
    
    // Default fallback
    return {
      title: 'Sistema Ministerial',
      description: 'Gestão de reuniões e designações',
      actions: []
    };
  };

  const pageInfo = getPageInfo();

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8" role="banner">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold leading-7 text-foreground sm:truncate">
              {pageTitle || pageInfo.title}
            </h1>
            {pageInfo.status && (
              <Badge variant={pageInfo.status.variant} className="text-xs">
                {pageInfo.status.label}
              </Badge>
            )}
          </div>
          {pageInfo.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {pageInfo.description}
            </p>
          )}
        </div>
        
        {pageInfo.actions.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Show primary actions first on mobile */}
            {pageInfo.actions
              .sort((a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0))
              .slice(0, 3) // Limit to 3 actions on mobile
              .map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant={action.primary ? 'default' : (action.variant || 'outline')}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className="flex items-center gap-2 relative"
                    size="sm"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{action.label}</span>
                    <span className="sm:hidden">{action.label.split(' ')[0]}</span>
                    {action.badge && (
                      <Badge 
                        variant={action.badge.variant} 
                        className="ml-1 h-4 min-w-[16px] text-xs"
                      >
                        {action.badge.count}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            
            {/* More actions dropdown for mobile if needed */}
            {pageInfo.actions.length > 3 && (
              <Button
                variant="outline"
                size="sm"
                className="sm:hidden"
                onClick={() => console.log('Show more actions')}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}