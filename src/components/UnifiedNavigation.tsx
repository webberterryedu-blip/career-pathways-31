import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Users, 
  BookOpen, 
  Calendar, 
  BarChart3, 
  UserCheck,
  TrendingUp,
  Menu,
  X,
  Plus,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UnifiedNotifications from './UnifiedNotifications';
import { cn } from '@/lib/utils';

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: {
    count: number;
    variant: 'default' | 'destructive' | 'secondary' | 'outline';
  };
  quickAction?: {
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    tooltip: string;
  };
  children?: NavigationItem[]; // Support for nested routes
  status?: 'active' | 'pending' | 'completed' | 'error'; // Assignment status indicators
}

// 🎯 NAVEGAÇÃO UNIFICADA QUE ADAPTA AO ROLE
export default function UnifiedNavigation() {
  const { profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 🚨 SEM PERFIL = SEM NAVEGAÇÃO
  if (!profile) return null;

  // Mock data for assignment status indicators (in real app, this would come from context/API)
  const getAssignmentStatus = () => ({
    pending: 3,
    overdue: 1,
    completed: 12
  });

  const assignmentStatus = getAssignmentStatus();

  // 🏠 ADMIN passa a usar navegação do INSTRUTOR (admin dashboard removido)
  if (profile.role === 'admin') {
    const instructorNavItems: NavigationItem[] = [
      { 
        href: '/dashboard', 
        label: 'Dashboard', 
        icon: Home, 
        exact: true,
        status: assignmentStatus.pending > 0 ? 'pending' : 'active',
        badge: assignmentStatus.pending > 0 ? {
          count: assignmentStatus.pending,
          variant: 'secondary' as const
        } : undefined
      },
      { 
        href: '/estudantes', 
        label: 'Estudantes', 
        icon: Users,
        status: 'active',
        quickAction: {
          icon: Plus,
          onClick: () => console.log('Add student'),
          tooltip: 'Adicionar Estudante'
        }
      },
      { 
        href: '/programas', 
        label: 'Programas', 
        icon: BookOpen,
        status: 'completed',
        quickAction: {
          icon: Plus,
          onClick: () => console.log('Upload program'),
          tooltip: 'Upload Programa'
        }
      },
      { 
        href: '/designacoes', 
        label: 'Designações', 
        icon: Calendar,
        status: assignmentStatus.overdue > 0 ? 'error' : 'active',
        badge: assignmentStatus.overdue > 0 ? {
          count: assignmentStatus.overdue,
          variant: 'destructive' as const
        } : undefined,
        quickAction: {
          icon: Plus,
          onClick: () => console.log('Generate assignments'),
          tooltip: 'Gerar Designações'
        }
      },
      { href: '/relatorios', label: 'Relatórios', icon: BarChart3, status: 'completed' },
      { href: '/reunioes', label: 'Reuniões', icon: Calendar, status: 'active' },
      { href: '/admin/usuarios', label: 'Gerenciar Usuários', icon: Settings, status: 'active' }
    ];

    return <NavigationBar items={instructorNavItems} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />;
  }

  // 👨‍🏫 NAVEGAÇÃO INSTRUTOR - GESTÃO LOCAL
  if (profile.role === 'instrutor') {
    const instructorNavItems: NavigationItem[] = [
      { 
        href: '/dashboard', 
        label: 'Dashboard', 
        icon: Home, 
        exact: true,
        status: assignmentStatus.pending > 0 ? 'pending' : 'active',
        badge: assignmentStatus.pending > 0 ? {
          count: assignmentStatus.pending,
          variant: 'secondary' as const
        } : undefined
      },
      { 
        href: '/estudantes', 
        label: 'Estudantes', 
        icon: Users,
        status: 'active',
        quickAction: {
          icon: Plus,
          onClick: () => console.log('Add student'),
          tooltip: 'Adicionar Estudante'
        }
      },
      { 
        href: '/programas', 
        label: 'Programas', 
        icon: BookOpen,
        status: 'completed',
        quickAction: {
          icon: Plus,
          onClick: () => console.log('Upload program'),
          tooltip: 'Upload Programa'
        }
      },
      { 
        href: '/designacoes', 
        label: 'Designações', 
        icon: Calendar,
        status: assignmentStatus.overdue > 0 ? 'error' : 'active',
        badge: assignmentStatus.overdue > 0 ? {
          count: assignmentStatus.overdue,
          variant: 'destructive' as const
        } : undefined,
        quickAction: {
          icon: Plus,
          onClick: () => console.log('Generate assignments'),
          tooltip: 'Gerar Designações'
        }
      },
      { href: '/relatorios', label: 'Relatórios', icon: BarChart3, status: 'completed' },
      { href: '/reunioes', label: 'Reuniões', icon: Calendar, status: 'active' },
      { href: '/equidade', label: 'Equidade', icon: TrendingUp, status: 'pending' }
    ];

    return <NavigationBar items={instructorNavItems} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />;
  }

  // 👨‍🎓 NAVEGAÇÃO ESTUDANTE - VISÃO INDIVIDUAL
  if (profile.role === 'estudante') {
    const studentNavItems: NavigationItem[] = [
      { 
        href: `/estudante/${profile.id}`, 
        label: 'Meu Dashboard', 
        icon: UserCheck, 
        exact: true,
        status: assignmentStatus.pending > 0 ? 'pending' : 'active',
        badge: assignmentStatus.pending > 0 ? {
          count: assignmentStatus.pending,
          variant: 'secondary' as const
        } : undefined
      },
      { 
        href: `/estudante/${profile.id}/designacoes`, 
        label: 'Minhas Designações', 
        icon: Calendar,
        status: assignmentStatus.overdue > 0 ? 'error' : 'active',
        badge: assignmentStatus.overdue > 0 ? {
          count: assignmentStatus.overdue,
          variant: 'destructive' as const
        } : undefined
      },
      { 
        href: `/estudante/${profile.id}/materiais`, 
        label: 'Materiais', 
        icon: BookOpen, 
        status: 'completed' 
      },
      { 
        href: `/estudante/${profile.id}/familia`, 
        label: 'Família', 
        icon: Users, 
        status: 'active' 
      },
      { 
        href: `/estudante/${profile.id}/historico`, 
        label: 'Histórico', 
        icon: BarChart3, 
        status: 'completed' 
      }
    ];

    return <NavigationBar items={studentNavItems} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />;
  }

  // 🚨 ROLE NÃO RECONHECIDO
  return (
    <nav className="flex space-x-2 p-4 bg-background border-b">
      <div className="text-sm text-muted-foreground">
        Role não reconhecido: {profile.role}
      </div>
    </nav>
  );
}

/**
 * NavigationBar - Enhanced navigation component with mobile support and status indicators
 */
interface NavigationBarProps {
  items: NavigationItem[];
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

function NavigationBar({ items, mobileMenuOpen, setMobileMenuOpen }: NavigationBarProps) {
  const location = useLocation();

  const getActiveState = (item: NavigationItem) => {
    if (item.exact) {
      return location.pathname === item.href;
    }
    
    // Enhanced active state detection for nested routes
    if (item.children) {
      return item.children.some(child => location.pathname.startsWith(child.href)) || 
             location.pathname.startsWith(item.href);
    }
    
    return location.pathname.startsWith(item.href);
  };

  const getStatusIndicator = (status?: NavigationItem['status']) => {
    if (!status) return null;
    
    const statusColors = {
      active: 'bg-green-500',
      pending: 'bg-yellow-500',
      completed: 'bg-blue-500',
      error: 'bg-red-500'
    };
    
    return (
      <div 
        className={cn('w-2 h-2 rounded-full', statusColors[status])}
        title={`Status: ${status}`}
      />
    );
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between p-4 bg-background border-b shadow-sm">
        <div className="flex items-center space-x-1">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-2 mr-6">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Sistema Ministerial</span>
          </div>

          {/* Navigation Items */}
          {items.map((item) => {
            const isActive = getActiveState(item);
            
            return (
              <div key={item.href} className="relative flex items-center">
                <Link to={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "flex items-center gap-2 relative transition-all duration-200",
                      isActive && "shadow-sm"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    
                    {/* Status Indicator */}
                    {getStatusIndicator(item.status)}
                    
                    {/* Badge */}
                    {item.badge && (
                      <Badge 
                        variant={item.badge.variant} 
                        className="ml-1 h-5 min-w-[20px] text-xs"
                      >
                        {item.badge.count}
                      </Badge>
                    )}
                  </Button>
                </Link>
                
                {/* Quick Action Button */}
                {item.quickAction && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
                    onClick={item.quickAction.onClick}
                    title={item.quickAction.tooltip}
                  >
                    <item.quickAction.icon className="h-4 w-4" />
                  </Button>
                )}
                
                {/* Active indicator line */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Right side - Notifications and User */}
        <div className="flex items-center space-x-3">
          <UnifiedNotifications />
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-background border-b shadow-sm">
        <div className="flex items-center justify-between p-4">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Sistema Ministerial</span>
          </div>

          {/* Mobile Menu Button with animation */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-10 w-10 p-0 transition-transform duration-200"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 rotate-90 transition-transform duration-200" />
            ) : (
              <Menu className="h-5 w-5 transition-transform duration-200" />
            )}
          </Button>
        </div>

        {/* Mobile Menu Drawer with animation */}
        <div className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="border-t bg-background">
            <div className="px-4 py-2 space-y-1">
              {items.map((item) => {
                const isActive = getActiveState(item);
                
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-all duration-200',
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className={cn(
                        'h-5 w-5 transition-colors', 
                        isActive ? 'text-blue-700' : 'text-gray-500'
                      )} />
                      <span className="font-medium">{item.label}</span>
                      {getStatusIndicator(item.status)}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {item.badge && (
                        <Badge 
                          variant={item.badge.variant} 
                          className="h-5 min-w-[20px] text-xs"
                        >
                          {item.badge.count}
                        </Badge>
                      )}
                      {item.quickAction && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-gray-200 transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            item.quickAction!.onClick();
                          }}
                          title={item.quickAction.tooltip}
                        >
                          <item.quickAction.icon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {/* Mobile Notifications */}
            <div className="border-t px-4 py-3">
              <UnifiedNotifications />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
