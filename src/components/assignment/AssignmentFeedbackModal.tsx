import { useState } from 'react';
import { Star, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAssignmentCommunication } from '@/hooks/useAssignmentCommunication';

interface AssignmentFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  studentId: string;
  partTitle: string;
  weekDate: string;
}

const IMPROVEMENT_AREAS = [
  'Preparação do material',
  'Contato visual',
  'Uso da voz',
  'Gestos e postura',
  'Uso do tempo',
  'Aplicação prática',
  'Interação com o ajudante',
  'Uso das Escrituras'
];

const STRENGTHS = [
  'Boa preparação',
  'Apresentação natural',
  'Uso eficaz das Escrituras',
  'Boa aplicação prática',
  'Excelente timing',
  'Boa interação',
  'Voz clara e expressiva',
  'Postura confiante'
];

/**
 * AssignmentFeedbackModal - Collects feedback for completed assignments
 * Allows students and instructors to provide ratings and comments
 */
export default function AssignmentFeedbackModal({
  isOpen,
  onClose,
  assignmentId,
  studentId,
  partTitle,
  weekDate
}: AssignmentFeedbackModalProps) {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [comments, setComments] = useState('');
  const [selectedImprovements, setSelectedImprovements] = useState<string[]>([]);
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { submitFeedback } = useAssignmentCommunication();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      await submitFeedback(assignmentId, studentId, {
        rating,
        comments: comments.trim() || undefined,
        areas_for_improvement: selectedImprovements.length > 0 ? selectedImprovements : undefined,
        strengths: selectedStrengths.length > 0 ? selectedStrengths : undefined
      });
      
      onClose();
      
      // Reset form
      setRating(5);
      setComments('');
      setSelectedImprovements([]);
      setSelectedStrengths([]);
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImprovementToggle = (area: string) => {
    setSelectedImprovements(prev => 
      prev.includes(area) 
        ? prev.filter(item => item !== area)
        : [...prev, area]
    );
  };

  const handleStrengthToggle = (strength: string) => {
    setSelectedStrengths(prev => 
      prev.includes(strength) 
        ? prev.filter(item => item !== strength)
        : [...prev, strength]
    );
  };

  const StarRating = () => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star as 1 | 2 | 3 | 4 | 5)}
          className="p-1 hover:scale-110 transition-transform"
        >
          <Star
            className={`h-6 w-6 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-600">
        {rating === 1 && 'Precisa melhorar'}
        {rating === 2 && 'Razoável'}
        {rating === 3 && 'Bom'}
        {rating === 4 && 'Muito bom'}
        {rating === 5 && 'Excelente'}
      </span>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Avaliação da Designação
          </DialogTitle>
          <DialogDescription>
            Avalie a apresentação "{partTitle}" da semana de {weekDate}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Rating */}
          <div>
            <Label className="text-base font-medium">Avaliação Geral</Label>
            <p className="text-sm text-gray-600 mb-3">
              Como você avalia a apresentação de forma geral?
            </p>
            <StarRating />
          </div>

          {/* Strengths */}
          <div>
            <Label className="text-base font-medium">Pontos Fortes</Label>
            <p className="text-sm text-gray-600 mb-3">
              Selecione os aspectos que foram bem executados:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {STRENGTHS.map((strength) => (
                <div key={strength} className="flex items-center space-x-2">
                  <Checkbox
                    id={`strength-${strength}`}
                    checked={selectedStrengths.includes(strength)}
                    onCheckedChange={() => handleStrengthToggle(strength)}
                  />
                  <Label 
                    htmlFor={`strength-${strength}`}
                    className="text-sm cursor-pointer"
                  >
                    {strength}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Areas for Improvement */}
          <div>
            <Label className="text-base font-medium">Áreas para Melhoria</Label>
            <p className="text-sm text-gray-600 mb-3">
              Selecione aspectos que podem ser aprimorados (opcional):
            </p>
            <div className="grid grid-cols-2 gap-2">
              {IMPROVEMENT_AREAS.map((area) => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    id={`improvement-${area}`}
                    checked={selectedImprovements.includes(area)}
                    onCheckedChange={() => handleImprovementToggle(area)}
                  />
                  <Label 
                    htmlFor={`improvement-${area}`}
                    className="text-sm cursor-pointer"
                  >
                    {area}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <Label htmlFor="comments" className="text-base font-medium">
              Comentários Adicionais
            </Label>
            <p className="text-sm text-gray-600 mb-3">
              Compartilhe observações específicas ou sugestões (opcional):
            </p>
            <Textarea
              id="comments"
              placeholder="Ex: A aplicação prática foi muito boa, especialmente quando você relacionou o ponto com situações do dia a dia..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}