import { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Trash2, ShieldCheck, Edit } from 'lucide-react';
import { firestoreDb } from '../../services/firestoreDb';
import { Risk } from '../../types';

interface RisksListProps {
    programId: string;
}

export default function RisksList({ programId }: RisksListProps) {
    const [risks, setRisks] = useState<Risk[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newRisk, setNewRisk] = useState<Partial<Risk>>({
        description: '',
        impact: 1,
        probability: 1,
        mitigation: ''
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        loadRisks();
    }, [programId]);

    const loadRisks = async () => {
        const data = await firestoreDb.getRisks(programId);
        setRisks(data);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRisk.description) return;

        const riskData = {
            ...newRisk as any,
            programId,
            severity: (newRisk.impact || 1) * (newRisk.probability || 1)
        };

        if (editingId) {
            await firestoreDb.updateRisk(editingId, riskData);
        } else {
            await firestoreDb.createRisk(riskData);
        }
        await loadRisks();
        setNewRisk({
            description: '',
            impact: 1,
            probability: 1,
            mitigation: ''
        });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Remover este risco?')) {
            await firestoreDb.deleteRisk(id);
            await loadRisks();
        }
    };

    const getSeverityColor = (severity: number) => {
        if (severity >= 15) return 'bg-red-100 text-red-800 border-red-200';
        if (severity >= 8) return 'bg-amber-100 text-amber-800 border-amber-200';
        return 'bg-green-100 text-green-800 border-green-200';
    };

    const getSeverityLabel = (severity: number) => {
        if (severity >= 15) return 'Crítico';
        if (severity >= 8) return 'Médio';
        return 'Baixo';
    };

    return (
        <div className="mt-8 bg-slate-50 rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="text-slate-600" />
                    <h3 className="text-lg font-bold text-slate-800">Matriz de Riscos</h3>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => {
                            setIsAdding(true);
                            setEditingId(null);
                            setNewRisk({ description: '', impact: 1, probability: 1, mitigation: '' });
                        }}
                        className="text-sm bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={16} /> Adicionar Risco
                    </button>
                )}
            </div>

            {isAdding && (
                <form onSubmit={handleSave} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm mb-4 animate-in fade-in zoom-in-95">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição do Risco</label>
                            <input
                                autoFocus
                                className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-slate-400 outline-none"
                                placeholder="Ex: Atraso no repasse de verbas federais"
                                value={newRisk.description}
                                onChange={e => setNewRisk({ ...newRisk, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Impacto (1-5)</label>
                                <input
                                    type="range" min="1" max="5"
                                    className="w-full accent-slate-600"
                                    value={newRisk.impact}
                                    onChange={e => setNewRisk({ ...newRisk, impact: parseInt(e.target.value) })}
                                />
                                <div className="text-xs text-center font-bold text-slate-600">{newRisk.impact}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Probabilidade (1-5)</label>
                                <input
                                    type="range" min="1" max="5"
                                    className="w-full accent-slate-600"
                                    value={newRisk.probability}
                                    onChange={e => setNewRisk({ ...newRisk, probability: parseInt(e.target.value) })}
                                />
                                <div className="text-xs text-center font-bold text-slate-600">{newRisk.probability}</div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estratégia de Mitigação</label>
                            <textarea
                                className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-slate-400 outline-none"
                                placeholder="O que será feito para evitar ou reduzir o impacto?"
                                rows={2}
                                value={newRisk.mitigation}
                                onChange={e => setNewRisk({ ...newRisk, mitigation: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="text-sm text-gray-500 hover:text-gray-700 px-3"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={!newRisk.description}
                                className="bg-slate-800 text-white text-sm px-4 py-2 rounded hover:bg-slate-900 transition-colors"
                            >
                                Salvar Risco
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="grid gap-3">
                {risks.length === 0 && !isAdding && (
                    <div className="text-center py-6 text-slate-400 text-sm italic">
                        Nenhum risco identificado para este programa.
                    </div>
                )}

                {risks.map(risk => (
                    <div key={risk.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-start gap-4">
                        <div className={`shrink-0 w-16 h-16 rounded-lg flex flex-col items-center justify-center border ${getSeverityColor(risk.severity)}`}>
                            <span className="text-2xl font-bold">{risk.severity}</span>
                            <span className="text-[10px] uppercase font-bold">{getSeverityLabel(risk.severity)}</span>
                        </div>

                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{risk.description}</h4>
                            <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                <span>Impacto: <b className="text-gray-900">{risk.impact}</b></span>
                                <span>Probabilidade: <b className="text-gray-900">{risk.probability}</b></span>
                            </div>
                            {risk.mitigation && (
                                <div className="mt-3 bg-slate-50 p-2 rounded border border-slate-100 text-sm text-slate-700 flex gap-2">
                                    <ShieldCheck size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                    <span>{risk.mitigation}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => {
                                    setEditingId(risk.id);
                                    setNewRisk(risk);
                                    setIsAdding(true);
                                }}
                                className="text-gray-300 hover:text-blue-500 transition-colors"
                            >
                                <Edit size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(risk.id)}
                                className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
