import { useState, useEffect } from 'react';
import { Upload, FileText, Loader, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { firestoreDb } from '../../services/firestoreDb';
import { storageService } from '../../services/storage';
import { Program, Action } from '../../types';

interface EvidenceConfig {
    programId: string;
    actionId: string;
    description: string;
    file: File | null;
}

export default function EvidencesPage() {
    const [evidences, setEvidences] = useState<any[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [actions, setActions] = useState<Action[]>([]);

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [newEvidence, setNewEvidence] = useState<EvidenceConfig>({
        programId: '',
        actionId: '',
        description: '',
        file: null
    });

    useEffect(() => {
        loadData();
    }, []);

    // Filter actions when program changes
    const filteredActions = actions.filter(a => a.programId === newEvidence.programId);

    const loadData = async () => {
        setLoading(true);
        const [e, p, a] = await Promise.all([
            firestoreDb.getEvidences(),
            firestoreDb.getPrograms(),
            firestoreDb.getAllActions() // Need all actions to select from
        ]);
        setEvidences(e);
        setPrograms(p);
        setActions(a);
        setLoading(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewEvidence({ ...newEvidence, file: e.target.files[0] });
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEvidence.file || !newEvidence.actionId) return;

        setUploading(true);
        try {
            // 1. Upload File
            const downloadUrl = await storageService.uploadEvidence(newEvidence.file);

            // 2. Save Metadata
            await firestoreDb.createEvidence({
                actionId: newEvidence.actionId,
                programId: newEvidence.programId, // Denormalized for easier querying
                description: newEvidence.description,
                url: downloadUrl,
                type: newEvidence.file.type.startsWith('image/') ? 'image' : 'file',
                fileName: newEvidence.file.name,
                size: newEvidence.file.size
            });

            // 3. Reset
            setIsModalOpen(false);
            setNewEvidence({ programId: '', actionId: '', description: '', file: null });
            loadData();
            loadData();
            toast.success("Evidência enviada com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao enviar evidência. Verifique sua conexão.");
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <Skeleton key={i} className="h-48 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Galeria de Evidências</h2>
                    <p className="text-gray-500">Documentos e fotos que comprovam a execução.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Upload size={20} />
                    Nova Evidência
                </button>
            </div>

            {/* Grid */}
            {evidences.length === 0 ? (
                <EmptyState
                    icon={ImageIcon}
                    title="Nenhuma evidência"
                    description="Registre fotos e documentos para comprovar a execução das ações."
                    action={
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-2 text-purple-600 font-medium hover:underline text-sm"
                        >
                            Clique aqui para enviar agora
                        </button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {evidences.map(ev => (
                        <div key={ev.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm group hover:shadow-md transition-all animate-in fade-in zoom-in duration-300">
                            <div className="aspect-video bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                                {ev.type === 'image' ? (
                                    <img src={ev.url} alt={ev.description} className="w-full h-full object-cover" />
                                ) : (
                                    <FileText className="text-gray-300 w-12 h-12" />
                                )}
                                <a
                                    href={ev.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center"
                                />
                            </div>
                            <h4 className="font-bold text-gray-800 text-sm truncate">{ev.description}</h4>
                            <p className="text-[10px] text-gray-500 mt-1">{new Date(ev.createdAt).toLocaleDateString()}</p>
                            <div className="mt-2 flex gap-1 flex-wrap">
                                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100 truncate max-w-full">
                                    {actions.find(a => a.id === ev.actionId)?.name || 'Ação Desconhecida'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-4">Enviar Evidência</h3>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Programa</label>
                                <select
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    value={newEvidence.programId}
                                    onChange={e => setNewEvidence({ ...newEvidence, programId: e.target.value, actionId: '' })}
                                >
                                    <option value="">Selecione um Programa...</option>
                                    {programs.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ação Vinculada</label>
                                <select
                                    className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100"
                                    value={newEvidence.actionId}
                                    onChange={e => setNewEvidence({ ...newEvidence, actionId: e.target.value })}
                                    disabled={!newEvidence.programId}
                                >
                                    <option value="">Selecione a Ação...</option>
                                    {filteredActions.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <input
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    placeholder="Ex: Foto da entrega dos kits"
                                    value={newEvidence.description}
                                    onChange={e => setNewEvidence({ ...newEvidence, description: e.target.value })}
                                />
                            </div>

                            <div className="border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer relative">
                                <Upload size={24} className="mb-2" />
                                <span className="text-sm">Clique para selecionar arquivo</span>
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                    accept="image/*,application/pdf"
                                />
                                {newEvidence.file && (
                                    <p className="mt-2 text-xs font-bold text-blue-600">{newEvidence.file.name}</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600"
                                    disabled={uploading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                                    disabled={!newEvidence.file || !newEvidence.actionId || uploading}
                                >
                                    {uploading && <Loader className="animate-spin" size={16} />}
                                    {uploading ? 'Enviando...' : 'Enviar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
