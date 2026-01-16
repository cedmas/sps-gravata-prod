import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreDb } from '../../services/firestoreDb';
import { Action } from '../../types';
import { AlertTriangle, CheckCircle2, Clock, X } from 'lucide-react';
import { toast } from 'sonner';

export default function PendingDemandsDialog() {
    const { userProfile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [demands, setDemands] = useState<Action[]>([]);
    // const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userProfile) return;

        // Session Check: Only show once per session
        const hasSeen = sessionStorage.getItem('hasSeenDemandsPopup');
        if (hasSeen) {
            // setLoading(false);
            return;
        }

        checkDemands();
    }, [userProfile]);

    const checkDemands = async () => {
        try {
            // Get all actions (inefficient but works for now, ideally filter by user in query)
            // In a real app, we'd query: calls.where('isMeetingDemand', '==', true).where('responsibleId', '==', uid)
            const allActions = await firestoreDb.getAllActions();

            const myPendingDemands = allActions.filter(a => {
                const isMeetingDemand = a.isMeetingDemand;
                const isPending = a.status !== 'completed';
                const isResponsible = a.responsibleId === userProfile?.uid;
                // Optional: Also show if user is Manager of the Unit (program -> unit) - Skipping complexity for V1

                return isMeetingDemand && isPending && isResponsible;
            });

            if (myPendingDemands.length > 0) {
                setDemands(myPendingDemands);
                setIsOpen(true);
                // Mark as seen immediately so it doesn't pop up again on refresh/nav during this session
                sessionStorage.setItem('hasSeenDemandsPopup', 'true');
            }
        } catch (error) {
            console.error("Error checking demands:", error);
        } finally {
            // setLoading(false);
        }
    };

    const handleResolve = async (action: Action) => {
        try {
            await firestoreDb.updateAction(action.id, { status: 'completed' }, userProfile?.displayName);
            toast.success('Deliberação concluída!');
            setDemands(prev => prev.filter(a => a.id !== action.id));
            if (demands.length <= 1) {
                setIsOpen(false);
            }
        } catch (error) {
            toast.error('Erro ao atualizar.');
        }
    };

    if (!isOpen || demands.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                <div className="bg-amber-500 px-6 py-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="fill-white text-amber-600" size={24} />
                        <div>
                            <h2 className="text-lg font-bold leading-none">Deliberações Pendentes</h2>
                            <p className="text-amber-100 text-xs mt-1">Você tem demandas urgentes de reuniões anteriores.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                        title="Fechar e ver depois"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-0 max-h-[60vh] overflow-y-auto">
                    {demands.map(demand => (
                        <div key={demand.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors flex gap-4 items-start">
                            <div className={`mt-1 p-2 rounded-lg shrink-0 ${demand.status === 'delayed' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                <Clock size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-800 text-sm">{demand.name}</h4>
                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                    <span className="font-medium">Prazo: {new Date(demand.endDate).toLocaleDateString('pt-BR')}</span>
                                    {demand.status === 'delayed' && (
                                        <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded-full">Atrasado</span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => handleResolve(demand)}
                                className="shrink-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                            >
                                <CheckCircle2 size={14} /> Resolver
                            </button>
                        </div>
                    ))}
                </div>

                <div className="bg-slate-50 px-6 py-3 text-center border-t border-slate-100">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-slate-500 hover:text-slate-700 text-xs font-semibold uppercase tracking-wider"
                    >
                        Dispensar por enquanto
                    </button>
                </div>
            </div>
        </div>
    );
}
