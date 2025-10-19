import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading, authError, clearAuthError } = useAuth();
  const { toast } = useToast();

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (authError) {
      clearAuthError();
    }
  }, [loginEmail, loginPassword, signupEmail, signupPassword]);

  const getFriendlyError = (err: string | null) => {
    if (!err) return null;
    const lower = err.toLowerCase();
    if (lower.includes('invalid login credentials') || lower.includes('credenciais')) {
      return 'Email ou senha inválidos.';
    }
    if (lower.includes('email not confirmed') || lower.includes('confirm')) {
      return 'Confirme seu email antes de entrar.';
    }
    if (lower.includes('user already registered')) {
      return 'Este email já está cadastrado. Faça login.';
    }
    return 'Erro de autenticação. Tente novamente.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha email e senha para continuar.",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    const { error } = await signIn(loginEmail.trim(), loginPassword);
    setSubmitting(false);
    
    if (error) {
      toast({
        title: "Erro ao entrar",
        description: getFriendlyError(error.message),
        variant: "destructive"
      });
    } else {
      navigate("/dashboard");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para criar sua conta.",
        variant: "destructive"
      });
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive"
      });
      return;
    }

    if (signupPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    const { error } = await signUp(signupEmail.trim(), signupPassword, {
      nome: signupName.trim(),
      email: signupEmail.trim(),
      role: 'instrutor'
    });
    setSubmitting(false);

    if (error) {
      toast({
        title: "Erro ao criar conta",
        description: getFriendlyError(error.message),
        variant: "destructive"
      });
    } else {
      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar o cadastro.",
      });
      // Redirect to login tab or dashboard
      navigate("/dashboard");
    }
  };

  const handlePasswordReset = async () => {
    if (!loginEmail.trim()) {
      toast({
        title: "Email necessário",
        description: "Digite seu email no campo acima para resetar a senha.",
        variant: "destructive"
      });
      return;
    }

    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
      redirectTo: `${window.location.origin}/`
    });

    if (error) {
      toast({
        title: "Erro ao enviar email",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para resetar sua senha.",
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">
            Sistema Ministerial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="seu-email@exemplo.com"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                </div>

                {authError && (
                  <div className="text-sm text-destructive border border-destructive/20 rounded p-2 bg-destructive/10">
                    {getFriendlyError(authError)}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading || submitting}>
                  {submitting ? "Entrando..." : "Entrar"}
                </Button>
                
                <Button
                  type="button"
                  variant="link"
                  className="w-full text-sm"
                  onClick={handlePasswordReset}
                >
                  Esqueci minha senha
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Seu nome completo"
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="seu-email@exemplo.com"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirmar Senha</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>

                {authError && (
                  <div className="text-sm text-destructive border border-destructive/20 rounded p-2 bg-destructive/10">
                    {getFriendlyError(authError)}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading || submitting}>
                  {submitting ? "Criando conta..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
