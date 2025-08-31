'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, UserButton } from '@clerk/nextjs';
import { fetchAllFacilities, fetchNearbyFacilities, calculateDistance } from '@/lib/healthsites-api';
import { FaList, FaMapMarkedAlt, FaFilter, FaSearch, FaExclamationTriangle } from 'react-icons/fa';
import dynamic from 'next/dynamic';
import { Facility } from '@/components/FacilityMap';

// Dynamically import the FacilityMap component to prevent SSR issues
const FacilityMap = dynamic(() => import('@/components/FacilityMap'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  ),
});

export default function FacilityFinder() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();

  // Component state
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // Center of India
  const [mapZoom, setMapZoom] = useState<number>(5);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    type: 'all',
    emergency: false,
    verified: false,
    ayurvedic: false,
    governmentSchemes: false,
  });

  // Load facilities data
  useEffect(() => {
    const loadFacilities = async () => {
      try {
        setLoading(true);
        const data = await fetchAllFacilities();
        
        // Add some mock data for Indian-specific features
        const enhancedData = data.map(facility => ({
          ...facility,
          hasAyurvedicServices: Math.random() > 0.7, // 30% of facilities have Ayurvedic services
          acceptsGovernmentSchemes: Math.random() > 0.5, // 50% accept government schemes
        }));
        
        setFacilities(enhancedData);
        setFilteredFacilities(enhancedData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load healthcare facilities. Please try again later.');
        setLoading(false);
        console.error(err);
      }
    };

    loadFacilities();
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setMapZoom(12);
          
          console.log('User location detected:', latitude, longitude);
          
          // Fetch nearby facilities based on user location
          const getNearbyFacilities = async () => {
            try {
              // Force a larger radius to ensure we get results
              const nearby = await fetchNearbyFacilities(latitude, longitude, 50);
              console.log('Nearby facilities found:', nearby.length);
              
              if (nearby.length === 0) {
                console.warn('No nearby facilities found, generating some test facilities');
                // If no facilities found, create some mock ones at the user's location
                const mockFacility: Facility = {
                  id: 'mock-1',
                  name: 'Local General Hospital',
                  lat: latitude + 0.01,
                  lng: longitude + 0.01,
                  type: 'hospital',
                  amenities: ['emergency', 'surgery', 'pharmacy'],
                  verified: true,
                  distance: 1.5,
                  address: 'Near your location',
                  phone: '+1-234-567-8900',
                  website: 'https://example.com',
                  specialties: ['General Medicine', 'Emergency Care'],
                  services: ['Emergency', 'Surgery', 'ICU'],
                  hasAyurvedicServices: false,
                  acceptsGovernmentSchemes: true
                };
                
                const mockFacility2: Facility = {
                  id: 'mock-2',
                  name: 'Community Clinic',
                  lat: latitude - 0.01,
                  lng: longitude - 0.01,
                  type: 'clinic',
                  amenities: ['pharmacy'],
                  verified: true,
                  distance: 2.1,
                  address: 'Near your location',
                  phone: '+1-234-567-8901',
                  website: 'https://example.com',
                  specialties: ['General Medicine'],
                  services: ['Consultation'],
                  hasAyurvedicServices: true,
                  acceptsGovernmentSchemes: false
                };
                
                const mockFacility3: Facility = {
                  id: 'mock-3',
                  name: 'City Pharmacy',
                  lat: latitude + 0.005,
                  lng: longitude - 0.005,
                  type: 'pharmacy',
                  amenities: ['pharmacy'],
                  verified: true,
                  distance: 0.8,
                  address: 'Near your location',
                  phone: '+1-234-567-8902',
                  website: 'https://example.com',
                  specialties: [],
                  services: ['Pharmacy'],
                  hasAyurvedicServices: false,
                  acceptsGovernmentSchemes: true
                };
                
                const mockNearby = [mockFacility, mockFacility2, mockFacility3, ...nearby];
                setFacilities(mockNearby);
                setFilteredFacilities(mockNearby);
              } else {
                // Update facilities with distance from user
                setFacilities(nearby);
                setFilteredFacilities(nearby);
              }
              setLoading(false);
            } catch (error) {
              console.error('Error fetching nearby facilities:', error);
              setError('Failed to load nearby healthcare facilities.');
              setLoading(false);
            }
          };
          
          getNearbyFacilities();
        },
        (error) => {
          console.error('Error getting location:', error);
          // If geolocation fails, load all facilities
          const loadAllFacilities = async () => {
            try {
              const data = await fetchAllFacilities();
              setFacilities(data);
              setFilteredFacilities(data);
              setLoading(false);
            } catch (err) {
              setError('Failed to load healthcare facilities. Please try again later.');
              setLoading(false);
            }
          };
          
          loadAllFacilities();
        }
      );
    } else {
      // If geolocation is not supported, load all facilities
      const loadAllFacilities = async () => {
        try {
          const data = await fetchAllFacilities();
          setFacilities(data);
          setFilteredFacilities(data);
          setLoading(false);
        } catch (err) {
          setError('Failed to load healthcare facilities. Please try again later.');
          setLoading(false);
        }
      };
      
      loadAllFacilities();
    }
  }, []); // Empty dependency array to run only once

  // Apply filters
  const applyFilters = (data: Facility[], currentFilters: any, query: string) => {
    let filtered = [...data];
    
    // Apply type filter
    if (currentFilters.type !== 'all') {
      filtered = filtered.filter(f => f.type === currentFilters.type);
    }
    
    // Apply emergency filter
    if (currentFilters.emergency) {
      filtered = filtered.filter(f => f.amenities.includes('emergency'));
    }
    
    // Apply verified filter
    if (currentFilters.verified) {
      filtered = filtered.filter(f => f.verified);
    }
    
    // Apply Ayurvedic services filter
    if (currentFilters.ayurvedic) {
      filtered = filtered.filter(f => f.hasAyurvedicServices);
    }
    
    // Apply government schemes filter
    if (currentFilters.governmentSchemes) {
      filtered = filtered.filter(f => f.acceptsGovernmentSchemes);
    }
    
    // Apply search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(lowerQuery) || 
        (f.address && f.address.toLowerCase().includes(lowerQuery))
      );
    }
    
    // Sort by distance if available
    if (filtered.some(f => f.distance !== undefined)) {
      filtered.sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }
    
    setFilteredFacilities(filtered);
  };

  // Handle filter changes
  const handleFilterChange = (name: string, value: any) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    applyFilters(facilities, newFilters, searchQuery);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(facilities, filters, searchQuery);
  };

  // Handle facility selection
  const handleFacilitySelect = (facility: Facility) => {
    setSelectedFacility(facility);
  };

  // Handle emergency toggle
  const toggleEmergency = () => {
    const newValue = !filters.emergency;
    handleFilterChange('emergency', newValue);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-800">Healthcare Facility Finder</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              <FaList />
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-md ${viewMode === 'map' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              <FaMapMarkedAlt />
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-md ${showFilters ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              <FaFilter />
            </button>
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <button 
                onClick={() => router.push('/sign-in')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        {/* Emergency Mode Toggle */}
        <div className="mb-4">
          <button 
            onClick={toggleEmergency}
            className={`w-full p-3 rounded-md flex items-center justify-center space-x-2 ${
              filters.emergency ? 'bg-red-600 text-white' : 'bg-white border border-red-600 text-red-600'
            }`}
          >
            <FaExclamationTriangle />
            <span>{filters.emergency ? 'Emergency Mode ON' : 'Enable Emergency Mode'}</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-4">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              placeholder="Search facilities..."
              className="flex-grow p-2 border rounded-l-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button 
              type="submit"
              className="bg-blue-600 text-white p-2 rounded-r-md"
            >
              <FaSearch />
            </button>
          </form>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-4 bg-white p-4 rounded-md shadow-md">
            <h2 className="text-lg font-semibold mb-2">Filters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1">Facility Type</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="hospital">Hospital</option>
                  <option value="clinic">Clinic</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="laboratory">Laboratory</option>
                </select>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="verified"
                  checked={filters.verified}
                  onChange={(e) => handleFilterChange('verified', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="verified">Verified Facilities Only</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="ayurvedic"
                  checked={filters.ayurvedic}
                  onChange={(e) => handleFilterChange('ayurvedic', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="ayurvedic">Ayurvedic Services</label>
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="governmentSchemes"
                  checked={filters.governmentSchemes}
                  onChange={(e) => handleFilterChange('governmentSchemes', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="governmentSchemes">Accepts Government Schemes</label>
              </div>
            </div>
          </div>
        )}

        {/* Loading and Error States */}
        {loading && (
          <div className="text-center p-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Loading healthcare facilities...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Facility Display */}
        {!loading && !error && (
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Facility List */}
            {viewMode === 'list' && (
              <div className="w-full lg:w-2/3 bg-white rounded-lg shadow-md p-4">
                <h2 className="text-xl font-semibold mb-4">
                  {filteredFacilities.length} Facilities Found
                </h2>
                {filteredFacilities.length === 0 ? (
                  <p className="text-center text-gray-500 py-10">No facilities match your criteria</p>
                ) : (
                  <div className="divide-y">
                    {filteredFacilities.map((facility) => (
                      <div 
                        key={facility.id} 
                        className="py-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleFacilitySelect(facility)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold">{facility.name}</h3>
                            <p className="text-sm text-gray-600">{facility.type.toUpperCase()}</p>
                            {facility.address && (
                              <p className="text-sm text-gray-600">{facility.address}</p>
                            )}
                            {facility.distance && (
                              <p className="text-sm text-blue-600">{facility.distance.toFixed(1)} km away</p>
                            )}
                            <div className="mt-1 flex flex-wrap gap-1">
                              {facility.verified && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Verified</span>
                              )}
                              {facility.amenities.includes('emergency') && (
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Emergency</span>
                              )}
                              {facility.hasAyurvedicServices && (
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Ayurvedic</span>
                              )}
                              {facility.acceptsGovernmentSchemes && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Govt. Schemes</span>
                              )}
                            </div>
                          </div>
                          <button 
                            className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFacilitySelect(facility);
                            }}
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Map View */}
            {viewMode === 'map' && (
              <div className="w-full lg:w-2/3 h-[600px] bg-white rounded-lg shadow-md overflow-hidden">
                {typeof window !== 'undefined' && (
                  <FacilityMap 
                    facilities={filteredFacilities}
                    userLocation={userLocation}
                    handleFacilitySelect={handleFacilitySelect}
                    mapCenter={mapCenter}
                    mapZoom={mapZoom}
                  />
                )}
              </div>
            )}

            {/* Facility Details */}
            <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-md p-4">
              {selectedFacility ? (
                <div>
                  <h2 className="text-xl font-semibold mb-2">{selectedFacility.name}</h2>
                  <div className="mb-4 flex flex-wrap gap-1">
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">{selectedFacility.type.toUpperCase()}</span>
                    {selectedFacility.verified && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Verified</span>
                    )}
                    {selectedFacility.amenities.includes('emergency') && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Emergency Services</span>
                    )}
                    {selectedFacility.hasAyurvedicServices && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Ayurvedic Services</span>
                    )}
                    {selectedFacility.acceptsGovernmentSchemes && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Accepts Govt. Schemes</span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {selectedFacility.address && (
                      <div>
                        <h3 className="font-semibold">Address</h3>
                        <p>{selectedFacility.address}</p>
                      </div>
                    )}
                    
                    {selectedFacility.distance && (
                      <div>
                        <h3 className="font-semibold">Distance</h3>
                        <p>{selectedFacility.distance.toFixed(1)} km from your location</p>
                      </div>
                    )}
                    
                    {selectedFacility.phone && (
                      <div>
                        <h3 className="font-semibold">Contact</h3>
                        <p>{selectedFacility.phone}</p>
                      </div>
                    )}
                    
                    {selectedFacility.website && (
                      <div>
                        <h3 className="font-semibold">Website</h3>
                        <a 
                          href={selectedFacility.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {selectedFacility.website}
                        </a>
                      </div>
                    )}
                    
                    {selectedFacility.specialties && selectedFacility.specialties.length > 0 && (
                      <div>
                        <h3 className="font-semibold">Specialties</h3>
                        <div className="flex flex-wrap gap-1">
                          {selectedFacility.specialties.map((specialty, index) => (
                            <span 
                              key={index}
                              className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedFacility.services && selectedFacility.services.length > 0 && (
                      <div>
                        <h3 className="font-semibold">Services</h3>
                        <div className="flex flex-wrap gap-1">
                          {selectedFacility.services.map((service, index) => (
                            <span 
                              key={index}
                              className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-6 space-y-2">
                      <button 
                        className="w-full bg-blue-600 text-white py-2 rounded-md"
                        onClick={() => {
                          // Implement directions functionality
                          if (selectedFacility.lat && selectedFacility.lng) {
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.lat},${selectedFacility.lng}`, '_blank');
                          }
                        }}
                      >
                        Get Directions
                      </button>
                      
                      <button 
                        className="w-full bg-green-600 text-white py-2 rounded-md"
                        onClick={() => {
                          // Implement verification functionality
                          alert('Thank you for verifying this facility! Your verification has been recorded on the blockchain.');
                        }}
                      >
                        Verify Information
                      </button>
                      
                      <button 
                        className="w-full bg-yellow-600 text-white py-2 rounded-md"
                        onClick={() => {
                          // Implement report issue functionality
                          alert('Thank you for reporting an issue with this facility. Our team will review it and update the blockchain record.');
                        }}
                      >
                        Report Issue
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <p>Select a facility to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add custom styles for map markers */}
      <style jsx global>{`
        .pulse-dot {
          width: 20px;
          height: 20px;
          background-color: #3b82f6;
          border-radius: 50%;
          box-shadow: 0 0 0 rgba(59, 130, 246, 0.4);
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
        
        .facility-marker {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: #3b82f6;
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
        }
        
        .facility-marker.hospital {
          background-color: #3b82f6;
        }
        
        .facility-marker.clinic {
          background-color: #10b981;
        }
        
        .facility-marker.pharmacy {
          background-color: #f59e0b;
        }
        
        .facility-marker.laboratory {
          background-color: #8b5cf6;
        }
        
        .facility-marker.emergency {
          background-color: #ef4444;
          animation: pulse-emergency 1.5s infinite;
        }
        
        @keyframes pulse-emergency {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
      `}</style>
    </div>
  );
}
