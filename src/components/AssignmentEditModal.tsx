import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Users, Clock, AlertTriangle, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { assignmentEditSchema } from "@/components/forms/AssignmentFormSchema";
import { getZodFieldErrorStrings } from "@/utils/zodFieldErrors";

interface Student {
  id: string;
  nome_completo: string;
  cargo: string;
  genero: string;
}

interface Assignment {
  id: string;
  numero_parte: number;
  titulo_parte: string;
  tipo_parte: string;
  tempo_minutos: number;
  cena?: string;
  estudante: Student;
  ajudante?: Student;
  confirmado: boolean;
}

interface AssignmentEditModalProps {
  assignment: Assignment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAssignment: Assignment) => void;
  programId: string;
}

export const AssignmentEditModal: React.FC<AssignmentEditModalProps> = ({
  assignment,
  isOpen,
  onClose,
  onSave,
  programId
}) => {
  const [editedAssignment, setEditedAssignment] = useState<Assignment | null>(null);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (assignment) {
      setEditedAssignment({ ...assignment });
      setFieldErrors({});
      loadAvailableStudents();
    }
  }, [assignment]);

  const buildValidationData = (a: Assignment) => ({
    titulo_parte: a.titulo_parte,
    tempo_minutos: a.tempo_minutos,
    cena: a.cena,
    id_estudante: a.estudante?.id || "",
    id_ajudante: a.ajudante?.id || "",
  });

  const validateField = (field: string, next: Assignment) => {
    const errors = getZodFieldErrorStrings(assignmentEditSchema, buildValidationData(next));
    setFieldErrors(prev => {
      const updated = { ...prev };
      if (errors[field]) {
        updated[field] = errors[field];
      } else {
        delete updated[field];
      }
      return updated;
    });
  };

  const loadAvailableStudents = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('estudantes')
        .select(`
          id,
          genero,
          profiles!inner (
            nome,
            cargo
          )
        `)
        .eq('ativo', true);

      if (error) throw error;
      
      const transformedStudents = data?.map((estudante: any) => ({
        id: estudante.id,
        nome_completo: estudante.profiles?.nome || 'Nome não informado',
        cargo: estudante.profiles?.cargo || 'estudante_novo',
        genero: estudante.genero
      })) || [];
      
      setAvailableStudents(transformedStudents);

    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: "Erro ao Carregar Estudantes",
        description: "Não foi possível carregar a lista de estudantes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedAssignment) return;

    // Validação Zod — mensagens específicas por campo via error.issues
    const errors = getZodFieldErrorStrings(assignmentEditSchema, buildValidationData(editedAssignment));
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Verifique os Campos",
        description: "Corrija os erros destacados antes de salvar.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);

      // Update assignment in database
      const { error } = await supabase
        .from('designacoes')
        .update({
          titulo_parte: editedAssignment.titulo_parte,
          tempo_minutos: editedAssignment.tempo_minutos,
          cena: editedAssignment.cena,
          id_estudante: editedAssignment.estudante.id,
          id_ajudante: editedAssignment.ajudante?.id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editedAssignment.id);

      if (error) throw error;

      toast({
        title: "Designação Atualizada!",
        description: "As alterações foram salvas com sucesso.",
      });

      onSave(editedAssignment);
      onClose();

    } catch (error) {
      console.error('Error saving assignment:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getGenderRestrictionInfo = (tipo: string) => {
    const maleOnly = [
      'oracao_abertura', 'comentarios_iniciais', 'tesouros_palavra',
      'joias_espirituais', 'leitura_biblica', 'vida_crista',
      'estudo_biblico_congregacao', 'comentarios_finais', 'oracao_encerramento'
    ];
    
    return maleOnly.includes(tipo) 
      ? { restriction: 'Apenas Homens', icon: '♂️', color: 'text-blue-600' }
      : { restriction: 'Ambos os Gêneros', icon: '♂️♀️', color: 'text-green-600' };
  };

  const getFilteredStudents = (forHelper: boolean = false) => {
    if (!editedAssignment) return [];

    const genderInfo = getGenderRestrictionInfo(editedAssignment.tipo_parte);
    
    return availableStudents.filter(student => {
      // Apply gender restrictions
      if (genderInfo.restriction === 'Apenas Homens' && student.genero !== 'masculino') {
        return false;
      }
      
      // Don't show the same student as both main and helper
      if (forHelper && student.id === editedAssignment.estudante.id) {
        return false;
      }
      
      if (!forHelper && student.id === editedAssignment.ajudante?.id) {
        return false;
      }
      
      return true;
    });
  };

  if (!assignment || !editedAssignment) return null;

  const genderInfo = getGenderRestrictionInfo(editedAssignment.tipo_parte);
  const requiresHelper = editedAssignment.tipo_parte === 'parte_ministerio';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Editar Designação - Parte {editedAssignment.numero_parte}
          </DialogTitle>
          <DialogDescription>
            Modifique os detalhes da designação conforme necessário
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assignment Info */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Badge variant="outline" className="font-mono">
              {editedAssignment.numero_parte.toString().padStart(2, '0')}
            </Badge>
            <Badge className={genderInfo.color}>
              {genderInfo.icon} {genderInfo.restriction}
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {editedAssignment.tempo_minutos} min
            </Badge>
            {requiresHelper && (
              <Badge variant="outline" className="text-orange-600">
                <Users className="w-3 h-3 mr-1" />
                Requer Ajudante
              </Badge>
            )}
          </div>

          {/* Title and Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título da Parte</Label>
              <Input
                id="titulo"
                value={editedAssignment.titulo_parte}
                onChange={(e) => setEditedAssignment(prev => {
                  if (!prev) return null;
                  const next = { ...prev, titulo_parte: e.target.value };
                  validateField('titulo_parte', next);
                  return next;
                })}
                placeholder="Digite o título da parte"
                aria-invalid={!!fieldErrors.titulo_parte}
                className={fieldErrors.titulo_parte ? "border-red-500 focus:border-red-500" : ""}
              />
              {fieldErrors.titulo_parte && (
                <p className="text-xs text-red-600">{fieldErrors.titulo_parte}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tempo">Tempo (minutos)</Label>
              <Input
                id="tempo"
                type="number"
                min="1"
                max="60"
                value={editedAssignment.tempo_minutos}
                onChange={(e) => setEditedAssignment(prev => {
                  if (!prev) return null;
                  const next = { ...prev, tempo_minutos: parseInt(e.target.value) || 0 };
                  validateField('tempo_minutos', next);
                  return next;
                })}
                aria-invalid={!!fieldErrors.tempo_minutos}
                className={fieldErrors.tempo_minutos ? "border-red-500 focus:border-red-500" : ""}
              />
              {fieldErrors.tempo_minutos && (
                <p className="text-xs text-red-600">{fieldErrors.tempo_minutos}</p>
              )}
            </div>
          </div>

          {/* Scene/Context */}
          <div className="space-y-2">
            <Label htmlFor="cena">Cenário/Contexto (opcional)</Label>
            <Textarea
              id="cena"
              value={editedAssignment.cena || ''}
              onChange={(e) => setEditedAssignment(prev => {
                if (!prev) return null;
                const next = { ...prev, cena: e.target.value };
                validateField('cena', next);
                return next;
              })}
              placeholder="Descreva o cenário ou contexto da parte"
              rows={3}
              aria-invalid={!!fieldErrors.cena}
              className={fieldErrors.cena ? "border-red-500 focus:border-red-500" : ""}
            />
            {fieldErrors.cena && (
              <p className="text-xs text-red-600">{fieldErrors.cena}</p>
            )}
          </div>

          {/* Students Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Main Student */}
            <div className="space-y-2">
              <Label>Estudante Principal</Label>
              <Select
                value={editedAssignment.estudante.id}
                onValueChange={(value) => {
                  const student = availableStudents.find(s => s.id === value);
                  if (student) {
                    setEditedAssignment(prev => {
                      if (!prev) return null;
                      const next = { ...prev, estudante: student };
                      validateField('id_estudante', next);
                      return next;
                    });
                  }
                }}
              >
                <SelectTrigger className={fieldErrors.id_estudante ? "border-red-500" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredStudents(false).map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      <div className="flex items-center gap-2">
                        <span className="truncate">{student.nome_completo}</span>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {student.cargo}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.id_estudante && (
                <p className="text-xs text-red-600">{fieldErrors.id_estudante}</p>
              )}
            </div>

            {/* Helper Student */}
            {requiresHelper && (
              <div className="space-y-2">
                <Label>Ajudante</Label>
                <Select
                  value={editedAssignment.ajudante?.id || ''}
                  onValueChange={(value) => {
                    if (value === '') {
                      setEditedAssignment(prev => prev ? {
                        ...prev,
                        ajudante: undefined
                      } : null);
                    } else {
                      const student = availableStudents.find(s => s.id === value);
                      if (student) {
                        setEditedAssignment(prev => prev ? {
                          ...prev,
                          ajudante: student
                        } : null);
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ajudante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum ajudante</SelectItem>
                    {getFilteredStudents(true).map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        <div className="flex items-center gap-2">
                          <span className="truncate">{student.nome_completo}</span>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {student.cargo}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* S-38-T Compliance Warning */}
          {genderInfo.restriction === 'Apenas Homens' && editedAssignment.estudante.genero !== 'masculino' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Atenção: Esta parte requer um estudante do gênero masculino conforme as diretrizes S-38-T.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="w-full sm:w-auto"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
