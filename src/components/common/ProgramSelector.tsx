import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';

interface Program {
  id: string;
  semana: string;
  data_inicio: string;
  mes_ano: string;
}

interface ProgramSelectorProps {
  programs: Program[];
  selectedProgramId: string | null;
  onSelect: (programId: string) => void;
  loading?: boolean;
}

export const ProgramSelector: React.FC<ProgramSelectorProps> = ({
  programs,
  selectedProgramId,
  onSelect,
  loading = false
}) => {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-muted-foreground" />
      <Select 
        value={selectedProgramId || ''} 
        onValueChange={onSelect}
        disabled={loading || programs.length === 0}
      >
        <SelectTrigger className="w-full max-w-md">
          <SelectValue placeholder="Selecione um programa semanal" />
        </SelectTrigger>
        <SelectContent>
          {programs.map((programa) => (
            <SelectItem key={programa.id} value={programa.id}>
              {programa.semana} - {programa.mes_ano}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
