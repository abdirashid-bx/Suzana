import { useState, useEffect } from 'react';
import { FiClock, FiPlus, FiEdit2, FiTrash2, FiX, FiTrash } from 'react-icons/fi';
import { gradesAPI, schedulesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './SchedulePage.css';

const SchedulePage = () => {
    const { isAdmin } = useAuth();
    const [grades, setGrades] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedDay, setSelectedDay] = useState('');
    const [editingPeriodIndex, setEditingPeriodIndex] = useState(null);
    const [periodForm, setPeriodForm] = useState({
        startTime: '',
        endTime: '',
        activity: '',
        type: 'class'
    });

    useEffect(() => {
        fetchGrades();
    }, []);

    useEffect(() => {
        if (selectedGrade) {
            fetchSchedule();
        }
    }, [selectedGrade]);

    const fetchGrades = async () => {
        try {
            const response = await gradesAPI.getAll();
            setGrades(response.data.grades || []);
            if (response.data.grades?.length > 0) {
                setSelectedGrade(response.data.grades[0]._id);
            }
        } catch (error) {
            toast.error('Failed to fetch grades');
        }
    };

    const fetchSchedule = async () => {
        try {
            setLoading(true);
            const response = await schedulesAPI.getByGrade(selectedGrade);
            setSchedule(response.data.weekSchedule);
        } catch (error) {
            setSchedule(null);
        } finally {
            setLoading(false);
        }
    };



    const handleAddPeriod = (day) => {
        setSelectedDay(day);
        setEditingPeriodIndex(null);
        setPeriodForm({
            startTime: '',
            endTime: '',
            activity: '',
            type: 'class'
        });
        setShowModal(true);
    };

    const handleEditPeriod = (day, periodIndex, period) => {
        setSelectedDay(day);
        setEditingPeriodIndex(periodIndex);
        setPeriodForm({
            startTime: period.startTime,
            endTime: period.endTime,
            activity: period.activity,
            type: period.type
        });
        setShowModal(true);
    };

    const handleDeletePeriod = async (day, periodIndex) => {
        if (!window.confirm('Are you sure you want to delete this period?')) {
            return;
        }

        try {
            const daySchedule = schedule[day];
            const updatedPeriods = daySchedule.periods.filter((_, index) => index !== periodIndex);

            if (daySchedule._id) {
                await schedulesAPI.update(daySchedule._id, { periods: updatedPeriods });
            }

            toast.success('Period deleted successfully');
            fetchSchedule();
        } catch (error) {
            toast.error('Failed to delete period');
        }
    };

    const handleSavePeriod = async (e) => {
        e.preventDefault();

        // Validation
        if (!periodForm.startTime || !periodForm.endTime || !periodForm.activity) {
            toast.error('Please fill in all fields');
            return;
        }

        if (periodForm.startTime >= periodForm.endTime) {
            toast.error('End time must be after start time');
            return;
        }

        try {
            const daySchedule = schedule[selectedDay];
            let updatedPeriods = daySchedule?.periods ? [...daySchedule.periods] : [];

            if (editingPeriodIndex !== null) {
                // Update existing period
                updatedPeriods[editingPeriodIndex] = periodForm;
            } else {
                // Add new period
                updatedPeriods.push(periodForm);
                // Sort periods by start time
                updatedPeriods.sort((a, b) => a.startTime.localeCompare(b.startTime));
            }

            // Save to backend
            if (daySchedule?._id) {
                // Update existing schedule
                await schedulesAPI.update(daySchedule._id, { periods: updatedPeriods });
            } else {
                // Create new schedule
                await schedulesAPI.create({
                    grade: selectedGrade,
                    dayOfWeek: selectedDay,
                    periods: updatedPeriods
                });
            }

            toast.success(editingPeriodIndex !== null ? 'Period updated successfully' : 'Period added successfully');
            setShowModal(false);
            fetchSchedule();
        } catch (error) {
            toast.error('Failed to save period');
            console.error(error);
        }
    };

    const handleDeleteAll = async () => {
        const gradeName = grades.find(g => g._id === selectedGrade)?.name;

        if (!window.confirm(`Are you sure you want to delete ALL schedules for ${gradeName}?\n\nThis will remove all periods from Monday to Friday.\n\nThis action cannot be undone.`)) {
            return;
        }

        try {
            await schedulesAPI.deleteAllByGrade(selectedGrade);
            toast.success(`All schedules deleted for ${gradeName}`);
            fetchSchedule();
        } catch (error) {
            toast.error('Failed to delete schedules');
            console.error(error);
        }
    };

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    const getTypeColor = (type) => {
        switch (type) {
            case 'class': return 'type-class';
            case 'break': return 'type-break';
            case 'lunch': return 'type-lunch';
            case 'nap': return 'type-nap';
            case 'activity': return 'type-activity';
            default: return '';
        }
    };

    return (
        <div className="schedule-page">
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Class Schedule</h1>
                    <span className="current-time">
                        <FiClock /> {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                <div className="header-actions">
                    <select
                        className="form-select"
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                    >
                        {grades.map(grade => (
                            <option key={grade._id} value={grade._id}>{grade.name}</option>
                        ))}
                    </select>

                    {isAdmin() && schedule && Object.values(schedule).some(day => day?.periods?.length > 0) && (
                        <button
                            className="btn btn-danger"
                            onClick={handleDeleteAll}
                            title="Delete all schedules for this grade"
                        >
                            <FiTrash /> Delete
                        </button>
                    )}
                </div>
            </div>

            <div className="schedule-grid">
                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading schedule...</p>
                    </div>
                ) : (
                    days.map((day, dayIndex) => (
                        <div key={day} className="day-column card">
                            <div className="day-header">
                                <h3>{dayLabels[dayIndex]}</h3>
                            </div>
                            <div className="day-periods">
                                {schedule && schedule[day] && schedule[day].periods ? (
                                    schedule[day].periods.map((period, index) => (
                                        <div key={index} className={`period-card ${getTypeColor(period.type)}`}>
                                            <div className="period-time">
                                                {period.startTime} - {period.endTime}
                                            </div>
                                            <div className="period-activity">
                                                {period.activity}
                                            </div>
                                            <span className="period-type">{period.type}</span>

                                            {isAdmin() && (
                                                <div className="period-actions">
                                                    <button
                                                        className="btn-icon-small"
                                                        onClick={() => handleEditPeriod(day, index, period)}
                                                        title="Edit period"
                                                    >
                                                        <FiEdit2 />
                                                    </button>
                                                    <button
                                                        className="btn-icon-small btn-danger-icon"
                                                        onClick={() => handleDeletePeriod(day, index)}
                                                        title="Delete period"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-schedule">
                                        <p>No schedule set</p>
                                    </div>
                                )}

                                {isAdmin() && (
                                    <button
                                        className="btn-add-period"
                                        onClick={() => handleAddPeriod(day)}
                                    >
                                        <FiPlus /> Add Period
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="schedule-legend">
                <h4>Legend:</h4>
                <div className="legend-items">
                    <span className="legend-item type-class">Class</span>
                    <span className="legend-item type-break">Break</span>
                    <span className="legend-item type-lunch">Lunch</span>
                    <span className="legend-item type-activity">Activity</span>
                </div>
            </div>

            {/* Period Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal schedule-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingPeriodIndex !== null ? 'Edit Period' : 'Add New Period'}
                            </h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={handleSavePeriod}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Start Time *</label>
                                        <input
                                            type="time"
                                            className="form-input"
                                            value={periodForm.startTime}
                                            onChange={(e) => setPeriodForm({ ...periodForm, startTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">End Time *</label>
                                        <input
                                            type="time"
                                            className="form-input"
                                            value={periodForm.endTime}
                                            onChange={(e) => setPeriodForm({ ...periodForm, endTime: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Activity Name *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Mathematics, Morning Break"
                                        value={periodForm.activity}
                                        onChange={(e) => setPeriodForm({ ...periodForm, activity: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Period Type *</label>
                                    <select
                                        className="form-select"
                                        value={periodForm.type}
                                        onChange={(e) => setPeriodForm({ ...periodForm, type: e.target.value })}
                                        required
                                    >
                                        <option value="class">Class</option>
                                        <option value="break">Break</option>
                                        <option value="lunch">Lunch</option>
                                        <option value="activity">Activity</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingPeriodIndex !== null ? 'Update Period' : 'Add Period'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchedulePage;
