# Arquitetura do Sistema (PEG)

## Visão Geral Técnica
O Sistema de Planejamento Estratégico de Gravatá (PEG) é uma aplicação web moderna do tipo **Single Page Application (SPA)**, com uma arquitetura **Híbrida** inovadora que suporta tanto operação em Nuvem (Firebase) quanto Local (On-Premise) para soberania de dados.

### Tech Stack
- **Frontend Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estilização**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Ícones**: [Lucide React](https://lucide.dev/)

### Backends Suportados (Switchable)
O sistema implementa o **Padrão Adapter** (`IDataService`) para alternar entre backends via configuração (`.env`):

#### 1. Nuvem (Firebase) - *Modo Padrão*
- **Authentication**: Gestão de identidades e RBAC.
- **Firestore**: Banco de dados NoSQL em tempo real.
- **Hosting**: Hospedagem global.

#### 2. Local (Híbrido/Soberano) - *Novo*
- **API Server**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/).
- **Banco de Dados**: [PostgreSQL](https://www.postgresql.org/) rodando em [Docker](https://www.docker.com/).
- **ORM**: [Prisma](https://www.prisma.io/) para gestão de schema e tipagem segura.
- **Migração**: Scripts automatizados para importar dados do Firebase para PostgreSQL.

## Estrutura do Projeto
A organização de pastas segue o padrão de "features" e "camadas", com separação clara de responsabilidades:

```
src/
├── components/        # Componentes reutilizáveis (UI)
├── services/          # Camada de Dados (Data Layer)
│   ├── IDataService.ts # Interface contrato p/ os adapters
│   ├── firestoreDb.ts  # Factory que escolhe o adapter (Local vs Firebase)
│   ├── adapters/      
│   │   ├── firebaseAdapter.ts # Implementação Firestore
│   │   └── localAdapter.ts    # Implementação API Node.js
│   ├── validator.ts   # Regras de negócio ("Engine de Travamento")
│   └── aiService.ts   # Integração com Google Gemini
├── types/             # Definições de tipos TypeScript (Interfaces de dados)
└── ...
```

## Backend Local (Estrutura)
O backend local (`sps-backend/`) é um microsserviço independente:

- **index.ts**: Servidor Express com endpoints RESTful.
- **prisma/schema.prisma**: Fonte de verdade do modelo de dados Relacional.
- **docker-compose.yml**: Orquestração do container PostgreSQL.

## Configuração de Ambiente
A troca de backend é controlada pela variável `VITE_DATA_SOURCE`:

- `VITE_DATA_SOURCE=firebase` -> Usa SDK do Firestore.
- `VITE_DATA_SOURCE=local`    -> Usa `fetch` para `http://localhost:3000`.

## Segurança e Acesso
- **Nuvem**: RBAC via Custom Claims e Security Rules.
- **Local**: Autenticação simulada (Mock Profile) em desenvolvimento, ou integração futura com LDAP/ActiveDirectory.

## Integração com IA
O sistema utiliza o **Google Gemini** para auditar a coerência do planejamento.
- **Local**: A chave de API é salva na tabela `Settings` do PostgreSQL.
- **Nuvem**: A chave é lida de `settings/global` no Firestore.
