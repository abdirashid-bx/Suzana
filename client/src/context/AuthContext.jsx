import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data.user);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        const { token: newToken, user: userData } = response.data;

        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);

        return userData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const updatePassword = async (currentPassword, newPassword) => {
        await api.put('/auth/password', { currentPassword, newPassword });
    };

    // Permission helpers
    const isSuperAdmin = () => user?.role === 'super_admin';
    const isAdmin = () => ['super_admin', 'admin'].includes(user?.role);
    const isHeadTeacher = () => ['super_admin', 'admin', 'head_teacher'].includes(user?.role);
    const isTeacher = () => user?.role === 'teacher';

    const canDelete = () => user?.role === 'super_admin';
    const canManageStudents = () => ['super_admin', 'admin', 'head_teacher'].includes(user?.role);
    const canManageStaff = () => ['super_admin', 'admin'].includes(user?.role);
    const canManageFees = () => ['super_admin', 'admin', 'head_teacher'].includes(user?.role);
    const canEditAttendance = () => ['super_admin', 'admin', 'head_teacher'].includes(user?.role);
    const canManageUsers = () => ['super_admin', 'admin'].includes(user?.role);

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        updatePassword,
        isAuthenticated: !!user,
        isSuperAdmin,
        isAdmin,
        isHeadTeacher,
        isTeacher,
        canDelete,
        canManageStudents,
        canManageStaff,
        canManageFees,
        canEditAttendance,
        canManageUsers
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
