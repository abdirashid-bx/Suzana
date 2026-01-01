import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiTrash2, FiPrinter, FiUser, FiPhone, FiMapPin, FiCreditCard, FiBook, FiAlertTriangle } from 'react-icons/fi';
import { studentsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './Students.css';

const StudentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { canManageStudents, canDelete } = useAuth();
    const [student, setStudent] = useState(null);
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        fetchStudent();
    }, [id]);

    const fetchStudent = async () => {
        try {
            setLoading(true);
            const response = await studentsAPI.getById(id);
            setStudent(response.data.student);
            setFees(response.data.fees || []);
        } catch (error) {
            toast.error('Failed to fetch student details');
            console.error(error);
            navigate('/students');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await studentsAPI.delete(id);
            toast.success('Student deleted successfully');
            navigate('/students');
        } catch (error) {
            toast.error('Failed to delete student');
            setShowDeleteModal(false);
        }
    };

    const calculateBalance = () => {
        if (!fees || fees.length === 0) return 0;

        let totalFees = 0;
        let paidAmount = 0;

        fees.forEach(fee => {
            if (fee.status === 'outstanding' || fee.status === 'partial') {
                totalFees += fee.amount || 0;
                paidAmount += fee.paidAmount || 0;
            } else if (fee.status === 'paid') {
                totalFees += fee.amount || 0;
                paidAmount += fee.amount || 0; // Fully paid
            }
        });

        // Simple calculation: Sum of all fee amounts - Sum of all payments
        // However, fees usually track their own balance. 
        // Let's assume 'outstanding' status fees contribute to the balance.
        // A better way if the backend doesn't give a total balance is to sum up 
        // (amount - (paidAmount || 0)) for all fees.

        const balance = fees.reduce((acc, fee) => {
            // Calculate remaining for each fee record
            const paid = fee.paidAmount || 0;
            const remaining = fee.amount - paid;
            return acc + (remaining > 0 ? remaining : 0);
        }, 0);

        return balance;
    };

    const balance = calculateBalance();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading student details...</p>
            </div>
        );
    }

    if (!student) return null;

    return (
        <div className="students-page">
            <div className="page-header">
                <div className="page-header-left">
                    <button onClick={() => navigate('/students')} className="btn btn-ghost btn-back">
                        <FiArrowLeft /> Back
                    </button>
                    <h1 className=''>Student Details</h1>
                </div>
                <div className="header-actions">
                    {canManageStudents() && (
                        <Link to={`/students/${id}/edit`} className="btn btn-secondary">
                            <FiEdit2 /> Edit Student
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
                            {student.photo ? (
                                <img src={student.photo} alt={student.fullName} />
                            ) : (
                                <span>{student.fullName?.charAt(0)}</span>
                            )}
                        </div>
                        <h2 className="profile-name">{student.fullName}</h2>
                        <span className="profile-admission">ADM: {student.admissionNo}</span>
                        <span className={`status-badge status-${student.status}`}>
                            {student.status}
                        </span>
                    </div>

                    <div className="profile-stats">
                        <div className="stat-item">
                            <span className="stat-label">Current Class :</span>
                            <span className="stat-value">{student.grade?.name || 'N/A'}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Gender : </span>
                            <span className="stat-value capitalize">{student.gender}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Age :</span>
                            <span className="stat-value">
                                {student.age} years
                                <span className="text-secondary text-sm font-normal space-x-2 "> </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Info Sections */}
                <div className="details-column">
                    {/* Guardian Info */}
                    <div className="details-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <FiUser />
                            </div>
                            <h3>Parent / Guardian Details</h3>
                        </div>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Full Name</label>
                                <p>{student.parent?.fullName}</p>
                            </div>
                            <div className="info-item">
                                <label>Relationship</label>
                                <p>{student.parent?.relationship}</p>
                            </div>
                            <div className="info-item">
                                <label>Phone Number</label>
                                <a href={`tel:${student.parent?.phone}`} className="phone-link">
                                    <FiPhone /> {student.parent?.phone}
                                </a>
                            </div>
                            <div className="info-item">
                                <label>Location/Residence</label>
                                <p className='flex items-center gap-2'>
                                    <FiMapPin className="inline-icon mr-1" /> 
                                    {student.parent?.location}
                                </p>
                            </div>
                            {student.parent?.email && (
                                <div className="info-item">
                                    <label>Email Address</label>
                                    <p>{student.parent.email}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fee Info */}
                    <div className="details-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <FiCreditCard />
                            </div>
                            <h3>Fee & Financial Status</h3>
                        </div>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Billing Plan</label>
                                <p className="capitalize">{student.initialFee?.billingType || 'Standard Term'}</p>
                            </div>
                            <div className="info-item">
                                <label>Outstanding Balance</label>
                                <p className={`balance-amount font-bold ${balance > 0 ? 'text-error' : 'text-success'}`}>
                                    KES {balance.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="details-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <FiBook />
                            </div>
                            <h3>Academic & Administrative</h3>
                        </div>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Admission Date</label>
                                <p>{format(new Date(student.admissionDate), 'dd MMMM yyyy')}</p>
                            </div>
                            {student.medicalNotes && (
                                <div className="info-item full-width">
                                    <label>Medical Notes / Conditions</label>
                                    <p className="bg-red-50 p-3 rounded-md text-red-800 border border-red-100">
                                        {student.medicalNotes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-icon">
                            <FiAlertTriangle />
                        </div>
                        <h3 className="modal-title">Delete Student?</h3>
                        <p className="modal-message">
                            Are you sure you want to delete <strong>{student.fullName}</strong>?
                            This action will remove all data including academic records and fees.
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
                                Delete Student
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDetails;
