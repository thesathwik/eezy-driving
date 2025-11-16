import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const CompleteInstructorProfile = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  const [formData, setFormData] = useState({
    // Step 1: Personal Details
    firstName: '',
    preferredFirstName: '',
    lastName: '',
    gender: '',
    email: '',
    phone: '',
    postcode: '',
    // Step 2: Profile
    profilePhoto: null,
    bio: '',
    languages: [],
    memberOfAssociation: 'no',
    startMonth: '',
    startYear: '',
    services: [],
    emailNotifications: true,
    smsNotifications: true,
    marketplaceVisible: true,
    // Step 3: Vehicle Details
    transmissionOffered: 'auto',
    vehicleTransmission: 'auto',
    vehicleRegistration: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    ancapRating: '',
    hasDualControls: 'yes',
    vehiclePhoto: null,
    // Step 4: Service Area
    serviceSuburbs: [],
    testLocations: [],
    // Step 5: Opening Hours
    openingHours: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    },
    // Step 6: Pricing
    pricing: {
      marketplaceLessonRate: '82.00',
      privateLessonRate: '80.00',
      marketplaceTestPackageRate: '225.00',
      privateTestPackageRate: '225.00'
    },
    // Step 7: Banking
    banking: {
      businessName: '',
      abn: '',
      billingAddress: '',
      registeredForGST: 'no',
      suburb: '',
      postcode: '',
      state: '',
      payoutFrequency: 'weekly',
      accountName: '',
      bsb: '',
      accountNumber: ''
    }
  });

  const [languageInput, setLanguageInput] = useState('');
  const [testLocationInput, setTestLocationInput] = useState('');
  const [mapCenter] = useState({ lat: -27.4698, lng: 153.0251 }); // Brisbane, Australia
  const [mapType, setMapType] = useState('roadmap');
  const [suburbInput, setSuburbInput] = useState('');
  const [filteredSuburbs, setFilteredSuburbs] = useState([]);
  const [showSuburbDropdown, setShowSuburbDropdown] = useState(false);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill data from user signup
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profilePhoto: file }));
    }
  };

  const handleAddLanguage = (lang) => {
    if (lang && !formData.languages.includes(lang)) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, lang]
      }));
      setLanguageInput('');
    }
  };

  const handleRemoveLanguage = (langToRemove) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(lang => lang !== langToRemove)
    }));
  };

  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleAddSuburb = (suburb) => {
    if (suburb && !formData.serviceSuburbs.find(s => s.toLowerCase() === suburb.toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        serviceSuburbs: [...prev.serviceSuburbs, suburb]
      }));
    }
  };

  const handleRemoveSuburb = (suburbToRemove) => {
    setFormData(prev => ({
      ...prev,
      serviceSuburbs: prev.serviceSuburbs.filter(suburb => suburb !== suburbToRemove)
    }));
  };

  const handleAddTestLocation = (location) => {
    if (location && !formData.testLocations.find(l => l.toLowerCase() === location.toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        testLocations: [...prev.testLocations, location]
      }));
      setTestLocationInput('');
    }
  };

  const handleRemoveTestLocation = (locationToRemove) => {
    setFormData(prev => ({
      ...prev,
      testLocations: prev.testLocations.filter(location => location !== locationToRemove)
    }));
  };

  const handleToggleMapType = () => {
    setMapType(prev => prev === 'roadmap' ? 'satellite' : 'roadmap');
  };

  // Opening Hours Handlers
  const handleAddTimeSlot = (day) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: [...prev.openingHours[day], { startTime: '09:00', endTime: '17:00' }]
      }
    }));
  };

  const handleRemoveTimeSlot = (day, index) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: prev.openingHours[day].filter((_, i) => i !== index)
      }
    }));
  };

  const handleTimeChange = (day, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: prev.openingHours[day].map((slot, i) =>
          i === index ? { ...slot, [field]: value } : slot
        )
      }
    }));
  };

  const handleCopyDay = (sourceDay, targetDay) => {
    setFormData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [targetDay]: [...prev.openingHours[sourceDay]]
      }
    }));
  };

  const handleCopyToAll = (sourceDay) => {
    const slots = formData.openingHours[sourceDay];
    setFormData(prev => ({
      ...prev,
      openingHours: {
        monday: [...slots],
        tuesday: [...slots],
        wednesday: [...slots],
        thursday: [...slots],
        friday: [...slots],
        saturday: [...slots],
        sunday: [...slots]
      }
    }));
  };

  // Pricing Handlers
  const handlePriceChange = (field, value) => {
    // Only allow numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');

    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [field]: numericValue
      }
    }));
  };

  // Banking Handlers
  const handleBankingChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      banking: {
        ...prev.banking,
        [field]: value
      }
    }));
  };

  const handleABNChange = (value) => {
    // Only allow numbers and limit to 11 digits
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 11);
    handleBankingChange('abn', numericValue);
  };

  const handleBSBChange = (value) => {
    // Only allow numbers and limit to 6 digits
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    handleBankingChange('bsb', numericValue);
  };

  const handleAccountNumberChange = (value) => {
    // Only allow numbers and limit to 9 digits
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 9);
    handleBankingChange('accountNumber', numericValue);
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.postcode.trim()) {
      newErrors.postcode = 'Postcode is required';
    } else if (!/^\d{4}$/.test(formData.postcode)) {
      newErrors.postcode = 'Postcode must be 4 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.bio.trim()) {
      newErrors.bio = 'Instructor bio is required';
    } else if (formData.bio.length > 1600) {
      newErrors.bio = 'Bio must not exceed 1600 characters';
    }

    if (formData.languages.length === 0) {
      newErrors.languages = 'Please add at least one language';
    }

    if (!formData.startMonth) {
      newErrors.startMonth = 'Start month is required';
    }

    if (!formData.startYear) {
      newErrors.startYear = 'Start year is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};

    if (!formData.vehicleRegistration.trim()) {
      newErrors.vehicleRegistration = 'Vehicle registration number is required';
    }

    if (!formData.vehicleMake) {
      newErrors.vehicleMake = 'Vehicle make is required';
    }

    if (!formData.vehicleModel) {
      newErrors.vehicleModel = 'Vehicle model is required';
    }

    if (!formData.vehicleYear) {
      newErrors.vehicleYear = 'Vehicle year is required';
    }

    if (!formData.ancapRating) {
      newErrors.ancapRating = 'ANCAP safety rating is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors = {};

    if (formData.serviceSuburbs.length === 0) {
      newErrors.serviceSuburbs = 'Please select at least one service suburb';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep6 = () => {
    const newErrors = {};

    // Validate marketplace lesson rate
    if (!formData.pricing.marketplaceLessonRate || parseFloat(formData.pricing.marketplaceLessonRate) <= 0) {
      newErrors.marketplaceLessonRate = 'EEZYDRIVING lesson rate is required and must be greater than 0';
    }

    // Validate private lesson rate
    if (!formData.pricing.privateLessonRate || parseFloat(formData.pricing.privateLessonRate) <= 0) {
      newErrors.privateLessonRate = 'Private lesson rate is required and must be greater than 0';
    }

    // Validate marketplace test package rate
    if (!formData.pricing.marketplaceTestPackageRate || parseFloat(formData.pricing.marketplaceTestPackageRate) <= 0) {
      newErrors.marketplaceTestPackageRate = 'EEZYDRIVING test package rate is required and must be greater than 0';
    }

    // Validate private test package rate
    if (!formData.pricing.privateTestPackageRate || parseFloat(formData.pricing.privateTestPackageRate) <= 0) {
      newErrors.privateTestPackageRate = 'Private test package rate is required and must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep7 = () => {
    const newErrors = {};

    // Validate business name
    if (!formData.banking.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    // Validate ABN
    if (!formData.banking.abn) {
      newErrors.abn = 'ABN is required';
    } else if (formData.banking.abn.length !== 11) {
      newErrors.abn = 'ABN must be 11 digits';
    }

    // Validate billing address
    if (!formData.banking.billingAddress.trim()) {
      newErrors.billingAddress = 'Billing address is required';
    }

    // Validate suburb
    if (!formData.banking.suburb.trim()) {
      newErrors.suburb = 'Suburb is required';
    }

    // Validate postcode
    if (!formData.banking.postcode) {
      newErrors.bankingPostcode = 'Postcode is required';
    } else if (!/^\d{4}$/.test(formData.banking.postcode)) {
      newErrors.bankingPostcode = 'Postcode must be 4 digits';
    }

    // Validate state
    if (!formData.banking.state) {
      newErrors.state = 'State is required';
    }

    // Validate account name
    if (!formData.banking.accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    }

    // Validate BSB
    if (!formData.banking.bsb) {
      newErrors.bsb = 'BSB is required';
    } else if (formData.banking.bsb.length !== 6) {
      newErrors.bsb = 'BSB must be 6 digits';
    }

    // Validate account number
    if (!formData.banking.accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    } else if (formData.banking.accountNumber.length < 6 || formData.banking.accountNumber.length > 9) {
      newErrors.accountNumber = 'Account number must be 6-9 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) {
      return;
    }

    if (currentStep === 2 && !validateStep2()) {
      return;
    }

    if (currentStep === 3 && !validateStep3()) {
      return;
    }

    if (currentStep === 4 && !validateStep4()) {
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate banking before submitting
    if (!validateStep7()) {
      return;
    }

    setIsLoading(true);
    try {
      // Prepare profile data - transform flat form data to nested structure
      const profileData = {
        preferredFirstName: formData.preferredFirstName,
        gender: formData.gender,
        postcode: formData.postcode,
        bio: formData.bio,
        languages: formData.languages,
        memberOfAssociation: formData.memberOfAssociation === 'yes',
        instructingSince: {
          month: formData.startMonth,
          year: parseInt(formData.startYear)
        },
        services: formData.services,
        notifications: {
          email: formData.emailNotifications,
          sms: formData.smsNotifications
        },
        marketplaceVisible: formData.marketplaceVisible,
        vehicle: {
          transmissionOffered: formData.transmissionOffered,
          transmission: formData.vehicleTransmission,
          registration: formData.vehicleRegistration,
          make: formData.vehicleMake,
          model: formData.vehicleModel,
          year: parseInt(formData.vehicleYear),
          ancapRating: formData.ancapRating,
          hasDualControls: formData.hasDualControls === 'yes'
        },
        serviceArea: {
          suburbs: formData.serviceSuburbs,
          testLocations: formData.testLocations
        },
        openingHours: formData.openingHours,
        pricing: {
          marketplaceLessonRate: parseFloat(formData.pricing.marketplaceLessonRate),
          privateLessonRate: parseFloat(formData.pricing.privateLessonRate),
          marketplaceTestPackageRate: parseFloat(formData.pricing.marketplaceTestPackageRate),
          privateTestPackageRate: parseFloat(formData.pricing.privateTestPackageRate)
        },
        banking: {
          businessName: formData.banking.businessName,
          abn: formData.banking.abn,
          billingAddress: {
            street: formData.banking.billingAddress,
            suburb: formData.banking.suburb,
            postcode: formData.banking.postcode,
            state: formData.banking.state
          },
          registeredForGST: formData.banking.registeredForGST === 'yes',
          payoutFrequency: formData.banking.payoutFrequency,
          bankAccount: {
            accountName: formData.banking.accountName,
            bsb: formData.banking.bsb,
            accountNumber: formData.banking.accountNumber
          }
        }
      };

      // Get auth token
      const token = localStorage.getItem('eazydriving_session');
      const session = token ? JSON.parse(token) : null;

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/instructors/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (data.success) {
        navigate('/instructor/dashboard');
      } else {
        setErrors({ general: data.message || 'Failed to save profile' });
      }
    } catch (error) {
      console.error('Profile save error:', error);
      setErrors({ general: 'An error occurred while saving your profile' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  const renderProgressBar = () => {
    const percentage = (currentStep / totalSteps) * 100;
    return (
      <div className="profile-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
        </div>
        <p className="progress-text">Step {currentStep} of {totalSteps}</p>
      </div>
    );
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const availableServices = [
    'Driving test package: existing customers',
    'Driving test package: new customers',
    'Manual instructor accredited - no vehicle'
  ];

  const handleVehiclePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, vehiclePhoto: file }));
    }
  };

  const carMakes = ['Toyota', 'Honda', 'Mazda', 'Hyundai', 'Nissan', 'Subaru', 'Ford', 'Volkswagen', 'BMW', 'Mercedes-Benz', 'Other'];
  const ancapRatings = ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'];
  const vehicleYears = Array.from({ length: 30 }, (_, i) => currentYear - i);

  // Brisbane suburbs for service area
  const brisbaneSuburbs = [
    'Acacia Ridge', 'Albion', 'Alderley', 'Algester', 'Annerley', 'Anstead', 'Ascot', 'Ashgrove',
    'Aspley', 'Auchenflower', 'Bald Hills', 'Balmoral', 'Banyo', 'Bardon', 'Bellbowrie', 'Belmont',
    'Boondall', 'Bowen Hills', 'Bracken Ridge', 'Bray Park', 'Brighton', 'Brisbane City', 'Brookfield',
    'Bulimba', 'Buranda', 'Calamvale', 'Camp Hill', 'Cannon Hill', 'Carina', 'Carina Heights', 'Carindale',
    'Carseldine', 'Chandler', 'Chapel Hill', 'Chermside', 'Clayfield', 'Coorparoo', 'Corinda', 'Crestmead',
    'Deagon', 'Doolandella', 'Darra', 'Dutton Park', 'East Brisbane', 'Eight Mile Plains', 'Enoggera',
    'Everton Park', 'Fairfield', 'Ferny Grove', 'Fig Tree Pocket', 'Fortitude Valley', 'Gaythorne',
    'Geebung', 'Gordon Park', 'Graceville', 'Greenslopes', 'Gumdale', 'Hamilton', 'Hawthorne', 'Hemmant',
    'Hendra', 'Herston', 'Highgate Hill', 'Holland Park', 'Inala', 'Indooroopilly', 'Jamboree Heights',
    'Jindalee', 'Kangaroo Point', 'Kedron', 'Kelvin Grove', 'Kenmore', 'Keperra', 'Kuraby', 'Kurwongbah',
    'Lota', 'Lutwyche', 'Macgregor', 'Mackenzie', 'Manly', 'Mansfield', 'Mango Hill', 'Middle Park',
    'Milton', 'Mitchelton', 'Moorooka', 'Morningside', 'Mount Coot-tha', 'Mount Gravatt', 'Mount Ommaney',
    'Murarrie', 'Nathan', 'New Farm', 'Newmarket', 'Newstead', 'Norman Park', 'Northgate', 'Nudgee',
    'Nundah', 'Paddington', 'Pallara', 'Parkinson', 'Petrie', 'Petrie Terrace', 'Pinjarra Hills',
    'Red Hill', 'Richlands', 'Robertson', 'Rochedale', 'Rocklea', 'Runcorn', 'Salisbury', 'Sandgate',
    'Seven Hills', 'Shorncliffe', 'Sinnamon Park', 'South Brisbane', 'Spring Hill', 'St Lucia',
    'Stafford', 'Stones Corner', 'Strathpine', 'Stretton', 'Sunnybank', 'Taringa', 'Tarragindi',
    'Teneriffe', 'Tennyson', 'The Gap', 'Tingalpa', 'Toowong', 'Toowoomba', 'Upper Kedron', 'Virginia',
    'Wavell Heights', 'West End', 'Westlake', 'Wilston', 'Windsor', 'Wishart', 'Woolloongabba', 'Wooloowin',
    'Wynnum', 'Yeerongpilly', 'Yeronga', 'Zillmere'
  ];

  const testCentres = [
    'Ipswich Transport and Main Roads Customer Service Centre - (2 Colvin St)',
    'Logan Transport and Main Roads Customer Service Centre - (43-45 Jacaranda Ave)',
    'Bethania Transport and Main Roads Customer Service Centre - (Bethania Lifestyle Centre, 13 Glasson Dr)',
    'Brisbane City Transport and Main Roads Customer Service Centre - (313 Adelaide St)',
    'Wynnum Transport and Main Roads Customer Service Centre - (231 Tingal Rd)',
    'Strathpine Transport and Main Roads Customer Service Centre - (295 Gympie Rd)',
    'Caboolture Transport and Main Roads Customer Service Centre - (42-48 King St)'
  ];

  const handleSuburbInputChange = (e) => {
    const value = e.target.value;
    setSuburbInput(value);

    if (value.trim()) {
      const filtered = brisbaneSuburbs.filter(suburb =>
        suburb.toLowerCase().includes(value.toLowerCase()) &&
        !formData.serviceSuburbs.includes(suburb)
      ).slice(0, 10);
      setFilteredSuburbs(filtered);
      setShowSuburbDropdown(filtered.length > 0);
    } else {
      setFilteredSuburbs([]);
      setShowSuburbDropdown(false);
    }
  };

  const handleSelectSuburb = (suburb) => {
    handleAddSuburb(suburb);
    setSuburbInput('');
    setFilteredSuburbs([]);
    setShowSuburbDropdown(false);
  };

  const renderStep5 = () => {
    const days = [
      { key: 'monday', label: 'Monday' },
      { key: 'tuesday', label: 'Tuesday' },
      { key: 'wednesday', label: 'Wednesday' },
      { key: 'thursday', label: 'Thursday' },
      { key: 'friday', label: 'Friday' },
      { key: 'saturday', label: 'Saturday' },
      { key: 'sunday', label: 'Sunday' }
    ];

    const getDayTip = (day) => {
      const slots = formData.openingHours[day];
      if (slots.length === 0) {
        return "Tip: Add another day to maximise income";
      }
      return null;
    };

    return (
      <div className="form-step">
        <h2 className="step-title">Opening Hours</h2>
        <p className="step-description">Set when you're regularly available for bookings.</p>

        <div className="info-banner">
          <span className="info-icon">⊙</span>
          <div>
            <strong>Group your hours</strong>
            <p>Consecutive slots make your calendar easier to fill and more profitable.</p>
          </div>
        </div>

        <div className="opening-hours-container">
          {days.map(({ key, label }, dayIndex) => {
            const slots = formData.openingHours[key];
            const isFirstDayWithSlots = slots.length > 0 &&
              days.slice(0, dayIndex).every(d => formData.openingHours[d.key].length === 0);

            return (
              <div key={key} className="opening-hours-day">
                <div className="day-label">{label}</div>

                <div className="day-content">
                  {slots.length === 0 ? (
                    <span className="unavailable-text">Unavailable</span>
                  ) : (
                    <div className="time-slots">
                      {slots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="time-slot">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => handleTimeChange(key, slotIndex, 'startTime', e.target.value)}
                            className="time-input"
                          />
                          <span className="time-separator">-</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => handleTimeChange(key, slotIndex, 'endTime', e.target.value)}
                            className="time-input"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveTimeSlot(key, slotIndex)}
                            className="btn-icon btn-remove-slot"
                            title="Remove this time slot"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="day-actions">
                    <button
                      type="button"
                      onClick={() => handleAddTimeSlot(key)}
                      className="btn-icon btn-add"
                      title="Add time slot"
                    >
                      +
                    </button>

                    {isFirstDayWithSlots && (
                      <button
                        type="button"
                        onClick={() => handleCopyToAll(key)}
                        className="btn-copy-all"
                        title="Copy to all days"
                      >
                        <span className="copy-icon">□</span> Copy to all
                      </button>
                    )}

                    {slots.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTimeSlot(key, 0)}
                        className="btn-icon btn-delete"
                        title="Remove all slots"
                      >
                        🗑
                      </button>
                    )}
                  </div>

                  {getDayTip(key) && (
                    <div className="day-tip">{getDayTip(key)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStep6 = () => (
    <div className="form-step">
      <h2 className="step-title">Pricing</h2>
      <p className="step-description">Set your hourly rates for lessons and test packages.</p>

      <div className="pricing-info-banner">
        <div className="learner-type">
          <strong>EEZYDRIVING Learners:</strong>
          <p>from EEZYDRIVING marketplace.</p>
        </div>
        <div className="learner-type">
          <strong>Private Learners:</strong>
          <p>invited to EEZYDRIVING by you.</p>
        </div>
      </div>

      <div className="pricing-sections">
        {/* Lesson Pricing */}
        <div className="pricing-section">
          <h3 className="pricing-section-title">Lesson</h3>

          <div className="pricing-row">
            <div className="pricing-label">
              <span className="pricing-type">EEZYDRIVING Learners</span>
            </div>
            <div className="pricing-input-group">
              <span className="pricing-currency">$</span>
              <input
                type="text"
                value={formData.pricing.marketplaceLessonRate}
                onChange={(e) => handlePriceChange('marketplaceLessonRate', e.target.value)}
                className="pricing-input"
                placeholder="0.00"
              />
              <span className="pricing-unit">/ hour</span>
            </div>
          </div>

          <div className="pricing-row">
            <div className="pricing-label">
              <span className="pricing-type">Private Learners</span>
            </div>
            <div className="pricing-input-group">
              <span className="pricing-currency">$</span>
              <input
                type="text"
                value={formData.pricing.privateLessonRate}
                onChange={(e) => handlePriceChange('privateLessonRate', e.target.value)}
                className="pricing-input"
                placeholder="0.00"
              />
              <span className="pricing-unit">/ hour</span>
            </div>
          </div>
        </div>

        {/* Test Package Pricing */}
        <div className="pricing-section">
          <h3 className="pricing-section-title">Test Package</h3>
          <p className="pricing-section-description">
            A test package includes: 1 hour of lesson (your standard lesson rate applies) plus a driving test.
          </p>

          <div className="pricing-row">
            <div className="pricing-label">
              <span className="pricing-type">EEZYDRIVING Learners</span>
            </div>
            <div className="pricing-input-group">
              <span className="pricing-currency">$</span>
              <input
                type="text"
                value={formData.pricing.marketplaceTestPackageRate}
                onChange={(e) => handlePriceChange('marketplaceTestPackageRate', e.target.value)}
                className="pricing-input"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="pricing-row">
            <div className="pricing-label">
              <span className="pricing-type">Private Learners</span>
            </div>
            <div className="pricing-input-group">
              <span className="pricing-currency">$</span>
              <input
                type="text"
                value={formData.pricing.privateTestPackageRate}
                onChange={(e) => handlePriceChange('privateTestPackageRate', e.target.value)}
                className="pricing-input"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep7 = () => {
    const australianStates = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
    const payoutFrequencies = [
      { value: 'weekly', label: 'Weekly' },
      { value: 'fortnightly', label: 'Fortnightly' },
      { value: 'fourWeeks', label: 'Every four weeks' }
    ];

    return (
      <div className="form-step">
        <h2 className="step-title">Banking</h2>
        <p className="step-description">Provide your billing and bank account details for payments.</p>

        {/* Billing Info Section */}
        <div className="banking-section">
          <h3 className="banking-section-title">Billing Info</h3>

          <div className="form-group">
            <label htmlFor="businessName">Business name <span className="required">*</span></label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              placeholder="Enter your business name"
              value={formData.banking.businessName}
              onChange={(e) => handleBankingChange('businessName', e.target.value)}
              className={errors.businessName ? 'error' : ''}
            />
            {errors.businessName && <span className="error-message">{errors.businessName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="abn">ABN <span className="required">*</span></label>
            <input
              type="text"
              id="abn"
              name="abn"
              placeholder="11 digit ABN"
              value={formData.banking.abn}
              onChange={(e) => handleABNChange(e.target.value)}
              className={errors.abn ? 'error' : ''}
              maxLength="11"
            />
            {errors.abn && <span className="error-message">{errors.abn}</span>}
            <span className="field-note">Enter your 11-digit Australian Business Number</span>
          </div>

          <div className="form-group">
            <label htmlFor="billingAddress">Billing Address <span className="required">*</span></label>
            <input
              type="text"
              id="billingAddress"
              name="billingAddress"
              placeholder="Street address"
              value={formData.banking.billingAddress}
              onChange={(e) => handleBankingChange('billingAddress', e.target.value)}
              className={errors.billingAddress ? 'error' : ''}
            />
            {errors.billingAddress && <span className="error-message">{errors.billingAddress}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="registeredForGST">Is your business registered for GST? <span className="required">*</span></label>
            <select
              id="registeredForGST"
              name="registeredForGST"
              value={formData.banking.registeredForGST}
              onChange={(e) => handleBankingChange('registeredForGST', e.target.value)}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="suburb">Suburb <span className="required">*</span></label>
              <input
                type="text"
                id="suburb"
                name="suburb"
                placeholder="Suburb"
                value={formData.banking.suburb}
                onChange={(e) => handleBankingChange('suburb', e.target.value)}
                className={errors.suburb ? 'error' : ''}
              />
              {errors.suburb && <span className="error-message">{errors.suburb}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="bankingPostcode">Postcode <span className="required">*</span></label>
              <input
                type="text"
                id="bankingPostcode"
                name="bankingPostcode"
                placeholder="4 digits"
                value={formData.banking.postcode}
                onChange={(e) => handleBankingChange('postcode', e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                className={errors.bankingPostcode ? 'error' : ''}
                maxLength="4"
              />
              {errors.bankingPostcode && <span className="error-message">{errors.bankingPostcode}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="state">State <span className="required">*</span></label>
            <select
              id="state"
              name="state"
              value={formData.banking.state}
              onChange={(e) => handleBankingChange('state', e.target.value)}
              className={errors.state ? 'error' : ''}
            >
              <option value="">Select state</option>
              {australianStates.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            {errors.state && <span className="error-message">{errors.state}</span>}
          </div>
        </div>

        {/* Payout Frequency Section */}
        <div className="banking-section">
          <h3 className="banking-section-title">Payout Frequency</h3>

          <div className="form-group">
            <label>How often would you like to receive payouts? <span className="required">*</span></label>
            <div className="radio-group">
              {payoutFrequencies.map(({ value, label }) => (
                <label key={value} className="radio-label">
                  <input
                    type="radio"
                    name="payoutFrequency"
                    value={value}
                    checked={formData.banking.payoutFrequency === value}
                    onChange={(e) => handleBankingChange('payoutFrequency', e.target.value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Bank Account Section */}
        <div className="banking-section">
          <h3 className="banking-section-title">Bank Account</h3>
          <p className="banking-section-description">
            Your earnings will be deposited into this account according to your chosen payout frequency.
          </p>

          <div className="form-group">
            <label htmlFor="accountName">Account Name <span className="required">*</span></label>
            <input
              type="text"
              id="accountName"
              name="accountName"
              placeholder="Name on bank account"
              value={formData.banking.accountName}
              onChange={(e) => handleBankingChange('accountName', e.target.value)}
              className={errors.accountName ? 'error' : ''}
            />
            {errors.accountName && <span className="error-message">{errors.accountName}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bsb">BSB <span className="required">*</span></label>
              <input
                type="text"
                id="bsb"
                name="bsb"
                placeholder="000-000"
                value={formData.banking.bsb}
                onChange={(e) => handleBSBChange(e.target.value)}
                className={errors.bsb ? 'error' : ''}
                maxLength="6"
              />
              {errors.bsb && <span className="error-message">{errors.bsb}</span>}
              <span className="field-note">6-digit BSB number</span>
            </div>

            <div className="form-group">
              <label htmlFor="accountNumber">Account Number <span className="required">*</span></label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                placeholder="Account number"
                value={formData.banking.accountNumber}
                onChange={(e) => handleAccountNumberChange(e.target.value)}
                className={errors.accountNumber ? 'error' : ''}
                maxLength="9"
              />
              {errors.accountNumber && <span className="error-message">{errors.accountNumber}</span>}
              <span className="field-note">Up to 9 digits</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
      <div className="form-step">
        <h2 className="step-title">Service Area</h2>
        <p className="step-description">
          Select the suburbs where you can pick up learners. Searches in these locations will return you as an available instructor.
        </p>

        <div className="service-area-container">
          {/* Service Suburbs Section */}
          <div className="form-group">
            <label>
              Service Suburbs <span className="required">*</span>
              {formData.serviceSuburbs.length > 0 && (
                <span className="suburb-count">
                  You are servicing {formData.serviceSuburbs.length} suburb{formData.serviceSuburbs.length !== 1 ? 's' : ''} around Brisbane
                </span>
              )}
            </label>

            <div className="suburb-selection">
              <div className="suburb-tags">
                {formData.serviceSuburbs.map((suburb, index) => (
                  <span key={index} className="suburb-tag">
                    {suburb}
                    <button
                      type="button"
                      onClick={() => handleRemoveSuburb(suburb)}
                      className="remove-tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="suburb-input-wrapper">
                <input
                  type="text"
                  value={suburbInput}
                  onChange={handleSuburbInputChange}
                  onFocus={() => suburbInput && setShowSuburbDropdown(filteredSuburbs.length > 0)}
                  placeholder="Search and add suburbs..."
                  className={errors.serviceSuburbs ? 'error' : ''}
                />
                {showSuburbDropdown && filteredSuburbs.length > 0 && (
                  <div className="suburb-dropdown">
                    {filteredSuburbs.map((suburb, index) => (
                      <div
                        key={index}
                        className="suburb-dropdown-item"
                        onClick={() => handleSelectSuburb(suburb)}
                      >
                        {suburb}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {errors.serviceSuburbs && <span className="error-message">{errors.serviceSuburbs}</span>}
          </div>

          {/* Google Map */}
          <div className="map-container">
            <div className="map-controls">
              <div className="map-toggle-buttons">
                <button
                  type="button"
                  className={`map-toggle-btn ${mapType === 'roadmap' ? 'active' : ''}`}
                  onClick={() => setMapType('roadmap')}
                >
                  Map
                </button>
                <button
                  type="button"
                  className={`map-toggle-btn ${mapType === 'satellite' ? 'active' : ''}`}
                  onClick={() => setMapType('satellite')}
                >
                  Satellite
                </button>
              </div>
            </div>

            <div className="google-map-placeholder">
              <iframe
                title="Brisbane Service Area Map"
                width="100%"
                height="450"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps/embed/v1/view?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&center=${mapCenter.lat},${mapCenter.lng}&zoom=11&maptype=${mapType}`}
                allowFullScreen
              ></iframe>
            </div>
          </div>

          {/* Driving Test Locations */}
          <div className="form-group test-locations-section">
            <h3 className="section-heading">Driving Test Locations</h3>
            <p className="section-description">
              Test locations are separate from your lesson suburbs. You're free to choose one or more test centres that are most convenient for you.
            </p>

            <label>Driving test locations (Optional)</label>
            <div className="test-location-tags">
              {formData.testLocations.map((location, index) => (
                <span key={index} className="test-location-tag">
                  {location}
                  <button
                    type="button"
                    onClick={() => handleRemoveTestLocation(location)}
                    className="remove-tag"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="test-location-input-wrapper">
              <select
                value={testLocationInput}
                onChange={(e) => setTestLocationInput(e.target.value)}
                className="test-location-select"
              >
                <option value="">Select a test centre...</option>
                {testCentres
                  .filter(centre => !formData.testLocations.includes(centre))
                  .map((centre, index) => (
                    <option key={index} value={centre}>{centre}</option>
                  ))
                }
              </select>
              <button
                type="button"
                onClick={() => handleAddTestLocation(testLocationInput)}
                className="btn-add-location"
                disabled={!testLocationInput}
              >
                Add Location
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  const renderStep3 = () => (
    <div className="form-step">
      <h2 className="step-title">Vehicle Details</h2>
      <p className="step-description">Tell us about your vehicle</p>

      <div className="form-group">
        <label>Which transmission(s) do you offer? <span className="required">*</span></label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="transmissionOffered"
              value="auto"
              checked={formData.transmissionOffered === 'auto'}
              onChange={handleChange}
            />
            <span>Auto</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="transmissionOffered"
              value="manual"
              checked={formData.transmissionOffered === 'manual'}
              onChange={handleChange}
            />
            <span>Manual</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="transmissionOffered"
              value="both"
              checked={formData.transmissionOffered === 'both'}
              onChange={handleChange}
            />
            <span>Both Transmissions</span>
          </label>
        </div>
      </div>

      <div className="vehicle-details-section">
        <h3 className="section-heading">Vehicle Details</h3>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="vehicleTransmission">Transmission <span className="required">*</span></label>
            <select
              id="vehicleTransmission"
              name="vehicleTransmission"
              value={formData.vehicleTransmission}
              onChange={handleChange}
            >
              <option value="auto">Auto</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="vehicleRegistration">Vehicle registration number <span className="required">*</span></label>
            <input
              type="text"
              id="vehicleRegistration"
              name="vehicleRegistration"
              placeholder="e.g. 293kq2"
              value={formData.vehicleRegistration}
              onChange={handleChange}
              className={errors.vehicleRegistration ? 'error' : ''}
            />
            {errors.vehicleRegistration && <span className="error-message">{errors.vehicleRegistration}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="vehicleMake">Make <span className="required">*</span></label>
          <select
            id="vehicleMake"
            name="vehicleMake"
            value={formData.vehicleMake}
            onChange={handleChange}
            className={errors.vehicleMake ? 'error' : ''}
          >
            <option value="">Select make</option>
            {carMakes.map((make) => (
              <option key={make} value={make}>{make}</option>
            ))}
          </select>
          {errors.vehicleMake && <span className="error-message">{errors.vehicleMake}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="vehicleModel">Model <span className="required">*</span></label>
            <input
              type="text"
              id="vehicleModel"
              name="vehicleModel"
              placeholder="e.g. Corolla"
              value={formData.vehicleModel}
              onChange={handleChange}
              className={errors.vehicleModel ? 'error' : ''}
            />
            {errors.vehicleModel && <span className="error-message">{errors.vehicleModel}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="vehicleYear">Year <span className="required">*</span></label>
            <select
              id="vehicleYear"
              name="vehicleYear"
              value={formData.vehicleYear}
              onChange={handleChange}
              className={errors.vehicleYear ? 'error' : ''}
            >
              <option value="">Select year</option>
              {vehicleYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            {errors.vehicleYear && <span className="error-message">{errors.vehicleYear}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="ancapRating">ANCAP safety rating <span className="required">*</span></label>
          <select
            id="ancapRating"
            name="ancapRating"
            value={formData.ancapRating}
            onChange={handleChange}
            className={errors.ancapRating ? 'error' : ''}
          >
            <option value="">Select rating</option>
            {ancapRatings.map((rating) => (
              <option key={rating} value={rating}>{rating}</option>
            ))}
          </select>
          {errors.ancapRating && <span className="error-message">{errors.ancapRating}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="hasDualControls">Do you instruct with 'dual controls'? <span className="required">*</span></label>
          <select
            id="hasDualControls"
            name="hasDualControls"
            value={formData.hasDualControls}
            onChange={handleChange}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="vehiclePhoto">Vehicle Photo (Optional)</label>
          <div className="photo-upload">
            <input
              type="file"
              id="vehiclePhoto"
              accept="image/*"
              onChange={handleVehiclePhotoUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="vehiclePhoto" className="photo-upload-btn">
              {formData.vehiclePhoto ? formData.vehiclePhoto.name : 'Upload Vehicle Photo'}
            </label>
            <span className="field-note">Upload a photo of your vehicle (optional)</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="form-step">
      <h2 className="step-title">Your Profile</h2>
      <p className="step-description">This is the public profile information viewable by learners</p>

      <div className="form-group">
        <label htmlFor="profilePhoto">Profile Photo</label>
        <div className="photo-upload">
          <input
            type="file"
            id="profilePhoto"
            accept="image/*"
            onChange={handlePhotoUpload}
            style={{ display: 'none' }}
          />
          <label htmlFor="profilePhoto" className="photo-upload-btn">
            {formData.profilePhoto ? formData.profilePhoto.name : 'Choose Photo'}
          </label>
          <span className="field-note">Upload a professional photo for your profile</span>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="bio">Your Instructor Bio <span className="required">*</span></label>
        <textarea
          id="bio"
          name="bio"
          placeholder="Tell learners about yourself, your teaching style, and experience..."
          value={formData.bio}
          onChange={handleChange}
          className={errors.bio ? 'error' : ''}
          rows="8"
          maxLength="1600"
        />
        <div className="char-count">
          <span>{formData.bio.length} / 1600 characters</span>
        </div>
        {errors.bio && <span className="error-message">{errors.bio}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="languages">Languages you speak fluently <span className="required">*</span></label>
        <div className="language-tags">
          {formData.languages.map((lang, index) => (
            <span key={index} className="language-tag">
              {lang}
              <button
                type="button"
                onClick={() => handleRemoveLanguage(lang)}
                className="remove-tag"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="language-input-wrapper">
          <input
            type="text"
            value={languageInput}
            onChange={(e) => setLanguageInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddLanguage(languageInput);
              }
            }}
            placeholder="Type a language and press Enter"
            className={errors.languages ? 'error' : ''}
          />
          <button
            type="button"
            onClick={() => handleAddLanguage(languageInput)}
            className="btn-add-language"
          >
            Add
          </button>
        </div>
        {errors.languages && <span className="error-message">{errors.languages}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="memberOfAssociation">Member of a driving instructor association? <span className="required">*</span></label>
        <select
          id="memberOfAssociation"
          name="memberOfAssociation"
          value={formData.memberOfAssociation}
          onChange={handleChange}
        >
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
      </div>

      <div className="form-group">
        <label>When did you start instructing? <span className="required">*</span></label>
        <div className="form-row">
          <div className="form-group">
            <select
              name="startMonth"
              value={formData.startMonth}
              onChange={handleChange}
              className={errors.startMonth ? 'error' : ''}
            >
              <option value="">Select month</option>
              {months.map((month, index) => (
                <option key={index} value={month}>{month}</option>
              ))}
            </select>
            {errors.startMonth && <span className="error-message">{errors.startMonth}</span>}
          </div>
          <div className="form-group">
            <select
              name="startYear"
              value={formData.startYear}
              onChange={handleChange}
              className={errors.startYear ? 'error' : ''}
            >
              <option value="">Select year</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            {errors.startYear && <span className="error-message">{errors.startYear}</span>}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>What service(s) do you offer</label>
        <div className="services-list">
          {availableServices.map((service, index) => (
            <label key={index} className="checkbox-label service-checkbox">
              <input
                type="checkbox"
                checked={formData.services.includes(service)}
                onChange={() => handleServiceToggle(service)}
              />
              <span>{service}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-heading">Notification Preferences</h3>

        <div className="notification-group">
          <div className="notification-label">Email</div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="emailNotifications"
              checked={formData.emailNotifications}
              onChange={handleChange}
            />
            <span>Marketing Communications and special offers</span>
          </label>
        </div>

        <div className="notification-group">
          <div className="notification-label">SMS</div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="smsNotifications"
              checked={formData.smsNotifications}
              onChange={handleChange}
            />
            <span>Marketing Communications and special offers</span>
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3 className="section-heading">EEZYDRIVING Marketplace</h3>
        <div className="marketplace-toggle">
          <div className="toggle-info">
            <p>Your profile is discoverable by Learners on EEZYDRIVING marketplace search results.</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              name="marketplaceVisible"
              checked={formData.marketplaceVisible}
              onChange={handleChange}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="form-step">
      <h2 className="step-title">Personal Details</h2>
      <p className="step-description">Tell us about yourself</p>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="firstName">First Name <span className="required">*</span></label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            placeholder="John"
            value={formData.firstName}
            onChange={handleChange}
            className={errors.firstName ? 'error' : ''}
          />
          {errors.firstName && <span className="error-message">{errors.firstName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="preferredFirstName">Preferred First Name</label>
          <input
            type="text"
            id="preferredFirstName"
            name="preferredFirstName"
            placeholder="Optional"
            value={formData.preferredFirstName}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="lastName">Last Name <span className="required">*</span></label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          placeholder="Smith"
          value={formData.lastName}
          onChange={handleChange}
          className={errors.lastName ? 'error' : ''}
        />
        {errors.lastName && <span className="error-message">{errors.lastName}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="gender">Gender <span className="required">*</span></label>
        <select
          id="gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className={errors.gender ? 'error' : ''}
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non-binary">Non-binary</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>
        {errors.gender && <span className="error-message">{errors.gender}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email Address <span className="required">*</span></label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          className="input-readonly"
          readOnly
          disabled
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="phone">Phone Number <span className="required">*</span></label>
          <input
            type="tel"
            id="phone"
            name="phone"
            placeholder="0412 345 678"
            value={formData.phone}
            onChange={handleChange}
            className={errors.phone ? 'error' : ''}
          />
          {errors.phone && <span className="error-message">{errors.phone}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="postcode">Postcode <span className="required">*</span></label>
          <input
            type="text"
            id="postcode"
            name="postcode"
            placeholder="2150"
            maxLength="4"
            value={formData.postcode}
            onChange={handleChange}
            className={errors.postcode ? 'error' : ''}
          />
          {errors.postcode && <span className="error-message">{errors.postcode}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-container auth-container-single">
        <div className="auth-card auth-card-wide">
          <div className="auth-header">
            <h1>Complete Your Instructor Profile</h1>
            <p>Add your details to start receiving bookings</p>
          </div>

          {renderProgressBar()}

          <form onSubmit={handleSubmit} className="auth-form">
            {errors.general && (
              <div className="error-banner">
                {errors.general}
              </div>
            )}

            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
            {currentStep === 6 && renderStep6()}
            {currentStep === 7 && renderStep7()}

            <div className="form-actions">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-auth btn-secondary"
                >
                  Back
                </button>
              )}

              <button
                type="button"
                onClick={handleSkip}
                className="btn-auth btn-skip"
              >
                Skip for Now
              </button>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-auth btn-primary-auth"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn-auth btn-primary-auth"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Complete Profile'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteInstructorProfile;
