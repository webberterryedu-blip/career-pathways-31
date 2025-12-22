import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, Users, Search, RefreshCw, UserCog, UserPlus, Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { z } from 'zod';

interface UserWithRole {
  id: string;
  email: string;
  nome: string;
  role: 'admin' | 'instrutor' | 'estudante';
  created_at: string;
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  instrutor: 'Instrutor',
  estudante: 'Estudante',
};

const roleBadgeVariants: Record<string, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  instrutor: 'secondary',
  estudante: 'outline',
};

const createUserSchema = z.object({
  email: z.string().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(72, 'Senha muito longa'),
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  role: z.enum(['admin', 'instrutor', 'estudante'])
});

type CreateUserData = z.infer<typeof createUserSchema>;

export default function AdminUsuarios() {
  const { profile, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    nome: '',
    role: 'instrutor'
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CreateUserData, string>>>({});

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, nome, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) {
        throw profilesError;
      }

      // Fetch roles for each user
      const usersWithRoles: UserWithRole[] = await Promise.all(
        (profiles || []).map(async (p) => {
          const { data: roleData } = await supabase.rpc('get_user_role', { _user_id: p.id });
          return {
            id: p.id,
            email: p.email || '',
            nome: p.nome || p.email?.split('@')[0] || 'Usuário',
            role: (roleData as 'admin' | 'instrutor' | 'estudante') || 'estudante',
            created_at: p.created_at || '',
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const validateForm = (): boolean => {
    try {
      createUserSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof CreateUserData, string>> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            errors[err.path[0] as keyof CreateUserData] = err.message;
          }
        });
        setFormErrors(errors);
      }
      return false;
    }
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nome: formData.nome
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error(`Erro ao criar usuário: ${authError.message}`);
        }
        return;
      }

      if (!authData.user) {
        toast.error('Erro ao criar usuário');
        return;
      }

      // Update the role if different from default (instrutor)
      if (formData.role !== 'instrutor') {
        // Wait a moment for the trigger to create the default role
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: formData.role })
          .eq('user_id', authData.user.id);

        if (roleError) {
          console.error('Error updating role:', roleError);
          toast.warning('Usuário criado, mas houve erro ao definir a role');
        }
      }

      toast.success('Usuário criado com sucesso!');
      setIsCreateDialogOpen(false);
      setFormData({ email: '', password: '', nome: '', role: 'instrutor' });
      setFormErrors({});
      
      // Refresh user list
      setTimeout(() => fetchUsers(), 1000);
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Erro ao criar usuário');
    } finally {
      setIsCreating(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'instrutor' | 'estudante') => {
    if (userId === profile?.id) {
      toast.error('Você não pode alterar seu próprio role');
      return;
    }

    setUpdatingUserId(userId);
    try {
      // First, delete existing role
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        throw deleteError;
      }

      // Then, insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (insertError) {
        throw insertError;
      }

      // Update local state
      setUsers(prev => 
        prev.map(u => u.id === userId ? { ...u, role: newRole } : u)
      );

      toast.success(`Role atualizado para ${roleLabels[newRole]}`);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erro ao atualizar role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    instrutores: users.filter(u => u.role === 'instrutor').length,
    estudantes: users.filter(u => u.role === 'estudante').length,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserCog className="h-8 w-8" />
            Gerenciar Usuários
          </h1>
          <p className="text-muted-foreground mt-1">
            Administre os roles e permissões dos usuários do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Preencha os dados para criar um novo usuário no sistema.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                  {formErrors.nome && (
                    <p className="text-sm text-destructive">{formErrors.nome}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                  {formErrors.email && (
                    <p className="text-sm text-destructive">{formErrors.email}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                  {formErrors.password && (
                    <p className="text-sm text-destructive">{formErrors.password}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value as CreateUserData['role'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="estudante">Estudante</SelectItem>
                      <SelectItem value="instrutor">Instrutor</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.role && (
                    <p className="text-sm text-destructive">{formErrors.role}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser} disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Usuário
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={fetchUsers} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instrutores</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.instrutores}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudantes</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.estudantes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            Selecione um role para alterar as permissões do usuário
          </CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role Atual</TableHead>
                  <TableHead>Alterar Role</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.nome}
                      {user.id === profile?.id && (
                        <Badge variant="outline" className="ml-2 text-xs">Você</Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariants[user.role]}>
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) => updateUserRole(user.id, value as 'admin' | 'instrutor' | 'estudante')}
                        disabled={user.id === profile?.id || updatingUserId === user.id}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="instrutor">Instrutor</SelectItem>
                          <SelectItem value="estudante">Estudante</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}