# Sistema de Planejamento Estratégico de Gravatá (PEG 2026)

Bem-vindo ao repositório oficial do PEG. Este sistema gerencia o planejamento estratégico municipal, permitindo acompanhamento de programas, ações, metas e indicadores.

## 📚 Documentação
A documentação completa está disponível na pasta `sps-frontend/docs/`.

- **[🏠 Manual do Usuário (Técnico)](sps-frontend/docs/USER_MANUAL.md)**: Referência completa e técnica.
- **[📖 Manual Prático](sps-frontend/docs/MANUAL_PRATICO.md)**: Guia passo a passo simplificado para o dia a dia.
- **[🏗️ Arquitetura Técnica](sps-frontend/docs/ARCHITECTURE.md)**: Detalhes sobre Stack, Banco de Dados e Segurança.
- **[🚀 Guia de Deploy](sps-frontend/docs/DEPLOYMENT.md)**: Como configurar, rodar localmente e publicar.

## ⚡ Quick Start (Desenvolvedores)

### 1. Backend (Local)
O backend local roda PostgreSQL (Via Docker) e uma API Node.js.

```bash
cd sps-backend
# 1. Instalar dependências
npm install
# 2. Configurar ambiente
copy .env.example .env
# 3. Subir Banco de Dados
docker compose up -d
# 4. Iniciar API
npm run dev
```

### 2. Frontend
```bash
cd sps-frontend
# 1. Instalar dependências
npm install
# 2. Escolher Backend (Local ou Firebase)
# Para Local: Crie .env.local com VITE_DATA_SOURCE=local
# Para Firebase: Use as chaves do projeto no .env
# 3. Rodar
npm run dev
```

## Status do Projeto
- **Versão**: 1.0 (MVP 2026)
- **Ambiente de Homologação**: `sps-gravata-homolog`
- **Ambiente de Produção**: `sps-gravata-prod`
- **Ambiente Local**: `localhost:3000` (API) / `localhost:5173` (App)
