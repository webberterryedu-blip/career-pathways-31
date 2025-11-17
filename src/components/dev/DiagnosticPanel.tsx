// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  X,
  Database,
  Key,
  Wifi
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EnvStatus {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_PROJECT_ID?: string;
  effectiveUrl?: string;
  effectiveKey?: string;
}

interface ConnectionStatus {
  connected: boolean;
  latency?: number;
  error?: string;
  timestamp?: Date;
}

export const DiagnosticPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [envStatus, setEnvStatus] = useState<EnvStatus>({});
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false
  });
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    // Collect ENV info
    const VITE_URL = import.meta.env.VITE_SUPABASE_URL;
    const VITE_PUBLISHABLE = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const VITE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const VITE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    
    const FALLBACK_PROJECT_ID = 'dbcsygvthzkdujeugzca';
    const effectiveUrl = VITE_URL || `https://${(VITE_PROJECT_ID || FALLBACK_PROJECT_ID)}.supabase.co`;
    const effectiveKey = VITE_PUBLISHABLE || VITE_ANON;

    setEnvStatus({
      VITE_SUPABASE_URL: VITE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: VITE_PUBLISHABLE,
      VITE_SUPABASE_ANON_KEY: VITE_ANON,
      VITE_SUPABASE_PROJECT_ID: VITE_PROJECT_ID,
      effectiveUrl,
      effectiveKey: effectiveKey ? '***' + effectiveKey.slice(-8) : undefined
    });
  }, []);

  const testConnection = async () => {
    setIsTesting(true);
    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      const latency = Date.now() - startTime;

      if (error) {
        setConnectionStatus({
          connected: false,
          error: error.message,
          timestamp: new Date(),
          latency
        });
      } else {
        setConnectionStatus({
          connected: true,
          latency,
          timestamp: new Date()
        });
      }
    } catch (err) {
      setConnectionStatus({
        connected: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date()
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Only render in DEV mode
  if (import.meta.env.PROD) return null;

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="sm"
        variant="outline"
        className="fixed bottom-4 left-4 z-50 bg-background/95 backdrop-blur shadow-lg"
      >
        <Database className="h-4 w-4 mr-2" />
        Diagnóstico
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 left-4 z-50 w-[400px] max-h-[600px] overflow-auto bg-background/95 backdrop-blur shadow-2xl border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5" />
            Diagnóstico Backend
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* ENV Variables */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Key className="h-4 w-4" />
            Environment Variables
          </h3>
          <div className="space-y-1 text-xs">
            <EnvRow 
              label="VITE_SUPABASE_URL" 
              value={envStatus.VITE_SUPABASE_URL} 
            />
            <EnvRow 
              label="VITE_SUPABASE_PUBLISHABLE_KEY" 
              value={envStatus.VITE_SUPABASE_PUBLISHABLE_KEY}
              maskValue
            />
            <EnvRow 
              label="VITE_SUPABASE_ANON_KEY" 
              value={envStatus.VITE_SUPABASE_ANON_KEY}
              maskValue
            />
            <EnvRow 
              label="VITE_SUPABASE_PROJECT_ID" 
              value={envStatus.VITE_SUPABASE_PROJECT_ID} 
            />
          </div>
        </div>

        <Separator />

        {/* Effective Config */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Configuração Efetiva</h3>
          <div className="space-y-1 text-xs bg-muted/50 p-2 rounded">
            <div className="flex justify-between">
              <span className="text-muted-foreground">URL:</span>
              <span className="font-mono text-xs">{envStatus.effectiveUrl}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Key:</span>
              <span className="font-mono text-xs">{envStatus.effectiveKey || 'Not set'}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Connection Test */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              Teste de Conexão
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={testConnection}
              disabled={isTesting}
            >
              {isTesting ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Testar
                </>
              )}
            </Button>
          </div>

          {connectionStatus.timestamp && (
            <div className="space-y-2 text-xs bg-muted/50 p-3 rounded">
              <div className="flex items-center gap-2">
                {connectionStatus.connected ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-600">Conectado</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="font-semibold text-red-600">Falha na Conexão</span>
                  </>
                )}
              </div>
              
              {connectionStatus.latency && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Latência:</span>
                  <Badge variant="secondary">{connectionStatus.latency}ms</Badge>
                </div>
              )}
              
              {connectionStatus.error && (
                <div className="flex items-start gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="flex-1">{connectionStatus.error}</span>
                </div>
              )}
              
              <div className="text-muted-foreground">
                Última checagem: {connectionStatus.timestamp.toLocaleTimeString('pt-BR')}
              </div>
            </div>
          )}
        </div>

        {/* Auto-test on mount */}
        {!connectionStatus.timestamp && (
          <Button
            className="w-full"
            onClick={testConnection}
            disabled={isTesting}
          >
            <Wifi className="h-4 w-4 mr-2" />
            Testar Conexão Agora
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const EnvRow = ({ 
  label, 
  value, 
  maskValue = false 
}: { 
  label: string; 
  value?: string; 
  maskValue?: boolean;
}) => {
  const hasValue = !!value;
  const displayValue = maskValue && value 
    ? '***' + value.slice(-8)
    : value || 'Not set';

  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-muted-foreground font-mono">{label}:</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs">{displayValue}</span>
        {hasValue ? (
          <CheckCircle className="h-3 w-3 text-green-600" />
        ) : (
          <XCircle className="h-3 w-3 text-yellow-600" />
        )}
      </div>
    </div>
  );
};
