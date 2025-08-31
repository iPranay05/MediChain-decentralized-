'use client';

import React, { useState, useEffect } from 'react';
import { FaHeadphones, FaUserMd, FaCalendarAlt, FaFilePrescription, FaDownload, FaCheck, FaClock } from 'react-icons/fa';
import Layout from '@/components/Layout';
import { toast } from 'react-hot-toast';

interface VoicePrescription {
  id: string;
  patientId?: string;
  patientName: string;
  patientAadhar: string;
  doctorName: string;
  department: string;
  date: string;
  audioData: string | null;
  transcription: string;
  status: 'new' | 'viewed' | 'completed';
}

const VoicePrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState<VoicePrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<VoicePrescription | null>(null);
  const [showPrescriptionDetails, setShowPrescriptionDetails] = useState(false);
  const [aadharInput, setAadharInput] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [audioUrls, setAudioUrls] = useState<{[key: string]: string}>({});

  // Function to convert base64 audio data to a playable URL
  const createAudioUrl = (audioData: string) => {
    return new Promise<string>((resolve, reject) => {
      try {
        // Convert base64 to binary
        const binaryString = window.atob(audioData);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Create blob and URL
        const blob = new Blob([bytes.buffer], { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        console.log('Created audio URL:', url);
        resolve(url);
      } catch (error) {
        console.error('Error creating audio URL:', error);
        console.error('Audio data length:', audioData ? audioData.length : 0);
        console.error('Audio data sample:', audioData ? audioData.substring(0, 50) + '...' : 'null');
        reject(error);
      }
    });
  };

  // Function to handle prescription selection
  const handlePrescriptionSelect = async (prescription: VoicePrescription) => {
    console.log('Selected prescription:', prescription);
    setSelectedPrescription(prescription);
    setShowPrescriptionDetails(true);
    
    // Mark prescription as viewed if it's new
    if (prescription.status === 'new') {
      try {
        const response = await fetch('/api/voice-prescriptions', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: prescription.id,
            status: 'viewed'
          }),
        });
        
        if (response.ok) {
          // Update the prescription status locally
          setPrescriptions(prevPrescriptions => 
            prevPrescriptions.map(p => 
              p.id === prescription.id ? { ...p, status: 'viewed' } : p
            )
          );
        }
      } catch (error) {
        console.error('Error updating prescription status:', error);
      }
    }
    
    // Create audio URL if prescription has audio data but no URL yet
    if (prescription.audioData && !audioUrls[prescription.id]) {
      try {
        console.log('Creating audio URL for prescription:', prescription.id);
        const url = await createAudioUrl(prescription.audioData);
        console.log('Created URL:', url);
        setAudioUrls(prev => ({
          ...prev,
          [prescription.id]: url
        }));
      } catch (error) {
        console.error('Error creating audio URL:', error);
        toast.error('Failed to load audio recording');
      }
    }
  };

  const fetchPrescriptions = async (aadharNumber: string) => {
    try {
      setLoading(true);
      
      // Format the Aadhar number (remove spaces)
      const formattedAadhar = aadharNumber.replace(/\s/g, '');
      
      // Fetch prescriptions for this patient by Aadhar number
      const response = await fetch(`/api/voice-prescriptions?patientAadhar=${formattedAadhar}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch prescriptions');
      }
      
      const data = await response.json();
      console.log('Fetched prescriptions:', data.prescriptions);
      
      let fetchedPrescriptions = data.prescriptions || [];
      setPrescriptions(fetchedPrescriptions);
      
      // Create audio URLs for prescriptions with audio data
      const newAudioUrls: {[key: string]: string} = {};
      
      for (const prescription of fetchedPrescriptions) {
        if (prescription.audioData) {
          try {
            console.log('Creating audio URL for prescription:', prescription.id);
            const url = await createAudioUrl(prescription.audioData);
            newAudioUrls[prescription.id] = url;
          } catch (error) {
            console.error(`Error creating audio URL for prescription ${prescription.id}:`, error);
          }
        }
      }
      
      setAudioUrls(prev => ({...prev, ...newAudioUrls}));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      toast.error('Failed to load prescriptions');
      setLoading(false);
      
      // If API fails, set empty prescriptions array
      setPrescriptions([]);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Use the input Aadhar number if provided, otherwise use the default
    const aadharToUse = aadharInput.trim() ? aadharInput : localStorage.getItem('patientAadhar') || '4633 2655 6422';
    
    fetchPrescriptions(aadharToUse);
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  useEffect(() => {
    // Get patient Aadhar number from localStorage (in a real app)
    const patientAadhar = localStorage.getItem('patientAadhar') || '4633 2655 6422';
    setAadharInput(patientAadhar);
    
    // Fetch prescriptions using the Aadhar number
    fetchPrescriptions(patientAadhar);
    
    // Clean up audio URLs on unmount
    return () => {
      Object.values(audioUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <FaHeadphones className="mr-2 text-blue-600" />
          Voice Prescriptions
        </h1>
        
        {/* Aadhar Input and Refresh Button */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow">
              <label htmlFor="aadharInput" className="block text-sm font-medium text-gray-700 mb-1">
                Your Aadhar Number
              </label>
              <input
                type="text"
                id="aadharInput"
                value={aadharInput}
                onChange={(e) => {
                  // Format as XXXX XXXX XXXX
                  const value = e.target.value.replace(/\D/g, '');
                  const formattedValue = value
                    .replace(/(\d{4})(?=\d)/g, '$1 ')
                    .trim()
                    .substring(0, 14); // 12 digits + 2 spaces
                  setAadharInput(formattedValue);
                }}
                placeholder="XXXX XXXX XXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={14}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {isRefreshing ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                    Refreshing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Prescriptions
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Prescription List */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">Your Prescriptions</h2>
              
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : prescriptions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No prescriptions found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {prescriptions.map((prescription) => (
                    <div
                      key={prescription.id}
                      onClick={() => handlePrescriptionSelect(prescription)}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        selectedPrescription?.id === prescription.id
                          ? 'bg-blue-100 border border-blue-300'
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between">
                        <div>
                          <div className="font-medium">{prescription.doctorName}</div>
                          <div className="text-sm text-gray-600">{prescription.department}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(prescription.date).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          {prescription.status === 'new' ? (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex items-center"><FaClock className="mr-1" /> New</span>
                          ) : prescription.status === 'viewed' ? (
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full flex items-center"><FaCheck className="mr-1" /> Viewed</span>
                          ) : (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center"><FaCheck className="mr-1" /> Completed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Prescription Details */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Prescription Details</h2>
              
              {selectedPrescription ? (
                <div>
                  {/* Doctor Info */}
                  <div className="mb-6">
                    <div className="flex items-center mb-2">
                      <FaUserMd className="text-blue-600 mr-2" />
                      <h3 className="text-lg font-medium">{selectedPrescription.doctorName}</h3>
                    </div>
                    <p className="text-gray-600 ml-6">{selectedPrescription.department}</p>
                    <div className="flex items-center ml-6 text-gray-500 text-sm mt-1">
                      <FaCalendarAlt className="mr-1" />
                      {new Date(selectedPrescription.date).toLocaleString()}
                    </div>
                  </div>
                  
                  {/* Voice Recording */}
                  <div className="mb-6">
                    <h3 className="text-md font-medium mb-2 flex items-center">
                      <FaHeadphones className="mr-2 text-blue-600" />
                      Voice Recording
                    </h3>
                    
                    {audioUrls[selectedPrescription.id] ? (
                      <div>
                        <audio 
                          src={audioUrls[selectedPrescription.id]} 
                          controls 
                          className="w-full"
                          onError={(e) => {
                            console.error('Audio playback error:', e);
                            toast.error('Error playing audio');
                          }}
                        />
                        <div className="mt-2 text-xs text-gray-500">
                          If audio doesn't play, try clicking the refresh button above.
                        </div>
                      </div>
                    ) : selectedPrescription.audioData ? (
                      <div className="flex items-center justify-center h-12 bg-gray-100 rounded-md">
                        <div className="w-5 h-5 border-t-2 border-blue-600 rounded-full animate-spin mr-2"></div>
                        <span className="text-gray-600">Loading audio...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-12 bg-gray-100 rounded-md">
                        <span className="text-gray-600">No audio available</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Prescription Text */}
                  <div>
                    <h3 className="text-md font-medium mb-2 flex items-center">
                      <FaFilePrescription className="mr-2 text-blue-600" />
                      Prescription
                    </h3>
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
                      <p className="text-gray-800 whitespace-pre-line">
                        {selectedPrescription.transcription}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        // Download prescription as text
                        const element = document.createElement('a');
                        const file = new Blob(
                          [
                            `Doctor: ${selectedPrescription.doctorName}\n` +
                            `Department: ${selectedPrescription.department}\n` +
                            `Date: ${new Date(selectedPrescription.date).toLocaleString()}\n\n` +
                            `Prescription:\n${selectedPrescription.transcription}`
                          ], 
                          {type: 'text/plain'}
                        );
                        element.href = URL.createObjectURL(file);
                        element.download = `prescription_${selectedPrescription.id}.txt`;
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <FaDownload className="inline mr-1" /> Download
                    </button>
                    
                    <button
                      onClick={() => {
                        // Mark as completed
                        fetch('/api/voice-prescriptions', {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            id: selectedPrescription.id,
                            status: 'completed'
                          }),
                        })
                          .then(response => {
                            if (response.ok) {
                              // Update the prescription status locally
                              setPrescriptions(prevPrescriptions => 
                                prevPrescriptions.map(p => 
                                  p.id === selectedPrescription.id 
                                    ? { ...p, status: 'completed' as const } 
                                    : p
                                )
                              );
                              setSelectedPrescription(prev => 
                                prev 
                                  ? { ...prev, status: 'completed' as const } 
                                  : null
                              );
                              toast.success('Prescription marked as completed');
                            }
                          })
                          .catch(error => {
                            console.error('Error updating prescription status:', error);
                            toast.error('Failed to update prescription status');
                          });
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <FaCheck className="inline mr-1" /> Mark as Completed
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Select a prescription from the list to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VoicePrescriptionsPage;
