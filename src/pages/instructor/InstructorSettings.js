import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import './InstructorSettings.css';

const InstructorSettings = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'personal');
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    preferredFirstName: '',
    lastName: user?.lastName || '',
    gender: '',
    email: user?.email || '',
    phone: user?.phone || '',
    postcode: ''
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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
    { id: 'calendar-settings', label: 'Calendar Settings' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'documents', label: 'Documents' },
    { id: 'banking', label: 'Banking' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // TODO: Save to backend
    console.log('Saving data:', formData);
  };

  return (
    <div className="dashboard-page">
      <DashboardSidebar />

      <div className="dashboard-main settings-page">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span className="breadcrumb-icon">🏠</span>
          <span className="breadcrumb-separator">›</span>
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
              <div className="section-header">
                <h2>Personal Details</h2>
              </div>

              <div className="section-content">
                <div className="section-intro">
                  <h3>Personal info</h3>
                  <p>Provide personal details and how we can reach you.</p>
                </div>

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
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="email">
                    <span className="required-star">*</span> Email address
                  </label>
                  <div className="input-with-icon">
                    <span className="input-icon">✉</span>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      className="form-input with-icon"
                      disabled
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="phone">
                      <span className="required-star">*</span> Phone Number
                    </label>
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
                  <button className="btn-save" onClick={handleSave}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Profile</h2>
              </div>
              <div className="section-content">
                <p>Profile settings content coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === 'vehicle' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Vehicle Details</h2>
              </div>
              <div className="section-content">
                <p>Vehicle details content coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === 'service-area' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Service Area</h2>
              </div>
              <div className="section-content">
                <p>Service area content coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === 'hours' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Opening Hours</h2>
              </div>
              <div className="section-content">
                <p>Opening hours content coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === 'calendar-settings' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Calendar Settings</h2>
              </div>
              <div className="section-content">
                <p>Calendar settings content coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Pricing</h2>
              </div>
              <div className="section-content">
                <p>Pricing content coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Documents</h2>
              </div>
              <div className="section-content">
                <p>Documents content coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === 'banking' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Banking Information</h2>
              </div>
              <div className="section-content">
                <p>Banking information content coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstructorSettings;
