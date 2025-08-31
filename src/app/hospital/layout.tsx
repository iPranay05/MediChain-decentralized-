'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Navbar from '../components/Navbar';

export default function HospitalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [hospitalInfo, setHospitalInfo] = useState({
    name: '',
    registrationNumber: ''
  });

  useEffect(() => {
    const name = localStorage.getItem('hospitalName');
    const regNumber = localStorage.getItem('registrationNumber');

    if (!name || !regNumber) {
      if (pathname !== '/hospital/login') {
        router.push('/hospital/login');
      }
      return;
    }

    setHospitalInfo({
      name,
      registrationNumber: regNumber
    });
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem('hospitalName');
    localStorage.removeItem('hospitalAddress');
    localStorage.removeItem('registrationNumber');
    router.push('/');
  };

  // Don't show navigation on login page
  if (pathname === '/hospital/login') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        userType="hospital"
        userName={hospitalInfo.name}
        userIdentifier={`Reg: ${hospitalInfo.registrationNumber}`}
        onLogout={handleLogout}
      />
      <main className="py-4">{children}</main>
    </div>
  );
}
