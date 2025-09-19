// Tipos para o sistema de designações baseado nas regras S-38

export interface Estudante {
  id: string;
  nome: string;
  genero: 'masculino' | 'feminino';
  cargo: 'anciao' | 'servo_ministerial' | 'pioneiro_regular' | 'pioneira_regular' | 
         'publicador_batizado' | 'publicadora_batizada' | 'publicador_nao_batizado' | 
         'estudante_novo' | 'estudante_nova';
  ativo: boolean;
  menor: boolean;
  familia_id: string;
  qualificacoes: {
    chairman: boolean;
    pray: boolean;
    tresures: boolean;
    gems: boolean;
    reading: boolean;
    starting: boolean;
    following: boolean;
    making: boolean;
    explaining: boolean;
    talk: boolean;
  };
  ultima_designacao?: string;
  contador_designacoes: number;
  data_nascimento: Date;
  responsavel_primario?: string;
  responsavel_secundario?: string;
}

export interface ParteReuniao {
  id: string;
  tipo: 'opening_comments' | 'treasures_talk' | 'spiritual_gems' | 'bible_reading' | 
        'starting_conversation' | 'following_up' | 'making_disciples' | 
        'explaining_beliefs' | 'talk';
  titulo: string;
  minutos: number;
  regras: RegrasDesignacao;
  estudante_principal?: string;
  ajudante?: string;
  semana: string;
  data: Date;
}

export interface RegrasDesignacao {
  // Filtros básicos
  genero?: 'masculino' | 'feminino';
  cargos_permitidos?: string[];
  qualificacao_necessaria: string;
  
  // Regras especiais
  precisa_ajudante: boolean;
  ajudante_mesmo_genero?: boolean;
  ajudante_familia?: boolean;
  
  // Restrições
  idade_minima?: number;
  idade_maxima?: number;
  apenas_batizados?: boolean;
  excluir_menores?: boolean;
  
  // Prioridades
  priorizar_ancioes?: boolean;
  priorizar_servos?: boolean;
  rotacao_justa: boolean;
}

export interface ResultadoDesignacao {
  parte: ParteReuniao;
  estudante_principal: Estudante;
  ajudante?: Estudante;
  motivo_escolha: string;
  alternativas_consideradas: number;
}

export interface EstatisticasDesignacao {
  total_estudantes_disponiveis: number;
  total_partes_designadas: number;
  distribuicao_por_cargo: Record<string, number>;
  estudantes_sem_designacao: Estudante[];
  conflitos_encontrados: string[];
}

// Constantes das regras S-38
export const REGRAS_S38: Record<string, RegrasDesignacao> = {
  opening_comments: {
    genero: 'masculino',
    cargos_permitidos: ['anciao', 'servo_ministerial'],
    qualificacao_necessaria: 'chairman',
    precisa_ajudante: false,
    apenas_batizados: true,
    priorizar_ancioes: true,
    rotacao_justa: true
  },
  
  treasures_talk: {
    genero: 'masculino',
    cargos_permitidos: ['anciao', 'servo_ministerial'],
    qualificacao_necessaria: 'tresures',
    precisa_ajudante: false,
    apenas_batizados: true,
    priorizar_ancioes: true,
    rotacao_justa: true
  },
  
  spiritual_gems: {
    genero: 'masculino',
    cargos_permitidos: ['anciao', 'servo_ministerial'],
    qualificacao_necessaria: 'gems',
    precisa_ajudante: false,
    apenas_batizados: true,
    priorizar_ancioes: true,
    rotacao_justa: true
  },
  
  bible_reading: {
    genero: 'masculino',
    qualificacao_necessaria: 'reading',
    precisa_ajudante: false,
    excluir_menores: false,
    rotacao_justa: true
  },
  
  starting_conversation: {
    qualificacao_necessaria: 'starting',
    precisa_ajudante: true,
    ajudante_mesmo_genero: true,
    ajudante_familia: true,
    excluir_menores: false,
    rotacao_justa: true
  },
  
  following_up: {
    qualificacao_necessaria: 'following',
    precisa_ajudante: true,
    ajudante_mesmo_genero: true,
    excluir_menores: false,
    rotacao_justa: true
  },
  
  making_disciples: {
    qualificacao_necessaria: 'making',
    precisa_ajudante: true,
    ajudante_mesmo_genero: true,
    excluir_menores: false,
    rotacao_justa: true
  },
  
  explaining_beliefs: {
    qualificacao_necessaria: 'explaining',
    precisa_ajudante: true,
    ajudante_mesmo_genero: true,
    ajudante_familia: true,
    excluir_menores: false,
    rotacao_justa: true
  },
  
  talk: {
    genero: 'masculino',
    qualificacao_necessaria: 'talk',
    precisa_ajudante: false,
    excluir_menores: false,
    rotacao_justa: true
  }
};