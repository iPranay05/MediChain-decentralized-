'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu and dropdown when path changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setIsOpen(false);
  }, [pathname]);

  // Handle click outside of dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActive = (path: string) => {
    return pathname === path ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600';
  };

  return (
    <>
      <nav 
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white shadow-lg backdrop-blur-lg bg-opacity-95' 
            : 'bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-3 group">
                <img
                  className="h-8 w-8 transform group-hover:scale-110 transition-transform"
                  src="/logo-white.svg"
                  alt="MediChain"
                />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                  MediChain
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                href="/"
                className={`text-sm font-medium transition-colors duration-200 ${
                  pathname === '/' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                Home
              </Link>
              
              <SignedIn>
                {/* Services Dropdown */}
                <div className="relative group" ref={dropdownRef}>
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="text-sm font-medium text-gray-600 hover:text-blue-600 flex items-center space-x-1 focus:outline-none"
                  >
                    <span>Services</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isOpen && (
                    <div 
                      className="absolute left-0 mt-2 w-56 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden bg-white"
                    >
                      <div className="relative grid gap-1 bg-white p-2">
                        {[
                          { href: '/patient', label: 'Patient Portal' },
                          { href: '/hospital', label: 'Hospital Portal' },
                          { href: '/pharmacy', label: 'Pharmacy Portal' },
                          { href: '/appointments', label: 'Appointments' },
                          { href: '/store', label: 'Health Store' },
                          { href: '/analytics', label: 'Analytics' },
                          { href: '/insurance', label: 'Insurance' },
                        ].map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`group flex items-center px-4 py-2 text-sm rounded-md transition-colors duration-150 ${
                              pathname === item.href 
                                ? 'text-blue-600 bg-blue-50' 
                                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                            }`}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Link 
                  href="/health-advisor"
                  className={`text-sm font-medium transition-colors duration-200 ${
                    pathname === '/health-advisor' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Health Advisor
                </Link>

                <Link 
                  href="/profile"
                  className={`text-sm font-medium transition-colors duration-200 ${
                    pathname === '/profile' ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Profile
                </Link>
              </SignedIn>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-4 md:hidden">
              <SignedIn>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 rounded-full border-2 border-blue-400 hover:border-blue-500 transition-colors"
                    }
                  }}
                />
              </SignedIn>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-blue-600 p-2"
              >
                <span className="sr-only">Open menu</span>
                {!mobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
              <SignedIn>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-10 h-10 rounded-full border-2 border-blue-400 hover:border-blue-500 transition-colors"
                    }
                  }}
                />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105">
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-50 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-black bg-opacity-25 transition-opacity duration-300 ease-in-out ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Menu Content */}
        <div className="relative w-4/5 max-w-sm bg-white h-full overflow-y-auto shadow-xl">
          <div className="px-4 py-6 space-y-6">
            <div className="flex items-center justify-between">
              <Link 
                href="/" 
                className="flex items-center space-x-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <img
                  className="h-8 w-8"
                  src="/logo-white.svg"
                  alt="MediChain"
                />
                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                  MediChain
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <Link
                href="/"
                className={`block px-4 py-2 text-base font-medium rounded-md ${
                  pathname === '/' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>

              <SignedIn>
                {/* Mobile Services Links */}
                <div className="space-y-1">
                  <div className="px-4 py-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Services
                  </div>
                  {[
                    { href: '/patient', label: 'Patient Portal' },
                    { href: '/hospital', label: 'Hospital Portal' },
                    { href: '/pharmacy', label: 'Pharmacy Portal' },
                    { href: '/appointments', label: 'Appointments' },
                    { href: '/store', label: 'Health Store' },
                    { href: '/analytics', label: 'Analytics' },
                    { href: '/insurance', label: 'Insurance' },
                    { href: '/health-advisor', label: 'Health Advisor' },
                    { href: '/patient/facility-finder', label: 'Healthcare Facilities' },
                    { href: '/profile', label: 'Profile' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-4 py-2 text-base font-medium rounded-md ${
                        pathname === item.href 
                          ? 'text-blue-600 bg-blue-50' 
                          : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* Mobile Auth Section */}
                <div className="px-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <UserButton 
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox: "w-10 h-10 rounded-full border-2 border-blue-400"
                        }
                      }}
                    />
                    <div className="text-sm text-gray-600">
                      Manage Account
                    </div>
                  </div>
                </div>
              </SignedIn>
              <SignedOut>
                <div className="px-4 pt-4 border-t border-gray-200">
                  <SignInButton mode="modal">
                    <button className="w-full px-4 py-2 text-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
                      Sign in
                    </button>
                  </SignInButton>
                </div>
              </SignedOut>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
