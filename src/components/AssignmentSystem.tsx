import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface AssignmentSystemProps {
  programId: string;
  onAssignmentCreated?: () => void;
}

const AssignmentSystem: React.FC<AssignmentSystemProps> = ({ programId, onAssignmentCreated }) => {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedPart, setSelectedPart] = useState('');
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [parts] = useState([
    { id: 'treasures', name: 'Tesouros da Palavra de Deus', time: '10 min' },
    { id: 'ministry', name: 'Faça Seu Melhor no Ministério', time: '15 min' },
    { id: 'christian_life', name: 'Nossa Vida Cristã', time: '15 min' }
  ]);

  React.useEffect(() => {
    loadStudents();
  }, [user?.id]);

  const loadStudents = async () => {
    if (!user?.id) return;
    
    try {
      const { data } = await supabase
        .from('estudantes')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true);
      
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students');
    }
  };

  const createAssignment = async () => {
    if (!selectedStudent || !selectedPart || !programId) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('designacoes')
        .insert({
          estudante_id: selectedStudent,
          parte_id: selectedPart,
          user_id: user?.id,
          status: 'designado'
        });

      if (!error) {
        setSelectedStudent('');
        setSelectedPart('');
        onAssignmentCreated?.();
      }
    } catch (error) {
      console.error('Error creating assignment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Designação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Estudante</label>
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um estudante" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Parte da Reunião</label>
          <Select value={selectedPart} onValueChange={setSelectedPart}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma parte" />
            </SelectTrigger>
            <SelectContent>
              {parts.map((part) => (
                <SelectItem key={part.id} value={part.id}>
                  {part.name} ({part.time})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={createAssignment} 
          disabled={!selectedStudent || !selectedPart || loading}
          className="w-full"
        >
          {loading ? 'Criando...' : 'Criar Designação'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AssignmentSystem;