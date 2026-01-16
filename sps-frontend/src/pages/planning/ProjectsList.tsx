import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Check, User, Folder, Zap, Sparkles } from 'lucide-react';
import { firestoreDb } from '../../services/firestoreDb';
import UsersDropdown from '../../components/common/UsersDropdown';
import UnifiedItemCard, { UnifiedItem, ItemType } from '../../components/planning/UnifiedItemCard';
import { toast } from 'sonner';

interface ProjectsListProps {
    programId: string;
}

export default function ProjectsList({ programId }: ProjectsListProps) {
    const { userProfile } = useAuth();
    const [items, setItems] = useState<UnifiedItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters (No more viewMode, always Kanban)
    const [filterMode, setFilterMode] = useState<'all' | 'mine' | 'delayed'>('all');

    // Drag and Drop State
    // const [draggedItem, setDraggedItem] = useState<{ id: string, type: ItemType } | null>(null); // Removed unused
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    // Creation State
    const [isAdding, setIsAdding] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemStartDate, setNewItemStartDate] = useState('');
    const [newItemEndDate, setNewItemEndDate] = useState('');
    const [newItemResponsible, setNewItemResponsible] = useState(''); // Name
    const [newItemResponsibleId, setNewItemResponsibleId] = useState(''); // ID
    const [newItemType, setNewItemType] = useState<ItemType>('action');
    const [aiConfidence, setAiConfidence] = useState(false);

    useEffect(() => {
        loadItems();
    }, [programId]);

    // Smart Defaults
    useEffect(() => {
        if (isAdding && userProfile) {
            if (!newItemResponsibleId) {
                setNewItemResponsible(userProfile.displayName || '');
                setNewItemResponsibleId(userProfile.uid);
            }
            if (!newItemStartDate) {
                setNewItemStartDate(new Date().toISOString().split('T')[0]);
            }
            if (!newItemEndDate) {
                const year = new Date().getFullYear();
                setNewItemEndDate(`${year}-12-31`);
            }
        }
    }, [isAdding, userProfile]);

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
        } else if (
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
                responsible: newItemResponsible || userProfile?.displayName || 'Sistema',
                responsibleId: newItemResponsibleId || userProfile?.uid
            };

            if (newItemType === 'project') {
                await firestoreDb.createProject(commonData as any);
                toast.success('Projeto criado!');
            } else {
                await firestoreDb.createAction({
                    ...commonData,
                    projectId: null,
                } as any);
                toast.success('Ação criada!');
            }
            setNewItemName('');
            setIsAdding(false);
            loadItems();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao criar item.');
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

    // Filter Logic
    const filteredItems = items.filter(item => {
        if (filterMode === 'mine') {
            return (item.data as any).responsibleId === userProfile?.uid;
        }
        if (filterMode === 'delayed') {
            return (item.data as any).status === 'delayed';
        }
        return true;
    });

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, item: UnifiedItem) => {
        // setDraggedItem({ id: item.id, type: item.type });
        e.dataTransfer.setData('application/json', JSON.stringify({ id: item.id, type: item.type }));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        setDragOverColumn(columnId);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverColumn(null);
    };

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        setDragOverColumn(null);
        // setDraggedItem(null);

        try {
            const data = e.dataTransfer.getData('application/json');
            if (!data) return;
            const { id, type } = JSON.parse(data);

            // Optimistic Update (Visual only)
            setItems(prev => prev.map(item => {
                if (item.id === id) {
                    return { ...item, data: { ...item.data, status: newStatus as any } };
                }
                return item;
            }));

            // Persist
            if (type === 'project') {
                await firestoreDb.updateProject(id, { status: newStatus as any });
            } else {
                await firestoreDb.updateAction(id, { status: newStatus as any }, userProfile?.displayName);
            }
            toast.success('Movido com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao mover item.');
            loadItems(); // Revert on error
        }
    };


    if (loading) return <div className="p-4 text-center text-gray-400">Carregando itens...</div>;

    const kanbanColumns = [
        { id: 'not_started', label: 'Não Iniciado', color: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
        { id: 'in_progress', label: 'Em Andamento', color: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
        { id: 'delayed', label: 'Atenção / Atrasado', color: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
        { id: 'completed', label: 'Concluído', color: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    ];

    return (
        <div className="p-0">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 px-6 pt-6 bg-white sticky top-0 z-10 pb-4 border-b border-slate-50">

                {/* Filter Tabs */}
                <div className="flex p-1 bg-slate-100 rounded-lg self-start">
                    <button
                        onClick={() => setFilterMode('all')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterMode === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterMode('mine')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${filterMode === 'mine' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <User size={12} /> Meus Itens
                    </button>
                    <button
                        onClick={() => setFilterMode('delayed')}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${filterMode === 'delayed' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <div className="w-2 h-2 rounded-full bg-red-500" /> Atrasados
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-indigo-200 active:scale-95"
                    >
                        <Plus size={18} />
                        <span className="font-semibold text-sm">Novo Item</span>
                    </button>
                </div>
            </div>

            {/* Creation Form */}
            {isAdding && (
                <div className="bg-white border-l-4 border-l-indigo-500 border-y border-r border-slate-100 mx-6 mb-6 p-5 rounded-r-xl shadow-lg relative animate-in slide-in-from-top-2">
                    <button onClick={() => setIsAdding(false)} className="absolute top-2 right-2 text-slate-300 hover:text-slate-500 p-1"><Check size={16} className="rotate-45" /></button>
                    <form onSubmit={handleCreate}>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Novo Cadastro</span>
                            </div>

                            <div className="relative flex items-center group">
                                <input
                                    autoFocus
                                    className="w-full text-lg font-medium border-b-2 border-slate-200 focus:border-indigo-500 pb-2 outline-none bg-transparent placeholder:text-slate-300 transition-colors"
                                    placeholder="Digite o nome do projeto ou ação..."
                                    value={newItemName}
                                    onChange={e => setNewItemName(e.target.value)}
                                />
                                <div className="absolute right-0 bottom-3 flex items-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNewItemType(newItemType === 'project' ? 'action' : 'project');
                                            setAiConfidence(false);
                                        }}
                                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase cursor-pointer transition-all flex items-center gap-1.5 ${newItemType === 'project'
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'bg-emerald-50 text-emerald-600'
                                            }`}
                                    >
                                        {newItemType === 'project' ? <Folder size={12} /> : <Zap size={12} />}
                                        {newItemType === 'project' ? 'Projeto' : 'Ação'}
                                        {aiConfidence && <Sparkles size={10} className="text-amber-500 animate-pulse" />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                <div className="flex-1">
                                    <label className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 block">Quem é o Responsável?</label>
                                    <UsersDropdown
                                        selectedUserId={newItemResponsibleId}
                                        initialName={newItemResponsible}
                                        onSelect={(user) => {
                                            setNewItemResponsible(user.displayName);
                                            setNewItemResponsibleId(user.uid);
                                        }}
                                        onInputChange={(val) => {
                                            setNewItemResponsible(val);
                                            setNewItemResponsibleId('');
                                        }}
                                        className="w-full text-sm"
                                        placeholder="Selecione..."
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 block">Data Início</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                        value={newItemStartDate}
                                        onChange={e => setNewItemStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 block">Previsão Entrega</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                        value={newItemEndDate}
                                        onChange={e => setNewItemEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsAdding(false); setNewItemName(''); }}
                                    className="px-4 py-2 text-slate-400 hover:text-slate-600 font-medium text-sm transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newItemName.trim() || !newItemStartDate || !newItemEndDate}
                                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
                                >
                                    Confirmar Criação
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* KANBAN VIEW ONLY */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 pb-6 overflow-x-auto min-w-[1000px] animate-in slide-in-from-right-4 duration-300">
                {kanbanColumns.map(col => {
                    const colItems = filteredItems.filter(item => {
                        const status = (item.data as any).status || 'not_started';
                        return status === col.id;
                    });

                    const isOverOption = dragOverColumn === col.id;

                    return (
                        <div
                            key={col.id}
                            onDragOver={(e) => handleDragOver(e, col.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, col.id)}
                            className={`flex flex-col h-full rounded-xl border transition-colors min-h-[500px]
                                ${isOverOption ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200 ring-offset-2' : 'bg-slate-50/50 border-slate-100'}
                            `}
                        >
                            {/* Column Header */}
                            <div className={`p-3 border-b ${col.border} ${col.color} rounded-t-xl mb-2 flex justify-between items-center`}>
                                <h4 className={`text-xs font-bold uppercase tracking-wider ${col.text}`}>{col.label}</h4>
                                <span className="bg-white/50 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">{colItems.length}</span>
                            </div>

                            {/* Droppable Area */}
                            <div className="flex-1 p-2 space-y-3">
                                {colItems.map(item => (
                                    <div
                                        key={item.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, item)}
                                        className="cursor-move active:cursor-grabbing hover:scale-[1.02] transition-transform duration-200 will-change-transform"
                                    >
                                        <UnifiedItemCard
                                            item={item}
                                            onDelete={handleDelete}
                                            onStatusChange={loadItems}
                                            isBoard={true}
                                        />
                                    </div>
                                ))}
                                {colItems.length === 0 && !isOverOption && (
                                    <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center">
                                        <span className="text-[10px] text-slate-400 font-medium opacity-50">Arraste itens aqui</span>
                                    </div>
                                )}
                                {isOverOption && (
                                    <div className="h-24 border-2 border-dashed border-indigo-300 bg-indigo-50/50 rounded-lg flex items-center justify-center animate-pulse">
                                        <span className="text-[10px] text-indigo-400 font-bold">Soltar aqui</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
