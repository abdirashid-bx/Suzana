import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiUsers, FiEdit2, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { gradesAPI, staffAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './GradesList.css';

const GradesList = () => {
    const navigate = useNavigate();
    const { isAdmin, isHeadTeacher, canDelete } = useAuth();
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teachers, setTeachers] = useState([]);

    // Create/Edit Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingGrade, setEditingGrade] = useState(null);
    const [gradeForm, setGradeForm] = useState({ name: '', description: '', teacher: '' });

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [gradeToDelete, setGradeToDelete] = useState(null);

    useEffect(() => {
        fetchGrades();
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const response = await staffAPI.getAll({ role: 'teacher,head_teacher' });
            setTeachers(response.data.staff || []);
        } catch (error) {
            console.error('Failed to fetch teachers:', error);
        }
    };

    const fetchGrades = async () => {
        try {
            const response = await gradesAPI.getAll();
            setGrades(response.data.grades || []);
        } catch (error) {
            toast.error('Failed to fetch grades');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (grade = null) => {
        if (grade) {
            setEditingGrade(grade);
            setGradeForm({ name: grade.name, description: grade.description || '', teacher: grade.teacher?._id || '' });
        } else {
            setEditingGrade(null);
            setGradeForm({ name: '', description: '', teacher: '' });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!gradeForm.name) {
            toast.error('Please enter a grade name');
            return;
        }

        try {
            if (editingGrade) {
                await gradesAPI.update(editingGrade._id, gradeForm);
                toast.success('Grade updated successfully');
            } else {
                await gradesAPI.create(gradeForm);
                toast.success('Grade created successfully');
            }
            setShowModal(false);
            setGradeForm({ name: '', description: '', teacher: '' });
            setEditingGrade(null);
            fetchGrades();
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${editingGrade ? 'update' : 'create'} grade`);
        }
    };

    const confirmDelete = (grade) => {
        setGradeToDelete(grade);
        setShowDeleteModal(true);
    };

    const executeDelete = async () => {
        if (!gradeToDelete) return;

        try {
            await gradesAPI.delete(gradeToDelete._id);
            toast.success('Grade deleted successfully');
            fetchGrades();
            setShowDeleteModal(false);
            setGradeToDelete(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete grade');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading grades...</p>
            </div>
        );
    }

    return (
        <div className="grades-page">
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Grades & Classes</h1>
                    <span className="count-badge">{grades.length} grades</span>
                </div>
                {isHeadTeacher() && (
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">
                        <FiPlus /> Add Grade
                    </button>
                )}
            </div>

            <div className="grades-grid">
                {grades.map((grade) => (
                    <div
                        key={grade._id}
                        className="grade-card card clickable-card"
                        onClick={() => navigate(`/grades/${grade._id}`)}
                    >
                        <div className="grade-card-header">
                            <h3>{grade.name}</h3>
                            {(isHeadTeacher() || isAdmin()) && (
                                <div className="grade-actions" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        className="btn btn-icon "
                                        onClick={() => handleOpenModal(grade)}
                                    >
                                        <FiEdit2 className='hover:text-white' />
                                    </button>
                                    {canDelete() && (
                                        <button
                                            className="btn btn-icon  text-danger"
                                            onClick={() => confirmDelete(grade)}
                                        >
                                            <FiTrash2 className='hover:text-white' />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="grade-card-body">
                            <p className="grade-description">{grade.description || 'No description'}</p>

                            <div className="grade-stats">
                                <div className="stat-item">
                                    <FiUsers />
                                    <span>{grade.studentCount || 0} Students</span>
                                </div>
                                <div className="stat-item">
                                    <span className="classrooms-count">{grade.classroomCount || 0} Classroom(s)</span>
                                </div>
                            </div>

                            <div className="grade-teacher">
                                <span className="label">Teacher:</span>
                                <span className="name">{grade.teacher?.fullName || 'Not Assigned'}</span>
                            </div>

                            {grade.classrooms && grade.classrooms.length > 0 && (
                                <div className="classrooms-list">
                                    {grade.classrooms.map((classroom) => (
                                        <div key={classroom._id} className="classroom-badge">
                                            {classroom.name}
                                            <span className="capacity">
                                                {classroom.currentCount}/{classroom.capacity}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingGrade ? 'Edit Grade' : 'Add New Grade'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Grade Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Grade 2"
                                        value={gradeForm.name}
                                        onChange={(e) => setGradeForm({ ...gradeForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Brief description of this grade"
                                        value={gradeForm.description}
                                        onChange={(e) => setGradeForm({ ...gradeForm, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Class Teacher</label>
                                    <select
                                        className="form-select"
                                        value={gradeForm.teacher}
                                        onChange={(e) => setGradeForm({ ...gradeForm, teacher: e.target.value })}
                                    >
                                        <option value="">Select a teacher</option>
                                        {teachers.map((teacher) => (
                                            <option key={teacher._id} value={teacher._id}>
                                                {teacher.fullName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingGrade ? 'Update Grade' : 'Create Grade'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-icon">
                            <FiAlertTriangle />
                        </div>
                        <h3 className="modal-title">Delete Grade?</h3>
                        <p className="modal-message">
                            Are you sure you want to delete <strong>{gradeToDelete?.name}</strong>?
                            <br />
                            This will also delete associated classrooms.
                            {gradeToDelete?.studentCount > 0 && (
                                <span className="text-danger block mt-2">
                                    Warning: This grade has {gradeToDelete.studentCount} students. You cannot delete it until students are transferred.
                                </span>
                            )}
                        </p>
                        <div className="modal-actions">
                            <button
                                className="btn btn-ghost btn-cancel"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setGradeToDelete(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger btn-confirm-delete"
                                onClick={executeDelete}
                                disabled={gradeToDelete?.studentCount > 0}
                            >
                                Delete Grade
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GradesList;
