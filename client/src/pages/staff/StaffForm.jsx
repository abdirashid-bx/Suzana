import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiArrowLeft, FiCamera, FiUser, FiBriefcase, FiPhone, FiPlus } from 'react-icons/fi';
import { staffAPI, gradesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './StaffForm.css';

const StaffForm = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID for edit mode
    const fileInputRef = useRef();

    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(!!id); // Loading state for fetching data
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        // Personal Details
        nationalId: '',
        fullName: '',
        gender: '',
        dateOfBirth: '',

        // Employment Details
        dateOfEmployment: new Date().toISOString().split('T')[0],
        qualification: '',
        role: '',
        assignedGrade: '', // Optional, for teachers

        // Contact Details
        phone: '',
        email: '',
        location: '',

        // Emergency Contact
        emergencyContact: {
            fullName: '',
            relationship: '',
            phone: '',
            location: '',
            alternativeContact: ''
        },

        // Medical
        medicalNotes: ''
    });

    useEffect(() => {
        fetchGrades();
        if (id) {
            fetchStaff();
        }
    }, [id]);

    const fetchGrades = async () => {
        try {
            const response = await gradesAPI.getAll();
            setGrades(response.data.grades || []);
        } catch (error) {
            console.error('Failed to fetch grades', error);
        }
    };

    const fetchStaff = async () => {
        try {
            setPageLoading(true);
            const response = await staffAPI.getById(id);
            const staff = response.data.staff;

            setFormData({
                nationalId: staff.nationalId || '',
                fullName: staff.fullName || '',
                gender: staff.gender || '',
                dateOfBirth: staff.dateOfBirth ? new Date(staff.dateOfBirth).toISOString().split('T')[0] : '',
                dateOfEmployment: staff.dateOfEmployment ? new Date(staff.dateOfEmployment).toISOString().split('T')[0] : '',
                qualification: staff.qualification || '',
                role: staff.role || '',
                assignedGrade: staff.assignedGrade?._id || '',
                phone: staff.phone || '',
                email: staff.email || '',
                location: staff.location || '',
                emergencyContact: {
                    fullName: staff.emergencyContact?.fullName || '',
                    relationship: staff.emergencyContact?.relationship || '',
                    phone: staff.emergencyContact?.phone || '',
                    location: staff.emergencyContact?.location || '',
                    alternativeContact: staff.emergencyContact?.alternativeContact || ''
                },
                medicalNotes: staff.medicalNotes || ''
            });

            if (staff.photo) {
                setPhotoPreview(staff.photo);
            }
        } catch (error) {
            toast.error('Failed to fetch staff details');
            navigate('/staff');
        } finally {
            setPageLoading(false);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Photo size should be less than 5MB');
                return;
            }
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        if (name.startsWith('emergencyContact.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                emergencyContact: { ...prev.emergencyContact, [field]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const cleanText = (text) => {
        return text ? text.replace(/\s+/g, ' ').trim() : '';
    };

    const validateForm = () => {
        const newErrors = {};
        const nameRegex = /^[a-zA-Z\s]*$/;

        // Personal
        if (!formData.nationalId.trim()) newErrors.nationalId = 'National ID is required';
        if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
        else if (!nameRegex.test(formData.fullName)) newErrors.fullName = 'Name must contain only letters';

        if (!formData.gender) newErrors.gender = 'Gender is required';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';

        // Employment
        if (!formData.qualification) newErrors.qualification = 'Qualification is required';
        if (!formData.role) newErrors.role = 'Role is required';

        // Contact
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        else if (!/^(0|\+?254)?[7]\d{8}$/.test(formData.phone.replace(/\s/g, ''))) {
            // newErrors.phone = 'Enter a valid Kenyan phone number'; 
            // Broadening regex or just checking empty
        }
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Enter a valid email address';
        }

        // Emergency Contact
        if (!formData.emergencyContact.fullName.trim()) {
            newErrors['emergencyContact.fullName'] = 'Emergency contact name is required';
        }
        if (!formData.emergencyContact.relationship) {
            newErrors['emergencyContact.relationship'] = 'Relationship is required';
        }
        if (!formData.emergencyContact.phone.trim()) {
            newErrors['emergencyContact.phone'] = 'Emergency contact phone is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setLoading(true);
        try {
            const payload = new FormData();

            // Append base fields
            payload.append('nationalId', cleanText(formData.nationalId));
            payload.append('fullName', cleanText(formData.fullName));
            payload.append('gender', formData.gender);
            payload.append('dateOfBirth', formData.dateOfBirth);

            payload.append('dateOfEmployment', formData.dateOfEmployment);
            payload.append('qualification', formData.qualification);
            payload.append('role', formData.role);

            // Handle optional grade
            if (formData.assignedGrade) {
                payload.append('assignedGrade', formData.assignedGrade);
            } else {
                payload.append('assignedGrade', ''); // send empty string explicitly to clear if needed
            }

            payload.append('phone', cleanText(formData.phone));
            payload.append('location', cleanText(formData.location));
            if (formData.email) payload.append('email', cleanText(formData.email));
            if (formData.medicalNotes) payload.append('medicalNotes', cleanText(formData.medicalNotes));

            // Append Emergency Contact
            const emergencyData = {
                fullName: cleanText(formData.emergencyContact.fullName),
                relationship: formData.emergencyContact.relationship,
                phone: cleanText(formData.emergencyContact.phone),
                location: cleanText(formData.emergencyContact.location),
                alternativeContact: cleanText(formData.emergencyContact.alternativeContact)
            };
            payload.append('emergencyContact', JSON.stringify(emergencyData));

            if (photoFile) {
                payload.append('photo', photoFile);
            }

            if (id) {
                await staffAPI.update(id, payload);
                toast.success('Staff member updated successfully!');
                navigate(`/staff/${id}`); // Go to details page
            } else {
                await staffAPI.create(payload);
                toast.success('Staff registered successfully!');
                navigate('/staff');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save staff details');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getFieldError = (fieldName) => errors[fieldName];

    if (pageLoading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading staff details...</p>
            </div>
        );
    }

    return (
        <div className="staff-form-page">
            <div className="page-header">
                <button onClick={() => navigate('/staff')} className="btn btn-ghost">
                    <FiArrowLeft /> Back to Staff List
                </button>
                <div className="header-actions">
                    <button onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
                        {loading ? <><span className="spinner"></span> Saving...</> : <><FiSave /> {id ? 'Update Staff Member' : 'Register Staff'}</>}
                    </button>
                </div>
            </div>

            <div className="form-card">
                <div className="form-header">
                    <h2>{id ? 'Edit Staff Member' : 'Staff Registration Form'}</h2>
                    <p>{id ? 'Update details below' : 'Enter details for new staff member'}</p>
                </div>

                <form onSubmit={handleSubmit} className="staff-form">
                    {/* 1. Photo & Bio */}
                    <div className="form-section">
                        <div className="form-row photo-row">
                            <div className="photo-upload-container">
                                <div className="photo-preview" onClick={() => fileInputRef.current?.click()}>
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Staff" />
                                    ) : (
                                        <div className="photo-placeholder">
                                            <FiUser className="photo-icon" />
                                            <span>Upload Photo</span>
                                        </div>
                                    )}
                                    <div className="photo-overlay">
                                        <FiCamera />
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    style={{ display: 'none' }}
                                />
                                <span className="photo-hint">Max 5MB (Optional)</span>
                            </div>

                            <div className="staff-bio-fields">
                                <div className="form-row">
                                    <div className="form-group flex-2">
                                        <label className="form-label">Full Name *</label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            className={`form-input ${getFieldError('fullName') ? 'error' : ''}`}
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            placeholder="e.g. John Doe"
                                        />
                                        {getFieldError('fullName') && <span className="form-error">{getFieldError('fullName')}</span>}
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">National ID *</label>
                                        <input
                                            type="text"
                                            name="nationalId"
                                            className={`form-input ${getFieldError('nationalId') ? 'error' : ''}`}
                                            value={formData.nationalId}
                                            onChange={handleChange}
                                        />
                                        {getFieldError('nationalId') && <span className="form-error">{getFieldError('nationalId')}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Gender *</label>
                                        <select
                                            name="gender"
                                            className={`form-select ${getFieldError('gender') ? 'error' : ''}`}
                                            value={formData.gender}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                        {getFieldError('gender') && <span className="form-error">{getFieldError('gender')}</span>}
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Date of Birth *</label>
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            className={`form-input ${getFieldError('dateOfBirth') ? 'error' : ''}`}
                                            value={formData.dateOfBirth}
                                            onChange={handleChange}
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                        {getFieldError('dateOfBirth') && <span className="form-error">{getFieldError('dateOfBirth')}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Employment Details */}
                    <div className="form-section">
                        <div className="section-title">
                            <FiBriefcase /> Employment Details
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Role *</label>
                                <select
                                    name="role"
                                    className={`form-select ${getFieldError('role') ? 'error' : ''}`}
                                    value={formData.role}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Role</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="head_teacher">Head Teacher</option>
                                    <option value="admin">Admin</option>
                                    <option value="support_staff">Support Staff</option>
                                </select>
                                {getFieldError('role') && <span className="form-error">{getFieldError('role')}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Qualification *</label>
                                <select
                                    name="qualification"
                                    className={`form-select ${getFieldError('qualification') ? 'error' : ''}`}
                                    value={formData.qualification}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Qualification</option>
                                    <option value="certificate">Certificate</option>
                                    <option value="diploma">Diploma</option>
                                    <option value="bachelors">Bachelors Degree</option>
                                    <option value="masters">Masters Degree</option>
                                    <option value="phd">PhD</option>
                                </select>
                                {getFieldError('qualification') && <span className="form-error">{getFieldError('qualification')}</span>}
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Date of Employment *</label>
                                <input
                                    type="date"
                                    name="dateOfEmployment"
                                    className="form-input"
                                    value={formData.dateOfEmployment}
                                    onChange={handleChange}
                                />
                            </div>
                            {formData.role === 'teacher' && (
                                <div className="form-group">
                                    <label className="form-label">Assigned Grade (Class Teacher)</label>
                                    <select
                                        name="assignedGrade"
                                        className="form-select"
                                        value={formData.assignedGrade}
                                        onChange={handleChange}
                                    >
                                        <option value="">None</option>
                                        {grades.map(grade => (
                                            <option key={grade._id} value={grade._id}>{grade.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Contact Details */}
                    <div className="form-section">
                        <div className="section-title">
                            <FiPhone /> Contact Information
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Phone Number *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className={`form-input ${getFieldError('phone') ? 'error' : ''}`}
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="0712345678"
                                />
                                {getFieldError('phone') && <span className="form-error">{getFieldError('phone')}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    className={`form-input ${getFieldError('email') ? 'error' : ''}`}
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="staff@example.com"
                                />
                                {getFieldError('email') && <span className="form-error">{getFieldError('email')}</span>}
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group flex-2">
                                <label className="form-label">Residential Address / Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    className="form-input"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g. Migori Town, Estate X"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 4. Emergency Contact */}
                    <div className="form-section">
                        <div className="section-title">
                            <FiPlus /> Emergency Contact
                        </div>
                        <div className="form-row">
                            <div className="form-group flex-2">
                                <label className="form-label">Contact Name *</label>
                                <input
                                    type="text"
                                    name="emergencyContact.fullName"
                                    className={`form-input ${getFieldError('emergencyContact.fullName') ? 'error' : ''}`}
                                    value={formData.emergencyContact.fullName}
                                    onChange={handleChange}
                                />
                                {getFieldError('emergencyContact.fullName') && <span className="form-error">{getFieldError('emergencyContact.fullName')}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Relationship *</label>
                                <input
                                    type="text"
                                    name="emergencyContact.relationship"
                                    className={`form-input ${getFieldError('emergencyContact.relationship') ? 'error' : ''}`}
                                    value={formData.emergencyContact.relationship}
                                    onChange={handleChange}
                                    placeholder="e.g. Spouse, Sibling"
                                />
                                {getFieldError('emergencyContact.relationship') && <span className="form-error">{getFieldError('emergencyContact.relationship')}</span>}
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Phone Number *</label>
                                <input
                                    type="tel"
                                    name="emergencyContact.phone"
                                    className={`form-input ${getFieldError('emergencyContact.phone') ? 'error' : ''}`}
                                    value={formData.emergencyContact.phone}
                                    onChange={handleChange}
                                />
                                {getFieldError('emergencyContact.phone') && <span className="form-error">{getFieldError('emergencyContact.phone')}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Alternative Phone</label>
                                <input
                                    type="tel"
                                    name="emergencyContact.alternativeContact"
                                    className="form-input"
                                    value={formData.emergencyContact.alternativeContact}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 5. Medical Notes */}
                    <div className="form-section">
                        <div className="section-title">Medical Information</div>
                        <div className="form-group">
                            <label className="form-label">Medical Notes / Conditions (Optional)</label>
                            <textarea
                                name="medicalNotes"
                                className="form-textarea"
                                value={formData.medicalNotes}
                                onChange={handleChange}
                                placeholder="Any known medical conditions or allergies..."
                            />
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default StaffForm;
