import { useState, useEffect } from 'react';
import { UserPlus, Loader, Edit, Trash2, Power, X } from 'lucide-react';
import { firestoreDb } from '../../services/firestoreDb';
import { registerUser } from '../../services/firebase';
import { toast } from 'sonner';
import { UserProfile, UserRole, Unit } from '../../types';

export default function UsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);

    const [loading, setLoading] = useState(true);

    // State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [processing, setProcessing] = useState(false);

    // Form State
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPass, setFormPass] = useState('');
    const [formRole, setFormRole] = useState<UserRole>('leitura');
    const [formUnitId, setFormUnitId] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [u, un] = await Promise.all([
            firestoreDb.getAllUsers(),
            firestoreDb.getUnits()
        ]);
        setUsers(u);
        setUnits(un);
        setLoading(false);
    };

    const handleToggleStatus = async (user: UserProfile) => {
        if (!confirm(`Deseja ${user.active !== false ? 'desativar' : 'ativar'} o usuário ${user.displayName}?`)) return;

        try {
            const newStatus = user.active === false ? true : false;
            await firestoreDb.updateUser(user.uid, { active: newStatus });
            setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, active: newStatus } : u));
            toast.success(`Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso.`);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao alterar status.");
        }
    };

    const handleDeleteUser = async (user: UserProfile) => {
        if (!confirm(`ATENÇÃO: Deseja excluir permanentemente o perfil de ${user.displayName}? Essa ação não remove o login do Firebase, apenas o acesso aos dados.`)) return;

        try {
            await firestoreDb.deleteUser(user.uid);
            setUsers(prev => prev.filter(u => u.uid !== user.uid));
            toast.success("Usuário excluído.");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao excluir user. (Função pode não estar implementada)");
        }
    };

    const openEditModal = (user: UserProfile) => {
        setEditingUser(user);
        setFormName(user.displayName);
        setFormEmail(user.email);
        setFormRole(user.role);
        setFormUnitId(user.unitId || '');
        setFormPass('');
        setIsEditModalOpen(true);
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            // 1. Create in Firebase Auth
            const newUser = await registerUser(formEmail, formPass);

            // 2. Create Profile in Firestore
            const newProfile: UserProfile = {
                uid: newUser.uid,
                email: formEmail,
                displayName: formName,
                role: formRole,
                active: true
            };

            if (formUnitId) {
                newProfile.unitId = formUnitId;
            }

            await firestoreDb.createUser(newProfile);

            // 3. Update UI
            toast.success("Usuário criado com sucesso!");
            loadData();
            setIsCreateModalOpen(false);

            // Reset Form
            setFormName('');
            setFormEmail('');
            setFormPass('');
            setFormRole('leitura');
            setFormUnitId('');
        } catch (error: any) {
            console.error("Error creating user:", error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error("Este email já está cadastrado.");
            } else if (error.code === 'auth/weak-password') {
                toast.error("A senha deve ter pelo menos 6 caracteres.");
            } else if (error.code === 'auth/operation-not-allowed') {
                toast.error("Erro: O login por Email/Senha não está ativado no Firebase Console.");
            } else if (error.code === 'auth/invalid-email') {
                toast.error("O email informado é inválido.");
            } else {
                toast.error(`Erro: ${error.message || 'Falha ao criar usuário.'}`);
            }
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setProcessing(true); // Reusing state
        try {
            await firestoreDb.updateUser(editingUser.uid, {
                displayName: formName,
                role: formRole,
                unitId: formUnitId || undefined
            });

            // Password update is complex (requires Admin SDK or re-auth). I'll skip password update in Edit for now.

            setUsers(prev => prev.map(u =>
                u.uid === editingUser.uid ? { ...u, displayName: formName, role: formRole, unitId: formUnitId || undefined } : u
            ));
            toast.success("Usuário atualizado!");
            setIsEditModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader className="animate-spin text-purple-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
                    <p className="text-gray-500">Defina as permissões e acessos de cada membro da equipe.</p>
                </div>
                <button
                    onClick={() => {
                        setFormName('');
                        setFormEmail('');
                        setFormPass('');
                        setFormRole('leitura');
                        setFormUnitId('');
                        setIsCreateModalOpen(true);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <UserPlus size={20} />
                    Novo Usuário
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">Usuário</th>
                            <th className="p-4 font-semibold text-gray-600">Email</th>
                            <th className="p-4 font-semibold text-gray-600">Função (Role)</th>
                            <th className="p-4 font-semibold text-gray-600">Unidade Vinculada</th>
                            <th className="p-4 font-semibold text-gray-600 w-24">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.map(user => (
                            <tr key={user.uid} className={`hover:bg-gray-50 transition-colors ${user.active === false ? 'opacity-60 bg-gray-50' : ''}`}>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${user.active === false ? 'bg-gray-200 text-gray-500' : 'bg-purple-100 text-purple-700'}`}>
                                            {user.displayName?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{user.displayName || 'Sem Nome'}</p>
                                            {user.active === false && <span className="text-xs text-red-500 font-bold">INATIVO</span>}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-600 text-sm">{user.email}</td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    {units.find(u => u.id === user.unitId)?.name || '-'}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => handleToggleStatus(user)}
                                            title={user.active !== false ? "Desativar" : "Ativar"}
                                            className={`p-1.5 rounded-lg transition-colors ${user.active !== false ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                        >
                                            <Power size={18} />
                                        </button>
                                        <button
                                            onClick={() => openEditModal(user)}
                                            title="Editar"
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user)}
                                            title="Excluir"
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Criação */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in zoom-in duration-200 relative">
                        <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        <h3 className="text-xl font-bold mb-4">Cadastrar Novo Usuário</h3>
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <input
                                    required
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                    placeholder="Ex: João Silva"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        required
                                        type="email"
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                        value={formEmail}
                                        onChange={e => setFormEmail(e.target.value)}
                                        placeholder="joao@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha (Mín. 6)</label>
                                    <input
                                        required
                                        type="password"
                                        minLength={6}
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                        value={formPass}
                                        onChange={e => setFormPass(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                                    <select
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                        value={formRole}
                                        onChange={e => setFormRole(e.target.value as UserRole)}
                                    >
                                        <option value="admin">Administrador</option>
                                        <option value="gestor">Gestor Estratégico</option>
                                        <option value="focal">Ponto Focal</option>
                                        <option value="controladoria">Controladoria</option>
                                        <option value="prefeito">Prefeito</option>
                                        <option value="leitura">Apenas Leitura</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                                    <select
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                        value={formUnitId}
                                        onChange={e => setFormUnitId(e.target.value)}
                                    >
                                        <option value="">-- Nenhuma --</option>
                                        {units.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                                    disabled={processing}
                                >
                                    {processing && <Loader className="animate-spin" size={16} />}
                                    {processing ? 'Criando...' : 'Criar Usuário'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Edição */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in zoom-in duration-200 relative">
                        <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        <h3 className="text-xl font-bold mb-4">Editar Usuário</h3>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <input
                                    required
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    disabled
                                    className="w-full border border-gray-200 bg-gray-50 rounded px-3 py-2 text-gray-500"
                                    value={formEmail}
                                />
                                <span className="text-xs text-gray-400">O email não pode ser alterado.</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                                    <select
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                        value={formRole}
                                        onChange={e => setFormRole(e.target.value as UserRole)}
                                    >
                                        <option value="admin">Administrador</option>
                                        <option value="gestor">Gestor Estratégico</option>
                                        <option value="focal">Ponto Focal</option>
                                        <option value="controladoria">Controladoria</option>
                                        <option value="prefeito">Prefeito</option>
                                        <option value="leitura">Apenas Leitura</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                                    <select
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                        value={formUnitId}
                                        onChange={e => setFormUnitId(e.target.value)}
                                    >
                                        <option value="">-- Nenhuma --</option>
                                        {units.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                                    disabled={processing}
                                >
                                    {processing && <Loader className="animate-spin" size={16} />}
                                    {processing ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
