import { useState, useEffect } from 'react';
import { MessageSquare, Star, TrendingUp, User, Clock, Save, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications } from '@/contexts/NotificationContext';

interface CounselRecord {
  id: string;
  assignmentId: string;
  studentId: string;
  counselorId: string;
  sessionDate: Date;
  studyPoint: string;
  strengths: string[];
  areasForImprovement: string[];
  specificFeedback: string;
  rating: 1 | 2 | 3 | 4 | 5;
  nextSteps: string[];
  followUpRequired: boolean;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface CounselSession {
  assignmentId: string;
  studentName: string;
  partTitle: string;
  studyPoint: string;
  actualTime?: number;
  allocatedTime: number;
  status: 'pending' | 'in_progress' | 'completed';
}

interface CounselTrackerProps {
  sessions: CounselSession[];
  onCounselComplete: (assignmentId: string, counsel: Omit<CounselRecord, 'id' | 'createdAt' | 'updatedAt'>) => void;
  className?: string;
}

const COMMON_STRENGTHS = [
  'Boa preparação',
  'Apresentação natural',
  'Uso eficaz das Escrituras',
  'Aplicação prática clara',
  'Excelente timing',
  'Boa interação com ajudante',
  'Voz clara e expressiva',
  'Postura confiante',
  'Contato visual adequado',
  'Gestos apropriados'
];

const COMMON_IMPROVEMENTS = [
  'Preparação mais detalhada',
  'Melhorar contato visual',
  'Trabalhar a modulação da voz',
  'Gestos mais naturais',
  'Melhor uso do tempo',
  'Aplicação mais prática',
  'Interação com ajudante',
  'Uso mais eficaz das Escrituras',
  'Postura mais confiante',
  'Preparação do material'
];

const NEXT_STEPS_OPTIONS = [
  'Praticar em casa',
  'Estudar material adicional',
  'Trabalhar com ajudante experiente',
  'Observar apresentações modelo',
  'Focar no ponto específico',
  'Preparar com antecedência',
  'Solicitar ajuda do instrutor',
  'Revisar orientações S-38'
];

/**
 * CounselTracker - System for recording and tracking student counsel
 * Provides structured feedback and progress tracking
 */
export default function CounselTracker({
  sessions,
  onCounselComplete,
  className
}: CounselTrackerProps) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [counselData, setCounselData] = useState<Partial<CounselRecord>>({});
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);
  const [selectedImprovements, setSelectedImprovements] = useState<string[]>([]);
  const [selectedNextSteps, setSelectedNextSteps] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { addNotification } = useNotifications();

  const activeSession = sessions.find(s => s.assignmentId === activeSessionId);

  // Start counsel session
  const startCounsel = (assignmentId: string) => {
    const session = sessions.find(s => s.assignmentId === assignmentId);
    if (!session) return;

    setActiveSessionId(assignmentId);
    setCounselData({
      assignmentId,
      sessionDate: new Date(),
      studyPoint: session.studyPoint,
      rating: 4, // Default to good rating
      followUpRequired: false
    });
    setSelectedStrengths([]);
    setSelectedImprovements([]);
    setSelectedNextSteps([]);
  };

  // Handle strength selection
  const toggleStrength = (strength: string) => {
    setSelectedStrengths(prev => 
      prev.includes(strength) 
        ? prev.filter(s => s !== strength)
        : [...prev, strength]
    );
  };

  // Handle improvement selection
  const toggleImprovement = (improvement: string) => {
    setSelectedImprovements(prev => 
      prev.includes(improvement) 
        ? prev.filter(i => i !== improvement)
        : [...prev, improvement]
    );
  };

  // Handle next steps selection
  const toggleNextStep = (step: string) => {
    setSelectedNextSteps(prev => 
      prev.includes(step) 
        ? prev.filter(s => s !== step)
        : [...prev, step]
    );
  };

  // Save counsel record
  const saveCounsel = async () => {
    if (!activeSession || !counselData.assignmentId) return;

    setIsSaving(true);
    try {
      const counselRecord: Omit<CounselRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        assignmentId: counselData.assignmentId,
        studentId: '', // This should be passed from the session
        counselorId: '', // This should be the current user
        sessionDate: counselData.sessionDate || new Date(),
        studyPoint: counselData.studyPoint || '',
        strengths: selectedStrengths,
        areasForImprovement: selectedImprovements,
        specificFeedback: counselData.specificFeedback || '',
        rating: counselData.rating || 4,
        nextSteps: selectedNextSteps,
        followUpRequired: counselData.followUpRequired || false,
        followUpDate: counselData.followUpDate
      };

      await onCounselComplete(counselData.assignmentId, counselRecord);

      addNotification({
        type: 'success',
        title: 'Conselho Registrado',
        message: `Conselho para ${activeSession.studentName} foi salvo com sucesso.`,
        duration: 3000
      });

      // Reset form
      setActiveSessionId(null);
      setCounselData({});
      setSelectedStrengths([]);
      setSelectedImprovements([]);
      setSelectedNextSteps([]);

    } catch (error) {
      console.error('Error saving counsel:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao Salvar',
        message: 'Não foi possível salvar o conselho. Tente novamente.',
        duration: 5000
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel counsel session
  const cancelCounsel = () => {
    setActiveSessionId(null);
    setCounselData({});
    setSelectedStrengths([]);
    setSelectedImprovements([]);
    setSelectedNextSteps([]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Precisa melhorar muito';
      case 2: return 'Precisa melhorar';
      case 3: return 'Satisfatório';
      case 4: return 'Bom';
      case 5: return 'Excelente';
      default: return 'Não avaliado';
    }
  };

  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 1: return 'text-red-600';
      case 2: return 'text-orange-600';
      case 3: return 'text-yellow-600';
      case 4: return 'text-blue-600';
      case 5: return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Registro de Conselhos
        </CardTitle>
        <CardDescription>
          Sistema para registrar conselhos e acompanhar o progresso dos estudantes
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!activeSessionId ? (
          // Session Selection
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Selecione uma apresentação para dar conselho:</h4>
            
            {sessions.filter(s => s.status === 'completed').map((session) => (
              <div
                key={session.assignmentId}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{session.partTitle}</h5>
                  <p className="text-sm text-gray-600">{session.studentName}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>Ponto de estudo: {session.studyPoint}</span>
                    {session.actualTime && (
                      <span>
                        Tempo: {formatTime(session.actualTime)}
                        {session.actualTime > session.allocatedTime && (
                          <span className="text-red-500 ml-1">
                            (+{formatTime(session.actualTime - session.allocatedTime)})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={() => startCounsel(session.assignmentId)}
                  size="sm"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Dar Conselho
                </Button>
              </div>
            ))}

            {sessions.filter(s => s.status === 'completed').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma apresentação concluída para dar conselho</p>
              </div>
            )}
          </div>
        ) : (
          // Counsel Form
          <div className="space-y-6">
            {/* Session Header */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900">{activeSession?.partTitle}</h3>
              <p className="text-blue-700">{activeSession?.studentName}</p>
              <p className="text-sm text-blue-600 mt-1">
                Ponto de estudo: {activeSession?.studyPoint}
              </p>
            </div>

            <Tabs defaultValue="evaluation" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="evaluation">Avaliação</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="next-steps">Próximos Passos</TabsTrigger>
              </TabsList>

              <TabsContent value="evaluation" className="space-y-4">
                {/* Overall Rating */}
                <div>
                  <Label className="text-base font-medium">Avaliação Geral</Label>
                  <Select
                    value={counselData.rating?.toString()}
                    onValueChange={(value) => 
                      setCounselData(prev => ({ ...prev, rating: parseInt(value) as 1 | 2 | 3 | 4 | 5 }))
                    }
                  >
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue placeholder="Selecione uma avaliação" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <SelectItem key={rating} value={rating.toString()}>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className={getRatingColor(rating)}>
                              {getRatingLabel(rating)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Strengths */}
                <div>
                  <Label className="text-base font-medium">Pontos Fortes</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Selecione os aspectos que foram bem executados:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {COMMON_STRENGTHS.map((strength) => (
                      <div key={strength} className="flex items-center space-x-2">
                        <Checkbox
                          id={`strength-${strength}`}
                          checked={selectedStrengths.includes(strength)}
                          onCheckedChange={() => toggleStrength(strength)}
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
                    Selecione aspectos que podem ser aprimorados:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {COMMON_IMPROVEMENTS.map((improvement) => (
                      <div key={improvement} className="flex items-center space-x-2">
                        <Checkbox
                          id={`improvement-${improvement}`}
                          checked={selectedImprovements.includes(improvement)}
                          onCheckedChange={() => toggleImprovement(improvement)}
                        />
                        <Label 
                          htmlFor={`improvement-${improvement}`}
                          className="text-sm cursor-pointer"
                        >
                          {improvement}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="feedback" className="space-y-4">
                {/* Specific Feedback */}
                <div>
                  <Label htmlFor="specific-feedback" className="text-base font-medium">
                    Feedback Específico
                  </Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Forneça comentários específicos e construtivos:
                  </p>
                  <Textarea
                    id="specific-feedback"
                    placeholder="Ex: A aplicação prática foi muito boa, especialmente quando você relacionou o ponto com situações do dia a dia. Para melhorar ainda mais, tente manter mais contato visual com a assistente durante a demonstração..."
                    value={counselData.specificFeedback || ''}
                    onChange={(e) => 
                      setCounselData(prev => ({ ...prev, specificFeedback: e.target.value }))
                    }
                    rows={6}
                    className="resize-none"
                  />
                </div>

                {/* Follow-up Required */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="follow-up"
                    checked={counselData.followUpRequired || false}
                    onCheckedChange={(checked) => 
                      setCounselData(prev => ({ ...prev, followUpRequired: !!checked }))
                    }
                  />
                  <Label htmlFor="follow-up" className="text-sm">
                    Requer acompanhamento adicional
                  </Label>
                </div>
              </TabsContent>

              <TabsContent value="next-steps" className="space-y-4">
                {/* Next Steps */}
                <div>
                  <Label className="text-base font-medium">Próximos Passos</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Selecione as ações recomendadas para o estudante:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {NEXT_STEPS_OPTIONS.map((step) => (
                      <div key={step} className="flex items-center space-x-2">
                        <Checkbox
                          id={`step-${step}`}
                          checked={selectedNextSteps.includes(step)}
                          onCheckedChange={() => toggleNextStep(step)}
                        />
                        <Label 
                          htmlFor={`step-${step}`}
                          className="text-sm cursor-pointer"
                        >
                          {step}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={cancelCounsel}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={saveCounsel}
                disabled={isSaving || !counselData.rating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Conselho'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}