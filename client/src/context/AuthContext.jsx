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

    const updateProfile = async (profileData) => {
        const response = await api.put('/users/profile', profileData);
        setUser(response.data.user);
        return response.data.user;
    };

    // Permission helpers
    const isAdmin = () => ['admin'].includes(user?.role);
    const isHeadTeacher = () => ['admin', 'head_teacher'].includes(user?.role);
    const isTeacher = () => user?.role === 'teacher';

    const canDelete = () => user?.role === 'admin';
    const canManageStudents = () => ['admin', 'head_teacher'].includes(user?.role);
    const canManageStaff = () => ['admin'].includes(user?.role);
    const canManageFees = () => ['admin', 'head_teacher'].includes(user?.role);
    const canEditAttendance = () => ['admin', 'head_teacher'].includes(user?.role);
    const canManageUsers = () => ['admin'].includes(user?.role);

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        updatePassword,
        updateProfile,
        isAuthenticated: !!user,
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
