import { useState, useEffect } from 'react';
import { X, Calendar, User, FileIcon, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Action, Deliverable } from '../../types';
import { firestoreDb } from '../../services/firestoreDb';

interface ActionDetailsModalProps {
    action: Action;
    onClose: () => void;
}

export default function ActionDetailsModal({ action, onClose }: ActionDetailsModalProps) {
    const [evidences, setEvidences] = useState<any[]>([]);
    const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDetails();
    }, [action.id]);

    const loadDetails = async () => {
        setLoading(true);
        try {
            const [ev, del] = await Promise.all([
                firestoreDb.getEvidences(action.id),
                firestoreDb.getDeliverables(action.id)
            ]);
            setEvidences(ev);
            setDeliverables(del);
        } catch (error) {
            console.error("Failed to load details", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${action.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    action.status === 'delayed' ? 'bg-red-100 text-red-700' :
                                        action.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {action.status === 'not_started' ? 'Não Iniciada' :
                                    action.status === 'in_progress' ? 'Em Andamento' :
                                        action.status === 'delayed' ? 'Atrasada' : 'Concluída'}
                            </span>
                            <span className="text-gray-400 text-sm">ID: {action.id.slice(0, 8)}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">{action.name}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Left Column: Info */}
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                    <User size={14} /> Responsável
                                </h4>
                                <p className="font-medium text-gray-800">{action.responsible}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                    <Calendar size={14} /> Prazos
                                </h4>
                                <div className="text-sm">
                                    <p><span className="text-gray-400">Início:</span> {action.startDate ? new Date(action.startDate).toLocaleDateString('pt-BR') : '-'}</p>
                                    <p><span className="text-gray-400">Fim:</span> {action.endDate ? new Date(action.endDate).toLocaleDateString('pt-BR') : '-'}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Entregáveis</h4>
                                {deliverables.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">Nenhum cadastrado.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {deliverables.map(d => (
                                            <li key={d.id} className="text-sm bg-gray-50 p-2 rounded">
                                                <span className="font-bold">{d.quantity} {d.unit}</span> {d.description}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Evidences Gallery */}
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <ImageIcon className="text-blue-500" />
                                Galeria de Evidências ({evidences.length})
                            </h3>

                            {loading ? (
                                <div className="h-48 bg-gray-50 animate-pulse rounded-xl flex items-center justify-center text-gray-300">Carregando...</div>
                            ) : evidences.length === 0 ? (
                                <div className="h-48 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
                                    <FileIcon size={32} className="mb-2 opacity-50" />
                                    <p>Nenhuma evidência anexada.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {evidences.map(ev => {
                                        const isImage = ev.type?.startsWith('image') || ev.title.match(/\.(jpg|jpeg|png|webp)$/i);
                                        return (
                                            <div key={ev.id} className="group relative bg-gray-50 rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-all">
                                                {isImage ? (
                                                    <div className="aspect-video bg-gray-200 relative overflow-hidden">
                                                        <img
                                                            src={ev.url}
                                                            alt={ev.title}
                                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="aspect-video bg-gray-100 flex flex-col items-center justify-center text-gray-500 p-4">
                                                        <FileIcon size={32} className="mb-2 text-blue-500" />
                                                        <span className="text-xs text-center line-clamp-2">{ev.title}</span>
                                                    </div>
                                                )}

                                                <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur p-2 flex justify-between items-center border-t border-gray-100">
                                                    <span className="text-xs font-medium truncate flex-1 mr-2" title={ev.title}>{ev.title}</span>
                                                    <a
                                                        href={ev.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                                                        title="Abrir Original"
                                                    >
                                                        <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
