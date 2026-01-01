import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiFilter, FiEye, FiEdit2, FiTrash2, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { studentsAPI, gradesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './Students.css';

const StudentsList = () => {
    const { canManageStudents, canDelete } = useAuth();
    const [students, setStudents] = useState([]);
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('');
    const [status, setStatus] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        fetchStudents();
        fetchGrades();
    }, [selectedGrade, status, sortBy, sortOrder]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const params = {
                grade: selectedGrade || undefined,
                search: search || undefined,
                status: status || undefined,
                sortBy,
                sortOrder
            };
            const response = await studentsAPI.getAll(params);
            setStudents(response.data.students || []);
        } catch (error) {
            toast.error('Failed to fetch students');
        } finally {
            setLoading(false);
        }
    };

    const fetchGrades = async () => {
        try {
            const response = await gradesAPI.getAll();
            setGrades(response.data.grades || []);
        } catch (error) {
            console.error('Failed to fetch grades:', error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchStudents();
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            return;
        }

        try {
            await studentsAPI.delete(id);
            toast.success('Student deleted successfully');
            fetchStudents();
        } catch (error) {
            toast.error('Failed to delete student');
        }
    };

    const filteredStudents = students.filter(student =>
        student.fullName.toLowerCase().includes(search.toLowerCase()) ||
        student.admissionNo.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="students-page">
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Students</h1>
                    <span className="count-badge">{filteredStudents.length} students</span>
                </div>
                {canManageStudents() && (
                    <Link to="/students/new" className="btn btn-primary">
                        <FiPlus /> Add Student
                    </Link>
                )}
            </div>

            <div className="table-card">
                {/* Search and Filter Section */}
                <div className="table-header-controls">
                    <form onSubmit={handleSearch} className="search-form">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by name or student ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="search-input"
                        />
                    </form>

                    <div className="filter-group">
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <select
                            value={selectedGrade}
                            onChange={(e) => setSelectedGrade(e.target.value)}
                            className="filter-select"
                        >
                            <option value="">All Classes</option>
                            {grades.map((grade) => (
                                <option key={grade._id} value={grade._id}>
                                    {grade.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="filter-select"
                        >
                            <option value="createdAt">Newest First</option>
                            <option value="fullName">Name A-Z</option>
                            <option value="admissionNo">Admission No</option>
                        </select>
                    </div>
                </div>

                {/* Table Section */}
                {loading ? (
                    <div className="table-loading">
                        <div className="spinner"></div>
                        <p>Loading students...</p>
                    </div>
                ) : filteredStudents.length > 0 ? (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Photo</th>
                                    <th>Student ID</th>
                                    <th>Name</th>
                                    <th>Gender</th>
                                    <th>Class</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((student) => (
                                    <tr key={student._id}>
                                        <td>
                                            <div className="student-avatar-small">
                                                {student.photo ? (
                                                    <img src={student.photo} alt={student.fullName} />
                                                ) : (
                                                    <span>{student.fullName?.charAt(0)}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="student-id">{student.admissionNo}</span>
                                        </td>
                                        <td>
                                            <span className="student-name">{student.fullName}</span>
                                        </td>
                                        <td>{student.gender}</td>
                                        <td>{student.grade?.name}</td>
                                        <td>
                                            <span className={`status-pill status-${student.status}`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td>
                                            <Link to={`/students/${student._id}`} className="btn-view">
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <FiSearch className="empty-icon" />
                        <h3>No students found</h3>
                        <p>Try adjusting your search or filter criteria</p>
                        {canManageStudents() && (
                            <Link to="/students/new" className="btn btn-primary">
                                <FiPlus /> Add First Student
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentsList;
