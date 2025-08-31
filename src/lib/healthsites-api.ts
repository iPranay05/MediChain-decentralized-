// Healthsites.io API integration for MediChain
// Documentation: https://healthsites.io/api/docs/

import { Facility } from '@/components/FacilityMap';

// Base URL for healthsites.io API
const HEALTHSITES_API_URL = 'https://healthsites.io/api/v2';

/**
 * Fetch healthcare facilities from healthsites.io API
 * @returns Promise with array of facilities
 */
export async function fetchAllFacilities(): Promise<Facility[]> {
  try {
    // In a production environment, this would be a real API call
    // For now, we'll use mock data that mimics the healthsites.io API response
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return mockFacilities;
  } catch (error) {
    console.error('Error fetching facilities from healthsites.io:', error);
    throw error;
  }
}

/**
 * Fetch healthcare facilities near a specific location
 * @param latitude User's latitude
 * @param longitude User's longitude
 * @param radius Search radius in kilometers
 * @returns Promise with array of nearby facilities
 */
export async function fetchNearbyFacilities(
  latitude: number, 
  longitude: number, 
  radius: number = 10
): Promise<Facility[]> {
  try {
    // In a production environment, this would be a real API call with coordinates
    // For now, we'll use mock data and calculate distances
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const facilities = await fetchAllFacilities();
    
    // Calculate distance for each facility from user location
    return facilities
      .map(facility => ({
        ...facility,
        distance: calculateDistance(
          latitude, 
          longitude, 
          facility.lat, 
          facility.lng
        )
      }))
      .filter(facility => facility.distance <= radius)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  } catch (error) {
    console.error('Error fetching nearby facilities from healthsites.io:', error);
    throw error;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return parseFloat(d.toFixed(1));
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

// Mock data for Indian healthcare facilities
const mockFacilities: Facility[] = [
  {
    id: '1',
    name: 'AIIMS Delhi',
    lat: 28.5672,
    lng: 77.2100,
    type: 'hospital',
    amenities: ['emergency', 'surgery', 'icu', 'pharmacy'],
    verified: true,
    address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi, Delhi 110029',
    phone: '+91-11-26588500',
    website: 'https://www.aiims.edu',
    email: 'info@aiims.edu',
    specialties: ['Cardiology', 'Neurology', 'Oncology'],
    services: ['Emergency', 'Surgery', 'ICU', 'Pharmacy', 'Laboratory'],
    hasAyurvedicServices: false,
    acceptsGovernmentSchemes: true
  },
  {
    id: '2',
    name: 'Apollo Hospitals',
    lat: 28.5417,
    lng: 77.2751,
    type: 'hospital',
    amenities: ['emergency', 'surgery', 'icu', 'pharmacy'],
    verified: true,
    address: 'Sarita Vihar, Delhi Mathura Road, New Delhi, Delhi 110076',
    phone: '+91-11-71791090',
    website: 'https://www.apollohospitals.com',
    email: 'info@apollohospitals.com',
    specialties: ['Cardiology', 'Orthopedics', 'Gastroenterology'],
    services: ['Emergency', 'Surgery', 'ICU', 'Pharmacy', 'Laboratory'],
    hasAyurvedicServices: true,
    acceptsGovernmentSchemes: true
  },
  {
    id: '3',
    name: 'Fortis Hospital',
    lat: 28.4759,
    lng: 77.0928,
    type: 'hospital',
    amenities: ['emergency', 'surgery', 'icu', 'pharmacy'],
    verified: true,
    address: 'Sector 44, Opposite HUDA City Centre, Gurugram, Haryana 122002',
    phone: '+91-124-4921021',
    website: 'https://www.fortishealthcare.com',
    email: 'info@fortishealthcare.com',
    specialties: ['Cardiology', 'Neurology', 'Orthopedics'],
    services: ['Emergency', 'Surgery', 'ICU', 'Pharmacy', 'Laboratory'],
    hasAyurvedicServices: false,
    acceptsGovernmentSchemes: true
  },
  {
    id: '4',
    name: 'Max Super Speciality Hospital',
    lat: 28.5721,
    lng: 77.2710,
    type: 'hospital',
    amenities: ['emergency', 'surgery', 'icu', 'pharmacy'],
    verified: true,
    address: 'Press Enclave Marg, Saket, New Delhi, Delhi 110017',
    phone: '+91-11-26515050',
    website: 'https://www.maxhealthcare.in',
    email: 'info@maxhealthcare.com',
    specialties: ['Cardiology', 'Oncology', 'Neurology'],
    services: ['Emergency', 'Surgery', 'ICU', 'Pharmacy', 'Laboratory'],
    hasAyurvedicServices: false,
    acceptsGovernmentSchemes: true
  },
  {
    id: '5',
    name: 'Medanta - The Medicity',
    lat: 28.4397,
    lng: 77.0416,
    type: 'hospital',
    amenities: ['emergency', 'surgery', 'icu', 'pharmacy'],
    verified: true,
    address: 'CH Baktawar Singh Road, Sector 38, Gurugram, Haryana 122001',
    phone: '+91-124-4141414',
    website: 'https://www.medanta.org',
    email: 'info@medanta.org',
    specialties: ['Cardiology', 'Neurology', 'Gastroenterology'],
    services: ['Emergency', 'Surgery', 'ICU', 'Pharmacy', 'Laboratory'],
    hasAyurvedicServices: false,
    acceptsGovernmentSchemes: true
  },
  {
    id: '6',
    name: 'Ayurvedic Wellness Center',
    lat: 28.6129,
    lng: 77.2295,
    type: 'clinic',
    amenities: ['pharmacy', 'consultation'],
    verified: true,
    address: 'Connaught Place, New Delhi, Delhi 110001',
    phone: '+91-11-23416789',
    website: 'https://www.ayurvedicwellness.com',
    email: 'info@ayurvedicwellness.com',
    specialties: ['Ayurveda', 'Panchakarma', 'Yoga'],
    services: ['Consultation', 'Therapy', 'Pharmacy'],
    hasAyurvedicServices: true,
    acceptsGovernmentSchemes: true
  },
  {
    id: '7',
    name: 'City Pharmacy',
    lat: 28.5672,
    lng: 77.2300,
    type: 'pharmacy',
    amenities: ['pharmacy', 'consultation'],
    verified: true,
    address: 'Lajpat Nagar, New Delhi, Delhi 110024',
    phone: '+91-11-29841234',
    website: 'https://www.citypharmacy.com',
    email: 'info@citypharmacy.com',
    specialties: [],
    services: ['Prescription Filling', 'OTC Medicines', 'Health Supplements'],
    hasAyurvedicServices: true,
    acceptsGovernmentSchemes: false
  },
  {
    id: '8',
    name: 'HealthFirst Diagnostics',
    lat: 28.5500,
    lng: 77.2500,
    type: 'laboratory',
    amenities: ['laboratory', 'consultation'],
    verified: true,
    address: 'Greater Kailash, New Delhi, Delhi 110048',
    phone: '+91-11-40504050',
    website: 'https://www.healthfirstdiagnostics.com',
    email: 'info@healthfirstdiagnostics.com',
    specialties: [],
    services: ['Blood Tests', 'Imaging', 'Health Checkups'],
    hasAyurvedicServices: false,
    acceptsGovernmentSchemes: true
  },
  {
    id: '9',
    name: 'Family Care Clinic',
    lat: 28.5800,
    lng: 77.2200,
    type: 'clinic',
    amenities: ['consultation', 'pharmacy'],
    verified: true,
    address: 'Karol Bagh, New Delhi, Delhi 110005',
    phone: '+91-11-28756543',
    website: 'https://www.familycareclinic.com',
    email: 'info@familycareclinic.com',
    specialties: ['General Medicine', 'Pediatrics', 'Gynecology'],
    services: ['Consultation', 'Vaccination', 'Health Checkups'],
    hasAyurvedicServices: false,
    acceptsGovernmentSchemes: true
  },
  {
    id: '10',
    name: 'Patanjali Ayurved Center',
    lat: 28.5900,
    lng: 77.2400,
    type: 'clinic',
    amenities: ['pharmacy', 'consultation'],
    verified: true,
    address: 'Rohini, New Delhi, Delhi 110085',
    phone: '+91-11-27048765',
    website: 'https://www.patanjaliayurved.org',
    email: 'info@patanjaliayurved.org',
    specialties: ['Ayurveda', 'Yoga', 'Naturopathy'],
    services: ['Consultation', 'Therapy', 'Pharmacy'],
    hasAyurvedicServices: true,
    acceptsGovernmentSchemes: true
  },
  {
    id: '11',
    name: 'Government Hospital',
    lat: 28.6100,
    lng: 77.2100,
    type: 'hospital',
    amenities: ['emergency', 'surgery', 'pharmacy'],
    verified: true,
    address: 'Paharganj, New Delhi, Delhi 110055',
    phone: '+91-11-23456789',
    website: 'https://www.govthospital.org',
    email: 'info@govthospital.org',
    specialties: ['General Medicine', 'Surgery', 'Pediatrics'],
    services: ['Emergency', 'Surgery', 'Outpatient', 'Inpatient'],
    hasAyurvedicServices: false,
    acceptsGovernmentSchemes: true
  },
  {
    id: '12',
    name: 'Rural Health Center',
    lat: 28.4800,
    lng: 77.1000,
    type: 'clinic',
    amenities: ['consultation', 'pharmacy'],
    verified: true,
    address: 'Gurugram Rural, Haryana 122413',
    phone: '+91-124-2345678',
    website: 'https://www.ruralhealthcenter.org',
    email: 'info@ruralhealthcenter.org',
    specialties: ['General Medicine', 'Maternal Health', 'Child Health'],
    services: ['Consultation', 'Vaccination', 'Basic Emergency'],
    hasAyurvedicServices: true,
    acceptsGovernmentSchemes: true
  },
  {
    id: '13',
    name: 'Mobile Medical Unit',
    lat: 28.5300,
    lng: 77.2700,
    type: 'clinic',
    amenities: ['consultation', 'pharmacy'],
    verified: false,
    address: 'Mobile Unit - South Delhi',
    phone: '+91-11-98765432',
    website: 'https://www.mobilemedicalunit.org',
    email: 'info@mobilemedicalunit.org',
    specialties: ['General Medicine', 'First Aid'],
    services: ['Basic Consultation', 'First Aid', 'Health Education'],
    hasAyurvedicServices: false,
    acceptsGovernmentSchemes: true
  },
  {
    id: '14',
    name: 'Community Health Center',
    lat: 28.6300,
    lng: 77.2800,
    type: 'clinic',
    amenities: ['consultation', 'pharmacy', 'laboratory'],
    verified: true,
    address: 'Shahdara, Delhi 110032',
    phone: '+91-11-22334455',
    website: 'https://www.communityhealthcenter.org',
    email: 'info@communityhealthcenter.org',
    specialties: ['General Medicine', 'Maternal Health', 'Child Health'],
    services: ['Consultation', 'Vaccination', 'Basic Laboratory'],
    hasAyurvedicServices: true,
    acceptsGovernmentSchemes: true
  },
  {
    id: '15',
    name: 'Wellness Pharmacy',
    lat: 28.5500,
    lng: 77.1800,
    type: 'pharmacy',
    amenities: ['pharmacy', 'consultation'],
    verified: false,
    address: 'Vasant Kunj, New Delhi, Delhi 110070',
    phone: '+91-11-26132613',
    website: 'https://www.wellnesspharmacy.com',
    email: 'info@wellnesspharmacy.com',
    specialties: [],
    services: ['Prescription Filling', 'OTC Medicines', 'Health Supplements'],
    hasAyurvedicServices: true,
    acceptsGovernmentSchemes: false
  }
];
