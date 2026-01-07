import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard,
    CheckSquare,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { firestoreDb } from '../../services/firestoreDb';
import { aiService } from '../../services/aiService';
import { toast } from 'sonner';
import { Sparkles, Bot } from 'lucide-react';

import StatCard from '../../components/dashboard/StatCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';

export default function DashboardPage() {
    const { userProfile } = useAuth();
    const canViewSmartSummary = ['admin', 'prefeito', 'controladoria'].includes(userProfile?.role || '');

    const [stats, setStats] = useState({
        programs: 0,
        actions: 0,
        indicators: 0,
        validPrograms: 0
    });
    const [actionStatusData, setActionStatusData] = useState<any[]>([]);
    const [programHealthData, setProgramHealthData] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<string | null>(null);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

    useEffect(() => {
        if (userProfile) {
            loadDashboardData();
        }
    }, [userProfile?.uid, userProfile?.role, userProfile?.unitId]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const isGlobalView = ['admin', 'prefeito', 'controladoria'].includes(userProfile?.role || '');
            const userUnitId = userProfile?.unitId;

            let fetchedPrograms: any[] = [];
            let fetchedActions: any[] = [];
            let fetchedIndicators: any[] = [];
            let fetchedDeliverables: any[] = [];
            let fetchedLogs: any[] = [];

            if (isGlobalView) {
                // --- ADMIN / PREFEITO: Fetch All ---
                const [p, a, i, d, l] = await Promise.all([
                    firestoreDb.getPrograms(),
                    firestoreDb.getAllActions(),
                    firestoreDb.getAllIndicators(),
                    firestoreDb.getAllDeliverables(),
                    firestoreDb.getRecentActivity()
                ]);
                fetchedPrograms = p;
                fetchedActions = a;
                fetchedIndicators = i;
                fetchedDeliverables = d;
                fetchedLogs = l;

                // Client-side filtering for display if needed (e.g. if I am Admin but selected a filter? 
                // Currently Dashboard shows aggregates. Prefeito sees all.)
            } else if (userUnitId) {
                // --- UNIT MANAGER / FOCAL POINT: Fetch Scoped ---
                // 1. Get Programs for this Unit
                fetchedPrograms = await firestoreDb.getPrograms(userUnitId);

                // 2. Get Actions & Indicators for these programs
                // We use Promise.all to fetch in parallel for each program
                if (fetchedPrograms.length > 0) {
                    const programIds = fetchedPrograms.map(p => p.id);

                    const [actionsResults, indicatorsResults] = await Promise.all([
                        Promise.all(programIds.map(pid => firestoreDb.getActions(pid))),
                        Promise.all(programIds.map(pid => firestoreDb.getIndicators(pid)))
                        // Logs might be restricted, skipping global logs for now or implement unit-logs later
                    ]);

                    fetchedActions = actionsResults.flat();
                    fetchedIndicators = indicatorsResults.flat();

                    // 3. Get Deliverables for the Actions
                    if (fetchedActions.length > 0) {
                        const actionIds = fetchedActions.map(a => a.id);
                        // Batch/Iterative fetch for deliverables
                        const deliverablePromises = actionIds.map(aid => firestoreDb.getDeliverables(aid));
                        const deliverablesResults = await Promise.all(deliverablePromises);
                        fetchedDeliverables = deliverablesResults.flat();
                    }
                }
            } else {
                // No unit, no global role -> Empty
                fetchedPrograms = [];
            }

            // --- Data Segmentation Logic (Legacy/Cleanup) ---
            // If we are global, we might still want to filter if a filter UI existed, but 
            // for now Global sees all. If we are restricted, we ALREADY fetched only what we can see.
            // So visible data IS fetched data.

            // However, the original code had logic to filter global data by unit if unitId was present?
            // "if (!isGlobalView && userUnitId) ..."
            // The new logic handles that at fetch time.
            // If isGlobalView is true (Admin), but they have a unitId? (Unlikely, Admins usually don't have unitId, or ignore it)
            // Let's assume Global Viewers see EVERYTHING.

            const visiblePrograms = fetchedPrograms;
            const visibleActions = fetchedActions;
            const visibleIndicators = fetchedIndicators;

            // Aggregate Action Status
            const statusCounts = visibleActions.reduce((acc: any, curr: any) => {
                acc[curr.status] = (acc[curr.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const statusChartData = [
                { name: 'Não Iniciada', value: statusCounts['not_started'] || 0, color: '#94a3b8' },
                { name: 'Em Andamento', value: statusCounts['in_progress'] || 0, color: '#3b82f6' },
                { name: 'Atrasada', value: statusCounts['delayed'] || 0, color: '#ef4444' },
                { name: 'Concluída', value: statusCounts['completed'] || 0, color: '#22c55e' }
            ];

            // Aggregate Program Health
            let validCount = 0;
            for (const prog of visiblePrograms) {
                // Check Indicators
                const hasIndicators = visibleIndicators.some((i: any) => i.programId === prog.id);
                if (!hasIndicators) continue;

                // Check Actions
                const progActions = visibleActions.filter((a: any) => a.programId === prog.id);
                if (progActions.length === 0) continue;

                // Check Deliverables for each Action
                let allActionsHaveDeliverables = true;
                for (const action of progActions) {
                    const hasDeliverables = fetchedDeliverables.some((d: any) => d.actionId === action.id);
                    if (!hasDeliverables) {
                        allActionsHaveDeliverables = false;
                        break;
                    }
                }

                if (allActionsHaveDeliverables) validCount++;
            }

            const healthChartData = [
                { name: 'Prontos', value: validCount, color: '#22c55e' },
                { name: 'Pendentes', value: visiblePrograms.length - validCount, color: '#f59e0b' }
            ];

            setStats({
                programs: visiblePrograms.length,
                actions: visibleActions.length,
                indicators: visibleIndicators.length,
                validPrograms: validCount
            });

            setActionStatusData(statusChartData);
            setProgramHealthData(healthChartData);
            setRecentActivity(fetchedLogs);

        } catch (error) {
            console.error("Dashboard Load Error:", error);
            toast.error("Erro ao carregar dados do dashboard.");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateSummary = async () => {
        setIsGeneratingSummary(true);
        try {
            // Prepare data for AI (compact version)
            const dashboardContext = {
                stats,
                actionStatus: actionStatusData,
                recentAlerts: recentActivity.slice(0, 5).map(a => a.message)
            };
            const text = await aiService.generateDashboardSummary(dashboardContext);
            setSummary(text);
        } catch (error) {
            toast.error("Erro ao gerar resumo. Verifique sua chave de IA.");
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Visão Geral</h2>
                    <p className="text-gray-500">Acompanhamento estratégico do município.</p>
                </div>
                <button
                    onClick={() => window.open('/war-room', '_blank')}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
                >
                    <LayoutDashboard size={18} />
                    Sala de Situação (TV)
                </button>
            </div>





            {/* Smart Summary Card - Restricted Access */}
            {canViewSmartSummary && (
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Bot size={120} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <div className="bg-blue-500/20 p-2 rounded-lg">
                                    <Sparkles className="text-blue-300" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-blue-100">Briefing Executivo (IA)</h3>
                                    <p className="text-xs text-blue-300">Análise automática de inteligência</p>
                                </div>
                            </div>
                            {!summary && (
                                <button
                                    onClick={handleGenerateSummary}
                                    disabled={isGeneratingSummary}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-blue-900/50"
                                >
                                    {isGeneratingSummary ? (
                                        <>
                                            <span className="w-2 h-2 bg-white rounded-full animate-bounce" />
                                            <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-75" />
                                            <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-150" />
                                        </>
                                    ) : (
                                        <>Gerar Briefing do Dia</>
                                    )}
                                </button>
                            )}
                        </div>

                        {summary ? (
                            <div className="prose prose-invert prose-sm max-w-none animate-in fade-in slide-in-from-bottom-2">
                                <div dangerouslySetInnerHTML={{ __html: summary }} />
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => setSummary(null)}
                                        className="text-xs text-slate-400 hover:text-white underline"
                                    >
                                        Atualizar Análise
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm max-w-2xl">
                                O Assistente Virtual pode ler todos os gráficos abaixo e escrever um resumo executivo destacando apenas o que requer sua atenção imediata.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Programas"
                    value={stats.programs}
                    icon={LayoutDashboard}
                    color="blue"
                    description={`${stats.validPrograms} prontos para execução`}
                />
                <StatCard
                    title="Ações / Projetos"
                    value={stats.actions}
                    icon={CheckSquare}
                    color="purple"
                    description="Total de iniciativas cadastradas"
                />
                <StatCard
                    title="Indicadores"
                    value={stats.indicators}
                    icon={TrendingUp}
                    color="green"
                    description="Métricas de monitoramento"
                />
                <StatCard
                    title="Atrasos"
                    value={actionStatusData.find(d => d.name === 'Atrasada')?.value || 0}
                    icon={AlertCircle}
                    color="amber"
                    trend="+2"
                    trendUp={false}
                    description="Ações fora do prazo"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Status das Ações</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={actionStatusData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {actionStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Health Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Saúde do Planejamento</h3>
                    <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie
                                    data={programHealthData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {programHealthData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Atividade Recente</h3>
                <div className="space-y-4">
                    {recentActivity.length === 0 ? (
                        <div className="py-8">
                            <EmptyState
                                icon={TrendingUp}
                                title="Sem atividade"
                                description="Nenhuma atividade recente registrada."
                            />
                        </div>
                    ) : (
                        recentActivity.map((log) => (
                            <div key={log.id} className="flex items-center gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-800 font-medium">{log.message}</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(log.createdAt).toLocaleString()} por {log.user}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
