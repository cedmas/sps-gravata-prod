import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Edit, Bot, Building2, Key, Eye, EyeOff } from 'lucide-react';
import { firestoreDb } from '../../services/firestoreDb';
import { Unit } from '../../types';
import { toast } from 'sonner';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'units' | 'ai'>('units');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">Configurações</h2>
                <p className="text-gray-500">Gerencie parâmetros gerais do sistema.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab('units')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'units' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Building2 size={16} />
                    Unidades Administrativas
                </button>
                <button
                    onClick={() => setActiveTab('ai')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'ai' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Bot size={16} />
                    Integração IA
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-[400px]">
                {activeTab === 'units' ? <UnitsTab /> : <AiIntegrationTab />}
            </div>
        </div>
    );
}

// --- AI Integration Tab ---
function AiIntegrationTab() {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await firestoreDb.getGlobalSettings();
            if (settings.geminiApiKey) setApiKey(settings.geminiApiKey);
        } catch (error) {
            console.error("Erro ao carregar configurações:", error);
            toast.error("Erro ao carregar configurações globais.");
        }
    };

    const handleSaveKey = async () => {
        if (!apiKey.trim()) {
            await firestoreDb.saveGlobalSettings({ geminiApiKey: '' });
            toast.info('Chave de API removida.');
            return;
        }
        await firestoreDb.saveGlobalSettings({ geminiApiKey: apiKey.trim() });
        toast.success('Chave de API salva globalmente no servidor!');
    };

    return (
        <div className="max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bot className="text-purple-500" />
                Assistente Virtual (Google Gemini)
            </h3>

            <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg mb-6 text-sm text-purple-800">
                <p className="font-semibold mb-1">Como funciona?</p>
                <p>
                    O sistema utiliza a IA do Google (Gemini) para analisar a coerência entre o
                    <strong> Problema Público</strong> e o <strong>Objetivo</strong> dos seus programas.
                </p>
                <p className="mt-2">
                    Para ativar, você precisa gerar uma chave gratuita no Google AI Studio.
                    Essa chave fica salva apenas no seu navegador.
                </p>
            </div>

            <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                    Google Gemini API Key
                </label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type={showKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                            placeholder="Cole sua chave aqui (ex: AIzaSy...)"
                        />
                        <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSaveKey}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg shadow-sm transition-colors"
                    >
                        Salvar Configuração
                    </button>
                    <button
                        onClick={async () => {
                            await handleSaveKey(); // Save first to Firestore
                            const toastId = toast.loading("Testando conexão com Gemini...");
                            try {
                                // Import dynamically or use existing if imported
                                const { aiService } = await import('../../services/aiService');
                                await aiService.auditProgram("Teste de Conexão", "Validar se a chave de API está funcionando corretamente.", "Administradores do Sistema");
                                toast.success("Conexão bem-sucedida! A IA respondeu.", { id: toastId });
                            } catch (error: any) {
                                console.error(error);
                                toast.error(`Falha no teste: ${error.message}`, { id: toastId });
                            }
                        }}
                        className="bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 font-medium px-6 py-2 rounded-lg shadow-sm transition-colors"
                    >
                        Testar Conexão ⚡
                    </button>
                    <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Obter chave gratuita ↗
                    </a>
                </div>
            </div>
        </div>
    );
}

// --- Units Tab (Refactored from previous UnitsPage) ---
function UnitsTab() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [newUnitName, setNewUnitName] = useState('');
    const [newUnitAcronym, setNewUnitAcronym] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadUnits();
    }, []);

    const loadUnits = async () => {
        const data = await firestoreDb.getUnits();
        setUnits(data);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUnitName || !newUnitAcronym) return;

        try {
            if (editingUnit) {
                await firestoreDb.updateUnit(editingUnit.id, {
                    name: newUnitName,
                    acronym: newUnitAcronym
                });
                toast.success('Unidade atualizada!');
            } else {
                await firestoreDb.createUnit({
                    name: newUnitName,
                    acronym: newUnitAcronym
                });
                toast.success('Unidade criada!');
            }

            setNewUnitName('');
            setNewUnitAcronym('');
            setIsModalOpen(false);
            setEditingUnit(null);
            loadUnits();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar unidade.');
        }
    };

    const openModal = (unit?: Unit) => {
        if (unit) {
            setEditingUnit(unit);
            setNewUnitName(unit.name);
            setNewUnitAcronym(unit.acronym);
        } else {
            setEditingUnit(null);
            setNewUnitName('');
            setNewUnitAcronym('');
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        const programs = await firestoreDb.getPrograms();
        const hasDependencies = programs.some(p => p.unitId === id);

        if (hasDependencies) {
            toast.error('Unidade possui vínculos', {
                description: 'Existem programas vinculados a esta unidade.'
            });
            return;
        }

        if (confirm('Remover unidade?')) {
            await firestoreDb.deleteUnit(id);
            loadUnits();
        }
    };

    const filteredUnits = units.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.acronym.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar unidade..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm text-sm"
                >
                    <Plus size={18} />
                    Nova Unidade
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUnits.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-400 text-sm">
                        Nenhuma unidade encontrada.
                    </div>
                ) : (
                    filteredUnits.map(unit => (
                        <div key={unit.id} className="bg-gray-50 p-4 rounded-lg flex items-center justify-between group hover:bg-white hover:shadow-md transition-all border border-gray-100">
                            <div>
                                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded inline-block mb-1">
                                    {unit.acronym}
                                </span>
                                <h3 className="font-medium text-gray-800 text-sm">{unit.name}</h3>
                            </div>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openModal(unit)}
                                    className="text-gray-400 hover:text-blue-600 p-1.5"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(unit.id)}
                                    className="text-gray-400 hover:text-red-500 p-1.5"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold mb-4">{editingUnit ? 'Editar Unidade' : 'Nova Unidade'}</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newUnitName}
                                    onChange={e => setNewUnitName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Sigla</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                                    value={newUnitAcronym}
                                    onChange={e => setNewUnitAcronym(e.target.value.toUpperCase())}
                                    maxLength={10}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm"
                                    disabled={!newUnitName || !newUnitAcronym}
                                >
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
