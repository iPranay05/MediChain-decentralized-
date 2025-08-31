'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Facility } from './FacilityMap';

// Component to update map view when props change
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  
  return null;
};

// Component to debug map markers
const MapDebugger: React.FC<{ facilities: Facility[] }> = ({ facilities }) => {
  useEffect(() => {
    console.log('MapDebugger - Facilities in map:', facilities.length);
    facilities.forEach((f, i) => {
      if (i < 5) { // Log first 5 facilities for debugging
        console.log(`Facility ${i+1}:`, f.name, f.type, [f.lat, f.lng]);
      }
    });
  }, [facilities]);
  
  return null;
};

const MapComponent: React.FC<{
  facilities: Facility[];
  userLocation: [number, number] | null;
  handleFacilitySelect: (facility: Facility) => void;
  mapCenter: [number, number];
  mapZoom: number;
}> = ({
  facilities,
  userLocation,
  handleFacilitySelect,
  mapCenter,
  mapZoom
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const [icons, setIcons] = useState<{
    hospital: L.Icon;
    clinic: L.Icon;
    pharmacy: L.Icon;
    default: L.Icon;
  } | null>(null);
  
  // Initialize icons only once when component mounts
  useEffect(() => {
    // Fix Leaflet icon issues
    // @ts-ignore - _getIconUrl is not in the type definition but exists at runtime
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
    
    // Create custom icons for different facility types
    const hospitalIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    const clinicIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    const pharmacyIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    // Store icons in component state instead of window
    setIcons({
      hospital: hospitalIcon,
      clinic: clinicIcon,
      pharmacy: pharmacyIcon,
      default: new L.Icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    });
    
    console.log('Icons initialized');
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);
  
  // Log when facilities or location changes
  useEffect(() => {
    console.log('MapComponent - Facilities updated:', facilities.length);
    console.log('MapComponent - User location:', userLocation);
  }, [facilities, userLocation]);
  
  // Get the appropriate icon based on facility type
  const getIcon = (type: string) => {
    if (!icons) {
      return new L.Icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
    }
    
    const facilityType = type as 'hospital' | 'clinic' | 'pharmacy' | 'default';
    return icons[facilityType] || icons.default;
  };
  
  // Handle map initialization
  const handleMapCreated = (map: L.Map) => {
    console.log('Map created');
    mapRef.current = map;
  };
  
  return (
    <div className="h-full w-full">
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        style={{ height: '100%', width: '100%' }}
        // @ts-ignore - Type definition issue with ref
        ref={handleMapCreated}
      >
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        <MapDebugger facilities={facilities} />
        
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {userLocation && (
          <Marker 
            position={userLocation}
            icon={new L.Icon({
              iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
              iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-bold">Your Location</h3>
                <p className="text-xs text-gray-600">{userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {facilities.map((facility) => (
          <Marker 
            key={facility.id} 
            position={[facility.lat, facility.lng]}
            icon={icons ? getIcon(facility.type) : new L.Icon({
              iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
              iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
            eventHandlers={{
              click: () => handleFacilitySelect(facility),
            }}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-bold">{facility.name}</h3>
                <p className="text-sm">{facility.type.toUpperCase()}</p>
                {facility.distance !== undefined && (
                  <p className="text-sm">{facility.distance.toFixed(1)} km away</p>
                )}
                <button 
                  className="mt-2 bg-blue-600 text-white px-2 py-1 rounded-md text-sm"
                  onClick={() => handleFacilitySelect(facility)}
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
