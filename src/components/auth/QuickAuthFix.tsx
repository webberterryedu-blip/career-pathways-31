/**
 * Quick authentication fix component for development
 */
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const QuickAuthFix: React.FC = () => {
  const [email, setEmail] = useState('admin@test.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const createTestUser = async () => {
    setLoading(true);
    setMessage('');

    try {
      // First try to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          // User exists, try to sign in
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            setMessage(`❌ Erro no login: ${signInError.message}`);
          } else {
            setMessage('✅ Login realizado com sucesso!');
            // Reload page to update auth state
            setTimeout(() => window.location.reload(), 1000);
          }
        } else {
          setMessage(`❌ Erro ao criar usuário: ${signUpError.message}`);
        }
      } else {
        if (signUpData.user) {
          setMessage('✅ Usuário criado! Verificando se precisa confirmar email...');
          
          // Try to sign in immediately (some configs don't require email confirmation)
          setTimeout(async () => {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (signInError) {
              setMessage('📧 Usuário criado! Verifique seu email para confirmar a conta.');
            } else {
              setMessage('✅ Usuário criado e logado com sucesso!');
              setTimeout(() => window.location.reload(), 1000);
            }
          }, 1000);
        }
      }
    } catch (error) {
      setMessage(`❌ Erro inesperado: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        setMessage(`❌ Erro de conexão: ${error.message}`);
      } else {
        setMessage('✅ Conexão com Supabase funcionando!');
      }
    } catch (error) {
      setMessage(`❌ Erro de conexão: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Only show in development
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-center">🔧 Quick Auth Fix</CardTitle>
        <CardDescription className="text-center">
          Ferramenta de desenvolvimento para resolver problemas de autenticação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email de teste:
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@test.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Senha de teste:
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="123456"
          />
        </div>

        <div className="space-y-2">
          <Button 
            onClick={createTestUser} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Processando...' : 'Criar/Logar Usuário Teste'}
          </Button>
          
          <Button 
            onClick={testConnection} 
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Testando...' : 'Testar Conexão Supabase'}
          </Button>
        </div>

        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Console Commands:</strong></p>
          <p>• debugAuth.checkConnection()</p>
          <p>• debugAuth.createTestUser("email", "pass")</p>
          <p>• debugAuth.resetPassword("email")</p>
        </div>
      </CardContent>
    </Card>
  );
};