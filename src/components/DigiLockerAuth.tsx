'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DigiLockerResponse {
  aadhaar: string;
  name: string;
  dob: string;
  gender: string;
}

export default function DigiLockerAuth() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const initiateDigiLockerAuth = async () => {
    setIsLoading(true);
    try {
      // Initialize DigiLocker OAuth flow
      const response = await fetch('/api/digilocker/init', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const { authUrl } = await response.json();
      
      // Open DigiLocker login window
      window.location.href = authUrl;
    } catch (error) {
      console.error('DigiLocker authentication error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={initiateDigiLockerAuth}
        disabled={isLoading}
        className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {isLoading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Connecting...
          </span>
        ) : (
          <>
            <img src="/digilocker-logo.svg" alt="DigiLocker" className="w-6 h-6 mr-2" />
            Connect with DigiLocker
          </>
        )}
      </button>
      <p className="text-sm text-gray-600">
        Securely verify your identity using DigiLocker
      </p>
    </div>
  );
}
