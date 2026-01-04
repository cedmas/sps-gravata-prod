import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, Calendar, User, Activity, Edit } from 'lucide-react';
import { firestoreDb } from '../../services/firestoreDb';
import { Action, ActionStatus, UserProfile } from '../../types';
import { toast } from 'sonner';

import DeliverablesList from './DeliverablesList';
import InlineEvidenceUpload from '../../components/planning/InlineEvidenceUpload';

interface ActionsListProps {
    programId: string;
}

const statusColors: Record<ActionStatus, string> = {
    'not_started': 'bg-gray-100 text-gray-800',
    'in_progress': 'bg-blue-100 text-blue-800',
    'delayed': 'bg-red-100 text-red-800',
    'completed': 'bg-green-100 text-green-800'
};

export default function ActionsList({ programId }: ActionsListProps) {
    const { userProfile } = useAuth();
    const [actions, setActions] = useState<Action[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [users, setUsers] = useState<UserProfile[]>([]);

    const [newAction, setNewAction] = useState<Partial<Action>>({
        name: '',
        responsible: '',
        responsibleId: '',
        startDate: '',
        endDate: '',
        status: 'not_started',
        weight: 1
    });

    useEffect(() => {
        loadActions();
        loadUsers();
    }, [programId]);

    const loadActions = async () => {
        setLoading(true);
        const data = await firestoreDb.getActions(programId);
        setActions(data);
        setLoading(false);
    };

    const loadUsers = async () => {
        const u = await firestoreDb.getAllUsers();
        // Optional: Filter users by unit if we had easy access to current program's unit, 
        // but for now showing all active users is safer.
        setUsers(u.filter(user => user.active !== false));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAction.name || !newAction.responsible) return;

        const actionData = {
            ...newAction,
            programId,
            status: newAction.status as ActionStatus || 'not_started',
            weight: Number(newAction.weight) || 1
        };

        if (editingId) {
            await firestoreDb.updateAction(editingId, actionData, userProfile?.displayName);
        } else {
            await firestoreDb.createAction(actionData as any, userProfile?.displayName);
        }

        setIsAdding(false);
        setEditingId(null);
        setNewAction({ name: '', responsible: '', responsibleId: '', startDate: '', endDate: '', status: 'not_started', weight: 1 });
        loadActions();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Remover esta ação?')) {
            await firestoreDb.deleteAction(id);
            loadActions();
        }
    };



    const handleStatusChange = async (id: string, newStatus: ActionStatus) => {
        // Gatekeeper: Block 'completed' status if no evidence attached
        if (newStatus === 'completed') {
            const hasEvidence = await firestoreDb.checkActionHasEvidence(id);
            if (!hasEvidence) {
                toast.error("Ação não pode ser concluída", {
                    description: "É necessário anexar pelo menos uma evidência (foto ou documento) antes de concluir a ação."
                });
                return;
            }
        }

        // Optimistic update
        setActions(actions.map(a => a.id === id ? { ...a, status: newStatus } : a));
        await firestoreDb.updateAction(id, { status: newStatus }, userProfile?.displayName);
    };

    if (loading) return <div className="text-gray-400 text-sm">Carregando ações...</div>;

    return (
        <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Activity size={16} />
                    Projetos e Ações ({actions.length})
                </h4>
                <button
                    onClick={() => {
                        setIsAdding(!isAdding);
                        setEditingId(null);
                        setNewAction({ name: '', responsible: '', responsibleId: '', startDate: '', endDate: '', status: 'not_started', weight: 1 });
                    }}
                    className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2 py-1 rounded flex items-center gap-1 text-gray-600 transition-colors"
                >
                    <Plus size={14} /> Nova Ação
                </button>
            </div>

            {/* Add Form */}
            {isAdding && (
                <form onSubmit={handleSave} className="bg-gray-50 p-3 rounded-lg mb-4 border border-blue-100 animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="col-span-2">
                            <span className="block text-xs font-medium text-gray-600 mb-1">Nome da Ação</span>
                            <input
                                autoFocus
                                placeholder="Digite o nome da ação..."
                                className="text-sm border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newAction.name}
                                onChange={e => setNewAction({ ...newAction, name: e.target.value })}
                            />
                        </div>

                        <div className="relative group">
                            <span className="block text-xs font-medium text-gray-600 mb-1">Responsável</span>
                            <input
                                placeholder="Digite para buscar..."
                                className="text-sm border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newAction.responsible}
                                onChange={e => {
                                    setNewAction({
                                        ...newAction,
                                        responsible: e.target.value,
                                        responsibleId: '' // Reset ID when typing manually
                                    });
                                }}
                            />
                            {/* Search Results Dropdown (Pure CSS Hover/Focus logic + JS filter) */}
                            {newAction.responsible && !newAction.responsibleId && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10 hidden group-focus-within:block">
                                    {users
                                        .filter(u => u.displayName.toLowerCase().includes(newAction.responsible?.toLowerCase() || ''))
                                        .map(user => (
                                            <button
                                                key={user.uid}
                                                type="button"
                                                onClick={() => {
                                                    setNewAction({
                                                        ...newAction,
                                                        responsible: user.displayName,
                                                        responsibleId: user.uid
                                                    });
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center justify-between"
                                            >
                                                <span>{user.displayName}</span>
                                                <span className="text-xs text-gray-400 bg-gray-100 px-1 rounded">{user.role}</span>
                                            </button>
                                        ))}
                                    {users.filter(u => u.displayName.toLowerCase().includes(newAction.responsible?.toLowerCase() || '')).length === 0 && (
                                        <div className="px-3 py-2 text-xs text-gray-400 italic">Nenhum usuário encontrado.</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="block text-xs font-medium text-gray-600 mb-1">Data de Início</span>
                                <input
                                    type="date"
                                    className="text-sm border p-2 rounded w-full text-gray-600"
                                    value={newAction.startDate}
                                    onChange={e => setNewAction({ ...newAction, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <span className="block text-xs font-medium text-gray-600 mb-1">Data de Fim</span>
                                <input
                                    type="date"
                                    className="text-sm border p-2 rounded w-full text-gray-600"
                                    value={newAction.endDate}
                                    onChange={e => setNewAction({ ...newAction, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!newAction.name || !newAction.responsible}
                            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition"
                        >
                            Salvar Ação
                        </button>
                    </div>
                </form>
            )}

            {/* Actions List */}
            <div className="space-y-2">
                {actions.length === 0 && !isAdding && (
                    <p className="text-xs text-gray-400 italic">Nenhuma ação cadastrada neste programa.</p>
                )}
                {actions.map(action => {
                    const isReadOnly = userProfile?.role === 'focal' && action.responsibleId !== userProfile.uid;

                    return (
                        <div key={action.id} className={`bg-white p-3 rounded-lg border border-gray-200 shadow-sm ${isReadOnly ? 'opacity-90' : ''}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <select
                                            className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border-0 cursor-pointer outline-none focus:ring-2 ring-blue-200 ${statusColors[action.status]}`}
                                            value={action.status}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => handleStatusChange(action.id, e.target.value as ActionStatus)}
                                            disabled={isReadOnly}
                                        >
                                            <option value="not_started">Não Iniciada</option>
                                            <option value="in_progress">Em Andamento</option>
                                            <option value="delayed">Atrasada</option>
                                            <option value="completed">Concluída</option>
                                        </select>
                                        <span className="text-sm font-medium text-gray-800">{action.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <div className="flex items-center gap-1" title={action.responsibleId ? "Usuário do Sistema" : "Texto Livre"}>
                                            <User size={12} className={action.responsibleId ? "text-purple-500" : "text-gray-400"} />
                                            {action.responsible}
                                        </div>
                                        {(action.startDate || action.endDate) && (
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {action.startDate ? new Date(action.startDate).toLocaleDateString('pt-BR') : '?'} -
                                                {action.endDate ? new Date(action.endDate).toLocaleDateString('pt-BR') : '?'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    {!isReadOnly && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    setEditingId(action.id);
                                                    setNewAction(action);
                                                    setIsAdding(true);
                                                }}
                                                className="text-gray-300 hover:text-blue-500 p-2 transition-all"
                                                title="Editar Ação"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(action.id)}
                                                className="text-gray-300 hover:text-red-500 p-2 transition-all"
                                                title="Remover Ação"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Nested Deliverables */}
                            <DeliverablesList actionId={action.id} readOnly={isReadOnly} />

                            {/* Inline Evidence Upload */}
                            <InlineEvidenceUpload actionId={action.id} readOnly={isReadOnly} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
