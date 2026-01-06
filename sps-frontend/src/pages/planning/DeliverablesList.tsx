import { useState, useEffect } from 'react';
import { Plus, Trash2, Package } from 'lucide-react';
import { firestoreDb } from '../../services/firestoreDb';
import { Deliverable } from '../../types';

interface DeliverablesListProps {
    actionId: string;
    readOnly?: boolean;
}

export default function DeliverablesList({ actionId, readOnly = false }: DeliverablesListProps) {
    const [items, setItems] = useState<Deliverable[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newItem, setNewItem] = useState<Partial<Deliverable>>({
        description: '',
        date: '',
        quantity: 1,
        unit: 'Unid'
    });

    useEffect(() => {
        loadItems();
    }, [actionId]);

    const loadItems = async () => {
        setLoading(true);
        const data = await firestoreDb.getDeliverables(actionId);
        setItems(data);
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.description) return;

        await firestoreDb.createDeliverable({
            ...newItem,
            actionId,
            quantity: Number(newItem.quantity),
            date: newItem.date ? new Date(newItem.date).toISOString() : new Date().toISOString()
        } as any);

        setIsAdding(false);
        setNewItem({ description: '', date: '', quantity: 1, unit: 'Unid' });
        loadItems();
    };

    const handleDelete = async (id: string) => {
        if (confirm('Remover entregável?')) {
            await firestoreDb.deleteDeliverable(id);
            loadItems();
        }
    };

    if (loading) return <div className="text-gray-300 text-[10px]">...</div>;

    return (
        <div className="mt-2 pl-4 border-l-2 border-gray-100 ml-1">
            <div className="flex items-center justify-between mb-1">
                <h5 className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                    <Package size={12} />
                    Entregáveis ({items.length})
                </h5>
                {!readOnly && (
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                    >
                        <Plus size={10} /> Adicionar
                    </button>
                )}
            </div>

            {isAdding && (
                <form onSubmit={handleCreate} className="bg-white p-2 border rounded mb-2 shadow-sm text-xs">
                    <input
                        autoFocus
                        placeholder="Descrição (Ex: Salas Pintadas)"
                        className="w-full border p-1 rounded mb-1"
                        value={newItem.description}
                        onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                    />
                    <div className="flex gap-1 mb-1">
                        <input
                            type="number"
                            placeholder="Qtd"
                            className="w-16 border p-1 rounded"
                            value={newItem.quantity}
                            onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                        />
                        <input
                            placeholder="Unid (Ex: m²)"
                            className="w-20 border p-1 rounded"
                            value={newItem.unit}
                            onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                        />
                        <input
                            type="date"
                            className="flex-1 border p-1 rounded"
                            value={newItem.date}
                            onChange={e => setNewItem({ ...newItem, date: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-500 text-white p-1 rounded hover:bg-blue-600">Salvar</button>
                </form>
            )}

            <ul className="space-y-1">
                {items.map(d => (
                    <li key={d.id} className={`text-xs flex justify-between group p-1 rounded ${readOnly ? '' : 'hover:bg-gray-50'}`}>
                        <span className="text-gray-700">
                            <span className="font-bold">{d.quantity} {d.unit}</span> - {d.description}
                            <span className="text-gray-400 ml-1">({d.date ? new Date(d.date).toLocaleDateString('pt-BR') : '-'})</span>
                        </span>
                        {!readOnly && (
                            <button
                                onClick={() => handleDelete(d.id)}
                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
