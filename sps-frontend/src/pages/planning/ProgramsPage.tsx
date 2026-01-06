import { useState, useEffect } from 'react';
import { Plus, Target, AlertTriangle, Sparkles, Loader2, Bot, FolderOpen } from 'lucide-react';
import { aiService, AuditResult } from '../../services/aiService';
import { firestoreDb } from '../../services/firestoreDb';
import { Program, Unit, Axis } from '../../types';
import { validator, ValidationResult } from '../../services/validator';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { toast } from 'sonner';
import ProgramCard from './ProgramCard';

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

    const [error, setError] = useState('');
    const [validationResults, setValidationResults] = useState<Record<string, ValidationResult>>({});

    // AI Audit State
    const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
    const [isAuditing, setIsAuditing] = useState(false);

    const handleAudit = async () => {
        if (!newProgram.publicProblem || !newProgram.objective || !newProgram.targetAudience) {
            toast.error("Preencha 'Problema', 'Objetivo' e 'Público-Alvo' para analisar.");
            return;
        }

        setIsAuditing(true);
        setAuditResult(null);

        try {
            const result = await aiService.auditProgram(newProgram.publicProblem, newProgram.objective, newProgram.targetAudience);
            setAuditResult(result);
            toast.success("Triangulação concluída com sucesso!");
        } catch (error: any) {
            toast.error(error.message || "Erro na análise. Verifique sua chave.");
        } finally {
            setIsAuditing(false);
        }
    };

    // Initial Load
    useEffect(() => {
        loadData();
    }, []);

    // Check validation when programs loaded
    useEffect(() => {
        if (programs.length > 0) {
            checkValidation();
        }
    }, [programs]);

    const checkValidation = async () => {
        const results: Record<string, ValidationResult> = {};
        for (const prog of programs) {
            results[prog.id] = await validator.validateProgram(prog.id);
        }
        setValidationResults(results);
    };



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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (!newProgram.unitId) newProgram.unitId = selectedUnit;

            // Basic validation
            if (!newProgram.name || !newProgram.objective || !newProgram.axisId) {
                setError("Preencha os campos obrigatórios.");
                return;
            }

            if (editingId) {
                await firestoreDb.updateProgram(editingId, newProgram);
            } else {
                await firestoreDb.createProgram(newProgram as Program);
            }
            await loadData(); // Reload to refresh list
            setIsModalOpen(false);
            setEditingId(null);
            setNewProgram({ name: '', objective: '', publicProblem: '', targetAudience: '', axisId: '', unitId: selectedUnit });
            toast.success(editingId ? 'Programa atualizado com sucesso!' : 'Programa criado com sucesso!');
        } catch (err: any) {
            toast.error('Erro ao salvar programa', { description: err.message });
            setError(err.message);
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
                        setAuditResult(null);
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
                        const validation = validationResults[prog.id];

                        return (
                            <ProgramCard
                                key={prog.id}
                                program={prog}
                                axis={axis}
                                validation={validation}
                                onEdit={() => {
                                    setEditingId(prog.id);
                                    setNewProgram(prog);
                                    setAuditResult(null);
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
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in duration-200 my-8">
                            <h3 className="text-xl font-bold mb-4">{editingId ? 'Editar Programa' : 'Novo Programa'}</h3>

                            {error && (
                                <div className="bg-red-50 text-red-700 p-3 rounded mb-4 flex items-center gap-2">
                                    <AlertTriangle size={16} />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Unidade Responsável</label>
                                        <select
                                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newProgram.unitId}
                                            onChange={e => setNewProgram({ ...newProgram, unitId: e.target.value })}
                                            disabled={userProfile?.role !== 'admin'}
                                        >
                                            <option value="">Selecione a Unidade...</option>
                                            {units.map(u => <option key={u.id} value={u.id}>{u.acronym} - {u.name}</option>)}
                                        </select>
                                        {userProfile?.role !== 'admin' && <p className="text-xs text-gray-500 mt-1">Apenas administradores podem mover programas entre unidades.</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Programa</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newProgram.name}
                                            onChange={e => setNewProgram({ ...newProgram, name: e.target.value })}
                                            placeholder="Ex: Gravatá Mais Verde"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Eixo Estratégico</label>
                                        <select
                                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newProgram.axisId}
                                            onChange={e => setNewProgram({ ...newProgram, axisId: e.target.value })}
                                        >
                                            <option value="">Selecione...</option>
                                            {axes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo (O que se pretende alcançar?)</label>
                                        <textarea
                                            rows={3}
                                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newProgram.objective}
                                            onChange={e => setNewProgram({ ...newProgram, objective: e.target.value })}
                                        />
                                    </div>

                                    {/* AI Audit Result Display */}
                                    {auditResult && (
                                        <div className="md:col-span-2 bg-purple-50 border border-purple-200 rounded-lg p-4 animate-in slide-in-from-top-2">
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-full ${auditResult.score >= 7 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    <Bot size={20} />
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-bold text-gray-900">Análise do Assistente Virtual</h4>
                                                        <span className={`text-sm font-bold px-2 py-1 rounded ${auditResult.score >= 7 ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'}`}>
                                                            Nota: {auditResult.score}/10
                                                        </span>
                                                    </div>

                                                    <p className="text-sm text-gray-800 mb-4">{auditResult.analysis}</p>

                                                    <div className="space-y-3">
                                                        {/* Sugestão: Problema */}
                                                        {auditResult.suggestedProblem && (
                                                            <div className="bg-white p-3 rounded border border-purple-100">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Sugestão (Problema)</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setNewProgram({ ...newProgram, publicProblem: auditResult.suggestedProblem })}
                                                                        className="text-xs text-blue-600 hover:underline cursor-pointer font-medium"
                                                                    >
                                                                        Aplicar
                                                                    </button>
                                                                </div>
                                                                <p className="text-xs text-gray-600 italic">"{auditResult.suggestedProblem}"</p>
                                                            </div>
                                                        )}

                                                        {/* Sugestão: Público */}
                                                        {auditResult.suggestedAudience && (
                                                            <div className="bg-white p-3 rounded border border-purple-100">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Sugestão (Público)</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setNewProgram({ ...newProgram, targetAudience: auditResult.suggestedAudience })}
                                                                        className="text-xs text-blue-600 hover:underline cursor-pointer font-medium"
                                                                    >
                                                                        Aplicar
                                                                    </button>
                                                                </div>
                                                                <p className="text-xs text-gray-600 italic">"{auditResult.suggestedAudience}"</p>
                                                            </div>
                                                        )}

                                                        {/* Sugestão: Objetivo */}
                                                        {auditResult.suggestedObjective && (
                                                            <div className="bg-white p-3 rounded border border-purple-100">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Sugestão (Objetivo)</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setNewProgram({ ...newProgram, objective: auditResult.suggestedObjective })}
                                                                        className="text-xs text-blue-600 hover:underline cursor-pointer font-medium"
                                                                    >
                                                                        Aplicar
                                                                    </button>
                                                                </div>
                                                                <p className="text-xs text-gray-600 italic">"{auditResult.suggestedObjective}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Problema Público</label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={newProgram.publicProblem}
                                                onChange={e => setNewProgram({ ...newProgram, publicProblem: e.target.value })}
                                            />
                                        </div>

                                        <div className="flex items-end">
                                            <button
                                                type="button"
                                                onClick={handleAudit}
                                                disabled={isAuditing || !newProgram.publicProblem || !newProgram.objective || !newProgram.targetAudience}
                                                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-3 py-2 rounded-lg font-medium shadow-sm transition-all flex items-center justify-center gap-2"
                                            >
                                                {isAuditing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                                {isAuditing ? 'Analisando...' : 'Analisar Triangulação'}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Público-Alvo</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newProgram.targetAudience}
                                            onChange={e => setNewProgram({ ...newProgram, targetAudience: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Salvar Programa
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
