import { Unit, Program, Action, Indicator, Deliverable, Risk, Axis, UserProfile } from '../types';

export interface IDataService {
    // Axes
    getAxes(): Promise<Axis[]>;

    // Units
    getUnits(): Promise<Unit[]>;
    createUnit(unit: Omit<Unit, 'id'>): Promise<Unit>;
    deleteUnit(id: string): Promise<void>;
    updateUnit(id: string, updates: Partial<Unit>): Promise<void>;

    // Programs
    getPrograms(): Promise<Program[]>;
    createProgram(program: Omit<Program, 'id'>): Promise<Program>;
    updateProgram(id: string, updates: Partial<Program>, userName?: string): Promise<void>;

    // Actions
    getActions(programId: string): Promise<Action[]>;
    getAllActions(): Promise<Action[]>;
    createAction(action: Omit<Action, 'id'>, userName?: string): Promise<Action>;
    updateAction(id: string, updates: Partial<Action>, userName?: string): Promise<void>;
    deleteAction(id: string): Promise<void>;

    // Indicators
    getIndicators(programId: string): Promise<Indicator[]>;
    getAllIndicators(): Promise<Indicator[]>;
    createIndicator(data: Omit<Indicator, 'id'>): Promise<Indicator>;
    deleteIndicator(id: string): Promise<void>;
    updateIndicator(id: string, updates: Partial<Indicator>): Promise<void>;

    // Deliverables
    getAllDeliverables(): Promise<Deliverable[]>;
    getDeliverables(actionId: string): Promise<Deliverable[]>;
    createDeliverable(data: Omit<Deliverable, 'id'>): Promise<Deliverable>;
    deleteDeliverable(id: string): Promise<void>;

    // Risks
    getRisks(programId: string): Promise<Risk[]>;
    createRisk(data: Omit<Risk, 'id'>): Promise<Risk>;
    deleteRisk(id: string): Promise<void>;
    updateRisk(id: string, updates: Partial<Risk>): Promise<void>;

    // Settings
    getGlobalSettings(): Promise<{ geminiApiKey?: string }>;
    saveGlobalSettings(settings: { geminiApiKey?: string }): Promise<void>;

    // Evidences
    getEvidences(actionId?: string): Promise<any[]>;
    createEvidence(data: any): Promise<any>;
    deleteEvidence(id: string): Promise<void>;
    checkActionHasEvidence(actionId: string): Promise<boolean>;

    // Users
    getUser(uid: string): Promise<UserProfile | null>;
    createUser(user: UserProfile): Promise<void>;
    updateUser(uid: string, data: Partial<UserProfile>): Promise<void>;
    getAllUsers(): Promise<UserProfile[]>;
    deleteUser(uid: string): Promise<void>;

    // Logs
    getRecentActivity(): Promise<any[]>;
}
