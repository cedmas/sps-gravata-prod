import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Edit2, Trash2, Folder, Zap, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { firestoreDb } from '../../services/firestoreDb';
import { Project, Action } from '../../types';
import UsersDropdown from '../../components/common/UsersDropdown';
import { toast } from 'sonner';

export type ItemType = 'project' | 'action';

export interface UnifiedItem {
    id: string;
    type: ItemType;
    name: string;
    startDate?: string;
    endDate?: string;
    data: Project | Action;
    createdAt?: any;
}

interface UnifiedItemCardProps {
    item: UnifiedItem;
    onDelete: (id: string, type: ItemType) => void;
    onStatusChange?: () => void; // Callback to refresh list/board
    isBoard?: boolean;
}

export default function UnifiedItemCard({ item, onDelete, onStatusChange, isBoard = false }: UnifiedItemCardProps) {
    const { userProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);

    // Edit State
    const [editName, setEditName] = useState(item.name);
    const [editStartDate, setEditStartDate] = useState(item.startDate ? item.startDate.split('T')[0] : '');
    const [editEndDate, setEditEndDate] = useState(item.endDate ? item.endDate.split('T')[0] : '');
    const [editResponsible, setEditResponsible] = useState((item.data as any).responsible || '');
    const [editResponsibleId, setEditResponsibleId] = useState((item.data as any).responsibleId || '');

    const formatDate = (isoString?: string) => {
        if (!isoString) return '-';
        try {
            return format(new Date(isoString), 'dd/MM', { locale: ptBR });
        } catch (e) { return isoString; }
    };

    const handleSaveEdit = async () => {
        try {
            const updates: any = {
                name: editName,
                responsible: editResponsible,
                responsibleId: editResponsibleId
            };
            if (editStartDate) updates.startDate = new Date(editStartDate).toISOString();
            if (editEndDate) updates.endDate = new Date(editEndDate).toISOString();

            if (item.type === 'project') {
                await firestoreDb.updateProject(item.id, updates);
            } else {
                await firestoreDb.updateAction(item.id, updates, userProfile?.displayName);
            }
            setIsEditing(false);
            toast.success('Salvo com sucesso!');
            if (onStatusChange) onStatusChange();
        } catch (e) {
            toast.error('Erro ao salvar.');
        }
    };

    if (isEditing) {
        return (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200 bg-white z-10 relative p-4 rounded-xl border border-indigo-200 shadow-lg cursor-default" onClick={e => e.stopPropagation()}>
                <input
                    autoFocus
                    className="border-b-2 border-indigo-500 pb-1 text-sm font-bold w-full outline-none bg-transparent text-slate-800"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                />
                <div className="flex gap-2 flex-wrap">
                    <div className="flex-1 min-w-[120px]">
                        <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Responsável</label>
                        <UsersDropdown
                            initialName={editResponsible}
                            onSelect={(user) => {
                                setEditResponsible(user.displayName);
                                setEditResponsibleId(user.uid);
                            }}
                            onInputChange={(val) => {
                                setEditResponsible(val);
                                setEditResponsibleId('');
                            }}
                            className="w-full"
                        />
                    </div>
                    <div className="w-28">
                        <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Início</label>
                        <input type="date" className="border border-slate-200 rounded p-1.5 text-xs w-full text-slate-600 bg-slate-50" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} />
                    </div>
                    <div className="w-28">
                        <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Fim</label>
                        <input type="date" className="border border-slate-200 rounded p-1.5 text-xs w-full text-slate-600 bg-slate-50" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                    <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-md transition-colors">Cancelar</button>
                    <button onClick={handleSaveEdit} className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-1.5">
                        <Check size={14} /> Salvar
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={`group bg-white rounded-xl p-3 transition-all duration-200 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100
             ${item.type === 'project' ? 'bg-indigo-50/10' : ''}
             ${isBoard ? 'flex flex-col gap-3 min-h-[120px]' : 'flex items-center gap-4'}
        `}>
            {/* Header / Type / Name */}
            <div className={`flex ${isBoard ? 'w-full gap-3' : 'items-center gap-4 flex-1 min-w-0'}`}>
                {/* Icon */}
                <div className={`shrink-0 rounded-full flex items-center justify-center ${isBoard ? 'w-8 h-8' : 'w-10 h-10'} ${item.type === 'project'
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-emerald-100 text-emerald-600'
                    }`}>
                    {item.type === 'project' ? <Folder size={isBoard ? 16 : 20} /> : <Zap size={isBoard ? 16 : 20} />}
                </div>

                {/* Title & Meta Wrapper */}
                <div className={`min-w-0 ${isBoard ? 'flex-1' : 'flex-1'}`}>
                    <div className="flex items-start justify-between gap-2">
                        <h4 className={`font-bold text-slate-800 leading-snug cursor-pointer hover:text-indigo-700 transition-colors ${isBoard ? 'text-xs line-clamp-3 mb-2' : 'text-sm truncate mb-0.5'}`} title={item.name} onClick={() => setIsEditing(true)}>
                            {item.name}
                        </h4>

                        {/* Board View Actions (Top Right) */}
                        {isBoard && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setIsEditing(true)} className="text-slate-300 hover:text-indigo-600"><Edit2 size={14} /></button>
                                <button onClick={() => onDelete(item.id, item.type)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                            </div>
                        )}
                    </div>

                    {/* Meta Info (List View - Just in case fallback) */}
                    {!isBoard && (
                        <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                            <span className="truncate max-w-[100px]">{(item.data as any).responsible || 'Sem responsável'}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row / Sidebar */}
            <div className={`${isBoard ? 'flex items-center justify-between w-full pt-2 border-t border-slate-50 mt-auto' : 'flex items-center gap-3 shrink-0'}`}>

                {/* Board: Meta Info (Bottom Left) */}
                {isBoard && (
                    <div className="flex items-center justify-between w-full gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-5 h-5 shrink-0 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-bold uppercase border border-slate-200" title={(item.data as any).responsible}>
                                {(item.data as any).responsible ? (item.data as any).responsible.substring(0, 2) : '??'}
                            </div>
                            <span className="text-[10px] text-slate-600 font-medium truncate">
                                {(item.data as any).responsible ? (item.data as any).responsible.split(' ')[0] : 'N/A'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium shrink-0 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                            <Calendar size={10} />
                            <span>
                                {item.startDate ? formatDate(item.startDate).split('/')[0] + '/' + formatDate(item.startDate).split('/')[1] : ''}
                                {item.startDate && item.endDate ? ' - ' : ''}
                                {formatDate(item.endDate).split('/')[0]}/{formatDate(item.endDate).split('/')[1]}
                            </span>
                        </div>
                    </div>
                )}

                {/* Status Dropdown REMOVED - Empty div for spacing or could be removed entirely */}

            </div>
        </div>
    );
}
