import { useState } from 'react';
import { FileText, Download, FileSpreadsheet } from 'lucide-react';
import { reportGenerator } from '../../services/reportGenerator';

export default function ReportsPage() {
    const [generating, setGenerating] = useState(false);

    const handleGeneratePDF = async () => {
        setGenerating(true);
        try {
            await reportGenerator.generateGeneralReport();
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar relatório");
        } finally {
            setGenerating(false);
        }
    };

    const handleGenerateExcel = async () => {
        setGenerating(true);
        try {
            await reportGenerator.generateExcelReport();
        } catch (error) {
            console.error(error);
            alert("Erro ao gerar Excel");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Relatórios Executivos</h2>
                <p className="text-gray-500">Documentação oficial e extratos de dados.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PDF Report Card */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 transition-all">
                    <div className="h-12 w-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center mb-4">
                        <FileText size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Relatório de Execução (PDF)</h3>
                    <p className="text-gray-500 text-sm mb-6">
                        Documento completo formatado com capa, lista de programas, ações e status atual. Ideal para reuniões de monitoramento e prestação de contas.
                    </p>
                    <button
                        onClick={handleGeneratePDF}
                        disabled={generating}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        {generating ? (
                            <>Gerando...</>
                        ) : (
                            <>
                                <Download size={18} /> Baixar PDF Oficial
                            </>
                        )}
                    </button>
                </div>

                {/* Excel Report Card */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-green-300 transition-all">
                    <div className="h-12 w-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-4">
                        <FileSpreadsheet size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Base de Dados (Excel)</h3>
                    <p className="text-gray-500 text-sm mb-6">
                        Exportação de todos os dados brutos para análise externa. Inclui tabelas de Programas, Ações, Entregáveis e Indicadores.
                    </p>
                    <button
                        onClick={handleGenerateExcel}
                        disabled={generating}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        {generating ? (
                            <>Gerando...</>
                        ) : (
                            <>
                                <Download size={18} /> Baixar Excel
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
