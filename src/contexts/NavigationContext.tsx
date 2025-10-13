import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ComponentType;
}

interface NavigationState {
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];
  navigationHistory: string[];
  pageTitle: string;
  canGoBack: boolean;
}

interface NavigationContextType extends NavigationState {
  setBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  setPageTitle: (title: string) => void;
  goBack: () => void;
  addToHistory: (path: string) => void;
  clearHistory: () => void;
  generateBreadcrumbs: (path: string) => BreadcrumbItem[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

// Route to breadcrumb mapping
const routeBreadcrumbMap: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [
    { label: 'Início', path: '/dashboard' }
  ],
  '/estudantes': [
    { label: 'Início', path: '/dashboard' },
    { label: 'Estudantes', path: '/estudantes' }
  ],
  '/programas': [
    { label: 'Início', path: '/dashboard' },
    { label: 'Programas', path: '/programas' }
  ],
  '/designacoes': [
    { label: 'Início', path: '/dashboard' },
    { label: 'Designações', path: '/designacoes' }
  ],
  '/relatorios': [
    { label: 'Início', path: '/dashboard' },
    { label: 'Relatórios', path: '/relatorios' }
  ],
  '/reunioes': [
    { label: 'Início', path: '/dashboard' },
    { label: 'Reuniões', path: '/reunioes' }
  ],
  '/assignments': [
    { label: 'Início', path: '/dashboard' },
    { label: 'Designações', path: '/assignments' }
  ],
  '/treasures-designacoes': [
    { label: 'Início', path: '/dashboard' },
    { label: 'Designações', path: '/designacoes' },
    { label: 'Tesouros', path: '/treasures-designacoes' }
  ]
};

// Route to page title mapping
const routeTitleMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/estudantes': 'Gerenciar Estudantes',
  '/programas': 'Gerenciar Programas',
  '/designacoes': 'Gerenciar Designações',
  '/relatorios': 'Relatórios e Analytics',
  '/reunioes': 'Reuniões',
  '/assignments': 'Designações',
  '/treasures-designacoes': 'Designações - Tesouros'
};

export function NavigationProvider({ children }: NavigationProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [navigationState, setNavigationState] = useState<NavigationState>(() => {
    // Initialize from localStorage if available
    const savedHistory = localStorage.getItem('navigationHistory');
    const history = savedHistory ? JSON.parse(savedHistory) : [];
    
    return {
      currentPath: location.pathname,
      breadcrumbs: [],
      navigationHistory: history,
      pageTitle: '',
      canGoBack: history.length > 1
    };
  });

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = (path: string): BreadcrumbItem[] => {
    // Handle student routes dynamically
    if (path.startsWith('/estudante/')) {
      const segments = path.split('/');
      const studentId = segments[2];
      const subPath = segments[3];
      
      const baseBreadcrumbs = [
        { label: 'Início', path: '/dashboard' },
        { label: 'Estudantes', path: '/estudantes' },
        { label: `Estudante ${studentId}`, path: `/estudante/${studentId}` }
      ];

      if (subPath) {
        const subPathLabels: Record<string, string> = {
          'familia': 'Família',
          'designacoes': 'Designações',
          'materiais': 'Materiais',
          'historico': 'Histórico'
        };
        
        baseBreadcrumbs.push({
          label: subPathLabels[subPath] || subPath,
          path: path
        });
      }
      
      return baseBreadcrumbs;
    }

    // Use predefined mapping or generate from path
    return routeBreadcrumbMap[path] || [
      { label: 'Início', path: '/dashboard' },
      { label: path.split('/').pop() || 'Página', path }
    ];
  };

  // Update navigation state when location changes
  useEffect(() => {
    const newBreadcrumbs = generateBreadcrumbs(location.pathname);
    const newTitle = routeTitleMap[location.pathname] || 
                    newBreadcrumbs[newBreadcrumbs.length - 1]?.label || 
                    'Sistema Ministerial';

    setNavigationState(prev => {
      const newHistory = [...prev.navigationHistory];
      
      // Add current path to history if it's different from the last one
      if (newHistory[newHistory.length - 1] !== location.pathname) {
        newHistory.push(location.pathname);
        
        // Keep history limited to last 10 entries
        if (newHistory.length > 10) {
          newHistory.shift();
        }
      }

      // Save to localStorage
      localStorage.setItem('navigationHistory', JSON.stringify(newHistory));

      return {
        ...prev,
        currentPath: location.pathname,
        breadcrumbs: newBreadcrumbs,
        navigationHistory: newHistory,
        pageTitle: newTitle,
        canGoBack: newHistory.length > 1
      };
    });
  }, [location.pathname]);

  // Update document title
  useEffect(() => {
    document.title = `${navigationState.pageTitle} - Sistema Ministerial`;
  }, [navigationState.pageTitle]);

  const setBreadcrumbs = (breadcrumbs: BreadcrumbItem[]) => {
    setNavigationState(prev => ({ ...prev, breadcrumbs }));
  };

  const setPageTitle = (title: string) => {
    setNavigationState(prev => ({ ...prev, pageTitle: title }));
  };

  const goBack = () => {
    if (navigationState.canGoBack && navigationState.navigationHistory.length > 1) {
      const history = [...navigationState.navigationHistory];
      history.pop(); // Remove current page
      const previousPath = history[history.length - 1];
      
      if (previousPath) {
        navigate(previousPath);
      }
    }
  };

  const addToHistory = (path: string) => {
    setNavigationState(prev => {
      const newHistory = [...prev.navigationHistory, path];
      localStorage.setItem('navigationHistory', JSON.stringify(newHistory));
      
      return {
        ...prev,
        navigationHistory: newHistory,
        canGoBack: newHistory.length > 1
      };
    });
  };

  const clearHistory = () => {
    setNavigationState(prev => ({
      ...prev,
      navigationHistory: [prev.currentPath],
      canGoBack: false
    }));
    localStorage.removeItem('navigationHistory');
  };

  const contextValue: NavigationContextType = {
    ...navigationState,
    setBreadcrumbs,
    setPageTitle,
    goBack,
    addToHistory,
    clearHistory,
    generateBreadcrumbs
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

// Hook for setting page metadata
export function usePageMetadata(title?: string, breadcrumbs?: BreadcrumbItem[]) {
  const { setPageTitle, setBreadcrumbs } = useNavigation();

  useEffect(() => {
    if (title) {
      setPageTitle(title);
    }
  }, [title, setPageTitle]);

  useEffect(() => {
    if (breadcrumbs) {
      setBreadcrumbs(breadcrumbs);
    }
  }, [breadcrumbs, setBreadcrumbs]);
}

export type { BreadcrumbItem, NavigationState, NavigationContextType };