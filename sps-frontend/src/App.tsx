import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ReportsPage from './pages/dashboard/ReportsPage';
import Layout from './components/layout/Layout';
import SettingsPage from './pages/settings/SettingsPage';
import ProgramsPage from './pages/planning/ProgramsPage';
import EvidencesPage from './pages/dashboard/EvidencesPage';
import PresentationPage from './pages/dashboard/PresentationPage';
import UsersPage from './pages/admin/UsersPage';
import AuditPage from './pages/admin/AuditPage';
import WarRoomPage from './pages/dashboard/WarRoomPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="h-screen flex items-center justify-center">Carregando...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function App() {
    return (
        <Router />
    );
}

function Router() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route path="/war-room" element={
                        <PrivateRoute>
                            <WarRoomPage />
                        </PrivateRoute>
                    } />

                    <Route path="/" element={
                        <PrivateRoute>
                            <Layout />
                        </PrivateRoute>
                    }>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="planning" element={<ProgramsPage />} />
                        <Route path="evidences" element={<EvidencesPage />} />
                        <Route path="presentation" element={<PresentationPage />} />
                        <Route path="reports" element={<ReportsPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="users" element={<UsersPage />} />
                        <Route path="audit" element={<AuditPage />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    )
}

export default App;
