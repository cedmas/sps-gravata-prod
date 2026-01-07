import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard,
    Target,
    Settings,
    LogOut,
    Menu,
    Users,
    FileText,
    X,

    MonitorPlay,
    Activity
} from 'lucide-react';
import { Toaster } from 'sonner';
import { cn } from '../../lib/utils';
import LoginAlertModal from '../dashboard/LoginAlertModal';
import { automationService } from '../../services/automationService';

// Helper Component for Sidebar Items
function SidebarItem({ to, icon, label, active, onClick, sidebarOpen, role, userRole }: any) {
    const navigate = useNavigate();

    if (role && role !== userRole) {
        return null;
    }

    return (
        <button
            onClick={() => {
                if (onClick) onClick();
                else navigate(to);
            }}
            className={cn(
                "w-full flex items-center px-4 py-3 transition-colors",
                active ? "bg-slate-700 text-white" : "hover:bg-slate-800 text-gray-300"
            )}
            title={label}
        >
            {icon}
            {sidebarOpen && <span className="ml-3 text-sm font-medium">{label}</span>}
        </button>
    );
}

export default function Layout() {
    const { logout, userProfile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        // Run automation on mount
        automationService.runStatusAutomation();
    }, []);

    const handleLogout = async () => {
        sessionStorage.removeItem('hasSeenLoginAlert');
        await logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Sidebar */}
            <aside className={cn(
                "bg-slate-900 text-white transition-all duration-300 flex flex-col",
                sidebarOpen ? "w-64" : "w-20"
            )}>
                <div className="p-4 flex items-center justify-between">
                    {sidebarOpen && <span className="font-bold text-xl tracking-tight">PEG 2026</span>}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-slate-800 rounded">
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                <nav className="flex-1 py-4 space-y-1">
                    <SidebarItem
                        to="/dashboard"
                        icon={<LayoutDashboard size={20} />}
                        label="Dashboard"
                        active={location.pathname === '/dashboard'}
                        sidebarOpen={sidebarOpen}
                        userRole={userProfile?.role}
                    />
                    <SidebarItem
                        to="/planning"
                        icon={<Target size={20} />}
                        label="Planejamento"
                        active={location.pathname === '/planning'}
                        sidebarOpen={sidebarOpen}
                        userRole={userProfile?.role}
                    />

                    <SidebarItem
                        to="/presentation"
                        icon={<MonitorPlay size={20} />}
                        label="Apresentação"
                        active={location.pathname === '/presentation'}
                        sidebarOpen={sidebarOpen}
                        userRole={userProfile?.role}
                    />
                    <SidebarItem
                        to="/reports"
                        icon={<FileText size={20} />}
                        label="Relatórios"
                        active={location.pathname === '/reports'}
                        sidebarOpen={sidebarOpen}
                        userRole={userProfile?.role}
                    />
                    <SidebarItem
                        to="/users"
                        icon={<Users size={20} />}
                        label="Usuários"
                        active={location.pathname === '/users'}
                        sidebarOpen={sidebarOpen}
                        role="admin"
                        userRole={userProfile?.role}
                    />
                    <SidebarItem
                        to="/settings"
                        icon={<Settings size={20} />}
                        label="Configurações"
                        active={location.pathname === '/settings'}
                        sidebarOpen={sidebarOpen}
                        role="admin"
                        userRole={userProfile?.role}
                    />
                    {['admin', 'controladoria'].includes(userProfile?.role || '') && (
                        <SidebarItem
                            to="/audit"
                            icon={<Activity size={20} />}
                            label="Auditoria"
                            active={location.pathname === '/audit'}
                            sidebarOpen={sidebarOpen}
                        />
                    )}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-2 py-2 text-red-400 hover:bg-slate-800 rounded transition-colors"
                    >
                        <LogOut size={20} />
                        {sidebarOpen && <span className="ml-3 text-sm">Sair</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative">
                <Toaster position="top-right" richColors />
                <header className="bg-white shadow-sm h-16 flex items-center px-6 justify-between">
                    <h1 className="text-xl font-semibold text-gray-800">
                        {/* Dynamic Header could go here */}
                        PEG
                    </h1>
                    <div className="flex items-center space-x-4">
                        <div className="text-sm text-right">
                            <p className="font-medium text-gray-900">{userProfile?.displayName}</p>
                            <p className="text-gray-500 text-xs uppercase">{userProfile?.role}</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                            {userProfile?.displayName?.charAt(0)}
                        </div>
                    </div>
                </header>

                <div className="p-6">
                    <Outlet />
                </div>
                {/* Login Alert */}
                <LoginAlertModal />
            </main>
        </div>
    );
}
