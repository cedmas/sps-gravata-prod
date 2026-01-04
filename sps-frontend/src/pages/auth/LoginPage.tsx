import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function LoginPage() {
    const { login, loginWithEmail, user, loading } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isEmailLogin, setIsEmailLogin] = useState(false);

    useEffect(() => {
        if (user && !loading) {
            navigate('/dashboard');
        }
    }, [user, loading, navigate]);

    const handleGoogleLogin = async () => {
        try {
            setError('');
            await login();
        } catch (err: any) {
            console.error(err);
            setError('Falha no login Google.');
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Preencha email e senha.');
            return;
        }
        try {
            setError('');
            await loginWithEmail(email, password);
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential') {
                setError('Email ou senha incorretos.');
            } else {
                setError('Falha ao realizar login.');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Planejamento Estratégico
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Prefeitura de Gravatá - 2026
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
                        {error}
                    </div>
                )}

                <div className="mt-8 space-y-4">
                    {isEmailLogin ? (
                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Senha</label>
                                <input
                                    type="password"
                                    required
                                    className="mt-1 w-full border border-gray-300 rounded-md p-2"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Entrar
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEmailLogin(false)}
                                className="w-full text-sm text-gray-600 hover:text-gray-900"
                            >
                                Voltar para opções
                            </button>
                        </form>
                    ) : (
                        <>
                            <button
                                onClick={handleGoogleLogin}
                                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 bg-[url('https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg')] bg-no-repeat bg-[16px_center]"
                            >
                                <span className="pl-6">Entrar com Google</span>
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Ou continue com</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsEmailLogin(true)}
                                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Email e Senha
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
