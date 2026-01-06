import { useState, useEffect } from 'react';
import { Plus, Folder, Trash } from 'lucide-react';
import { firestoreDb } from '../../services/firestoreDb';
import { Project } from '../../types';
import ActionsList from './ActionsList';
import { toast } from 'sonner';

interface ProjectsListProps {
    programId: string;
}

export default function ProjectsList({ programId }: ProjectsListProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '', status: 'not_started' });

    useEffect(() => {
        loadProjects();
    }, [programId]);

    const loadProjects = async () => {
        setLoading(true);
        const data = await firestoreDb.getProjects(programId);
        setProjects(data);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await firestoreDb.createProject({
                ...newProject,
                programId,
                startDate: new Date().toISOString(),
                endDate: new Date().toISOString(),
                status: 'not_started'
            } as any); // Type cast if necessary for status
            setIsAdding(false);
            setNewProject({ name: '', description: '', status: 'not_started' });
            loadProjects();
            toast.success('Projeto criado com sucesso!');
        } catch (e) {
            toast.error('Erro ao criar projeto');
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Deseja excluir este projeto e todas as suas ações?')) {
            await firestoreDb.deleteProject(id);
            // Ideally we should delete or unlink actions, but basic implementation first
            loadProjects();
        }
    }

    if (loading) return <div className="text-sm text-gray-500">Carregando projetos...</div>;

    return (
        <div className="space-y-8 mt-6">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Projetos Estruturantes</h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                    <Plus size={16} /> Novo Projeto
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSave} className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2">
                    <div className="grid gap-3">
                        <div className="grid gap-1">
                            <label className="text-xs font-bold text-blue-900 uppercase">Nome do Projeto</label>
                            <input
                                className="border rounded-md px-3 py-2 w-full text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                placeholder="Ex: Ampliação da Cobertura de ESF"
                                value={newProject.name}
                                onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                autoFocus
                            />
                        </div>
                        <div className="grid gap-1">
                            <label className="text-xs font-bold text-blue-900 uppercase">Descrição (Opcional)</label>
                            <textarea
                                rows={2}
                                className="border rounded-md px-3 py-2 w-full text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                value={newProject.description || ''}
                                onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                        <button type="button" onClick={() => setIsAdding(false)} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1">Cancelar</button>
                        <button type="submit" className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 font-medium">Salvar Projeto</button>
                    </div>
                </form>
            )}

            <div className="space-y-6">
                {projects.map(project => (
                    <div key={project.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mt-1">
                                    <Folder size={20} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 leading-none mb-1">{project.name}</h4>
                                    {project.description && <p className="text-sm text-gray-500 max-w-2xl">{project.description}</p>}
                                </div>
                            </div>
                            <button onClick={() => handleDelete(project.id)} className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors" title="Excluir Projeto">
                                <Trash size={16} />
                            </button>
                        </div>
                        <div className="px-6 py-4">
                            <ActionsList programId={programId} projectId={project.id} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions without project */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/30 border-dashed">
                <div className="bg-gray-100/50 px-6 py-3 border-b border-gray-200/50 flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-600">Outras Ações (Sem projeto vinculado)</span>
                </div>
                <div className="px-6 py-4">
                    <ActionsList programId={programId} orphanedOnly={true} />
                </div>
            </div>
        </div>
    )
}
