import { useState, useEffect } from 'react';
import { Plus, Target, FolderOpen } from 'lucide-react';
import { firestoreDb } from '../../services/firestoreDb';
import { Program, Unit, Axis } from '../../types';

import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { toast } from 'sonner';
import ProgramCard from './ProgramCard';
import ProgramWizard from '../../components/wizards/ProgramWizard';

import { useAuth } from '../../contexts/AuthContext';

export default function ProgramsPage() {
    const { userProfile } = useAuth();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [axes, setAxes] = useState<Axis[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedUnit, setSelectedUnit] = useState<string>('');

    const [newProgram, setNewProgram] = useState<Partial<Program>>({
        name: '',
        objective: '',
        publicProblem: '',
        targetAudience: '',
        axisId: '',
        unitId: ''
    });




    // Initial Load
    useEffect(() => {
        loadData();
    }, []);





    const loadData = async () => {
        setLoading(true);
        const [u, a, p] = await Promise.all([
            firestoreDb.getUnits(),
            firestoreDb.getAxes(),
            firestoreDb.getPrograms()
        ]);
        setUnits(u);
        setAxes(a);
        setPrograms(p);

        // RBAC Logic: 
        // If Admin: select "all" or first unit.
        // If Not Admin: Lock to user's unitId.
        if (userProfile?.role === 'admin') {
            if (!selectedUnit) setSelectedUnit('all');
        } else if (userProfile?.unitId) {
            setSelectedUnit(userProfile.unitId);
        } else {
            // If user has no unit but is not admin (e.g. viewer without unit), select ALL or empty
            setSelectedUnit('all');
        }

        setLoading(false);
    };

    const handleSaveProgram = async (programData: Partial<Program>) => {
        if (!programData.name || !programData.axisId || !programData.unitId) {
            toast.error("Preencha os campos obrigatórios.");
            return;
        }

        try {
            if (editingId) {
                await firestoreDb.updateProgram(editingId, programData);
                toast.success("Programa atualizado!");
            } else {
                await firestoreDb.createProgram(programData as any);
                toast.success("Programa criado com sucesso!");
            }
            setIsModalOpen(false);
            setEditingId(null);
            setNewProgram({}); // Reset
            loadData();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar programa.");
        }
    };

    const filteredPrograms = programs.filter(p => {
        // First, unit filter
        let matchesUnit = false;
        if (selectedUnit === 'all') matchesUnit = true;
        else if (selectedUnit === 'orphaned') matchesUnit = !units.some(u => u.id === p.unitId);
        else matchesUnit = p.unitId === selectedUnit;

        if (!matchesUnit) return false;



        return true;
    });

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-10 w-48" />
                </div>
                <Skeleton className="h-24 w-full" />
                <div className="grid gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Programas de Governo</h2>
                    <p className="text-gray-500">Planejamento tático por unidade.</p>
                </div>

                {/* Unit Selector */}
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Unidade:</label>
                    <select
                        className="border border-gray-300 rounded-md py-1.5 pl-3 pr-8 text-sm focus:ring-blue-500 focus:border-blue-500"
                        value={selectedUnit}
                        onChange={(e) => {
                            setSelectedUnit(e.target.value);
                            setNewProgram(prev => ({ ...prev, unitId: e.target.value === 'all' || e.target.value === 'orphaned' ? '' : e.target.value }));
                        }}
                        disabled={userProfile?.role !== 'admin' && !!userProfile?.unitId}
                    >
                        <option value="all">-- TODAS AS UNIDADES --</option>
                        {units.map(u => (
                            <option key={u.id} value={u.id}>{u.acronym} - {u.name}</option>
                        ))}
                        <option value="orphaned" className="text-red-500 font-bold">⚠️ Sem Unidade (Órfãos)</option>
                    </select>
                </div>
            </div>

            {/* Action Bar */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Target className="text-blue-600" />
                    <div>
                        <p className="text-sm font-medium text-blue-900">
                            Programas Cadastrados: <span className="font-bold">{filteredPrograms.length} / 5</span>
                        </p>
                        <div className="w-32 h-2 bg-blue-200 rounded-full mt-1 overflow-hidden">
                            <div
                                className="h-full bg-blue-600 rounded-full transition-all"
                                style={{ width: `${Math.min((filteredPrograms.length / 5) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setNewProgram({ name: '', objective: '', publicProblem: '', targetAudience: '', axisId: '', unitId: selectedUnit === 'all' ? '' : selectedUnit });
                        setIsModalOpen(true);
                    }}
                    disabled={filteredPrograms.length >= 5}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Novo Programa
                </button>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {filteredPrograms.length === 0 ? (
                    <EmptyState
                        icon={FolderOpen}
                        title="Nenhum programa encontrado"
                        description={selectedUnit === 'orphaned' ? 'Não há programas sem unidade responsável.' : 'Comece criando um programa para esta unidade.'}
                    />
                ) : (
                    filteredPrograms.map(prog => {
                        const axis = axes.find(a => a.id === prog.axisId);


                        return (
                            <ProgramCard
                                key={prog.id}
                                program={prog}
                                axis={axis}
                                onEdit={() => {
                                    setEditingId(prog.id);
                                    setNewProgram(prog);
                                    setIsModalOpen(true);
                                }}
                                onDelete={async () => {
                                    if (window.confirm("Tem certeza que deseja excluir este programa? Todas as ações e indicadores vinculados podem ficar órfãos.")) {
                                        try {
                                            await firestoreDb.deleteProgram(prog.id);
                                            toast.success("Programa excluído.");
                                            loadData();
                                        } catch (e: any) {
                                            toast.error("Erro ao excluir.", { description: e.message });
                                        }
                                    }
                                }}
                            />
                        )
                    })
                )}
            </div>

            {/* Modal */}
            {/* Wizard Modal */}
            <ProgramWizard
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                    setNewProgram({});
                }}
                onSave={handleSaveProgram}
                units={units}
                axes={axes}
                userRole={userProfile?.role}
                userUnitId={userProfile?.unitId}
                initialData={editingId ? newProgram : undefined}
            />
        </div >
    );
}
