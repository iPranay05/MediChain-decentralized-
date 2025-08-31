// Add type declaration for window.facilityIcons
declare global {
  interface Window {
    facilityIcons: {
      hospital: any;
      clinic: any;
      pharmacy: any;
      default: any;
    };
  }
}

'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Define facility type
export interface Facility {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  amenities: string[];
  verified: boolean;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  specialties?: string[];
  services?: string[];
  distance?: number;
  hasAyurvedicServices?: boolean;
  acceptsGovernmentSchemes?: boolean;
}

interface FacilityMapProps {
  facilities: Facility[];
  userLocation: [number, number] | null;
  handleFacilitySelect: (facility: Facility) => void;
  mapCenter: [number, number];
  mapZoom: number;
}

interface MapComponentProps {
  facilities: Facility[];
  userLocation: [number, number] | null;
  handleFacilitySelect: (facility: Facility) => void;
  mapCenter: [number, number];
  mapZoom: number;
}

// Use dynamic import with ssr: false for all Leaflet components
const MapWithNoSSR = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center">Loading map...</div>
});

const FacilityMap: React.FC<FacilityMapProps> = (props) => {
  // Check if we're on the client side
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="h-full w-full flex items-center justify-center">Loading map...</div>;
  }

  return <MapWithNoSSR {...props} />;
};

export default FacilityMap;
