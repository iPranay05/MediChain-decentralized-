'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { motion } from 'framer-motion';

interface AccessLog {
  accessor: string;
  patientAadhar: string;
  timestamp: number;
  action: string;
  isEmergencyAccess: boolean;
}

export default function AccessControl() {
  const [aadharNumber, setAadharNumber] = useState('');
  const [providerAddress, setProviderAddress] = useState('');
  const [accessLevel, setAccessLevel] = useState('1'); // Default to READ
  const [emergencyContact, setEmergencyContact] = useState('');
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { contract, connectWallet, isConnected } = useWeb3();

  const validateAadhar = (aadhar: string) => {
    const aadharRegex = /^\d{12}$/;
    return aadharRegex.test(aadhar);
  };

  const validateAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !isConnected) {
      await connectWallet();
      return;
    }

    if (!validateAadhar(aadharNumber)) {
      setError('Please enter a valid 12-digit Aadhar number');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const tx = await contract.registerPatient(aadharNumber);
      await tx.wait();
      
      setSuccess('Patient registered successfully!');
    } catch (err: any) {
      console.error('Error registering patient:', err);
      setError(err.message || 'Error registering patient');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !isConnected) {
      await connectWallet();
      return;
    }

    if (!validateAadhar(aadharNumber)) {
      setError('Please enter a valid 12-digit Aadhar number');
      return;
    }

    if (!validateAddress(providerAddress)) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const tx = await contract.grantAccess(aadharNumber, providerAddress, parseInt(accessLevel));
      await tx.wait();
      
      setSuccess('Access granted successfully!');
    } catch (err: any) {
      console.error('Error granting access:', err);
      setError(err.message || 'Error granting access');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmergencyContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !isConnected) {
      await connectWallet();
      return;
    }

    if (!validateAadhar(aadharNumber)) {
      setError('Please enter a valid 12-digit Aadhar number');
      return;
    }

    if (!validateAddress(emergencyContact)) {
      setError('Please enter a valid Ethereum address for emergency contact');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const tx = await contract.addEmergencyContact(aadharNumber, emergencyContact);
      await tx.wait();
      
      setSuccess('Emergency contact added successfully!');
    } catch (err: any) {
      console.error('Error adding emergency contact:', err);
      setError(err.message || 'Error adding emergency contact');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessLogs = async () => {
    if (!contract || !aadharNumber || !validateAadhar(aadharNumber)) return;

    try {
      setLoading(true);
      setError('');
      const logs = await contract.getAccessLogs(aadharNumber);
      setAccessLogs(logs);
    } catch (err: any) {
      console.error('Error fetching access logs:', err);
      setError(err.message || 'Error fetching access logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-xl shadow-lg"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Access Control</h2>

          {!isConnected && (
            <div className="text-center mb-8">
              <button
                onClick={connectWallet}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Connect Wallet
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6">
              {success}
            </div>
          )}

          <div className="grid gap-8">
            {/* Patient Registration */}
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-semibold mb-4">Register Patient</h3>
              <form onSubmit={handleRegisterPatient} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Aadhar Number
                  </label>
                  <input
                    type="text"
                    pattern="\d{12}"
                    maxLength={12}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={aadharNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                      setAadharNumber(value);
                      setError('');
                    }}
                    placeholder="Enter 12-digit Aadhar number"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !isConnected || !validateAadhar(aadharNumber)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Register Patient
                </button>
              </form>
            </div>

            {/* Grant Access */}
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-semibold mb-4">Grant Access</h3>
              <form onSubmit={handleGrantAccess} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Provider Address
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={providerAddress}
                    onChange={(e) => setProviderAddress(e.target.value)}
                    placeholder="Enter provider's Ethereum address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Access Level
                  </label>
                  <select
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="1">Read</option>
                    <option value="2">Write</option>
                    <option value="3">Full</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading || !isConnected || !validateAadhar(aadharNumber) || !validateAddress(providerAddress)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Grant Access
                </button>
              </form>
            </div>

            {/* Emergency Contact */}
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-semibold mb-4">Add Emergency Contact</h3>
              <form onSubmit={handleAddEmergencyContact} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Emergency Contact Address
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Enter emergency contact's Ethereum address"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !isConnected || !validateAadhar(aadharNumber) || !validateAddress(emergencyContact)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Add Emergency Contact
                </button>
              </form>
            </div>

            {/* Access Logs */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Access Logs</h3>
                <button
                  onClick={fetchAccessLogs}
                  disabled={loading || !isConnected || !validateAadhar(aadharNumber)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Refresh Logs
                </button>
              </div>

              {accessLogs.length > 0 ? (
                <div className="space-y-4">
                  {accessLogs.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-gray-50 p-4 rounded-lg"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Accessor</p>
                          <p className="font-medium truncate">{log.accessor}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Action</p>
                          <p className="font-medium">{log.action}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Time</p>
                          <p className="font-medium">
                            {new Date(log.timestamp * 1000).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Emergency Access</p>
                          <p className="font-medium">
                            {log.isEmergencyAccess ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No access logs found</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
