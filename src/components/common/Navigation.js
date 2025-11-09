import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isLearner, isInstructor } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <nav className={`navigation ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="nav-wrapper">
          <Link to="/" className="nav-logo">
            <span className="logo-text">EAZYDRIVING</span>
          </Link>

          <div className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
            <Link to="/instructors" className="nav-link">Find Instructors</Link>
            <Link to="/how-it-works" className="nav-link">How It Works</Link>
            <Link to="/pricing" className="nav-link">Pricing</Link>
            <Link to="/resources" className="nav-link">Resources</Link>
            <Link to="/about" className="nav-link">About</Link>
          </div>

          <div className="nav-actions">
            {isAuthenticated ? (
              <div className="user-menu-wrapper">
                <button
                  className="user-menu-button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="user-avatar">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="user-name">{user?.name || 'User'}</span>
                  <span className="user-role">
                    {isLearner ? 'Learner' : 'Instructor'}
                  </span>
                </button>
                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <div className="dropdown-name">{user?.name}</div>
                      <div className="dropdown-email">{user?.email}</div>
                    </div>
                    <div className="user-dropdown-links">
                      <Link
                        to={isInstructor ? "/instructor/dashboard" : "/learner/dashboard"}
                        onClick={() => setShowUserMenu(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to={isInstructor ? "/instructor/profile" : "/learner/profile"}
                        onClick={() => setShowUserMenu(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to={isInstructor ? "/instructor/settings" : "/learner/settings"}
                        onClick={() => setShowUserMenu(false)}
                      >
                        Settings
                      </Link>
                    </div>
                    <button onClick={handleLogout} className="logout-button">
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login/learner" className="nav-link login-link">
                  Learner Login
                </Link>
                <Link to="/login/instructor" className="nav-link login-link">
                  Instructor Login
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
