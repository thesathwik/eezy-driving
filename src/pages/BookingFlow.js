import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FaCheck, FaInfoCircle, FaChevronDown, FaChevronUp, FaStar, FaCheckCircle, FaClock, FaArrowLeft, FaEnvelope, FaLock, FaCreditCard } from 'react-icons/fa';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripePaymentForm from '../components/payment/StripePaymentForm';
import { getHeaders } from '../config/api';
import './BookingFlow.css';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const BookingFlowContent = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availabilityData, setAvailabilityData] = useState([]);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState('10hours');
  const [customHoursExpanded, setCustomHoursExpanded] = useState(false);
  const [customHours, setCustomHours] = useState(10);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Step 3: Book your lessons state
  const [bookings, setBookings] = useState([{
    id: 1,
    bookingType: '1hour',
    selectedDate: '',
    selectedTime: '',
    pickupLocation: ''
  }]);

  // Step 4: Learner Registration state
  const [registrationFor, setRegistrationFor] = useState('myself');
  const [showLogin, setShowLogin] = useState(false); // Toggle between login and registration
  const [loginCredentials, setLoginCredentials] = useState({
    email: '',
    password: ''
  });
  const [learnerDetails, setLearnerDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dobDay: '',
    dobMonth: '',
    dobYear: '',
    pickupAddress: '',
    suburb: '',
    state: 'QLD',
    learnerType: '',
    password: '',
    confirmPassword: '',
    marketingConsent: true,
    termsAccepted: false
  });

  // Step 5: Payment state
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [savePaymentMethod, setSavePaymentMethod] = useState(true);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvc: ''
  });

  // Fetch instructor data
  useEffect(() => {
    const fetchInstructor = async () => {
      try {
        setLoading(true);
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
        const response = await fetch(`${API_URL}/instructors/${id}`, {
          headers: getHeaders(false)
        });

        const data = await response.json();

        if (data.success) {
          // Transform API data to match component expectations
          const transformedInstructor = {
            ...data.data,
            id: data.data._id,
            name: `${data.data.user?.firstName} ${data.data.user?.lastName}`.trim(),
            pricePerHour: data.data.pricing?.marketplaceLessonRate || 80,
            rating: data.data.stats?.averageRating || 0,
            reviewCount: data.data.stats?.totalReviews || 0,
            location: data.data.serviceArea?.suburbs?.[0] || 'Unknown',
            transmission: data.data.vehicle?.transmission || 'Auto',
            vehicle: `${data.data.vehicle?.year || ''} ${data.data.vehicle?.make || ''} ${data.data.vehicle?.model || ''}`.trim() || 'Vehicle',
            experience: data.data.profileInfo?.yearsExperience || 0,
            avatar: `${data.data.user?.firstName?.[0] || ''}${data.data.user?.lastName?.[0] || ''}`.toUpperCase() || 'IN'
          };
          setInstructor(transformedInstructor);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching instructor:', err);
        setLoading(false);
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
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 60); // Fetch 60 days of availability

        const startDateStr = today.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
        const response = await fetch(
          `${API_URL}/availability/instructor/${instructor.id}?startDate=${startDateStr}&endDate=${endDateStr}`
        );

        if (response.ok) {
          const data = await response.json();
          console.log('Availability data for booking:', data);
          setAvailabilityData(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching availability for booking:', err);
      }
    };

    fetchAvailability();
  }, [instructor]);

  const steps = [
    { number: 1, label: 'Instructor' },
    { number: 2, label: 'Amount' },
    { number: 3, label: 'Book your lessons' },
    { number: 4, label: 'Learner Registration' },
    { number: 5, label: 'Payment' }
  ];

  // Pricing calculations
  const hourlyRate = instructor?.pricePerHour || 80;

  const getPackageDetails = () => {
    if (selectedPackage === '10hours') {
      return {
        hours: 10,
        discount: 0.10,
        total: hourlyRate * 10,
        label: '10 hours'
      };
    } else if (selectedPackage === '6hours') {
      return {
        hours: 6,
        discount: 0.05,
        total: hourlyRate * 6,
        label: '6 hours'
      };
    } else {
      return {
        hours: customHours,
        discount: customHours >= 10 ? 0.10 : customHours >= 6 ? 0.05 : 0,
        total: hourlyRate * customHours,
        label: `${customHours} hours`
      };
    }
  };

  const packageDetails = getPackageDetails();
  const subtotal = packageDetails.total;
  const discount = subtotal * packageDetails.discount;
  const processingFee = (subtotal - discount) * 0.03; // 3% processing fee
  const totalDue = subtotal - discount + processingFee;

  // Validation state
  const [validationErrors, setValidationErrors] = useState({});

  // Validate current step before proceeding
  const validateStep = (step) => {
    const errors = {};

    switch (step) {
      case 1:
        // Step 1: Instructor confirmation - no validation needed
        break;

      case 2:
        // Step 2: Package selection - already has a selection by default
        if (!selectedPackage) {
          errors.package = 'Please select a package';
        }
        if (selectedPackage === 'custom' && customHours < 1) {
          errors.customHours = 'Please select at least 1 hour';
        }
        break;

      case 3:
        // Step 3: Book lessons - optional step (can skip)
        // No required validation as users can book from dashboard later
        break;

      case 4:
        // Step 4: Login or Registration
        if (showLogin) {
          // Login validation
          if (!loginCredentials.email?.trim()) {
            errors.email = 'Email is required';
          } else if (!/\S+@\S+\.\S+/.test(loginCredentials.email)) {
            errors.email = 'Please enter a valid email';
          }
          if (!loginCredentials.password?.trim()) {
            errors.password = 'Password is required';
          }
        } else {
          // Registration validation - all fields required
          if (!learnerDetails.firstName?.trim()) {
            errors.firstName = 'First name is required';
          }
          if (!learnerDetails.lastName?.trim()) {
            errors.lastName = 'Last name is required';
          }
          if (!learnerDetails.email?.trim()) {
            errors.email = 'Email is required';
          } else if (!/\S+@\S+\.\S+/.test(learnerDetails.email)) {
            errors.email = 'Please enter a valid email';
          }
          if (!learnerDetails.phone?.trim()) {
            errors.phone = 'Phone number is required';
          }
          if (!learnerDetails.pickupAddress?.trim()) {
            errors.pickupAddress = 'Pickup address is required';
          }
          if (!learnerDetails.suburb) {
            errors.suburb = 'Suburb is required';
          }
          if (!learnerDetails.dobDay || !learnerDetails.dobMonth || !learnerDetails.dobYear) {
            errors.dob = 'Date of birth is required';
          }
          if (!learnerDetails.learnerType) {
            errors.learnerType = 'Please select learner type';
          }
          if (!learnerDetails.password?.trim()) {
            errors.password = 'Password is required';
          } else if (learnerDetails.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
          }
          if (learnerDetails.password !== learnerDetails.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
          }
          if (!learnerDetails.termsAccepted) {
            errors.terms = 'You must accept the terms and conditions';
          }
        }
        break;

      case 5:
        // Step 5: Payment - validated by Stripe form
        break;

      default:
        break;
    }

    return errors;
  };

  const handleContinue = () => {
    // Validate current step
    const errors = validateStep(currentStep);

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Clear errors and proceed
    setValidationErrors({});
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setValidationErrors({}); // Clear errors when going back
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Step 3: Booking handlers
  const handleBookingChange = (bookingId, field, value) => {
    setBookings(bookings.map(booking =>
      booking.id === bookingId ? { ...booking, [field]: value } : booking
    ));
  };

  const handleAddBooking = () => {
    const newBooking = {
      id: bookings.length + 1,
      bookingType: '1hour',
      selectedDate: '',
      selectedTime: '',
      pickupLocation: ''
    };
    setBookings([...bookings, newBooking]);
  };

  const handleRemoveBooking = (bookingId) => {
    if (bookings.length > 1) {
      setBookings(bookings.filter(booking => booking.id !== bookingId));
    }
  };

  // Step 4: Learner details handler
  const handleLearnerDetailsChange = (field, value) => {
    setLearnerDetails({ ...learnerDetails, [field]: value });
  };

  // Step 5: Card details handler
  const handleCardDetailsChange = (field, value) => {
    setCardDetails({ ...cardDetails, [field]: value });
  };

  // Payment state
  const [clientSecret, setClientSecret] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Handle payment success
  const handlePaymentSuccess = async (paymentIntent) => {
    console.log('Payment succeeded:', paymentIntent);
    setPaymentSuccess(true);
    setPaymentError('');
    setPaymentProcessing(true);

    try {
      // Save booking to database
      const bookingData = {
        instructorId: id,
        learnerId: learnerDetails.email, // Will be replaced with actual learner ID after auth
        packageDetails: {
          hours: packageDetails.hours,
          totalAmount: totalDue,
          discount: discount,
          processingFee: processingFee
        },
        bookings: bookings.filter(b => b.selectedDate && b.selectedTime),
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount
        },
        learnerDetails: {
          firstName: learnerDetails.firstName,
          lastName: learnerDetails.lastName,
          email: learnerDetails.email,
          phone: learnerDetails.phone,
          dob: `${learnerDetails.dobYear}-${learnerDetails.dobMonth}-${learnerDetails.dobDay}`,
          pickupAddress: learnerDetails.pickupAddress,
          suburb: learnerDetails.suburb,
          state: learnerDetails.state,
          learnerType: learnerDetails.learnerType
        }
      };

      const response = await fetch(`${process.env.REACT_APP_API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Booking saved:', result);
        alert('Payment successful! Your booking has been confirmed.');
        navigate('/'); // Redirect to home or dashboard
      } else {
        console.error('Failed to save booking');
        alert('Payment successful but failed to save booking. Please contact support.');
      }
    } catch (error) {
      console.error('Error saving booking:', error);
      alert('Payment successful but failed to save booking. Please contact support.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Handle payment error
  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    setPaymentError(error.message || 'Payment failed. Please try again.');
    setPaymentSuccess(false);
    setPaymentProcessing(false);
  };

  // Format next available date
  const formatNextAvailable = (date) => {
    if (!date) return 'Not specified';
    const now = new Date();
    const availDate = new Date(date);
    const diffDays = Math.ceil((availDate - now) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    return availDate.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
  };

  // Generate available dates based on instructor availability from API
  const getAvailableDates = () => {
    if (!availabilityData || availabilityData.length === 0) return [];

    // Extract dates from availability data that have at least one available slot
    const dates = availabilityData
      .filter(avail => {
        // Check if there's at least one available time slot
        return avail.timeSlots && avail.timeSlots.some(slot => slot.available === true);
      })
      .map(avail => {
        // Convert date to YYYY-MM-DD format
        const date = new Date(avail.date);
        return date.toISOString().split('T')[0];
      })
      .sort(); // Sort dates chronologically

    return dates;
  };

  // Generate available time slots for a specific date based on instructor availability
  const getAvailableTimeSlotsForDate = (dateString) => {
    if (!availabilityData || availabilityData.length === 0 || !dateString) return [];

    // Find the availability record for the selected date
    const dateAvailability = availabilityData.find(avail => {
      const availDate = new Date(avail.date).toISOString().split('T')[0];
      return availDate === dateString;
    });

    if (!dateAvailability) return [];

    // Return only the time slots that are available
    return dateAvailability.timeSlots
      .filter(slot => slot.available === true)
      .map(slot => slot.time);
  };

  if (loading) {
    return (
      <div className="booking-flow">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading instructor details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="booking-flow">
        <div className="container">
          <h2>Instructor not found</h2>
        </div>
      </div>
    );
  }

  const availableDates = getAvailableDates();

  return (
    <div className="booking-flow">
      <div className="container">
        {/* Progress Steps */}
        <div className="booking-progress">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className={`progress-step ${currentStep >= step.number ? 'active' : ''} ${currentStep === step.number ? 'current' : ''}`}>
                <div className="step-circle">
                  {currentStep > step.number ? <FaCheck /> : step.number}
                </div>
                <div className="step-label">{step.label}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`progress-line ${currentStep > step.number ? 'active' : ''}`}></div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="booking-content">
          {/* Step 1: Instructor Confirmation - Streamlined */}
          {currentStep === 1 && (
            <div className="booking-step-simple">
              <div className="confirmation-container">
                {/* Instructor Card */}
                <div className="instructor-confirm-card">
                  {/* Header with avatar and basic info */}
                  <div className="instructor-header-compact">
                    <div className="avatar-compact">{instructor.avatar}</div>
                    <div className="instructor-info-compact">
                      <div className="name-badges">
                        <h2>{instructor.name}</h2>
                        {instructor.verified && (
                          <FaCheckCircle className="verified-icon-small" />
                        )}
                      </div>
                      <div className="rating-compact">
                        <FaStar className="star-small" />
                        <span className="rating-text">{instructor.rating}</span>
                        <span className="reviews-text">({instructor.reviewCount} reviews)</span>
                      </div>
                      <p className="location-text">{instructor.location}</p>
                    </div>
                  </div>

                  {/* Key Details Grid */}
                  <div className="details-grid-compact">
                    <div className="detail-item-compact">
                      <span className="detail-label-compact">Experience</span>
                      <span className="detail-value-compact">{instructor.experience} years</span>
                    </div>
                    <div className="detail-item-compact">
                      <span className="detail-label-compact">Vehicle</span>
                      <span className="detail-value-compact">{instructor.vehicle}</span>
                    </div>
                    <div className="detail-item-compact">
                      <span className="detail-label-compact">Transmission</span>
                      <span className="detail-value-compact">{instructor.transmission}</span>
                    </div>
                    {instructor.nextAvailableDate && (
                      <div className="detail-item-compact highlight-compact">
                        <span className="detail-label-compact">Available</span>
                        <span className="detail-value-compact">{formatNextAvailable(instructor.nextAvailableDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing Section */}
                  <div className="pricing-section-compact">
                    <div className="price-row-compact">
                      <span className="price-label-compact">Lesson Price</span>
                      <span className="price-value-compact">${instructor.pricePerHour}/hr</span>
                    </div>
                    <p className="savings-text-compact">Save up to 10% with package deals</p>
                  </div>

                  {/* Trust Badges */}
                  <div className="trust-row-compact">
                    <div className="trust-badge-compact">
                      <FaCheckCircle className="trust-check" />
                      <span>Verified</span>
                    </div>
                    <div className="trust-badge-compact">
                      <FaCheckCircle className="trust-check" />
                      <span>Licensed</span>
                    </div>
                    <div className="trust-badge-compact">
                      <FaCheckCircle className="trust-check" />
                      <span>Insured</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <button className="btn-continue-compact" onClick={handleContinue}>
                    Continue to Select Package
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Package Selection - Streamlined */}
          {currentStep === 2 && (
            <div className="booking-step-simple">
              <div className="package-selection-container">
                <div className="package-selection-card">
                  {/* Back Button at Top */}
                  <button className="btn-back-top" onClick={handleBack}>
                    <FaArrowLeft /> Back to Instructor
                  </button>

                  {/* Header */}
                  <div className="package-header-section">
                    <h1>Select Package</h1>
                    <p className="package-subtitle">Choose the number of hours that works best for you</p>
                  </div>

                  {/* Package Options */}
                  <div className="package-options-compact">
                    {/* 10 Hours */}
                    <div
                      className={`package-option-compact ${selectedPackage === '10hours' ? 'selected' : ''}`}
                      onClick={() => setSelectedPackage('10hours')}
                    >
                      <div className="package-option-header">
                        <div className="radio-check-compact">
                          {selectedPackage === '10hours' && <FaCheck />}
                        </div>
                        <div className="package-option-details">
                          <h3>10 Hours Package</h3>
                          <p>New learners • Best value</p>
                        </div>
                        <div className="package-pricing">
                          <span className="package-price">${(hourlyRate * 10 * 0.9).toFixed(0)}</span>
                          <span className="package-savings">Save 10%</span>
                        </div>
                      </div>
                    </div>

                    {/* 6 Hours */}
                    <div
                      className={`package-option-compact ${selectedPackage === '6hours' ? 'selected' : ''}`}
                      onClick={() => setSelectedPackage('6hours')}
                    >
                      <div className="package-option-header">
                        <div className="radio-check-compact">
                          {selectedPackage === '6hours' && <FaCheck />}
                        </div>
                        <div className="package-option-details">
                          <h3>6 Hours Package</h3>
                          <p>Overseas license • Refresher</p>
                        </div>
                        <div className="package-pricing">
                          <span className="package-price">${(hourlyRate * 6 * 0.95).toFixed(0)}</span>
                          <span className="package-savings">Save 5%</span>
                        </div>
                      </div>
                    </div>

                    {/* Custom Hours */}
                    <div
                      className={`package-option-compact custom-option ${selectedPackage === 'custom' ? 'selected' : ''}`}
                      onClick={() => setSelectedPackage('custom')}
                    >
                      <div className="package-option-header">
                        <div className="radio-check-compact">
                          {selectedPackage === 'custom' && <FaCheck />}
                        </div>
                        <div className="package-option-details">
                          <h3>Custom Hours</h3>
                          <p>Choose your own amount</p>
                        </div>
                      </div>
                      {selectedPackage === 'custom' && (
                        <div className="custom-hours-input-section">
                          <label htmlFor="hours-slider">Number of Hours: <strong>{customHours}</strong></label>
                          <input
                            id="hours-slider"
                            type="range"
                            min="1"
                            max="20"
                            value={customHours}
                            onChange={(e) => setCustomHours(parseInt(e.target.value))}
                            className="hours-slider"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="slider-labels">
                            <span>1hr</span>
                            <span>10hrs</span>
                            <span>20hrs</span>
                          </div>
                          {customHours >= 10 && (
                            <div className="custom-discount-info">
                              <FaCheckCircle /> You're saving 10% with {customHours} hours!
                            </div>
                          )}
                          {customHours >= 6 && customHours < 10 && (
                            <div className="custom-discount-info">
                              <FaCheckCircle /> You're saving 5% with {customHours} hours!
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div className="pricing-summary-compact">
                    <div className="summary-row">
                      <span className="summary-label-compact">{packageDetails.hours} hours × ${hourlyRate}/hr</span>
                      <span className="summary-value-compact">${subtotal.toFixed(2)}</span>
                    </div>
                    {packageDetails.discount > 0 && (
                      <div className="summary-row discount-row">
                        <span className="summary-label-compact">Discount ({(packageDetails.discount * 100).toFixed(0)}% off)</span>
                        <span className="summary-value-compact savings">-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="summary-row">
                      <span className="summary-label-compact">Processing Fee (3%)</span>
                      <span className="summary-value-compact">${processingFee.toFixed(2)}</span>
                    </div>
                    <div className="summary-row total-row">
                      <span className="summary-label-total">Total</span>
                      <span className="summary-value-total">${totalDue.toFixed(2)}</span>
                    </div>
                    <p className="payment-plan-compact">Or 4 payments of ${(totalDue / 4).toFixed(2)}</p>
                  </div>

                  {/* Recommendations */}
                  <div className="recommendations-compact">
                    <h4>Need help deciding?</h4>
                    <div className="recommendation-grid">
                      <div className="recommendation-item-compact">
                        <span className="rec-hours">10-15hrs</span>
                        <span className="rec-type">New Learners</span>
                      </div>
                      <div className="recommendation-item-compact">
                        <span className="rec-hours">3-6hrs</span>
                        <span className="rec-type">Overseas License</span>
                      </div>
                      <div className="recommendation-item-compact">
                        <span className="rec-hours">4-7hrs</span>
                        <span className="rec-type">Refresher</span>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <button className="btn-continue-compact" onClick={handleContinue}>
                    Continue to Book Lessons
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Book your lessons */}
          {currentStep === 3 && (
            <div className="booking-step booking-main-content">
              <div>
                {/* Back Button at Top */}
                <button className="btn-back-top" onClick={handleBack}>
                  <FaArrowLeft /> Back to Package
                </button>

                <h1>Book your lessons</h1>
                <p className="step-subtitle">Book now or later from your dashboard.</p>

                {bookings.map((booking, index) => (
                  <div key={booking.id} className="new-booking-section">
                    <div className="booking-section-header">
                      <h3>New Booking {bookings.length > 1 ? `#${index + 1}` : ''}</h3>
                      {bookings.length > 1 && (
                        <button
                          className="btn-remove-booking"
                          onClick={() => handleRemoveBooking(booking.id)}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Booking Type */}
                    <div className="form-group">
                      <label>Booking Type</label>
                      <div className="booking-type-tabs">
                        <button
                          className={`booking-type-tab ${booking.bookingType === '1hour' ? 'active' : ''}`}
                          onClick={() => handleBookingChange(booking.id, 'bookingType', '1hour')}
                        >
                          {booking.bookingType === '1hour' && <FaCheck />} 1-Hour Lesson
                        </button>
                        <button
                          className={`booking-type-tab ${booking.bookingType === '2hour' ? 'active' : ''}`}
                          onClick={() => handleBookingChange(booking.id, 'bookingType', '2hour')}
                        >
                          {booking.bookingType === '2hour' && <FaCheck />} 2-Hour Lesson
                        </button>
                        <button
                          className={`booking-type-tab ${booking.bookingType === 'test' ? 'active' : ''}`}
                          onClick={() => handleBookingChange(booking.id, 'bookingType', 'test')}
                        >
                          {booking.bookingType === 'test' && <FaCheck />} Driving Test Package
                        </button>
                      </div>
                    </div>

                    {/* Date and Time Selection */}
                    <div className="form-row">
                      <div className="form-group">
                        <label>Available Dates</label>
                        <div className="input-with-icon">
                          <FaChevronDown className="input-icon" />
                          <select
                            value={booking.selectedDate}
                            onChange={(e) => handleBookingChange(booking.id, 'selectedDate', e.target.value)}
                            className="date-select"
                          >
                            <option value="">Select a date</option>
                            {availableDates.map((date) => {
                              const dateObj = new Date(date);
                              const formattedDate = dateObj.toLocaleDateString('en-AU', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              });
                              return (
                                <option key={date} value={date}>
                                  {formattedDate}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Available Times</label>
                        <div className="input-with-icon">
                          <FaChevronDown className="input-icon" />
                          <select
                            value={booking.selectedTime}
                            onChange={(e) => handleBookingChange(booking.id, 'selectedTime', e.target.value)}
                            className="time-select"
                            disabled={!booking.selectedDate}
                          >
                            <option value="">Select a time</option>
                            {getAvailableTimeSlotsForDate(booking.selectedDate).map((time) => (
                              <option key={time} value={time}>
                                {time}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Pickup Location */}
                    <div className="form-group">
                      <label>Lesson Pick Up Location</label>
                      <div className="location-input-group">
                        <input
                          type="text"
                          value={booking.pickupLocation}
                          onChange={(e) => handleBookingChange(booking.id, 'pickupLocation', e.target.value)}
                          className="location-input"
                          placeholder="123 Placeholder Street, Sydney NSW 2000"
                        />
                        <button className="btn-edit-location">Edit</button>
                      </div>
                    </div>
                  </div>
                ))}

                <button className="btn-add-booking" onClick={handleAddBooking}>
                  <FaInfoCircle /> Add Another Booking
                </button>

                {/* Action Buttons */}
                <div className="booking-actions">
                  <button className="btn-skip-booking" onClick={handleContinue}>
                    Skip for now - Book from dashboard later
                  </button>
                </div>
              </div>

              {/* Order Summary Sidebar */}
              <div className="order-summary">
                <h2>Order Summary</h2>

                <div className="summary-item">
                  <span className="summary-label">
                    🎫 {packageDetails.hours} hrs Booking Credit
                  </span>
                  <span className="summary-value">${subtotal.toFixed(2)}</span>
                </div>

                {packageDetails.discount > 0 && (
                  <div className="summary-item discount">
                    <span className="summary-label">
                      Credit Discount <span className="discount-tag">{(packageDetails.discount * 100).toFixed(0)}% OFF</span>
                    </span>
                    <span className="summary-value green">-${discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="summary-item">
                  <span className="summary-label">
                    Platform Processing Fee <FaInfoCircle className="info-icon" />
                  </span>
                  <span className="summary-value">${processingFee.toFixed(2)}</span>
                </div>

                <div className="summary-total">
                  <span className="total-label">Total Payment Due</span>
                  <span className="total-value">${totalDue.toFixed(2)}</span>
                </div>

                <p className="payment-plan">Or 4 payments of ${(totalDue / 4).toFixed(2)}</p>

                <button className="btn-continue-summary" onClick={handleContinue}>
                  Continue ›
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="booking-step booking-main-content">
              <div>
                {/* Back Button at Top */}
                <button className="btn-back-top" onClick={handleBack}>
                  <FaArrowLeft /> Back to Book Lessons
                </button>

                <h1>{showLogin ? 'Login to Continue' : 'Learner Registration'}</h1>
                <p className="step-subtitle">
                  {showLogin ? 'Login to your account to continue with the booking.' : 'Create your account to continue with the booking.'}
                </p>

                {/* Validation Errors */}
                {Object.keys(validationErrors).length > 0 && (
                  <div className="validation-error-banner">
                    <strong>Please fix the following errors:</strong>
                    <ul>
                      {Object.values(validationErrors).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Toggle between Login and Registration */}
                <div className="existing-user-section">
                  {showLogin ? (
                    <p>Don't have an account? <button onClick={() => { setShowLogin(false); setValidationErrors({}); }} className="toggle-auth-link">Create account</button></p>
                  ) : (
                    <p>Already have an account? <button onClick={() => { setShowLogin(true); setValidationErrors({}); }} className="toggle-auth-link">Log in</button></p>
                  )}
                </div>

                {/* Login Form */}
                {showLogin && (
                  <div className="login-form">
                    <div className="form-section">
                      <div className="form-group">
                        <label className="form-label-required">Email address</label>
                        <div className="input-with-icon">
                          <FaEnvelope className="input-icon-left" />
                          <input
                            type="email"
                            className="form-input with-icon"
                            value={loginCredentials.email}
                            onChange={(e) => setLoginCredentials({ ...loginCredentials, email: e.target.value })}
                            placeholder="Enter your email address"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label-required">Password</label>
                        <div className="input-with-icon">
                          <FaLock className="input-icon-left" />
                          <input
                            type="password"
                            className="form-input with-icon"
                            value={loginCredentials.password}
                            onChange={(e) => setLoginCredentials({ ...loginCredentials, password: e.target.value })}
                            placeholder="Enter your password"
                          />
                        </div>
                      </div>

                      <div className="forgot-password-link">
                        <a href="/forgot-password">Forgot password?</a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Registration Form */}
                {!showLogin && (
                <div className="registration-form">
                  {/* Who are you registering for? */}
                  <div className="form-group">
                    <label className="form-label-required">Who are you registering for?</label>
                    <div className="radio-group">
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="registrationFor"
                          value="myself"
                          checked={registrationFor === 'myself'}
                          onChange={(e) => setRegistrationFor(e.target.value)}
                        />
                        <span className="radio-custom"></span>
                        <span className="radio-label">Myself</span>
                      </label>
                      <label className="radio-option">
                        <input
                          type="radio"
                          name="registrationFor"
                          value="someone-else"
                          checked={registrationFor === 'someone-else'}
                          onChange={(e) => setRegistrationFor(e.target.value)}
                        />
                        <span className="radio-custom"></span>
                        <span className="radio-label">Someone else</span>
                      </label>
                    </div>
                  </div>

                  {/* Pick up details */}
                  <div className="form-section">
                    <h3 className="section-heading">Pick up details</h3>

                    <div className="form-group">
                      <label className="form-label-required">Pick up address</label>
                      <input
                        type="text"
                        className="form-input"
                        value={learnerDetails.pickupAddress}
                        onChange={(e) => handleLearnerDetailsChange('pickupAddress', e.target.value)}
                        placeholder="Enter your pick up address"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label-required">Suburb</label>
                        <select
                          className="form-select"
                          value={learnerDetails.suburb}
                          onChange={(e) => handleLearnerDetailsChange('suburb', e.target.value)}
                        >
                          <option value="">Select suburb</option>
                          <option value="Sunnybank">Sunnybank</option>
                          <option value="Sunnybank Hills">Sunnybank Hills</option>
                          <option value="Eight Mile Plains">Eight Mile Plains</option>
                          <option value="Runcorn">Runcorn</option>
                          <option value="Macgregor">Macgregor</option>
                          <option value="Robertson">Robertson</option>
                          <option value="Kuraby">Kuraby</option>
                          <option value="Stretton">Stretton</option>
                          <option value="Calamvale">Calamvale</option>
                          <option value="Parkinson">Parkinson</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label-required">State</label>
                        <select
                          className="form-select"
                          value={learnerDetails.state}
                          onChange={(e) => handleLearnerDetailsChange('state', e.target.value)}
                        >
                          <option value="QLD">Queensland</option>
                          <option value="NSW">New South Wales</option>
                          <option value="VIC">Victoria</option>
                          <option value="SA">South Australia</option>
                          <option value="WA">Western Australia</option>
                          <option value="TAS">Tasmania</option>
                          <option value="ACT">Australian Capital Territory</option>
                          <option value="NT">Northern Territory</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Personal details */}
                  <div className="form-section">
                    <h3 className="section-heading">Personal details</h3>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label-required">First name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={learnerDetails.firstName}
                          onChange={(e) => handleLearnerDetailsChange('firstName', e.target.value)}
                          placeholder="Enter your first name"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label-required">Last name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={learnerDetails.lastName}
                          onChange={(e) => handleLearnerDetailsChange('lastName', e.target.value)}
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label-required">Email address</label>
                      <div className="input-with-icon">
                        <FaEnvelope className="input-icon-left" />
                        <input
                          type="email"
                          className="form-input with-icon"
                          value={learnerDetails.email}
                          onChange={(e) => handleLearnerDetailsChange('email', e.target.value)}
                          placeholder="Enter your email address"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label-required">Phone number</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={learnerDetails.phone}
                        onChange={(e) => handleLearnerDetailsChange('phone', e.target.value)}
                        placeholder="0400 000 000"
                      />
                    </div>
                  </div>

                  {/* Date of birth */}
                  <div className="form-section">
                    <div className="form-group">
                      <label className="form-label-required">Date of birth</label>
                      <div className="date-inputs">
                        <select
                          className="form-select date-select"
                          value={learnerDetails.dobDay}
                          onChange={(e) => handleLearnerDetailsChange('dobDay', e.target.value)}
                        >
                          <option value="">Day</option>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                        <select
                          className="form-select date-select"
                          value={learnerDetails.dobMonth}
                          onChange={(e) => handleLearnerDetailsChange('dobMonth', e.target.value)}
                        >
                          <option value="">Month</option>
                          <option value="1">January</option>
                          <option value="2">February</option>
                          <option value="3">March</option>
                          <option value="4">April</option>
                          <option value="5">May</option>
                          <option value="6">June</option>
                          <option value="7">July</option>
                          <option value="8">August</option>
                          <option value="9">September</option>
                          <option value="10">October</option>
                          <option value="11">November</option>
                          <option value="12">December</option>
                        </select>
                        <select
                          className="form-select date-select"
                          value={learnerDetails.dobYear}
                          onChange={(e) => handleLearnerDetailsChange('dobYear', e.target.value)}
                        >
                          <option value="">Year</option>
                          {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Which best describes you? */}
                  <div className="form-section">
                    <div className="form-group">
                      <label className="form-label-required">Which best describes you?</label>
                      <select
                        className="form-select"
                        value={learnerDetails.learnerType}
                        onChange={(e) => handleLearnerDetailsChange('learnerType', e.target.value)}
                      >
                        <option value="">Select an option</option>
                        <option value="new-learner">New Learner</option>
                        <option value="overseas-license">Overseas License Holder</option>
                        <option value="refresher">Refresher Course</option>
                        <option value="test-ready">Test Ready</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="form-section">
                    <h3 className="section-heading">Create your password</h3>

                    <div className="form-group">
                      <label className="form-label-required">Password</label>
                      <div className="input-with-icon">
                        <FaLock className="input-icon-left" />
                        <input
                          type="password"
                          className="form-input with-icon"
                          value={learnerDetails.password}
                          onChange={(e) => handleLearnerDetailsChange('password', e.target.value)}
                          placeholder="Enter your password"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label-required">Confirm password</label>
                      <div className="input-with-icon">
                        <FaLock className="input-icon-left" />
                        <input
                          type="password"
                          className="form-input with-icon"
                          value={learnerDetails.confirmPassword}
                          onChange={(e) => handleLearnerDetailsChange('confirmPassword', e.target.value)}
                          placeholder="Confirm your password"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Consent checkboxes */}
                  <div className="form-section">
                    <div className="checkbox-group">
                      <label className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={learnerDetails.marketingConsent}
                          onChange={(e) => handleLearnerDetailsChange('marketingConsent', e.target.checked)}
                          className="checkbox-input-yellow"
                        />
                        <span className="checkbox-custom-yellow"></span>
                        <span className="checkbox-label">
                          I would like to receive marketing communications including special offers and promotions
                        </span>
                      </label>

                      <label className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={learnerDetails.termsAccepted}
                          onChange={(e) => handleLearnerDetailsChange('termsAccepted', e.target.checked)}
                          className="checkbox-input"
                        />
                        <span className="checkbox-custom"></span>
                        <span className="checkbox-label">
                          I agree to the <a href="/terms" className="terms-link">Terms & Conditions</a> and <a href="/privacy" className="terms-link">Privacy Policy</a>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
                )}
              </div>

              {/* Order Summary Sidebar */}
              <div className="order-summary">
                <h2>Order Summary</h2>

                <div className="summary-item">
                  <span className="summary-label">
                    🎫 {packageDetails.hours} hrs Booking Credit
                  </span>
                  <span className="summary-value">${subtotal.toFixed(2)}</span>
                </div>

                {packageDetails.discount > 0 && (
                  <div className="summary-item discount">
                    <span className="summary-label">
                      Credit Discount <span className="discount-tag">{(packageDetails.discount * 100).toFixed(0)}% OFF</span>
                    </span>
                    <span className="summary-value green">-${discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="summary-item">
                  <span className="summary-label">
                    Platform Processing Fee <FaInfoCircle className="info-icon" />
                  </span>
                  <span className="summary-value">${processingFee.toFixed(2)}</span>
                </div>

                <div className="summary-total">
                  <span className="total-label">Total Payment Due</span>
                  <span className="total-value">${totalDue.toFixed(2)}</span>
                </div>

                <p className="payment-plan">Or 4 payments of ${(totalDue / 4).toFixed(2)}</p>

                <button className="btn-continue-summary" onClick={handleContinue}>
                  Continue to Payment ›
                </button>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="booking-step booking-main-content">
              <div>
                {/* Back Button at Top */}
                <button className="btn-back-top" onClick={handleBack}>
                  <FaArrowLeft /> Back to Registration
                </button>

                {/* Yellow Banner */}
                <div className="payment-banner">
                  <p>Complete your purchase to secure your bookings and prices.</p>
                </div>

                <h1>Payment</h1>
                <p className="step-subtitle">The final step to start your learning journey!</p>

                {/* Payment Methods */}
                <div className="payment-methods-section">
                  {/* Credit/Debit Card */}
                  <div className={`payment-method-card ${paymentMethod === 'card' ? 'active' : ''}`}>
                    <label className="payment-method-header">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="payment-radio"
                      />
                      <span className="payment-radio-custom"></span>
                      <div className="payment-method-title">
                        <FaCreditCard className="payment-icon" />
                        <span>Credit/Debit card</span>
                      </div>
                      <div className="card-brands">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="card-brand-logo" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="card-brand-logo" />
                      </div>
                    </label>

                    {paymentMethod === 'card' && (
                      <div className="card-form">
                        <StripePaymentForm
                          amount={totalDue}
                          onPaymentSuccess={handlePaymentSuccess}
                          onPaymentError={handlePaymentError}
                          learnerDetails={learnerDetails}
                        />
                      </div>
                    )}
                  </div>

                  {/* PayPal */}
                  <div className={`payment-method-card ${paymentMethod === 'paypal' ? 'active' : ''}`}>
                    <label className="payment-method-header">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="paypal"
                        checked={paymentMethod === 'paypal'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="payment-radio"
                      />
                      <span className="payment-radio-custom"></span>
                      <div className="payment-method-logo">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="paypal-logo" />
                      </div>
                    </label>
                  </div>

                  {/* Afterpay */}
                  <div className={`payment-method-card ${paymentMethod === 'afterpay' ? 'active' : ''}`}>
                    <label className="payment-method-header">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="afterpay"
                        checked={paymentMethod === 'afterpay'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="payment-radio"
                      />
                      <span className="payment-radio-custom"></span>
                      <div className="payment-method-logo">
                        <svg viewBox="0 0 120 30" className="afterpay-logo">
                          <rect width="120" height="30" rx="4" fill="#B2FCE4"/>
                          <text x="60" y="20" textAnchor="middle" fill="#000" fontSize="14" fontWeight="600">afterpay</text>
                        </svg>
                      </div>
                    </label>
                  </div>

                  {/* Klarna */}
                  <div className={`payment-method-card ${paymentMethod === 'klarna' ? 'active' : ''}`}>
                    <label className="payment-method-header">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="klarna"
                        checked={paymentMethod === 'klarna'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="payment-radio"
                      />
                      <span className="payment-radio-custom"></span>
                      <div className="payment-method-logo">
                        <svg viewBox="0 0 120 30" className="klarna-logo">
                          <rect width="120" height="30" rx="4" fill="#FFB3C7"/>
                          <text x="60" y="20" textAnchor="middle" fill="#000" fontSize="16" fontWeight="700">Klarna</text>
                        </svg>
                      </div>
                    </label>
                  </div>

                  {/* Google Pay */}
                  <div className={`payment-method-card ${paymentMethod === 'googlepay' ? 'active' : ''}`}>
                    <label className="payment-method-header">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="googlepay"
                        checked={paymentMethod === 'googlepay'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="payment-radio"
                      />
                      <span className="payment-radio-custom"></span>
                      <div className="payment-method-logo">
                        <svg viewBox="0 0 120 30" className="gpay-logo">
                          <rect width="120" height="30" rx="4" fill="#fff" stroke="#e0e0e0"/>
                          <text x="20" y="20" fill="#5F6368" fontSize="14" fontWeight="500">G Pay</text>
                        </svg>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Billing Details */}
                <div className="billing-details-section">
                  <button className="billing-details-toggle">
                    <span>Billing Details</span>
                    <FaChevronUp />
                  </button>
                </div>
              </div>

              {/* Order Summary Sidebar */}
              <div className="order-summary payment-summary">
                <h2>Order Summary</h2>

                <div className="summary-item">
                  <span className="summary-label">
                    🎫 {packageDetails.hours} hrs Booking Credit
                  </span>
                  <span className="summary-value">${subtotal.toFixed(2)}</span>
                </div>

                {bookings.filter(b => b.selectedDate && b.selectedTime).length > 0 && (
                  <div className="summary-booking-info">
                    <p className="booking-info-text">{bookings.filter(b => b.selectedDate && b.selectedTime).length} hr booked</p>
                  </div>
                )}

                {packageDetails.discount > 0 && (
                  <div className="summary-item discount">
                    <span className="summary-label">
                      Credit Discount <span className="discount-tag">{(packageDetails.discount * 100).toFixed(0)}% OFF</span>
                    </span>
                    <span className="summary-value green">-${discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="summary-item">
                  <span className="summary-label">
                    Platform Processing Fee <FaInfoCircle className="info-icon" />
                  </span>
                  <span className="summary-value">${processingFee.toFixed(2)}</span>
                </div>

                <div className="summary-total">
                  <span className="total-label">Total Payment Due</span>
                  <span className="total-value">${totalDue.toFixed(2)}</span>
                </div>

                <p className="payment-plan">Or 4 payments of ${(totalDue / 4).toFixed(2)}</p>

                {paymentMethod === 'card' && (
                  <p className="payment-instruction">Complete the card details above to process your payment.</p>
                )}

                {paymentMethod !== 'card' && (
                  <button className="btn-pay-now" disabled>
                    Pay ${totalDue.toFixed(2)} - Coming Soon
                  </button>
                )}

                {/* Buy Now Pay Later Section */}
                <div className="bnpl-section">
                  <div className="bnpl-header">
                    <h3>Buy Now Pay Later</h3>
                    <FaInfoCircle className="info-icon-small" />
                  </div>
                  <p className="bnpl-description">4 payments of ${(totalDue / 4).toFixed(2)}</p>
                  <div className="bnpl-logos">
                    <svg viewBox="0 0 80 24" className="bnpl-logo-small">
                      <rect width="80" height="24" rx="3" fill="#5469d4"/>
                      <text x="40" y="16" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600">Pay in 4</text>
                    </svg>
                    <svg viewBox="0 0 80 24" className="bnpl-logo-small">
                      <rect width="80" height="24" rx="3" fill="#B2FCE4"/>
                      <text x="40" y="16" textAnchor="middle" fill="#000" fontSize="9" fontWeight="600">afterpay</text>
                    </svg>
                    <svg viewBox="0 0 80 24" className="bnpl-logo-small">
                      <rect width="80" height="24" rx="3" fill="#FFB3C7"/>
                      <text x="40" y="16" textAnchor="middle" fill="#000" fontSize="10" fontWeight="700">Klarna</text>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Wrap with Stripe Elements provider
const BookingFlow = () => {
  return (
    <Elements stripe={stripePromise}>
      <BookingFlowContent />
    </Elements>
  );
};

export default BookingFlow;
