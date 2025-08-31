'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Navbar from '../components/Navbar';

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [aadharNumber, setAadharNumber] = useState('');
  const [patientName, setPatientName] = useState('John Doe'); // This will be replaced with actual patient name

  useEffect(() => {
    const storedAadhar = localStorage.getItem('aadharNumber');
    if (!storedAadhar && pathname !== '/patient/login') {
      router.push('/patient/login');
      return;
    }
    setAadharNumber(storedAadhar || '');
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem('aadharNumber');
    router.push('/');
  };

  // Don't show navigation on login page
  if (pathname === '/patient/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        userType="patient"
        userName={patientName}
        userIdentifier={aadharNumber.replace(/(\d{4})/g, '$1 ').trim()}
        onLogout={handleLogout}
      />
      <main className="py-4">{children}</main>
    </div>
  );
}
