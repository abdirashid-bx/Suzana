import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { usersAPI, gradesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import '../students/Students.css';
import './UsersPage.css';

const UsersPage = () => {
    const { canDelete, isSuperAdmin, user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        fullName: '',
        role: 'teacher',
        phone: '',
        assignedGrade: ''
    });

    useEffect(() => {
        fetchUsers();
        fetchGrades();
    }, [sortBy]);

    const fetchUsers = async () => {
        try {
            const response = await usersAPI.getAll({
                search: search || undefined,
                sortBy,
                sortOrder: sortBy === 'fullName' ? 'asc' : 'desc'
            });
            setUsers(response.data.users || []);
        } catch (error) {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const fetchGrades = async () => {
        try {
            const response = await gradesAPI.getAll();
            setGrades(response.data.grades || []);
        } catch (error) {
            console.error('Failed to fetch grades');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingUser) {
                await usersAPI.update(editingUser._id, formData);
                toast.success('User updated successfully');
            } else {
                await usersAPI.create(formData);
                toast.success('User created successfully');
            }
            setShowModal(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save user');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            email: user.email,
            password: '',
            fullName: user.fullName,
            role: user.role,
            phone: user.phone || '',
            assignedGrade: user.assignedGrade?._id || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete user ${name}?`)) return;

        try {
            await usersAPI.delete(id);
            toast.success('User deleted successfully');
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const resetForm = () => {
        setEditingUser(null);
        setFormData({
            username: '',
            email: '',
            password: '',
            fullName: '',
            role: 'teacher',
            phone: '',
            assignedGrade: ''
        });
    };

    const getRoleBadge = (role) => {
        const colors = {
            super_admin: 'maroon',
            admin: 'gold',
            head_teacher: 'info',
            teacher: 'success'
        };
        const labels = {
            super_admin: 'Super Admin',
            admin: 'Admin',
            head_teacher: 'Head Teacher',
            teacher: 'Teacher'
        };
        return <span className={`badge badge-${colors[role]}`}>{labels[role]}</span>;
    };

    return (
        <div className="students-page">
            <div className="page-header">
                <div className="page-header-left">
                    <h1>User Management</h1>
                    <span className="count-badge">{users.length} users</span>
                </div>
                <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary">
                    <FiPlus /> Add User
                </button>
            </div>

            <div className="table-card">
                <div className="table-header-controls">
                    <form onSubmit={(e) => { e.preventDefault(); fetchUsers(); }} className="search-form">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name, username or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="search-input"
                        />
                    </form>
                    <div className="filters">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="filter-select"
                        >
                            <option value="createdAt">Newest First</option>
                            <option value="fullName">Name A-Z</option>
                            <option value="username">Username A-Z</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="table-loading">
                        <div className="spinner"></div>
                        <p>Loading users...</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Assigned Grade</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id}>
                                        <td>
                                            <div className="student-info">
                                                <div className="student-avatar">
                                                    {user.fullName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="student-name">{user.fullName}</span>
                                                    <span className="student-gender">@{user.username}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>{getRoleBadge(user.role)}</td>
                                        <td>{user.assignedGrade?.name || '-'}</td>
                                        <td>
                                            <span className={`badge badge-${user.isActive ? 'success' : 'error'}`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    className={`btn btn-icon btn-ghost ${(!isSuperAdmin() && user.role === 'super_admin') ? 'disabled-action' : ''}`}
                                                    onClick={() => {
                                                        if (isSuperAdmin() || user.role !== 'super_admin') {
                                                            handleEdit(user);
                                                        }
                                                    }}
                                                    disabled={!isSuperAdmin() && user.role === 'super_admin'}
                                                    title={!isSuperAdmin() && user.role === 'super_admin' ? "Only Super Admins can edit this user" : "Edit"}
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                {canDelete() && user._id !== currentUser.id && (
                                                    <button
                                                        className={`btn btn-icon btn-ghost text-danger ${(!isSuperAdmin() && user.role === 'super_admin') ? 'disabled-action' : ''}`}
                                                        onClick={() => {
                                                            if (user.role !== 'super_admin') { // Extra safety, though backend blocks it too
                                                                handleDelete(user._id, user.fullName);
                                                            } else {
                                                                toast.error("Super Admin accounts cannot be deleted");
                                                            }
                                                        }}
                                                        disabled={user.role === 'super_admin'}
                                                        title={user.role === 'super_admin' ? "Super Admin accounts cannot be deleted" : "Delete"}
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit User Modal */}
            {
                showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3 className="modal-title">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Full Name *</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.fullName}
                                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Username *</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">Email *</label>
                                            <input
                                                type="email"
                                                className="form-input"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Phone</label>
                                            <input
                                                type="tel"
                                                className="form-input"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">{editingUser ? 'New Password' : 'Password *'}</label>
                                            <input
                                                type="password"
                                                className="form-input"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                required={!editingUser}
                                                placeholder={editingUser ? 'Leave blank to keep current' : ''}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Role *</label>
                                            <select
                                                className="form-select"
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                required
                                            >
                                                {isSuperAdmin() && <option value="super_admin">Super Admin</option>}
                                                <option value="admin">Admin</option>
                                                <option value="head_teacher">Head Teacher</option>
                                                <option value="teacher">Teacher</option>
                                            </select>
                                        </div>
                                    </div>
                                    {(formData.role === 'teacher' || formData.role === 'head_teacher') && (
                                        <div className="form-group">
                                            <label className="form-label">Assigned Grade</label>
                                            <select
                                                className="form-select"
                                                value={formData.assignedGrade}
                                                onChange={(e) => setFormData({ ...formData, assignedGrade: e.target.value })}
                                            >
                                                <option value="">Select Grade</option>
                                                {grades.map(grade => (
                                                    <option key={grade._id} value={grade._id}>{grade.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        {editingUser ? 'Update User' : 'Create User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default UsersPage;
