import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LearnerSidebar from '../../components/dashboard/LearnerSidebar';
import QuickBookModal from '../../components/dashboard/QuickBookModal';
import { API, getHeaders } from '../../config/api';
import '../instructor/Dashboard.css';

const LearnerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const dropdownRef = useRef(null);

  const userId = user?._id || user?.id;

  if (authLoading) {
    return (
      <div className="dashboard-page">
        <LearnerSidebar />
        <div className="dashboard-main">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchData();
    } else {
      setError('Unable to load dashboard. Please try logging in again.');
      setLoading(false);
    }
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [profileRes, upcomingRes, historyRes] = await Promise.all([
        fetch(`${API.learners.list}/profile/me`, {
          headers: getHeaders(true)
        }),
        fetch(`${API.bookings}/learner/${userId}/upcoming`, {
          headers: getHeaders(true)
        }),
        fetch(`${API.bookings}/learner/${userId}/history?limit=20`, {
          headers: getHeaders(true)
        })
      ]);

      const profileData = await profileRes.json();
      const upcomingData = await upcomingRes.json();
      const historyData = await historyRes.json();

      if (profileData.success) {
        setProfile(profileData.data);
      }
      setUpcoming(upcomingData.success ? (upcomingData.data || []) : []);
      setHistory(historyData.success ? (historyData.data || []) : []);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching learner data:', err);
      setError('Failed to load dashboard. Please try again.');
      setLoading(false);
    }
  };

  const handleCancelBooking = async (booking) => {
    // Calculate hours until lesson
    const lessonDate = new Date(booking.lesson.date);
    const timeMatch = booking.lesson.startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const period = timeMatch[3].toUpperCase();
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      lessonDate.setUTCHours(hours, minutes, 0, 0);
    }

    const now = new Date();
    const hoursUntilLesson = (lessonDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const willRestoreCredits = hoursUntilLesson >= 24;

    const creditMessage = willRestoreCredits
      ? `Your ${booking.lesson.duration} lesson credit(s) will be restored to your account.`
      : `Your credits will NOT be restored (less than 24 hours before the lesson).`;

    if (!window.confirm(`Are you sure you want to cancel this booking?\n\n${creditMessage}`)) return;

    try {
      const response = await fetch(`${API.bookings}/${booking._id}/status`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify({ status: 'cancelled', reason: 'Cancelled by learner' })
      });

      const data = await response.json();

      if (data.success) {
        const successMessage = data.data?.cancellation?.creditsRestored
          ? 'Booking cancelled. Your credits have been restored.'
          : 'Booking cancelled. Credits were not restored (less than 24 hours before lesson).';
        alert(successMessage);
        fetchData();
      } else {
        alert(data.message || 'Failed to cancel booking');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: '#4CAF50',
      pending: '#FFC107',
      completed: '#2196F3',
      cancelled: '#F44336',
      'no-show': '#9E9E9E'
    };
    return colors[status] || '#666';
  };

  const renderBookingCard = (booking, canCancel = false) => {
    const instructorUser = booking.instructor?.user || booking.instructor || {};

    return (
      <div key={booking._id} className="booking-card">
        <div className="booking-header">
          <div className="booking-learner">
            <div className="learner-avatar">
              {instructorUser.firstName?.charAt(0)}{instructorUser.lastName?.charAt(0)}
            </div>
            <div className="learner-info">
              <div className="learner-name">
                {instructorUser.firstName} {instructorUser.lastName}
              </div>
              <div className="learner-phone">{instructorUser.phone}</div>
            </div>
          </div>
          <div
            className="booking-status"
            style={{ backgroundColor: getStatusColor(booking.status) }}
          >
            {booking.status}
          </div>
        </div>

        <div className="booking-details">
          <div className="booking-time">
            <span className="detail-label">Date:</span>
            <span>{formatDate(booking.lesson.date)}</span>
          </div>
          <div className="booking-time">
            <span className="detail-label">Time:</span>
            <span>
              {booking.lesson.startTime} - {booking.lesson.endTime}
            </span>
          </div>
          <div className="booking-duration">
            <span className="detail-label">Duration:</span>
            <span>{booking.lesson.duration}h lesson</span>
          </div>
        </div>

        {booking.lesson.pickupLocation && (
          <div className="booking-location">
            <span className="detail-label">Pickup:</span>
            <span className="location-text">
              {booking.lesson.pickupLocation.address}
            </span>
          </div>
        )}

        {booking.lesson.notes && (
          <div className="booking-notes">
            <span className="detail-label">Notes:</span>
            <span>{booking.lesson.notes}</span>
          </div>
        )}

        {canCancel && (booking.status === 'confirmed' || booking.status === 'pending') && (
          <div className="booking-actions">
            <button
              className="btn-reject"
              onClick={() => handleCancelBooking(booking)}
            >
              Cancel Booking
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-page">
      <LearnerSidebar />

      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>My Dashboard</h1>
          <div className="dashboard-header-actions">
            <div className="user-profile-dropdown" ref={dropdownRef}>
              <button
                className="user-profile-button"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-avatar-circle">
                  {user?.firstName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="user-info">
                  <span className="user-name">{user?.firstName || user?.name || 'User'}</span>
                  <span className="user-role">LEARNER</span>
                </div>
              </button>
              {showUserMenu && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <div className="user-avatar-large">
                      {user?.firstName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="user-dropdown-info">
                      <div className="user-dropdown-name">{user?.firstName || user?.name || 'User'}</div>
                      <div className="user-dropdown-role">LEARNER</div>
                    </div>
                  </div>
                  <div className="user-dropdown-email">{user?.email}</div>
                  <div className="user-dropdown-divider"></div>
                  <div className="user-dropdown-links">
                    <button onClick={() => { navigate('/learner/dashboard'); setShowUserMenu(false); }}>
                      Dashboard
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

        {/* Credit Balance Card */}
        {profile && (
          <div className="booking-card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #FFC107' }}>
            <div className="booking-details" style={{ margin: 0 }}>
              <div className="booking-time">
                <span className="detail-label">Lesson Credits:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{profile.lessonCredits}</span>
              </div>
              <div className="booking-time">
                <span className="detail-label">Lessons Completed:</span>
                <span>{profile.totalLessonsCompleted}</span>
              </div>
              <div className="booking-time">
                <span className="detail-label">Hours Completed:</span>
                <span>{profile.totalHoursCompleted}h</span>
              </div>
            </div>
            {profile.currentInstructor && (
              <div className="booking-location" style={{ marginTop: '1rem', marginBottom: 0 }}>
                <span className="detail-label">Instructor:</span>
                <span className="location-text">
                  {profile.currentInstructor.user?.firstName} {profile.currentInstructor.user?.lastName}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Book New Lesson Button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            className="btn-confirm"
            style={{ padding: '0.75rem 2rem' }}
            onClick={() => setShowBookModal(true)}
          >
            Book a New Lesson
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="dashboard-tabs">
          <button
            className={`dashboard-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Classes
            {upcoming.length > 0 && (
              <span className="tab-count">{upcoming.length}</span>
            )}
          </button>
          <button
            className={`dashboard-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>

        {/* Content */}
        <div className="dashboard-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading your classes...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button className="btn-retry" onClick={fetchData}>
                Try Again
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'upcoming' && (
                <div className="bookings-grid">
                  {upcoming.length === 0 ? (
                    <div className="empty-state">
                      <h3>No upcoming classes</h3>
                      <p>Book a lesson to get started!</p>
                    </div>
                  ) : (
                    upcoming.map(booking => renderBookingCard(booking, true))
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="bookings-grid">
                  {history.length === 0 ? (
                    <div className="empty-state">
                      <h3>No lesson history</h3>
                      <p>Your completed and cancelled lessons will appear here</p>
                    </div>
                  ) : (
                    history.map(booking => renderBookingCard(booking))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showBookModal && (
        <QuickBookModal
          profile={profile}
          userId={userId}
          onClose={() => setShowBookModal(false)}
          onSuccess={() => {
            setShowBookModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default LearnerDashboard;
