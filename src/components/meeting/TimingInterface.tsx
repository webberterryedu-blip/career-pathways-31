import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TimingSession {
  id: string;
  assignmentId: string;
  partTitle: string;
  studentName: string;
  assistantName?: string;
  allocatedTime: number; // in seconds
  actualTime?: number; // in seconds
  startTime?: Date;
  endTime?: Date;
  status: 'pending' | 'active' | 'completed' | 'overtime';
  notes?: string;
}

interface TimingInterfaceProps {
  sessions: TimingSession[];
  onSessionUpdate: (sessionId: string, updates: Partial<TimingSession>) => void;
  onTimingComplete: (sessionId: string, actualTime: number) => void;
  className?: string;
}

/**
 * TimingInterface - Meeting chairman timing interface
 * Provides precise timing controls for meeting parts with visual feedback
 */
export default function TimingInterface({
  sessions,
  onSessionUpdate,
  onTimingComplete,
  className
}: TimingInterfaceProps) {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Find active session
  const activeSession = sessions.find(s => s.id === activeSessionId);

  // Start timing for a session
  const startTiming = (sessionId: string) => {
    if (activeSessionId && activeSessionId !== sessionId) {
      // Stop current session first
      stopTiming();
    }

    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    setActiveSessionId(sessionId);
    setCurrentTime(0);
    setIsRunning(true);
    startTimeRef.current = new Date();

    onSessionUpdate(sessionId, {
      status: 'active',
      startTime: startTimeRef.current
    });

    // Start the timer
    intervalRef.current = setInterval(() => {
      setCurrentTime(prev => prev + 1);
    }, 1000);
  };

  // Pause/Resume timing
  const toggleTiming = () => {
    if (!activeSessionId) return;

    if (isRunning) {
      // Pause
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      // Resume
      setIsRunning(true);
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
    }
  };

  // Stop timing and complete session
  const stopTiming = () => {
    if (!activeSessionId) return;

    const endTime = new Date();
    const actualTime = currentTime;

    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    onSessionUpdate(activeSessionId, {
      status: 'completed',
      endTime,
      actualTime
    });

    onTimingComplete(activeSessionId, actualTime);

    // Reset state
    setActiveSessionId(null);
    setCurrentTime(0);
    startTimeRef.current = null;
  };

  // Reset current timing
  const resetTiming = () => {
    if (!activeSessionId) return;

    setCurrentTime(0);
    startTimeRef.current = new Date();

    onSessionUpdate(activeSessionId, {
      startTime: startTimeRef.current
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get time status
  const getTimeStatus = (currentSeconds: number, allocatedSeconds: number) => {
    const percentage = (currentSeconds / allocatedSeconds) * 100;
    
    if (percentage <= 75) return 'good';
    if (percentage <= 90) return 'warning';
    if (percentage <= 100) return 'caution';
    return 'overtime';
  };

  // Get progress color
  const getProgressColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'caution': return 'bg-orange-500';
      case 'overtime': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  // Get status badge
  const getStatusBadge = (session: TimingSession) => {
    switch (session.status) {
      case 'pending':
        return <Badge variant="outline">Aguardando</Badge>;
      case 'active':
        return <Badge className="bg-blue-500">Em Andamento</Badge>;
      case 'completed':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Concluído
          </Badge>
        );
      case 'overtime':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Excedeu Tempo
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Controle de Tempo - Reunião
        </CardTitle>
        <CardDescription>
          Interface para cronometrar as partes da reunião
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Active Timer Display */}
        {activeSession && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-blue-900">
                {activeSession.partTitle}
              </h3>
              <p className="text-blue-700">
                {activeSession.studentName}
                {activeSession.assistantName && ` e ${activeSession.assistantName}`}
              </p>
            </div>

            {/* Timer Display */}
            <div className="text-center mb-4">
              <div className="text-4xl font-mono font-bold text-blue-900 mb-2">
                {formatTime(currentTime)}
              </div>
              <div className="text-sm text-blue-600">
                Tempo alocado: {formatTime(activeSession.allocatedTime)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <Progress 
                value={(currentTime / activeSession.allocatedTime) * 100}
                className="h-3"
              />
              <div className="flex justify-between text-xs text-blue-600 mt-1">
                <span>0:00</span>
                <span>{formatTime(activeSession.allocatedTime)}</span>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex justify-center gap-2">
              <Button
                onClick={toggleTiming}
                variant={isRunning ? "outline" : "default"}
                size="lg"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {currentTime > 0 ? 'Continuar' : 'Iniciar'}
                  </>
                )}
              </Button>

              <Button
                onClick={resetTiming}
                variant="outline"
                size="lg"
                disabled={currentTime === 0}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reiniciar
              </Button>

              <Button
                onClick={stopTiming}
                variant="destructive"
                size="lg"
              >
                <Square className="h-4 w-4 mr-2" />
                Finalizar
              </Button>
            </div>

            {/* Time Status Warning */}
            {currentTime > 0 && (
              <div className="mt-4 text-center">
                {(() => {
                  const status = getTimeStatus(currentTime, activeSession.allocatedTime);
                  const overtime = currentTime - activeSession.allocatedTime;
                  
                  if (status === 'overtime') {
                    return (
                      <div className="text-red-600 font-medium">
                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                        Excedeu em {formatTime(overtime)}
                      </div>
                    );
                  } else if (status === 'caution') {
                    return (
                      <div className="text-orange-600 font-medium">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Tempo quase esgotado
                      </div>
                    );
                  } else if (status === 'warning') {
                    return (
                      <div className="text-yellow-600 font-medium">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Restam {formatTime(activeSession.allocatedTime - currentTime)}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>
        )}

        {/* Session List */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Partes da Reunião</h4>
          
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg border transition-colors',
                session.id === activeSessionId 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              )}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="font-medium text-gray-900">
                    {session.partTitle}
                  </h5>
                  {getStatusBadge(session)}
                </div>
                
                <p className="text-sm text-gray-600">
                  {session.studentName}
                  {session.assistantName && ` e ${session.assistantName}`}
                </p>
                
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>Tempo: {formatTime(session.allocatedTime)}</span>
                  {session.actualTime && (
                    <span>
                      Real: {formatTime(session.actualTime)}
                      {session.actualTime > session.allocatedTime && (
                        <span className="text-red-500 ml-1">
                          (+{formatTime(session.actualTime - session.allocatedTime)})
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                {session.status === 'pending' && (
                  <Button
                    onClick={() => startTiming(session.id)}
                    disabled={!!activeSessionId}
                    size="sm"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Iniciar
                  </Button>
                )}
                
                {session.status === 'active' && session.id === activeSessionId && (
                  <Badge className="bg-blue-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(currentTime)}
                  </Badge>
                )}
                
                {session.status === 'completed' && (
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {formatTime(session.actualTime || 0)}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Meeting Summary */}
        {sessions.some(s => s.status === 'completed') && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Resumo da Reunião</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Partes concluídas:</span>
                <span className="ml-2 font-medium">
                  {sessions.filter(s => s.status === 'completed').length} / {sessions.length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Tempo total:</span>
                <span className="ml-2 font-medium">
                  {formatTime(
                    sessions
                      .filter(s => s.actualTime)
                      .reduce((total, s) => total + (s.actualTime || 0), 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}