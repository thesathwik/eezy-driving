import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FaStar, FaCalendar, FaDollarSign, FaBolt,
  FaUserFriends, FaSlidersH, FaSort, FaHome
} from 'react-icons/fa';
import InstructorCard from '../components/instructors/InstructorCard';
import FilterModal from '../components/instructors/FilterModal';
import { instructors, filterInstructors } from '../data/instructors';
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
  const [filteredInstructors, setFilteredInstructors] = useState(instructors);
  const [sortBy, setSortBy] = useState('');
  const [quickFilter, setQuickFilter] = useState('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  useEffect(() => {
    if (location.state) {
      const newFilters = {
        ...filters,
        location: location.state.location || '',
        transmission: location.state.transmission || 'automatic'
      };
      setFilters(newFilters);
      applyFilters(newFilters);
    }
  }, [location.state]);

  const applyFilters = (filterData, sort = sortBy, quick = quickFilter) => {
    let filtered = filterInstructors(filterData);

    // Apply quick filters
    if (quick === 'rating') {
      filtered = filtered.filter(i => i.rating >= 4.8);
    } else if (quick === 'available') {
      filtered = filtered.sort((a, b) => a.nextAvailableDate - b.nextAvailableDate);
    } else if (quick === 'price') {
      filtered = filtered.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (quick === 'soon') {
      const fourDaysFromNow = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(i => i.nextAvailableDate <= fourDaysFromNow);
    } else if (quick === 'female') {
      filtered = filtered.filter(i => i.gender === 'Female');
    }

    // Apply sorting
    if (sort === 'rating') {
      filtered = filtered.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'price-low') {
      filtered = filtered.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (sort === 'price-high') {
      filtered = filtered.sort((a, b) => b.pricePerHour - a.pricePerHour);
    } else if (sort === 'experience') {
      filtered = filtered.sort((a, b) => b.experience - a.experience);
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
    ? Math.min(...filteredInstructors.map(i => i.pricePerHour))
    : 0;

  // Count instructors for quick filters
  const getQuickFilterCount = (filterType) => {
    let filtered = filterInstructors(filters);

    if (filterType === 'rating') {
      return filtered.filter(i => i.rating >= 4.8).length;
    } else if (filterType === 'soon') {
      const fourDaysFromNow = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
      return filtered.filter(i => i.nextAvailableDate <= fourDaysFromNow).length;
    } else if (filterType === 'female') {
      return filtered.filter(i => i.gender === 'Female').length;
    }
    return filtered.length;
  };

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
          {filteredInstructors.length > 0 && (
            <p className="results-price">from ${minPrice.toFixed(2)}/hr</p>
          )}
        </div>

        {/* Instructors Grid */}
        <div className="instructors-grid">
          {filteredInstructors.length > 0 ? (
            filteredInstructors.map(instructor => (
              <InstructorCard key={instructor.id} instructor={instructor} />
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
