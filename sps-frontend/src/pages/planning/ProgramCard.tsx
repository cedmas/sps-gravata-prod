import { useState } from 'react';
import { Edit, Target, AlertTriangle, Activity, Layers, FileText, Trash2 } from 'lucide-react';
import { Program, Axis } from '../../types';
import { ValidationResult } from '../../services/validator';
import ProjectsList from './ProjectsList';
import IndicatorsList from './IndicatorsList';
import RisksList from './RisksList';
import { useAuth } from '../../contexts/AuthContext';

interface ProgramCardProps {
    program: Program;
    axis?: Axis;
    validation?: ValidationResult;
    onEdit: () => void;
    onDelete: () => void;
}

type Tab = 'overview' | 'structure' | 'indicators' | 'risks';

export default function ProgramCard({ program, axis, validation, onEdit, onDelete }: ProgramCardProps) {
    const [activeTab, setActiveTab] = useState<Tab>('structure');
    const { userProfile } = useAuth();
    const canDelete = ['admin', 'controladoria', 'gestor'].includes(userProfile?.role || '') || userProfile?.role === 'admin';

    // Helper to calculate status color
    const getStatusColor = (isValid?: boolean) => {
        if (isValid) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        return 'bg-amber-50 text-amber-700 border-amber-200';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden">
            {/* Header / Banner */}
            <div className="p-6 border-b border-slate-100 bg-white">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-slate-100 text-slate-600`}>
                                {axis?.name || 'Eixo não definido'}
                            </span>
                            {validation && (
                                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${getStatusColor(validation.isValid)} flex items-center gap-1`}>
                                    {validation.isValid ? '✅ Pronto' : '⚠️ Pendente'}
                                </span>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 leading-tight">{program.name}</h3>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onEdit}
                            className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar Programa"
                        >
                            <Edit size={18} />
                        </button>
                        {canDelete && (
                            <button
                                onClick={onDelete}
                                className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="Excluir Programa"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Validation Alerts (if any) */}
                {validation && !validation.isValid && (
                    <div className="mb-4 bg-amber-50 p-3 rounded-lg border border-amber-100 text-xs text-amber-800 flex items-start gap-2">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        <div>
                            <p className="font-bold mb-1">Atenção Necessária:</p>
                            <ul className="list-disc pl-4 space-y-0.5 opacity-90">
                                {validation.errors.map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Description Snippet */}
                <p className="text-slate-600 text-sm line-clamp-2">{program.objective}</p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-slate-100 bg-white px-6 py-2 gap-2">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'bg-blue-100 text-blue-700 shadow-sm ring-1 ring-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <FileText size={16} /> Visão Geral
                </button>
                <button
                    onClick={() => setActiveTab('structure')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'structure' ? 'bg-blue-100 text-blue-700 shadow-sm ring-1 ring-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <Layers size={16} /> Projetos
                </button>
                <button
                    onClick={() => setActiveTab('indicators')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'indicators' ? 'bg-blue-100 text-blue-700 shadow-sm ring-1 ring-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <Activity size={16} /> Indicadores
                </button>
                <button
                    onClick={() => setActiveTab('risks')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'risks' ? 'bg-blue-100 text-blue-700 shadow-sm ring-1 ring-blue-200' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <AlertTriangle size={16} /> Riscos
                </button>
            </div>

            {/* Content Area */}
            <div className="p-6 bg-slate-50/30">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <span className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Problema Público</span>
                                <p className="text-slate-800 text-sm leading-relaxed">{program.publicProblem || <span className="text-slate-400 italic">Não definido</span>}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <span className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Público-Alvo</span>
                                <p className="text-slate-800 text-sm leading-relaxed">{program.targetAudience || <span className="text-slate-400 italic">Não definido</span>}</p>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                            <Target className="text-blue-600 shrink-0 mt-1" size={20} />
                            <div>
                                <h4 className="font-bold text-blue-900 text-sm mb-1">Objetivo Estratégico</h4>
                                <p className="text-blue-800 text-sm leading-relaxed">{program.objective}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'structure' && (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                        <ProjectsList programId={program.id} />
                    </div>
                )}

                {activeTab === 'indicators' && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        <IndicatorsList programId={program.id} />
                    </div>
                )}

                {activeTab === 'risks' && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        <RisksList programId={program.id} />
                    </div>
                )}
            </div>
        </div>
    );
}
