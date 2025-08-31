'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaFingerprint, FaShieldAlt } from 'react-icons/fa';
import { useWeb3 } from '@/context/Web3Context';

export default function PatientLogin() {
  const router = useRouter();
  const { contract, isConnected, connectWallet } = useWeb3();
  const [aadharNumber, setAadharNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'aadhar' | 'otp'>('aadhar');
  const [otpSent, setOtpSent] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleAadharSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDebugInfo(null);

    try {
      // Validate Aadhar format
      if (!/^\d{12}$/.test(aadharNumber)) {
        throw new Error('Please enter a valid 12-digit Aadhar number');
      }

      // Send OTP
      const response = await fetch('/api/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aadharNumber,
          action: 'send'
        }),
      });

      const data = await response.json();
      console.log('OTP Response:', data); // Debug log

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      // Store debug info if available
      if (data.debug) {
        setDebugInfo(data.debug);
      }

      // Start OTP timer (5 minutes)
      setRemainingTime(300);
      const timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setOtpSent(true);
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDebugInfo(null);

    try {
      // Validate OTP format
      if (!/^\d{6}$/.test(otp)) {
        throw new Error('Please enter a valid 6-digit OTP');
      }

      // Verify OTP
      const response = await fetch('/api/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aadharNumber,
          otp,
          action: 'verify'
        }),
      });

      const data = await response.json();
      console.log('Verification Response:', data);

      if (!response.ok) {
        if (data.debug) {
          setDebugInfo(data.debug);
        }
        throw new Error(data.error || 'Failed to verify OTP');
      }

      // Connect to blockchain if not connected
      if (!isConnected) {
        try {
          await connectWallet();
        } catch (err) {
          console.error('Error connecting wallet:', err);
          setError('Please install MetaMask and connect your wallet to continue');
          return;
        }
      }

      // Register patient in blockchain if contract is available
      if (contract) {
        try {
          // Get signer address using ethers v6 syntax
          const address = await contract.runner.getAddress();
          
          // Debug contract interface to see available functions
          console.log('Contract interface:', contract.interface.fragments.map((f: any) => f.name));
          
          // Since hasAccess is internal, we can't call it directly
          // Instead, try to register the patient directly
          try {
            console.log('Registering patient in blockchain...');
            const tx = await contract.registerPatient(aadharNumber);
            await tx.wait();
            console.log('Patient registered successfully');
          } catch (registerErr: any) {
            // If the error is "Patient already registered", that's fine
            if (registerErr.message && registerErr.message.includes("Patient already registered")) {
              console.log('Patient already registered, continuing...');
            } else {
              // For other errors, try alternative approaches
              console.error('Error registering patient:', registerErr);
              
              // Try to call other functions that might exist
              try {
                // Try getPrescriptions to see if we can access patient data
                await contract.getPrescriptions(aadharNumber);
                console.log('Patient has access, continuing...');
              } catch (accessErr) {
                console.error('Error checking patient access:', accessErr);
                setError('Failed to register in blockchain. Please try again.');
                return;
              }
            }
          }
        } catch (err) {
          console.error('Error registering patient:', err);
          setError('Failed to register in blockchain. Please try again.');
          return;
        }
      } else {
        throw new Error('Contract not initialized');
      }

      // Store aadhar number in localStorage
      localStorage.setItem('aadharNumber', aadharNumber);
      
      // Redirect to dashboard
      router.push('/patient/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Patient Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please verify your identity using Aadhar
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {debugInfo && (
            <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded relative">
              <pre className="text-xs overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}

          {step === 'aadhar' ? (
            <form onSubmit={handleAadharSubmit} className="space-y-6">
              <div>
                <label htmlFor="aadhar" className="flex items-center text-sm font-medium text-gray-700">
                  <FaFingerprint className="mr-2" />
                  Aadhar Number
                </label>
                <div className="mt-1">
                  <input
                    id="aadhar"
                    name="aadhar"
                    type="text"
                    pattern="\d*"
                    maxLength={12}
                    required
                    value={aadharNumber}
                    onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter 12-digit Aadhar number"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || aadharNumber.length !== 12}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    loading || aadharNumber.length !== 12
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <label htmlFor="otp" className="flex items-center text-sm font-medium text-gray-700">
                  <FaShieldAlt className="mr-2" />
                  Enter OTP
                </label>
                <div className="mt-1">
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    pattern="\d*"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter 6-digit OTP"
                  />
                </div>
                {remainingTime > 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    OTP expires in: {formatTime(remainingTime)}
                  </p>
                )}
                {remainingTime === 0 && otpSent && (
                  <button
                    type="button"
                    onClick={handleAadharSubmit}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setStep('aadhar');
                    setOtp('');
                    setError('');
                    setDebugInfo(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Change Aadhar Number
                </button>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    loading || otp.length !== 6
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
