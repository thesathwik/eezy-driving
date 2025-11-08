import React, { useState, useEffect, useRef } from 'react';
import { searchLocations, formatLocation } from '../../data/locations';
import './LocationAutocomplete.css';

const LocationAutocomplete = ({ value, onChange, placeholder, name, required }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(e);

    if (inputValue.length >= 2) {
      const results = searchLocations(inputValue);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setActiveSuggestion(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (location) => {
    const formattedLocation = formatLocation(location);
    onChange({ target: { name, value: formattedLocation } });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && activeSuggestion >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[activeSuggestion]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="location-autocomplete" ref={wrapperRef}>
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />

      {showSuggestions && suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((location, index) => (
            <li
              key={`${location.suburb}-${location.postcode}`}
              className={`suggestion-item ${index === activeSuggestion ? 'active' : ''}`}
              onClick={() => handleSuggestionClick(location)}
              onMouseEnter={() => setActiveSuggestion(index)}
            >
              <div className="suggestion-main">
                <span className="suggestion-suburb">{location.suburb}</span>
                <span className="suggestion-state">{location.state}</span>
              </div>
              <span className="suggestion-postcode">{location.postcode}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationAutocomplete;
