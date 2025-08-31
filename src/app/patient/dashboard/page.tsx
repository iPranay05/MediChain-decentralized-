'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWeb3 } from '@/context/Web3Context';

export default function PatientDashboard() {
  const router = useRouter();
  const [aadharNumber, setAadharNumber] = useState<string>('');
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [prescriptionsCount, setPrescriptionsCount] = useState<number>(0);
  const [nextAppointment, setNextAppointment] = useState<string>('None');
  const [insuranceStatus, setInsuranceStatus] = useState<string>('Unknown');
  const { contract, isConnected, connectWallet } = useWeb3();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAadhar = localStorage.getItem('aadharNumber');
    if (!storedAadhar) {
      router.push('/patient/login');
      return;
    }
    setAadharNumber(storedAadhar);
    fetchPatientData(storedAadhar);
  }, [router]);

  const fetchPatientData = async (patientAadhar: string) => {
    try {
      if (!isConnected || !contract) {
        await connectWallet();
      }

      if (contract) {
        // Fetch prescriptions
        const prescriptionData = await contract.getPrescriptions(patientAadhar);
        const prescriptionList = prescriptionData.map((p: any) => ({
          id: typeof p.id === 'bigint' ? Number(p.id) : (p.id?.toNumber ? p.id.toNumber() : Number(p.id)),
          diagnosis: p.diagnosis,
          medicines: p.medicines,
          timestamp: typeof p.timestamp === 'bigint' ? Number(p.timestamp) : (p.timestamp?.toNumber ? p.timestamp.toNumber() : Number(p.timestamp)),
          hospitalName: p.hospitalName
        }));
        
        // Count active prescriptions (less than 30 days old)
        const now = Math.floor(Date.now() / 1000);
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
        const activePrescriptions = prescriptionList.filter((p:any) => p.timestamp > thirtyDaysAgo);
        setPrescriptionsCount(activePrescriptions.length);

        // Fetch appointments
        const appointmentIds = await contract.getPatientAppointments(patientAadhar);
        if (appointmentIds && appointmentIds.length > 0) {
          const appointmentDetails = await Promise.all(
            appointmentIds.map(async (id: any) => {
              try {
                const idNumber = typeof id === 'bigint' ? Number(id) : (id?.toNumber ? id.toNumber() : Number(id));
                const appointment = await contract.appointments(idNumber);
                return {
                  id: idNumber,
                  timestamp: typeof appointment.timestamp === 'bigint' ? Number(appointment.timestamp) : 
                            (appointment.timestamp?.toNumber ? appointment.timestamp.toNumber() : Number(appointment.timestamp)),
                  department: appointment.department || 'General',
                  status: ['SCHEDULED', 'COMPLETED', 'CANCELLED'][appointment.status] || 'SCHEDULED'
                };
              } catch (err) {
                console.error('Error fetching appointment:', err);
                return null;
              }
            })
          );
          
          const validAppointments = appointmentDetails.filter((a): a is any => a !== null);
          
          // Find next upcoming appointment
          const upcomingAppointments = validAppointments
            .filter(a => a.timestamp > now && a.status === 'SCHEDULED')
            .sort((a, b) => a.timestamp - b.timestamp);
            
          if (upcomingAppointments.length > 0) {
            const nextDate = new Date(upcomingAppointments[0].timestamp * 1000);
            setNextAppointment(nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          }
        }

        // Fetch health coins for health score calculation
        const coins = await contract.healthCoins(patientAadhar);
        const healthCoinsValue = typeof coins === 'bigint' ? Number(coins) : (coins?.toNumber ? coins.toNumber() : Number(coins));
        
        // Calculate health score based on available data
        calculateHealthScore(healthCoinsValue, prescriptionList, appointmentIds?.length || 0);
        
        // Set insurance status (placeholder - could be fetched from contract in future)
        setInsuranceStatus(healthCoinsValue > 50 ? 'Active' : 'Inactive');
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHealthScore = (healthCoins: number, prescriptions: any[], appointmentsCount: number) => {
    // Base score starts at 70
    let score = 70;
    
    // Health coins contribute up to 15 points (1 point per 10 coins, max 15)
    const coinsContribution = Math.min(Math.floor(healthCoins / 10), 15);
    score += coinsContribution;
    
    // Regular check-ups contribute up to 10 points
    const appointmentsContribution = Math.min(appointmentsCount * 2, 10);
    score += appointmentsContribution;
    
    // Following prescriptions and having recent medical records contributes up to 5 points
    const now = Math.floor(Date.now() / 1000);
    const sixMonthsAgo = now - (180 * 24 * 60 * 60);
    const recentPrescriptions = prescriptions.filter(p => p.timestamp > sixMonthsAgo);
    const prescriptionContribution = Math.min(recentPrescriptions.length, 5);
    score += prescriptionContribution;
    
    // Ensure score is between 0-100
    score = Math.max(0, Math.min(100, score));
    setHealthScore(score);
  };

  if (!aadharNumber || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const cards = [
    {
      title: 'My Profile',
      description: 'View and update your personal information',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      link: '/patient/profile',
      color: 'bg-blue-500'
    },
    {
      title: 'Health Records',
      description: 'View your medical history and records',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      link: '/patient/health-records',
      color: 'bg-indigo-500'
    },
    {
      title: 'Health Analytics',
      description: 'Track your health metrics and progress',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      link: '/patient/analytics',
      color: 'bg-green-500'
    },
    {
      title: 'Medical Store',
      description: 'Purchase medicines and health products',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      link: '/patient/store',
      color: 'bg-purple-500'
    },
    {
      title: 'Symptom Analyzer',
      description: 'AI-powered analysis of your symptoms',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6" />
        </svg>
      ),
      link: '/patient/symptom-analyzer',
      color: 'bg-teal-500'
    },
    {
      title: 'Voice Prescriptions',
      description: 'Listen to doctor-dictated prescriptions',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      ),
      link: '/patient/voice-prescriptions',
      color: 'bg-indigo-600'
    },
    {
      title: 'Medical Image Analysis',
      description: 'AI assessment of medical images',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      link: '/patient/medical-image-analysis',
      color: 'bg-purple-600'
    },
    {
      title: 'Health Advisor',
      description: 'Get personalized health recommendations',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      link: '/patient/health-advisor',
      color: 'bg-yellow-500'
    },
    {
      title: 'Healthcare Facilities',
      description: 'Find hospitals and clinics near you',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      link: '/patient/facility-finder',
      color: 'bg-indigo-600'
    },
    {
      title: 'Appointments',
      description: 'Schedule and manage your appointments',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      link: '/patient/appointments',
      color: 'bg-green-600'
    },
    {
      title: 'Insurance',
      description: 'View and manage your insurance coverage',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      link: '/patient/insurance',
      color: 'bg-blue-600'
    }
  ];

  const stats = [
    {
      title: 'Next Appointment',
      value: nextAppointment,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: 'Prescriptions',
      value: `${prescriptionsCount} Active`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: 'Health Score',
      value: healthScore !== null ? `${healthScore}/100` : 'Calculating...',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      title: 'Insurance Status',
      value: insuranceStatus,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
        <p className="text-gray-600">
          Aadhar: {aadharNumber.replace(/(\d{4})/g, '$1 ').trim()}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              {stat.icon}
              <span className="text-sm">{stat.title}</span>
            </div>
            <div className="text-lg font-semibold">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Main Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <Link 
            key={index}
            href={card.link}
            className={`${card.color} text-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow`}
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {card.icon}
                <h2 className="text-lg font-semibold">{card.title}</h2>
              </div>
              <p className="text-sm opacity-90">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
