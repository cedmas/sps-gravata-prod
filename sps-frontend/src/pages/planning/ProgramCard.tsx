import { useState } from 'react';
import { Edit, Target, AlertTriangle, Activity, Layers, FileText, Trash2 } from 'lucide-react';
import { Program, Axis } from '../../types';

import ProjectsList from './ProjectsList';
import IndicatorsList from './IndicatorsList';
import RisksList from './RisksList';
import { useAuth } from '../../contexts/AuthContext';

interface ProgramCardProps {
    program: Program;
    axis?: Axis;
    onEdit: () => void;
    onDelete: () => void;
}

type Tab = 'overview' | 'structure' | 'indicators' | 'risks';

// Minimalist Program Card with Progressive Disclosure
export default function ProgramCard({ program, axis, onEdit, onDelete }: ProgramCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('structure');
    const { userProfile } = useAuth();
    const canDelete = ['admin', 'controladoria', 'gestor'].includes(userProfile?.role || '') || userProfile?.role === 'admin';

    // Mock stats for the UI (Replace with real data usage if available in the future)
    // Currently relying on lists to load their own data, so we don't have high-level stats here easily unless we fetch them.
    // For now, removing the fake stats grid to avoid showing wrong data, 
    // OR keeping it if the logic existed. 
    // The previous design had stats passed in? No, it calculated them? 
    // Actually, the previous code didn't calculate stats in the card props.
    // I Will keep the header simple and let the progressive disclosure show the details.

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100/80 hover:shadow-lg transition-all duration-300 overflow-hidden mb-6 group">
            {/* Modern Header */}
            <div className="p-5 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center bg-gradient-to-br from-white to-slate-50/50">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        {program.unit && (
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-indigo-100">
                                {program.unit.acronym}
                            </span>
                        )}
                        {axis && (
                            <span className="text-slate-400 text-xs font-medium px-2 border-l border-slate-200 flex items-center gap-1">
                                <Target size={10} />
                                {axis.name}
                            </span>
                        )}
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 leading-tight group-hover:text-indigo-900 transition-colors">
                        {program.name}
                    </h3>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`text-sm font-medium px-4 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 
                            ${isExpanded
                                ? 'bg-slate-100 text-slate-700 border-slate-200 shadow-inner'
                                : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200 shadow-sm'}`}
                    >
                        {isExpanded ? 'Recolher' : 'Detalhes'}
                    </button>

                    <div className="flex gap-1 border-l pl-3 ml-1 border-slate-200">
                        <button
                            onClick={onEdit}
                            className="text-slate-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg transition-colors"
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
            </div>

            {/* Expanded Content Area */}
            {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/30 animate-in slide-in-from-top-2 fade-in duration-300">
                    {/* Navigation Tabs */}
                    <div className="flex items-center px-6 border-b border-slate-200/50 gap-6 overflow-x-auto bg-white/50">
                        <button
                            onClick={() => setActiveTab('structure')}
                            className={`py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'structure' ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                        >
                            <Layers size={16} /> Projetos e Ações
                        </button>
                        <button
                            onClick={() => setActiveTab('indicators')}
                            className={`py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'indicators' ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                        >
                            <Activity size={16} /> Indicadores
                        </button>
                        <button
                            onClick={() => setActiveTab('risks')}
                            className={`py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'risks' ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                        >
                            <AlertTriangle size={16} /> Riscos
                        </button>
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'overview' ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                        >
                            <FileText size={16} /> Ficha Técnica
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'structure' && <ProjectsList programId={program.id} />}
                        {activeTab === 'indicators' && <IndicatorsList programId={program.id} />}
                        {activeTab === 'risks' && <RisksList programId={program.id} />}

                        {activeTab === 'overview' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                                        <span className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Problema Público</span>
                                        <p className="text-slate-700 text-sm leading-relaxed">{program.publicProblem || <span className="text-slate-300 italic">Não definido</span>}</p>
                                    </div>
                                    <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                                        <span className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Público-Alvo</span>
                                        <p className="text-slate-700 text-sm leading-relaxed">{program.targetAudience || <span className="text-slate-300 italic">Não definido</span>}</p>
                                    </div>
                                </div>
                                <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100 flex items-start gap-3">
                                    <Target className="text-indigo-600 shrink-0 mt-1" size={20} />
                                    <div>
                                        <h4 className="font-bold text-indigo-900 text-sm mb-1">Objetivo Estratégico</h4>
                                        <p className="text-indigo-800 text-sm leading-relaxed">{program.objective}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
