# 📘 Sistema Ministerial — Ministry Hub Sync

Sistema completo para gestão de programações e designações das reuniões da vida e ministério cristãos, seguindo as diretrizes do manual S-38.

## 🚀 Quick Start

1. **Environment Setup**
   ```bash
   # Copy the example env files and fill in your Supabase credentials
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. **Run Development Servers**
   ```bash
   # Run both frontend and backend
   npm run dev:all
   
   # Or run separately
   npm run dev:frontend  # Frontend on http://localhost:8080
   npm run dev:backend   # Backend on http://localhost:3001
   ```

## 🔐 Authentication Setup

1. **Configure Environment Variables**
   Make sure your `.env` file has the correct Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. **Create Test Users**
   You can create test users in two ways:
   
   a. Through the Supabase dashboard:
      - Go to your Supabase project → Authentication → Users
      - Click "Add user" and create:
        * Instructor: frankwebber33@hotmail.com / 13a21r15
        * Student: franklinmarceloferreiradelima@gmail.com / 13a21r15
   
   b. Using the script (requires service role key):
      ```bash
      node scripts/create-test-users.js
      ```

3. **Login**
   Navigate to http://localhost:8080/auth and login with the test credentials.

## 📁 Project Structure

```
├── src/                 # Frontend source code
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React contexts (Auth, etc.)
│   ├── hooks/           # Custom React hooks
│   ├── integrations/    # Third-party integrations (Supabase)
│   ├── layouts/         # Page layouts
│   ├── lib/             # Utility functions
│   ├── pages/           # Page components
│   ├── services/        # Business logic services
│   └── utils/           # Helper functions
├── backend/             # Backend server (Node.js/Express)
│   ├── config/          # Configuration files
│   ├── routes/          # API routes
│   ├── services/        # Backend services
│   └── sql/             # Database migrations
├── supabase/            # Supabase configuration
└── scripts/             # Utility scripts
```

## 🛠️ Development

### Frontend
- Built with React, TypeScript, and Vite
- UI components from shadcn/ui
- Styling with Tailwind CSS
- Routing with React Router

### Backend
- Node.js with Express
- Supabase for authentication and database
- REST API for data operations

### Database
- Supabase PostgreSQL
- Row Level Security (RLS) policies
- Real-time subscriptions

## 🧪 Testing

```bash
# Run end-to-end tests
npm run test:e2e

# Run specific test suites
npm run test:auth
npm run test:programs
npm run test:assignment-generation
```

## 🚀 Deployment

### Frontend
Deploy to Vercel, Netlify, or similar static hosting:
1. Build the project: `npm run build`
2. Deploy the `dist/` folder

### Backend
Deploy to Railway, Render, or similar Node.js hosting:
1. Set environment variables
2. Run `node server.js`

### Database
Use Supabase cloud hosting or set up your own PostgreSQL instance with the same schema.

## 📚 Documentation

- [API Documentation](backend/API_MINISTERIAL.md)
- [Programs Management](backend/README_PROGRAMACOES.md)
- [Supabase Integration](src/integrations/supabase/README.md)

## 🧭 Fluxo de Uso do Sistema

### 1. `/estudantes` — Gestão de Publicadores
- Instrutor importa a planilha modelo (`estudantes_ficticios.xlsx`) com dados reais
- Sistema salva todos os estudantes no Supabase
- Dados incluem: nome, gênero, batizado, pioneiro, ancião, servo ministerial, qualificações

### 2. `/programas` — Gestão de Programações
- Instrutor faz upload da apostila oficial (PDF MWB - Meeting Workbook)
- Sistema parseia automaticamente e salva no Supabase (`programacoes`)
- Botão **"Usar este programa"** define o contexto global para designações
- Visualização das partes da reunião organizadas por seções

### 3. `/dashboard` — Visão Geral
- Exibe a programação ativa atual
- Status das designações (pendentes, concluídas)
- Métricas de participação dos estudantes
- Acesso rápido às principais funcionalidades

### 4. `/designacoes` — Motor Principal do Sistema
- **Seleção de Programa**: Dropdown com todos os programas disponíveis
- **Gerar Designações Automáticas**: 
  - Chama Supabase Edge Function `generate-assignments`
  - Aplica regras S-38 (cargo, gênero, assistente, qualificações)
  - Distribui estudantes de forma equilibrada
- **Tabela Editável**: Resultado pode ser ajustado manualmente
- **Validações Visuais**: Badges indicam conformidade com regras S-38

### 5. `/relatorios` — Análises e Estatísticas
- Exibe estatísticas de participação por estudante
- Relatórios de frequência de designações
- Exportação para PDF/Excel
- Gráficos de distribuição de responsabilidades

## 🏗️ Arquitetura do Sistema

```
Frontend (React + TypeScript + Vite)
├── src/pages/
│   ├── EstudantesPage.tsx     # Gestão de publicadores
│   ├── ProgramasPage.tsx      # Upload e gestão de programas
│   ├── DashboardPage.tsx      # Visão geral e métricas
│   ├── DesignacoesPage.tsx    # Motor de designações S-38
│   └── RelatoriosPage.tsx     # Relatórios e estatísticas
├── src/components/            # Componentes reutilizáveis
└── src/utils/                 # Utilitários e helpers

Backend (Node.js + Express)
├── server.js                  # API REST principal
├── routes/                    # Endpoints da aplicação
└── middleware/                # CORS, auth, validation

Supabase (PostgreSQL + Edge Functions)
├── functions/
│   ├── list-programs-json/    # Lista programas disponíveis
│   ├── generate-assignments/  # Motor de designações S-38
│   └── save-assignments/      # Persistência de designações
└── migrations/                # Schema do banco de dados

Dados Oficiais
├── docs/Oficial/programacoes-json/  # Programas oficiais MWB
└── data/                           # Dados de exemplo e templates
```

## 🔧 Solução de Problemas Comuns

### Erro "Unexpected token '<'" (CORS)
**Causa**: Frontend tentando acessar Edge Functions não implantadas
**Solução**:
1. Execute `supabase functions deploy --no-verify-jwt list-programs-json`
2. Verifique se o projeto está linkado: `supabase projects list`
3. Confirme as variáveis de ambiente no `.env`

### Infinite Loop no ProtectedRoute
**Causa**: Estado de autenticação em loop infinito
**Solução**: Implementar debounce no componente de autenticação

### Bundle muito grande (>10MB)
**Solução**: 
1. Analisar com `npm run build -- --analyze`
2. Implementar code splitting por rotas
3. Otimizar importações de bibliotecas

### Funções Edge não encontradas
**Solução**:
```bash
# Verificar se estão deployed
supabase functions list

# Re-deploy se necessário
supabase functions deploy --no-verify-jwt
```

## 📊 Banco de Dados - Schema Principal

```sql
-- Estudantes (publicadores)
CREATE TABLE estudantes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  genero VARCHAR(10) NOT NULL,
  batizado BOOLEAN DEFAULT false,
  pioneiro BOOLEAN DEFAULT false,
  anciao BOOLEAN DEFAULT false,
  servo_ministerial BOOLEAN DEFAULT false,
  qualificacoes TEXT[]
);

-- Programações (da apostila MWB)
CREATE TABLE programacoes (
  id SERIAL PRIMARY KEY,
  semana DATE NOT NULL,
  secao VARCHAR(50) NOT NULL,
  parte VARCHAR(200) NOT NULL,
  tempo INTEGER NOT NULL,
  tipo VARCHAR(50) NOT NULL
);

-- Designações geradas
CREATE TABLE designacoes (
  id SERIAL PRIMARY KEY,
  programacao_id INTEGER REFERENCES programacoes(id),
  estudante_id INTEGER REFERENCES estudantes(id),
  assistente_id INTEGER REFERENCES estudantes(id),
  observacoes TEXT,
  data_designacao TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Deploy em Produção

### 1. Build do Frontend
```bash
npm run build
```

### 2. Configurar Variáveis de Produção
```bash
# No Supabase Dashboard
VITE_SUPABASE_URL=sua_url_producao
VITE_SUPABASE_ANON_KEY=sua_key_producao
VITE_MOCK_MODE=false
```

### 3. Deploy das Edge Functions
```bash
supabase functions deploy --no-verify-jwt
```

### 4. Configurar RLS (Row Level Security)
Ative políticas de segurança no Supabase para proteger os dados.

## 📚 Recursos Adicionais

- **Manual S-38**: Diretrizes oficiais para designações
- **Apostila MWB**: Fonte oficial dos programas semanais
- **Supabase Docs**: https://supabase.com/docs
- **React Query Docs**: Para gerenciamento de estado assíncrono

## 🆘 Suporte

Para problemas técnicos:
1. Verifique os logs do console (F12)
2. Confirme conectividade com Supabase
3. Valide se as Edge Functions estão implantadas
4. Consulte este README para soluções comuns

---

**Versão**: 2.0 | **Última atualização**: September 2025