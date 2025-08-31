'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '@/context/Web3Context';
import Layout from '@/components/Layout';
import { ethers } from 'ethers';

enum AppointmentStatus {
  SCHEDULED = 0,
  CONFIRMED = 1,
  CANCELLED = 2,
  COMPLETED = 3
}

interface Appointment {
  id: number;
  patientAadhar: string;
  timestamp: number;
  status: AppointmentStatus;
  contactEmail: string;
  contactPhone: string;
  notes: string;
  department: string;
}

export default function HospitalAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { contract, connectWallet, isConnected, account } = useWeb3();

  // Load appointments from localStorage
  const loadAppointmentsFromStorage = () => {
    // Check if running in browser environment
    if (typeof window === 'undefined') return [];
    
    try {
      // Load hospital-specific appointments
      const hospitalAppointments = localStorage.getItem(`hospital_appointments_${account}`);
      let appointments: Appointment[] = [];
      
      if (hospitalAppointments) {
        appointments = JSON.parse(hospitalAppointments) as Appointment[];
      }
      
      // Also load all patient appointments from localStorage
      const allKeys = Object.keys(localStorage);
      const patientAppointmentKeys = allKeys.filter(key => key.startsWith('appointments_'));
      
      for (const key of patientAppointmentKeys) {
        try {
          const patientAppointments = JSON.parse(localStorage.getItem(key) || '[]') as any[];
          
          // Convert patient appointments to hospital format if needed
          const convertedAppointments = patientAppointments.map(app => ({
            id: app.id,
            patientAadhar: app.patientAadhar,
            timestamp: app.timestamp,
            status: typeof app.status === 'string' 
              ? app.status === 'SCHEDULED' ? AppointmentStatus.SCHEDULED 
              : app.status === 'CONFIRMED' ? AppointmentStatus.CONFIRMED 
              : app.status === 'CANCELLED' ? AppointmentStatus.CANCELLED 
              : app.status === 'COMPLETED' ? AppointmentStatus.COMPLETED 
              : AppointmentStatus.SCHEDULED
              : app.status,
            contactEmail: app.contactEmail,
            contactPhone: app.contactPhone,
            notes: app.notes,
            department: app.department
          }));
          
          // Add to appointments array, avoiding duplicates by ID
          for (const app of convertedAppointments) {
            if (!appointments.some(a => a.id === app.id)) {
              appointments.push(app);
            }
          }
        } catch (error) {
          console.error(`Error processing patient appointments from ${key}:`, error);
        }
      }
      
      return appointments;
    } catch (error) {
      console.error('Error loading appointments from localStorage:', error);
    }
    return [];
  };

  // Save appointments to localStorage
  const saveAppointmentsToStorage = (appointments: Appointment[]) => {
    // Check if running in browser environment
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(`hospital_appointments_${account}`, JSON.stringify(appointments));
    } catch (error) {
      console.error('Error saving appointments to localStorage:', error);
    }
  };

  useEffect(() => {
    // Load appointments when the component mounts
    fetchAppointments();
    
    // Set up event listener for storage changes
    const handleStorageChange = () => {
      fetchAppointments();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [account]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Load all appointments from localStorage
      const allAppointments = loadAppointmentsFromStorage();
      
      if (allAppointments && allAppointments.length > 0) {
        setAppointments(allAppointments);
        setLoading(false);
        return;
      }
      
      // If no stored appointments, create test appointments
      const testAppointments: Appointment[] = [
        {
          id: 1,
          patientAadhar: '123456789012',
          timestamp: Math.floor(Date.now() / 1000),
          status: AppointmentStatus.SCHEDULED,
          contactEmail: 'patient1@example.com',
          contactPhone: '1234567890',
          notes: 'Regular checkup',
          department: 'General Medicine'
        },
        {
          id: 2,
          patientAadhar: '987654321098',
          timestamp: Math.floor(Date.now() / 1000) + 86400, // Tomorrow
          status: AppointmentStatus.CONFIRMED,
          contactEmail: 'patient2@example.com',
          contactPhone: '9876543210',
          notes: 'Follow-up appointment',
          department: 'Cardiology'
        }
      ];
      
      setAppointments(testAppointments);
      saveAppointmentsToStorage(testAppointments);
      
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError(err.message || 'Error fetching appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId: number, newStatus: AppointmentStatus) => {
    try {
      setLoading(true);
      
      // Find the appointment in the current state
      const updatedAppointments = appointments.map(appointment => {
        if (appointment.id === appointmentId) {
          return { ...appointment, status: newStatus };
        }
        return appointment;
      });
      
      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update state and localStorage
      setAppointments(updatedAppointments);
      saveAppointmentsToStorage(updatedAppointments);
      
      setSuccess('Appointment status updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error updating appointment status:', err);
      setError(err.message || 'Error updating appointment status');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return 'Scheduled';
      case AppointmentStatus.CONFIRMED:
        return 'Confirmed';
      case AppointmentStatus.CANCELLED:
        return 'Cancelled';
      case AppointmentStatus.COMPLETED:
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return 'text-yellow-600 bg-yellow-100';
      case AppointmentStatus.CONFIRMED:
        return 'text-blue-600 bg-blue-100';
      case AppointmentStatus.CANCELLED:
        return 'text-red-600 bg-red-100';
      case AppointmentStatus.COMPLETED:
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const filteredAppointments = appointments
    .filter(appointment => {
      if (filterStatus === 'all') return true;
      return appointment.status === filterStatus;
    })
    .filter(appointment => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        appointment.patientAadhar.toLowerCase().includes(query) ||
        appointment.department.toLowerCase().includes(query) ||
        appointment.contactEmail.toLowerCase().includes(query) ||
        appointment.contactPhone.includes(query)
      );
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Appointments Management</h1>
          <button
            onClick={fetchAppointments}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Refresh Appointments
          </button>
        </div>

        {(error || success) && (
          <div className={`mb-4 p-4 rounded-lg ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {error || success}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
              Filter by Status
            </label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AppointmentStatus | 'all')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Appointments</option>
              <option value={AppointmentStatus.SCHEDULED}>Scheduled</option>
              <option value={AppointmentStatus.CONFIRMED}>Confirmed</option>
              <option value={AppointmentStatus.CANCELLED}>Cancelled</option>
              <option value={AppointmentStatus.COMPLETED}>Completed</option>
            </select>
          </div>

          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search Appointments
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Aadhar, department, or contact..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredAppointments.map((appointment) => {
              const { date, time } = formatDate(appointment.timestamp);
              return (
                <motion.li
                  key={appointment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">
                            Department: {appointment.department}
                          </p>
                          <p className="text-sm text-gray-500">
                            Patient ID: {appointment.patientAadhar}
                          </p>
                        </div>
                        <div className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {getStatusText(appointment.status)}
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="truncate">{date} at {time}</span>
                        </div>
                      </div>
                      {appointment.notes && (
                        <p className="mt-1 text-sm text-gray-600">{appointment.notes}</p>
                      )}
                      <div className="mt-2 flex space-x-4 text-sm text-gray-500">
                        <span>Email: {appointment.contactEmail}</span>
                        <span>Phone: {appointment.contactPhone}</span>
                      </div>
                    </div>
                  </div>

                  {appointment.status === AppointmentStatus.SCHEDULED && (
                    <div className="mt-4 flex space-x-3">
                      <button
                        onClick={() => handleStatusChange(appointment.id, AppointmentStatus.CONFIRMED)}
                        className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusChange(appointment.id, AppointmentStatus.CANCELLED)}
                        className="px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {appointment.status === AppointmentStatus.CONFIRMED && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleStatusChange(appointment.id, AppointmentStatus.COMPLETED)}
                        className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                      >
                        Mark as Completed
                      </button>
                    </div>
                  )}
                </motion.li>
              );
            })}
            {filteredAppointments.length === 0 && (
              <li className="px-4 py-5 text-center text-sm text-gray-500">
                No appointments found.
              </li>
            )}
          </ul>
        </div>
      </div>
    </Layout>
  );
}
