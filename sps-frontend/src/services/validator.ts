import { firestoreDb } from './firestoreDb';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export const validator = {
    async validateProgram(programId: string): Promise<ValidationResult> {
        const errors: string[] = [];

        // 1. Fetch Children
        const indicators = await firestoreDb.getIndicators(programId);
        const actions = await firestoreDb.getActions(programId);

        // 2. Validate Indicators (At least one)
        if (indicators.length === 0) {
            errors.push('O programa deve ter pelo menos 1 Indicador estratégico.');
        }

        // 3. Validate Actions (At least one, and each must have deliverables)
        if (actions.length === 0) {
            errors.push('O programa deve ter pelo menos 1 Ação/Projeto.');
        } else {
            for (const action of actions) {
                const deliverables = await firestoreDb.getDeliverables(action.id);
                if (deliverables.length === 0) {
                    errors.push(`Ação "${action.name}" não possui entregáveis cadastrados.`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};
