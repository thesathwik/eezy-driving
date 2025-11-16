import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FaStar, FaCalendar, FaDollarSign, FaBolt,
  FaUserFriends, FaSlidersH, FaSort, FaHome
} from 'react-icons/fa';
import InstructorCard from '../components/instructors/InstructorCard';
import FilterModal from '../components/instructors/FilterModal';
import { getHeaders } from '../config/api';
import './Instructors.css';

const Instructors = () => {
  const location = useLocation();
  const [filters, setFilters] = useState({
    location: '',
    transmission: 'automatic',
    availabilityDay: [],
    availabilityTime: [],
    gender: [],
    languages: [],
    testCentre: '',
    testDate: ''
  });
  const [instructors, setInstructors] = useState([]);
  const [filteredInstructors, setFilteredInstructors] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [quickFilter, setQuickFilter] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch instructors from API
  useEffect(() => {
    fetchInstructors();
  }, []);

  // Apply filters when location state changes or instructors are loaded
  useEffect(() => {
    if (location.state && instructors.length > 0) {
      const newFilters = {
        ...filters,
        location: location.state.location || '',
        transmission: location.state.transmission || 'automatic'
      };
      setFilters(newFilters);
      applyFilters(newFilters);
    }
  }, [location.state, instructors]);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_URL}/instructors`, {
        headers: getHeaders(false)
      });

      const data = await response.json();

      if (data.success) {
        setInstructors(data.data);
        setFilteredInstructors(data.data);
      } else {
        setError(data.message || 'Failed to load instructors');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching instructors:', err);
      setError('Failed to load instructors. Please try again.');
      setLoading(false);
    }
  };

  const applyFilters = (filterData, sort = sortBy, quick = quickFilter) => {
    let filtered = [...instructors];

    // Location filter (suburb)
    if (filterData.location && filterData.location.trim() !== '') {
      const searchLocation = filterData.location.toLowerCase().trim();

      filtered = filtered.filter(instructor => {
        const suburbs = instructor.serviceArea?.suburbs || [];
        return suburbs.some(suburb => {
          const suburbLower = suburb.toLowerCase().trim();
          return suburbLower.includes(searchLocation) || searchLocation.includes(suburbLower);
        });
      });
    }

    // Transmission filter
    if (filterData.transmission && filterData.transmission !== 'both') {
      const searchTransmission = filterData.transmission.toLowerCase();
      filtered = filtered.filter(instructor => {
        const offered = instructor.vehicle?.transmissionOffered || [];
        return offered.includes(searchTransmission) || offered.includes('both');
      });
    }

    // Gender filter
    if (filterData.gender && filterData.gender.length > 0) {
      filtered = filtered.filter(instructor =>
        filterData.gender.includes(instructor.profileInfo?.gender)
      );
    }

    // Languages filter
    if (filterData.languages && filterData.languages.length > 0) {
      filtered = filtered.filter(instructor => {
        const instructorLanguages = instructor.profileInfo?.languagesSpoken || [];
        return filterData.languages.some(lang => instructorLanguages.includes(lang));
      });
    }

    // Availability day filter
    if (filterData.availabilityDay && filterData.availabilityDay.length > 0) {
      filtered = filtered.filter(instructor => {
        const availableDays = Object.keys(instructor.openingHours || {})
          .filter(day => instructor.openingHours[day]?.isOpen);

        return filterData.availabilityDay.some(day => {
          if (day === 'weekday') {
            return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].some(d => availableDays.includes(d));
          } else if (day === 'weekend') {
            return ['saturday', 'sunday'].some(d => availableDays.includes(d));
          }
          return availableDays.includes(day.toLowerCase());
        });
      });
    }

    // Apply quick filters
    if (quick === 'rating') {
      filtered = filtered.filter(i => (i.stats?.averageRating || 0) >= 4.8);
    } else if (quick === 'price') {
      filtered = filtered.sort((a, b) =>
        (a.pricing?.marketplaceLessonRate || 0) - (b.pricing?.marketplaceLessonRate || 0)
      );
    } else if (quick === 'female') {
      filtered = filtered.filter(i => i.profileInfo?.gender === 'Female');
    }

    // Apply sorting
    if (sort === 'rating') {
      filtered = filtered.sort((a, b) =>
        (b.stats?.averageRating || 0) - (a.stats?.averageRating || 0)
      );
    } else if (sort === 'price-low') {
      filtered = filtered.sort((a, b) =>
        (a.pricing?.marketplaceLessonRate || 0) - (b.pricing?.marketplaceLessonRate || 0)
      );
    } else if (sort === 'price-high') {
      filtered = filtered.sort((a, b) =>
        (b.pricing?.marketplaceLessonRate || 0) - (a.pricing?.marketplaceLessonRate || 0)
      );
    } else if (sort === 'experience') {
      filtered = filtered.sort((a, b) =>
        (b.profileInfo?.yearsExperience || 0) - (a.profileInfo?.yearsExperience || 0)
      );
    }

    setFilteredInstructors(filtered);
  };

  const handleQuickFilterClick = (filterType) => {
    const newQuickFilter = quickFilter === filterType ? '' : filterType;
    setQuickFilter(newQuickFilter);
    applyFilters(filters, sortBy, newQuickFilter);
  };

  const handleSortChange = (sortType) => {
    setSortBy(sortType);
    setIsSortMenuOpen(false);
    applyFilters(filters, sortType, quickFilter);
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    applyFilters(newFilters, sortBy, quickFilter);
  };

  const minPrice = filteredInstructors.length > 0
    ? Math.min(...filteredInstructors.map(i => i.pricing?.marketplaceLessonRate || 0))
    : 0;

  // Count instructors for quick filters
  const getQuickFilterCount = (filterType) => {
    let filtered = [...instructors];

    if (filterType === 'rating') {
      return filtered.filter(i => (i.stats?.averageRating || 0) >= 4.8).length;
    } else if (filterType === 'female') {
      return filtered.filter(i => i.profileInfo?.gender === 'Female').length;
    }
    return filtered.length;
  };

  if (loading) {
    return (
      <div className="instructors-page-ez">
        <div className="container-ez">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading instructors...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="instructors-page-ez">
        <div className="container-ez">
          <div className="error-state">
            <p>{error}</p>
            <button className="btn-retry" onClick={fetchInstructors}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="instructors-page-ez">
      <div className="container-ez">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span className="breadcrumb-item"><FaHome /></span>
          <span className="breadcrumb-separator">›</span>
          <span className="breadcrumb-item">Search</span>
          {filters.location && (
            <>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item">{filters.location}</span>
            </>
          )}
        </div>

        {/* Quick Filters */}
        <div className="quick-filters">
          <button
            className={`filter-btn ${quickFilter === 'rating' ? 'active' : ''}`}
            onClick={() => handleQuickFilterClick('rating')}
          >
            <FaStar /> Highest Rated
          </button>
          <button
            className={`filter-btn ${quickFilter === 'available' ? 'active' : ''}`}
            onClick={() => handleQuickFilterClick('available')}
          >
            <FaCalendar /> Next Available
          </button>
          <button
            className={`filter-btn ${quickFilter === 'price' ? 'active' : ''}`}
            onClick={() => handleQuickFilterClick('price')}
          >
            <FaDollarSign /> Lowest Price
          </button>
          <button
            className={`filter-btn ${quickFilter === 'soon' ? 'active' : ''}`}
            onClick={() => handleQuickFilterClick('soon')}
          >
            <FaBolt /> Available Next 4 Days
          </button>
          <button
            className={`filter-btn ${quickFilter === 'female' ? 'active' : ''}`}
            onClick={() => handleQuickFilterClick('female')}
          >
            <FaUserFriends /> Female Instructor
          </button>

          <div className="filters-right">
            <button className="btn-filters" onClick={() => setIsFilterModalOpen(true)}>
              <FaSlidersH /> Filters
            </button>
            <div className="sort-dropdown">
              <button className="btn-sort" onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}>
                <FaSort /> Sort
              </button>
              {isSortMenuOpen && (
                <div className="sort-menu">
                  <button onClick={() => handleSortChange('rating')}>Highest Rated</button>
                  <button onClick={() => handleSortChange('price-low')}>Price: Low to High</button>
                  <button onClick={() => handleSortChange('price-high')}>Price: High to Low</button>
                  <button onClick={() => handleSortChange('experience')}>Most Experienced</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="results-heading">
          <h1>
            {filteredInstructors.length} {filters.transmission === 'automatic' ? 'Auto' : filters.transmission === 'manual' ? 'Manual' : ''} Instructors
            {filters.location && ` in ${filters.location}`}
          </h1>
          {filteredInstructors.length > 0 && minPrice > 0 && (
            <p className="results-price">from ${minPrice.toFixed(2)}/hr</p>
          )}
        </div>

        {/* Instructors Grid */}
        <div className="instructors-grid">
          {filteredInstructors.length > 0 ? (
            filteredInstructors.map(instructor => (
              <InstructorCard key={instructor._id} instructor={instructor} />
            ))
          ) : (
            <div className="no-results">
              <h3>No instructors found</h3>
              <p>Try adjusting your filters or search in a different area.</p>
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        currentInstructors={filteredInstructors}
      />
    </div>
  );
};

export default Instructors;
