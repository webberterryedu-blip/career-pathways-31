// @ts-nocheck
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { debouncedAuthOperation } from '@/utils/authDebounce';

interface Profile {
  id: string;
  user_id?: string;
  nome: string;
  email: string;
  role: 'admin' | 'instrutor' | 'estudante';
  congregacao?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isInstrutor: boolean;
  isEstudante: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, profileData: Partial<Profile>) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshAuth: () => Promise<void>;
  clearAuthError: () => void;
  authError: string | null;
  updateProfile: (updates: Partial<Profile>) => Promise<{ data: any; error: any }>;
  // Development function to help with user confirmation
  confirmUserDev?: (email: string) => Promise<void>;
  // Development function to diagnose auth issues
  diagnoseAuthDev?: () => Promise<void>;
  // Development function to fix profile issues
  fixProfileDev?: (email: string, userId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  // 🚀 BYPASS DE DESENVOLVIMENTO - Remove isso em produção!
  const DEV_BYPASS = import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS === 'true';
  const FRANK_BYPASS = import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS === 'frank';
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // 🚀 BYPASS DE DESENVOLVIMENTO - Usuário fake para testes
  useEffect(() => {
    if (FRANK_BYPASS) {
      console.log('🚀 FRANK BYPASS ATIVO - Logando como Frank Webber');
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
      } as User;
      
      const frankProfile = {
        id: '1d112896-626d-4dc7-a758-0e5bec83fe6c',
        user_id: '1d112896-626d-4dc7-a758-0e5bec83fe6c',
        nome: 'Frank Webber',
        email: 'frankwebber33@hotmail.com',
        role: 'instrutor' as const,
        congregacao: 'Congregação Central',
        created_at: '2025-09-21T15:20:40.785506+00:00',
        updated_at: '2025-10-05T16:20:39.034069+00:00'
      };
      
      setUser(frankUser);
      setProfile(frankProfile);
      setLoading(false);
      setAuthError(null);
      return;
    } else if (DEV_BYPASS) {
      console.log('🚀 AUTH BYPASS ATIVO - Criando usuário fake para desenvolvimento');
      const fakeUser = {
        id: 'dev-user-123',
        email: 'dev@test.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        confirmation_sent_at: null,
        confirmed_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        phone: null,
        phone_confirmed_at: null,
        last_sign_in_at: new Date().toISOString(),
        role: 'authenticated',
        identities: []
      } as User;
      
      const fakeProfile = {
        id: 'dev-user-123',
        user_id: 'dev-user-123',
        nome: 'Desenvolvedor',
        email: 'dev@test.com',
        role: 'admin' as const,
        congregacao: 'Congregação de Desenvolvimento',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setUser(fakeUser);
      setProfile(fakeProfile);
      setLoading(false);
      setAuthError(null);
      return;
    }

    // 🚀 VERIFICAR LOGIN DIRETO DO FRANK
    const checkDirectLogin = () => {
      try {
        const frankLoggedIn = localStorage.getItem('frank-logged-in');
        const frankUserData = localStorage.getItem('frank-user');
        
        if (frankLoggedIn === 'true' && frankUserData) {
          const userData = JSON.parse(frankUserData);
          console.log('🚀 LOGIN DIRETO DETECTADO - Frank Webber');
          
          const frankUser = {
            id: userData.id,
            email: userData.email,
            created_at: '2025-09-21T15:20:40.785506+00:00',
            updated_at: '2025-10-05T16:20:39.034069+00:00',
            app_metadata: { provider: 'email', providers: ['email'] },
            user_metadata: userData,
            aud: 'authenticated',
            confirmation_sent_at: '2025-09-21T17:17:55.037637+00:00',
            confirmed_at: '2025-10-03T13:54:42.116467+00:00',
            email_confirmed_at: '2025-10-03T13:54:42.116467+00:00',
            phone: null,
            phone_confirmed_at: null,
            last_sign_in_at: new Date().toISOString(),
            role: 'authenticated',
            identities: []
          } as User;
          
          const frankProfile = {
            id: userData.id,
            user_id: userData.id,
            nome: userData.nome,
            email: userData.email,
            role: userData.role as 'admin' | 'instrutor' | 'estudante',
            congregacao: 'Congregação Central',
            created_at: '2025-09-21T15:20:40.785506+00:00',
            updated_at: '2025-10-05T16:20:39.034069+00:00'
          };
          
          setUser(frankUser);
          setProfile(frankProfile);
          setLoading(false);
          setAuthError(null);
          return true;
        }
      } catch (error) {
        console.warn('Erro ao verificar login direto:', error);
      }
      return false;
    };

    if (!checkDirectLogin()) {
      // Continuar com autenticação normal se não há login direto
    }
  }, [DEV_BYPASS]);

  // Load user profile with improved error handling and fallback
  const loadProfile = useCallback(async (userId: string) => {
    // Check if we already have the profile for this user to avoid unnecessary calls
    if (profile && profile.id === userId) {
      if (import.meta.env.DEV) console.log('Profile already loaded for user:', userId);
      return profile;
    }
    
    try {
      if (import.meta.env.DEV) console.log('Loading profile for user:', userId);
      
      // In development, we might have RLS issues, so we'll try a different approach
      if (import.meta.env.DEV) {
        // First try to get profile by user_id (new schema) with error handling
        let { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId as any)
          .maybeSingle();

        // If that fails due to RLS, it means the user_id in the profile doesn't match auth.uid()
        if (profileError && profileError.message.includes('406')) {
          console.log('RLS error encountered - user_id mismatch. Attempting to fix...');
          
          // Try to find the profile by email instead
          const { data: emailProfileData, error: emailProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', (await supabase.auth.getUser()).data.user?.email || '')
            .maybeSingle();
          
          if (emailProfileData && !emailProfileError) {
            // Found profile by email, but user_id doesn't match
            // This is a data inconsistency issue
            console.log('Found profile by email but user_id mismatch. Profile needs to be fixed.');
            
            // Update the profile to have the correct user_id
            const { data: updatedProfile, error: updateError } = await supabase
              .from('profiles')
              .update({ user_id: userId })
              .eq('id', emailProfileData.id)
              .select('*')
              .single();
            
            if (updatedProfile && !updateError) {
              console.log('Fixed profile user_id mismatch');
              profileData = updatedProfile;
              profileError = null;
            } else {
              console.error('Failed to fix profile user_id:', updateError);
              setAuthError(`Erro de permiss�o (406). O perfil existe mas o user_id n�o corresponde ao seu ID de autentica��o. Tente:\n1. Criar um novo usu�rio\n2. Ou contate um administrador para corrigir o perfil existente.`);
              return null;
            }
          } else {
            // No profile found by email either
            console.log('No profile found by email either. Creating new profile...');
            setAuthError(`Erro de permiss�o (406). Nenhum perfil encontrado para seu usu�rio. Criando um novo perfil...`);
            
            // Create profile from user data
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
              const newProfile: any = {
                user_id: userId,
                nome: userData.user.user_metadata?.nome || userData.user.email?.split('@')[0] || 'Usu�rio',
                email: userData.user.email || '',
                role: userData.user.user_metadata?.role || 'instrutor',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };

              const { data: createdProfile, error: createError } = await supabase
                .from('profiles')
                .insert(newProfile as any)
                .select('*')
                .single();

              if (createError) {
                console.error('Error creating profile:', createError);
                setAuthError('Erro ao criar perfil: ' + createError.message);
                return null;
              } else if (createdProfile && typeof createdProfile === 'object' && createdProfile !== null && 'id' in createdProfile) {
                profileData = createdProfile;
                profileError = null;
              }
            }
          }
        }

        // If that fails, try by id (old schema)
        if (profileError || !profileData) {
          ({ data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId as any)
            .maybeSingle());
        }

        if (profileError) {
          console.error('Error loading profile:', profileError);
          setAuthError(`Erro ao carregar perfil: ${profileError.message}`);
          return null;
        }

        if (profileData && typeof profileData === 'object' && profileData !== null && 'id' in profileData) {
          if (import.meta.env.DEV) console.log('Profile loaded successfully:', profileData);
          
          // Fetch role from user_roles table using get_user_role function
          let userRole: 'admin' | 'instrutor' | 'estudante' = 'estudante';
          try {
            const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: userId });
            if (roleData && (roleData === 'admin' || roleData === 'instrutor' || roleData === 'estudante')) {
              userRole = roleData;
            }
          } catch (roleError) {
            console.warn('Could not fetch role from user_roles, using fallback:', roleError);
            // Fallback to profile.role for backwards compatibility
            if (profileData.role === 'admin' || profileData.role === 'instrutor' || profileData.role === 'estudante') {
              userRole = profileData.role;
            }
          }
          
          const updatedProfile: Profile = { 
            id: profileData.id,
            user_id: profileData.user_id || profileData.id,
            nome: (profileData.nome as string) || (profileData.email as string)?.split('@')[0] || 'Usuário',
            email: (profileData.email as string) || '',
            role: userRole,
            congregacao: profileData.congregacao || (profileData as any).congregacao_id || null,
            created_at: (profileData.created_at as string) || null,
            updated_at: (profileData.updated_at as string) || null
          };
          setProfile(updatedProfile);
          setAuthError(null);
          return updatedProfile;
        }
      } else {
        // Production behavior unchanged
        // First try to get profile by user_id (new schema)
        let { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId as any)
          .maybeSingle();

        // If that fails, try by id (old schema)
        if (profileError || !profileData) {
          ({ data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId as any)
            .maybeSingle());
        }

        if (profileError) {
          console.error('Error loading profile:', profileError);
          setAuthError(`Erro ao carregar perfil: ${profileError.message}`);
          return null;
        }

        if (profileData && typeof profileData === 'object' && profileData !== null && 'id' in profileData) {
          if (import.meta.env.DEV) console.log('Profile loaded successfully:', profileData);
          
          // Fetch role from user_roles table using get_user_role function
          let userRole: 'admin' | 'instrutor' | 'estudante' = 'estudante';
          try {
            const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: userId });
            if (roleData && (roleData === 'admin' || roleData === 'instrutor' || roleData === 'estudante')) {
              userRole = roleData;
            }
          } catch (roleError) {
            console.warn('Could not fetch role from user_roles, using fallback:', roleError);
            // Fallback to profile.role for backwards compatibility
            if (profileData.role === 'admin' || profileData.role === 'instrutor' || profileData.role === 'estudante') {
              userRole = profileData.role;
            }
          }
          
          const updatedProfile: Profile = { 
            id: profileData.id,
            user_id: profileData.user_id || profileData.id,
            nome: (profileData.nome as string) || (profileData.email as string)?.split('@')[0] || 'Usuário',
            email: (profileData.email as string) || '',
            role: userRole,
            congregacao: profileData.congregacao || (profileData as any).congregacao_id || null,
            created_at: (profileData.created_at as string) || null,
            updated_at: (profileData.updated_at as string) || null
          };
          setProfile(updatedProfile);
          setAuthError(null);
          return updatedProfile;
        }
      }
      return null;
    } catch (error) {
      console.error('Error in loadProfile:', error);
      setAuthError('Erro interno ao carregar perfil: ' + (error as Error).message);
      return null;
    }
  }, [profile]);

  // Handle auth state changes with improved error handling
  const handleAuthStateChange = useCallback(async (event: any, session: Session | null) => {
    if (import.meta.env.DEV) console.log('Auth state changed:', event, session?.user?.id);
    
    try {
      if (event === 'SIGNED_IN' && session) {
        if (import.meta.env.DEV) console.log('User signed in:', session.user.id);
        setUser(session.user);
        setLoading(true);
        
        // Direct call to loadProfile with improved error handling
        try {
          await loadProfile(session.user.id);
          setAuthError(null);
        } catch (error) {
          console.error('Error loading profile during sign in:', error);
          setAuthError('Erro ao carregar perfil durante login');
        }
      } else if (event === 'SIGNED_OUT') {
        if (import.meta.env.DEV) console.log('User signed out');
        setUser(null);
        setProfile(null);
        setAuthError(null);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        if (import.meta.env.DEV) console.log('Token refreshed for user:', session.user.id);
        setUser(session.user);
        
        // Only load profile if we don't have it yet or if user ID changed
        if (!profile || (profile.user_id !== session.user.id && profile.id !== session.user.id)) {
          setLoading(true);
          try {
            await loadProfile(session.user.id);
            setAuthError(null);
          } catch (error) {
            console.error('Error loading profile during token refresh:', error);
            setAuthError('Erro ao atualizar perfil');
          }
        }
      }
    } catch (error) {
      console.error('Error handling auth state change:', error);
      setAuthError('Erro ao processar mudan�a de autentica��o');
    } finally {
      setLoading(false);
    }
  }, [loadProfile, profile]);

  // Refresh auth state with direct profile loading
  const refreshAuth = useCallback(async () => {
    try {
      if (import.meta.env.DEV) console.log('Refreshing authentication...');
      setLoading(true);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setAuthError(`Erro de sess�o: ${sessionError.message}`);
        return;
      }

      if (session) {
        if (import.meta.env.DEV) console.log('Valid session found');
        setUser(session.user);
        
        // Only load profile if we don't already have it for this user
        if (!profile || (profile.user_id !== session.user.id && profile.id !== session.user.id)) {
          setLoading(true);
          try {
            // Direct call to loadProfile which now has built-in checks
            await loadProfile(session.user.id);
          } catch (error) {
            console.error('Error loading profile during refresh:', error);
            setAuthError('Erro ao atualizar perfil');
          }
        }
      } else {
        if (import.meta.env.DEV) console.log('No valid session found');
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
      setAuthError('Erro ao verificar sess�o');
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [loadProfile, profile]);

  // Sign in with comprehensive error handling
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      setLoading(true);
      setAuthError(null);

      // First try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Enhanced error logging for development
        if (import.meta.env.DEV) {
          console.group('🔐 Authentication Error');
          console.error('Error Details:', signInError);
          console.log('Email:', email);
          console.log('Error Code:', signInError.status);
          console.log('Error Message:', signInError.message);
          console.log('💡 Quick Fix: debugAuth.createTestUser("admin@test.com", "123456")');
          console.groupEnd();
        } else {
          console.error('Sign in error:', signInError);
        }
        
        // Handle specific error cases with detailed user-friendly messages
        let errorMessage = signInError.message;
        
        if (signInError.message.includes('Invalid login credentials')) {
          // Since we know the user exists and is confirmed, this might be a profile issue
          errorMessage = `CREDENCIAIS INV�LIDAS

Poss�veis causas:
1. Senha incorreta para frankwebber33@hotmail.com
2. Problemas com o perfil do usu�rio

Solu��es imediatas:
1. Redefina sua senha no painel do Supabase
2. Crie um novo usu�rio de teste
3. Verifique se o perfil foi criado corretamente

Para redefinir sua senha:
1. Acesse https://app.supabase.com/project/jbapewpuvfijrkhlbsid
2. V� em Authentication > Users
3. Encontre frankwebber33@hotmail.com
4. Clique nos tr�s pontos > "Reset Password"
5. Defina uma nova senha
6. Use essa senha para fazer login`;
        } else if (signInError.message.includes('Email not confirmed')) {
          errorMessage = 'Seu email ainda n�o foi confirmado.\n\nSolu��es:\n� Verifique sua caixa de entrada e spam pelo email de confirma��o\n� Clique no link de confirma��o no email\n� Se n�o recebeu o email, pe�a reenvio atrav�s do formul�rio de login';
        }
        
        // Add development-specific guidance
        if (import.meta.env.DEV) {
          errorMessage += '\n\nDICA PARA DESENVOLVEDORES:\n� Verifique se o perfil tem o user_id correto\n� Confira as pol�ticas RLS\n� Tente criar um novo usu�rio';
        }
        
        setAuthError(errorMessage);
        return { error: signInError };
      }

      console.log('Sign in successful');
      return { error: null };
    } catch (error: any) {
      console.error('Unexpected error during sign in:', error);
      setAuthError('Erro inesperado durante o login. Por favor, tente novamente.\n\nSe o problema persistir, reinicie o servidor de desenvolvimento e tente novamente.');
      return { error: error };
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign up with proper redirect URL configuration using environment variables
  const signUp = useCallback(async (email: string, password: string, profileData: Partial<Profile>) => {
    try {
      console.log('Attempting sign up for:', email);
      setLoading(true);
      setAuthError(null);

      // Configure redirect URL based on environment variables
      // In development, we typically want to redirect to localhost
      // In production, we want to redirect to the actual site
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      let redirectUrl = `${siteUrl}/auth`;
      
      // For development, we might want to disable email confirmation redirects entirely
      // to avoid issues with email confirmation flows
      const emailRedirectTo = import.meta.env.DEV ? undefined : redirectUrl;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Only set emailRedirectTo in production to avoid redirect issues in development
          ...(emailRedirectTo ? { emailRedirectTo } : {}),
          data: {
            nome: profileData.nome,
            role: profileData.role || 'instrutor'
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        let errorMessage = error.message;
        
        // Handle specific error cases
        if (error.message.includes('email_address_invalid')) {
          errorMessage = 'Formato de email inv�lido. Por favor, verifique o endere�o de email.';
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'Este email j� est� registrado. Por favor, fa�a login ou use um email diferente.';
        }
        
        setAuthError(errorMessage);
        return { error };
      }

      console.log('Sign up successful');
      // In development, inform user that they can login directly without email confirmation
      if (import.meta.env.DEV) {
        setAuthError('Registro realizado com sucesso! Em modo de desenvolvimento, voc� pode fazer login diretamente. Em produ��o, ser� necess�rio confirmar o email.');
      } else {
        setAuthError('Registro realizado com sucesso! Por favor, verifique seu email para o link de confirma��o antes de fazer login.');
      }
      return { error: null };
    } catch (error: any) {
      console.error('Unexpected error during sign up:', error);
      setAuthError('Erro inesperado durante o registro. Por favor, tente novamente.');
      return { error: error };
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      console.log('Signing out...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        setAuthError(error.message);
        return { error };
      }

      setUser(null);
      setProfile(null);
      setAuthError(null);
      console.log('Sign out successful');
      return { error: null };
    } catch (error: any) {
      console.error('Unexpected error during sign out:', error);
      setAuthError('Erro durante o logout. Por favor, atualize a p�gina.');
      return { error: error };
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    try {
      if (!user) {
        return { data: null, error: { message: 'No user logged in' } };
      }
      
      console.log('Updating profile for user_id:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('user_id', user.id as any)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return { data: null, error };
      }
      
      if (data && typeof data === 'object' && data !== null && 'id' in data) {
        const updatedProfile: Profile = {
          id: data.id,
          user_id: data.user_id || data.id,
          nome: (data.nome as string) || (data.email as string)?.split('@')[0] || 'Usu�rio',
          email: (data.email as string) || '',
          role: ((data.role === 'admin' || data.role === 'instrutor' || data.role === 'estudante') 
            ? data.role 
            : (data.cargo === 'admin' || data.cargo === 'instrutor') 
              ? data.cargo 
              : 'estudante') as 'admin' | 'instrutor' | 'estudante',
          congregacao: data.congregacao || (data as any).congregacao_id || null,
          created_at: (data.created_at as string) || null,
          updated_at: (data.updated_at as string) || null
        };
        setProfile(updatedProfile);
        return { data: updatedProfile, error: null };
      }
      
      return { data: null, error: null };
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return { data: null, error };
    }
  }, [user]);

  // Clear auth error
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Initialize auth listener
  useEffect(() => {
    if (import.meta.env.DEV) console.log('Setting up auth listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    
    // Get initial session
    refreshAuth();

    return () => {
      if (import.meta.env.DEV) console.log('Cleaning up auth listener...');
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange, refreshAuth]);

  // Computed values
  const isAdmin = profile?.role === 'admin';
  const isInstrutor = profile?.role === 'instrutor' || profile?.role === 'admin';
  const isEstudante = profile?.role === 'estudante';

  // Development function to confirm users (only works in development)
  const confirmUserDev = import.meta.env.DEV ? async (email: string) => {
    console.log('Attempting to confirm user in development:', email);
    // This is a placeholder - actual implementation would require service role key
    // For now, just provide guidance to the user
    setAuthError(`Para confirmar o usu�rio ${email}:
1. V� para o painel do Supabase
2. Authentication > Users
3. Encontre o usu�rio e clique "Confirm user"

OU

Desative a confirma��o de email nas configura��es do Supabase.`);
  } : undefined;

  // Development function to diagnose authentication issues
  const diagnoseAuthDev = import.meta.env.DEV ? async () => {
    console.log('=== AUTHENTICATION DIAGNOSIS ===');
    
    try {
      // Check current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', session);
      console.log('Session error:', sessionError);
      
      let diagnosticMessage = 'Diagn�stico completo:\n';
      
      if (session) {
        diagnosticMessage += '� Sess�o ativa encontrada\n';
        diagnosticMessage += `� User ID: ${session.user.id}\n`;
        diagnosticMessage += `� Email: ${session.user.email}\n`;
        diagnosticMessage += `� Confirmado: ${session.user.email_confirmed_at ? 'Sim' : 'N�o'}\n`;
      } else {
        diagnosticMessage += '� Nenhuma sess�o ativa\n';
      }
      
      // Check if we can access profiles table at all
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      console.log('Profiles table access:', profilesData);
      console.log('Profiles table error:', profilesError);
      
      if (profilesError) {
        if (profilesError.message.includes('406')) {
          diagnosticMessage += '� Erro de permiss�o RLS ao acessar perfis\n';
          
          // Try to find the user's profile specifically
          if (session) {
            // Try by user_id
            const { data: userByIdProfile, error: userByIdError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (userByIdProfile) {
              diagnosticMessage += '� Perfil encontrado com user_id correto\n';
            } else if (userByIdError && userByIdError.message.includes('406')) {
              diagnosticMessage += '� Perfil existe mas user_id n�o corresponde (problema de dados)\n';
            } else {
              // Try by email
              const { data: userByEmailProfile, error: userByEmailError } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', session.user.email)
                .maybeSingle();
              
              if (userByEmailProfile) {
                diagnosticMessage += '� Perfil encontrado por email, mas user_id incorreto\n';
                if (userByEmailProfile.user_id !== session.user.id) {
                  diagnosticMessage += `  user_id no perfil: ${userByEmailProfile.user_id}\n`;
                  diagnosticMessage += `  user_id de auth: ${session.user.id}\n`;
                }
              } else {
                diagnosticMessage += '� Nenhum perfil encontrado para este usu�rio\n';
              }
            }
          }
          
          diagnosticMessage += '  Solu��o: Corrigir o user_id no perfil ou criar novo perfil\n';
        } else {
          diagnosticMessage += `� Erro ao acessar perfis: ${profilesError.message}\n`;
        }
      } else {
        diagnosticMessage += '� Acesso a perfis funcionando\n';
      }
      
      diagnosticMessage += '\nSolu��o recomendada:\n';
      diagnosticMessage += '1. Tente criar um novo usu�rio\n';
      diagnosticMessage += '2. Ou verifique se o perfil tem o user_id correto\n';
      
      setAuthError(diagnosticMessage);
    } catch (error) {
      console.error('Diagnosis error:', error);
      setAuthError('Erro durante o diagn�stico: ' + (error as Error).message);
    }
  } : undefined;

  // Development function to fix profile issues
  const fixProfileDev = import.meta.env.DEV ? async (email: string, userId: string) => {
    console.log('=== ATTEMPTING TO FIX PROFILE ===');
    
    try {
      // First, try to get the current authenticated user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Failed to get current user:', userError);
        setAuthError('Falha ao obter usu�rio atual: ' + userError.message);
        return false;
      }
      
      console.log('Current authenticated user:', currentUser);
      
      // Try to find the profile by email
      const { data: profileByEmail, error: emailError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      
      if (profileByEmail) {
        console.log('Found profile by email:', profileByEmail);
        
        // Check if user_id matches
        if (profileByEmail.user_id === userId) {
          console.log('Profile user_id is correct');
          setAuthError('Perfil encontrado e user_id est� correto. O problema pode ser outro.');
          return true;
        } else {
          console.log('Profile user_id mismatch. Attempting to fix...');
          
          // Try to update the profile with correct user_id
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ user_id: userId })
            .eq('id', profileByEmail.id)
            .select('*')
            .single();
          
          if (updatedProfile && !updateError) {
            console.log('Profile fixed successfully');
            setAuthError('Perfil corrigido com sucesso! Tente fazer login novamente.');
            return true;
          } else {
            console.error('Failed to update profile:', updateError);
            
            // If we can't update due to RLS, suggest manual fix
            setAuthError(`Falha ao corrigir perfil devido a pol�ticas de seguran�a (RLS).

Solu��o recomendada:
1. V� para o painel do Supabase
2. Table Editor > profiles
3. Encontre o perfil com email: ${email}
4. Edite o campo user_id para: ${userId}
5. Salve as altera��es`);
            return false;
          }
        }
      } else {
        console.log('No profile found by email. Creating new profile...');
        
        // Create a new profile with the correct user_id
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            email: email,
            nome: email.split('@')[0],
            role: 'instrutor',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single();
        
        if (newProfile && !createError) {
          console.log('New profile created successfully');
          setAuthError('Novo perfil criado com sucesso! Tente fazer login novamente.');
          return true;
        } else {
          console.error('Failed to create profile:', createError);
          
          // If we can't create due to RLS, suggest manual fix
          setAuthError(`Falha ao criar perfil devido a pol�ticas de seguran�a (RLS).

Solu��o recomendada:
1. V� para o painel do Supabase
2. Table Editor > profiles
3. Clique em "Insert" para adicionar um novo perfil
4. Preencha os campos:
   - user_id: ${userId}
   - email: ${email}
   - nome: ${email.split('@')[0]}
   - role: instrutor
5. Salve as altera��es`);
          return false;
        }
      }
    } catch (error) {
      console.error('Error fixing profile:', error);
      setAuthError('Erro ao tentar corrigir perfil: ' + (error as Error).message);
      return false;
    }
  } : undefined;

  const value: AuthContextType = {
    user,
    profile,
    isAdmin,
    isInstrutor,
    isEstudante,
    loading,
    signIn,
    signUp,
    signOut,
    refreshAuth,
    clearAuthError,
    authError,
    updateProfile,
    confirmUserDev,
    diagnoseAuthDev,
    fixProfileDev
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
