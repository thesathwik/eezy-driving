import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import { API, getHeaders } from '../../config/api';
import './Dashboard.css';

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [pendingProposals, setPendingProposals] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  // Get instructor ID from user
  // For now, use the user's _id as the instructor ID
  // Later we'll need to fetch the instructor profile properly
  const instructorId = user?._id;

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
    console.log('User:', user);
    console.log('Instructor ID:', instructorId);

    if (instructorId) {
      fetchBookings();
    } else {
      console.error('No instructor ID found');
      setError('Unable to load dashboard. Please try logging in again.');
      setLoading(false);
    }
  }, [instructorId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      // First check if instructor profile exists
      const profileCheck = await fetch(`${API.instructors.list}/profile/me`, {
        headers: getHeaders(true)
      });
      const profileData = await profileCheck.json();

      // If no instructor profile, redirect to complete profile
      if (!profileData.success) {
        navigate('/instructor/complete-profile');
        return;
      }

      // Fetch all three types of bookings in parallel
      const [upcomingRes, pendingRes, historyRes] = await Promise.all([
        fetch(`${API.bookings}/instructor/${instructorId}/upcoming`, {
          headers: getHeaders(true)
        }),
        fetch(`${API.bookings}/instructor/${instructorId}/pending`, {
          headers: getHeaders(true)
        }),
        fetch(`${API.bookings}/instructor/${instructorId}/history?limit=10`, {
          headers: getHeaders(true)
        })
      ]);

      const upcomingData = await upcomingRes.json();
      const pendingData = await pendingRes.json();
      const historyData = await historyRes.json();

      // Set data even if success is false (just empty arrays)
      setBookings(upcomingData.success ? (upcomingData.data || []) : []);
      setPendingProposals(pendingData.success ? (pendingData.data || []) : []);
      setHistory(historyData.success ? (historyData.data || []) : []);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again.');
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      const response = await fetch(`${API.bookings}/${bookingId}/confirm`, {
        method: 'PUT',
        headers: getHeaders(true)
      });

      const data = await response.json();

      if (data.success) {
        // Refresh bookings
        fetchBookings();
      } else {
        alert(data.message || 'Failed to confirm booking');
      }
    } catch (err) {
      console.error('Error confirming booking:', err);
      alert('Failed to confirm booking. Please try again.');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    const reason = prompt('Please provide a reason for rejection (optional):');

    try {
      const response = await fetch(`${API.bookings}/${bookingId}/reject`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh bookings
        fetchBookings();
      } else {
        alert(data.message || 'Failed to reject booking');
      }
    } catch (err) {
      console.error('Error rejecting booking:', err);
      alert('Failed to reject booking. Please try again.');
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

  const formatTime = (time) => {
    return time;
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

  const renderBookingCard = (booking, showActions = false) => {
    const learner = booking.learner || {};

    return (
      <div key={booking._id} className="booking-card">
        <div className="booking-header">
          <div className="booking-learner">
            <div className="learner-avatar">
              {learner.firstName?.charAt(0)}{learner.lastName?.charAt(0)}
            </div>
            <div className="learner-info">
              <div className="learner-name">
                {learner.firstName} {learner.lastName?.charAt(0)}.
              </div>
              <div className="learner-phone">{learner.phone}</div>
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
              {formatTime(booking.lesson.startTime)} - {formatTime(booking.lesson.endTime)}
            </span>
          </div>
          <div className="booking-duration">
            <span className="detail-label">Duration:</span>
            <span>{booking.lesson.duration}h lesson</span>
          </div>
        </div>

        {booking.lesson.pickupLocation && (
          <div className="booking-location">
            <span className="detail-label">Location:</span>
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

        {showActions && booking.status === 'pending' && (
          <div className="booking-actions">
            <button
              className="btn-confirm"
              onClick={() => handleConfirmBooking(booking._id)}
            >
              Confirm
            </button>
            <button
              className="btn-reject"
              onClick={() => handleRejectBooking(booking._id)}
            >
              Decline
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-page">
      <DashboardSidebar />

      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <div className="dashboard-header-actions">
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

        {/* Tab Navigation */}
        <div className="dashboard-tabs">
          <button
            className={`dashboard-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming Bookings
            {bookings.length > 0 && (
              <span className="tab-count">{bookings.length}</span>
            )}
          </button>
          <button
            className={`dashboard-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Proposals
            {pendingProposals.length > 0 && (
              <span className="tab-count">{pendingProposals.length}</span>
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
              <p>Loading bookings...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button className="btn-retry" onClick={fetchBookings}>
                Try Again
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'upcoming' && (
                <div className="bookings-grid">
                  {bookings.length === 0 ? (
                    <div className="empty-state">
                      <h3>No upcoming bookings</h3>
                      <p>Your confirmed bookings will appear here</p>
                    </div>
                  ) : (
                    bookings.map(booking => renderBookingCard(booking))
                  )}
                </div>
              )}

              {activeTab === 'pending' && (
                <div className="bookings-grid">
                  {pendingProposals.length === 0 ? (
                    <div className="empty-state">
                      <h3>No pending proposals</h3>
                      <p>New booking requests will appear here</p>
                    </div>
                  ) : (
                    pendingProposals.map(booking => renderBookingCard(booking, true))
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="bookings-grid">
                  {history.length === 0 ? (
                    <div className="empty-state">
                      <h3>No booking history</h3>
                      <p>Completed and cancelled bookings will appear here</p>
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
    </div>
  );
};

export default InstructorDashboard;
