import { useState, useEffect } from 'react';
import { Bot, Sparkles, Loader2, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { Program, Unit, Axis } from '../../types';
import { aiService, AuditResult } from '../../services/aiService';
import { toast } from 'sonner';

interface ProgramWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (program: Partial<Program>) => Promise<void>;
    units: Unit[];
    axes: Axis[];
    userRole?: string;
    userUnitId?: string;
    initialData?: Partial<Program>;
}

export default function ProgramWizard({
    isOpen, onClose, onSave, units, axes, userRole, userUnitId, initialData
}: ProgramWizardProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [data, setData] = useState<Partial<Program>>(initialData || {
        name: '',
        objective: '',
        publicProblem: '',
        targetAudience: '',
        axisId: '',
        unitId: userRole === 'admin' ? '' : userUnitId
    });

    // AI Audit State
    const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
    const [isAuditing, setIsAuditing] = useState(false);

    // Reset form when opening/closing or changing initialData
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setAuditResult(null);
            setData(initialData || {
                name: '',
                objective: '',
                publicProblem: '',
                targetAudience: '',
                axisId: '',
                unitId: userRole === 'admin' ? '' : userUnitId
            });
        }
    }, [isOpen, initialData, userRole, userUnitId]);

    if (!isOpen) return null;

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);

    const handleAudit = async () => {
        if (!data.publicProblem || !data.objective || !data.targetAudience) {
            toast.error("Preencha todos os campos para analisar.");
            return;
        }
        setIsAuditing(true);
        try {
            const result = await aiService.auditProgram(data.publicProblem, data.objective, data.targetAudience);
            setAuditResult(result);
            toast.success("Análise concluída!");
        } catch (error) {
            toast.error("Erro na análise IA.");
        } finally {
            setIsAuditing(false);
        }
    };

    const handleSave = async () => {
        console.log("Saving Program Data:", data);
        setLoading(true);
        try {
            await onSave(data);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header with Progress */}
                <div className="bg-slate-50 border-b border-slate-100 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-900">
                            {initialData?.id ? 'Editar Programa' : 'Novo Programa'}
                        </h2>
                        <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            Passo {step} de 3
                        </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-500 ease-out"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-8 overflow-y-auto flex-1">

                    {/* STEP 1: Identification */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-8">
                                <h3 className="text-lg font-bold text-slate-900">Vamos começar pelo básico</h3>
                                <p className="text-slate-500">Qual o nome e a classificação do seu programa?</p>
                            </div>

                            {userRole === 'admin' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Secretaria Responsável</label>
                                    <select
                                        className="w-full text-base border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50"
                                        value={data.unitId}
                                        onChange={e => setData({ ...data, unitId: e.target.value })}
                                        autoFocus
                                    >
                                        <option value="">Selecione a secretaria...</option>
                                        {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Programa</label>
                                <input
                                    type="text"
                                    className="w-full text-lg border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-300"
                                    placeholder="Ex: Gravatá Mais Verde"
                                    value={data.name}
                                    onChange={e => setData({ ...data, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Eixo Estratégico</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {axes.map(axis => (
                                        <button
                                            key={axis.id}
                                            type="button"
                                            onClick={() => setData({ ...data, axisId: axis.id })}
                                            className={`p-4 rounded-xl border text-left transition-all ${data.axisId === axis.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                                        >
                                            <span className="block font-medium text-slate-900">{axis.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Strategy */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-6">
                                <h3 className="text-lg font-bold text-slate-900">Alinhamento Estratégico</h3>
                                <p className="text-slate-500">Defina o propósito. Nossa IA pode ajudar a validar.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Problema Público (O que queremos resolver?)</label>
                                <textarea
                                    className="w-full border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                    placeholder="Ex: Alta incidência de alagamentos no centro..."
                                    value={data.publicProblem}
                                    onChange={e => setData({ ...data, publicProblem: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Público-Alvo (Quem será beneficiado?)</label>
                                <input
                                    type="text"
                                    className="w-full border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: Moradores da Zona Norte"
                                    value={data.targetAudience}
                                    onChange={e => setData({ ...data, targetAudience: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Objetivo (O que vamos entregar?)</label>
                                <textarea
                                    className="w-full border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                    placeholder="Ex: Reduzir em 50% os pontos de alagamento..."
                                    value={data.objective}
                                    onChange={e => setData({ ...data, objective: e.target.value })}
                                />
                            </div>

                            {/* AI Helper Button */}
                            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2 text-purple-800 font-bold">
                                        <Sparkles size={18} />
                                        <span>Assistente Virtual</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAudit}
                                        disabled={isAuditing}
                                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        {isAuditing ? <Loader2 className="animate-spin" size={14} /> : <Bot size={14} />}
                                        Analisar Coerência
                                    </button>
                                </div>
                                {auditResult ? (
                                    <div className="text-sm text-slate-600 p-3 bg-white rounded-lg border border-purple-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`font-bold ${auditResult.score >= 7 ? 'text-green-600' : 'text-amber-600'}`}>Nota {auditResult.score}/10</span>
                                        </div>
                                        <p className="mb-3">{auditResult.analysis}</p>

                                        <div className="space-y-3 pt-2 border-t border-purple-100">
                                            {auditResult.suggestedProblem && (
                                                <div className="bg-purple-50 p-2 rounded">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-xs font-bold text-purple-700 uppercase">Sugestão (Problema)</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setData({ ...data, publicProblem: auditResult.suggestedProblem })}
                                                            className="text-xs text-blue-600 hover:underline cursor-pointer font-bold"
                                                        >
                                                            Aplicar
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-slate-700 italic">"{auditResult.suggestedProblem}"</p>
                                                </div>
                                            )}
                                            {auditResult.suggestedAudience && (
                                                <div className="bg-purple-50 p-2 rounded">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-xs font-bold text-purple-700 uppercase">Sugestão (Público)</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setData({ ...data, targetAudience: auditResult.suggestedAudience })}
                                                            className="text-xs text-blue-600 hover:underline cursor-pointer font-bold"
                                                        >
                                                            Aplicar
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-slate-700 italic">"{auditResult.suggestedAudience}"</p>
                                                </div>
                                            )}
                                            {auditResult.suggestedObjective && (
                                                <div className="bg-purple-50 p-2 rounded">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-xs font-bold text-purple-700 uppercase">Sugestão (Objetivo)</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setData({ ...data, objective: auditResult.suggestedObjective })}
                                                            className="text-xs text-blue-600 hover:underline cursor-pointer font-bold"
                                                        >
                                                            Aplicar
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-slate-700 italic">"{auditResult.suggestedObjective}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-purple-600/80">
                                        Preencha os campos acima e clique em "Analisar" para receber feedback da IA sobre a coerência do seu programa.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Review */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-8">
                                <h3 className="text-lg font-bold text-slate-900">Tudo pronto?</h3>
                                <p className="text-slate-500">Revise os dados antes de criar o programa.</p>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4">
                                <div>
                                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Programa</span>
                                    <p className="font-bold text-slate-900 text-lg">{data.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Eixo</span>
                                        <p className="text-slate-700">{axes.find(a => a.id === data.axisId)?.name}</p>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Secretaria</span>
                                        <p className="text-slate-700">{units.find(u => u.id === data.unitId)?.name || 'Não informada'}</p>
                                    </div>
                                </div>
                                <div className="border-t border-slate-200 pt-4">
                                    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Resumo Estratégico</span>
                                    <p className="text-sm text-slate-600 italic">"{data.objective}"</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                    {step > 1 ? (
                        <button
                            onClick={handleBack}
                            className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2 flex items-center gap-2"
                        >
                            <ArrowLeft size={18} /> Voltar
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="text-slate-500 hover:text-red-600 font-medium px-4 py-2"
                        >
                            Cancelar
                        </button>
                    )}

                    {step < 3 ? (
                        <button
                            onClick={handleNext}
                            disabled={!data.name || !data.axisId} // Basic validation
                            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/10 transition-all transform active:scale-95"
                        >
                            Próximo Passo <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-900/20 transition-all transform active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                            {initialData?.id ? 'Salvar Alterações' : 'Confirmar Criação'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
