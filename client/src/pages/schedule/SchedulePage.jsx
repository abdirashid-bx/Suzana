import { useState, useEffect } from 'react';
import { FiClock, FiRefreshCw } from 'react-icons/fi';
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

    const initializeSchedule = async () => {
        try {
            await schedulesAPI.initialize(selectedGrade);
            toast.success('Schedule initialized successfully!');
            fetchSchedule();
        } catch (error) {
            toast.error('Failed to initialize schedule');
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

    const getCurrentPeriod = () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        return currentTime;
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

                    {isAdmin() && (
                        <button className="btn btn-secondary" onClick={initializeSchedule}>
                            <FiRefreshCw /> Initialize Default
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
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-schedule">
                                        <p>No schedule set</p>
                                        {isAdmin() && (
                                            <button className="btn btn-sm btn-ghost" onClick={initializeSchedule}>
                                                Set Default
                                            </button>
                                        )}
                                    </div>
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
        </div>
    );
};

export default SchedulePage;
