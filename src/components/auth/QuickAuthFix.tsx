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

  const loginAsFrank = async () => {
    setLoading(true);
    setMessage('');

    try {
      setMessage('🔧 Fazendo login como Frank Webber...');
      
      // Vamos simular o login criando uma sessão fake no localStorage
      const frankUser = {
        id: '1d112896-626d-4dc7-a758-0e5bec83fe6c',
        email: 'frankwebber33@hotmail.com',
        created_at: '2025-09-21T15:20:40.785506+00:00',
        updated_at: '2025-10-05T16:20:39.034069+00:00',
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: {
          sub: '1d112896-626d-4dc7-a758-0e5bec83fe6c',
          nome: 'Frank Webber',
          role: 'instrutor',
          email: 'frankwebber33@hotmail.com',
          email_verified: true,
          phone_verified: false
        },
        aud: 'authenticated',
        confirmation_sent_at: '2025-09-21T17:17:55.037637+00:00',
        confirmed_at: '2025-10-03T13:54:42.116467+00:00',
        email_confirmed_at: '2025-10-03T13:54:42.116467+00:00',
        phone: null,
        phone_confirmed_at: null,
        last_sign_in_at: '2025-10-03T22:55:17.345242+00:00',
        role: 'authenticated',
        identities: []
      };

      // Criar perfil no banco
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: frankUser.id,
          user_id: frankUser.id,
          nome: 'Frank Webber',
          email: 'frankwebber33@hotmail.com',
          role: 'instrutor',
          congregacao: 'Congregação Central',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.warn('Profile error (pode ser normal):', profileError);
      }

      // Salvar no localStorage para simular sessão
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'fake-token-for-frank',
        refresh_token: 'fake-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: frankUser
      }));

      setMessage('✅ Login simulado como Frank Webber! Recarregando...');
      
      // Recarregar a página para ativar a sessão
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);

    } catch (error) {
      setMessage(`❌ Erro inesperado: ${error}`);
      console.error('Unexpected error:', error);
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
            onClick={loginAsFrank} 
            disabled={loading}
            variant="default"
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Fazendo Login...' : '🚀 Login Direto como Frank Webber'}
          </Button>
          
          <Button 
            onClick={async () => {
              setLoading(true);
              setMessage('');
              try {
                const { error } = await supabase.auth.resetPasswordForEmail('frankwebber33@hotmail.com', {
                  redirectTo: window.location.origin + '/auth',
                });
                if (error) {
                  setMessage(`❌ Erro: ${error.message}`);
                } else {
                  setMessage('📧 Email de reset enviado para frankwebber33@hotmail.com');
                }
              } catch (error) {
                setMessage(`❌ Erro: ${error}`);
              } finally {
                setLoading(false);
              }
            }} 
            disabled={loading}
            variant="secondary"
            className="w-full"
          >
            {loading ? 'Enviando...' : '🔑 Reset Senha Frank'}
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
          <p><strong>Para Frank Webber:</strong></p>
          <p>1. Clique em "Corrigir Perfil Frank Webber"</p>
          <p>2. Use: frankwebber33@hotmail.com</p>
          <p>3. Se não souber a senha, use o reset</p>
          <p><strong>Console Commands:</strong></p>
          <p>• debugAuth.resetPassword("frankwebber33@hotmail.com")</p>
        </div>
      </CardContent>
    </Card>
  );
};