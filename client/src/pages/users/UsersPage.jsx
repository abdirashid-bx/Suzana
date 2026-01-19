import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiEye, FiEyeOff, FiUserPlus } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { usersAPI, gradesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import '../students/Students.css';
import './UsersPage.css';
import DeleteConfirmationModal from '../../components/common/DeleteConfirmationModal';
import ImportUserPanel from './ImportUserPanel';

const UsersPage = () => {
    const { canDelete, user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        fullName: '',
        role: 'teacher',
        phone: '',
        assignedGrade: ''
    });

    // Delete Confirmation State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Import User Panel State
    const [showImportPanel, setShowImportPanel] = useState(false);

    useEffect(() => {
        fetchGrades();
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [sortBy]);

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(delaySearch);
    }, [search]);

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
            password: user.visiblePassword || '',
            fullName: user.fullName,
            role: user.role,
            phone: user.phone || '',
            assignedGrade: user.assignedGrade?._id || ''
        });
        setShowModal(true);
    };

    const handleDelete = (id, name) => {
        setUserToDelete({ id, name });
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;

        try {
            setDeleteLoading(true);
            await usersAPI.delete(userToDelete.id);
            toast.success('User deleted successfully');
            fetchUsers();
            setShowDeleteConfirm(false);
            setUserToDelete(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        } finally {
            setDeleteLoading(false);
        }
    };

    const resetForm = () => {
        setEditingUser(null);
        setShowPassword(false);
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

    const handleImportUser = async (data) => {
        try {
            await usersAPI.importFromStaff(data);
            toast.success('User successfully imported from staff');
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to import user');
            throw error; // Re-throw to let the panel handle it
        }
    };

    const getRoleBadge = (role) => {
        const colors = {
            admin: 'maroon',
            head_teacher: 'info',
            teacher: 'success'
        };
        const labels = {
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
                <div className="header-actions">
                    <button
                        onClick={() => setShowImportPanel(true)}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <FiUserPlus /> Import from Staff
                    </button>

                </div>
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
                                    <th>Full Name</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id}>
                                        <td>
                                            <div className="student-info">
                                                <div>
                                                    <span className="student-name">{user.fullName}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{user.username}</td>
                                        <td>{user.email}</td>
                                        <td>{getRoleBadge(user.role)}</td>
                                        <td>
                                            <span className={`badge badge-${user.isActive ? 'success' : 'error'}`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    className="btn btn-icon btn-ghost"
                                                    onClick={() => handleEdit(user)}
                                                    title="Edit"
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                {canDelete() && user._id !== currentUser.id && (
                                                    <button
                                                        className="btn btn-icon btn-ghost text-danger"
                                                        onClick={() => handleDelete(user._id, user.fullName)}
                                                        title="Delete"
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
                                            <div className="password-input-wrapper" style={{ position: 'relative' }}>
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    className="form-input"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    required={!editingUser}
                                                    placeholder={editingUser ? 'Leave blank to keep current' : ''}
                                                    style={{ paddingRight: '40px' }}
                                                />
                                                <button
                                                    type="button"
                                                    className="password-toggle"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    style={{
                                                        position: 'absolute',
                                                        right: '10px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: 'var(--text-secondary)'
                                                    }}
                                                >
                                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                                </button>
                                            </div>
                                            {editingUser && !formData.password && <small className="text-secondary">Previous password unavailable (encrypted)</small>}
                                            {editingUser && formData.password && <small className="text-secondary">Existing password retrieved</small>}
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Role *</label>
                                            <select
                                                className="form-select"
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                required
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="head_teacher">Head Teacher</option>
                                                <option value="teacher">Teacher</option>
                                            </select>
                                        </div>
                                    </div>

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
            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                itemName={userToDelete?.name}
                title="Delete User?"
                message={<span>Are you sure you want to delete user <strong>{userToDelete?.name}</strong>?</span>}
                subMessage="This action cannot be undone."
                confirmText="Delete User"
                isLoading={deleteLoading}
            />

            {/* Import User Panel */}
            <ImportUserPanel
                isOpen={showImportPanel}
                onClose={() => setShowImportPanel(false)}
                onSuccess={handleImportUser}
            />
        </div>
    );
};

export default UsersPage;
