import React from 'react';
import './BookingsSection.css';

const BookingCard = ({ booking }) => {
  return (
    <div className="booking-card">
      <div className="booking-card-header">
        <div className="booking-title">
          <span className="booking-number">Booking #{booking.id}</span>
          <span className={`booking-status status-${booking.status}`}>
            {booking.status.toUpperCase()}
          </span>
        </div>
        <button className="booking-action-btn">See more / Manage</button>
      </div>

      <div className="booking-details-grid">
        <div className="booking-section">
          <h4 className="section-title">Booking Details</h4>
          <div className="detail-item">
            <span className="detail-icon">□</span>
            <span className="detail-text">{booking.date}</span>
          </div>
          <div className="detail-item">
            <span className="detail-icon">⌚</span>
            <span className="detail-text">{booking.time}</span>
          </div>
          <div className="detail-item">
            <span className="detail-icon">⊙</span>
            <span className="detail-text">
              <a href={`https://maps.google.com/?q=${booking.location}`} target="_blank" rel="noopener noreferrer">
                {booking.location}
              </a>
            </span>
          </div>
        </div>

        <div className="booking-section">
          <h4 className="section-title">Lesson Details</h4>
          <div className="detail-item">
            <span className="detail-icon">▣</span>
            <span className="detail-text">
              {booking.duration} Hour Driving Lesson ({booking.transmission})
            </span>
          </div>
        </div>

        <div className="booking-section">
          <h4 className="section-title">Learner Details</h4>
          <div className="learner-info">
            <div className="learner-avatar">{booking.learner.avatar}</div>
            <div className="learner-details">
              <div className="learner-name">{booking.learner.name}</div>
              <a href={`tel:${booking.learner.phone}`} className="learner-phone">
                {booking.learner.phone}
              </a>
            </div>
          </div>
        </div>

        {booking.guardian && (
          <div className="booking-section">
            <h4 className="section-title">Guardian details</h4>
            <div className="learner-info">
              <div className="learner-avatar">{booking.guardian.avatar}</div>
              <div className="learner-details">
                <div className="learner-name">{booking.guardian.name}</div>
                <a href={`tel:${booking.guardian.phone}`} className="learner-phone">
                  {booking.guardian.phone}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const BookingsSection = ({ bookings, activeTab, setActiveTab }) => {
  const bookingHistory = 130; // Mock count

  return (
    <div className="bookings-section">
      <div className="bookings-tabs">
        <button
          className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending proposals
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Booking history
          <span className="tab-badge">{bookingHistory}</span>
        </button>
      </div>

      <div className="bookings-list">
        {activeTab === 'upcoming' && bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}

        {activeTab === 'pending' && (
          <div className="empty-state">
            <p>No pending proposals</p>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="empty-state">
            <p>Viewing booking history ({bookingHistory} total bookings)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsSection;
