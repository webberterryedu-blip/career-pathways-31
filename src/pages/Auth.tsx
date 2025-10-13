import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, user, loading, authError, clearAuthError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    // Clear any previous errors when typing
    if (authError && (email || password)) {
      clearAuthError();
    }
  }, [email, password]);

  const getFriendlyError = (err: string | null) => {
    if (!err) return null;
    const lower = err.toLowerCase();
    if (lower.includes('invalid login credentials') || lower.includes('credenciais')) {
      return 'Email ou senha inválidos.';
    }
    if (lower.includes('email not confirmed') || lower.includes('confirm')) {
      return 'Confirme seu email antes de entrar.';
    }
    return 'Erro de autenticação. Tente novamente.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (!error) navigate("/dashboard");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white px-4">
      <Card className="w-full max-w-sm border">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">Entrar</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu-email@exemplo.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {authError && (
              <div className="text-sm text-red-600 border border-red-200 rounded p-2 bg-red-50">
                {getFriendlyError(authError)}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading || submitting}>
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full text-sm text-blue-600"
              onClick={async () => {
                if (!email) return alert('Digite seu email para resetar a senha.');
                const { error } = await supabase.auth.resetPasswordForEmail(email);
                if (error) alert('Erro ao enviar email de reset: ' + error.message);
                else alert('Email de reset enviado! Verifique sua caixa de entrada.');
              }}
            >
              Esqueci minha senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
