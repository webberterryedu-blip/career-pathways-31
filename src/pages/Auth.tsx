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
  const [resetEmail, setResetEmail] = useState("");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
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
        description: "Você já pode fazer login.",
      });
      // Clear signup form
      setSignupEmail("");
      setSignupPassword("");
      setSignupName("");
      setSignupConfirmPassword("");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Digite seu email para recuperar a senha.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);

    if (error) {
      toast({
        title: "Erro ao enviar email",
        description: "Verifique o email digitado e tente novamente.",
        variant: "destructive"
      });
    } else {
      setResetEmailSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
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
                  onClick={() => {
                    const forgotTab = document.querySelector('[value="forgot"]') as HTMLElement;
                    forgotTab?.click();
                  }}
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

            <TabsContent value="forgot">
              {resetEmailSent ? (
                <div className="text-center py-8 space-y-4">
                  <div className="text-6xl mb-4">✉️</div>
                  <p className="text-lg font-medium">Email enviado!</p>
                  <p className="text-muted-foreground">
                    Verifique sua caixa de entrada e clique no link para redefinir sua senha.
                  </p>
                  <Button 
                    onClick={() => {
                      setResetEmailSent(false);
                      setResetEmail("");
                      const loginTab = document.querySelector('[value="login"]') as HTMLElement;
                      loginTab?.click();
                    }}
                    variant="outline"
                    className="mt-4"
                  >
                    Voltar ao Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Digite seu email e enviaremos um link para redefinir sua senha.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      disabled={submitting}
                      autoComplete="email"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={submitting || loading}
                  >
                    {submitting ? "Enviando..." : "Enviar Link de Recuperação"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => {
                      const loginTab = document.querySelector('[value="login"]') as HTMLElement;
                      loginTab?.click();
                    }}
                  >
                    Voltar ao Login
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
