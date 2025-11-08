import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import DashboardStats from '../../components/dashboard/DashboardStats';
import BookingsSection from '../../components/dashboard/BookingsSection';
import './Dashboard.css';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');

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
            <div className="user-profile-dropdown">
              <img
                src="/api/placeholder/40/40"
                alt={user?.firstName || 'User'}
                className="user-avatar"
              />
              <span className="user-name">{user?.firstName || 'Sreenivas'}</span>
              <span className="dropdown-arrow">▼</span>
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
