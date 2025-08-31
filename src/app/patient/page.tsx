'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import { SignedIn } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { useWeb3 } from '@/context/Web3Context';
import AadharScanner from '@/components/AadharScanner';

interface Medicine {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PrescriptionRecord {
  aadharNumber: string;
  diagnosis: string;
  medicines: string;
  notes: string;
  hospitalAddress: string;
  hospitalName: string;
  timestamp: string;
}

export default function PatientPortalPage() {
  const [aadharNumber, setAadharNumber] = useState('');
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [healthCoins, setHealthCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'diagnosis' | 'hospital' | 'medicine'>('all');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { contract, isConnected, connectWallet, account } = useWeb3();

  const handleRetrieveRecords = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowOtpInput(false); // Reset OTP input state

    try {
      if (!isConnected) {
        await connectWallet();
        return;
      }

      if (!contract) {
        throw new Error('Contract not initialized');
      }

      try {
        // Get signer address using ethers v6 syntax
        let address: string;
        if (contract.runner && typeof contract.runner.getAddress === 'function') {
          address = await contract.runner.getAddress();
        } else if (account) {
          address = account;
        } else {
          throw new Error('No wallet address available');
        }
        
        // Use the Aadhar number from the input field, not from localStorage
        // This allows users to search for different Aadhar numbers
        const searchAadharNumber = aadharNumber.trim();
        
        if (!searchAadharNumber) {
          throw new Error('Please enter an Aadhar number');
        }

        // Debug contract interface
        console.log('Contract interface:', contract.interface.fragments.map((f: any) => f.name));
        
        // First, try to send OTP for registered users
        const otpResponse = await fetch('/api/otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aadharNumber: searchAadharNumber,
            action: 'send'
          }),
        });

        if (!otpResponse.ok) {
          const errorData = await otpResponse.json();
          throw new Error(errorData.error || 'Failed to process OTP request');
        }

        const otpData = await otpResponse.json();
        console.log('OTP response:', otpData);

        // Store debug info if available
        if (otpData.debug) {
          setDebugInfo(otpData.debug);
        }

        // Check if this is a registered user (needs OTP) or unregistered (direct access)
        if (otpData.debug?.directAccess) {
          console.log('Direct access for unregistered user');
          // Unregistered user - directly fetch records
          await fetchRecordsFromBlockchain(searchAadharNumber);
        } else {
          console.log('OTP required for registered user');
          // Registered user - show OTP input
          setShowOtpInput(true);
        }

      } catch (error: unknown) {
        console.error('Contract function error:', error);
        setError(error instanceof Error ? error.message : 'Failed to retrieve records');
      }

    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const searchAadharNumber = aadharNumber.trim();
      
      if (!searchAadharNumber) {
        throw new Error('Aadhar number is missing');
      }
      
      if (!otp.trim()) {
        throw new Error('Please enter the OTP');
      }

      console.log('Verifying OTP:', otp, 'for Aadhar:', searchAadharNumber);
      
      const verifyResponse = await fetch('/api/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aadharNumber: searchAadharNumber,
          otp,
          action: 'verify'
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Failed to verify OTP');
      }

      const verifyData = await verifyResponse.json();
      console.log('OTP verification response:', verifyData);

      if (verifyData.success) {
        // OTP verified, now fetch records
        await fetchRecordsFromBlockchain(searchAadharNumber);
        
        // Reset OTP state
        setShowOtpInput(false);
        setOtp('');
      } else {
        throw new Error('OTP verification failed');
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  // Separate function to fetch records from blockchain to avoid code duplication
  const fetchRecordsFromBlockchain = async (aadharNumber: string) => {
    try {
      let foundRecords = false;
      
      // First try to get records from localStorage (for demo purposes)
      if (typeof window !== 'undefined') {
        // Check localStorage for prescriptions
        try {
          const localPrescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');
          const filteredPrescriptions = localPrescriptions.filter(
            (p: any) => p.patientAadhar === aadharNumber
          );
          
          if (filteredPrescriptions.length > 0) {
            console.log('Found prescriptions in localStorage:', filteredPrescriptions);
            
            // Format the prescriptions for display
            const formattedPrescriptions = filteredPrescriptions.map((prescription: any) => ({
              aadharNumber: prescription.patientAadhar || aadharNumber,
              diagnosis: prescription.diagnosis || 'General Consultation',
              medicines: typeof prescription.medication === 'string' 
                ? JSON.stringify([{
                    medication: prescription.medication,
                    dosage: prescription.dosage,
                    frequency: prescription.frequency,
                    duration: prescription.duration
                  }]) 
                : JSON.stringify([]),
              notes: prescription.notes || '',
              hospitalAddress: '',
              hospitalName: prescription.doctor?.replace('Dr. ', '') || localStorage.getItem('hospitalName') || '',
              timestamp: prescription.date || new Date().toLocaleString()
            }));
            
            setPrescriptions(formattedPrescriptions);
            foundRecords = true;
          }
          
          // Also check for medical records
          const localMedicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
          const filteredRecords = localMedicalRecords.filter(
            (r: any) => r.patientAadhar === aadharNumber
          );
          
          if (filteredRecords.length > 0) {
            console.log('Found medical records in localStorage:', filteredRecords);
            
            // If we have medical records, extract prescriptions from them
            for (const record of filteredRecords) {
              try {
                const recordData = JSON.parse(record.data || '{}');
                if (recordData.prescriptions && recordData.prescriptions.length > 0) {
                  const recordPrescriptions = recordData.prescriptions.map((p: any) => ({
                    aadharNumber: recordData.patientInfo?.aadharNumber || aadharNumber,
                    diagnosis: 'From Medical Record',
                    medicines: typeof p.medication === 'string' 
                      ? JSON.stringify([{
                          medication: p.medication,
                          dosage: p.dosage,
                          frequency: p.frequency,
                          duration: p.duration
                        }]) 
                      : JSON.stringify([]),
                    notes: p.notes || '',
                    hospitalAddress: '',
                    hospitalName: record.doctor?.replace('Dr. ', '') || localStorage.getItem('hospitalName') || '',
                    timestamp: record.date || new Date().toLocaleString()
                  }));
                  
                  // Add these prescriptions to the existing ones
                  setPrescriptions(prev => [...prev, ...recordPrescriptions]);
                  foundRecords = true;
                }
              } catch (parseErr) {
                console.error('Error parsing medical record data:', parseErr);
              }
            }
          }
        } catch (localErr) {
          console.error('Error reading from localStorage:', localErr);
        }
      }
      
      // If no records found in localStorage or we want to try blockchain anyway
      if (!foundRecords) {
        // Try to get records from blockchain
        try {
          // Use regular call for read-only operations with ethers v5
          if (contract.interface.fragments.some((f: any) => f.name === 'getPrescriptions')) {
            const records = await contract.getPrescriptions(aadharNumber);
            
            // Format the prescriptions for display
            if (Array.isArray(records)) {
              const formattedPrescriptions = records.map((prescription: any) => ({
                aadharNumber: prescription.patientAadhar || aadharNumber,
                diagnosis: prescription.diagnosis || '',
                medicines: prescription.medicines || '',
                notes: prescription.notes || '',
                hospitalAddress: prescription.hospital || '',
                hospitalName: prescription.hospitalName || '',
                timestamp: prescription.timestamp ? new Date(Number(prescription.timestamp) * 1000).toLocaleString() : ''
              }));
              
              setPrescriptions(formattedPrescriptions);
            } else {
              console.warn('Prescription data is not an array:', records);
              if (!foundRecords) {
                setPrescriptions([]);
              }
            }
            
            if (contract.interface.fragments.some((f: any) => f.name === 'getHealthCoins')) {
              try {
                const coins = await contract.getHealthCoins(aadharNumber);
                setHealthCoins(Number(coins));
              } catch (coinsErr) {
                console.error('Error fetching health coins:', coinsErr);
              }
            }
          } else {
            console.warn('getPrescriptions function not found in contract');
            if (!foundRecords) {
              throw new Error('No records found for this Aadhar number');
            }
          }
        } catch (blockchainErr) {
          console.error('Error fetching records from blockchain:', blockchainErr);
          if (!foundRecords) {
            throw blockchainErr;
          }
        }
      }
      
      // If we still have no records, show an error
      if (prescriptions.length === 0 && !foundRecords) {
        throw new Error('No records found for this Aadhar number');
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      throw error;
    }
  };

  const processAndDisplayPrescriptions = (prescriptionData: any) => {
    if (!Array.isArray(prescriptionData)) {
      console.warn('Prescription data is not an array:', prescriptionData);
      setPrescriptions([]);
      return;
    }
    
    // Format the prescriptions for display
    const formattedPrescriptions = prescriptionData.map((prescription: any) => ({
      aadharNumber: prescription.patientAadhar || aadharNumber,
      diagnosis: prescription.diagnosis || '',
      medicines: prescription.medicines || '',
      notes: prescription.notes || '',
      hospitalAddress: prescription.hospital || '',
      hospitalName: prescription.hospitalName || '',
      timestamp: prescription.timestamp ? new Date(Number(prescription.timestamp) * 1000).toLocaleString() : ''
    }));
    
    setPrescriptions(formattedPrescriptions);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp));
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  // Filter prescriptions based on search query
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;

    switch (searchFilter) {
      case 'diagnosis':
        return prescription.diagnosis.toLowerCase().includes(query);
      case 'hospital':
        return prescription.hospitalName.toLowerCase().includes(query);
      case 'medicine':
        try {
          const medicines = JSON.parse(prescription.medicines);
          return medicines.some((med: Medicine) => 
            med.medication.toLowerCase().includes(query)
          );
        } catch {
          return false;
        }
      default:
        return prescription.diagnosis.toLowerCase().includes(query) ||
          prescription.hospitalName.toLowerCase().includes(query) ||
          prescription.notes.toLowerCase().includes(query) ||
          (() => {
            try {
              const medicines = JSON.parse(prescription.medicines);
              return medicines.some((med: Medicine) => 
                med.medication.toLowerCase().includes(query)
              );
            } catch {
              return false;
            }
          })();
    }
  });

  return (
    <SignedIn>
      <Layout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Medical Records Portal
            </h1>
            <p className="mt-2 text-gray-600">
              Connected: {aadharNumber || 'Not connected'}
            </p>
          </div>

          {!showOtpInput ? (
            <form onSubmit={handleRetrieveRecords} className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <input
                    type="text"
                    value={aadharNumber}
                    onChange={(e) => setAadharNumber(e.target.value)}
                    placeholder="Enter your Aadhar number"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Retrieve Records'}
                  </motion.button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Or scan Aadhar card</h3>
                  <AadharScanner onScanComplete={(number) => setAadharNumber(number)} />
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={6}
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </motion.button>
              </div>
              {debugInfo?.otp && (
                <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-mono">Debug OTP: {debugInfo.otp}</p>
                </div>
              )}
            </form>
          )}

          {error && (
            <div className="p-4 text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}

          {prescriptions.length > 0 && (
            <div className="space-y-6">
              {/* Search Section */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search in medical records..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <select
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value as any)}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="all">All Fields</option>
                      <option value="diagnosis">Diagnosis</option>
                      <option value="hospital">Hospital</option>
                      <option value="medicine">Medicine</option>
                    </select>
                  </div>
                </div>
                {searchQuery && (
                  <div className="mt-2 text-sm text-gray-600">
                    Found {filteredPrescriptions.length} record(s) matching "{searchQuery}"
                  </div>
                )}
              </div>

              {/* Medical History */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Medical History</h2>
                  <div className="space-y-6">
                    {filteredPrescriptions.map((record, index) => {
                      const { date, time } = formatDate(record.timestamp);
                      let medicines: Medicine[] = [];
                      try {
                        medicines = JSON.parse(record.medicines);
                      } catch (err) {
                        console.warn('Failed to parse medicines:', err);
                      }

                      return (
                        <div
                          key={index}
                          className="border-b border-gray-200 last:border-b-0 pb-6 last:pb-0"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                Medical Record #{index + 1}
                              </h3>
                              <p className="text-sm text-gray-500">{date} {time}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Hospital</p>
                              <p className="text-gray-900">{record.hospitalName}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Diagnosis</p>
                              <p className="text-gray-900">{record.diagnosis}</p>
                            </div>
                          </div>

                          {medicines.length > 0 && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-500 mb-2">Medicines</h4>
                              <div className="space-y-3">
                                {medicines.map((medicine, idx) => (
                                  <div key={idx} className="bg-gray-50 p-3 rounded-md">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <p className="text-xs font-medium text-gray-500">Medicine</p>
                                        <p className="text-sm text-gray-900">{medicine.medication}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-gray-500">Dosage</p>
                                        <p className="text-sm text-gray-900">{medicine.dosage}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-gray-500">Frequency</p>
                                        <p className="text-sm text-gray-900">{medicine.frequency}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-gray-500">Duration</p>
                                        <p className="text-sm text-gray-900">{medicine.duration}</p>
                                      </div>
                                    </div>
                                    {medicine.instructions && (
                                      <div className="mt-2">
                                        <p className="text-xs font-medium text-gray-500">Instructions</p>
                                        <p className="text-sm text-gray-900">{medicine.instructions}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {record.notes && (
                            <div className="mt-4">
                              <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                              <p className="text-sm text-gray-900">{record.notes}</p>
                            </div>
                          )}

                          <div className="mt-4 flex justify-end space-x-4">
                            <button
                              className="text-sm text-blue-600 hover:text-blue-700"
                              onClick={() => {/* TODO: Implement download */}}
                            >
                              Download Report
                            </button>
                            <button
                              className="text-sm text-blue-600 hover:text-blue-700"
                              onClick={() => {/* TODO: Implement share */}}
                            >
                              Share
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </Layout>
    </SignedIn>
  );
}
