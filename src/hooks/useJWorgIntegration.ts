import { useState, useEffect } from 'react';

interface JWorgMeeting {
  week: string;
  date: string;
  book: string;
  chapter: string;
  parts: MeetingPart[];
}

interface MeetingPart {
  id: number;
  title: string;
  duration: number;
  type: 'treasures' | 'gems' | 'reading' | 'starting' | 'following' | 'making' | 'explaining' | 'talk' | 'discussion' | 'study';
  description: string;
  references: string[];
  notes?: string;
}

interface JWorgIntegration {
  currentLanguage: 'pt' | 'en';
  availableWorkbooks: string[];
  currentWeek: JWorgMeeting | null;
  nextWeeks: JWorgMeeting[];
  isLoading: boolean;
  error: string | null;
  downloadWorkbook: (language: 'pt' | 'en', month: string, year: string) => Promise<void>;
  fetchCurrentWeek: () => Promise<void>;
  fetchNextWeeks: () => Promise<void>;
  setLanguage: (lang: 'pt' | 'en') => void;
}

const JW_ORG_URLS = {
  pt: 'https://www.jw.org/pt/biblioteca/jw-apostila-do-mes/',
  en: 'https://www.jw.org/en/library/jw-meeting-workbook/'
};

const WOL_MEETING_URLS = {
  pt: 'https://wol.jw.org/pt/wol/meetings/r5/lp-t/',
  en: 'https://wol.jw.org/en/wol/meetings/r1/lp-e/'
};

export const useJWorgIntegration = (): JWorgIntegration => {
  const [currentLanguage, setCurrentLanguage] = useState<'pt' | 'en'>('pt');
  const [availableWorkbooks, setAvailableWorkbooks] = useState<string[]>([]);
  const [currentWeek, setCurrentWeek] = useState<JWorgMeeting | null>(null);
  const [nextWeeks, setNextWeeks] = useState<JWorgMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dados mockados baseados nas URLs fornecidas
  const mockCurrentWeek: JWorgMeeting = {
    week: '18-24 de agosto',
    date: '2025-08-18',
    book: 'PROVÉRBIOS 27',
    chapter: '27',
    parts: [
      {
        id: 1,
        title: 'Ter amigos de verdade faz bem',
        duration: 10,
        type: 'treasures',
        description: 'Amigos de verdade têm coragem de nos dar conselhos quando precisamos',
        references: ['Pro. 27:5, 6; w19.09 5 § 12', 'Pro. 27:10; it-2 1215 § 5', 'Pro. 27:17; w23.09 9 § 7']
      },
      {
        id: 2,
        title: 'Joias espirituais',
        duration: 10,
        type: 'gems',
        description: 'Pro. 27:21 — Por que um elogio pode ser um teste para nós?',
        references: ['w06 15/9 19 § 12']
      },
      {
        id: 3,
        title: 'Leitura da Bíblia',
        duration: 4,
        type: 'reading',
        description: 'Pro. 27:1-17',
        references: ['th lição 5']
      },
      {
        id: 4,
        title: 'Iniciando conversas',
        duration: 3,
        type: 'starting',
        description: 'DE CASA EM CASA - A pessoa é de uma religião não cristã',
        references: ['lmd lição 6 ponto 5']
      },
      {
        id: 5,
        title: 'Cultivando o interesse',
        duration: 4,
        type: 'following',
        description: 'TESTEMUNHO INFORMAL - Use um vídeo do Kit de Ensino',
        references: ['lmd lição 8 ponto 3']
      },
      {
        id: 6,
        title: 'Discurso',
        duration: 5,
        type: 'talk',
        description: 'O que fazer se meu amigo me deixou chateado?',
        references: ['ijwyp artigo 75', 'th lição 14']
      },
      {
        id: 7,
        title: '"Um irmão em tempos de aflição"',
        duration: 15,
        type: 'discussion',
        description: 'Discussão sobre amizades cristãs',
        references: []
      },
      {
        id: 8,
        title: 'Estudo bíblico de congregação',
        duration: 30,
        type: 'study',
        description: 'lfb histórias 10-11',
        references: []
      }
    ]
  };

  const mockNextWeeks: JWorgMeeting[] = [
    {
      week: '25-31 de agosto',
      date: '2025-08-25',
      book: 'PROVÉRBIOS 28',
      chapter: '28',
      parts: [
        {
          id: 1,
          title: 'Diferenças entre os maus e os justos',
          duration: 10,
          type: 'treasures',
          description: 'Contrastes entre pessoas más e justas',
          references: ['Pro. 28:1; w93 15/5 26 § 2', 'Pro. 28:5; it-1 814 § 2', 'Pro. 28:6; it-1 1237 § 1']
        }
      ]
    },
    {
      week: '1-7 de setembro',
      date: '2025-09-01',
      book: 'PROVÉRBIOS 29',
      chapter: '29',
      parts: [
        {
          id: 1,
          title: 'Rejeite crenças e costumes que não são baseados na Bíblia',
          duration: 10,
          type: 'treasures',
          description: 'Obedeça a Jeová e seja feliz de verdade',
          references: ['Pro. 29:18; wp16.6 6, quadro', 'Pro. 29:3a; w19.04 17 § 13', 'Pro. 29:25; w18.11 11 § 12']
        }
      ]
    },
    {
      week: '8-14 de setembro',
      date: '2025-09-08',
      book: 'PROVÉRBIOS 30',
      chapter: '30',
      parts: [
        {
          id: 1,
          title: '"Não me dês nem pobreza nem riquezas"',
          duration: 10,
          type: 'treasures',
          description: 'A verdadeira felicidade vem de confiar em Deus, não nas riquezas',
          references: ['Pro. 30:8, 9; w18.01 24-25 §§ 10-12', 'Pro. 30:15, 16; w87 15/5 30 § 8', 'Pro. 30:24, 25; w11 1/6 10 § 3']
        }
      ]
    }
  ];

  const downloadWorkbook = async (language: 'pt' | 'en', month: string, year: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simular download da apostila MWB
      const url = JW_ORG_URLS[language];
      console.log(`📥 Baixando apostila MWB ${language.toUpperCase()} - ${month} ${year}`);
      console.log(`🔗 URL: ${url}`);
      
      // Em produção, aqui seria feita a requisição real para JW.org
      // Por enquanto, simulamos o download
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`✅ Apostila MWB ${language.toUpperCase()} baixada com sucesso!`);
      
      // Atualizar lista de apostilas disponíveis
      setAvailableWorkbooks(prev => [...prev, `mwb${year.slice(-2)}.${month}-${language.toUpperCase()}`]);
      
    } catch (err) {
      setError(`Erro ao baixar apostila: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      console.error('❌ Erro ao baixar apostila:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentWeek = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simular busca da semana atual
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentWeek(mockCurrentWeek);
      console.log('✅ Semana atual carregada:', mockCurrentWeek.week);
    } catch (err) {
      setError(`Erro ao carregar semana atual: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      console.error('❌ Erro ao carregar semana atual:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNextWeeks = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simular busca das próximas semanas
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNextWeeks(mockNextWeeks);
      console.log('✅ Próximas semanas carregadas:', mockNextWeeks.length);
    } catch (err) {
      setError(`Erro ao carregar próximas semanas: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      console.error('❌ Erro ao carregar próximas semanas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = (lang: 'pt' | 'en'): void => {
    setCurrentLanguage(lang);
    console.log(`🌐 Idioma alterado para: ${lang === 'pt' ? 'Português' : 'English'}`);
  };

  useEffect(() => {
    // Carregar dados iniciais
    fetchCurrentWeek();
    fetchNextWeeks();
    
    // Inicializar apostilas disponíveis
    setAvailableWorkbooks(['mwb25.07-T', 'mwb25.09-T', 'mwb25.11-T']);
  }, []);

  return {
    currentLanguage,
    availableWorkbooks,
    currentWeek,
    nextWeeks,
    isLoading,
    error,
    downloadWorkbook,
    fetchCurrentWeek,
    fetchNextWeeks,
    setLanguage
  };
};
