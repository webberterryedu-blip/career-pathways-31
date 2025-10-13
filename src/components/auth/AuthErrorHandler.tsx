/**
 * Enhanced authentication error handler
 */
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, User, Key } from 'lucide-react';

interface AuthErrorHandlerProps {
  error: string | null;
  onRetry?: () => void;
  onClear?: () => void;
}

export const AuthErrorHandler: React.FC<AuthErrorHandlerProps> = ({ 
  error, 
  onRetry, 
  onClear 
}) => {
  if (!error) return null;

  const isInvalidCredentials = error.includes('Invalid login credentials') || error.includes('CREDENCIAIS');
  const isEmailNotConfirmed = error.includes('Email not confirmed');
  
  const getErrorIcon = () => {
    if (isInvalidCredentials) return <Key className="h-4 w-4" />;
    if (isEmailNotConfirmed) return <User className="h-4 w-4" />;
    return <AlertCircle className="h-4 w-4" />;
  };

  const getErrorTitle = () => {
    if (isInvalidCredentials) return 'Credenciais Inválidas';
    if (isEmailNotConfirmed) return 'Email Não Confirmado';
    return 'Erro de Autenticação';
  };

  const getQuickActions = () => {
    if (isInvalidCredentials) {
      return (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium">Soluções rápidas:</p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (import.meta.env.DEV) {
                  console.log('Execute: debugAuth.createTestUser("admin@test.com", "123456")');
                  (window as any).debugAuth?.createTestUser?.('admin@test.com', '123456');
                }
              }}
            >
              <User className="h-3 w-3 mr-1" />
              Criar Usuário Teste
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (import.meta.env.DEV) {
                  console.log('Execute: debugAuth.checkConnection()');
                  (window as any).debugAuth?.checkConnection?.();
                }
              }}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Testar Conexão
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Alert variant="destructive" className="mb-4">
      {getErrorIcon()}
      <AlertTitle>{getErrorTitle()}</AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-2">
          <p className="text-sm">{error}</p>
          
          {import.meta.env.DEV && (
            <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-xs font-medium text-blue-800 mb-2">
                🔧 Ferramentas de Debug (Console):
              </p>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• debugAuth.checkConnection() - Testar conexão</p>
                <p>• debugAuth.createTestUser("admin@test.com", "123456") - Criar usuário</p>
                <p>• debugAuth.resetPassword("email") - Redefinir senha</p>
              </div>
            </div>
          )}
          
          {getQuickActions()}
          
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Tentar Novamente
              </Button>
            )}
            
            {onClear && (
              <Button size="sm" variant="ghost" onClick={onClear}>
                Fechar
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};