import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import DashboardStats from '../../components/dashboard/DashboardStats';
import BookingsSection from '../../components/dashboard/BookingsSection';
import './Dashboard.css';

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef(null);

  // Mock data - will be replaced with actual data from backend
  const stats = {
    earnings: 184.50,
    nextPayout: '10 Nov',
    cancellationRate: 0.0,
    bookingHoursPerLearner: 3.08,
    learnerRating: 5.0,
    totalReviews: 45
  };

  const bookings = [
    {
      id: 8512077,
      status: 'confirmed',
      date: 'Sun, 02 Nov 2025',
      time: '10:00 am - 12:00 pm',
      duration: 2,
      transmission: 'Auto',
      location: '37 Angelica Ave, Algester 4300 QLD',
      learner: {
        name: 'Honey J.',
        phone: '0478048564',
        avatar: 'HJ'
      }
    },
    {
      id: 8514804,
      status: 'confirmed',
      date: 'Sun, 02 Nov 2025',
      time: '12:30 pm - 1:30 pm',
      duration: 1,
      transmission: 'Auto',
      location: '2 Bardelate Drive, Brookwater 4300 QLD',
      learner: {
        name: 'Henry K.',
        phone: '0499238807',
        avatar: 'HK'
      },
      guardian: {
        name: 'Catherine K.',
        phone: '0499238807',
        avatar: 'CK'
      }
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard-page">
      <DashboardSidebar />

      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <div className="dashboard-header-actions">
            <button className="notifications-btn">
              <span className="notification-icon">🔔</span>
              <span>Notifications</span>
            </button>
            <div className="user-profile-dropdown" ref={dropdownRef}>
              <button
                className="user-profile-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-avatar-circle">
                  {user?.firstName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="user-info">
                  <span className="user-name">{user?.firstName || 'User'}</span>
                  <span className="user-role">INSTRUCTOR</span>
                </div>
              </button>
              {showUserMenu && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <div className="user-avatar-large">
                      {user?.firstName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="user-dropdown-info">
                      <div className="user-dropdown-name">User</div>
                      <div className="user-dropdown-role">INSTRUCTOR</div>
                    </div>
                  </div>
                  <div className="user-dropdown-email">{user?.email || 'instructor@gmail.com'}</div>
                  <div className="user-dropdown-divider"></div>
                  <div className="user-dropdown-links">
                    <button onClick={() => { navigate('/instructor/dashboard'); setShowUserMenu(false); }}>
                      Dashboard
                    </button>
                    <button onClick={() => { navigate('/instructor/profile'); setShowUserMenu(false); }}>
                      Profile
                    </button>
                    <button onClick={() => { navigate('/instructor/settings'); setShowUserMenu(false); }}>
                      Settings
                    </button>
                  </div>
                  <div className="user-dropdown-divider"></div>
                  <button className="user-dropdown-logout" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bookings Header */}
        <div className="bookings-header">
          <h2>Bookings</h2>
          <div className="bookings-actions">
            <button className="btn-secondary">
              <span className="btn-icon">👤</span>
              Invite Learner
            </button>
            <button className="btn-primary">
              <span className="btn-icon">🚗</span>
              Propose Booking
            </button>
          </div>
        </div>

        {/* Pricing Alert Banner */}
        <div className="dashboard-alerts">
          <div className="alert-banner alert-pricing">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <strong>Is your price aligned with the market?</strong>
              <p>Instructors with market aligned pricing get better visibility and attract more learners. Consider <a href="/pricing">Review your rate.</a></p>
            </div>
            <button className="alert-close">×</button>
          </div>
        </div>

        {/* Stats Cards */}
        <DashboardStats stats={stats} />

        {/* Bookings Section */}
        <BookingsSection
          bookings={bookings}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  );
};

export default InstructorDashboard;
