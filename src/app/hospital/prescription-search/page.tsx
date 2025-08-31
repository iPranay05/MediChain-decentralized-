'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { motion } from 'framer-motion';
import { Prescription } from '@/types/Prescription';
import { ethers } from 'ethers';

export default function PrescriptionSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterType, setFilterType] = useState('all');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { contract, isConnected, connectWallet } = useWeb3();

  // Fetch prescriptions from the blockchain
  const fetchPrescriptions = async () => {
    if (!contract) {
      setError('Contract not initialized');
      return;
    }

    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Call the contract method
      const result = await contract.getAllPrescriptions();
      
      // Transform the result into our Prescription type
      const formattedPrescriptions: Prescription[] = result.map((p: any) => ({
        id: p.id.toNumber(),
        patientAadhar: p.patientAadhar,
        diagnosis: p.diagnosis,
        medication: p.medication,
        dosage: p.dosage,
        notes: p.notes,
        timestamp: p.timestamp.toNumber()
      }));

      setPrescriptions(formattedPrescriptions);
      setFilteredPrescriptions(formattedPrescriptions);
    } catch (err: any) {
      console.error('Error fetching prescriptions:', err);
      setError(err.message || 'Error fetching prescriptions');
    } finally {
      setLoading(false);
    }
  };

  // Connect wallet if not connected
  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    }
  };

  // Smart search function with fuzzy matching
  const searchPrescriptions = () => {
    if (!searchTerm && !dateRange.start && !dateRange.end) {
      setFilteredPrescriptions(prescriptions);
      return;
    }

    const filtered = prescriptions.filter((prescription) => {
      let matches = true;

      // Text search
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          prescription.diagnosis.toLowerCase().includes(searchLower) ||
          prescription.medication.toLowerCase().includes(searchLower) ||
          prescription.notes.toLowerCase().includes(searchLower) ||
          prescription.patientAadhar.includes(searchTerm);

        if (!matchesSearch) matches = false;
      }

      // Date range filter
      if (dateRange.start || dateRange.end) {
        const prescriptionDate = new Date(prescription.timestamp * 1000);
        if (dateRange.start && prescriptionDate < new Date(dateRange.start)) matches = false;
        if (dateRange.end && prescriptionDate > new Date(dateRange.end)) matches = false;
      }

      return matches;
    });

    setFilteredPrescriptions(filtered);
  };

  // Effect for search
  useEffect(() => {
    searchPrescriptions();
  }, [searchTerm, dateRange, filterType]);

  // Initial fetch when contract is ready
  useEffect(() => {
    if (contract && isConnected) {
      fetchPrescriptions();
    }
  }, [contract, isConnected]);

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-4">Prescription Search</h1>

        {!isConnected ? (
          <div className="text-center py-8">
            <p className="mb-4 text-gray-600">Please connect your wallet to view prescriptions</p>
            <button
              onClick={handleConnect}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            {/* Search Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <input
                  type="text"
                  placeholder="Search by diagnosis, medication, or Aadhar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-4">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Records</option>
                <option value="recent">Recent (Last 30 days)</option>
                <option value="diagnosis">Group by Diagnosis</option>
                <option value="medication">Group by Medication</option>
              </select>
            </div>

            {/* Results Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading prescriptions...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  {error}
                  <button
                    onClick={fetchPrescriptions}
                    className="block mx-auto mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredPrescriptions.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  No prescriptions found
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPrescriptions.map((prescription) => (
                    <motion.div
                      key={prescription.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="mb-2">
                        <span className="text-sm text-gray-500">
                          {new Date(prescription.timestamp * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-2">{prescription.diagnosis}</h3>
                      <div className="text-sm">
                        <p><span className="font-medium">Medication:</span> {prescription.medication}</p>
                        <p><span className="font-medium">Dosage:</span> {prescription.dosage}</p>
                        <p className="text-gray-600 mt-2">{prescription.notes}</p>
                      </div>
                      <div className="mt-4 text-sm text-gray-500">
                        Patient ID: {prescription.patientAadhar}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
