import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import { API, getHeaders } from '../../config/api';
import './Learners.css';

const InstructorLearners = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const instructorId = user?._id || user?.id;

  // Wait for auth to load
  if (authLoading) {
    return (
      <div className="dashboard-page">
        <DashboardSidebar />
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
    if (instructorId) {
      fetchLearners();
    }
  }, [instructorId]);

  const fetchLearners = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API.bookings}/instructor/${instructorId}/learners`, {
        headers: getHeaders(true)
      });

      const data = await response.json();

      if (data.success) {
        setLearners(data.data || []);
      } else {
        setError(data.message || 'Failed to load learners');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching learners:', err);
      setError('Failed to load learners. Please try again.');
      setLoading(false);
    }
  };

  const handleProposeBooking = (learnerId) => {
    // Navigate to booking proposal page
    navigate(`/instructor/propose-booking/${learnerId}`);
  };

  const handleViewDetails = (learnerId) => {
    // Navigate to learner details page
    navigate(`/instructor/learners/${learnerId}`);
  };

  const filteredLearners = learners.filter(learner => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${learner.firstName} ${learner.lastName}`.toLowerCase();
    const phone = learner.phone || '';
    return fullName.includes(searchLower) || phone.includes(searchLower);
  });

  const sortedLearners = [...filteredLearners].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      case 'hours':
        return (b.completedHours || 0) - (a.completedHours || 0);
      case 'upcoming':
        return (b.upcomingBookings || 0) - (a.upcomingBookings || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="dashboard-page">
      <DashboardSidebar />

      <div className="dashboard-main">
        <div className="learners-header">
          <h1>Learners</h1>
          <div className="learners-stats">
            <div className="stat-item">
              <span className="stat-value">{learners.length}</span>
              <span className="stat-label">Total Learners</span>
            </div>
          </div>
        </div>

        <div className="learners-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search learners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="sort-controls">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
              <option value="name">Name</option>
              <option value="hours">Hours Completed</option>
              <option value="upcoming">Upcoming Bookings</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading learners...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button className="btn-retry" onClick={fetchLearners}>
              Try Again
            </button>
          </div>
        ) : sortedLearners.length === 0 ? (
          <div className="empty-state">
            <h3>No learners found</h3>
            <p>{searchTerm ? 'Try adjusting your search' : 'Your learners will appear here once you have bookings'}</p>
          </div>
        ) : (
          <div className="learners-table-container">
            <table className="learners-table">
              <thead>
                <tr>
                  <th>Learner Details</th>
                  <th>Guardian Details</th>
                  <th>Booking Hours Completed</th>
                  <th>Upcoming Bookings</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedLearners.map(learner => (
                  <tr key={learner._id || learner.id}>
                    <td>
                      <div className="learner-cell">
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
                    </td>
                    <td>
                      {learner.guardian ? (
                        <div className="guardian-info">
                          <div className="guardian-name">{learner.guardian.name}</div>
                          <div className="guardian-phone">{learner.guardian.phone}</div>
                        </div>
                      ) : (
                        <span className="no-data">-</span>
                      )}
                    </td>
                    <td>
                      <div className="hours-completed">
                        {learner.completedHours || 0}
                      </div>
                    </td>
                    <td>
                      <div className="upcoming-count">
                        {learner.upcomingBookings || 0}
                      </div>
                    </td>
                    <td>
                      <div className="learner-actions">
                        <button
                          className="btn-learner-details"
                          onClick={() => handleViewDetails(learner._id || learner.id)}
                        >
                          Learner Details
                        </button>
                        <button
                          className="btn-propose-booking"
                          onClick={() => handleProposeBooking(learner._id || learner.id)}
                        >
                          Propose Booking
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorLearners;
