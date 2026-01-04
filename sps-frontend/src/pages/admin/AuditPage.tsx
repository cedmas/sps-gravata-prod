import { useState, useEffect } from 'react';
import { firestoreDb } from '../../services/firestoreDb';
import { Search, Eye, Clock, User, FileText, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AuditPage() {
    const { userProfile } = useAuth();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState<any | null>(null);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        // Note: In a real prod app, we should have a specific getLogs() with pagination/filters in firestoreDb
        // For now using getRecentActivity equivalent but potentially expanding it
        const data = await firestoreDb.getRecentActivity(); // Limitation: currently only gets 5. Will need to update service for pagination.
        setLogs(data);
        setLoading(false);
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-800';
            case 'UPDATE': return 'bg-blue-100 text-blue-800';
            case 'DELETE': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (!['admin', 'controladoria'].includes(userProfile?.role || '')) {
        return <div className="p-8 text-center text-gray-500">Acesso restrito a Administradores e Controladoria.</div>;
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Acessando registros de auditoria...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="text-blue-600" />
                        Log de Auditoria
                    </h1>
                    <p className="text-gray-500">Rastreabilidade completa de todas as operações do sistema.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por usuário, ação..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                <th className="p-4">Data/Hora</th>
                                <th className="p-4">Usuário</th>
                                <th className="p-4">Ação</th>
                                <th className="p-4">Entidade</th>
                                <th className="p-4">Detalhes</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-blue-50/50 transition-colors text-sm">
                                    <td className="p-4 text-gray-600 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-gray-400" />
                                            {new Date(log.createdAt).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="p-4 font-medium text-gray-800">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-gray-400" />
                                            {log.user}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                                            {log.action || 'INFO'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        {log.entity} <span className="text-gray-400 text-xs">#{log.entityId?.slice(0, 6)}</span>
                                    </td>
                                    <td className="p-4 text-gray-500 max-w-xs truncate" title={log.message}>
                                        {log.message}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => setSelectedLog(log)}
                                            className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center justify-end gap-1 ml-auto"
                                        >
                                            <Eye size={14} /> Ver JSON
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in scale-in-95 fade-in duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <FileText size={20} className="text-gray-500" />
                                Detalhes do Registro
                            </h3>
                            <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase mb-1">Autor</span>
                                    <p className="font-medium">{selectedLog.user}</p>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs uppercase mb-1">Data</span>
                                    <p className="font-medium">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="col-span-2">
                                    <span className="block text-gray-500 text-xs uppercase mb-1">Mensagem</span>
                                    <p className="bg-gray-50 p-2 rounded border border-gray-100">{selectedLog.message}</p>
                                </div>
                            </div>

                            <div>
                                <span className="block text-gray-500 text-xs uppercase mb-1">Dados Técnicos (Diff)</span>
                                <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono border border-slate-700">
                                    {JSON.stringify(selectedLog.details || {}, null, 2)}
                                </pre>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
