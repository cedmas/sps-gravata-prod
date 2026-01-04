import { GoogleGenerativeAI } from "@google/generative-ai";
import { firestoreDb } from "./firestoreDb";

export interface AuditResult {
    score: number;
    analysis: string;
    suggestedProblem: string;
    suggestedAudience: string;
    suggestedObjective: string;
}

export const aiService = {
    async auditProgram(problem: string, objective: string, targetAudience: string): Promise<AuditResult> {
        const settings = await firestoreDb.getGlobalSettings();
        const apiKey = settings.geminiApiKey;
        console.warn(`[AI Debug] Reading Key from Firestore: ${apiKey ? 'Found' : 'Missing'}`);

        if (!apiKey) {
            throw new Error("API Key não configurada no Painel de Controle.");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            Você é um consultor especialista em planejamento estratégico governamental.
            Analise a "Triangulação Estratégica" (Coerência Lógica) entre o Problema, o Objetivo e o Público-Alvo.

            Problema Público: "${problem}"
            Objetivo do Programa: "${objective}"
            Público-Alvo: "${targetAudience}"

            Critérios de Avaliação:
            1. O Objetivo ataca a causa raiz do Problema?
            2. O Público-Alvo é de fato quem sofre o Problema?
            3. A solução proposta no Objetivo é adequada para esse Público?

            Retorne APENAS um JSON (sem markdown) com o seguinte formato:
            {
                "score": (número de 0 a 10),
                "analysis": (Uma análise curta e direta sobre a conexão entre os três elementos. Aponte discrepâncias se houver.),
                "suggestedProblem": (Uma reescrita do Problema Público para ser mais claro e específico. Se estiver bom, mantenha o original mas melhore a redação.),
                "suggestedAudience": (Uma reescrita do Público-Alvo para ser mais preciso. Ex: "Moradores da zona rural" em vez de "População".),
                "suggestedObjective": (Uma reescrita do Objetivo para maximizar a coerência com o Problema e o Público.)
            }
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean markdown if present
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(jsonStr) as AuditResult;
        } catch (error: any) {
            console.error("AI Service Error Details:", error);

            if (error.message?.includes('API Key')) {
                throw new Error("Chave de API inválida ou não configurada.");
            }
            if (error.response?.candidates?.[0]?.finishReason === "SAFETY") {
                throw new Error("Conteúdo bloqueado por filtros de segurança.");
            }

            throw new Error(`Falha na IA: ${error.message || 'Erro desconhecido'}`);
        }
    },

    async generateDashboardSummary(data: any): Promise<string> {
        const settings = await firestoreDb.getGlobalSettings();
        const apiKey = settings.geminiApiKey;

        if (!apiKey) throw new Error("API Key não configurada.");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            Aja como um Chefe de Gabinete de Governo.
            Analise os seguintes dados do painel de monitoramento estratégico:

            ${JSON.stringify(data, null, 2)}

            Escreva um "Briefing Executivo" de 3 parágrafos curtos para o Prefeito/Gestor:
            1. Visão Geral (O que está indo bem?)
            2. Pontos de Atenção (Onde estão os atrasos ou gargalos?)
            3. Recomendação Estratégica (O que priorizar hoje?)

            Tom de voz: Profissional, direto, orientado a resultados. Sem saudações. Texto corrido formatado em HTML simples (use <strong> para destaques).
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean markdown code blocks if the AI adds them (common behavior)
        text = text.replace(/```html/g, '').replace(/```/g, '').trim();

        return text;
    }
};
