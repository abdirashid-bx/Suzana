import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiTrash2, FiUser, FiBriefcase, FiPhone, FiMapPin, FiActivity, FiAlertTriangle } from 'react-icons/fi';
import { staffAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import '../students/Students.css'; // Reusing students styles

const StaffDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { canManageStaff, canDelete } = useAuth();
    const [staff, setStaff] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        fetchStaff();
    }, [id]);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const response = await staffAPI.getById(id);
            setStaff(response.data.staff);
        } catch (error) {
            toast.error('Failed to fetch staff details');
            console.error(error);
            navigate('/staff');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await staffAPI.delete(id);
            toast.success('Staff member deleted successfully');
            navigate('/staff');
        } catch (error) {
            toast.error('Failed to delete staff member');
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading staff details...</p>
            </div>
        );
    }

    if (!staff) return null;

    return (
        <div className="students-page">
            <div className="page-header">
                <div className="page-header-left">
                    <button onClick={() => navigate('/staff')} className="btn btn-ghost btn-back">
                        <FiArrowLeft /> Back
                    </button>
                    <h1>Staff Details</h1>
                </div>
                <div className="header-actions">
                    {canManageStaff() && (
                        <Link to={`/staff/${id}/edit`} className="btn btn-secondary">
                            <FiEdit2 /> Edit Details
                        </Link>
                    )}
                    {canDelete() && (
                        <button onClick={() => setShowDeleteModal(true)} className="btn btn-danger">
                            <FiTrash2 /> Delete
                        </button>
                    )}
                </div>
            </div>

            <div className="student-details-grid">
                {/* Main Profile Card */}
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="profile-avatar-large">
                            {staff.photo ? (
                                <img src={staff.photo} alt={staff.fullName} />
                            ) : (
                                <span>{staff.fullName?.charAt(0)}</span>
                            )}
                        </div>
                        <h2 className="profile-name">{staff.fullName}</h2>
                        <span className="profile-admission">ID: {staff.nationalId}</span>
                        <span className={`status-badge status-${staff.status || 'active'}`}>
                            {staff.status || 'Active'}
                        </span>
                    </div>

                    <div className="profile-stats">
                        <div className="stat-item">
                            <span className="stat-label">Role</span>
                            <span className="stat-value capitalize">{staff.role?.replace('_', ' ')}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Gender</span>
                            <span className="stat-value capitalize">{staff.gender}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Employment Date</span>
                            <span className="stat-value">
                                {staff.dateOfEmployment ? format(new Date(staff.dateOfEmployment), 'dd MMM yyyy') : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Info Sections */}
                <div className="details-column">
                    {/* Employment Info */}
                    <div className="details-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <FiBriefcase />
                            </div>
                            <h3>Employment Information</h3>
                        </div>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Qualification</label>
                                <p className="capitalize">{staff.qualification}</p>
                            </div>
                            <div className="info-item">
                                <label>Assigned Class</label>
                                <p>{staff.assignedGrade?.name || 'Not assigned'}</p>
                            </div>
                            {staff.userAccount && (
                                <div className="info-item">
                                    <label>User Account</label>
                                    <p>{staff.userAccount.username}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="details-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <FiPhone />
                            </div>
                            <h3>Contact Details</h3>
                        </div>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Phone Number</label>
                                <a href={`tel:${staff.phone}`} className="phone-link">
                                    <FiPhone /> {staff.phone}
                                </a>
                            </div>
                            <div className="info-item">
                                <label>Email Address</label>
                                <p>{staff.email || 'N/A'}</p>
                            </div>
                            <div className="info-item full-width">
                                <label>Location/Residence</label>
                                <p>
                                    <FiMapPin className="inline-icon mr-1" /> {staff.location}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="details-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <FiActivity />
                            </div>
                            <h3>Emergency Contact</h3>
                        </div>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Name</label>
                                <p>{staff.emergencyContact?.fullName}</p>
                            </div>
                            <div className="info-item">
                                <label>Relationship</label>
                                <p>{staff.emergencyContact?.relationship}</p>
                            </div>
                            <div className="info-item">
                                <label>Phone</label>
                                <a href={`tel:${staff.emergencyContact?.phone}`} className="phone-link">
                                    <FiPhone /> {staff.emergencyContact?.phone}
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Medical Notes */}
                    {staff.medicalNotes && (
                        <div className="details-section">
                            <div className="section-header">
                                <div className="section-icon">
                                    <FiActivity />
                                </div>
                                <h3>Medical Information</h3>
                            </div>
                            <div className="info-grid">
                                <div className="info-item full-width">
                                    <label>Medical Notes</label>
                                    <p>{staff.medicalNotes}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-icon">
                            <FiAlertTriangle />
                        </div>
                        <h3 className="modal-title">Delete Staff Member?</h3>
                        <p className="modal-message">
                            Are you sure you want to delete <strong>{staff.fullName}</strong>?
                            This action will remove their profile and associated user account.
                            <br /><br />
                            This action cannot be undone.
                        </p>
                        <div className="modal-actions">
                            <button
                                className="btn btn-ghost btn-cancel"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger btn-confirm-delete"
                                onClick={handleDelete}
                            >
                                Delete Staff
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffDetails;
