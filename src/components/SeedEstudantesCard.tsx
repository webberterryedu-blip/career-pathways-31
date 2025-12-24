import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Database, Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SeedEstudantesCardProps {
  onSeedComplete: () => void;
}

const SeedEstudantesCard = ({ onSeedComplete }: SeedEstudantesCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSeed = async () => {
    if (!confirm("Isso irá adicionar 100 estudantes fictícios ao banco de dados. Deseja continuar?")) {
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("seed-estudantes");

      if (error) {
        throw error;
      }

      if (data.success) {
        setResult({ success: true, message: data.message });
        toast.success(data.message);
        onSeedComplete();
      } else {
        throw new Error(data.error || "Erro desconhecido");
      }
    } catch (error: any) {
      console.error("Erro ao executar seed:", error);
      setResult({ success: false, message: error.message || "Erro ao criar estudantes fictícios" });
      toast.error("Erro ao criar estudantes fictícios");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Dados de Teste
        </CardTitle>
        <CardDescription>
          Gerar 100 estudantes fictícios para testes e demonstrações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Distribuição:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>5 Anciãos</li>
            <li>8 Servos Ministeriais</li>
            <li>15 Pioneiros Regulares</li>
            <li>40 Publicadores Batizados</li>
            <li>20 Publicadores Não Batizados</li>
            <li>12 Estudantes Novos</li>
          </ul>
          <p className="mt-3">
            Cada estudante terá qualificações apropriadas baseadas em seu privilégio e gênero.
          </p>
        </div>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleSeed} 
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando estudantes...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Gerar 100 Estudantes Fictícios
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SeedEstudantesCard;
