import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreDb } from '../../services/firestoreDb';
import { Program, Action, Indicator, Unit, Axis } from '../../types';
import { ChevronRight, ChevronLeft, Target, Activity, Maximize2, Minimize2, MonitorPlay, Filter, AlertCircle, Zap } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import ActionDetailsModal from '../../components/dashboard/ActionDetailsModal';
import UnifiedItemCard, { UnifiedItem } from '../../components/planning/UnifiedItemCard';
import { toast } from 'sonner';
import QuickDemandModal from '../../components/dashboard/QuickDemandModal';

export default function PresentationPage() {
    const { userProfile } = useAuth();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [actions, setActions] = useState<Action[]>([]);
    const [indicators, setIndicators] = useState<Indicator[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [axes, setAxes] = useState<Axis[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters & Navigation
    const [selectedUnit, setSelectedUnit] = useState<string>('all');
    const [selectedAxis, setSelectedAxis] = useState<string>('all');
    const [onlyProblems, setOnlyProblems] = useState(false);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Modal
    const [selectedAction, setSelectedAction] = useState<Action | null>(null);
    const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);

    // Drag and Drop State
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);

        try {
            const [p, a, i, u, ax] = await Promise.all([
                firestoreDb.getPrograms(),
                firestoreDb.getAllActions(),
                firestoreDb.getAllIndicators(),
                firestoreDb.getUnits(),
                firestoreDb.getAxes()
            ]);

            setPrograms(p);
            setActions(a);
            setIndicators(i);
            setUnits(u);
            setAxes(ax);

            // Auto-select unit for non-admins (only on initial load)
            if (!silent && userProfile?.role !== 'admin' && userProfile?.unitId) {
                setSelectedUnit(userProfile.unitId);
            }
        } catch (error) {
            console.error("Error loading data:", error);
            if (!silent) toast.error("Erro ao carregar dados.");
        } finally {
            if (!silent) setLoading(false);
        }
    }, [userProfile]);

    useEffect(() => {
        loadData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            console.log("Auto-refreshing presentation data...");
            loadData(true); // Silent refresh
        }, 30000);

        return () => clearInterval(interval);
    }, [loadData]);

    // --- Filtering Logic ---
    const filteredPrograms = programs.filter(p => {
        const matchUnit = selectedUnit === 'all' || p.unitId === selectedUnit;
        const matchAxis = selectedAxis === 'all' || p.axisId === selectedAxis;

        if (!matchUnit || !matchAxis) return false;

        if (onlyProblems) {
            const hasProblemActions = actions.some(a =>
                a.programId === p.id && (a.status === 'delayed' || a.status === 'in_progress')
            );
            return hasProblemActions;
        }

        return true;
    });

    const currentProgram = filteredPrograms[currentIndex];

    // Filter Actions displayed inside current program
    const programActions = actions.filter(a => {
        if (a.programId !== currentProgram?.id) return false;
        if (onlyProblems) return a.status === 'delayed' || a.status === 'in_progress';
        return true;
    });

    const programIndicators = indicators.filter(i => i.programId === currentProgram?.id);

    // --- Navigation ---
    useEffect(() => {
        setCurrentIndex(0);
    }, [selectedUnit, selectedAxis, onlyProblems]);

    const nextProgram = () => {
        if (currentIndex < filteredPrograms.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const prevProgram = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    // --- Drag & Drop Handlers ---
    const handleDragStart = (e: React.DragEvent, item: UnifiedItem) => {
        // setDraggedItem({ id: item.id, type: item.type }); // Removed unused state
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
        // setDraggedItem(null); // Removed unused state

        try {
            const data = e.dataTransfer.getData('application/json');
            if (!data) return;
            const { id } = JSON.parse(data);

            // Optimistic Update
            setActions(prev => prev.map(a =>
                a.id === id ? { ...a, status: newStatus as any } : a
            ));

            // Persist
            await firestoreDb.updateAction(id, { status: newStatus as any }, userProfile?.displayName);
            toast.success('Movido com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao mover item.');
            loadData(); // Revert on error
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza?')) return;
        try {
            await firestoreDb.deleteAction(id);
            setActions(prev => prev.filter(a => a.id !== id));
            toast.success('Ação removida.');
        } catch (e) {
            toast.error('Erro ao remover.');
        }
    };

    // Status update callback (reloads everything just in case)
    const handleStatusChange = () => {
        loadData();
    };

    if (loading) {
        return (
            <div className="flex flex-col h-[calc(100vh-100px)] p-6 gap-6">
                <div className="flex justify-between">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <div className="flex-1 flex gap-6">
                    <Skeleton className="w-1/3 h-full rounded-2xl" />
                    <Skeleton className="flex-1 h-full rounded-2xl" />
                </div>
            </div>
        );
    }

    if (filteredPrograms.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 h-[calc(100vh-100px)]">
                <EmptyState
                    icon={MonitorPlay}
                    title="Nenhum Programa Encontrado"
                    description="Tente ajustar os filtros (Unidade, Eixo ou 'Apenas Problemas')."
                />
                <div className="mt-6 flex gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <select
                        className="text-sm p-2 border rounded bg-white"
                        value={selectedUnit}
                        onChange={e => setSelectedUnit(e.target.value)}
                        disabled={userProfile?.role !== 'admin'}
                    >
                        <option value="all">Todas as Unidades</option>
                        {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <button
                        onClick={() => setOnlyProblems(false)}
                        className={`text-sm px-3 py-2 rounded border flex items-center gap-2 ${onlyProblems ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50'}`}
                    >
                        <AlertCircle size={16} /> Mostrar Tudo
                    </button>
                </div>
            </div>
        );
    }

    const kanbanColumns = [
        { id: 'not_started', label: 'Não Iniciado', color: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
        { id: 'in_progress', label: 'Em Andamento', color: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
        { id: 'delayed', label: 'Atrasado', color: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
        { id: 'completed', label: 'Concluído', color: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    ];

    return (
        <div className={`flex flex-col h-[calc(100vh-100px)] transition-all ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-50 p-6 h-screen w-screen' : ''}`}>

            {/* Header / Situation Room Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 flex-wrap">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mr-4">
                        <Activity className="text-blue-600" />
                        Sala de Situação
                    </h2>

                    {/* Filters */}
                    <div className="flex items-center gap-2 px-2 border-l border-gray-200">
                        <Filter size={14} className="text-gray-400" />

                        {userProfile?.role === 'admin' && (
                            <select
                                className="text-sm p-1.5 border rounded bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none max-w-[150px]"
                                value={selectedUnit}
                                onChange={e => setSelectedUnit(e.target.value)}
                            >
                                <option value="all">Todas as Unidades</option>
                                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        )}

                        <select
                            className="text-sm p-1.5 border rounded bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none max-w-[150px]"
                            value={selectedAxis}
                            onChange={e => setSelectedAxis(e.target.value)}
                        >
                            <option value="all">Todos os Eixos</option>
                            {axes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>

                        <button
                            onClick={() => setOnlyProblems(!onlyProblems)}
                            className={`text-sm px-3 py-1.5 rounded-md border flex items-center gap-1.5 transition-colors
                                ${onlyProblems
                                    ? 'bg-amber-100 text-amber-800 border-amber-300 font-medium'
                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                }`}
                            title={onlyProblems ? "Mostrando apenas o que requer atenção" : "Mostrando tudo"}
                        >
                            <AlertCircle size={14} />
                            {onlyProblems ? 'Foco em Problemas' : 'Visão Geral'}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    <span className="text-sm font-medium text-gray-500 whitespace-nowrap">
                        {currentIndex + 1} / {filteredPrograms.length}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={prevProgram}
                            disabled={currentIndex === 0}
                            className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={nextProgram}
                            disabled={currentIndex === filteredPrograms.length - 1}
                            className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <div className="h-6 w-px bg-gray-200 mx-2"></div>

                    <button
                        onClick={() => setIsDemandModalOpen(true)}
                        className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 px-3 py-1.5 rounded-lg transition-all shadow-sm font-bold text-xs mr-2 animate-in fade-in zoom-in duration-300"
                        title="Criar Deliberação Rápida"
                    >
                        <Zap size={14} className="fill-yellow-950/20" />
                        Nova Deliberação
                    </button>

                    <button onClick={toggleFullscreen} className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100" title="Tela Cheia">
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                </div>
            </div>

            {/* Main Slide Content */}
            <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row animate-in fade-in slide-in-from-right-4 duration-300" key={currentProgram.id}>

                {/* Left: Program Info & Indicators */}
                <div className="w-full md:w-[280px] lg:w-[320px] shrink-0 bg-slate-900 text-white p-6 flex flex-col relative overflow-hidden transition-all duration-300">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

                    <div className="mb-6 relative z-10 w-full overflow-y-auto pr-2 custom-scrollbar max-h-[calc(100vh-300px)]">
                        <div className="flex items-start justify-between mb-4">
                            <span className="inline-block px-2 py-0.5 rounded-full bg-blue-600 text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20">
                                {axes.find(a => a.id === currentProgram.axisId)?.name.substring(0, 15) || 'Eixo Geral'}...
                            </span>
                            {programActions.some(a => a.status === 'delayed') && (
                                <span className="flex items-center gap-1 text-amber-400 text-[10px] font-bold uppercase animate-pulse">
                                    <AlertCircle size={12} />
                                </span>
                            )}
                        </div>

                        <h1 className="text-xl font-bold mb-3 leading-tight text-white">{currentProgram.name}</h1>
                        <p className="text-slate-300 text-xs leading-relaxed mb-6 border-l-2 border-slate-700 pl-3 line-clamp-[8]">{currentProgram.objective}</p>

                        <div className="space-y-4 pt-4 border-t border-slate-700/50">
                            <h4 className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-2">
                                <Target size={12} /> Indicadores
                            </h4>
                            {programIndicators.length === 0 ? (
                                <p className="text-slate-600 text-[10px] italic">Sem indicadores.</p>
                            ) : (
                                <div className="space-y-3">
                                    {programIndicators.map(ind => (
                                        <div key={ind.id} className="group">
                                            <div className="flex justify-between text-[11px] mb-1 group-hover:text-blue-200 transition-colors">
                                                <span className="truncate max-w-[150px]" title={ind.name}>{ind.name}</span>
                                                <span className="font-bold text-blue-400 whitespace-nowrap">{ind.target} {ind.unit}</span>
                                            </div>
                                            <div className="w-full bg-slate-800 rounded-full h-1">
                                                <div className="bg-blue-500 h-1 rounded-full" style={{ width: '0%' }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-auto relative z-10 border-t border-slate-800 pt-3">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Unidade Responsável</p>
                        <p className="font-medium text-sm leading-tight">{units.find(u => u.id === currentProgram.unitId)?.name || 'N/A'}</p>
                    </div>
                </div>

                {/* Right: Actions Kanban - Grid Layout */}
                <div className="flex-1 p-3 bg-slate-50/50 overflow-hidden flex flex-col min-w-0">
                    <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2 shrink-0 uppercase tracking-wide">
                        <Activity size={16} className="text-slate-400" />
                        Carteira de Projetos ({programActions.length})
                    </h3>

                    <div className="flex-1 min-h-0">
                        <div className="grid grid-cols-4 gap-2 h-full pb-1 min-w-0">
                            {kanbanColumns.map(col => {
                                const colItems = programActions.filter(a => (a.status || 'not_started') === col.id);
                                const isOverOption = dragOverColumn === col.id;

                                return (
                                    <div
                                        key={col.id}
                                        onDragOver={(e) => handleDragOver(e, col.id)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, col.id)}
                                        className={`flex flex-col h-full rounded-lg border transition-colors bg-white min-w-0
                                            ${isOverOption ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200' : 'border-slate-200'}
                                        `}
                                    >
                                        <div className={`px-2 py-1.5 border-b ${col.border} ${col.color} rounded-t-lg flex justify-between items-center shrink-0`}>
                                            <h4 className={`text-[9px] font-bold uppercase tracking-wider truncate ${col.text}`}>{col.label}</h4>
                                            <span className="bg-white/50 px-1 py-0 rounded text-[9px] font-bold text-slate-600 ml-1">{colItems.length}</span>
                                        </div>

                                        <div className="flex-1 p-1.5 space-y-2 overflow-y-auto custom-scrollbar min-h-0">
                                            {colItems.map(action => (
                                                <div
                                                    key={action.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, {
                                                        id: action.id,
                                                        type: 'action',
                                                        name: action.name,
                                                        startDate: action.startDate,
                                                        endDate: action.endDate,
                                                        data: action
                                                    })}
                                                    className="cursor-move hover:scale-[1.02] transition-transform"
                                                >
                                                    <UnifiedItemCard
                                                        item={{
                                                            id: action.id,
                                                            type: 'action', // Presentation only shows Actions for now
                                                            name: action.name,
                                                            startDate: action.startDate,
                                                            endDate: action.endDate,
                                                            data: action
                                                        }}
                                                        onDelete={(id) => handleDelete(id)}
                                                        onStatusChange={handleStatusChange}
                                                        isBoard={true}
                                                    />
                                                </div>
                                            ))}
                                            {colItems.length === 0 && !isOverOption && (
                                                <div className="h-full min-h-[50px] border-2 border-dashed border-slate-100 rounded-lg flex items-center justify-center">
                                                    <span className="text-[9px] text-slate-300">Vazio</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {selectedAction && (
                <ActionDetailsModal
                    action={selectedAction}
                    onClose={() => setSelectedAction(null)}
                />
            )}

            <QuickDemandModal
                isOpen={isDemandModalOpen}
                onClose={() => {
                    setIsDemandModalOpen(false);
                    loadData(); // Refresh list to show new demand if applicable
                }}
                programId={currentProgram?.id || ''}
            />
        </div>
    );
}
