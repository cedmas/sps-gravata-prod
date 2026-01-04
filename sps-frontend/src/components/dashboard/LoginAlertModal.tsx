import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { firestoreDb } from '../../services/firestoreDb';
import { Action } from '../../types';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import ActionDetailsModal from './ActionDetailsModal';

export default function LoginAlertModal() {
    const { userProfile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [delayedActions, setDelayedActions] = useState<Action[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAction, setSelectedAction] = useState<Action | null>(null);

    const normalize = (str: string) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    };

    useEffect(() => {
        checkAlerts();
    }, [userProfile]);

    const checkAlerts = async () => {
        // 1. Check if already seen in this session
        const hasSeen = sessionStorage.getItem('hasSeenLoginAlert');
        console.warn("LoginAlert Check: Seen=", hasSeen, "User=", userProfile?.displayName);

        if (hasSeen === 'true') {
            setLoading(false);
            return;
        }

        if (!userProfile?.displayName) return;

        try {
            const allActions = await firestoreDb.getAllActions();
            console.warn("LoginAlert: Total Actions fetched:", allActions.length);

            // 3. Filter for User + Delayed/In Progress Late
            const myUrgentActions = allActions.filter(a => {
                if (!a.responsible) return false;

                // Robust comparison
                const responsibleNorm = normalize(a.responsible);
                const userNorm = normalize(userProfile.displayName!);

                // Check match
                const isMine = responsibleNorm.includes(userNorm) || userNorm.includes(responsibleNorm);

                const isDelayed = a.status === 'delayed';

                // Also check if 'in_progress' but end date passed
                const isLateInProgress = a.status === 'in_progress' && a.endDate && new Date(a.endDate) < new Date();

                if (isMine && (isDelayed || isLateInProgress)) {
                    console.warn("LoginAlert: Found Urgent Action:", a.name, a.status);
                    return true;
                }
                return false;
            });

            console.warn("LoginAlert: Urgent Count:", myUrgentActions.length);

            if (myUrgentActions.length > 0) {
                setDelayedActions(myUrgentActions);
                setIsOpen(true);
            }

            // Mark as seen immediately so it doesn't pop up again on refresh if user closes it
            sessionStorage.setItem('hasSeenLoginAlert', 'true');

        } catch (error) {
            console.error("Error checking alerts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    if (loading || !isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative animate-in slide-in-from-bottom-5 duration-300">

                    {/* Header bg pattern */}
                    <div className="absolute top-0 inset-x-0 h-24 bg-amber-500 overflow-hidden">
                        <div className="absolute -right-4 -top-8 w-32 h-32 rounded-full bg-amber-400 opacity-50 blur-2xl"></div>
                        <div className="absolute -left-4 top-8 w-24 h-24 rounded-full bg-amber-600 opacity-20 blur-xl"></div>
                    </div>

                    <div className="relative pt-8 px-6 pb-6">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4 mx-auto border-4 border-amber-100">
                            <AlertTriangle size={32} className="text-amber-500" />
                        </div>

                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Atenção Necessária</h2>
                            <p className="text-gray-500 mt-2">
                                Olá <b>{userProfile?.displayName}</b>, identificamos <b>{delayedActions.length}</b> ações sob sua responsabilidade que precisam de status atualizado.
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-xl border border-gray-200 max-h-[300px] overflow-y-auto mb-6">
                            {delayedActions.map(action => (
                                <div
                                    key={action.id}
                                    onClick={() => setSelectedAction(action)}
                                    className="p-3 border-b border-gray-100 last:border-0 hover:bg-white hover:shadow-sm cursor-pointer transition-all flex items-center gap-3 group"
                                >
                                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 truncate transition-colors">{action.name}</p>
                                        <p className="text-xs text-gray-400">Prazo: {action.endDate ? new Date(action.endDate).toLocaleDateString('pt-BR') : 'N/A'}</p>
                                    </div>
                                    <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleClose}
                            className="w-full bg-gray-900 text-white font-medium py-3 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 size={18} />
                            Entendi, vou verificar
                        </button>
                    </div>
                </div>
            </div>

            {/* Nested Detail Modal */}
            {selectedAction && (
                <ActionDetailsModal
                    action={selectedAction}
                    onClose={() => setSelectedAction(null)}
                />
            )}
        </>
    );
}
