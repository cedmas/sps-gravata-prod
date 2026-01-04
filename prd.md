# PRD — Documento de Requisitos do Produto (Versão Executiva)

## 1. Visão Geral
**Objetivo**: Implantar um Sistema Web de Gestão do Planejamento Estratégico do Município de Gravatá para 2026.
**Foco**: Organização, controle, acompanhamento mensal, relatórios executivos e preparação para maturidade metodológica (2027).

### 1.2 Escopo (2026)
- **Uso**: Interno (Governo).
- **Unidades**: 22 unidades monitoradas.
- **Eixos Estratégicos**: Fixos (municipais).
- **Limites**: Até 5 Programas por Unidade.
- **Controle**: Cadastros travados (validações de qualidade mínimas).
- **Saídas**: Relatórios automáticos (PDF/Excel) e Modo Reunião (3 visões).

### 1.3 Fora do Escopo (2026)
- Integração nativa com PPA/LDO/LOA.
- Portal da Transparência/Cidadão.
- Avaliação externa formal.

## 2. Perfis de Usuário (RBAC)
1.  **Prefeito**: Visão total consolidada, dashboards.
2.  **Núcleo Gestor**: Leitura, acompanhamento, deliberação.
3.  **Controladoria**: Governança de riscos, conformidade, cobrança.
4.  **SCTI**: Administração técnica, parametrização.
5.  **Gestor da Unidade**: Aprovação de conteúdo da sua pasta.
6.  **Ponto Focal**: Operacional (cadastro, atualização, evidências).

## 3. Estrutura e Regras de Negócio

### 3.1 Hierarquia de Planejamento
1.  **Eixo Estratégico** (Fixo)
    *   *Sugestões*: Gestão e Governança, Desenvolvimento Social, Infraestrutura e Urbanismo, Meio Ambiente, Desenvolvimento Econômico, Inovação.
2.  **Programa** (Máx 5 por Unidade)
3.  **Projetos/Ações**
4.  **Entregas**
5.  **Indicadores**
6.  **Riscos**

### 3.2 "Travamentos" (Validação Obrigatória)
O sistema impede publicação/ativação se:
-   **Programa**: Sem objetivo, problema público, público-alvo ou sem indicadores (>=1).
-   **Projeto/Ação**: Sem responsável, prazo ou status.
-   **Entrega**: Marcada como "Concluída" sem evidência anexada.
-   **Indicador**: Sem meta, fonte ou periodicidade.

## 4. Backlog (Épicos do MVP)

### ÉPICO 1 — Autenticação e Perfis
-   [ ] Login seguro.
-   [ ] RBAC (Role-Based Access Control).
-   [ ] Associação Usuário <-> Unidade.

### ÉPICO 2 — Cadastro Estrutural
-   [ ] CRUD Unidades Organizacionais.
-   [ ] CRUD Eixos Estratégicos.
-   [ ] Gestão de Usuários e Pontos Focais.

### ÉPICO 3 — Planejamento
-   [ ] Cadastro de Programas (com validação de limite).
-   [ ] Cadastro de Projetos/Ações.
-   [ ] Cadastro de Entregas.
-   [ ] Cadastro de Indicadores.

### ÉPICO 4 — Validações (Engine de Travamento)
-   [ ] Regras de consistência para publicação.
-   [ ] Checklist visual de pendências.

### ÉPICO 5 — Monitoramento
-   [ ] Workflow de Status (Planejado -> Em andamento -> Concluído -> Atrasado).
-   [ ] Gestão de Evidências (Upload/Link).
-   [ ] Linha do Tempo.

### ÉPICO 6 — Riscos e Alertas
-   [ ] Cadastro de Riscos e Mitigações.
-   [ ] Matriz Probabilidade x Impacto.
-   [ ] Alertas automáticos (prazos, sem evidência).

### ÉPICO 7 — Modo Reunião
-   [ ] Visões Toggle: Programa | Secretaria | Geral.
-   [ ] Navegação rápida ("1 clique" na evidência).
-   [ ] Filtros (mês, eixo, status).

### ÉPICO 8 — Relatórios
-   [ ] Geração PDF/Excel.
-   [ ] Modelos: Geral (Prefeito), Por Unidade, Por Programa, Semáforo, Riscos.

### ÉPICO 9 — Auditoria
-   [ ] Logs de alteração.

## 5. Arquitetura Técnica
-   **Frontend**: React (Vite).
-   **Backend**: Firebase (Auth, Firestore, Storage, Functions).
-   **Conceito**: Multi-tenant (preparado para replicação).

## 6. Wireframes (Conceituais)
-   **Dashboard (Prefeito)**: KPIs, Destaques, Atalho Modo Reunião.
-   **Modo Reunião**: Foco total na apresentação fluida.
-   **Tela da Unidade**: Gestão dos 5 programas.
