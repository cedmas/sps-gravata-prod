# Guia de Deploy e Infraestrutura

Este documento descreve como configurar o ambiente, compilar o projeto e publicar nos ambientes de Homologação e Produção.

## Pré-requisitos
- Node.js 18+
- NPM ou Yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Acesso ao projeto no Firebase Console.

## Instalação
```bash
# Instalar dependências
npm install
```

## Configuração de Ambiente (.env)
Crie arquivos `.env` na raiz para definir as chaves de API.

**`.env` (Produção)**
```ini
VITE_API_KEY=seu-api-key
VITE_AUTH_DOMAIN=sps-gravata-prod.firebaseapp.com
VITE_PROJECT_ID=sps-gravata-prod
VITE_STORAGE_BUCKET=sps-gravata-prod.appspot.com
VITE_MESSAGING_SENDER_ID=...
VITE_APP_ID=...
```

**`.env.staging` (Homologação)**
```ini
VITE_API_KEY=seu-api-key-staging
VITE_AUTH_DOMAIN=sps-gravata-homolog.firebaseapp.com
...
```

## Comandos de Build e Deploy

### Desenvolvimento Local
Roda o servidor local em `http://localhost:5173`.
```bash
npm run dev
```

### Homologação (Staging)
Compila usando o modo `staging` e faz deploy para o alias `sps-gravata-homolog`.
```bash
npm run deploy:staging
```
> O comando acima executa: `tsc && vite build --mode staging && firebase deploy -P sps-gravata-homolog`

### Produção
Compila para produção e faz deploy para o projeto principal (`default`).
```bash
npm run deploy:prod
```
> O comando acima executa: `npm run build && firebase deploy -P default`

## CI/CD (Opcional)
Para configurar integração contínua (GitHub Actions), utilize os tokens de autenticação do Firebase:
1. Gere o token: `firebase login:ci`
2. Adicione `FIREBASE_TOKEN` aos segredos do repositório.
3. Configure o workflow para rodar `npm run deploy:prod` na branch `main`.
