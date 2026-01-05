import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiX, FiUser, FiMail, FiPhone, FiLock, FiEdit2, FiSave, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './ProfilePanel.css';

const ProfilePanel = ({ isOpen, onClose }) => {
    const { user, updateProfile, updatePassword } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        username: '',
        phone: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Reset form when panel opens or user changes
    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
                username: user.username || '',
                phone: user.phone || ''
            });
        }
    }, [user, isOpen]);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            // 1. Handle Password Update (if section open and new password provided)
            if (showPasswordSection && passwordData.newPassword) {
                if (!passwordData.currentPassword) {
                    toast.error('Please enter your current password');
                    setLoading(false);
                    return;
                }
                if (passwordData.newPassword !== passwordData.confirmPassword) {
                    toast.error('New passwords do not match');
                    setLoading(false);
                    return;
                }
                if (passwordData.newPassword.length < 6) {
                    toast.error('Password must be at least 6 characters');
                    setLoading(false);
                    return;
                }

                try {
                    // Using AuthContext's updatePassword which hits /api/auth/password
                    // This endpoint checks for currentPassword validity
                    await updatePassword(passwordData.currentPassword, passwordData.newPassword);
                    toast.success('Password updated successfully');
                } catch (pwdError) {
                    console.error(pwdError);
                    toast.error(pwdError.response?.data?.message || 'Failed to update password');
                    setLoading(false);
                    return; // Stop if password update fails
                }
            }

            // 2. Handle Profile Info Update
            // Check if any profile fields changed
            const hasProfileChanges =
                formData.fullName !== user.fullName ||
                formData.email !== user.email ||
                formData.username !== user.username ||
                formData.phone !== user.phone;

            if (hasProfileChanges) {
                await updateProfile(formData);
                toast.success('Profile information updated');
            } else if (!showPasswordSection || !passwordData.newPassword) {
                // specific case: clicked save but nothing changed
                toast('No changes to save');
            }

            setIsEditing(false);
            setShowPasswordSection(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            fullName: user.fullName || '',
            email: user.email || '',
            username: user.username || '',
            phone: user.phone || ''
        });
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setIsEditing(false);
        setShowPasswordSection(false);
    };

    const getRoleBadge = () => {
        const roleLabels = {
            admin: 'Admin',
            head_teacher: 'Head Teacher',
            teacher: 'Teacher'
        };
        return roleLabels[user?.role] || 'User';
    };

    if (!isOpen) return null;

    return (
        <div className="profile-panel-backdrop" onClick={onClose}>
            {/* Panel - prevent click propagation */}
            <div className={`profile-panel ${isOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="profile-panel-header">
                    <h2>Profile Settings</h2>
                    <button className="profile-close-btn" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                {/* Body */}
                <div className="profile-panel-body">
                    {/* User Avatar & Role */}
                    <div className="profile-avatar-section">
                        <div className="profile-avatar-large">
                            {user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <h3 className="profile-name">{user?.fullName}</h3>
                        <span className="profile-role-badge">{getRoleBadge()}</span>
                    </div>

                    {/* Info Form */}
                    <div className="profile-info-section">
                        <div className="profile-section-header">
                            <h4>Personal Information</h4>
                            {!isEditing && (
                                <button
                                    className="profile-edit-btn"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <FiEdit2 /> Edit
                                </button>
                            )}
                        </div>

                        <div className="profile-form">
                            <div className="profile-form-group">
                                <label className="profile-label">
                                    <FiUser className="profile-icon" />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="profile-input"
                                />
                            </div>

                            <div className="profile-form-group">
                                <label className="profile-label">
                                    <FiMail className="profile-icon" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="profile-input"
                                />
                            </div>

                            <div className="profile-form-group">
                                <label className="profile-label">
                                    <FiUser className="profile-icon" />
                                    Username
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="profile-input"
                                />
                            </div>

                            <div className="profile-form-group">
                                <label className="profile-label">
                                    <FiPhone className="profile-icon" />
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className="profile-input"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Password Section */}
                    {isEditing && (
                        <div className="profile-password-section">
                            <button
                                className="profile-password-toggle"
                                onClick={() => setShowPasswordSection(!showPasswordSection)}
                            >
                                <div className="password-toggle-left">
                                    <FiLock className="profile-icon" />
                                    <span>Change Password</span>
                                </div>
                                {showPasswordSection ? <FiChevronUp /> : <FiChevronDown />}
                            </button>

                            {showPasswordSection && (
                                <div className="profile-password-fields">
                                    <div className="profile-form-group">
                                        <label className="profile-label">Current Password</label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            className="profile-input"
                                            placeholder="Enter current password"
                                        />
                                    </div>
                                    <div className="profile-form-group">
                                        <label className="profile-label">New Password</label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            className="profile-input"
                                            placeholder="Enter new password"
                                        />
                                    </div>

                                    <div className="profile-form-group">
                                        <label className="profile-label">Confirm Password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            className="profile-input"
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {isEditing && (
                    <div className="profile-panel-footer">
                        <button
                            className="btn btn-secondary"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            <FiSave />
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePanel;
