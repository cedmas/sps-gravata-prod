# Arquitetura do Sistema (PEG)

## Visão Geral Técnica
O Sistema de Planejamento Estratégico de Gravatá (PEG) é uma aplicação web moderna do tipo **Single Page Application (SPA)**, construída com foco em performance, interatividade e responsividade.

### Tech Stack
- **Frontend Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Backend / Infraestrutura**: [Firebase](https://firebase.google.com/)
  - **Authentication**: Gestão de identidades e sessões.
  - **Firestore**: Banco de dados NoSQL em tempo real.
  - **Hosting**: Hospedagem dos arquivos estáticos.

## Estrutura do Projeto
A organização de pastas segue o padrão de "features" e "camadas" para facilitar a manutenção:

```
src/
├── components/        # Componentes reutilizáveis (UI)
│   ├── ui/            # Componentes visuais genéricos (botões, cards, skeletons)
│   ├── layout/        # Layouts de página (Sidebar, Header)
│   └── planning/      # Componentes específicos de negócio (Lista de Ações, Upload)
├── contexts/          # React Contexts (AuthContext para sessão global)
├── lib/               # Utilitários e helpers (formatação de data, moeda)
├── pages/             # Componentes de página (Roteamento)
│   ├── dashboard/     # Telas de visão geral (WarRoom, Dashboard Prefeito)
│   └── planning/      # Telas de gestão (Programas, Evidências)
├── services/          # Camada de integração com APIs/Firebase
│   ├── firebase.ts    # Inicialização do SDK
│   ├── firestoreDb.ts # Abstração das chamadas ao banco de dados
│   ├── validator.ts   # Regras de negócio e validação ("Engine de Travamento")
│   └── aiService.ts   # Integração com Google Gemini (Auditoria IA)
└── types/             # Definições de tipos TypeScript (Interfaces de dados)
```

## Modelo de Dados (Firestore)
O banco de dados é não-relacional, organizado nas seguintes coleções principais:

### `programs`
Armazena os programas de governo.
- `id`: string (UUID)
- `unitId`: string (Ref. Unidade)
- `axisId`: string (Ref. Eixo)
- `name`: string
- `objective`: string
- `publicProblem`: string (Para auditoria IA)
- `targetAudience`: string (Para auditoria IA)

### `actions` (Subcoleção ou ref)
Iniciativas vinculadas a um programa.
- `programId`: string
- `title`: string
- `deadline`: timestamp
- `status`: 'delayed' | 'in_progress' | 'completed' | 'planned'

### `evidences`
Links e metadados de comprovantes de execução.
- `actionId`: string
- `url`: string (Link externo ou Storage)
- `type`: 'document' | 'photo' | 'link'

### `org_units`
Cadastro das secretarias e órgãos.
- `name`: string
- `acronym`: string (Sigla)

## Segurança e Acesso (RBAC)
O controle de acesso é gerenciado via **Custom Claims** no Firebase Auth e validado tanto no frontend (UX) quanto nas Security Rules do Firestore.

### Perfis
1.  **admin (SCTI)**: Acesso total.
2.  **prefeito**: Visualização de dashboards consolidados.
3.  **controladoria**: Acesso aos relatórios de risco e auditoria.
4.  **editor (Gestor/Ponto Focal)**: Permissão de escrita apenas nos dados da sua própria `unitId`.
5.  **viewer**: Acesso somente leitura.

## Integração com IA
O sistema utiliza o **Google Gemini** via `aiService.ts` para realizar auditoria qualitativa dos programas:
1.  O usuário preenche Problema e Público-Alvo.
2.  A IA avalia a coerência lógica (Triangulação de Planejamento).
3.  O sistema exibe uma "Nota" e sugestões de melhoria.
