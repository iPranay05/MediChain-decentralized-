'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FaHospital, 
  FaUserInjured, 
  FaChartLine, 
  FaCalendarAlt, 
  FaClipboardList,
  FaUserMd,
  FaMicrophone,
  FaFileMedical,
  FaHeadphones,
  FaPrescription
} from 'react-icons/fa';

export default function HospitalDashboard() {
  const router = useRouter();
  const [hospitalInfo, setHospitalInfo] = useState({
    name: '',
    registrationNumber: ''
  });

  useEffect(() => {
    const name = localStorage.getItem('hospitalName');
    const regNumber = localStorage.getItem('registrationNumber');

    if (!name || !regNumber) {
      router.push('/hospital/login');
      return;
    }

    setHospitalInfo({
      name,
      registrationNumber: regNumber
    });
  }, [router]);

  const cards = [
    {
      title: 'Voice Prescription',
      description: 'Dictate prescriptions for patients using voice recording',
      icon: <FaHeadphones className="w-8 h-8" />,
      href: '/hospital/voice-prescription',
      color: 'from-indigo-500 to-indigo-600',
      isNew: true
    },
    {
      title: 'Voice Medical Records',
      description: 'Create medical records and prescriptions using voice recognition',
      icon: <FaMicrophone className="w-8 h-8" />,
      href: '/hospital/create-record',
      color: 'from-purple-500 to-purple-600',
      isNew: true
    },
    {
      title: 'Hospital Records',
      description: 'Manage hospital records and staff information',
      icon: <FaHospital className="w-8 h-8" />,
      href: '/hospital',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Staff Management',
      description: 'Manage hospital staff and roles',
      icon: <FaUserMd className="w-8 h-8" />,
      href: '/hospital/staff',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Patient Records',
      description: 'Access and manage patient medical records',
      icon: <FaUserInjured className="w-8 h-8" />,
      href: '/patient',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Appointments',
      description: 'Manage patient appointments',
      icon: <FaCalendarAlt className="w-8 h-8" />,
      href: '/hospital/appointments',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      title: 'Medical Records',
      description: 'View and update medical records',
      icon: <FaClipboardList className="w-8 h-8" />,
      href: '/hospital/records',
      color: 'from-red-500 to-red-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hospital Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome back, {hospitalInfo.name}
              </p>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">Registration Number</p>
              <p className="text-sm font-medium text-gray-900">{hospitalInfo.registrationNumber}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Patients', value: '1,234' },
            { label: 'Today\'s Appointments', value: '48' },
            { label: 'Active Staff', value: '56' },
            { label: 'Success Rate', value: '98.5%' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm p-4"
            >
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link href={card.href}>
                <div className={`bg-gradient-to-r ${card.color} text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 p-6 relative`}>
                  {card.isNew && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-full text-gray-800">
                      NEW
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-white/20 rounded-lg p-3">
                      {card.icon}
                    </div>
                    <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                  <p className="text-white/80">{card.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
