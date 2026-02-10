import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import { API, getHeaders } from '../../config/api';
import './InstructorSettings.css';

const InstructorSettings = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [instructorProfile, setInstructorProfile] = useState(null);

  const [formData, setFormData] = useState({
    // Personal Details
    firstName: '',
    preferredFirstName: '',
    lastName: '',
    gender: '',
    email: '',
    phone: '',
    postcode: '',
    // Profile
    bio: '',
    languages: [],
    memberOfAssociation: false,
    instructingSince: { month: '', year: '' },
    // Vehicle
    transmissionOffered: '',
    vehicle: {
      registration: '',
      make: '',
      model: '',
      year: '',
      transmission: '',
      hasDualControls: false
    },
    // Service Area
    serviceArea: {
      suburbs: [],
      testLocations: []
    },
    // Calendar Settings
    calendarSettings: {
      travelBuffer: {
        sameTransmission: 15,
        differentTransmission: 30
      },
      syncedCalendarBuffer: 0,
      schedulingWindow: {
        minNotice: 3,
        maxAdvance: 90
      },
      smartScheduling: {
        enabled: true,
        slotDuration: 1
      },
      syncedCalendarVisibility: 'hide',
      attachCalendarEvent: false,
      defaultCalendarView: 'day'
    },
    // Opening Hours
    openingHours: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    },
    // Pricing
    pricing: {
      marketplaceLessonRate: '',
      privateLessonRate: '',
      marketplaceTestPackageRate: '',
      privateTestPackageRate: ''
    },
    // Banking
    banking: {
      businessName: '',
      abn: '',
      billingAddress: '',
      registeredForGST: false,
      suburb: '',
      postcode: '',
      state: '',
      payoutFrequency: '',
      accountName: '',
      bsb: '',
      accountNumber: ''
    }
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchInstructorProfile();
  }, []);

  const fetchInstructorProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API.instructors.list}/profile/me`, {
        headers: getHeaders(true)
      });

      const data = await response.json();

      console.log('Profile API Response:', data);

      if (data.success && data.data) {
        const profile = data.data;
        console.log('Instructor Profile Data:', profile);
        setInstructorProfile(profile);

        // Populate form with profile data
        setFormData({
          firstName: profile.user?.firstName || '',
          preferredFirstName: profile.preferredFirstName || '',
          lastName: profile.user?.lastName || '',
          gender: profile.gender || '',
          email: profile.user?.email || '',
          phone: profile.user?.phone || '',
          postcode: profile.postcode || '',
          bio: profile.bio || '',
          languages: profile.languages || [],
          memberOfAssociation: profile.memberOfAssociation || false,
          instructingSince: profile.instructingSince || { month: '', year: '' },
          transmissionOffered: profile.transmissionOffered || '',
          vehicle: profile.vehicle || {},
          serviceArea: profile.serviceArea || { suburbs: [], testLocations: [] },
          calendarSettings: profile.calendarSettings || {
            travelBuffer: { sameTransmission: 15, differentTransmission: 30 },
            syncedCalendarBuffer: 0,
            schedulingWindow: { minNotice: 3, maxAdvance: 90 },
            smartScheduling: { enabled: true, slotDuration: 1 },
            syncedCalendarVisibility: 'hide',
            attachCalendarEvent: false,
            defaultCalendarView: 'day'
          },
          openingHours: profile.openingHours || {},
          pricing: profile.pricing || {},
          banking: profile.banking || {}
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const tabs = [
    { id: 'personal', label: 'Personal Details' },
    { id: 'profile', label: 'Profile' },
    { id: 'vehicle', label: 'Vehicles' },
    { id: 'service-area', label: 'Service Area' },
    { id: 'hours', label: 'Opening Hours' },
    { id: 'calendar', label: 'Calendar Settings' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'banking', label: 'Banking' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleCalendarSettingsChange = (path, value) => {
    setFormData(prev => {
      const newSettings = { ...prev.calendarSettings };
      const parts = path.split('.');
      if (parts.length === 1) {
        newSettings[parts[0]] = value;
      } else if (parts.length === 2) {
        newSettings[parts[0]] = { ...newSettings[parts[0]], [parts[1]]: value };
      }
      return { ...prev, calendarSettings: newSettings };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API.instructors.list}/profile/me`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Settings saved successfully!');
        fetchInstructorProfile(); // Refresh data
      } else {
        alert(data.message || 'Failed to save settings');
      }
      setSaving(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <DashboardSidebar />
        <div className="dashboard-main settings-page">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <DashboardSidebar />

      <div className="dashboard-main settings-page">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span className="breadcrumb-item">Settings</span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-item active">
            {tabs.find(t => t.id === activeTab)?.label}
          </span>
        </div>

        {/* Page Title */}
        <h1 className="settings-title">
          {tabs.find(t => t.id === activeTab)?.label}
        </h1>

        {/* Horizontal Tabs */}
        <div className="settings-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="settings-content-area">
          {activeTab === 'personal' && (
            <div className="settings-section">
              <div className="section-content">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="firstName">
                      <span className="required-star">*</span> First name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="preferredFirstName">Preferred first name</label>
                    <input
                      type="text"
                      id="preferredFirstName"
                      name="preferredFirstName"
                      value={formData.preferredFirstName}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="lastName">
                    <span className="required-star">*</span> Last name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="gender">
                    <span className="required-star">*</span> Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="email">
                    <span className="required-star">*</span> Email address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    className="form-input"
                    disabled
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="0412 345 678"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="postcode">
                      <span className="required-star">*</span> Postcode
                    </label>
                    <input
                      type="text"
                      id="postcode"
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="2150"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-save" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="settings-section">
              <div className="section-content">
                <div className="form-group full-width">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    className="form-textarea"
                    rows="6"
                    placeholder="Tell learners about yourself..."
                  />
                </div>

                <div className="form-group full-width">
                  <label>Languages</label>
                  <div className="tags-display">
                    {formData.languages && formData.languages.length > 0 ? (
                      formData.languages.map((lang, index) => (
                        <span key={index} className="tag">{lang}</span>
                      ))
                    ) : (
                      <p className="empty-text">No languages specified</p>
                    )}
                  </div>
                </div>

                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="memberOfAssociation"
                      checked={formData.memberOfAssociation}
                      onChange={handleChange}
                    />
                    <span>Member of driving instructor association</span>
                  </label>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Instructing Since Month</label>
                    <input
                      type="text"
                      value={formData.instructingSince?.month || ''}
                      className="form-input"
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label>Instructing Since Year</label>
                    <input
                      type="text"
                      value={formData.instructingSince?.year || ''}
                      className="form-input"
                      disabled
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-save" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vehicle' && (
            <div className="settings-section">
              <div className="section-content">
                <div className="form-group full-width">
                  <label>Transmission Offered</label>
                  <select
                    name="transmissionOffered"
                    value={formData.transmissionOffered}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select transmission</option>
                    <option value="auto">Automatic</option>
                    <option value="manual">Manual</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Vehicle Registration</label>
                    <input
                      type="text"
                      name="vehicle.registration"
                      value={formData.vehicle?.registration || ''}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Vehicle Make</label>
                    <input
                      type="text"
                      name="vehicle.make"
                      value={formData.vehicle?.make || ''}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Vehicle Model</label>
                    <input
                      type="text"
                      name="vehicle.model"
                      value={formData.vehicle?.model || ''}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Vehicle Year</label>
                    <input
                      type="text"
                      name="vehicle.year"
                      value={formData.vehicle?.year || ''}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="vehicle.hasDualControls"
                      checked={formData.vehicle?.hasDualControls || false}
                      onChange={handleChange}
                    />
                    <span>Vehicle has dual controls</span>
                  </label>
                </div>

                <div className="form-actions">
                  <button className="btn-save" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'service-area' && (
            <div className="settings-section">
              <div className="section-content">
                <div className="form-group full-width">
                  <label>Service Suburbs</label>
                  <div className="tags-display">
                    {formData.serviceArea?.suburbs && formData.serviceArea.suburbs.length > 0 ? (
                      formData.serviceArea.suburbs.map((suburb, index) => (
                        <span key={index} className="tag">{suburb}</span>
                      ))
                    ) : (
                      <p className="empty-text">No suburbs specified</p>
                    )}
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Test Locations</label>
                  <div className="tags-display">
                    {formData.serviceArea?.testLocations && formData.serviceArea.testLocations.length > 0 ? (
                      formData.serviceArea.testLocations.map((location, index) => (
                        <span key={index} className="tag">{location}</span>
                      ))
                    ) : (
                      <p className="empty-text">No test locations specified</p>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-save" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hours' && (
            <div className="settings-section">
              <div className="section-content">
                <p className="section-description">Set your weekly availability schedule</p>

                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                  const dayHours = formData.openingHours?.[day] || [];

                  return (
                    <div key={day} className="hours-row">
                      <label className="day-label">{day.charAt(0).toUpperCase() + day.slice(1)}</label>
                      <div className="hours-inputs">
                        {dayHours.length > 0 ? (
                          dayHours.map((slot, index) => (
                            <div key={index} className="time-slot-input">
                              <input
                                type="time"
                                value={slot.startTime || ''}
                                onChange={(e) => {
                                  const newHours = { ...formData.openingHours };
                                  if (!newHours[day]) newHours[day] = [];
                                  newHours[day][index] = { ...newHours[day][index], startTime: e.target.value };
                                  setFormData({ ...formData, openingHours: newHours });
                                }}
                                className="time-input"
                              />
                              <span className="time-separator">-</span>
                              <input
                                type="time"
                                value={slot.endTime || ''}
                                onChange={(e) => {
                                  const newHours = { ...formData.openingHours };
                                  if (!newHours[day]) newHours[day] = [];
                                  newHours[day][index] = { ...newHours[day][index], endTime: e.target.value };
                                  setFormData({ ...formData, openingHours: newHours });
                                }}
                                className="time-input"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newHours = { ...formData.openingHours };
                                  newHours[day] = newHours[day].filter((_, i) => i !== index);
                                  setFormData({ ...formData, openingHours: newHours });
                                }}
                                className="btn-remove-slot"
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        ) : (
                          <span className="empty-text">Closed</span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const newHours = { ...formData.openingHours };
                            if (!newHours[day]) newHours[day] = [];
                            newHours[day].push({ startTime: '09:00', endTime: '17:00' });
                            setFormData({ ...formData, openingHours: newHours });
                          }}
                          className="btn-add-slot"
                        >
                          + Add hours
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="form-actions">
                  <button className="btn-save" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="settings-section">
              <div className="section-content">
                <p className="section-description">Configure your scheduling preferences and calendar behavior.</p>

                {/* Travel Buffer */}
                <div className="calendar-section">
                  <h3 className="calendar-section-title">Travel Buffer</h3>
                  <p className="calendar-section-desc">Add buffer time between bookings to allow for travel.</p>

                  <div className="calendar-row">
                    <label>Same transmission</label>
                    <select
                      value={formData.calendarSettings?.travelBuffer?.sameTransmission || 15}
                      onChange={(e) => handleCalendarSettingsChange('travelBuffer.sameTransmission', parseInt(e.target.value))}
                      className="form-select"
                    >
                      {[15, 30, 45, 60, 75, 90, 105, 120].map(v => (
                        <option key={v} value={v}>{v} minutes</option>
                      ))}
                    </select>
                  </div>

                  <div className="calendar-row">
                    <label>Different transmission</label>
                    <select
                      value={formData.calendarSettings?.travelBuffer?.differentTransmission || 30}
                      onChange={(e) => handleCalendarSettingsChange('travelBuffer.differentTransmission', parseInt(e.target.value))}
                      className="form-select"
                    >
                      {[15, 30, 45, 60, 75, 90, 105, 120].map(v => (
                        <option key={v} value={v}>{v} minutes</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Synced Calendar Events Buffer */}
                <div className="calendar-section">
                  <h3 className="calendar-section-title">Synced Calendar Events</h3>
                  <p className="calendar-section-desc">Add buffer time around events from synced calendars.</p>

                  <div className="calendar-row">
                    <label>Buffer around synced events</label>
                    <select
                      value={formData.calendarSettings?.syncedCalendarBuffer || 0}
                      onChange={(e) => handleCalendarSettingsChange('syncedCalendarBuffer', parseInt(e.target.value))}
                      className="form-select"
                    >
                      <option value={0}>None</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                    </select>
                  </div>
                </div>

                {/* Scheduling Window */}
                <div className="calendar-section">
                  <h3 className="calendar-section-title">Scheduling Window</h3>
                  <p className="calendar-section-desc">Control how soon and how far in advance learners can book.</p>

                  <div className="calendar-row">
                    <label>Minimum notice</label>
                    <select
                      value={formData.calendarSettings?.schedulingWindow?.minNotice || 3}
                      onChange={(e) => handleCalendarSettingsChange('schedulingWindow.minNotice', parseInt(e.target.value))}
                      className="form-select"
                    >
                      <option value={3}>3 hours</option>
                      <option value={5}>5 hours</option>
                      <option value={12}>12 hours</option>
                      <option value={24}>1 day</option>
                      <option value={48}>2 days</option>
                    </select>
                  </div>

                  <div className="calendar-row">
                    <label>Maximum advance booking</label>
                    <select
                      value={formData.calendarSettings?.schedulingWindow?.maxAdvance || 90}
                      onChange={(e) => handleCalendarSettingsChange('schedulingWindow.maxAdvance', parseInt(e.target.value))}
                      className="form-select"
                    >
                      <option value={75}>75 days</option>
                      <option value={90}>90 days</option>
                    </select>
                  </div>
                </div>

                {/* Smart Scheduling */}
                <div className="calendar-section">
                  <h3 className="calendar-section-title">Smart Scheduling</h3>
                  <p className="calendar-section-desc">Intelligently group bookings to minimise gaps in your schedule.</p>

                  <div className="toggle-row">
                    <label className="toggle-switch smart-scheduling-toggle">
                      <input
                        type="checkbox"
                        checked={formData.calendarSettings?.smartScheduling?.enabled ?? true}
                        onChange={(e) => handleCalendarSettingsChange('smartScheduling.enabled', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span>{formData.calendarSettings?.smartScheduling?.enabled ? 'Enabled' : 'Disabled'}</span>
                  </div>

                  {formData.calendarSettings?.smartScheduling?.enabled && (
                    <div className="calendar-row">
                      <label>Slot duration</label>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <label className="radio-label" style={{ padding: '8px 16px' }}>
                          <input
                            type="radio"
                            checked={formData.calendarSettings?.smartScheduling?.slotDuration === 1}
                            onChange={() => handleCalendarSettingsChange('smartScheduling.slotDuration', 1)}
                          />
                          <span>1 hour</span>
                        </label>
                        <label className="radio-label" style={{ padding: '8px 16px' }}>
                          <input
                            type="radio"
                            checked={formData.calendarSettings?.smartScheduling?.slotDuration === 2}
                            onChange={() => handleCalendarSettingsChange('smartScheduling.slotDuration', 2)}
                          />
                          <span>2 hours</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Synced Calendar Visibility */}
                <div className="calendar-section">
                  <h3 className="calendar-section-title">Synced Calendar Visibility</h3>
                  <p className="calendar-section-desc">Show or hide synced calendar event details on your booking calendar.</p>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label className="radio-label" style={{ flex: 1 }}>
                      <input
                        type="radio"
                        checked={formData.calendarSettings?.syncedCalendarVisibility === 'show'}
                        onChange={() => handleCalendarSettingsChange('syncedCalendarVisibility', 'show')}
                      />
                      <span>Show</span>
                    </label>
                    <label className="radio-label" style={{ flex: 1 }}>
                      <input
                        type="radio"
                        checked={formData.calendarSettings?.syncedCalendarVisibility === 'hide'}
                        onChange={() => handleCalendarSettingsChange('syncedCalendarVisibility', 'hide')}
                      />
                      <span>Hide</span>
                    </label>
                  </div>
                </div>

                {/* Attach Calendar Event */}
                <div className="calendar-section">
                  <h3 className="calendar-section-title">Attach Calendar Event</h3>
                  <p className="calendar-section-desc">Attach a calendar event (.ics) to booking confirmation emails.</p>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label className="radio-label" style={{ flex: 1 }}>
                      <input
                        type="radio"
                        checked={formData.calendarSettings?.attachCalendarEvent === true}
                        onChange={() => handleCalendarSettingsChange('attachCalendarEvent', true)}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="radio-label" style={{ flex: 1 }}>
                      <input
                        type="radio"
                        checked={formData.calendarSettings?.attachCalendarEvent === false}
                        onChange={() => handleCalendarSettingsChange('attachCalendarEvent', false)}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                {/* Default Calendar View */}
                <div className="calendar-section">
                  <h3 className="calendar-section-title">Default Calendar View</h3>
                  <p className="calendar-section-desc">Choose the default view when you open your calendar.</p>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    {[
                      { value: 'day', label: 'Day' },
                      { value: 'week', label: 'Week' },
                      { value: 'month', label: 'Month' }
                    ].map(opt => (
                      <label key={opt.value} className="radio-label" style={{ flex: 1 }}>
                        <input
                          type="radio"
                          checked={formData.calendarSettings?.defaultCalendarView === opt.value}
                          onChange={() => handleCalendarSettingsChange('defaultCalendarView', opt.value)}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-save" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="settings-section">
              <div className="section-content">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Marketplace Lesson Rate</label>
                    <input
                      type="text"
                      name="pricing.marketplaceLessonRate"
                      value={formData.pricing?.marketplaceLessonRate || ''}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="$82.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Private Lesson Rate</label>
                    <input
                      type="text"
                      name="pricing.privateLessonRate"
                      value={formData.pricing?.privateLessonRate || ''}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="$80.00"
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Marketplace Test Package Rate</label>
                    <input
                      type="text"
                      name="pricing.marketplaceTestPackageRate"
                      value={formData.pricing?.marketplaceTestPackageRate || ''}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="$225.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Private Test Package Rate</label>
                    <input
                      type="text"
                      name="pricing.privateTestPackageRate"
                      value={formData.pricing?.privateTestPackageRate || ''}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="$225.00"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-save" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'banking' && (
            <div className="settings-section">
              <div className="section-content">
                <div className="form-group full-width">
                  <label>Business Name</label>
                  <input
                    type="text"
                    name="banking.businessName"
                    value={formData.banking?.businessName || ''}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group full-width">
                  <label>ABN</label>
                  <input
                    type="text"
                    name="banking.abn"
                    value={formData.banking?.abn || ''}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="banking.registeredForGST"
                      checked={formData.banking?.registeredForGST || false}
                      onChange={handleChange}
                    />
                    <span>Registered for GST</span>
                  </label>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Account Name</label>
                    <input
                      type="text"
                      name="banking.accountName"
                      value={formData.banking?.accountName || ''}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>BSB</label>
                    <input
                      type="text"
                      name="banking.bsb"
                      value={formData.banking?.bsb || ''}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Account Number</label>
                  <input
                    type="text"
                    name="banking.accountNumber"
                    value={formData.banking?.accountNumber || ''}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-actions">
                  <button className="btn-save" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorSettings;
