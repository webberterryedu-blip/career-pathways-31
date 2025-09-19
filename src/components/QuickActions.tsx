import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { logger } from "@/utils/logger";

export default function QuickActions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      logger.info('Iniciando geração de designações...');
      
      // Navigate to designations page for assignment generation
      navigate('/designacoes');
      toast.success("Redirecionando para geração de designações!");
    } catch (error) {
      logger.error('Erro ao navegar para designações:', error);
      toast.error("Erro ao acessar designações");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      logger.info('Regenerando designações existentes...');
      
      // Check if there are existing designations to regenerate
      const { data: existingDesignacoes, error } = await supabase
        .from('designacoes')
        .select('id')
        .limit(1);
        
      if (error) {
        throw new Error('Erro ao verificar designações existentes');
      }
      
      if (!existingDesignacoes || existingDesignacoes.length === 0) {
        toast.info("Nenhuma designação encontrada para regenerar. Crie novas designações primeiro.");
        navigate('/programas');
        return;
      }
      
      // Navigate to designations for regeneration
      navigate('/designacoes');
      toast.success("Redirecionando para regeneração de designações!");
    } catch (error) {
      logger.error('Erro ao regenerar designações:', error);
      toast.error("Erro ao regenerar designações");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    setLoading(true);
    try {
      logger.info('Iniciando exportação de PDF...');
      
      // Check if there are designations to export
      const { data: designacoes, error } = await supabase
        .from('designacoes')
        .select(`
          id,
          status,
          parte_id
        `)
        .limit(1);
        
      if (error) {
        throw new Error('Erro ao verificar designações para exportação');
      }
      
      if (!designacoes || designacoes.length === 0) {
        toast.info("Nenhuma designação encontrada para exportar. Crie designações primeiro.");
        navigate('/designacoes');
        return;
      }
      
      // Navigate to reports page for PDF export
      navigate('/relatorios');
      toast.success("Redirecionando para exportação de relatórios!");
    } catch (error) {
      logger.error('Erro ao exportar PDF:', error);
      toast.error("Erro ao exportar PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button 
        onClick={handleGenerate}
        disabled={loading}
        className="order-1"
      >
        {loading ? "Gerando..." : t('assignments.generateNew')}
        <Badge variant="secondary" className="ml-2 text-xs">Beta</Badge>
      </Button>
      <Button 
        variant="secondary" 
        onClick={handleRegenerate}
        disabled={loading}
        className="order-2"
      >
        {loading ? "Regenerando..." : t('assignments.regenerate')}
        <Badge variant="secondary" className="ml-2 text-xs">Beta</Badge>
      </Button>
      <Button 
        variant="outline" 
        onClick={handleExportPdf}
        disabled={loading}
        className="order-3"
      >
        {loading ? "Exportando..." : t('assignments.exportPdf')}
        <Badge variant="secondary" className="ml-2 text-xs">Beta</Badge>
      </Button>
    </div>
  );
}
