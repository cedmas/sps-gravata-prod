export type UserRole = 'admin' | 'gestor' | 'focal' | 'controladoria' | 'prefeito' | 'leitura';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    unitId?: string; // ID da secretaria vinculada
    active?: boolean; // Se false, o usuário não pode logar
}

export interface Axis {
    id: string;
    name: string;
    color: string;
}

export interface Unit {
    id: string;
    name: string;
    acronym: string; // Sigla (e.g. SEMED)
}

export interface Program {
    id: string;
    unitId: string;
    name: string;
    objective: string;
    publicProblem: string;
    targetAudience: string;
    axisId: string; // Eixo Estratégico
}

export type ActionStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed';

export interface Action {
    id: string;
    programId: string;
    name: string;
    responsible: string;
    responsibleId?: string; // UID do usuário responsável
    startDate: string;
    endDate: string;
    status: ActionStatus;
    weight: number; // Peso (1-10 ou percentual)
    description?: string;
}

export interface Deliverable {
    id: string;
    actionId: string;
    description: string;
    date: string;
    quantity: number;
    unit: string; // Und, Kg, Km, etc.
}

export interface Risk {
    id: string;
    programId: string;
    description: string;
    impact: number;      // 1-5
    probability: number; // 1-5
    severity: number;    // Calculated (Impact * Probability)
    mitigation: string;
}

export interface Indicator {
    id: string;
    programId: string;
    name: string;
    description: string;
    baseline: number;
    target: number;
    unit: string; // %, #, R$, etc.
}
