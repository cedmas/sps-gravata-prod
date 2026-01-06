import { Action, Axis, Deliverable, Indicator, Program, Risk, Unit, UserProfile } from "../../types";
import { IDataService } from "../IDataService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const localAdapter: IDataService = {
    // --- AXES ---
    async getAxes(): Promise<Axis[]> {
        // Mock static axes for now, as backend doesn't store them yet
        return [
            { id: '1', name: 'Gestão e Governança', color: 'blue' },
            { id: '2', name: 'Desenvolvimento Social', color: 'green' },
            { id: '3', name: 'Infraestrutura e Urbanismo', color: 'gray' },
        ];
    },

    // --- UNITS ---
    // --- UNITS ---
    async getUnits(): Promise<Unit[]> {
        const res = await fetch(`${API_URL}/units`);
        if (!res.ok) throw new Error('Failed to fetch units');
        return res.json();
    },
    async createUnit(unit): Promise<Unit> {
        return { id: Math.random().toString(), ...unit };
    },
    async deleteUnit(id): Promise<void> { },
    async updateUnit(id, updates): Promise<void> { },

    // --- PROGRAMS ---
    async getPrograms(): Promise<Program[]> {
        const res = await fetch(`${API_URL}/programs`);
        if (!res.ok) throw new Error('Failed to fetch programs');
        return res.json();
    },
    async createProgram(program): Promise<Program> {
        const res = await fetch(`${API_URL}/programs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(program)
        });
        if (!res.ok) throw new Error('Failed to create program');
        return res.json();
    },
    async updateProgram(id, updates, userName): Promise<void> {
        await fetch(`${API_URL}/programs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
    },

    // --- ACTIONS ---
    async getActions(programId): Promise<Action[]> {
        const res = await fetch(`${API_URL}/programs/${programId}/actions`);
        return res.json();
    },
    async getAllActions(): Promise<Action[]> {
        const res = await fetch(`${API_URL}/actions`);
        return res.json();
    },
    async createAction(action, userName): Promise<Action> {
        const res = await fetch(`${API_URL}/actions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action)
        });
        return res.json();
    },
    async updateAction(id, updates, userName): Promise<void> {
        await fetch(`${API_URL}/actions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
    },
    async deleteAction(id): Promise<void> {
        await fetch(`${API_URL}/actions/${id}`, { method: 'DELETE' });
    },

    // --- INDICATORS ---
    async getIndicators(programId): Promise<Indicator[]> {
        const res = await fetch(`${API_URL}/programs/${programId}/indicators`);
        return res.json();
    },
    async getAllIndicators(): Promise<Indicator[]> {
        return [];
    },
    async createIndicator(data): Promise<Indicator> {
        const res = await fetch(`${API_URL}/indicators`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },
    async updateIndicator(id, updates): Promise<void> { },
    async deleteIndicator(id): Promise<void> { },

    // --- DELIVERABLES ---
    async getAllDeliverables(): Promise<Deliverable[]> { return []; },
    async getDeliverables(actionId): Promise<Deliverable[]> { return []; },
    async createDeliverable(data): Promise<Deliverable> { return data as any; },
    async deleteDeliverable(id): Promise<void> { },

    // --- RISKS ---
    async getRisks(programId): Promise<Risk[]> { return []; },
    async createRisk(data): Promise<Risk> { return data as any; },
    async deleteRisk(id): Promise<void> { },
    async updateRisk(id, updates): Promise<void> { },

    // --- SETTINGS ---
    async getGlobalSettings(): Promise<{ geminiApiKey?: string }> {
        const res = await fetch(`${API_URL}/settings`);
        if (!res.ok) return {};
        return res.json();
    },
    async saveGlobalSettings(settings): Promise<void> {
        await fetch(`${API_URL}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
    },

    // --- EVIDENCES ---
    async getEvidences(actionId?: string): Promise<any[]> {
        const url = actionId
            ? `${API_URL}/actions/${actionId}/evidences`
            : `${API_URL}/evidences`;

        const res = await fetch(url);
        if (!res.ok) return [];
        return res.json();
    },
    async createEvidence(data): Promise<any> {
        const res = await fetch(`${API_URL}/evidences`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },
    async deleteEvidence(id): Promise<void> {
        await fetch(`${API_URL}/evidences/${id}`, { method: 'DELETE' });
    },
    async checkActionHasEvidence(actionId): Promise<boolean> {
        const evidences = await this.getEvidences(actionId);
        return evidences.length > 0;
    },

    // --- USERS ---
    async getUser(uid): Promise<UserProfile | null> {
        const res = await fetch(`${API_URL}/users/${uid}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
    },
    async createUser(user): Promise<void> {
        await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
    },
    async updateUser(uid, data): Promise<void> {
        // Prepare payload with uid for upsert
        const payload = { ...data, uid };
        await fetch(`${API_URL}/users`, {
            method: 'POST', // Backend uses upsert on POST
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    },
    async getAllUsers(): Promise<UserProfile[]> {
        const res = await fetch(`${API_URL}/users`);
        return res.json();
    },
    async deleteUser(uid): Promise<void> {
        await fetch(`${API_URL}/users/${uid}`, { method: 'DELETE' });
    },

    // --- LOGS ---
    async getRecentActivity(): Promise<any[]> { return []; }
};
