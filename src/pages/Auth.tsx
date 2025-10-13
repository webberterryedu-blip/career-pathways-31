import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, UserPlus, Calendar, Home, Church, UserCheck, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSwitch from "@/components/LanguageSwitch";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QuickAuthFix } from "@/components/auth/QuickAuthFix";
import { AuthErrorHandler } from "@/components/auth/AuthErrorHandler";

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { signIn, signUp, user, authError, clearAuthError, confirmUserDev, diagnoseAuthDev, fixProfileDev } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [congregacao, setCongregacao] = useState("");
  const [cargo, setCargo] = useState("");
  const [role, setRole] = useState<'instrutor' | 'estudante' | 'admin'>('instrutor');
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Evita loop de navegação: só redireciona se ainda estiver em /auth
    if (location.pathname === '/auth') {
      navigate('/dashboard', { replace: true });
    }
  }, [user?.id, location.pathname, navigate]);

  useEffect(() => {
    // Clear auth error when switching tabs
    if (authError) {
      clearAuthError();
    }
  }, [activeTab, authError, clearAuthError]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: t('forms.error'),
        description: t('auth.validation.emailRequired'),
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: t('forms.error'),
        description: t('auth.validation.emailInvalid'),
        variant: "destructive"
      });
      return;
    }

    if (!password.trim()) {
      toast({
        title: t('forms.error'),
        description: t('auth.validation.passwordRequired'),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        // The error is now handled in the AuthContext with user-friendly messages
        // We don't need to show a toast here as the error is displayed in the UI
      } else {
        toast({
          title: t('auth.success'),
          description: t('auth.loginSuccess'),
        });
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: t('forms.error'),
        description: 'Erro ao fazer login',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeCompleto.trim()) {
      toast({
        title: t('forms.error'),
        description: 'Nome completo é obrigatório',
        variant: "destructive"
      });
      return;
    }

    if (!signUpEmail.trim()) {
      toast({
        title: t('forms.error'),
        description: t('auth.validation.emailRequired'),
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(signUpEmail)) {
      toast({
        title: t('forms.error'),
        description: t('auth.validation.emailInvalid'),
        variant: "destructive"
      });
      return;
    }

    if (signUpPassword !== confirmPassword) {
      toast({
        title: t('forms.error'),
        description: t('auth.validation.passwordMismatch'),
        variant: "destructive"
      });
      return;
    }

    if (signUpPassword.length < 6) {
      toast({
        title: t('forms.error'),
        description: t('auth.validation.passwordMinLength'),
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(signUpEmail, signUpPassword, {
        nome: nomeCompleto,
        congregacao: congregacao,
        role: role
      });

      if (error) {
        // Error is handled in AuthContext, no toast needed
      } else {
        setSignUpSuccess(true);
        setActiveTab("login");
        // Clear form fields
        setSignUpEmail("");
        setSignUpPassword("");
        setConfirmPassword("");
        setNomeCompleto("");
        setCongregacao("");
        setCargo("");
        setDateOfBirth("");
      }
    } catch (error) {
      toast({
        title: t('forms.error'),
        description: 'Erro ao criar conta',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Redirecionando...</h2>
          <p>Você já está logado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="w-full p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Church className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-gray-900">Sistema Ministerial</h1>
              <p className="text-sm text-gray-600">Gestão da Escola do Ministério Teocrático</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSwitch />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              {t('navigation.home')}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-2 text-center pb-4">
            <CardTitle className="text-2xl font-bold">
              {activeTab === "login" ? t('auth.login') : t('auth.signup')}
            </CardTitle>
            <CardDescription>
              {activeTab === "login" 
                ? t('auth.loginDescription')
                : t('auth.signupDescription')
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Development notice */}
            {import.meta.env.DEV && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Modo de Desenvolvimento</AlertTitle>
                <AlertDescription>
                  Problemas de autenticação? As causas mais comuns são:
                  <div className="mt-2 font-medium">1. Confirmação de email obrigatória</div>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Acesse o painel do Supabase</li>
                    <li>Vá em Authentication &gt; Settings</li>
                    <li>Desative "Enable email confirmations"</li>
                    <li>Clique em "Save"</li>
                  </ul>
                  <div className="mt-2 font-medium">2. Problemas de permissão (RLS)</div>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Verifique se o perfil foi criado corretamente</li>
                    <li>Confirme que as políticas RLS estão configuradas</li>
                    <li>O campo user_id deve corresponder ao ID de autenticação</li>
                  </ul>
                  <div className="mt-2 font-medium">3. URL de redirecionamento incorreta</div>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Verifique se VITE_SITE_URL no arquivo .env está correto</li>
                    <li>Para desenvolvimento, use http://localhost:5173</li>
                  </ul>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => window.open('https://app.supabase.com/project/jbapewpuvfijrkhlbsid/auth/settings', '_blank')}
                      className="mr-2"
                    >
                      Abrir Supabase Dashboard
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        // Clear any existing error and suggest creating a new user
                        clearAuthError();
                        setActiveTab("signup");
                      }}
                      className="mr-2"
                    >
                      Criar Novo Usuário
                    </Button>
                    {diagnoseAuthDev && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={diagnoseAuthDev}
                        className="mr-2"
                      >
                        Diagnosticar Problemas
                      </Button>
                    )}
                    {fixProfileDev && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fixProfileDev(email, '1d112896-626d-4dc7-a758-0e5bec83fe6c')}
                      >
                        Corrigir Perfil
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-yellow-700">
                    <strong>Nota:</strong> Se o botão "Corrigir Perfil" falhar devido a políticas RLS, 
                    use o painel do Supabase para editar manualmente o perfil e definir o user_id correto.
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Success message for signup */}
            {signUpSuccess && (
              <Alert className="mb-4">
                <UserCheck className="h-4 w-4" />
                <AlertTitle>Cadastro realizado com sucesso!</AlertTitle>
                <AlertDescription>
                  Enviamos um email de confirmação para o seu endereço de email. 
                  Por favor, verifique sua caixa de entrada e clique no link de confirmação antes de fazer login.
                </AlertDescription>
              </Alert>
            )}

            {/* Enhanced Error Handler */}
            <AuthErrorHandler 
              error={authError}
              onClear={clearAuthError}
              onRetry={() => {
                clearAuthError();
                // Focus back to email input
                const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
                emailInput?.focus();
              }}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  {t('auth.login')}
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  {t('auth.signup')}
                </TabsTrigger>
              </TabsList>
              
              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('auth.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu-email@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="transition-all duration-200"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="pr-10 transition-all duration-200"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        {t('auth.signingIn')}
                      </div>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        {t('auth.login')}
                      </>
                    )}
                  </Button>
                </form>
                
                <div className="text-center text-sm text-gray-500 mt-4">
                  <p>
                    Se você acabou de se registrar, verifique seu email para o link de confirmação.
                  </p>
                  {import.meta.env.DEV && (
                    <p className="mt-2 text-xs text-blue-600">
                      Dica: Verifique as configurações de autenticação no painel do Supabase.
                    </p>
                  )}
                </div>
              </TabsContent>
              
              {/* Sign Up Tab */}
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Personal Information */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-sm">Informações Pessoais</h4>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nome-completo">Nome Completo</Label>
                      <Input
                        id="nome-completo"
                        type="text"
                        placeholder="João da Silva"
                        value={nomeCompleto}
                        onChange={(e) => setNomeCompleto(e.target.value)}
                        required
                        autoComplete="name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="date-of-birth">Data de Nascimento</Label>
                      <Input
                        id="date-of-birth"
                        type="date"
                        autoComplete="bday"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Congregation Information */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Church className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-sm">Informações da Congregação</h4>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="congregacao">Congregação</Label>
                      <Input
                        id="congregacao"
                        type="text"
                        autoComplete="organization"
                        placeholder="Congregação Central"
                        value={congregacao}
                        onChange={(e) => setCongregacao(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cargo">Cargo/Privilégio</Label>
                      <Input
                        id="cargo"
                        type="text"
                        autoComplete="organization-title"
                        placeholder="Ancião, Servo Ministerial, Pioneiro, etc."
                        value={cargo}
                        onChange={(e) => setCargo(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Função no Sistema</Label>
                      <Select value={role} onValueChange={(value: 'instrutor' | 'estudante' | 'admin') => setRole(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione sua função" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instrutor">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4" />
                              <span>Instrutor da Escola</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="estudante">
                            <div className="flex items-center gap-2">
                              <UserPlus className="h-4 w-4" />
                              <span>Estudante</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Login Credentials */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <LogIn className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-sm">Credenciais de Acesso</h4>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t('auth.email')}</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu-email@exemplo.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t('auth.password')}</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showSignUpPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          required
                          autoComplete="new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        >
                          {showSignUpPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        A senha deve ter pelo menos 6 caracteres
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">{t('auth.confirmPassword')}</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Criando conta...
                      </div>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        {t('auth.signup')}
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="w-full p-6 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <Badge variant="outline" className="flex items-center gap-1">
                <UserCheck className="h-3 w-3" />
                Instrutores
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <UserPlus className="h-3 w-3" />
                Estudantes
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Programação
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Church className="h-3 w-3" />
                Designações
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              Sistema Ministerial - Gestão da Escola do Ministério Teocrático
            </p>
          </div>
        </div>
      </footer>
      
      {/* Quick Auth Fix for Development */}
      {import.meta.env.DEV && <QuickAuthFix />}
    </div>
  );
};

export default AuthPage;