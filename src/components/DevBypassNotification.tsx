/**
 * Notificação de bypass de desenvolvimento
 */
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export const DevBypassNotification: React.FC = () => {
  // Só mostra em desenvolvimento com bypass ativo
  if (!import.meta.env.DEV || (import.meta.env.VITE_AUTH_BYPASS !== 'true' && import.meta.env.VITE_AUTH_BYPASS !== 'frank')) {
    return null;
  }

  const isFrankBypass = import.meta.env.VITE_AUTH_BYPASS === 'frank';

  return (
    <Alert className={`fixed top-4 right-4 max-w-sm z-50 ${isFrankBypass ? 'border-blue-500 bg-blue-50' : 'border-orange-500 bg-orange-50'}`}>
      <AlertTriangle className={`h-4 w-4 ${isFrankBypass ? 'text-blue-600' : 'text-orange-600'}`} />
      <AlertDescription className={isFrankBypass ? 'text-blue-800' : 'text-orange-800'}>
        <div className="space-y-1">
          <p className="font-medium">
            {isFrankBypass ? '👤 Frank Webber' : '🚀 Modo Desenvolvimento'}
          </p>
          <p className="text-xs">
            {isFrankBypass 
              ? 'Logado como Frank Webber (Instrutor)' 
              : 'Auth bypass ativo. Logado como admin fake.'
            }
          </p>
          <p className="text-xs opacity-75">
            Para desativar: VITE_AUTH_BYPASS=false
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};