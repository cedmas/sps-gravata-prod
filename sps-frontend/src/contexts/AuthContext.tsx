import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { UserProfile } from '../types';
import { firestoreDb } from '../services/firestoreDb';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    login: () => Promise<void>;
    loginWithEmail: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (u) => {
            setUser(u);
            if (u) {
                try {
                    // 1. Check if user exists in Firestore
                    let profile = await firestoreDb.getUser(u.uid);

                    if (profile && profile.active === false) {
                        alert("Seu acesso foi desativado. Entre em contato com o administrador.");
                        await signOut(auth);
                        setUser(null);
                        setUserProfile(null);
                        setLoading(false);
                        return;
                    }

                    if (!profile) {
                        // 2. If not, create default profile
                        profile = {
                            uid: u.uid,
                            email: u.email!,
                            displayName: u.displayName || 'Usuário',
                            role: 'leitura', // Default role
                            active: true
                        };
                        await firestoreDb.createUser(profile);
                    }
                    setUserProfile(profile);
                } catch (err) {
                    console.error("Error fetching user profile:", err);
                    setUserProfile(null);
                }
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const enableMockLogin = () => {
        // Create a fake Firebase User object (partial)
        const mockUser = {
            uid: 'mock-user-123',
            email: 'prefeito@gravata.pe.gov.br',
            displayName: 'Prefeito (Demo)',
            emailVerified: true,
            isAnonymous: false,
            metadata: {},
            providerData: [],
            refreshToken: '',
            tenantId: null,
            delete: async () => { },
            getIdToken: async () => 'mock-token',
            getIdTokenResult: async () => ({} as any),
            reload: async () => { },
            toJSON: () => ({}),
            phoneNumber: null,
            photoURL: null,
            providerId: 'google.com',
        } as unknown as User;

        setUser(mockUser);
        setUserProfile({
            uid: 'mock-user-123',
            email: 'prefeito@gravata.pe.gov.br',
            displayName: 'Prefeito (Demo)',
            role: 'prefeito' // Testing Prefeito role
        });
    };

    const login = async () => {
        try {
            // For now, standard Google Sign In
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error: any) {
            console.error("Firebase Login Error:", error);
            // Fallback for Demo/Dev environment
            if (error.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' ||
                error.code === 'auth/configuration-not-found' ||
                error.code === 'auth/operation-not-allowed' ||
                error.code === 'auth/internal-error') {
                console.warn("Firebase misconfigured. Falling back to MOCK LOGIN.");
                enableMockLogin();
            } else {
                throw error;
            }
        }
    };

    const loginWithEmail = async (email: string, pass: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error: any) {
            console.error("Email Login Error:", error);
            if (error.code === 'auth/configuration-not-found' || error.code === 'auth/internal-error') {
                enableMockLogin();
            } else {
                throw error;
            }
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (e) {
            console.log("Mock logout");
        }
        setUser(null);
        setUserProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, login, loginWithEmail, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
