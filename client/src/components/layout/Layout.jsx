import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ProfilePanel from './ProfilePanel';
import './Layout.css';

const Layout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const openProfile = () => {
        setIsProfileOpen(true);
    };

    const closeProfile = () => {
        setIsProfileOpen(false);
    };

    return (
        <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={toggleSidebar}
                onProfileClick={openProfile}
            />
            <div className="main-content">
                <Header onProfileClick={openProfile} />
                <main className="page-content">
                    <Outlet />
                </main>
            </div>
            <ProfilePanel isOpen={isProfileOpen} onClose={closeProfile} />
        </div>
    );
};

export default Layout;
