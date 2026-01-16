import { useState, useEffect } from 'react';
import { X, Zap, Calendar, User, Check } from 'lucide-react';
// import { useAuth } from '../../contexts/AuthContext';
import { firestoreDb } from '../../services/firestoreDb';
import UsersDropdown from '../common/UsersDropdown';
import { toast } from 'sonner';

interface QuickDemandModalProps {
    isOpen: boolean;
    onClose: () => void;
    programId: string;
}

export default function QuickDemandModal({ isOpen, onClose, programId }: QuickDemandModalProps) {
    // const { userProfile } = useAuth(); // Unused
    const [title, setTitle] = useState('');
    const [responsible, setResponsible] = useState('');
    const [responsibleId, setResponsibleId] = useState('');
    const [deadline, setDeadline] = useState('');
    const [loading, setLoading] = useState(false);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setResponsible('');
            setResponsibleId('');
            // Default to 7 days from now
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            setDeadline(nextWeek.toISOString().split('T')[0]);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !responsibleId || !deadline) {
            toast.error('Preencha todos os campos obrigatórios.');
            return;
        }

        setLoading(true);
        try {
            await firestoreDb.createAction({
                programId,
                name: title,
                responsible,
                responsibleId,
                startDate: new Date().toISOString(), // Starts today
                endDate: new Date(deadline).toISOString(),
                status: 'not_started',
                weight: 1,
                isMeetingDemand: true,
                origin: 'meeting',
                // Link implicitly to the program's unit/axis if available, 
                // though Action type might not strictly hold these, they are context 
            } as any);

            toast.success('Deliberação criada com sucesso!');
            onClose();
        } catch (error) {
            console.error('Error creating demand:', error);
            toast.error('Erro ao criar deliberação.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                {/* Header */}
                <div className="bg-indigo-600 px-6 py-4 flex justify-between items-start">
                    <div>
                        <h2 className="text-white text-lg font-bold flex items-center gap-2">
                            <Zap className="text-yellow-300 fill-yellow-300" size={20} />
                            Nova Deliberação
                        </h2>
                        <p className="text-indigo-100 text-xs mt-1 opacity-90">
                            Crie uma demanda rápida vinculada a esta reunião.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white transition-colors p-1"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                            O que precisa ser feito?
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Enviar relatório de custos..."
                            className="w-full text-base font-medium border-b-2 border-slate-200 focus:border-indigo-500 pb-2 outline-none transition-colors placeholder:text-slate-300"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Responsible */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                                <User size={12} /> Quem?
                            </label>
                            <UsersDropdown
                                selectedUserId={responsibleId}
                                initialName={responsible}
                                onSelect={(user) => {
                                    setResponsible(user.displayName);
                                    setResponsibleId(user.uid);
                                }}
                                onInputChange={(val) => {
                                    setResponsible(val);
                                    setResponsibleId('');
                                }}
                                className="w-full text-sm"
                                placeholder="Responsável"
                            />
                        </div>

                        {/* Deadline */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                                <Calendar size={12} /> Até quando?
                            </label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !title.trim() || !responsibleId}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Criando...' : (
                                <>
                                    <Check size={16} /> Confirmar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
