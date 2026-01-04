# Conceito do Sistema de Planejamento Estratégico (2026-2027)

## 1. Visão Geral e Evolução
**2026 (Modo A – Organização e Controle)**
- Cadastros padronizados com validação obrigatória ("travamento").
- Acompanhamento mensal no Núcleo Gestor.
- Relatórios automáticos.
- Foco: Cultura e disciplina de planejamento.

**2027 (Modo B – Qualidade e Metodologia)**
- Introdução gradual de metodologia (alinhamento estratégico, indicadores maduros).
- Integrações orçamentárias.
- "Evidência de gestão" para controle externo (Lei 14.133).

## 2. Governança e Perfis (RBAC)
- **Administrador SCTI**: Parametrização total (unidades, perfis, templates).
- **Gestor da Unidade (Secretário)**: Aprovação de programas/projetos da unidade.
- **Ponto Focal**: Cadastro, atualização e inserção de evidências.
- **Controladoria**: Governança ativa, gestão de riscos e cobrança de prazos.
- **Prefeito**: Visão total, painéis consolidados.
- **Leitura**: Consulta apenas (Núcleo Gestor, Procuradoria).

**Princípios:**
- Secretaria: Dona do conteúdo.
- Controladoria: Dona do controle/conformidade.
- SCTI: Dona da plataforma.
- Núcleo Gestor: Deliberação.

## 3. Estrutura de Planejamento (Modelo Padrão)
**Limites:** Até 5 Programas por Unidade.

**Hierarquia:**
1. **Eixo Estratégico** (Municipal)
2. **Programa** (Por unidade)
   - Obrigatório: Objetivo, Problema público, Público-alvo, Responsável, >=1 Indicador, >=1 Projeto/Ação.
3. **Projetos e Ações**
4. **Entregas**
5. **Indicadores**
6. **Riscos**

## 4. Regras de Negócio e Validações ("Travamento")
**MVP 2026 (Essencial):**
- Bloquear publicação se faltar dados básicos (Objetivo, Problema, Responsável, Prazo).
- Entrega "Concluída" exige evidência.

**2027 (Qualidade):**
- Validação de indicadores (fórmula/fonte).
- Critérios para metas.

## 5. Relatórios Automáticos
- **Geral (Prefeito)**: Destaques, riscos altos, semáforo.
- **Por Unidade**: Detalhe de programas e entregas.
- **Por Programa**: Linha do tempo e indicadores.
- **Semáforo do Núcleo Gestor**: Status (Verde/Amarelo/Vermelho).
- **Riscos (Controladoria)**.

## 6. Modo Reunião
Interface específica para projeção em reuniões com 3 visões e filtros (mês, eixo, status):
1. Programa por Programa.
2. Secretaria por Secretaria.
3. Painel Geral com Destaques.
- "Abrir evidência" em 1 clique.

## 7. Modelo de Dados (Entidades Principais)
- `org_units` (22 unidades)
- `strategic_axes`
- `programs`
- `initiatives` (projetos/ações)
- `deliverables`
- `indicators`
- `measurements`
- `risks` / `risk_actions`
- `evidences`
- `meeting_cycles` / `meeting_notes`
- `users`, `roles`, `permissions`
- `audit_logs`

## 8. Arquitetura Técnica Recomendada
**Frontend:** React (Vite), Auth + RBAC, Dashboards.
**Backend:**
- Opção A: Firebase (Auth + Firestore + Storage + Functions).
- Opção B: API Node/NestJS + Postgres.
**Replicabilidade:** Multi-tenant.

## 9. Alertas Automáticos
- Entrega vencendo ou vencida.
- Status parado há muito tempo.
- Risco alto sem mitigação.
- Indicador sem medição.
- Unidade com alto % de atraso.
