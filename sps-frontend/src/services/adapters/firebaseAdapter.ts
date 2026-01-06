import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    query,
    where,
    getDoc,
    setDoc,
    orderBy,
    limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { Unit, Program, Project, Action, Indicator, Deliverable, Risk, Axis, UserProfile } from '../../types';
import { IDataService } from '../IDataService';

const COLLECTIONS = {
    UNITS: 'units',
    PROGRAMS: 'programs',
    PROJECTS: 'projects',
    ACTIONS: 'actions',
    INDICATORS: 'indicators',
    DELIVERABLES: 'deliverables',
    RISKS: 'risks',
    USERS: 'users',
    LOGS: 'logs'
};

const calculateDiff = (oldObj: any, newObj: any) => {
    const diff: any = {};
    for (const key in newObj) {
        if (oldObj[key] !== newObj[key]) {
            diff[key] = {
                old: oldObj[key],
                new: newObj[key]
            };
        }
    }
    return diff;
};

const logActivity = async (message: string, user: string = 'Sistema', details: any = null, entity: string | null = null, entityId: string | null = null, actionType: string | null = null) => {
    try {
        await addDoc(collection(db, COLLECTIONS.LOGS), {
            message,
            user,
            details,
            entity,
            entityId,
            action: actionType,
            createdAt: new Date().toISOString()
        });
    } catch (e) {
        console.error("Error logging activity:", e);
    }
};

export const firebaseAdapter: IDataService = {
    // --- Axes (Static for now, could be a collection later) ---
    async getAxes(): Promise<Axis[]> {
        return [
            { id: '1', name: 'Gestão e Governança', color: 'blue' },
            { id: '2', name: 'Desenvolvimento Social', color: 'green' },
            { id: '3', name: 'Infraestrutura e Urbanismo', color: 'gray' },
        ];
    },

    // --- Units ---
    async getUnits(): Promise<Unit[]> {
        const snapshot = await getDocs(collection(db, COLLECTIONS.UNITS));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
    },

    async createUnit(unit: Omit<Unit, 'id'>): Promise<Unit> {
        const docRef = await addDoc(collection(db, COLLECTIONS.UNITS), unit);
        return { id: docRef.id, ...unit };
    },

    async deleteUnit(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTIONS.UNITS, id));
    },

    async updateUnit(id: string, updates: Partial<Unit>): Promise<void> {
        const docRef = doc(db, COLLECTIONS.UNITS, id);
        await updateDoc(docRef, updates);
    },

    // --- Programs ---
    async getPrograms(unitId?: string): Promise<Program[]> {
        let q;
        if (unitId) {
            q = query(collection(db, COLLECTIONS.PROGRAMS), where("unitId", "==", unitId));
        } else {
            q = query(collection(db, COLLECTIONS.PROGRAMS));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
    },

    async createProgram(program: Omit<Program, 'id'>): Promise<Program> {
        const docRef = await addDoc(collection(db, COLLECTIONS.PROGRAMS), program);
        await logActivity(`Novo Programa criado: ${program.name}`, 'Sistema', program, 'Program', docRef.id, 'CREATE');
        return { id: docRef.id, ...program };
    },

    async updateProgram(id: string, updates: Partial<Program>, userName: string = 'Sistema'): Promise<void> {
        const docRef = doc(db, COLLECTIONS.PROGRAMS, id);
        const oldDoc = await getDoc(docRef);
        const oldData = oldDoc.data() as Program;

        await updateDoc(docRef, updates);

        const diff = calculateDiff(oldData, updates);
        await logActivity(`Programa atualizado: ${oldData?.name || id}`, userName, diff, 'Program', id, 'UPDATE');
    },

    async deleteProgram(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTIONS.PROGRAMS, id));
        await logActivity(`Programa excluído: ${id}`, 'Sistema', null, 'Program', id, 'DELETE');
    },

    // --- Projects ---
    async getProjects(programId: string): Promise<Project[]> {
        const q = query(
            collection(db, COLLECTIONS.PROJECTS),
            where("programId", "==", programId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    },

    async createProject(project: Omit<Project, 'id'>): Promise<Project> {
        const docRef = await addDoc(collection(db, COLLECTIONS.PROJECTS), project);
        await logActivity(`Novo Projeto criado: ${project.name}`, 'Sistema', project, 'Project', docRef.id, 'CREATE');
        return { id: docRef.id, ...project };
    },

    async updateProject(id: string, updates: Partial<Project>): Promise<void> {
        const docRef = doc(db, COLLECTIONS.PROJECTS, id);
        const oldDoc = await getDoc(docRef);
        const oldData = oldDoc.data() as Project;

        await updateDoc(docRef, updates);

        const diff = calculateDiff(oldData, updates);
        await logActivity(`Projeto atualizado: ${oldData?.name || id}`, 'Sistema', diff, 'Project', id, 'UPDATE');
    },

    async deleteProject(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTIONS.PROJECTS, id));
    },

    // --- Actions ---
    async getActions(programId: string): Promise<Action[]> {
        const q = query(
            collection(db, COLLECTIONS.ACTIONS),
            where("programId", "==", programId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Action));
    },

    async getProjectActions(projectId: string): Promise<Action[]> {
        const q = query(
            collection(db, COLLECTIONS.ACTIONS),
            where("projectId", "==", projectId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Action));
    },

    async getAllActions(): Promise<Action[]> {
        const snapshot = await getDocs(collection(db, COLLECTIONS.ACTIONS));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Action));
    },

    async createAction(action: Omit<Action, 'id'>, userName: string = 'Sistema'): Promise<Action> {
        const docRef = await addDoc(collection(db, COLLECTIONS.ACTIONS), action);
        await logActivity(`Nova Ação criada: ${action.name}`, userName, action, 'Action', docRef.id, 'CREATE');
        return { id: docRef.id, ...action };
    },

    async updateAction(id: string, updates: Partial<Action>, userName: string = 'Sistema'): Promise<void> {
        const docRef = doc(db, COLLECTIONS.ACTIONS, id);
        const oldDoc = await getDoc(docRef);
        const oldData = oldDoc.data() as Action;

        await updateDoc(docRef, updates);

        const diff = calculateDiff(oldData, updates);
        await logActivity(`Ação atualizada: ${oldData?.name || id}`, userName, diff, 'Action', id, 'UPDATE');
    },

    async deleteAction(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTIONS.ACTIONS, id));
    },

    // --- Indicators ---
    async getIndicators(programId: string): Promise<Indicator[]> {
        const q = query(
            collection(db, COLLECTIONS.INDICATORS),
            where("programId", "==", programId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Indicator));
    },

    async getAllIndicators(): Promise<Indicator[]> {
        const snapshot = await getDocs(collection(db, COLLECTIONS.INDICATORS));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Indicator));
    },

    async createIndicator(data: Omit<Indicator, 'id'>): Promise<Indicator> {
        const docRef = await addDoc(collection(db, COLLECTIONS.INDICATORS), data);
        return { id: docRef.id, ...data };
    },

    async deleteIndicator(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTIONS.INDICATORS, id));
    },

    async updateIndicator(id: string, updates: Partial<Indicator>): Promise<void> {
        const docRef = doc(db, COLLECTIONS.INDICATORS, id);
        await updateDoc(docRef, updates);
        await logActivity(`Indicador atualizado (ID: ${id})`);
    },

    // --- Deliverables ---
    async getAllDeliverables(): Promise<Deliverable[]> {
        const snapshot = await getDocs(collection(db, COLLECTIONS.DELIVERABLES));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deliverable));
    },

    async getDeliverables(actionId: string): Promise<Deliverable[]> {
        const q = query(
            collection(db, COLLECTIONS.DELIVERABLES),
            where("actionId", "==", actionId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deliverable));
    },

    async createDeliverable(data: Omit<Deliverable, 'id'>): Promise<Deliverable> {
        const docRef = await addDoc(collection(db, COLLECTIONS.DELIVERABLES), data);
        return { id: docRef.id, ...data };
    },

    async deleteDeliverable(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTIONS.DELIVERABLES, id));
    },

    // --- Risks ---
    async getRisks(programId: string): Promise<Risk[]> {
        const q = query(
            collection(db, COLLECTIONS.RISKS),
            where("programId", "==", programId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Risk));
    },

    async createRisk(data: Omit<Risk, 'id'>): Promise<Risk> {
        const docRef = await addDoc(collection(db, COLLECTIONS.RISKS), data);
        return { id: docRef.id, ...data };
    },

    async deleteRisk(id: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTIONS.RISKS, id));
    },

    async updateRisk(id: string, updates: Partial<Risk>): Promise<void> {
        const docRef = doc(db, COLLECTIONS.RISKS, id);
        await updateDoc(docRef, updates);
        await logActivity(`Risco atualizado (ID: ${id})`);
    },

    // --- Global Settings ---
    async getGlobalSettings(): Promise<{ geminiApiKey?: string }> {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as { geminiApiKey?: string };
        }
        return {};
    },

    async saveGlobalSettings(settings: { geminiApiKey?: string }): Promise<void> {
        const docRef = doc(db, 'settings', 'global');
        await setDoc(docRef, settings, { merge: true });
    },

    // --- Evidences ---
    async getEvidences(actionId?: string): Promise<any[]> {
        let q;
        if (actionId) {
            q = query(collection(db, 'evidences'), where("actionId", "==", actionId));
        } else {
            q = query(collection(db, 'evidences'));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async createEvidence(data: any): Promise<any> {
        const docRef = await addDoc(collection(db, 'evidences'), {
            ...data,
            createdAt: new Date().toISOString()
        });
        return { id: docRef.id, ...data };
    },

    async deleteEvidence(id: string): Promise<void> {
        await deleteDoc(doc(db, 'evidences', id));
    },

    async checkActionHasEvidence(actionId: string): Promise<boolean> {
        const q = query(
            collection(db, 'evidences'),
            where("actionId", "==", actionId),
            limit(1)
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    },

    // --- Users ---
    async getUser(uid: string): Promise<UserProfile | null> {
        const docRef = doc(db, COLLECTIONS.USERS, uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return { uid: snapshot.id, ...snapshot.data() } as UserProfile;
        }
        return null;
    },

    async createUser(user: UserProfile): Promise<void> {
        await setDoc(doc(db, COLLECTIONS.USERS, user.uid), user);
    },

    async updateUser(uid: string, data: Partial<UserProfile>): Promise<void> {
        const docRef = doc(db, COLLECTIONS.USERS, uid);
        await updateDoc(docRef, data);
    },

    async getAllUsers(): Promise<UserProfile[]> {
        const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
    },

    async deleteUser(uid: string): Promise<void> {
        await deleteDoc(doc(db, COLLECTIONS.USERS, uid));
    },

    // --- Logs ---
    async getRecentActivity(): Promise<any[]> {
        const q = query(
            collection(db, COLLECTIONS.LOGS),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};
