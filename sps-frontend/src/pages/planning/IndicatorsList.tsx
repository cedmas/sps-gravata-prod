import { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, Edit } from 'lucide-react';
import { firestoreDb } from '../../services/firestoreDb';
import { Indicator } from '../../types';

interface IndicatorsListProps {
    programId: string;
}

export default function IndicatorsList({ programId }: IndicatorsListProps) {
    const [indicators, setIndicators] = useState<Indicator[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newItem, setNewItem] = useState<Partial<Indicator>>({
        name: '',
        description: '',
        baseline: 0,
        target: 0,
        unit: '%'
    });

    useEffect(() => {
        loadItems();
    }, [programId]);

    const loadItems = async () => {
        setLoading(true);
        const data = await firestoreDb.getIndicators(programId);
        setIndicators(data);
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.name) return;

        const indicatorData = {
            ...newItem,
            programId,
            baseline: Number(newItem.baseline),
            target: Number(newItem.target)
        };

        if (editingId) {
            await firestoreDb.updateIndicator(editingId, indicatorData);
        } else {
            await firestoreDb.createIndicator(indicatorData as any);
        }

        setIsAdding(false);
        setEditingId(null);
        setNewItem({ name: '', description: '', baseline: 0, target: 0, unit: '%' });
        loadItems();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Remover indicador?')) {
            await firestoreDb.deleteIndicator(id);
            loadItems();
        }
    };

    if (loading) return <div className="text-gray-300 text-xs">Carregando indicadores...</div>;

    return (
        <div className="mt-4 border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <TrendingUp size={16} />
                    Indicadores de Resultado
                </h4>
                <button
                    onClick={() => {
                        setIsAdding(!isAdding);
                        setEditingId(null);
                        setNewItem({ name: '', description: '', baseline: 0, target: 0, unit: '%' });
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 border border-transparent hover:border-blue-100 rounded px-2 py-1"
                >
                    <Plus size={14} /> Novo Indicador
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSave} className="bg-blue-50 p-3 rounded-lg mb-3 border border-blue-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                        <input
                            autoFocus
                            placeholder="Nome do Indicador (Ex: Taxa de Evasão)"
                            className="col-span-2 text-xs border p-2 rounded w-full focus:ring-1 focus:ring-blue-500 outline-none"
                            value={newItem.name}
                            onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                        />
                        <input
                            placeholder="Descrição da métrica"
                            className="col-span-2 text-xs border p-2 rounded w-full"
                            value={newItem.description}
                            onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                        />
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 whitespace-nowrap">Base:</label>
                            <input
                                type="number"
                                className="w-full text-xs border p-1 rounded"
                                value={newItem.baseline}
                                onChange={e => setNewItem({ ...newItem, baseline: Number(e.target.value) })}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500 whitespace-nowrap">Meta:</label>
                            <input
                                type="number"
                                className="w-full text-xs border p-1 rounded"
                                value={newItem.target}
                                onChange={e => setNewItem({ ...newItem, target: Number(e.target.value) })}
                            />
                        </div>
                        <div className="flex items-center gap-2 col-span-2">
                            <label className="text-xs text-gray-500 whitespace-nowrap">Unidade de Medida:</label>
                            <input
                                placeholder="Ex: %, Unid, R$"
                                className="w-full text-xs border p-1 rounded"
                                value={newItem.unit}
                                onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!newItem.name}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                            Salvar
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 gap-2">
                {indicators.length === 0 && !isAdding && (
                    <p className="text-xs text-gray-400 italic">Nenhum indicador definido para este programa.</p>
                )}
                {indicators.map(ind => (
                    <div key={ind.id} className="bg-gray-50 p-3 rounded border border-gray-100 flex justify-between items-start group">
                        <div>
                            <h5 className="text-xs font-bold text-gray-800">{ind.name}</h5>
                            <p className="text-[10px] text-gray-500 mb-1">{ind.description}</p>
                            <div className="flex gap-4 text-xs font-mono text-gray-600">
                                <span>Base: {ind.baseline} {ind.unit}</span>
                                <span className="text-blue-600 font-bold">Meta: {ind.target} {ind.unit}</span>
                            </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => {
                                    setEditingId(ind.id);
                                    setNewItem(ind);
                                    setIsAdding(true);
                                }}
                                className="text-gray-300 hover:text-blue-500"
                                title="Editar"
                            >
                                <Edit size={14} />
                            </button>
                            <button
                                onClick={() => handleDelete(ind.id)}
                                className="text-gray-300 hover:text-red-500"
                                title="Excluir"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
