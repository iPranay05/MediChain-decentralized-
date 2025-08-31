'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/context/Web3Context';
import Layout from '@/components/Layout';

interface PatientInfo {
  name: string;
  aadhar: string;
  email?: string;
  phone?: string;
  bloodGroup?: string;
  age?: number;
  gender?: string;
}

const registeredPatients: { [key: string]: PatientInfo } = {
  '463326556422': {
    name: 'Pranay Nair',
    aadhar: '463326556422',
    email: 'pranay.nair@example.com',
    phone: '9876543210',
    bloodGroup: 'O+',
    age: 21,
    gender: 'Male'
    
  },
  '569963877196': {
    name: 'Aditya Dubey',
    aadhar: '569963877196',
    email: 'aditya.dubey@example.com',
    phone: '8765432109',
    bloodGroup: 'B+',
    age: 22,
    gender: 'Male'
  },
  '342184819839': {
    name: 'Nidhi Tripathi',
    aadhar: '342184819839',
    email: 'nidhi.tripathi@example.com',
    phone: '7654321098',
    bloodGroup: 'A+',
    age: 21,
    gender: 'Female'
  },
  '617388697137': {
    name: 'Bhoomi Pandey',
    aadhar: '617388697137',
    email: 'bhoomi.pandey@example.com',
    phone: '6543210987',
    bloodGroup: 'AB+',
    age: 20,
    gender: 'Female'
  }
};

export default function PatientProfile() {
  const router = useRouter();
  const { contract, isConnected } = useWeb3();
  const [aadharNumber, setAadharNumber] = useState('');
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedAadhar = localStorage.getItem('aadharNumber');
    if (!storedAadhar) {
      router.push('/patient/login');
      return;
    }
    setAadharNumber(storedAadhar);

    // Check if patient exists in registered list
    const info = registeredPatients[storedAadhar];
    if (!info) {
      setError(`No patient found with Aadhar number ${storedAadhar}. Please ensure you are registered in the system.`);
      return;
    }
    setPatientInfo(info);
  }, [router]);

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <button
                onClick={() => router.push('/patient/login')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!patientInfo) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900">Patient Profile</h1>
          <div className="mt-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Personal Information</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Your personal and medical details.</p>
              </div>
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Full name</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patientInfo.name}</dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Aadhar number</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {patientInfo.aadhar.replace(/(\d{4})/g, '$1 ').trim()}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Email address</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patientInfo.email}</dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patientInfo.phone}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Blood group</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patientInfo.bloodGroup}</dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Age</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patientInfo.age}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Gender</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{patientInfo.gender}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
