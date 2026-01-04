import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreDb } from '../../services/firestoreDb';
import { Program, Action, Indicator, Unit, Axis } from '../../types';
import { ChevronRight, ChevronLeft, Target, Activity, Maximize2, Minimize2, MonitorPlay, Filter, AlertCircle } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import ActionDetailsModal from '../../components/dashboard/ActionDetailsModal';

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

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
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

        // Auto-select unit for non-admins
        if (userProfile?.role !== 'admin' && userProfile?.unitId) {
            setSelectedUnit(userProfile.unitId);
        }

        setLoading(false);
    };

    // --- Filtering Logic ---
    const filteredPrograms = programs.filter(p => {
        const matchUnit = selectedUnit === 'all' || p.unitId === selectedUnit;
        const matchAxis = selectedAxis === 'all' || p.axisId === selectedAxis;

        // If "Only Problems", we only show programs that have at least one problem action
        // OR we filter the actions inside later? 
        // Better UX: Show programs, but filter the actions list inside.
        // BUT if a program has NO problem actions, should we skip it in the slideshow?
        // Yes, Situation Room focuses on what needs attention.

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
    // Reset index when filters change to avoid out of bounds
    useEffect(() => {
        setCurrentIndex(0);
    }, [selectedUnit, selectedAxis, onlyProblems]);

    const nextProgram = () => {
        if (currentIndex < filteredPrograms.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const prevProgram = () => {
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'in_progress': return 'bg-blue-500';
            case 'delayed': return 'bg-red-500';
            default: return 'bg-gray-300';
        }
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

                {/* Controls to reset */}
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

                        {/* Unit Filter */}
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

                        {/* Axis Filter */}
                        <select
                            className="text-sm p-1.5 border rounded bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none max-w-[150px]"
                            value={selectedAxis}
                            onChange={e => setSelectedAxis(e.target.value)}
                        >
                            <option value="all">Todos os Eixos</option>
                            {axes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>

                        {/* Problem Toggle */}
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
                    <button onClick={toggleFullscreen} className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100" title="Tela Cheia">
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                </div>
            </div>

            {/* Main Slide Content */}
            <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row animate-in fade-in slide-in-from-right-4 duration-300" key={currentProgram.id}>

                {/* Left: Program Info & Indicators */}
                <div className="w-full md:w-1/3 bg-slate-900 text-white p-8 flex flex-col relative overflow-hidden">
                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

                    <div className="mb-8 relative z-10">
                        <div className="flex items-start justify-between mb-4">
                            <span className="inline-block px-3 py-1 rounded-full bg-blue-600 text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20">
                                {axes.find(a => a.id === currentProgram.axisId)?.name || 'Eixo Geral'}
                            </span>
                            {/* Validation Badge based on content */}
                            {programActions.some(a => a.status === 'delayed') && (
                                <span className="flex items-center gap-1 text-amber-400 text-xs font-bold uppercase animate-pulse">
                                    <AlertCircle size={14} /> Atenção Necessária
                                </span>
                            )}
                        </div>

                        <h1 className="text-3xl font-bold mb-4 leading-tight text-white">{currentProgram.name}</h1>
                        <p className="text-slate-300 text-sm leading-relaxed mb-8 border-l-2 border-slate-700 pl-4">{currentProgram.objective}</p>

                        <div className="space-y-5 pt-6 border-t border-slate-700/50">
                            <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2">
                                <Target size={14} /> Indicadores de Resultado
                            </h4>
                            {programIndicators.length === 0 ? (
                                <p className="text-slate-600 text-xs italic">Sem indicadores definidos.</p>
                            ) : (
                                <div className="space-y-4">
                                    {programIndicators.map(ind => (
                                        <div key={ind.id} className="group">
                                            <div className="flex justify-between text-sm mb-1 group-hover:text-blue-200 transition-colors">
                                                <span>{ind.name}</span>
                                                <span className="font-bold text-blue-400">{ind.target} {ind.unit}</span>
                                            </div>
                                            <div className="w-full bg-slate-800 rounded-full h-1.5">
                                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '0%' }}></div> {/* Mock progress */}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-auto relative z-10">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Unidade Responsável</p>
                        <p className="font-semibold text-lg">{units.find(u => u.id === currentProgram.unitId)?.name || 'N/A'}</p>
                    </div>
                </div>

                {/* Right: Actions Status - Grid Layout */}
                <div className="flex-1 p-8 bg-white overflow-y-auto">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 sticky top-0 bg-white z-10 py-2">
                        <Activity size={20} className="text-slate-400" />
                        Carteira de Projetos ({programActions.length})
                    </h3>

                    <div className="grid grid-cols-1 gap-3">
                        {programActions.length === 0 ? (
                            <EmptyState
                                icon={Activity}
                                title={onlyProblems ? "Tudo em Ordem!" : "Nenhuma ação"}
                                description={onlyProblems ? "Nenhuma ação atrasada ou em andamento neste programa." : "Nenhuma ação cadastrada."}
                            />
                        ) : (
                            programActions.map(action => (
                                <div
                                    key={action.id}
                                    onClick={() => setSelectedAction(action)}
                                    className="flex items-center p-4 border border-gray-100 rounded-xl hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group bg-white"
                                >
                                    <div className={`w-3 h-3 rounded-full mr-4 shrink-0 shadow-sm ${getStatusColor(action.status)}`}></div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{action.name}</h4>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                            <span className="truncate max-w-[150px]" title={action.responsible}>Resp: {action.responsible}</span>
                                            {action.endDate && <span className="shrink-0 text-xs bg-gray-50 px-2 py-0.5 rounded text-gray-400">Prazo: {new Date(action.endDate).toLocaleDateString('pt-BR')}</span>}
                                        </div>
                                    </div>

                                    <div className="text-right flex items-center gap-3">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide whitespace-nowrap
                                            ${action.status === 'completed' ? 'bg-green-50 text-green-700 border border-green-100' :
                                                action.status === 'delayed' ? 'bg-red-50 text-red-700 border border-red-100' :
                                                    action.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
                                            {action.status === 'not_started' ? 'Não Iniciada' :
                                                action.status === 'in_progress' ? 'Em Andamento' :
                                                    action.status === 'delayed' ? 'Atrasada' : 'Concluída'}
                                        </span>
                                        <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {selectedAction && (
                <ActionDetailsModal
                    action={selectedAction}
                    onClose={() => setSelectedAction(null)}
                />
            )}
        </div>
    );
}
