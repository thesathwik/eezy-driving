import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useAuth } from '../../context/AuthContext';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import { API, getHeaders } from '../../config/api';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css';

const localizer = momentLocalizer(moment);

const InstructorCalendar = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState('week');
  const [date, setDate] = useState(new Date());

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
      fetchBookings();
      // Set up auto-refresh every 30 seconds for real-time updates
      const interval = setInterval(fetchBookings, 30000);
      return () => clearInterval(interval);
    }
  }, [instructorId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API.bookings}/instructor/${instructorId}/upcoming`, {
        headers: getHeaders(true)
      });

      const data = await response.json();

      if (data.success) {
        // Transform bookings into calendar events
        const calendarEvents = (data.data || []).map(booking => {
          const lessonDate = new Date(booking.lesson.date);
          const [startHour, startMinute] = booking.lesson.startTime.split(':');
          const [endHour, endMinute] = booking.lesson.endTime.split(':');

          const startTime = new Date(lessonDate);
          startTime.setHours(parseInt(startHour), parseInt(startMinute), 0);

          const endTime = new Date(lessonDate);
          endTime.setHours(parseInt(endHour), parseInt(endMinute), 0);

          return {
            id: booking._id,
            title: `${booking.learner?.firstName} ${booking.learner?.lastName?.charAt(0)}.`,
            start: startTime,
            end: endTime,
            resource: {
              learner: booking.learner,
              location: booking.lesson.pickupLocation,
              duration: booking.lesson.duration,
              notes: booking.lesson.notes,
              status: booking.status
            }
          };
        });

        setEvents(calendarEvents);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load calendar. Please try again.');
      setLoading(false);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };

  const handleNavigate = (newDate) => {
    setDate(newDate);
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const eventStyleGetter = (event) => {
    const statusColors = {
      pending: '#FFC107',
      confirmed: '#4CAF50',
      completed: '#2196F3',
      cancelled: '#F44336'
    };

    const backgroundColor = statusColors[event.resource.status] || '#FFC107';

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: '#000',
        border: 'none',
        display: 'block',
        fontWeight: '600',
        fontSize: '0.875rem'
      }
    };
  };

  return (
    <div className="dashboard-page">
      <DashboardSidebar />

      <div className="dashboard-main">
        <div className="calendar-header">
          <h1>Calendar</h1>
          <div className="calendar-actions">
            <button
              className={`view-btn ${view === 'day' ? 'active' : ''}`}
              onClick={() => handleViewChange('day')}
            >
              Day
            </button>
            <button
              className={`view-btn ${view === 'week' ? 'active' : ''}`}
              onClick={() => handleViewChange('week')}
            >
              Week
            </button>
            <button
              className={`view-btn ${view === 'month' ? 'active' : ''}`}
              onClick={() => handleViewChange('month')}
            >
              Month
            </button>
          </div>
        </div>

        {loading && events.length === 0 ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading calendar...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button className="btn-retry" onClick={fetchBookings}>
              Try Again
            </button>
          </div>
        ) : (
          <div className="calendar-container">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 'calc(100vh - 200px)' }}
              onSelectEvent={handleSelectEvent}
              onNavigate={handleNavigate}
              onView={handleViewChange}
              view={view}
              date={date}
              eventPropGetter={eventStyleGetter}
              views={['month', 'week', 'day']}
              step={30}
              showMultiDayTimes
              defaultView="week"
              toolbar={true}
            />
          </div>
        )}

        {selectedEvent && (
          <div className="event-modal-overlay" onClick={handleCloseModal}>
            <div className="event-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Lesson Details</h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  ×
                </button>
              </div>

              <div className="modal-content">
                <div className="modal-section">
                  <h3>Learner</h3>
                  <div className="learner-details">
                    <div className="learner-avatar-large">
                      {selectedEvent.resource.learner?.firstName?.charAt(0)}
                      {selectedEvent.resource.learner?.lastName?.charAt(0)}
                    </div>
                    <div className="learner-info-modal">
                      <div className="learner-name-modal">
                        {selectedEvent.resource.learner?.firstName}{' '}
                        {selectedEvent.resource.learner?.lastName}
                      </div>
                      <div className="learner-phone-modal">
                        {selectedEvent.resource.learner?.phone}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-section">
                  <h3>Time</h3>
                  <div className="time-info">
                    <div className="time-row">
                      <span className="time-label">Date:</span>
                      <span className="time-value">
                        {moment(selectedEvent.start).format('dddd, MMMM D, YYYY')}
                      </span>
                    </div>
                    <div className="time-row">
                      <span className="time-label">Time:</span>
                      <span className="time-value">
                        {moment(selectedEvent.start).format('h:mm A')} -{' '}
                        {moment(selectedEvent.end).format('h:mm A')}
                      </span>
                    </div>
                    <div className="time-row">
                      <span className="time-label">Duration:</span>
                      <span className="time-value">
                        {selectedEvent.resource.duration}h lesson
                      </span>
                    </div>
                  </div>
                </div>

                {selectedEvent.resource.location && (
                  <div className="modal-section">
                    <h3>Pickup Location</h3>
                    <div className="location-info">
                      {selectedEvent.resource.location.address}
                    </div>
                  </div>
                )}

                {selectedEvent.resource.notes && (
                  <div className="modal-section">
                    <h3>Notes</h3>
                    <div className="notes-info">
                      {selectedEvent.resource.notes}
                    </div>
                  </div>
                )}

                <div className="modal-section">
                  <h3>Status</h3>
                  <div className={`status-badge status-${selectedEvent.resource.status}`}>
                    {selectedEvent.resource.status}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorCalendar;
