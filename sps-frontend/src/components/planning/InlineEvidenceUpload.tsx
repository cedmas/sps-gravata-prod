import { useState, useEffect } from 'react';
import { Upload, FileIcon, Loader2, ExternalLink, Trash2 } from 'lucide-react';
import { firestoreDb } from '../../services/firestoreDb';
import { storageService } from '../../services/storage';
import { toast } from 'sonner';

interface InlineEvidenceUploadProps {
    actionId: string;
    readOnly?: boolean;
}

export default function InlineEvidenceUpload({ actionId, readOnly = false }: InlineEvidenceUploadProps) {
    const [evidences, setEvidences] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadEvidences();
    }, [actionId]);

    const loadEvidences = async () => {
        try {
            const data = await firestoreDb.getEvidences(actionId);
            setEvidences(data);
        } catch (error) {
            console.error("Error loading evidences:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // 1. Upload to Storage
            const downloadUrl = await storageService.uploadEvidence(file);

            // 2. Save metadata to Firestore
            await firestoreDb.createEvidence({
                actionId,
                title: file.name,
                url: downloadUrl,
                type: file.type,
                description: 'Upload via Action Card'
            });

            toast.success('Evidência anexada com sucesso!');
            loadEvidences();
        } catch (error) {
            console.error("Error uploading:", error);
            toast.error("Erro ao fazer upload da evidência.");
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente excluir esta evidência?')) return;

        try {
            await firestoreDb.deleteEvidence(id);
            toast.success('Evidência removida.');
            loadEvidences();
        } catch (error) {
            console.error("Error deleting evidence:", error);
            toast.error("Erro ao remover evidência.");
        }
    };

    if (loading) return <div className="text-[10px] text-gray-300">Carregando evidências...</div>;

    return (
        <div className="mt-2 pl-4 border-l-2 border-indigo-100 ml-1">
            <div className="flex items-center justify-between mb-1">
                <h5 className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                    <FileIcon size={12} />
                    Evidências ({evidences.length})
                </h5>
                {!readOnly && (
                    <label className={`text-[10px] text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {uploading ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                        {uploading ? 'Enviando...' : 'Anexar Arquivo'}
                        {!uploading && <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />}
                    </label>
                )}
            </div>

            {evidences.length > 0 ? (
                <ul className="space-y-1">
                    {evidences.map(ev => (
                        <li key={ev.id} className="text-xs flex justify-between items-center group p-1 rounded hover:bg-gray-50">
                            <a
                                href={ev.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 truncate flex-1"
                                title={ev.title}
                            >
                                <ExternalLink size={10} className="flex-shrink-0" />
                                <span className="truncate">{ev.title}</span>
                            </a>
                            {!readOnly && (
                                <button
                                    onClick={() => handleDelete(ev.id)}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    title="Excluir evidência"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                !readOnly && <div className="text-[10px] text-gray-400 italic">Nenhuma evidência anexada. Necessário para concluir.</div>
            )}
        </div>
    );
}
