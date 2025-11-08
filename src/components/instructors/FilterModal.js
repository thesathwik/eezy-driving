import React, { useState, useEffect } from 'react';
import { instructors } from '../../data/instructors';
import './FilterModal.css';

const FilterModal = ({ isOpen, onClose, filters, onApplyFilters, currentInstructors }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [expandedSections, setExpandedSections] = useState({
    availability: true,
    advanced: false
  });

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  if (!isOpen) return null;

  // Calculate counts for each filter option
  const calculateCount = (filterType, filterValue) => {
    return instructors.filter(instructor => {
      // Apply all existing filters except the one we're calculating
      const testFilters = { ...localFilters };

      // Apply the filter we're testing
      if (filterType === 'availabilityDay') {
        testFilters.availabilityDay = [filterValue];
      } else if (filterType === 'availabilityTime') {
        testFilters.availabilityTime = [filterValue];
      } else if (filterType === 'gender') {
        testFilters.gender = [filterValue];
      } else if (filterType === 'language') {
        testFilters.languages = [filterValue];
      }

      // Location filter
      if (testFilters.location && testFilters.location.trim() !== '') {
        if (!instructor.location.toLowerCase().includes(testFilters.location.toLowerCase())) {
          return false;
        }
      }

      // Transmission filter
      if (testFilters.transmission && testFilters.transmission !== 'both') {
        const instructorTrans = instructor.transmission.toLowerCase();
        const searchTrans = testFilters.transmission.toLowerCase();
        const normalizeTransmission = (type) => {
          if (type.includes('auto')) return 'auto';
          if (type.includes('manual')) return 'manual';
          if (type === 'both') return 'both';
          return type;
        };
        const normalizedInstructor = normalizeTransmission(instructorTrans);
        const normalizedSearch = normalizeTransmission(searchTrans);
        if (!(normalizedInstructor === 'both' || normalizedInstructor === normalizedSearch)) {
          return false;
        }
      }

      // Availability day filter
      if (testFilters.availabilityDay && testFilters.availabilityDay.length > 0) {
        const hasMatch = testFilters.availabilityDay.some(day =>
          instructor.availabilityDays.includes(day)
        );
        if (!hasMatch) return false;
      }

      // Availability time filter
      if (testFilters.availabilityTime && testFilters.availabilityTime.length > 0) {
        const hasMatch = testFilters.availabilityTime.some(time =>
          instructor.availabilityTimes.includes(time)
        );
        if (!hasMatch) return false;
      }

      // Gender filter
      if (testFilters.gender && testFilters.gender.length > 0) {
        if (!testFilters.gender.includes(instructor.gender)) return false;
      }

      // Language filter
      if (testFilters.languages && testFilters.languages.length > 0) {
        const hasMatch = testFilters.languages.some(lang =>
          instructor.languages.includes(lang)
        );
        if (!hasMatch) return false;
      }

      return true;
    }).length;
  };

  const handleCheckboxChange = (filterType, value) => {
    setLocalFilters(prev => {
      const current = prev[filterType] || [];
      const newValue = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [filterType]: newValue };
    });
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({
      location: filters.location || '',
      transmission: filters.transmission || 'automatic',
      availabilityDay: [],
      availabilityTime: [],
      gender: [],
      languages: [],
      testCentre: '',
      testDate: ''
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get all unique languages
  const allLanguages = [...new Set(instructors.flatMap(i => i.languages))].sort();
  // Get all unique test centres
  const allTestCentres = [...new Set(instructors.flatMap(i => i.testCentres))].sort();

  return (
    <div className="filter-modal-overlay" onClick={onClose}>
      <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
        <div className="filter-modal-header">
          <div>
            <h2>Filters</h2>
            <p className="filter-subtitle">
              {filters.transmission === 'automatic' ? 'Auto' : filters.transmission === 'manual' ? 'Manual' : ''} Instructors in {filters.location || 'Sunnybank, QLD 4109'}
            </p>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="filter-modal-body">
          {/* Availability Section */}
          <div className="filter-section">
            <button
              className="filter-section-header"
              onClick={() => toggleSection('availability')}
            >
              <span>Availability</span>
              <span className="chevron">{expandedSections.availability ? '∧' : '∨'}</span>
            </button>

            {expandedSections.availability && (
              <div className="filter-section-content">
                <div className="filter-group">
                  <label className="filter-group-label">Day</label>

                  <label className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={(localFilters.availabilityDay || []).includes('weekday')}
                      onChange={() => handleCheckboxChange('availabilityDay', 'weekday')}
                    />
                    <span className="checkbox-label">
                      <span>Next 4 days</span>
                      <span className="count-badge">{calculateCount('availabilityDay', 'weekday')}</span>
                    </span>
                  </label>

                  <label className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={(localFilters.availabilityDay || []).includes('weekday')}
                      onChange={() => handleCheckboxChange('availabilityDay', 'weekday')}
                    />
                    <span className="checkbox-label">
                      <span>Next 7 days</span>
                      <span className="count-badge">{calculateCount('availabilityDay', 'weekday')}</span>
                    </span>
                  </label>

                  <label className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={(localFilters.availabilityDay || []).includes('weekend')}
                      onChange={() => handleCheckboxChange('availabilityDay', 'weekend')}
                    />
                    <span className="checkbox-label">
                      <span>Weekend (Saturday or Sunday)</span>
                      <span className="count-badge">{calculateCount('availabilityDay', 'weekend')}</span>
                    </span>
                  </label>

                  <label className="filter-checkbox">
                    <input
                      type="checkbox"
                      disabled
                    />
                    <span className="checkbox-label">
                      <span>Select dates</span>
                    </span>
                  </label>
                </div>

                <div className="filter-group">
                  <label className="filter-group-label">Time</label>

                  <label className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={(localFilters.availabilityTime || []).includes('AM')}
                      onChange={() => handleCheckboxChange('availabilityTime', 'AM')}
                    />
                    <span className="checkbox-label">
                      <span>AM</span>
                      <span className="count-badge">{calculateCount('availabilityTime', 'AM')}</span>
                    </span>
                  </label>

                  <label className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={(localFilters.availabilityTime || []).includes('PM')}
                      onChange={() => handleCheckboxChange('availabilityTime', 'PM')}
                    />
                    <span className="checkbox-label">
                      <span>PM</span>
                      <span className="count-badge">{calculateCount('availabilityTime', 'PM')}</span>
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Section */}
          <div className="filter-section">
            <button
              className="filter-section-header"
              onClick={() => toggleSection('advanced')}
            >
              <span>Advanced</span>
              <span className="chevron">{expandedSections.advanced ? '∧' : '∨'}</span>
            </button>

            {expandedSections.advanced && (
              <div className="filter-section-content">
                <div className="filter-group">
                  <label className="filter-group-label">Driving Test Location</label>
                  <p className="filter-group-sublabel">Test Date</p>
                  <select
                    className="filter-select"
                    value={localFilters.testDate || ''}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, testDate: e.target.value }))}
                  >
                    <option value=""></option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-group-label">Driving Test Centre</label>
                  <select
                    className="filter-select"
                    value={localFilters.testCentre || ''}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, testCentre: e.target.value }))}
                  >
                    <option value="">Select a driving test centre</option>
                    {allTestCentres.map(centre => (
                      <option key={centre} value={centre}>{centre}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-group-label">Instructor's Gender</label>

                  <label className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={(localFilters.gender || []).includes('Male')}
                      onChange={() => handleCheckboxChange('gender', 'Male')}
                    />
                    <span className="checkbox-label">
                      <span>Male</span>
                      <span className="count-badge">{calculateCount('gender', 'Male')}</span>
                    </span>
                  </label>

                  <label className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={(localFilters.gender || []).includes('Female')}
                      onChange={() => handleCheckboxChange('gender', 'Female')}
                    />
                    <span className="checkbox-label">
                      <span>Female</span>
                      <span className="count-badge">{calculateCount('gender', 'Female')}</span>
                    </span>
                  </label>

                  <label className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={(localFilters.gender || []).includes('Non-binary')}
                      onChange={() => handleCheckboxChange('gender', 'Non-binary')}
                    />
                    <span className="checkbox-label">
                      <span>Non-binary</span>
                    </span>
                  </label>
                </div>

                <div className="filter-group">
                  <label className="filter-group-label">Language</label>

                  {allLanguages.map(language => (
                    <label key={language} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={(localFilters.languages || []).includes(language)}
                        onChange={() => handleCheckboxChange('languages', language)}
                      />
                      <span className="checkbox-label">
                        <span>{language}</span>
                        <span className="count-badge">{calculateCount('language', language)}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="filter-modal-footer">
          <button className="btn-clear" onClick={handleClear}>Clear all</button>
          <button className="btn-apply" onClick={handleApply}>
            Show {currentInstructors.length} Instructors
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
