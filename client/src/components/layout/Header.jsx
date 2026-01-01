import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiBell, FiSearch } from 'react-icons/fi';
import './Header.css';

const Header = ({ onProfileClick }) => {
    const { user } = useAuth();
    const location = useLocation();

    const getPageTitle = () => {
        const paths = {
            '/': 'Dashboard',
            '/students': 'Student Management',
            '/students/new': 'New Student Registration',
            '/staff': 'Staff Management',
            '/staff/new': 'New Staff Registration',
            '/grades': 'Grades & Classes',
            '/schedule': 'Class Schedule',
            '/attendance': 'Attendance Tracking',
            '/finance': 'Finance Management',
            '/users': 'User Management'
        };

        // Check for dynamic routes
        if (location.pathname.startsWith('/students/') && location.pathname !== '/students/new') {
            return 'Student Details';
        }
        if (location.pathname.startsWith('/staff/') && location.pathname !== '/staff/new') {
            return 'Staff Details';
        }

        return paths[location.pathname] || 'Dashboard';
    };

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <header className="main-header">
            <div className="header-left">
                <div className="page-info">
                    <h1 className="page-title">{getPageTitle()}</h1>
                    <span className="page-date">{today}</span>
                </div>
            </div>

            <div className="header-right">
                <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="search-input"
                    />
                </div>

                <button className="notification-btn">
                    <FiBell />
                    <span className="notification-dot"></span>
                </button>

                <div className="header-user" onClick={onProfileClick}>
                    <div className="header-avatar">
                        {user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div className="header-user-info">
                        <span className="header-user-name">{user?.fullName}</span>
                        <span className="header-user-role">
                            {user?.role?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
