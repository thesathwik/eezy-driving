import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FaCheck, FaInfoCircle, FaChevronDown, FaChevronUp, FaStar, FaCheckCircle, FaClock, FaArrowLeft, FaEnvelope, FaLock, FaCreditCard, FaSpinner } from 'react-icons/fa';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { LoadScript } from '@react-google-maps/api';
import StripePaymentForm from '../components/payment/StripePaymentForm';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { getHeaders } from '../config/api';
import { getCurrentUser, resendVerificationEmail } from '../utils/authService';
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
  const [existingBookings, setExistingBookings] = useState([]);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState('10hours');
  const [customHoursExpanded, setCustomHoursExpanded] = useState(false);
  const [customHours, setCustomHours] = useState(10);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Email verification state
  const [waitingForVerification, setWaitingForVerification] = useState(false);
  const [isUserVerified, setIsUserVerified] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const verificationCheckInterval = useRef(null);

  const [userHadPhone, setUserHadPhone] = useState(false);

  // Step 3: Book your lessons state
  const [bookings, setBookings] = useState([{
    id: 1,
    bookingType: '1hour',
    selectedDate: '',
    selectedTime: '',
    pickupSuburb: '',
    pickupAddress: ''
  }]);

  // Step 4: Learner Registration state
  const [registrationFor, setRegistrationFor] = useState('myself');
  const [showLogin, setShowLogin] = useState(false); // Toggle between login and registration
  const [loginCredentials, setLoginCredentials] = useState({
    email: '',
    password: ''
  });
  const [learnerDetails, setLearnerDetails] = useState({
    _id: '', // Store learner ID after registration
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
            // userId is needed for availability lookup (availability is stored by user ID, not instructor ID)
            userId: data.data.user?._id || data.data.user,
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

        // Use Brisbane timezone for date strings to ensure consistency
        const startDateStr = today.toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' });
        const endDateStr = endDate.toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' });

        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
        const targetId = instructor.userId || instructor.id;
        const fetchUrl = `${API_URL}/availability/instructor/${targetId}?startDate=${startDateStr}&endDate=${endDateStr}`;

        console.log('🔍 Fetching availability from:', fetchUrl);
        console.log('👤 Instructor object:', instructor);
        console.log('🆔 Target ID used:', targetId);

        const response = await fetch(fetchUrl);

        if (response.ok) {
          const data = await response.json();
          console.log('Availability data for booking:', data);
          setAvailabilityData(data.data || []);
        }

        // Also fetch existing bookings for this instructor to check for conflicts
        const bookingsUrl = `${API_URL}/bookings/instructor/${instructor.id}`;
        const bookingsResponse = await fetch(bookingsUrl, {
          headers: getHeaders(true)
        });
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          console.log('Existing bookings for conflict check:', bookingsData);
          setExistingBookings(bookingsData.data || []);
        }
      } catch (err) {
        console.error('Error fetching availability for booking:', err);
      }
    };

    fetchAvailability();
  }, [instructor]);

  // Cleanup verification interval on unmount
  useEffect(() => {
    return () => {
      if (verificationCheckInterval.current) {
        clearInterval(verificationCheckInterval.current);
      }
    };
  }, []);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Fix: Read from the correct storage key used by authService.js
      const sessionStr = localStorage.getItem('eazydriving_session');
      let authToken = null;
      let userRole = null;

      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          authToken = session.token;
          userRole = session.role;
        } catch (e) {
          console.error('Error parsing session:', e);
        }
      }

      // Fallback to individual keys if session key is missing (backward compatibility)
      if (!authToken) authToken = localStorage.getItem('authToken');
      if (!userRole) userRole = localStorage.getItem('userRole');

      console.log('🔐 Auth check:', {
        sessionFound: !!sessionStr,
        authToken: authToken ? 'exists' : 'missing',
        userRole
      });

      if (authToken && userRole && userRole.toLowerCase() === 'learner') {
        try {
          console.log('📡 Fetching current user...');
          // We need to ensure the API call uses the correct token
          // The API config likely reads from localStorage too, but let's verify
          const response = await getCurrentUser();
          console.log('📡 getCurrentUser response:', response);

          if (response.success && response.data) {
            // Handle both { data: user } and { data: { user: ... } } structures
            const user = response.data.user || response.data;

            // Extract the correct Learner ID
            // The backend expects the Learner ID (from profileData), not the User ID
            const learnerId = (user.profileData && user.profileData._id) || user._id || user.id;

            console.log('👤 User data extraction:', {
              fromDataUser: !!response.data.user,
              hasProfileData: !!user.profileData,
              userId: user._id || user.id,
              learnerId: learnerId
            });

            // Populate learner details from logged-in user
            setLearnerDetails(prev => ({
              ...prev,
              _id: learnerId,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone || ''
            }));
            if (user.phone) setUserHadPhone(true);

            // Set verification status from user profile
            if (user.isEmailVerified) {
              setIsUserVerified(true);
              setWaitingForVerification(false);
            }

            console.log('✅ User already logged in:', user.email);
          } else {
            console.warn('⚠️ getCurrentUser failed:', response);
          }
        } catch (error) {
          console.error('❌ Error fetching current user:', error);
        }
      } else {
        console.log('🚫 Not logged in or not a learner');
      }
    };

    checkAuthStatus();
    checkAuthStatus();
  }, []);

  // State to track if we have attempted to load saved state
  const [isStateLoaded, setIsStateLoaded] = useState(false);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    // Prevent saving default state before we've had a chance to load saved state
    if (!isStateLoaded) return;

    if (currentStep > 1 || bookings.length > 0 || learnerDetails.firstName) {
      const stateToSave = {
        instructorId: id,
        currentStep,
        selectedPackage,
        bookings,
        learnerDetails,
        timestamp: new Date().getTime()
      };
      localStorage.setItem('booking_flow_state', JSON.stringify(stateToSave));
      console.log('💾 Saved booking state to localStorage');
    }
  }, [currentStep, selectedPackage, bookings, learnerDetails, id, isStateLoaded]);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedStateStr = localStorage.getItem('booking_flow_state');
    if (savedStateStr) {
      try {
        const savedState = JSON.parse(savedStateStr);
        // Only restore if it matches the current instructor
        if (savedState.instructorId === id) {
          console.log('📂 Restoring booking state from localStorage');
          // Don't restore if older than 24 hours
          const oneDay = 24 * 60 * 60 * 1000;
          if (new Date().getTime() - savedState.timestamp < oneDay) {
            setCurrentStep(savedState.currentStep);
            setSelectedPackage(savedState.selectedPackage);
            setBookings(savedState.bookings);

            // Merge learner details carefully to not overwrite newer auth data
            setLearnerDetails(prev => ({
              ...prev,
              ...savedState.learnerDetails,
              // Keep _id if we have it from auth check
              _id: prev._id || savedState.learnerDetails._id
            }));
          } else {
            console.log('🕒 Saved state is too old, clearing');
            localStorage.removeItem('booking_flow_state');
          }
        }
      } catch (e) {
        console.error('Error parsing saved state:', e);
      }
    }
    // Mark state as loaded regardless of whether we found/restored state or not
    setIsStateLoaded(true);
  }, [id]);

  // Auto-advance step if user is already logged in (e.g. returning from verification)
  useEffect(() => {
    if (currentStep === 4 && learnerDetails._id) {
      console.log('⏩ User already logged in, skipping registration step');
      setCurrentStep(5);
    }
  }, [currentStep, learnerDetails._id]);

  // Define all steps
  const allSteps = [
    { number: 1, label: 'Instructor' },
    { number: 2, label: 'Amount' },
    { number: 3, label: 'Book your lessons' },
    { number: 4, label: 'Learner Registration' },
    { number: 5, label: 'Payment' }
  ];

  // Filter out step 4 (registration) if user is already logged in
  const steps = learnerDetails._id
    ? allSteps.filter(step => step.number !== 4)
    : allSteps;

  // Debug log
  console.log('🔍 Steps debug:', {
    learnerId: learnerDetails._id,
    totalSteps: steps.length,
    stepNumbers: steps.map(s => s.number)
  });

  // Function to check user verification status
  const checkVerificationStatus = async () => {
    try {
      const response = await getCurrentUser();
      if (response.success && response.data) {
        // Fix: accessing user object correctly
        // response.data is { user: {...} } so we need response.data.user
        const user = response.data.user || response.data;

        // Also check if we need to update local storage with the verified status
        if (user.isEmailVerified) {
          setIsUserVerified(true);
          setWaitingForVerification(false);

          // Update local storage to reflect verified status
          const sessionStr = localStorage.getItem('eazydriving_session');
          if (sessionStr) {
            try {
              const session = JSON.parse(sessionStr);
              session.isEmailVerified = true;
              localStorage.setItem('eazydriving_session', JSON.stringify(session));
            } catch (e) {
              console.error('Error updating session:', e);
            }
          }

          // Clear the polling interval
          if (verificationCheckInterval.current) {
            clearInterval(verificationCheckInterval.current);
            verificationCheckInterval.current = null;
          }
          // Show success message and proceed to payment
          setTimeout(() => {
            setCurrentStep(5);
          }, 1500);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking verification status:', error);
      return false;
    }
  };

  // Function to start polling for verification status
  const startVerificationPolling = () => {
    // Clear any existing interval
    if (verificationCheckInterval.current) {
      clearInterval(verificationCheckInterval.current);
    }

    // Check immediately
    checkVerificationStatus();

    // Then check every 5 seconds
    verificationCheckInterval.current = setInterval(() => {
      checkVerificationStatus();
    }, 5000);
  };

  // Function to handle resend verification email
  const handleResendVerification = async () => {
    setResendSuccess(false);
    setResendError('');

    try {
      const result = await resendVerificationEmail(verificationEmail);
      if (result.success) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      } else {
        setResendError(result.message || 'Failed to resend verification email');
      }
    } catch (error) {
      setResendError(error.message || 'Failed to resend verification email');
    }
  };

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
        // But if user has entered booking details, validate they're complete
        const filledBookings = bookings.filter(b =>
          b.selectedDate || b.selectedTime || b.pickupSuburb || b.pickupAddress
        );

        filledBookings.forEach((booking, index) => {
          if (!booking.selectedDate) {
            errors[`booking${booking.id}_date`] = `Booking ${index + 1}: Please select a date`;
          }
          if (!booking.selectedTime) {
            errors[`booking${booking.id}_time`] = `Booking ${index + 1}: Please select a time`;
          }
          if (!booking.pickupSuburb) {
            errors[`booking${booking.id}_suburb`] = `Booking ${index + 1}: Please select a suburb`;
          }
          if (!booking.pickupAddress?.trim()) {
            errors[`booking${booking.id}_address`] = `Booking ${index + 1}: Please enter a street address`;
          }
        });
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

  const handleContinue = async () => {
    // Check if user is already logged in - skip step 4 (registration)
    if (currentStep === 3 && learnerDetails._id) {
      // If user didn't have a phone on file, validate and save it
      if (!userHadPhone) {
        if (!learnerDetails.phone?.trim()) {
          setValidationErrors({ phone: 'Phone number is required for booking confirmations' });
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        try {
          const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
          await fetch(`${API_URL}/auth/update-phone`, {
            method: 'PUT',
            headers: getHeaders(true),
            body: JSON.stringify({ phone: learnerDetails.phone.trim() })
          });
        } catch (err) {
          console.error('Failed to save phone number:', err);
        }
      }

      // User is already logged in, skip to payment
      setCurrentStep(5);
      return;
    }

    // Validate current step
    const errors = validateStep(currentStep);

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Auto-populate learner pickup details from first booking when moving to step 4
    if (currentStep === 3 && bookings.length > 0) {
      const firstBooking = bookings[0];

      console.log('First booking data:', firstBooking);

      // Only populate if learner details are empty and booking has pickup info
      if (!learnerDetails.pickupAddress && firstBooking.pickupAddress) {
        // Parse the full address to extract components
        // Format: "2 Fairfield Square, Morwell VIC, Australia"
        const fullAddress = firstBooking.pickupAddress;

        // Extract suburb and state from the address
        let extractedSuburb = firstBooking.pickupSuburb || '';
        let extractedState = 'VIC'; // Default to VIC

        console.log('Full address:', fullAddress);
        console.log('pickupSuburb from booking:', firstBooking.pickupSuburb);

        // Try to parse state from address (e.g., "VIC", "NSW", "QLD")
        const stateMatch = fullAddress.match(/\b(VIC|NSW|QLD|SA|WA|TAS|NT|ACT)\b/i);
        if (stateMatch) {
          extractedState = stateMatch[1].toUpperCase();
        }

        // If suburb wasn't selected from dropdown, try to extract from address
        if (!extractedSuburb) {
          // Split by comma and get the second part (suburb + state)
          const parts = fullAddress.split(',').map(p => p.trim());
          console.log('Address parts:', parts);
          if (parts.length >= 2) {
            // Second part is usually "Suburb STATE"
            const suburbStatePart = parts[1];
            // Remove state abbreviation to get suburb
            extractedSuburb = suburbStatePart.replace(/\b(VIC|NSW|QLD|SA|WA|TAS|NT|ACT)\b/i, '').trim();
          }
        }

        console.log('Extracted suburb:', extractedSuburb);
        console.log('Extracted state:', extractedState);

        setLearnerDetails(prev => ({
          ...prev,
          pickupAddress: fullAddress,
          suburb: extractedSuburb,
          state: extractedState
        }));
      }
    }

    // Handle learner registration step - check for email verification
    if (currentStep === 4 && !showLogin) {
      // This is a registration, we need to register the user and check verification
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
        const registerResponse = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstName: learnerDetails.firstName,
            lastName: learnerDetails.lastName,
            email: learnerDetails.email,
            password: learnerDetails.password,
            phone: learnerDetails.phone,
            role: 'learner'
          })
        });

        const registerData = await registerResponse.json();

        if (!registerResponse.ok) {
          setValidationErrors({ registration: registerData.message || 'Failed to create account' });
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        // Check if user needs email verification
        // Default to TRUE (needs verification) if the field is missing or explicitly false
        const isVerified = registerData.data?.isEmailVerified === true;

        if (!isVerified) {
          // User needs to verify email
          setVerificationEmail(learnerDetails.email);
          setWaitingForVerification(true);
          setIsUserVerified(false);

          // Store the token and learner ID for later use
          if (registerData.data.token) {
            localStorage.setItem('authToken', registerData.data.token);
            localStorage.setItem('userRole', 'learner');
          }
          // Store learner ID
          if (registerData.data.user && registerData.data.user._id) {
            setLearnerDetails(prev => ({ ...prev, _id: registerData.data.user._id }));
          }

          // Start polling for verification
          startVerificationPolling();

          // Clear errors
          setValidationErrors({});
          return; // Don't proceed to next step yet
        } else {
          // User is already verified, proceed to payment
          if (registerData.data.token) {
            localStorage.setItem('authToken', registerData.data.token);
            localStorage.setItem('userRole', 'learner');
          }
          // Store learner ID
          if (registerData.data.user && registerData.data.user._id) {
            setLearnerDetails(prev => ({ ...prev, _id: registerData.data.user._id }));
          }
          setValidationErrors({});
          setCurrentStep(5);
          return;
        }
      } catch (error) {
        console.error('Error during registration:', error);
        setValidationErrors({ registration: 'An error occurred during registration. Please try again.' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    // Handle login step - check if user is verified
    if (currentStep === 4 && showLogin) {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
        const loginResponse = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: loginCredentials.email,
            password: loginCredentials.password,
            role: 'learner'
          })
        });

        const loginData = await loginResponse.json();

        if (!loginResponse.ok) {
          setValidationErrors({ login: loginData.message || 'Login failed' });
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        // Store token and learner ID
        if (loginData.data && loginData.data.token) {
          localStorage.setItem('authToken', loginData.data.token);
          localStorage.setItem('userRole', 'learner');
        }
        // Store learner ID from login
        if (loginData.data && loginData.data.user && loginData.data.user._id) {
          setLearnerDetails(prev => ({ ...prev, _id: loginData.data.user._id }));
        }

        // Proceed to payment
        setValidationErrors({});
        setCurrentStep(5);
        return;
      } catch (error) {
        console.error('Error during login:', error);
        setValidationErrors({ login: 'An error occurred during login. Please try again.' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
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
      pickupSuburb: '',
      pickupAddress: ''
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
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

      // Get auth token from session
      let authToken = localStorage.getItem('authToken');

      // Try to get from session object if not found directly
      if (!authToken) {
        const sessionStr = localStorage.getItem('eazydriving_session');
        if (sessionStr) {
          try {
            const session = JSON.parse(sessionStr);
            authToken = session.token;
          } catch (e) {
            console.error('Error parsing session for booking:', e);
          }
        }
      }

      if (!authToken) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Create bookings sequentially
      console.log('Creating bookings...');

      const validBookings = bookings.filter(b => b.selectedDate && b.selectedTime);
      const createdBookings = [];

      for (const booking of validBookings) {
        // Derive duration from booking type
        let durationHours = 1;
        if (booking.bookingType === '2hour') durationHours = 2;
        if (booking.bookingType === 'test') durationHours = 2.5;

        // Calculate endTime from startTime + duration
        const calcEndTime = (startTime, hours) => {
          const match = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (!match) return '00:00';
          let h = parseInt(match[1]);
          const m = parseInt(match[2]);
          const period = match[3].toUpperCase();
          if (period === 'PM' && h !== 12) h += 12;
          if (period === 'AM' && h === 12) h = 0;
          const totalMin = h * 60 + m + hours * 60;
          const endH = Math.floor(totalMin / 60) % 24;
          const endM = totalMin % 60;
          const endPeriod = endH >= 12 ? 'PM' : 'AM';
          const displayH = endH % 12 || 12;
          return `${displayH}:${String(endM).padStart(2, '0')} ${endPeriod}`;
        };

        const singleBookingData = {
          learner: learnerDetails._id,
          instructor: id,
          bookingType: 'lesson', // Required field
          learnerType: 'marketplace', // Default value
          lesson: {
            date: booking.selectedDate,
            startTime: booking.selectedTime,
            endTime: booking.endTime || calcEndTime(booking.selectedTime, durationHours),
            duration: durationHours,
            pickupLocation: {
              address: booking.pickupAddress || learnerDetails.pickupAddress || '',
              suburb: learnerDetails.suburb || '',
              postcode: '',
              coordinates: {
                lat: 0,
                lng: 0
              }
            },
            dropoffLocation: {
              address: booking.pickupAddress || learnerDetails.pickupAddress || '',
              suburb: learnerDetails.suburb || '',
              postcode: '',
              coordinates: {
                lat: 0,
                lng: 0
              }
            },
            notes: ''
          },
          pricing: {
            baseRate: packageDetails.hours * 100, // $100 per hour example
            platformFee: 0,
            gst: 0,
            totalAmount: packageDetails.hours * 100,
            instructorPayout: packageDetails.hours * 100
          },
          payment: {
            status: 'paid',
            method: 'credit-card', // Valid enum value
            transactionId: paymentIntent.id
          },
          status: 'confirmed'
        };

        console.log('Sending booking request:', singleBookingData);

        const response = await fetch(`${API_URL}/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(singleBookingData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Booking creation failed:', errorData);
          throw new Error(errorData.message || 'Failed to create booking');
        }

        const result = await response.json();
        createdBookings.push(result.data);
      }

      console.log('All bookings created successfully:', createdBookings);

      // Clear bookings from state/storage
      localStorage.removeItem('booking_flow_state');

      // Redirect to success page
      navigate('/booking/success', {
        state: {
          bookings: createdBookings,
          packageDetails
        }
      });

    } catch (error) {
      console.error('Error saving booking:', error);
      setPaymentError(error.message || 'Failed to save booking details. Please contact support.');
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
    return availDate.toLocaleDateString('en-AU', { timeZone: 'Australia/Brisbane', month: 'short', day: 'numeric' });
  };

  // Generate available dates based on instructor availability from API
  const getAvailableDates = () => {
    console.log('🔍 getAvailableDates called');
    console.log('📊 availabilityData:', availabilityData);

    if (!availabilityData || availabilityData.length === 0) {
      console.log('⚠️ No availability data available');
      return [];
    }

    // Extract dates from availability data that have at least one available slot
    const dates = availabilityData
      .filter(avail => {
        // Check if there's at least one available time slot
        const hasAvailableSlot = avail.timeSlots && avail.timeSlots.some(slot => slot.available === true);
        console.log(`📅 Date ${avail.date}: hasAvailableSlot=${hasAvailableSlot}, timeSlots:`, avail.timeSlots);
        return hasAvailableSlot;
      })
      .map(avail => {
        // Convert date to YYYY-MM-DD format in Brisbane timezone
        const date = new Date(avail.date);
        const brisbaneDate = date.toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' }); // en-CA gives YYYY-MM-DD format
        return brisbaneDate;
      })
      .sort(); // Sort dates chronologically

    console.log('✅ Generated available dates:', dates);
    return dates;
  };

  // Helper function to parse time string to minutes since midnight
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

  // Generate available time slots for a specific date based on instructor availability and booking duration
  const getAvailableTimeSlotsForDate = (dateString, bookingType) => {
    if (!availabilityData || availabilityData.length === 0 || !dateString) return [];

    // Determine lesson duration based on booking type
    let durationHours = 1;
    if (bookingType === '2hour') durationHours = 2;
    if (bookingType === 'test') durationHours = 2.5;

    // Find the availability record for the selected date
    const dateAvailability = availabilityData.find(avail => {
      const availDate = new Date(avail.date).toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' });
      return availDate === dateString;
    });

    if (!dateAvailability) return [];

    // Get all available slots
    const allSlots = dateAvailability.timeSlots
      .filter(slot => slot.available === true)
      .map(slot => ({ time: slot.time, minutes: parseTimeToMinutes(slot.time) }))
      .sort((a, b) => a.minutes - b.minutes);

    // Filter slots that have enough consecutive availability
    const validSlots = [];
    const durationMinutes = durationHours * 60;

    for (let i = 0; i < allSlots.length; i++) {
      const startSlot = allSlots[i];
      const endTimeNeeded = startSlot.minutes + durationMinutes;

      // Check if we have consecutive available slots to cover the duration
      let hasEnoughTime = true;
      let currentTime = startSlot.minutes;

      while (currentTime < endTimeNeeded) {
        const nextHour = currentTime + 60;
        const hasSlot = allSlots.some(s => s.minutes === currentTime);

        if (!hasSlot) {
          hasEnoughTime = false;
          break;
        }

        currentTime = nextHour;
      }

      if (hasEnoughTime) {
        validSlots.push(startSlot.time);
      }
    }

    // Filter out slots that conflict with existing bookings on this date
    const bookedOnDate = existingBookings.filter(b => {
      if (!b.lesson?.date) return false;
      const bookingDate = new Date(b.lesson.date).toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' });
      return bookingDate === dateString && (b.status === 'confirmed' || b.status === 'pending');
    });

    if (bookedOnDate.length === 0) return validSlots;

    return validSlots.filter(slotTime => {
      const slotStart = parseTimeToMinutes(slotTime);
      const slotEnd = slotStart + durationMinutes;

      // Check if this slot overlaps with any existing booking
      for (const booked of bookedOnDate) {
        const bookedStart = parseTimeToMinutes(booked.lesson.startTime);
        const bookedEnd = bookedStart + (booked.lesson.duration || 1) * 60;

        // Overlap: slotStart < bookedEnd AND slotEnd > bookedStart
        if (slotStart < bookedEnd && slotEnd > bookedStart) {
          return false;
        }
      }
      return true;
    });
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
                              // Parse YYYY-MM-DD to noon UTC to ensure correct Brisbane date display
                              const [y, m, d] = date.split('-').map(Number);
                              const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
                              const formattedDate = dateObj.toLocaleDateString('en-AU', {
                                timeZone: 'Australia/Brisbane',
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
                            {getAvailableTimeSlotsForDate(booking.selectedDate, booking.bookingType).map((time) => (
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
                      <label>Pick Up Suburb</label>
                      <select
                        value={booking.pickupSuburb}
                        onChange={(e) => handleBookingChange(booking.id, 'pickupSuburb', e.target.value)}
                        className="form-select"
                      >
                        <option value="">Select a suburb</option>
                        {instructor.serviceArea?.suburbs?.map((suburb) => (
                          <option key={suburb} value={suburb}>
                            {suburb}
                          </option>
                        ))}
                      </select>
                      <p className="field-hint">
                        {instructor.name} services the suburbs listed above.
                      </p>
                    </div>

                    {/* Street Address with Autocomplete */}
                    <div className="form-group">
                      <label>Street Address</label>
                      <LocationAutocomplete
                        suburb={booking.pickupSuburb}
                        value={booking.pickupAddress}
                        onChange={(address) => handleBookingChange(booking.id, 'pickupAddress', address)}
                        placeholder={booking.pickupSuburb ? `Start typing address in ${booking.pickupSuburb}...` : "Select a suburb first"}
                        className="form-input"
                      />
                      <p className="field-hint">
                        {booking.pickupSuburb
                          ? `Start typing your address and select from suggestions in ${booking.pickupSuburb}.`
                          : 'Please select a suburb first to enable address autocomplete.'}
                      </p>
                    </div>
                  </div>
                ))}

                <button className="btn-add-booking" onClick={handleAddBooking}>
                  <FaInfoCircle /> Add Another Booking
                </button>

                {/* Phone number - only for logged-in users who didn't have a phone on file */}
                {learnerDetails._id && !userHadPhone && (
                  <div className="new-booking-section">
                    <div className="form-group">
                      <label className="form-label-required">Phone Number</label>
                      <input
                        type="tel"
                        value={learnerDetails.phone || ''}
                        onChange={(e) => setLearnerDetails(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="e.g. +61412345678"
                        className="form-input"
                      />
                      <p className="field-hint">Required for booking confirmations via SMS and WhatsApp.</p>
                      {validationErrors.phone && (
                        <p className="field-error" style={{ color: '#f44336', fontSize: '0.85rem', marginTop: '4px' }}>{validationErrors.phone}</p>
                      )}
                    </div>
                  </div>
                )}

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

          {/* Email Verification Screen */}
          {waitingForVerification && currentStep === 4 && (
            <div className="booking-step-simple">
              <div className="verification-container">
                <div className="verification-card">
                  {/* Email icon */}
                  <div className="verification-icon">
                    <FaEnvelope />
                  </div>

                  {/* Title */}
                  <h1 className="verification-title">
                    {isUserVerified ? 'Email Verified!' : 'Verify Your Email to Continue'}
                  </h1>

                  {/* Message */}
                  {!isUserVerified ? (
                    <>
                      <p className="verification-message">
                        We've sent a verification link to <strong>{verificationEmail}</strong>
                      </p>
                      <p className="verification-sub-message">
                        Please check your email and click the verification link to continue with your booking
                      </p>

                      {/* Checking status indicator */}
                      <div className="verification-status">
                        <FaSpinner className="verification-spinner" />
                        <span>Checking verification status...</span>
                      </div>

                      {/* Resend section */}
                      <div className="verification-resend">
                        <p>Didn't receive the email?</p>
                        <button
                          className="btn-resend-verification"
                          onClick={handleResendVerification}
                          disabled={resendSuccess}
                        >
                          {resendSuccess ? 'Email Sent!' : 'Resend'}
                        </button>
                      </div>

                      {/* Success/Error messages */}
                      {resendSuccess && (
                        <div className="verification-alert success">
                          Verification email resent successfully!
                        </div>
                      )}
                      {resendError && (
                        <div className="verification-alert error">
                          {resendError}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="verification-success">
                        <FaCheckCircle className="verification-success-icon" />
                        <p>Email verified! Proceeding to payment...</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && !waitingForVerification && (
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
                          purchaseType="package_purchase"
                          credits={packageDetails.hours}
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
                          <rect width="120" height="30" rx="4" fill="#B2FCE4" />
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
                          <rect width="120" height="30" rx="4" fill="#FFB3C7" />
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
                          <rect width="120" height="30" rx="4" fill="#fff" stroke="#e0e0e0" />
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
                      <rect width="80" height="24" rx="3" fill="#5469d4" />
                      <text x="40" y="16" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600">Pay in 4</text>
                    </svg>
                    <svg viewBox="0 0 80 24" className="bnpl-logo-small">
                      <rect width="80" height="24" rx="3" fill="#B2FCE4" />
                      <text x="40" y="16" textAnchor="middle" fill="#000" fontSize="9" fontWeight="600">afterpay</text>
                    </svg>
                    <svg viewBox="0 0 80 24" className="bnpl-logo-small">
                      <rect width="80" height="24" rx="3" fill="#FFB3C7" />
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
    <LoadScript
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
      libraries={['places']}
    >
      <Elements stripe={stripePromise}>
        <BookingFlowContent />
      </Elements>
    </LoadScript>
  );
};

export default BookingFlow;
