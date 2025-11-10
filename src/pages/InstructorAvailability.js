import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import { getHeaders } from '../config/api';
import './InstructorAvailability.css';

const InstructorAvailability = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [instructor, setInstructor] = useState(null);
  const [instructorLoading, setInstructorLoading] = useState(true);

  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [availabilityData, setAvailabilityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Generate time slots from 5am to 9pm
  const timeSlots = [
    '5am', '6am', '7am', '8am', '9am', '10am', '11am',
    '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm'
  ];

  // Convert time slot to API format (e.g., "8am" -> "8:00 AM")
  const convertToApiFormat = (time) => {
    const hour = parseInt(time);
    const period = time.includes('pm') ? 'PM' : 'AM';
    const displayHour = hour === 12 ? 12 : (period === 'PM' && hour !== 12) ? hour : hour;
    return `${displayHour}:00 ${period}`;
  };

  // Fetch instructor data
  useEffect(() => {
    const fetchInstructor = async () => {
      try {
        setInstructorLoading(true);
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
        const response = await fetch(`${API_URL}/instructors/${id}`, {
          headers: getHeaders(false)
        });

        const data = await response.json();

        if (data.success) {
          const transformedInstructor = {
            ...data.data,
            id: data.data._id,
            name: `${data.data.user?.firstName} ${data.data.user?.lastName}`.trim(),
            pricePerHour: data.data.pricing?.marketplaceLessonRate || 80
          };
          setInstructor(transformedInstructor);
        }

        setInstructorLoading(false);
      } catch (err) {
        console.error('Error fetching instructor:', err);
        setInstructorLoading(false);
      }
    };

    if (id) {
      fetchInstructor();
    }
  }, [id]);

  // Fetch availability data
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!instructor) return;

      try {
        setLoading(true);
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const startDateStr = currentWeekStart.toISOString().split('T')[0];
        const endDateStr = weekEnd.toISOString().split('T')[0];

        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/availability/instructor/${instructor.id}?startDate=${startDateStr}&endDate=${endDateStr}`
        );

        if (response.ok) {
          const data = await response.json();
          setAvailabilityData(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching availability:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [instructor, currentWeekStart]);

  // Get week days starting from current week start
  const getWeekDays = () => {
    const days = [];
    const start = new Date(currentWeekStart);

    // Adjust to Monday
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Format date for display
  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
  };

  // Format week range
  const formatWeekRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.getDate()} - ${end.getDate()} ${start.toLocaleString('default', { month: 'short' })} ${start.getFullYear()}`;
  };

  // Check if a time slot is available for a specific date
  const isSlotAvailable = (date, time) => {
    const dateStr = date.toISOString().split('T')[0];
    const availability = availabilityData.find(
      (avail) => new Date(avail.date).toISOString().split('T')[0] === dateStr
    );

    if (!availability) return false;

    const apiTime = convertToApiFormat(time);
    const slot = availability.timeSlots.find(s => s.time === apiTime);
    return slot ? slot.available : false;
  };

  // Navigate weeks
  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    setCurrentWeekStart(new Date());
  };

  // Handle slot click
  const handleSlotClick = (date, time) => {
    if (isSlotAvailable(date, time)) {
      setSelectedSlot({ date, time });
    }
  };

  // Handle booking
  const handleBooking = () => {
    if (selectedSlot) {
      navigate(`/book/${instructor.id}`, {
        state: {
          date: selectedSlot.date,
          time: convertToApiFormat(selectedSlot.time)
        }
      });
    }
  };

  if (!instructor) {
    return (
      <div className="availability-modal">
        <div className="availability-content">
          <h2>Instructor not found</h2>
          <Link to="/instructors" className="btn-back">Back to Instructors</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="availability-modal">
      <div className="availability-content">
        {/* Header */}
        <div className="availability-modal-header">
          <h2>
            To begin the booking process please select "Book with {instructor.name}".
          </h2>
          <button className="btn-close" onClick={() => navigate('/instructors')}>
            <FaTimes />
          </button>
        </div>

        {/* Legend */}
        <div className="availability-legend">
          <div className="legend-item">
            <span className="legend-circle available"></span>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <span className="legend-circle unavailable"></span>
            <span>Closed / booked out</span>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="week-navigation">
          <button className="btn-nav" onClick={goToPreviousWeek}>
            <FaChevronLeft />
          </button>
          <button className="btn-today" onClick={goToToday}>
            Today
          </button>
          <span className="week-range">{formatWeekRange()}</span>
          <button className="btn-nav" onClick={goToNextWeek}>
            <FaChevronRight />
          </button>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="calendar-loading">
            <p>Loading availability...</p>
          </div>
        ) : (
          <div className="calendar-grid">
            <table className="calendar-table">
              <thead>
                <tr>
                  <th className="time-column"></th>
                  {weekDays.map((day, index) => (
                    <th key={index} className="day-column">
                      {formatDate(day)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time, timeIndex) => (
                  <tr key={timeIndex}>
                    <td className="time-cell">{time}</td>
                    {weekDays.map((day, dayIndex) => {
                      const available = isSlotAvailable(day, time);
                      const isSelected = selectedSlot &&
                        selectedSlot.date.toDateString() === day.toDateString() &&
                        selectedSlot.time === time;

                      return (
                        <td
                          key={dayIndex}
                          className={`slot-cell ${available ? 'available' : 'unavailable'} ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSlotClick(day, time)}
                        >
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Notes */}
        <div className="calendar-footer">
          <p>• Driving lesson duration = 1 hour or 2 hours</p>
          <p>• Driving test package duration = 2.5 hours</p>
        </div>

        {/* Book Button */}
        <button
          className="btn-book-instructor"
          onClick={handleBooking}
          disabled={!selectedSlot}
        >
          Book with {instructor.name} <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default InstructorAvailability;
