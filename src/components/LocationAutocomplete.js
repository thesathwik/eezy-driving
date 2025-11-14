import React, { useState, useRef, useCallback, useEffect } from 'react';

const LocationAutocomplete = ({ suburb, value, onChange, placeholder, className }) => {
  const [predictions, setPredictions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);

  // Initialize Google Places services
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();

      // Create a dummy element for PlacesService (it requires a map or div)
      const dummyElement = document.createElement('div');
      placesServiceRef.current = new window.google.maps.places.PlacesService(dummyElement);
    }
  }, []);

  // Fetch predictions when user types
  useEffect(() => {
    if (!value || !suburb || !autocompleteServiceRef.current) {
      setPredictions([]);
      return;
    }

    // Add suburb to the search query to filter results
    const searchQuery = `${value}, ${suburb}, VIC, Australia`;

    const request = {
      input: searchQuery,
      componentRestrictions: { country: 'au' },
      types: ['address']
    };

    autocompleteServiceRef.current.getPlacePredictions(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        // Filter results to only show addresses in the selected suburb
        const filteredResults = results.filter(result => {
          const description = result.description.toLowerCase();
          return description.includes(suburb.toLowerCase());
        });
        setPredictions(filteredResults);
        setShowDropdown(filteredResults.length > 0);
      } else {
        setPredictions([]);
        setShowDropdown(false);
      }
    });
  }, [value, suburb]);

  const handleSelect = (prediction) => {
    // Use the full formatted address from Google
    const fullAddress = prediction.description;

    onChange(fullAddress);
    setPredictions([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e) => {
    onChange(e.target.value);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < predictions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && predictions[selectedIndex]) {
          handleSelect(predictions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleBlur = () => {
    // Delay to allow mousedown on dropdown item to fire first
    setTimeout(() => {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }, 150);
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (predictions.length > 0) setShowDropdown(true);
        }}
        onBlur={handleBlur}
        placeholder={placeholder || 'Start typing your address...'}
        className={className}
        disabled={!suburb}
        autoComplete="off"
      />

      {showDropdown && predictions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          {predictions.map((prediction, index) => (
            <div
              key={prediction.place_id}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur from firing
                handleSelect(prediction);
              }}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                backgroundColor: index === selectedIndex ? '#f5f5f5' : 'white',
                borderBottom: index < predictions.length - 1 ? '1px solid #f0f0f0' : 'none',
                fontSize: '0.9375rem',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                if (index !== selectedIndex) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              {prediction.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
