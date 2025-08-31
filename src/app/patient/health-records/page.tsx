'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/context/Web3Context';
import Layout from '@/components/Layout';

interface Prescription {
  id: string;
  patientAadhar: string;
  diagnosis: string;
  medicines: any[];
  notes: string;
  timestamp: number;
  hospital: string;
  hospitalName: string;
}

export default function HealthRecords() {
  const router = useRouter();
  const [aadharNumber, setAadharNumber] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'diagnosis' | 'hospital' | 'medicine'>('all');
  const [showAll, setShowAll] = useState(false);
  const { contract, isConnected, connectWallet } = useWeb3();

  useEffect(() => {
    const initializeData = async () => {
      // Check if user is logged in
      const storedAadhar = localStorage.getItem('aadharNumber');
      if (!storedAadhar) {
        router.push('/patient/login');
        return;
      }
      
      setAadharNumber(storedAadhar);
      
      // Try to connect wallet if not connected
      if (!isConnected || !contract) {
        try {
          await connectWallet();
        } catch (error) {
          console.error('Error connecting wallet:', error);
        }
      }
      
      // Fetch prescriptions
      fetchPrescriptions(storedAadhar);
    };
    
    initializeData();
  }, [router, contract, isConnected]);

  const fetchPrescriptions = async (aadhar: string) => {
    try {
      console.log('Fetching prescriptions for:', aadhar);
      
      // If wallet is connected but contract is not initialized
      if (isConnected && !contract) {
        console.log('Wallet connected but contract not initialized, reconnecting...');
        await connectWallet();
        
        // If still no contract, show error
        if (!contract) {
          setError('Contract not initialized. Please refresh the page and try again.');
          setLoading(false);
          return;
        }
      }
      
      // Check if the contract has the getPrescriptions function
      if (contract.interface.fragments.some((f: any) => f.name === 'getPrescriptions')) {
        // Use proper call syntax for ethers v5
        const data = await contract.getPrescriptions(aadhar);
        console.log('Prescription data:', data);
        
        if (Array.isArray(data)) {
          // Format the prescriptions for display
          const formattedPrescriptions = data.map((prescription: any) => {
            let medicines = [];
            try {
              medicines = typeof prescription.medicines === 'string' ? 
                JSON.parse(prescription.medicines || '[]') : 
                prescription.medicines || [];
            } catch (err) {
              console.warn('Failed to parse medicines JSON:', err);
            }
            
            return {
              id: typeof prescription.id === 'bigint' ? 
                Number(prescription.id) : 
                (prescription.id?.toNumber ? prescription.id.toNumber() : Number(prescription.id)),
              patientAadhar: prescription.patientAadhar,
              diagnosis: prescription.diagnosis || '',
              medicines: medicines,
              notes: prescription.notes || '',
              timestamp: typeof prescription.timestamp === 'bigint' ? 
                Number(prescription.timestamp) : 
                (prescription.timestamp?.toNumber ? prescription.timestamp.toNumber() : Number(prescription.timestamp)),
              hospital: prescription.hospital || '',
              hospitalName: prescription.hospitalName || ''
            };
          });
          
          setPrescriptions(formattedPrescriptions.reverse()); // Show newest records first
          setError(''); // Clear any previous errors when successful
        } else {
          console.warn('Prescription data is not an array:', data);
          setPrescriptions([]);
        }
      } else {
        console.error('Contract does not have getPrescriptions function');
        setError('Contract method not available');
      }
    } catch (err: any) {
      console.error('Error fetching health records:', err);
      setError(err.message || 'Failed to fetch health records. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter records based on search
  const filteredPrescriptions = prescriptions.filter(record => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();

    switch (searchFilter) {
      case 'diagnosis':
        return record.diagnosis?.toLowerCase().includes(query);
      case 'hospital':
        return record.hospitalName?.toLowerCase().includes(query);
      case 'medicine':
        if (!record.medicines || !Array.isArray(record.medicines)) return false;
        return record.medicines.some(med => 
          med?.medication?.toLowerCase().includes(query)
        );
      default:
        return record.diagnosis?.toLowerCase().includes(query) ||
               record.hospitalName?.toLowerCase().includes(query) ||
               (Array.isArray(record.medicines) && record.medicines.some(med => 
                 med?.medication?.toLowerCase().includes(query)
               ));
    }
  });

  // Get records to display based on showAll flag
  const displayedRecords = showAll 
    ? filteredPrescriptions 
    : filteredPrescriptions.slice(0, 3);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Health Records</h1>

        {/* Search Section */}
        <div className="bg-white shadow sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search by diagnosis, hospital, or medicine..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-40">
                <select
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value as 'all' | 'diagnosis' | 'hospital' | 'medicine')}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">All Fields</option>
                  <option value="diagnosis">Diagnosis</option>
                  <option value="hospital">Hospital</option>
                  <option value="medicine">Medicine</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Records Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2">Loading records...</span>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">{error}</div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No health records found</div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {displayedRecords.map((record, index) => (
                  <div key={index} className="px-4 py-4 sm:px-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{record.diagnosis}</h3>
                      <span className="text-sm text-gray-500">
                        {new Date(record.timestamp * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Hospital:</span> {record.hospitalName}
                    </p>
                    {record.medicines && record.medicines.length > 0 && (
                      <div className="mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Medicines:</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                          {record.medicines.map((med: any, idx: number) => (
                            <li key={idx}>
                              {med.medication} - {med.dosage}
                              {med.frequency && `, ${med.frequency}`}
                              {med.duration && `, ${med.duration}`}
                              {med.instructions && ` (${med.instructions})`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {record.notes && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Notes:</h4>
                        <p className="text-sm text-gray-600 mt-1">{record.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Show More Button */}
              {filteredPrescriptions.length > 3 && (
                <div className="px-4 py-4 sm:px-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {showAll ? 'Show Less' : `Show ${filteredPrescriptions.length - 3} More Records`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
