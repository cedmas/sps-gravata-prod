import { Unit, Program, Axis, Action, Deliverable, Indicator, Risk } from '../types';

// Initial Seed Data
const MOCK_UNITS: Unit[] = [
    { id: '1', name: 'Secretaria de Educação', acronym: 'SEMED' },
    { id: '2', name: 'Secretaria de Saúde', acronym: 'SMS' },
    { id: '3', name: 'Secretaria de Infraestrutura', acronym: 'SEINFRA' },
    { id: '4', name: 'Controladoria Geral', acronym: 'CGM' },
];

const MOCK_AXES: Axis[] = [
    { id: '1', name: 'Gestão e Governança', color: 'blue' },
    { id: '2', name: 'Desenvolvimento Social', color: 'green' },
    { id: '3', name: 'Infraestrutura e Urbanismo', color: 'gray' },
];

class MockDatabaseService {
    private units: Unit[] = [...MOCK_UNITS];
    private axes: Axis[] = [...MOCK_AXES];

    // Simulating async API delays
    private async delay(ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // --- Units ---
    async getUnits(): Promise<Unit[]> {
        await this.delay();
        return this.units;
    }

    async createUnit(unit: Omit<Unit, 'id'>): Promise<Unit> {
        await this.delay();
        const newUnit = { ...unit, id: Math.random().toString(36).substr(2, 9) };
        this.units.push(newUnit);
        return newUnit;
    }

    async deleteUnit(id: string): Promise<void> {
        await this.delay();
        this.units = this.units.filter(u => u.id !== id);
    }

    // --- Axes ---
    async getAxes(): Promise<Axis[]> {
        await this.delay();
        return this.axes;
    }

    // --- Programs ---
    private programs: Program[] = [
        {
            id: '101',
            unitId: '1', // SEMED
            name: 'Escola do Futuro',
            axisId: '1',
            objective: 'Modernizar a infraestrutura escolar',
            publicProblem: 'Escolas com equipamentos defasados',
            targetAudience: 'Alunos da rede municipal'
        }
    ];

    async getPrograms(unitId?: string): Promise<Program[]> {
        await this.delay();
        if (unitId) {
            return this.programs.filter(p => p.unitId === unitId);
        }
        return this.programs;
    }

    async createProgram(program: Omit<Program, 'id'>): Promise<Program> {
        await this.delay();

        // Rule: Max 5 Programs per Unit
        const unitPrograms = this.programs.filter(p => p.unitId === program.unitId);
        if (unitPrograms.length >= 5) {
            throw new Error("Limite de 5 programas por unidade atingido.");
        }

        const newProgram = { ...program, id: Math.random().toString(36).substr(2, 9) };
        this.programs.push(newProgram);
        return newProgram;
    }

    // --- Actions ---
    private actions: Action[] = [
        {
            id: '201',
            programId: '101',
            name: 'Reforma da Escola Municipal A',
            responsible: 'João Engenheiro',
            startDate: '2026-02-01',
            endDate: '2026-08-01',
            status: 'in_progress',
            weight: 5,
            description: 'Troca de telhado e pintura.'
        }
    ];

    async getActions(programId: string): Promise<Action[]> {
        await this.delay();
        return this.actions.filter(a => a.programId === programId);
    }

    async getAllActions(): Promise<Action[]> {
        await this.delay();
        return [...this.actions];
    }

    async createAction(action: Omit<Action, 'id'>): Promise<Action> {
        await this.delay();
        const newAction = { ...action, id: Math.random().toString(36).substr(2, 9) };
        this.actions.push(newAction);
        return newAction;
    }

    async updateAction(id: string, updates: Partial<Action>): Promise<void> {
        await this.delay();
        this.actions = this.actions.map(a =>
            a.id === id ? { ...a, ...updates } : a
        );
    }

    async deleteAction(id: string): Promise<void> {
        await this.delay();
        this.actions = this.actions.filter(a => a.id !== id);
    }

    // --- Risks ---
    private risks: Risk[] = [];

    async getRisks(programId: string): Promise<Risk[]> {
        await this.delay();
        return this.risks.filter(r => r.programId === programId);
    }

    async createRisk(data: Omit<Risk, 'id' | 'severity'>): Promise<Risk> {
        await this.delay();
        const severity = data.impact * data.probability;
        const newItem = { ...data, severity, id: Math.random().toString(36).substr(2, 9) };
        this.risks.push(newItem);
        return newItem;
    }

    async deleteRisk(id: string): Promise<void> {
        await this.delay();
        this.risks = this.risks.filter(r => r.id !== id);
    }

    // --- Deliverables ---
    private deliverables: Deliverable[] = [
        {
            id: '301',
            actionId: '201',
            description: 'Salas pintadas',
            date: '2026-06-01',
            quantity: 10,
            unit: 'Salas'
        }
    ];

    async getDeliverables(actionId: string): Promise<Deliverable[]> {
        await this.delay();
        return this.deliverables.filter(d => d.actionId === actionId);
    }

    async createDeliverable(data: Omit<Deliverable, 'id'>): Promise<Deliverable> {
        await this.delay();
        const newItem = { ...data, id: Math.random().toString(36).substr(2, 9) };
        this.deliverables.push(newItem);
        return newItem;
    }

    async deleteDeliverable(id: string): Promise<void> {
        await this.delay();
        this.deliverables = this.deliverables.filter(d => d.id !== id);
    }

    // --- Indicators ---
    private indicators: Indicator[] = [
        {
            id: '401',
            programId: '101',
            name: 'Taxa de evasão escolar',
            description: 'Percentual de alunos que abandonaram a escola',
            baseline: 5,
            target: 2,
            unit: '%'
        }
    ];

    async getIndicators(programId: string): Promise<Indicator[]> {
        await this.delay();
        return this.indicators.filter(i => i.programId === programId);
    }

    async getAllIndicators(): Promise<Indicator[]> {
        await this.delay();
        return [...this.indicators];
    }

    async createIndicator(data: Omit<Indicator, 'id'>): Promise<Indicator> {
        await this.delay();
        const newItem = { ...data, id: Math.random().toString(36).substr(2, 9) };
        this.indicators.push(newItem);
        return newItem;
    }

    async deleteIndicator(id: string): Promise<void> {
        await this.delay();
        this.indicators = this.indicators.filter(i => i.id !== id);
    }
}

export const mockDb = new MockDatabaseService();
