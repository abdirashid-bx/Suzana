import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiEye, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api, { studentsAPI, gradesAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './Students.css';

const StudentsList = () => {
    const { canManageStudents } = useAuth();
    const [students, setStudents] = useState([]);
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('');
    const [status, setStatus] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);
    const ITEMS_PER_PAGE = 20;

    useEffect(() => {
        fetchGrades();
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [selectedGrade, status, sortBy, sortOrder, page]);

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (page !== 1) {
                setPage(1);
            } else {
                fetchStudents();
            }
        }, 500);
        return () => clearTimeout(delaySearch);
    }, [search]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const params = {
                grade: selectedGrade || undefined,
                search: search || undefined,
                status: status || undefined,
                sortBy,
                sortOrder,
                page,
                limit: ITEMS_PER_PAGE
            };
            const response = await studentsAPI.getAll(params);

            // Handle both paginated and non-paginated responses for safety
            if (response.data.pagination) {
                setStudents(response.data.students || []);
                setTotalPages(response.data.pagination.totalPages);
                setTotalStudents(response.data.pagination.total);
            } else {
                // Fallback for non-paginated API
                setStudents(response.data.students || []);
                setTotalPages(1);
                setTotalStudents(response.data.count || 0);
            }
        } catch (error) {
            toast.error('Failed to fetch students');
            console.error(error);
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
        setPage(1); // Reset to page 1 on search
        fetchStudents();
    };

    const handleFilterChange = (setter) => (e) => {
        setter(e.target.value);
        setPage(1); // Reset to page 1 on filter change
    };

    return (
        <div className="students-page">
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Students</h1>
                    <span className="count-badge">{totalStudents} students</span>
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
                            onChange={handleFilterChange(setStatus)}
                            className="filter-select"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <select
                            value={selectedGrade}
                            onChange={handleFilterChange(setSelectedGrade)}
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
                ) : students.length > 0 ? (
                    <>
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
                                    {students.map((student) => (
                                        <tr key={student._id}>
                                            <td>
                                                <div className="student-avatar-small">
                                                    {student.photo ? (
                                                        <img src={`${api.defaults.baseURL.replace('/api', '')}${student.photo}`} alt={student.fullName} />
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
                                            <td>{student.classroom?.name}</td>
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

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="pagination-controls">
                                <button
                                    className="btn btn-outline"
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    <FiChevronLeft /> Previous
                                </button>
                                <span className="pagination-info">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    className="btn btn-outline"
                                    disabled={page === totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                >
                                    Next <FiChevronRight />
                                </button>
                            </div>
                        )}
                    </>
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
