import { useState, useEffect } from 'react';
import { FiX, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';
import { staffAPI } from '../../services/api';
import './ImportUserPanel.css';
import toast from 'react-hot-toast';

const ImportUserPanel = ({ isOpen, onClose, onSuccess }) => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [staffList, setStaffList] = useState([]);

    // Form State
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedStaff, setSelectedStaff] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            fetchRoles();
            resetForm();
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedRole) {
            fetchStaffByRole(selectedRole);
        } else {
            setStaffList([]);
        }
    }, [selectedRole]);

    const fetchRoles = async () => {
        try {
            const response = await staffAPI.getRoles();
            // Show only supported roles (Exclude support_staff as requested)
            const supportedRoles = ['teacher', 'head_teacher', 'admin'];
            const filteredRoles = (response.data.roles || []).filter(r => supportedRoles.includes(r.role));
            setRoles(filteredRoles);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    };

    const fetchStaffByRole = async (role) => {
        try {
            setLoading(true);
            const response = await staffAPI.getAll({ role });
            // Filter out staff members who already have user accounts
            const availableStaff = response.data.staff.filter(s => !s.userAccount);
            setStaffList(availableStaff);
        } catch (error) {
            console.error('Failed to fetch staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStaffSelect = (staffId) => {
        setSelectedStaff(staffId);
        const staff = staffList.find(s => s._id === staffId);
        if (staff) {
            // Auto-generate username suggestion
            const usernameSuggestion = staff.fullName
                .toLowerCase()
                .replace(/\s+/g, '.')
                .replace(/[^a-z0-9.]/g, '');
            setFormData(prev => ({ ...prev, username: usernameSuggestion }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!selectedRole) newErrors.role = 'Please select a role';
        if (!selectedStaff) newErrors.staff = 'Please select a staff member';

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setLoading(true);
            await onSuccess({
                staffId: selectedStaff,
                ...formData
            });
            onClose();
        } catch (error) {
            setErrors({ submit: error.response?.data?.message || 'Failed to import user' });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedRole('');
        setSelectedStaff('');
        setStaffList([]);
        setFormData({ username: '', password: '', confirmPassword: '' });
        setErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const formatRoleName = (role) => {
        return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="import-modal" onClick={e => e.stopPropagation()}>
                <div className="import-modal-header">
                    <h2>Import User from Staff</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="import-modal-body">
                    <div className="form-group">
                        <label>Staff Role</label>
                        <select
                            className={`modal-select ${errors.role ? 'error' : ''}`}
                            value={selectedRole}
                            onChange={(e) => {
                                setSelectedRole(e.target.value);
                                setSelectedStaff('');
                            }}
                        >
                            <option value="">Select Role</option>
                            {roles.map((roleItem) => (
                                <option key={roleItem.role} value={roleItem.role}>
                                    {formatRoleName(roleItem.role)} ({roleItem.count})
                                </option>
                            ))}
                        </select>
                        {errors.role && <span className="error-text">{errors.role}</span>}
                    </div>

                    <div className="form-group">
                        <label>Staff Member</label>
                        <select
                            className={`modal-select ${errors.staff ? 'error' : ''}`}
                            value={selectedStaff}
                            onChange={(e) => handleStaffSelect(e.target.value)}
                            disabled={!selectedRole || loading}
                        >
                            <option value="">{loading ? 'Loading...' : 'Select Staff Member'}</option>
                            {staffList.map(staff => (
                                <option key={staff._id} value={staff._id}>
                                    {staff.fullName} ({staff.nationalId})
                                </option>
                            ))}
                        </select>
                        {errors.staff && <span className="error-text">{errors.staff}</span>}
                        {staffList.length === 0 && selectedRole && !loading && (
                            <span className="info-text">No available staff members found for this role.</span>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Username</label>
                        <div className="input-with-icon">
                            <FiUser className="input-icon" />
                            <input
                                type="text"
                                className={`modal-input ${errors.username ? 'error' : ''}`}
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                placeholder="Enter username"
                            />
                        </div>
                        {errors.username && <span className="error-text">{errors.username}</span>}
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Password</label>
                            <div className="input-with-icon">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className={`modal-input ${errors.password ? 'error' : ''}`}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Password"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                            {errors.password && <span className="error-text">{errors.password}</span>}
                        </div>

                        <div className="form-group">
                            <label>Confirm Password</label>
                            <div className="input-with-icon">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    className={`modal-input ${errors.confirmPassword ? 'error' : ''}`}
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    placeholder="Confirm"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                        </div>
                    </div>

                    {errors.submit && <div className="error-banner">{errors.submit}</div>}

                    <div className="import-modal-footer">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save & Import'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ImportUserPanel;
