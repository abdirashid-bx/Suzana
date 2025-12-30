import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FiHome,
    FiUsers,
    FiUserCheck,
    FiBookOpen,
    FiCalendar,
    FiClipboard,
    FiDollarSign,
    FiSettings,
    FiLogOut,
    FiChevronLeft,
    FiChevronRight
} from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = ({ collapsed, onToggle }) => {
    const { user, logout, canManageStudents, canManageStaff, canManageUsers, canManageFees } = useAuth();
    const location = useLocation();

    const menuItems = [
        {
            path: '/',
            icon: FiHome,
            label: 'Dashboard',
            show: true
        },
        {
            path: '/students',
            icon: FiUsers,
            label: 'Students',
            show: canManageStudents() || user?.role === 'teacher'
        },
        {
            path: '/staff',
            icon: FiUserCheck,
            label: 'Staff',
            show: canManageStaff()
        },
        {
            path: '/grades',
            icon: FiBookOpen,
            label: 'Grades & Classes',
            show: true
        },
        {
            path: '/schedule',
            icon: FiCalendar,
            label: 'Schedule',
            show: true
        },
        {
            path: '/attendance',
            icon: FiClipboard,
            label: 'Attendance',
            show: true
        },
        {
            path: '/finance',
            icon: FiDollarSign,
            label: 'Finance',
            show: canManageFees()
        },
        {
            path: '/users',
            icon: FiSettings,
            label: 'User Management',
            show: canManageUsers()
        }
    ];

    const filteredItems = menuItems.filter(item => item.show);

    const getRoleBadge = () => {
        const roleLabels = {
            super_admin: 'Super Admin',
            admin: 'Admin',
            head_teacher: 'Head Teacher',
            teacher: 'Teacher'
        };
        return roleLabels[user?.role] || 'User';
    };

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="logo-container">
                    <img
                        src="/logo.jpg"
                        alt="Suzana Education Center"
                        className="sidebar-logo"
                    />
                    {!collapsed && (
                        <div className="logo-text">
                            <h1>Suzana</h1>
                            <span>Education Center</span>
                        </div>
                    )}
                </div>
                <button className="toggle-btn" onClick={onToggle}>
                    {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
                </button>
            </div>

            <nav className="sidebar-nav">
                <ul className="nav-list">
                    {filteredItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `nav-link ${isActive ? 'active' : ''}`
                                }
                                title={collapsed ? item.label : ''}
                            >
                                <item.icon className="nav-icon" />
                                {!collapsed && <span className="nav-label">{item.label}</span>}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer">
                {!collapsed && (
                    <div className="user-info">
                        <div className="user-avatar">
                            {user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user?.fullName}</span>
                            <span className="user-role">{getRoleBadge()}</span>
                        </div>
                    </div>
                )}
                <button className="logout-btn" onClick={logout} title="Logout">
                    <FiLogOut />
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
