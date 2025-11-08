import React from 'react';
import { GoogleMap, LoadScript, Polygon } from '@react-google-maps/api';

const ServiceAreaMap = ({ location }) => {
  // Map center coordinates (Brisbane area)
  const center = {
    lat: -27.6,
    lng: 152.8
  };

  // Service area polygon coordinates (yellow highlighted area)
  // This creates a polygon around the Ipswich/Springfield area
  const serviceAreaCoords = [
    { lat: -27.55, lng: 152.65 },
    { lat: -27.55, lng: 152.95 },
    { lat: -27.75, lng: 152.95 },
    { lat: -27.75, lng: 152.65 },
  ];

  const polygonOptions = {
    fillColor: '#ffc107',
    fillOpacity: 0.35,
    strokeColor: '#ffb300',
    strokeOpacity: 0.8,
    strokeWeight: 2,
  };

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '8px'
  };

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
  };

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={10}
        options={mapOptions}
      >
        <Polygon
          paths={serviceAreaCoords}
          options={polygonOptions}
        />
      </GoogleMap>
    </LoadScript>
  );
};

export default ServiceAreaMap;
