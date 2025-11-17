// @ts-nocheck
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Edit, CheckCircle, User, Users, Clock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStudentContext } from "@/contexts/StudentContext";

export const AssignmentEditCard = ({ designacao, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const { students } = useStudentContext();
  
  const [formData, setFormData] = useState({
    estudante_id: designacao.estudante_id,
    assistente_id: designacao.assistente_id,
    observacoes: designacao.observacoes || ''
  });

  const statusColors = {
    designado: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    confirmado: "bg-green-500/10 text-green-700 border-green-500/20",
    cancelado: "bg-red-500/10 text-red-700 border-red-500/20"
  };

  const statusLabels = {
    designado: "Pendente",
    confirmado: "Confirmado",
    cancelado: "Cancelado"
  };

  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase
        .from('designacoes')
        .update({
          estudante_id: formData.estudante_id,
          assistente_id: formData.assistente_id || null,
          observacoes: formData.observacoes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', designacao.id);

      if (error) throw error;

      toast({
        title: "Designação Atualizada",
        description: "As alterações foram salvas com sucesso.",
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    }
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const { error } = await supabase
        .from('designacoes')
        .update({ 
          status: 'confirmado',
          confirmado_em: new Date().toISOString()
        })
        .eq('id', designacao.id);

      if (error) throw error;

      toast({
        title: "Designação Confirmada",
        description: "A designação foi confirmada com sucesso.",
      });

      onUpdate();
    } catch (error) {
      console.error('Erro ao confirmar:', error);
      toast({
        title: "Erro ao confirmar",
        description: "Não foi possível confirmar a designação.",
        variant: "destructive"
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = async () => {
    setIsCanceling(true);
    try {
      const { error } = await supabase
        .from('designacoes')
        .update({ 
          status: 'cancelado',
          cancelado_em: new Date().toISOString()
        })
        .eq('id', designacao.id);

      if (error) throw error;

      toast({
        title: "Designação Cancelada",
        description: "A designação foi cancelada.",
      });

      onUpdate();
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar a designação.",
        variant: "destructive"
      });
    } finally {
      setIsCanceling(false);
    }
  };

  // Filter students by gender for parte requirements
  const generoRequerido = designacao.parte?.genero_requerido;
  const availableStudents = generoRequerido 
    ? students.filter(s => s.genero === generoRequerido && s.ativo)
    : students.filter(s => s.ativo);

  const availableHelpers = students.filter(s => s.ativo);

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{designacao.parte?.titulo || 'Sem título'}</h3>
              <Badge variant="outline" className={statusColors[designacao.status]}>
                {statusLabels[designacao.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {designacao.parte?.duracao_min || 0} min
              </span>
              <span className="capitalize">
                {designacao.parte?.secao?.replace('_', ' ')}
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Designação</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Estudante Principal *</Label>
                    <Select 
                      value={formData.estudante_id}
                      onValueChange={(value) => setFormData({...formData, estudante_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStudents.map(student => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.nome} {student.sobrenome}
                            {student.genero === 'feminino' && ' (F)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {designacao.parte?.requer_assistente && (
                    <div className="space-y-2">
                      <Label>Assistente</Label>
                      <Select 
                        value={formData.assistente_id || ''}
                        onValueChange={(value) => setFormData({...formData, assistente_id: value || null})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um assistente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Sem assistente</SelectItem>
                          {availableHelpers
                            .filter(s => s.id !== formData.estudante_id)
                            .map(student => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.nome} {student.sobrenome}
                                {student.genero === 'feminino' && ' (F)'}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                      placeholder="Adicione observações sobre esta designação..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveEdit}>
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {designacao.status === 'designado' && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleConfirm}
                disabled={isConfirming}
              >
                <CheckCircle className="h-4 w-4 text-green-600" />
              </Button>
            )}

            {designacao.status !== 'cancelado' && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleCancel}
                disabled={isCanceling}
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {designacao.estudante?.nome} {designacao.estudante?.sobrenome}
            </span>
          </div>
        </div>

        {designacao.assistente_id && designacao.ajudante && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {designacao.ajudante.nome} {designacao.ajudante.sobrenome}
              </span>
            </div>
          </div>
        )}

        {designacao.observacoes && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
            {designacao.observacoes}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
