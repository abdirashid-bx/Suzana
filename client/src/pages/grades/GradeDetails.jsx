import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiUsers, FiSearch, FiFileText } from 'react-icons/fi';
import { gradesAPI } from '../../services/api';
import DataTable from '../../components/common/DataTable';
import toast from 'react-hot-toast';
import './GradesList.css'; // Reuse existing styles

const GradeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [grade, setGrade] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchGradeDetails();
    }, [id]);

    const fetchGradeDetails = async () => {
        try {
            setLoading(true);
            const response = await gradesAPI.getById(id);
            setGrade(response.data.grade);
        } catch (error) {
            toast.error('Failed to fetch grade details');
            console.error(error);
            navigate('/grades');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredStudents = () => {
        if (!grade || !grade.students) return [];
        return grade.students.filter(student =>
            student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.admissionNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    };

    const columns = [
        {
            key: 'photo',
            label: 'Photo',
            render: (row) => (
                <div className="student-avatar-small">
                    {row.photo ? (
                        <img src={row.photo} alt={`${row.firstName} ${row.lastName}`} />
                    ) : (
                        <div className="avatar-placeholder">{row.firstName?.charAt(0)}</div>
                    )}
                </div>
            )
        },
        {
            key: 'full_name',
            label: 'Name',
            render: (row) => (
                <div>
                    <div className="font-medium">{row.firstName} {row.lastName}</div>
                    <div className="text-secondary text-sm">{row.admissionNumber}</div>
                </div>
            )
        },
        { key: 'gender', label: 'Gender', render: (row) => <span className="capitalize">{row.gender}</span> },
        {
            key: 'classroom',
            label: 'Class/Stream',
            render: (row) => row.classroom?.name || '-'
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
                <Link to={`/students/${row._id}`} className="btn-icon" title="View Student">
                    <FiFileText />
                </Link>
            )
        }
    ];

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading grade details...</p>
            </div>
        );
    }

    if (!grade) return null;

    return (
        <div className="grades-page">
            <div className="page-header">
                <div>
                    <button onClick={() => navigate('/grades')} className="btn btn-ghost btn-back mb-2">
                        <FiArrowLeft /> Back to Grades
                    </button>
                    <h1>{grade.name}</h1>
                    <p className="text-secondary">{grade.description}</p>
                </div>
                {/* Future actions like specific grade reports could go here */}
            </div>

            <div className="grade-stats-grid">
                <div className="card stat-card">
                    <div className="stat-icon">
                        <FiUsers />
                    </div>
                    <div className="stat-info">
                        <h3>Total Students</h3>
                        <p className="stat-value">{grade.studentCount || 0}  <span>Students</span>
                        </p>
                    </div>
                </div>
                <div className="card stat-card">
                    <div className="stat-icon">
                        <FiUser />
                    </div>
                    <div className="stat-info">
                        <h3>Class Teacher</h3>
                        <p className="stat-value text-lg">
                            {grade.teacher ? grade.teacher.fullName : 'Not Assigned'}
                        </p>
                    </div>
                </div>
                <div className="card stat-card">
                    <div className="stat-icon">
                        <FiUsers />
                    </div>
                    <div className="stat-info">
                        <h3>Classrooms (Streams)</h3>
                        <div className="classrooms-list mt-1">
                            {grade.classrooms && grade.classrooms.map(c => (
                                <span key={c._id} className="classroom-badge">
                                    {c.name} ({c.currentCount})
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card Regester-card">
                <div className="table-header p-4 border-b flex justify-between items-center space-y-3">
                    <h2>Registered Students</h2>
                    <div className="search-box">
                        <FiSearch className='search-icn'/>
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='search-input search-input-grade'
                        />
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={getFilteredStudents()}
                    isLoading={false} // Data already loaded
                    emptyMessage="No students registered in this grade yet."
                />
            </div>
        </div>
    );
};

export default GradeDetails;
