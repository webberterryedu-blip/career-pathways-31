import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  route: string;
  data?: Record<string, any>;
}

interface OnboardingState {
  currentStep: number;
  steps: OnboardingStep[];
  isComplete: boolean;
  congregacaoData: Record<string, any>;
  systemData: Record<string, any>;
}

interface OnboardingContextType extends OnboardingState {
  setStepCompleted: (stepId: string, data?: Record<string, any>) => void;
  setStepData: (stepId: string, data: Record<string, any>) => void;
  goToStep: (stepIndex: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetOnboarding: () => void;
  checkSystemReadiness: () => Promise<void>;
  loading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo',
    description: 'Introdução ao sistema',
    completed: false,
    required: true,
    route: '/bem-vindo'
  },
  {
    id: 'setup',
    title: 'Configuração Inicial', 
    description: 'Configurar congregação e dados básicos',
    completed: false,
    required: true,
    route: '/configuracao-inicial'
  },
  {
    id: 'students',
    title: 'Cadastrar Estudantes',
    description: 'Adicionar estudantes da congregação',
    completed: false,
    required: true,
    route: '/estudantes'
  },
  {
    id: 'programs',
    title: 'Importar Programas',
    description: 'Importar programas das reuniões',
    completed: false,
    required: true,
    route: '/programas'
  },
  {
    id: 'assignments',
    title: 'Gerar Designações',
    description: 'Criar primeiras designações',
    completed: false,
    required: false,
    route: '/designacoes'
  }
];

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    steps: DEFAULT_STEPS,
    isComplete: false,
    congregacaoData: {},
    systemData: {}
  });
  const [loading, setLoading] = useState(true);

  // Verificar progresso do sistema
  const checkSystemReadiness = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Para simplificar, vamos considerar o onboarding sempre completo para instrutores
      // que já têm perfil carregado
      const isComplete = !!profile?.role;

      setState(prev => ({
        ...prev,
        steps: prev.steps.map(step => ({ ...step, completed: true })),
        currentStep: prev.steps.length,
        isComplete,
        systemData: {
          studentsCount: 0,
          programsCount: 0,
          assignmentsCount: 0,
          hasPendingPrograms: false
        }
      }));

    } catch (error) {
      console.error('Erro ao verificar progresso:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile]);

  // Marcar step como completo
  const setStepCompleted = useCallback((stepId: string, data?: Record<string, any>) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId 
          ? { ...step, completed: true, data: { ...step.data, ...data } }
          : step
      )
    }));

    // Recalcular progresso
    checkSystemReadiness();
  }, [checkSystemReadiness]);

  // Definir dados do step
  const setStepData = useCallback((stepId: string, data: Record<string, any>) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.id === stepId
          ? { ...step, data: { ...step.data, ...data } }
          : step
      ),
      congregacaoData: stepId === 'setup' 
        ? { ...prev.congregacaoData, ...data }
        : prev.congregacaoData
    }));
  }, []);

  // Navegar para step específico
  const goToStep = useCallback((stepIndex: number) => {
    setState(prev => ({ ...prev, currentStep: stepIndex }));
  }, []);

  // Próximo step
  const nextStep = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      currentStep: Math.min(prev.currentStep + 1, prev.steps.length) 
    }));
  }, []);

  // Step anterior
  const previousStep = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      currentStep: Math.max(prev.currentStep - 1, 0) 
    }));
  }, []);

  // Reset onboarding
  const resetOnboarding = useCallback(() => {
    setState({
      currentStep: 0,
      steps: DEFAULT_STEPS,
      isComplete: false,
      congregacaoData: {},
      systemData: {}
    });
  }, []);

  // Verificar progresso inicial
  useEffect(() => {
    if (user && profile) {
      checkSystemReadiness();
    }
  }, [user, profile, checkSystemReadiness]);

  const value: OnboardingContextType = {
    ...state,
    setStepCompleted,
    setStepData,
    goToStep,
    nextStep,
    previousStep,
    resetOnboarding,
    checkSystemReadiness,
    loading
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};