import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, Zap, Folder, Sparkles, Calendar, Edit2, Check, User } from 'lucide-react';
import { firestoreDb } from '../../services/firestoreDb';
import { Project, Action, ActionStatus } from '../../types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import UsersDropdown from '../../components/common/UsersDropdown'; // Import UsersDropdown

interface ProjectsListProps {
    programId: string;
}

type ItemType = 'project' | 'action';

interface UnifiedItem {
    id: string;
    type: ItemType;
    name: string;
    startDate?: string;
    endDate?: string;
    data: Project | Action;
    createdAt?: any;
}

export default function ProjectsList({ programId }: ProjectsListProps) {
    const { userProfile } = useAuth();
    const [items, setItems] = useState<UnifiedItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Creation State
    const [isAdding, setIsAdding] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemStartDate, setNewItemStartDate] = useState('');
    const [newItemEndDate, setNewItemEndDate] = useState('');
    const [newItemResponsible, setNewItemResponsible] = useState(''); // Name
    const [newItemResponsibleId, setNewItemResponsibleId] = useState(''); // ID
    const [newItemType, setNewItemType] = useState<ItemType>('action');
    const [aiConfidence, setAiConfidence] = useState(false);

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');
    const [editResponsible, setEditResponsible] = useState('');
    const [editResponsibleId, setEditResponsibleId] = useState('');

    useEffect(() => {
        loadItems();
    }, [programId]);

    // Enhanced AI Classification
    useEffect(() => {
        if (!newItemName) return;

        const lower = newItemName.toLowerCase();
        if (
            lower.includes('construir') ||
            lower.includes('construção') ||
            lower.includes('projeto') ||
            lower.includes('obra') ||
            lower.includes('implantação') ||
            lower.includes('implantar') ||
            lower.includes('reforma') ||
            lower.includes('ampliação')
        ) {
            if (newItemType !== 'project') {
                setNewItemType('project');
                setAiConfidence(true);
            }
        }
        else if (
            lower.includes('monitorar') ||
            lower.includes('monitoramento') ||
            lower.includes('realizar') ||
            lower.includes('reunião') ||
            lower.includes('contratar') ||
            lower.includes('contratação') ||
            lower.includes('capacitar') ||
            lower.includes('capacitação') ||
            lower.includes('compra') ||
            lower.includes('adquirir')
        ) {
            if (newItemType !== 'action') {
                setNewItemType('action');
                setAiConfidence(true);
            }
        }
    }, [newItemName]);

    const loadItems = async () => {
        setLoading(true);
        const projects = await firestoreDb.getProjects(programId);
        const actions = await firestoreDb.getActions(programId);
        const rootActions = actions.filter(a => !a.projectId);

        const combined: UnifiedItem[] = [
            ...projects.map(p => ({
                id: p.id,
                type: 'project' as const,
                name: p.name,
                startDate: p.startDate,
                endDate: p.endDate,
                data: p
            })),
            ...rootActions.map(a => ({
                id: a.id,
                type: 'action' as const,
                name: a.name,
                startDate: a.startDate,
                endDate: a.endDate,
                data: a
            }))
        ];

        combined.sort((a, b) => a.name.localeCompare(b.name));
        setItems(combined);
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim() || !newItemStartDate || !newItemEndDate) {
            toast.error('Preencha nome e datas.');
            return;
        }

        try {
            const commonData = {
                programId,
                name: newItemName,
                startDate: new Date(newItemStartDate).toISOString(),
                endDate: new Date(newItemEndDate).toISOString(),
                status: 'not_started',
                // Add Responsible info
                responsible: newItemResponsible || userProfile?.displayName || 'Sistema',
                responsibleId: newItemResponsibleId || userProfile?.uid
            };

            if (newItemType === 'project') {
                // Projects usually have 'manager' or similar field? 
                // Checking types: Project usually has managerId/managerName?? 
                // Assuming standard "responsible" logic is okay or we adapt.
                // FirestoreAdapter usually handles 'createProject'. 
                // Using 'any' cast as we are unifying the model for this simplified view.
                await firestoreDb.createProject(commonData as any);
                toast.success('Projeto criado!');
            } else {
                await firestoreDb.createAction({
                    ...commonData,
                    projectId: null,
                } as any);
                toast.success('Ação criada!');
            }
            // Reset form
            setNewItemName('');
            setNewItemStartDate('');
            setNewItemEndDate('');
            setNewItemResponsible('');
            setNewItemResponsibleId('');
            setIsAdding(false);
            loadItems();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao criar item.');
        }
    };

    const startEditing = (item: UnifiedItem) => {
        setEditingId(item.id);
        setEditName(item.name);
        setEditStartDate(item.startDate ? item.startDate.split('T')[0] : '');
        setEditEndDate(item.endDate ? item.endDate.split('T')[0] : '');
        // Load existing responsible
        setEditResponsible((item.data as any).responsible || '');
        setEditResponsibleId((item.data as any).responsibleId || '');
    };

    const saveEdit = async (item: UnifiedItem) => {
        try {
            const updates: any = {
                name: editName,
                responsible: editResponsible,
                responsibleId: editResponsibleId
            };
            if (editStartDate) updates.startDate = new Date(editStartDate).toISOString();
            if (editEndDate) updates.endDate = new Date(editEndDate).toISOString();

            if (item.type === 'project') {
                await firestoreDb.updateProject(item.id, updates);
            } else {
                await firestoreDb.updateAction(item.id, updates, userProfile?.displayName);
            }
            setEditingId(null);
            loadItems();
            toast.success('Salvo com sucesso!');
        } catch (e) {
            toast.error('Erro ao salvar.');
        }
    };

    const handleDelete = async (id: string, type: ItemType) => {
        if (!confirm('Tem certeza?')) return;
        try {
            if (type === 'project') await firestoreDb.deleteProject(id);
            else await firestoreDb.deleteAction(id);
            loadItems();
            toast.success('Removido.');
        } catch (e) { toast.error('Erro ao remover.'); }
    };

    const formatDate = (isoString?: string) => {
        if (!isoString) return '-';
        try {
            return format(new Date(isoString), 'dd/MM/yyyy', { locale: ptBR });
        } catch (e) { return isoString; }
    };

    if (loading) return <div className="p-4 text-center text-gray-400">Carregando itens...</div>;

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">Itens do Programa</h3>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    <span>Novo Item</span>
                </button>
            </div>

            {/* Creation Form */}
            {isAdding && (
                <div className="bg-slate-50 border border-blue-100 rounded-xl p-4 mb-6 shadow-sm animate-in slide-in-from-top-2">
                    <form onSubmit={handleCreate}>
                        <div className="flex flex-col gap-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Novo Item</label>

                            <div className="relative flex items-center">
                                <input
                                    autoFocus
                                    className="w-full border border-slate-300 rounded-lg pl-4 pr-32 py-3 focus:ring-2 focus:ring-blue-500 outline-none text-base shadow-sm bg-white"
                                    placeholder="Digite o nome (Ex: Construir Escola... ou Monitorar...)"
                                    value={newItemName}
                                    onChange={e => setNewItemName(e.target.value)}
                                />
                                {/* Integrated Type Toggle */}
                                <div className="absolute right-2 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNewItemType(newItemType === 'project' ? 'action' : 'project');
                                            setAiConfidence(false);
                                        }}
                                        className={`px-3 py-1.5 rounded-md font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-1.5 ${newItemType === 'project'
                                            ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                            }`}
                                        title="Clique para alterar o tipo"
                                    >
                                        {newItemType === 'project' ? <Folder size={14} /> : <Zap size={14} />}
                                        {newItemType === 'project' ? 'Projeto' : 'Ação'}
                                        {aiConfidence && <Sparkles size={10} className="text-amber-500 animate-pulse" />}
                                    </button>
                                </div>
                            </div>

                            {/* Dates & Responsible */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Responsável</label>
                                    <UsersDropdown
                                        selectedUserId={newItemResponsibleId}
                                        onSelect={(user) => {
                                            setNewItemResponsible(user.displayName);
                                            setNewItemResponsibleId(user.uid);
                                        }}
                                        className="w-full"
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Início</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={newItemStartDate}
                                        onChange={e => setNewItemStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Fim</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={newItemEndDate}
                                        onChange={e => setNewItemEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsAdding(false); setNewItemName(''); }}
                                    className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newItemName.trim() || !newItemStartDate || !newItemEndDate}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    Criar
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="space-y-3">
                {items.length === 0 && !isAdding && (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                        <p className="text-slate-400">Nenhum item cadastrado neste programa.</p>
                        <button onClick={() => setIsAdding(true)} className="text-blue-500 text-sm font-medium mt-2 hover:underline">Criar primeiro item</button>
                    </div>
                )}

                {items.map(item => (
                    <div
                        key={item.id}
                        className={`group bg-white rounded-lg p-4 transition-all duration-200 border-l-4 shadow-sm hover:shadow-md
                            ${item.type === 'project'
                                ? 'border-l-indigo-500 hover:border-indigo-300 border-y border-r border-slate-200'
                                : 'border-l-emerald-500 hover:border-emerald-300 border-y border-r border-slate-200'
                            }`}
                    >
                        {editingId === item.id ? (
                            // Edit Mode
                            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                                <input
                                    autoFocus
                                    className="border-b-2 border-blue-500 pb-1 text-sm font-bold w-full outline-none bg-transparent text-slate-800"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                />
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Responsável</label>
                                        <UsersDropdown
                                            selectedUserId={editResponsibleId}
                                            initialName={editResponsible}
                                            onSelect={(user) => {
                                                setEditResponsible(user.displayName);
                                                setEditResponsibleId(user.uid);
                                            }}
                                            onInputChange={(val) => {
                                                setEditResponsible(val);
                                                setEditResponsibleId(''); // Clear ID if manual typing
                                            }}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Início</label>
                                        <input type="date" className="border border-slate-200 rounded p-1.5 text-xs w-full text-slate-600 bg-slate-50" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} />
                                    </div>
                                    <div className="w-32">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Fim</label>
                                        <input type="date" className="border border-slate-200 rounded p-1.5 text-xs w-full text-slate-600 bg-slate-50" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-md transition-colors">Cancelar</button>
                                    <button onClick={() => saveEdit(item)} className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-1.5">
                                        <Check size={14} /> Salvar Alterações
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 rounded ${item.type === 'project' ? 'text-indigo-500 bg-indigo-50' : 'text-emerald-600 bg-emerald-50'
                                            }`}>
                                            {item.type === 'project' ? 'PROJETO' : 'AÇÃO'}
                                        </span>
                                        <span className="text-slate-300 text-[10px]">|</span>
                                        <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                                            <User size={10} />
                                            {(item.data as any).responsible || 'Não definido'}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-base leading-snug truncate pr-4" title={item.name}>
                                        {item.name}
                                    </h4>

                                    <div className="flex items-center gap-4 mt-2">
                                        {/* Status Dropdown */}
                                        <div className="relative group/status">
                                            <select
                                                value={(item.data as any).status || 'not_started'}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    const newStatus = e.target.value;
                                                    // ... update logic separate if needed, but keeping inline for now
                                                    if (item.type === 'project') {
                                                        firestoreDb.updateProject(item.id, { status: newStatus as ActionStatus }).then(() => { toast.success('Status atualizado'); loadItems(); });
                                                    } else {
                                                        firestoreDb.updateAction(item.id, { status: newStatus as ActionStatus }, userProfile?.displayName).then(() => { toast.success('Status atualizado'); loadItems(); });
                                                    }
                                                }}
                                                className={`appearance-none cursor-pointer pl-2 pr-6 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all focus:ring-2 focus:ring-offset-1 outline-none shadow-sm ${(item.data as any).status === 'completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' :
                                                    (item.data as any).status === 'in_progress' ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' :
                                                        (item.data as any).status === 'delayed' ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' :
                                                            'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                                    }`}
                                            >
                                                <option value="not_started">Não Iniciada</option>
                                                <option value="in_progress">Em Andamento</option>
                                                <option value="delayed">Atrasada</option>
                                                <option value="completed">Concluída</option>
                                            </select>
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-60">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                            <Calendar size={12} className="text-slate-400" />
                                            <span className="text-[11px] font-medium">{formatDate(item.startDate)} - {formatDate(item.endDate)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 pl-4 border-l border-slate-100">
                                    <button onClick={() => startEditing(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id, item.type)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
