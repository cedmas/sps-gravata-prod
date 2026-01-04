import { useState, useEffect } from 'react';
import { firestoreDb } from '../../services/firestoreDb';
import { AlertTriangle, CheckCircle, Clock, Calendar, BarChart2 } from 'lucide-react';

export default function WarRoomPage() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [stats, setStats] = useState({
        totalActions: 0,
        delayed: 0,
        completed: 0,
        completedPercentage: 0
    });
    const [delayedActions, setDelayedActions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Clock check every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Data refresh every 5 minutes
    useEffect(() => {
        loadWarRoomData();
        const dataTimer = setInterval(loadWarRoomData, 5 * 60 * 1000);
        return () => clearInterval(dataTimer);
    }, []);

    const loadWarRoomData = async () => {
        setLoading(true);
        try {
            const actions = await firestoreDb.getAllActions();

            const total = actions.length;
            const delayed = actions.filter(a => a.status === 'delayed').sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
            const completed = actions.filter(a => a.status === 'completed');

            setStats({
                totalActions: total,
                delayed: delayed.length,
                completed: completed.length,
                completedPercentage: total > 0 ? Math.round((completed.length / total) * 100) : 0
            });

            setDelayedActions(delayed);
        } catch (error) {
            console.error("Error loading War Room data", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && stats.totalActions === 0) {
        return <div className="h-screen bg-slate-950 flex items-center justify-center text-blue-500 animate-pulse">Carregando Sala de Situação...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden flex flex-col font-sans selection:bg-red-500 selection:text-white">
            {/* Top Bar */}
            <header className="bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-center shadow-2xl">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-blue-500 uppercase flex items-center gap-3">
                        <BarChart2 size={32} />
                        Sala de Situação
                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse ml-2">AO VIVO</span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest">Monitoramento Estratégico Municipal</p>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-mono font-bold text-gray-100 flex items-center justify-end gap-3">
                        <Clock size={32} className="text-slate-500" />
                        {currentTime.toLocaleTimeString()}
                    </div>
                    <div className="text-slate-400 font-medium flex items-center justify-end gap-2 mt-1">
                        <Calendar size={14} />
                        {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </header>

            {/* Main Content Grid */}
            <main className="flex-1 p-8 grid grid-cols-12 gap-8">

                {/* Big Numbers Column */}
                <div className="col-span-3 space-y-6">
                    {/* Delayed Card (Critical) */}
                    <div className="bg-red-900/20 border border-red-900/50 p-6 rounded-2xl flex flex-col items-center justify-center h-64 shadow-lg ring-1 ring-red-500/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-red-600/5 group-hover:bg-red-600/10 transition-colors"></div>
                        <AlertTriangle size={48} className="text-red-500 mb-4 animate-bounce" />
                        <span className="text-7xl font-bold text-red-500 tracking-tighter drop-shadow-lg">{stats.delayed}</span>
                        <span className="text-red-300 uppercase tracking-widest font-bold mt-2">Ações em Atraso</span>
                    </div>

                    {/* Completion Card (Success) */}
                    <div className="bg-green-900/20 border border-green-900/50 p-6 rounded-2xl flex flex-col items-center justify-center h-64 shadow-lg ring-1 ring-green-500/20 relative overflow-hidden">
                        <CheckCircle size={48} className="text-green-500 mb-4" />
                        <span className="text-7xl font-bold text-green-500 tracking-tighter drop-shadow-lg">{stats.completedPercentage}%</span>
                        <span className="text-green-300 uppercase tracking-widest font-bold mt-2">Execução Global</span>
                    </div>

                    {/* Total Card */}
                    <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl flex flex-col items-center justify-center flex-1 shadow-inner">
                        <span className="text-5xl font-bold text-blue-400">{stats.totalActions}</span>
                        <span className="text-slate-400 text-sm uppercase mt-1">Total de Ações</span>
                    </div>
                </div>

                {/* Central Map / Detail Area (Placeholder for now, using Delayed Ticker List) */}
                <div className="col-span-9 flex flex-col gap-6">
                    {/* Ticker Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                        <h2 className="text-xl font-bold text-red-400 flex items-center gap-2">
                            <AlertTriangle size={24} />
                            Focos de Incêndio (Prioridade Alta)
                        </h2>
                        <span className="text-xs bg-slate-800 px-3 py-1 rounded text-slate-400">
                            Mostrando {delayedActions.length} ocorrências
                        </span>
                    </div>

                    {/* Ticker List (Scrolling Grid) */}
                    <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-10">
                        {delayedActions.length === 0 ? (
                            <div className="col-span-2 h-full flex items-center justify-center text-slate-600 flex-col gap-4 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                                <CheckCircle size={64} className="text-green-900" />
                                <span className="text-xl">Nenhuma ação atrasada. Parabéns!</span>
                            </div>
                        ) : (
                            delayedActions.map((action, idx) => (
                                <div key={action.id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-start gap-4 hover:bg-slate-800 hover:border-red-900/50 transition-all group animate-in slide-in-from-right fade-in duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <div className="bg-red-500/10 text-red-500 font-bold text-xs px-2 py-1 rounded h-fit whitespace-nowrap">
                                        ATRASADO
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg text-gray-200 truncate group-hover:text-white transition-colors" title={action.name}>
                                            {action.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                                            <span className="bg-slate-800 px-2 py-0.5 rounded text-xs uppercase font-medium truncate max-w-[150px]">
                                                {action.responsible}
                                            </span>
                                            <span>•</span>
                                            <span className="text-red-400 font-mono">
                                                Fim: {new Date(action.endDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {/* Ticker Footer (Marquee Style if we wanted, but let's stick to status bar) */}
            <footer className="bg-slate-900 border-t border-slate-800 p-2 text-center text-xs text-slate-600 uppercase tracking-widest">
                Sistema de Planejamento Estratégico Governamental • Atualização Automática a cada 5 min
            </footer>
        </div>
    );
}
