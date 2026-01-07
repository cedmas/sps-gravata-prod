import { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../../types';
import { firestoreDb } from '../../services/firestoreDb';
import { User } from 'lucide-react';

interface UsersDropdownProps {
    selectedUserId?: string;
    initialName?: string;
    onSelect: (user: UserProfile) => void;
    onInputChange?: (value: string) => void;
    className?: string;
    placeholder?: string;
}

export default function UsersDropdown({ initialName, onSelect, onInputChange, className, placeholder = "Responsável..." }: UsersDropdownProps) {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [searchTerm, setSearchTerm] = useState(initialName || '');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        if (initialName !== undefined) {
            setSearchTerm(initialName);
        }
    }, [initialName]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const loadUsers = async () => {
        try {
            const list = await firestoreDb.getAllUsers();
            setUsers(list.filter(u => u.active !== false));
        } catch (error) {
            console.error("Error loading users", error);
        }
    };

    const filteredUsers = users.filter(u =>
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div className="relative">
                <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => {
                        const val = e.target.value;
                        setSearchTerm(val);
                        setIsOpen(true);
                        if (onInputChange) onInputChange(val);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <User size={14} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                            <button
                                key={user.uid}
                                type="button"
                                onClick={() => {
                                    setSearchTerm(user.displayName);
                                    onSelect(user);
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0"
                            >
                                <span className="font-medium text-slate-700">{user.displayName}</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {user.role}
                                </span>
                            </button>
                        ))
                    ) : (
                        <div className="px-3 py-3 text-xs text-slate-400 italic text-center">
                            Nenhum usuário encontrado.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
