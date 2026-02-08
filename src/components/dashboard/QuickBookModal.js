import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API, getHeaders } from '../../config/api';
import LocationAutocomplete from '../LocationAutocomplete';
import './QuickBookModal.css';

const parseTimeToMinutes = (timeStr) => {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const calcEndTime = (startTime, durationHours) => {
  const match = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return '00:00';
  let h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  const totalMin = h * 60 + m + durationHours * 60;
  const endH = Math.floor(totalMin / 60) % 24;
  const endM = totalMin % 60;
  const endPeriod = endH >= 12 ? 'PM' : 'AM';
  const displayH = endH % 12 || 12;
  return `${displayH}:${String(endM).padStart(2, '0')} ${endPeriod}`;
};

const QuickBookModal = ({ profile, userId, onClose, onSuccess }) => {
  const [duration, setDuration] = useState(1);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [pickupSuburb, setPickupSuburb] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');

  const [instructor, setInstructor] = useState(null);
  const [availabilityData, setAvailabilityData] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const credits = profile?.lessonCredits || 0;
  const currentInstructor = profile?.currentInstructor;
  const [resolvedInstructorId, setResolvedInstructorId] = useState(null);

  // Resolve instructor: use currentInstructor, or fall back to instructor from upcoming bookings
  useEffect(() => {
    if (currentInstructor) {
      setResolvedInstructorId(currentInstructor._id || currentInstructor);
      return;
    }

    // Fallback: look up instructor from learner's upcoming bookings
    const resolveFromBookings = async () => {
      try {
        const res = await fetch(`${API.bookings}/learner/${userId}/upcoming`, {
          headers: getHeaders(true)
        });
        const data = await res.json();
        if (data.success && data.data?.length > 0) {
          const booking = data.data[0];
          const instrId = booking.instructor?._id || booking.instructor;
          if (instrId) {
            setResolvedInstructorId(instrId);
            return;
          }
        }
      } catch (err) {
        console.error('Error resolving instructor from bookings:', err);
      }
      setLoadingData(false); // No instructor found anywhere
    };

    resolveFromBookings();
  }, [currentInstructor, userId]);

  // Fetch instructor details + availability + existing bookings
  useEffect(() => {
    if (!resolvedInstructorId) return;

    const fetchData = async () => {
      try {
        setLoadingData(true);
        const instructorId = resolvedInstructorId;

        // Fetch instructor details
        const instrRes = await fetch(API.instructors.byId(instructorId), {
          headers: getHeaders(false)
        });
        const instrData = await instrRes.json();

        if (!instrData.success) {
          setError('Failed to load instructor details.');
          setLoadingData(false);
          return;
        }

        const instr = instrData.data;
        const targetUserId = instr.user?._id || instr.user;

        setInstructor({
          id: instr._id,
          userId: targetUserId,
          name: `${instr.user?.firstName || ''} ${instr.user?.lastName || ''}`.trim(),
          suburbs: instr.serviceArea?.suburbs || [],
          pricePerHour: instr.pricing?.marketplaceLessonRate || 80,
        });

        // Fetch availability (60 days)
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 60);
        const startStr = today.toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' });
        const endStr = endDate.toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' });

        const [availRes, bookingsRes] = await Promise.all([
          fetch(`${API.availability.byInstructor(targetUserId)}?startDate=${startStr}&endDate=${endStr}`),
          fetch(`${API.bookings}/instructor/${instr._id}`, { headers: getHeaders(true) })
        ]);

        if (availRes.ok) {
          const availData = await availRes.json();
          setAvailabilityData(availData.data || []);
        }

        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          setExistingBookings(bookingsData.data || []);
        }

        setLoadingData(false);
      } catch (err) {
        console.error('QuickBookModal fetch error:', err);
        setError('Failed to load booking data. Please try again.');
        setLoadingData(false);
      }
    };

    fetchData();
  }, [resolvedInstructorId]);

  // Reset time when date or duration changes
  useEffect(() => {
    setSelectedTime('');
  }, [selectedDate, duration]);

  const getAvailableDates = () => {
    if (!availabilityData || availabilityData.length === 0) return [];
    return availabilityData
      .filter(avail => avail.timeSlots && avail.timeSlots.some(slot => slot.available === true))
      .map(avail => {
        const date = new Date(avail.date);
        return date.toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' });
      })
      .sort();
  };

  const getAvailableTimeSlotsForDate = (dateString) => {
    if (!availabilityData || !dateString) return [];

    const durationMinutes = duration * 60;

    const dateAvailability = availabilityData.find(avail => {
      const availDate = new Date(avail.date).toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' });
      return availDate === dateString;
    });

    if (!dateAvailability) return [];

    const allSlots = dateAvailability.timeSlots
      .filter(slot => slot.available === true)
      .map(slot => ({ time: slot.time, minutes: parseTimeToMinutes(slot.time) }))
      .sort((a, b) => a.minutes - b.minutes);

    // Filter slots with enough consecutive availability
    const validSlots = [];
    for (let i = 0; i < allSlots.length; i++) {
      const startSlot = allSlots[i];
      const endTimeNeeded = startSlot.minutes + durationMinutes;
      let hasEnoughTime = true;
      let currentTime = startSlot.minutes;
      while (currentTime < endTimeNeeded) {
        if (!allSlots.some(s => s.minutes === currentTime)) {
          hasEnoughTime = false;
          break;
        }
        currentTime += 60;
      }
      if (hasEnoughTime) validSlots.push(startSlot.time);
    }

    // Filter out conflicts with existing bookings
    const bookedOnDate = existingBookings.filter(b => {
      if (!b.lesson?.date) return false;
      const bookingDate = new Date(b.lesson.date).toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' });
      return bookingDate === dateString && (b.status === 'confirmed' || b.status === 'pending');
    });

    if (bookedOnDate.length === 0) return validSlots;

    return validSlots.filter(slotTime => {
      const slotStart = parseTimeToMinutes(slotTime);
      const slotEnd = slotStart + durationMinutes;
      for (const booked of bookedOnDate) {
        const bookedStart = parseTimeToMinutes(booked.lesson.startTime);
        const bookedEnd = bookedStart + (booked.lesson.duration || 1) * 60;
        if (slotStart < bookedEnd && slotEnd > bookedStart) return false;
      }
      return true;
    });
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime || !pickupSuburb || !pickupAddress) {
      setError('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    const endTime = calcEndTime(selectedTime, duration);

    const bookingData = {
      learner: profile._id,
      instructor: instructor.id,
      bookingType: 'lesson',
      lesson: {
        date: selectedDate,
        startTime: selectedTime,
        endTime,
        duration,
        pickupLocation: {
          address: pickupAddress,
          suburb: pickupSuburb,
          postcode: '',
          coordinates: { lat: 0, lng: 0 }
        },
        dropoffLocation: {
          address: pickupAddress,
          suburb: pickupSuburb,
          postcode: '',
          coordinates: { lat: 0, lng: 0 }
        },
        notes: ''
      },
      pricing: {
        baseRate: duration * instructor.pricePerHour,
        platformFee: 0,
        gst: 0,
        totalAmount: duration * instructor.pricePerHour,
        instructorPayout: duration * instructor.pricePerHour
      },
      payment: {
        status: 'paid',
        method: 'credits'
      },
      status: 'confirmed'
    };

    try {
      const response = await fetch(API.bookings, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(bookingData)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError(data.message || 'Failed to book lesson. Please try again.');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const availableDates = getAvailableDates();
  const availableTimes = selectedDate ? getAvailableTimeSlotsForDate(selectedDate) : [];
  const canConfirm = selectedDate && selectedTime && pickupSuburb && pickupAddress && !submitting;

  // --- Render ---

  const renderContent = () => {
    // Success state
    if (success) {
      return (
        <div className="qbm-success">
          <div className="qbm-success-icon">&#10003;</div>
          <h3>Lesson Booked!</h3>
          <p>Your dashboard will refresh shortly.</p>
        </div>
      );
    }

    // Guard: no credits
    if (credits <= 0) {
      return (
        <div className="qbm-guard">
          <p>You have no lesson credits remaining.</p>
          <Link to="/instructors">Buy More Credits</Link>
        </div>
      );
    }

    // Guard: no instructor
    if (!resolvedInstructorId && !loadingData) {
      return (
        <div className="qbm-guard">
          <p>You don't have an assigned instructor yet.</p>
          <Link to="/instructors">Find an Instructor</Link>
        </div>
      );
    }

    // Loading
    if (loadingData) {
      return (
        <div className="qbm-guard">
          <p>Loading available times...</p>
        </div>
      );
    }

    // Booking form
    return (
      <>
        {error && <div className="qbm-error">{error}</div>}

        {/* Duration */}
        <div className="qbm-form-group">
          <label>Duration</label>
          <div className="qbm-duration-tabs">
            <button
              className={`qbm-duration-tab ${duration === 1 ? 'active' : ''}`}
              onClick={() => setDuration(1)}
            >
              1-Hour Lesson
            </button>
            <button
              className={`qbm-duration-tab ${duration === 2 ? 'active' : ''}`}
              onClick={() => setDuration(2)}
            >
              2-Hour Lesson
            </button>
          </div>
        </div>

        {/* Date */}
        <div className="qbm-form-group">
          <label>Date</label>
          <select
            className="qbm-select"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          >
            <option value="">Select a date</option>
            {availableDates.map(date => {
              const [y, m, d] = date.split('-').map(Number);
              const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
              const formatted = dateObj.toLocaleDateString('en-AU', {
                timeZone: 'Australia/Brisbane',
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              });
              return <option key={date} value={date}>{formatted}</option>;
            })}
          </select>
        </div>

        {/* Time */}
        <div className="qbm-form-group">
          <label>Time</label>
          <select
            className="qbm-select"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            disabled={!selectedDate}
          >
            <option value="">Select a time</option>
            {availableTimes.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>

        {/* Pickup Suburb */}
        <div className="qbm-form-group">
          <label>Pickup Suburb</label>
          <select
            className="qbm-select"
            value={pickupSuburb}
            onChange={(e) => { setPickupSuburb(e.target.value); setPickupAddress(''); }}
          >
            <option value="">Select a suburb</option>
            {(instructor?.suburbs || []).map(suburb => (
              <option key={suburb} value={suburb}>{suburb}</option>
            ))}
          </select>
        </div>

        {/* Street Address */}
        <div className="qbm-form-group">
          <label>Street Address</label>
          <LocationAutocomplete
            suburb={pickupSuburb}
            value={pickupAddress}
            onChange={(address) => setPickupAddress(address)}
            placeholder={pickupSuburb ? `Start typing address in ${pickupSuburb}...` : 'Select a suburb first'}
            className="qbm-address-input"
          />
          {pickupSuburb && (
            <p className="qbm-hint">Start typing and select from suggestions.</p>
          )}
        </div>

        {/* Confirm */}
        <button
          className="qbm-confirm-btn"
          onClick={handleConfirm}
          disabled={!canConfirm}
        >
          {submitting ? 'Booking...' : `Confirm Booking (${duration}hr)`}
        </button>
      </>
    );
  };

  return (
    <div className="qbm-overlay" onClick={onClose}>
      <div className="qbm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qbm-header">
          <div>
            <h2>Book a Lesson</h2>
            {credits > 0 && !success && (
              <span className="qbm-credits-badge">{credits} credit{credits !== 1 ? 's' : ''} remaining</span>
            )}
          </div>
          <button className="qbm-close" onClick={onClose}>&times;</button>
        </div>
        <div className="qbm-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default QuickBookModal;
