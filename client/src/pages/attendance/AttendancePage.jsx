import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiClock, FiCalendar, FiSave } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { gradesAPI, attendanceAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './AttendancePage.css';

const AttendancePage = () => {
    const { user, canEditAttendance } = useAuth();
    const [grades, setGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedClassroom, setSelectedClassroom] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchGrades();
    }, []);

    useEffect(() => {
        if (selectedClassroom) {
            fetchAttendanceForMarking();
        }
    }, [selectedClassroom, date]);

    const fetchGrades = async () => {
        try {
            const response = await gradesAPI.getAll();
            setGrades(response.data.grades || []);
        } catch (error) {
            toast.error('Failed to fetch grades');
        }
    };

    const fetchAttendanceForMarking = async () => {
        try {
            setLoading(true);
            const response = await attendanceAPI.getForMarking(selectedClassroom, { date });
            setStudents(response.data.students || []);

            // Pre-fill existing attendance
            const existingAttendance = response.data.existingAttendance;
            if (existingAttendance) {
                const attendanceMap = {};
                existingAttendance.records.forEach(record => {
                    attendanceMap[record.student._id || record.student] = record.status;
                });
                setAttendance(attendanceMap);
            } else {
                setAttendance({});
            }
        } catch (error) {
            toast.error('Failed to fetch attendance data');
        } finally {
            setLoading(false);
        }
    };

    const handleGradeChange = (gradeId) => {
        setSelectedGrade(gradeId);
        setSelectedClassroom('');
        setStudents([]);
        setAttendance({});
    };

    const getClassroomsForGrade = () => {
        const grade = grades.find(g => g._id === selectedGrade);
        return grade?.classrooms || [];
    };

    const handleAttendanceChange = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const markAll = (status) => {
        const newAttendance = {};
        students.forEach(student => {
            newAttendance[student._id] = status;
        });
        setAttendance(newAttendance);
    };

    const handleSubmit = async () => {
        if (Object.keys(attendance).length !== students.length) {
            toast.error('Please mark attendance for all students');
            return;
        }

        const grade = grades.find(g => g._id === selectedGrade);

        const records = Object.entries(attendance).map(([studentId, status]) => ({
            student: studentId,
            status
        }));

        try {
            setSaving(true);
            await attendanceAPI.mark({
                date,
                grade: selectedGrade,
                classroom: selectedClassroom,
                records
            });
            toast.success('Attendance saved successfully!');
        } catch (error) {
            toast.error('Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present': return <FiCheck className="status-icon present" />;
            case 'absent': return <FiX className="status-icon absent" />;
            case 'late': return <FiClock className="status-icon late" />;
            default: return null;
        }
    };

    return (
        <div className="attendance-page">
            <div className="page-header">
                <h1>Attendance Tracking</h1>
            </div>

            <div className="attendance-filters card">
                <div className="filter-row">
                    <div className="form-group">
                        <label className="form-label">Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Grade</label>
                        <select
                            className="form-select"
                            value={selectedGrade}
                            onChange={(e) => handleGradeChange(e.target.value)}
                        >
                            <option value="">Select Grade</option>
                            {grades.map(grade => (
                                <option key={grade._id} value={grade._id}>{grade.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Classroom</label>
                        <select
                            className="form-select"
                            value={selectedClassroom}
                            onChange={(e) => setSelectedClassroom(e.target.value)}
                            disabled={!selectedGrade}
                        >
                            <option value="">Select Classroom</option>
                            {getClassroomsForGrade().map(classroom => (
                                <option key={classroom._id} value={classroom._id}>{classroom.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {selectedClassroom && (
                <div className="card">
                    <div className="card-header">
                        <h3>Mark Attendance</h3>
                        <div className="quick-actions">
                            <button className="btn btn-sm btn-ghost" onClick={() => markAll('present')}>
                                All Present
                            </button>
                            <button className="btn btn-sm btn-ghost" onClick={() => markAll('absent')}>
                                All Absent
                            </button>
                        </div>
                    </div>
                    <div className="card-body">
                        {loading ? (
                            <div className="loading-container">
                                <div className="spinner"></div>
                                <p>Loading students...</p>
                            </div>
                        ) : students.length > 0 ? (
                            <>
                                <div className="attendance-table">
                                    <div className="attendance-header">
                                        <div className="col-student">Student</div>
                                        <div className="col-status">Present</div>
                                        <div className="col-status">Absent</div>
                                        <div className="col-status">Late</div>
                                    </div>
                                    {students.map((student, index) => (
                                        <div key={student._id} className="attendance-row">
                                            <div className="col-student">
                                                <span className="student-number">{index + 1}</span>
                                                <div className="student-info">
                                                    <span className="student-name">{student.fullName}</span>
                                                    <span className="student-admission">{student.admissionNo}</span>
                                                </div>
                                            </div>
                                            <div className="col-status">
                                                <button
                                                    className={`status-btn present ${attendance[student._id] === 'present' ? 'active' : ''}`}
                                                    onClick={() => handleAttendanceChange(student._id, 'present')}
                                                >
                                                    <FiCheck />
                                                </button>
                                            </div>
                                            <div className="col-status">
                                                <button
                                                    className={`status-btn absent ${attendance[student._id] === 'absent' ? 'active' : ''}`}
                                                    onClick={() => handleAttendanceChange(student._id, 'absent')}
                                                >
                                                    <FiX />
                                                </button>
                                            </div>
                                            <div className="col-status">
                                                <button
                                                    className={`status-btn late ${attendance[student._id] === 'late' ? 'active' : ''}`}
                                                    onClick={() => handleAttendanceChange(student._id, 'late')}
                                                >
                                                    <FiClock />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="attendance-summary">
                                    <div className="summary-item">
                                        <span className="count present">{Object.values(attendance).filter(s => s === 'present').length}</span>
                                        <span className="label">Present</span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="count absent">{Object.values(attendance).filter(s => s === 'absent').length}</span>
                                        <span className="label">Absent</span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="count late">{Object.values(attendance).filter(s => s === 'late').length}</span>
                                        <span className="label">Late</span>
                                    </div>
                                </div>

                                <div className="attendance-actions">
                                    <button
                                        className="btn btn-primary btn-lg"
                                        onClick={handleSubmit}
                                        disabled={saving}
                                    >
                                        {saving ? <><span className="spinner"></span> Saving...</> : <><FiSave /> Save Attendance</>}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="empty-state">
                                <FiCalendar className="empty-icon" />
                                <p>No students in this classroom</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendancePage;
