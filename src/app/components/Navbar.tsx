'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { FaSignOutAlt } from 'react-icons/fa';

interface NavbarProps {
  userType: 'hospital' | 'patient';
  onLogout: () => void;
  userName: string;
  userIdentifier: string;
}

export default function Navbar({ userType, onLogout, userName, userIdentifier }: NavbarProps) {
  const pathname = usePathname();
  
  const navItems = userType === 'hospital' 
    ? [
        { label: 'Dashboard', href: '/hospital/dashboard' },
        { label: 'Hospital', href: '/hospital' },
        { label: 'Patient', href: '/patient' }
      ]
    : [
        { label: 'Dashboard', href: '/patient/dashboard' },
        { label: 'Profile', href: '/patient/profile' },
        { label: 'Analytics', href: '/patient/analytics' },
        { label: 'Store', href: '/patient/store' },
        { label: 'Health Advisor', href: '/patient/health-advisor' },
        { label: 'Appointments', href: '/patient/appointments' },
        { label: 'Insurance', href: '/patient/insurance' }
      ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href={userType === 'hospital' ? '/hospital/dashboard' : '/patient/dashboard'} className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8">
                  <svg viewBox="0 0 24 24" className="w-full h-full text-blue-600" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 7h3V7h-3V5h5v14h-5v-2h3v-3h-3V10z"/>
                  </svg>
                </div>
                <span className="text-xl font-semibold text-blue-600">MediChain</span>
              </div>
            </Link>
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                    pathname === item.href
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{userName}</span>
              <span className="mx-2">•</span>
              <span className="text-gray-500">{userIdentifier}</span>
            </div>
            <button
              onClick={onLogout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-150"
            >
              <FaSignOutAlt className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
