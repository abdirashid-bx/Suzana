import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FiUsers,
    FiUserCheck,
    FiBookOpen,
    FiDollarSign,
    FiClipboard,
    FiTrendingUp,
    FiCalendar,
    FiAlertCircle,
    FiArrowRight,
    FiCheckCircle,
    FiClock
} from 'react-icons/fi';
import { studentsAPI, staffAPI, gradesAPI, feesAPI, attendanceAPI } from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const { user, canManageStudents, canManageStaff, canManageFees } = useAuth();
    const [stats, setStats] = useState({
        students: 0,
        staff: 0,
        grades: 0,
        outstanding: 0,
        collected: 0,
        attendanceRate: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentStudents, setRecentStudents] = useState([]);
    const [outstandingFees, setOutstandingFees] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [studentsRes, gradesRes] = await Promise.all([
                studentsAPI.getAll(),
                gradesAPI.getAll()
            ]);

            let feeData = { summary: { totalOutstanding: 0, totalCollected: 0 }, studentsWithOutstanding: [] };
            let staffData = { count: 0 };
            let attendanceData = { overall: { total: 0, present: 0 } };

            if (canManageFees()) {
                try {
                    feeData = (await feesAPI.getSummary()).data;
                } catch (e) { console.log('No fee data'); }
            }

            if (canManageStaff()) {
                try {
                    staffData = (await staffAPI.getAll()).data;
                } catch (e) { console.log('No staff data'); }
            }

            try {
                attendanceData = (await attendanceAPI.getSummary({ date: new Date().toISOString().split('T')[0] })).data;
            } catch (e) { console.log('No attendance data'); }

            const attendanceRate = attendanceData.overall?.total > 0
                ? (((attendanceData.overall?.present || 0) + (attendanceData.overall?.late || 0)) / attendanceData.overall.total * 100).toFixed(1)
                : 0;

            setStats({
                students: studentsRes.data.count || 0,
                staff: staffData.count || 0,
                grades: gradesRes.data.grades?.length || 0,
                outstanding: feeData.summary?.totalOutstanding || 0,
                collected: feeData.summary?.totalCollected || 0,
                attendanceRate
            });

            setRecentStudents(studentsRes.data.students?.slice(0, 5) || []);
            setOutstandingFees(feeData.studentsWithOutstanding?.slice(0, 5) || []);

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getRoleDashboardCards = () => {
        const allCards = [
            {
                title: 'Total Students',
                value: stats.students,
                icon: FiUsers,
                color: 'maroon',
                link: '/students',
                show: true
            },
            {
                title: 'Total Staff',
                value: stats.staff,
                icon: FiUserCheck,
                color: 'navy',
                link: '/staff',
                show: canManageStaff()
            },
            {
                title: 'Active Grades',
                value: stats.grades,
                icon: FiBookOpen,
                color: 'gold',
                link: '/grades',
                show: true
            },
            {
                title: 'Fee Collection',
                value: formatCurrency(stats.collected),
                icon: FiDollarSign,
                color: 'success',
                link: '/finance',
                show: canManageFees()
            },
            {
                title: 'Outstanding Fees',
                value: formatCurrency(stats.outstanding),
                icon: FiAlertCircle,
                color: 'warning',
                link: '/finance',
                show: canManageFees()
            },
            {
                title: "Today's Attendance",
                value: `${stats.attendanceRate}%`,
                icon: FiClipboard,
                color: 'info',
                link: '/attendance',
                show: true
            }
        ];

        return allCards.filter(card => card.show);
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            {/* Welcome Section */}
            <div className="welcome-section">
                <div className="welcome-text">
                    <h1>{getGreeting()}, {user?.fullName?.split(' ')[0]}!</h1>
                    <p>Here's what's happening at Suzana Education Center today.</p>
                </div>
                <div className="quick-actions">
                    {canManageStudents() && (
                        <Link to="/students/new" className="btn btn-primary">
                            <FiUsers /> New Student
                        </Link>
                    )}
                    <Link to="/attendance" className="btn btn-secondary">
                        <FiClipboard /> Mark Attendance
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                {getRoleDashboardCards().map((card, index) => (
                    <Link to={card.link} key={index} className={`stat-card stat-card-${card.color}`}>
                        <div className="stat-icon">
                            <card.icon />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{card.value}</span>
                            <span className="stat-title">{card.title}</span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Two Column Layout */}
            <div className="dashboard-grid">
                {/* Recent Students */}
                <div className="card">
                    <div className="card-header">
                        <h3>Recent Students</h3>
                        <Link to="/students" className="view-all">
                            View All <FiArrowRight />
                        </Link>
                    </div>
                    <div className="card-body">
                        {recentStudents.length > 0 ? (
                            <ul className="recent-list">
                                {recentStudents.map((student) => (
                                    <li key={student._id} className="recent-item">
                                        <div className="recent-avatar">
                                            {student.fullName?.charAt(0)}
                                        </div>
                                        <div className="recent-info">
                                            <span className="recent-name">{student.fullName}</span>
                                            <span className="recent-meta">
                                                {student.grade?.name} • {student.admissionNo}
                                            </span>
                                        </div>
                                        <span className="badge badge-maroon">{student.grade?.name}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="empty-state">
                                <FiUsers className="empty-icon" />
                                <p>No students registered yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Outstanding Fees */}
                {canManageFees() && (
                    <div className="card">
                        <div className="card-header">
                            <h3>Outstanding Fees</h3>
                            <Link to="/finance" className="view-all">
                                View All <FiArrowRight />
                            </Link>
                        </div>
                        <div className="card-body">
                            {outstandingFees.length > 0 ? (
                                <ul className="recent-list">
                                    {outstandingFees.map((fee) => (
                                        <li key={fee._id} className="recent-item">
                                            <div className="recent-avatar warning">
                                                <FiDollarSign />
                                            </div>
                                            <div className="recent-info">
                                                <span className="recent-name">{fee.student?.fullName}</span>
                                                <span className="recent-meta">
                                                    {fee.billingType} • {fee.student?.grade?.name}
                                                </span>
                                            </div>
                                            <span className="badge badge-warning">
                                                {formatCurrency(fee.amount)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="empty-state">
                                    <FiCheckCircle className="empty-icon success" />
                                    <p>All fees are paid up!</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Today's Schedule - For Teachers */}
                {user?.role === 'teacher' && (
                    <div className="card">
                        <div className="card-header">
                            <h3>Today's Schedule</h3>
                            <Link to="/schedule" className="view-all">
                                View All <FiArrowRight />
                            </Link>
                        </div>
                        <div className="card-body">
                            <div className="schedule-preview">
                                <div className="schedule-item">
                                    <FiClock className="schedule-icon" />
                                    <div className="schedule-info">
                                        <span className="schedule-time">08:00 - 09:00</span>
                                        <span className="schedule-activity">Morning Activity</span>
                                    </div>
                                </div>
                                <div className="schedule-item">
                                    <FiClock className="schedule-icon" />
                                    <div className="schedule-info">
                                        <span className="schedule-time">09:00 - 09:30</span>
                                        <span className="schedule-activity">Class 1</span>
                                    </div>
                                </div>
                                <div className="schedule-item">
                                    <FiClock className="schedule-icon" />
                                    <div className="schedule-info">
                                        <span className="schedule-time">09:40 - 10:10</span>
                                        <span className="schedule-activity">Class 2</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
