import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiArrowLeft, FiCamera, FiUser, FiCalendar } from 'react-icons/fi';
import { studentsAPI, gradesAPI } from '../../services/api';

import toast from 'react-hot-toast';
import './StudentForm.css';

const StudentForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const fileInputRef = useRef();
    const isEditMode = !!id;

    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        // Admission
        admissionNo: '',

        // Personal Details
        fullName: '',
        gender: '',
        dateOfBirth: '', // Reverted to string for native input
        grade: '',
        classroom: '',

        // Parent Details
        parent: {
            fullName: '',
            relationship: '',
            location: '',
            email: '',
            phone: '',
            alternativeContact: ''
        },

        // Fee Details (one-time payment) - Only relevant for creation or display
        initialFee: {
            amount: ''
        }
    });

    useEffect(() => {
        fetchGrades();
        if (isEditMode) {
            fetchStudent();
        }
    }, [id]);

    const fetchGrades = async () => {
        try {
            const response = await gradesAPI.getAll();
            setGrades(response.data.grades || []);
        } catch (error) {
            toast.error('Failed to fetch grades');
        }
    };

    const fetchStudent = async () => {
        try {
            setFetching(true);
            const response = await studentsAPI.getById(id);
            const student = response.data.student;

            if (student) {
                setFormData({
                    admissionNo: student.admissionNo,
                    fullName: student.fullName,
                    gender: student.gender,
                    dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
                    grade: student.grade?._id || student.grade || '', // Handle both populated and unpopulated
                    classroom: student.classroom?._id || student.classroom || '',
                    parent: {
                        fullName: student.parent?.fullName || '',
                        relationship: student.parent?.relationship || '',
                        location: student.parent?.location || '',
                        email: student.parent?.email || '',
                        phone: student.parent?.phone || '',
                        alternativeContact: student.parent?.alternativeContact || ''
                    },
                    initialFee: {
                        amount: '' // We don't edit initial fee amount here typically
                    }
                });

                if (student.photo) {
                    setPhotoPreview(student.photo);
                }
            }
        } catch (error) {
            toast.error('Failed to fetch student details');
            navigate('/students');
        } finally {
            setFetching(false);
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

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        if (name.startsWith('parent.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                parent: { ...prev.parent, [field]: value }
            }));
        } else if (name.startsWith('initialFee.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                initialFee: { ...prev.initialFee, [field]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const calculateAge = (dob) => {
        if (!dob) return '';
        const today = new Date();
        const birth = new Date(dob); // Works with both Date object and string
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const validateForm = () => {
        const newErrors = {};
        const nameRegex = /^[a-zA-Z\s]*$/; // Only letters and spaces allowed

        // Admission number validation
        if (!formData.admissionNo.trim()) {
            newErrors.admissionNo = 'Admission number is required';
        }

        // Personal details validation
        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        } else if (formData.fullName.trim().length < 3) {
            newErrors.fullName = 'Name must be at least 3 characters';
        } else if (!nameRegex.test(formData.fullName)) {
            newErrors.fullName = 'Name must contain only letters';
        }

        if (!formData.gender) {
            newErrors.gender = 'Please select gender';
        }

        if (!formData.dateOfBirth) {
            newErrors.dateOfBirth = 'Date of birth is required';
        } else {
            const age = calculateAge(formData.dateOfBirth);
            if (age < 0 || age > 15) {
                newErrors.dateOfBirth = 'Age must be between 0 and 15 years';
            }
        }

        if (!formData.grade) {
            newErrors.grade = 'Please select a grade';
        }

        if (!formData.classroom) {
            newErrors.classroom = 'Please select a class';
        }

        // Parent validation
        if (!formData.parent.fullName.trim()) {
            newErrors['parent.fullName'] = 'Parent/guardian name is required';
        } else if (!nameRegex.test(formData.parent.fullName)) {
            newErrors['parent.fullName'] = 'Name must contain only letters';
        }

        if (!formData.parent.relationship) {
            newErrors['parent.relationship'] = 'Please select relationship';
        }

        if (!formData.parent.phone.trim()) {
            newErrors['parent.phone'] = 'Phone number is required';
        } else if (!/^(0|\+?254)?[71]\d{8}$/.test(formData.parent.phone.replace(/\s/g, ''))) {
            newErrors['parent.phone'] = 'Enter a valid Kenyan phone number';
        }

        // Location Validation
        if (!formData.parent.location.trim()) {
            newErrors['parent.location'] = 'Location/Address is required';
        }

        // Fee validation - Only validate if not in edit mode
        if (!isEditMode) {
            if (!formData.initialFee.amount) {
                newErrors['initialFee.amount'] = 'Fee amount is required';
            } else if (parseFloat(formData.initialFee.amount) < 0) {
                newErrors['initialFee.amount'] = 'Amount cannot be negative';
            }
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

            // Helper to clean text
            const clean = (text) => text ? text.replace(/\s+/g, ' ').trim() : '';

            // Add all form data with cleaning
            payload.append('admissionNo', clean(formData.admissionNo));
            payload.append('fullName', clean(formData.fullName));
            payload.append('gender', formData.gender);
            // Ensure date is sent as string
            payload.append('dateOfBirth', formData.dateOfBirth);
            payload.append('grade', formData.grade);
            payload.append('classroom', formData.classroom);

            // Parent data cleaning
            const parentData = {
                ...formData.parent,
                fullName: clean(formData.parent.fullName),
                location: clean(formData.parent.location),
                email: clean(formData.parent.email),
                phone: clean(formData.parent.phone), // Keep phone regex check but also trim
                alternativeContact: clean(formData.parent.alternativeContact)
            };
            payload.append('parent', JSON.stringify(parentData));

            // Fee data - Only send if creating new student
            if (!isEditMode) {
                payload.append('initialFee', JSON.stringify({
                    amount: parseFloat(formData.initialFee.amount),
                    billingType: 'once'
                }));
            }

            // Photo if provided
            if (photoFile) {
                payload.append('photo', photoFile);
            }

            if (isEditMode) {
                await studentsAPI.update(id, payload);
                toast.success('Student details updated successfully!');
            } else {
                await studentsAPI.create(payload);
                toast.success('Student registered successfully!');
            }

            navigate(isEditMode ? `/students/${id}` : '/students');
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'register'} student`);
        } finally {
            setLoading(false);
        }
    };

    const today = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    const getFieldError = (fieldName) => errors[fieldName];

    if (fetching) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading student details...</p>
            </div>
        );
    }

    return (
        <div className="student-form-page">
            <div className="page-header">
                <button onClick={() => navigate(isEditMode ? `/students/${id}` : '/students')} className="btn btn-ghost">
                    <FiArrowLeft /> Back
                </button>
                <div className="header-actions">
                    <button onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
                        {loading ? <><span className="spinner"></span> Saving...</> : <><FiSave /> {isEditMode ? 'Update Details' : 'Register Student'}</>}
                    </button>
                </div>
            </div>

            <div className="form-card card">
                <div className="form-header no-print">
                    <h2>{isEditMode ? 'Edit Student Details' : 'Student Registration Form'}</h2>
                    <p>{isEditMode ? 'Update the student information below' : "Fill in the student's information below"}</p>
                </div>

                <form onSubmit={handleSubmit} className="registration-form">
                    {/* Photo Upload & Admission Info */}
                    <div className="form-section">
                        <div className="form-row photo-row">
                            <div className="photo-upload-container">
                                <div
                                    className="photo-preview"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Student" />
                                    ) : (
                                        <div className="photo-placeholder">
                                            <FiUser className="photo-icon" />
                                            <span>Click to upload photo</span>
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

                            <div className="admission-fields">
                                <div className="form-group">
                                    <label className="form-label">Admission Number *</label>
                                    <input
                                        type="text"
                                        name="admissionNo"
                                        className={`form-input ${getFieldError('admissionNo') ? 'error' : ''}`}
                                        placeholder="e.g., SEC/2025/0001"
                                        value={formData.admissionNo}
                                        onChange={handleChange}
                                        disabled={isEditMode} // Usually shouldn't change admission no
                                    />
                                    {getFieldError('admissionNo') && (
                                        <span className="form-error">{getFieldError('admissionNo')}</span>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">{isEditMode ? 'Last Updated' : 'Registration Date'}</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={today}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Personal Details */}
                    <div className="form-section">
                        <h3 className="section-title">Personal Details</h3>

                        <div className="form-row">
                            <div className="form-group flex-2">
                                <label className="form-label">Full Name *</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    className={`form-input ${getFieldError('fullName') ? 'error' : ''}`}
                                    placeholder="Enter student's full name"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                />
                                {getFieldError('fullName') && (
                                    <span className="form-error">{getFieldError('fullName')}</span>
                                )}
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
                                {getFieldError('gender') && (
                                    <span className="form-error">{getFieldError('gender')}</span>
                                )}
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
                                {getFieldError('dateOfBirth') && (
                                    <span className="form-error">{getFieldError('dateOfBirth')}</span>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Age</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.dateOfBirth ? `${calculateAge(formData.dateOfBirth)} years` : ''}
                                    readOnly
                                    placeholder="Auto-calculated"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Grade *</label>
                                <select
                                    name="grade"
                                    className={`form-select ${getFieldError('grade') ? 'error' : ''}`}
                                    value={formData.grade}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Grade</option>
                                    {grades.map((grade) => (
                                        <option key={grade._id} value={grade._id}>
                                            {grade.name}
                                        </option>
                                    ))}
                                </select>
                                {getFieldError('grade') && (
                                    <span className="form-error">{getFieldError('grade')}</span>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Class *</label>
                                <select
                                    name="classroom"
                                    className={`form-select ${getFieldError('classroom') ? 'error' : ''}`}
                                    value={formData.classroom}
                                    onChange={handleChange}
                                    disabled={!formData.grade}
                                >
                                    <option value="">Select Class</option>
                                    {grades.find(g => g._id === formData.grade)?.classrooms?.map((classroom) => (
                                        <option key={classroom._id} value={classroom._id}>
                                            {classroom.name}
                                        </option>
                                    ))}
                                </select>
                                {getFieldError('classroom') && (
                                    <span className="form-error">{getFieldError('classroom')}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Parent/Guardian Details */}
                    <div className="form-section">
                        <h3 className="section-title">Parent/Guardian Details</h3>

                        <div className="form-row">
                            <div className="form-group flex-2">
                                <label className="form-label">Full Name *</label>
                                <input
                                    type="text"
                                    name="parent.fullName"
                                    className={`form-input ${getFieldError('parent.fullName') ? 'error' : ''}`}
                                    placeholder="Parent/Guardian full name"
                                    value={formData.parent.fullName}
                                    onChange={handleChange}
                                />
                                {getFieldError('parent.fullName') && (
                                    <span className="form-error">{getFieldError('parent.fullName')}</span>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Relationship *</label>
                                <select
                                    name="parent.relationship"
                                    className={`form-select ${getFieldError('parent.relationship') ? 'error' : ''}`}
                                    value={formData.parent.relationship}
                                    onChange={handleChange}
                                >
                                    <option value="">Select</option>
                                    <option value="father">Father</option>
                                    <option value="mother">Mother</option>
                                    <option value="guardian">Guardian</option>
                                    <option value="other">Other</option>
                                </select>
                                {getFieldError('parent.relationship') && (
                                    <span className="form-error">{getFieldError('parent.relationship')}</span>
                                )}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Phone Number *</label>
                                <input
                                    type="tel"
                                    name="parent.phone"
                                    className={`form-input ${getFieldError('parent.phone') ? 'error' : ''}`}
                                    placeholder="e.g., 0712345678"
                                    value={formData.parent.phone}
                                    onChange={handleChange}
                                />
                                {getFieldError('parent.phone') && (
                                    <span className="form-error">{getFieldError('parent.phone')}</span>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Alternative Contact <span className="optional">(Optional)</span></label>
                                <input
                                    type="tel"
                                    name="parent.alternativeContact"
                                    className="form-input"
                                    placeholder="Alternative phone number"
                                    value={formData.parent.alternativeContact}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Email <span className="optional">(Optional)</span></label>
                                <input
                                    type="email"
                                    name="parent.email"
                                    className="form-input"
                                    placeholder="email@example.com"
                                    value={formData.parent.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Location/Address *</label>
                                <input
                                    type="text"
                                    name="parent.location"
                                    className={`form-input ${getFieldError('parent.location') ? 'error' : ''}`}
                                    placeholder="Home location"
                                    value={formData.parent.location}
                                    onChange={handleChange}
                                />
                                {getFieldError('parent.location') && (
                                    <span className="form-error">{getFieldError('parent.location')}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Fee Details - Hidden in Edit Mode */}
                    {!isEditMode && (
                        <div className="form-section">
                            <h3 className="section-title">Registration Fee</h3>
                            <p className="section-description">One-time registration fee for the student's entire school life</p>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Amount (KES) *</label>
                                    <input
                                        type="number"
                                        name="initialFee.amount"
                                        className={`form-input ${getFieldError('initialFee.amount') ? 'error' : ''}`}
                                        placeholder="e.g., 5000"
                                        value={formData.initialFee.amount}
                                        onChange={handleChange}
                                        min="0"
                                    />
                                    {getFieldError('initialFee.amount') && (
                                        <span className="form-error">{getFieldError('initialFee.amount')}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </form>
            </div>
        </div>
    );
};

export default StudentForm;
