import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            toast.error('Please enter both username and password');
            return;
        }

        setLoading(true);
        try {
            await login(username, password);
            toast.success('Welcome back!');
            navigate('/');
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed. Please try again.';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                {/* <div className="login-branding">
                    <div className="login-logo-container">
                        <img
                            src="/logo.jpg"
                            alt="Suzana Education Center"
                            className="login-logo"
                        />
                    </div>
                    <h1 className="login-title">Suzana Education Center</h1>
                    <p className="login-subtitle">School Management System</p>
                    <div className="login-motto">
                        <span>Discipline</span>
                        <span className="dot">•</span>
                        <span>Integrity</span>
                        <span className="dot">•</span>
                        <span>Teamwork</span>
                    </div>
                </div> */}

                <div className="login-card">
                     <div className="logo-container">
                        <img
                            src="/logo.jpg"
                            alt="Suzana Education Center"
                            className="card-logo"
                        />
                    </div>
                    <div className="login-card-header">
                        <h2>Welcome Back</h2>
                        <p>Sign in to access your dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label className="form-label">Username or Email</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg login-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>Mapera Center, Suna East, Migori County</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
