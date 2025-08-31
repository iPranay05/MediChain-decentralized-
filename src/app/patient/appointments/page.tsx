'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';
import { useWeb3 } from '@/context/Web3Context';
import { ethers } from 'ethers';

interface Appointment {
  id: number;
  patientAadhar: string;
  timestamp: number | bigint | { toNumber(): number };
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  contactEmail: string;
  contactPhone: string;
  notes: string;
  department: string;
}

export default function PatientAppointments() {
  const router = useRouter();
  const [aadharNumber, setAadharNumber] = useState('');
  const { contract, isConnected, connectWallet } = useWeb3();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    department: '',
    date: '',
    time: '',
    contactEmail: '',
    contactPhone: '',
    notes: ''
  });

  useEffect(() => {
    const storedAadhar = localStorage.getItem('aadharNumber');
    if (!storedAadhar) {
      router.push('/patient/login');
      return;
    }
    setAadharNumber(storedAadhar);
    
    // Check if contract and connection are ready
    const loadAppointments = async () => {
      console.log('Component mounted, checking Web3 connection...');
      if (!isConnected || !contract) {
        console.log('Not connected to Web3, attempting to connect...');
        try {
          await connectWallet();
          // After connecting, fetch appointments with a small delay
          setTimeout(() => {
            console.log('Connected to Web3, fetching appointments...');
            fetchAppointments(storedAadhar);
          }, 1000);
        } catch (error) {
          console.error('Failed to connect to Web3:', error);
        }
      } else {
        console.log('Already connected to Web3, fetching appointments directly...');
        fetchAppointments(storedAadhar);
      }
    };
    
    loadAppointments();
  }, [router, contract, isConnected, connectWallet]);

  // Load appointments from localStorage
  const loadAppointmentsFromStorage = (patientAadhar: string) => {
    // Check if running in browser environment
    if (typeof window === 'undefined') return [];
    
    try {
      const storedAppointments = localStorage.getItem(`appointments_${patientAadhar}`);
      if (storedAppointments) {
        return JSON.parse(storedAppointments) as Appointment[];
      }
    } catch (error) {
      console.error('Error loading appointments from localStorage:', error);
    }
    return [];
  };

  // Save appointments to localStorage
  const saveAppointmentsToStorage = (patientAadhar: string, appointments: Appointment[]) => {
    // Check if running in browser environment
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(`appointments_${patientAadhar}`, JSON.stringify(appointments));
    } catch (error) {
      console.error('Error saving appointments to localStorage:', error);
    }
  };

  const fetchAppointments = async (patientAadhar: string) => {
    try {
      // Load appointments from localStorage first
      const storedAppointments = loadAppointmentsFromStorage(patientAadhar);
      
      if (storedAppointments && storedAppointments.length > 0) {
        setAppointments(storedAppointments);
        return;
      }
      
      // If no stored appointments, create a test appointment
      const testAppointment: Appointment = {
        id: 1,
        patientAadhar: patientAadhar,
        timestamp: Math.floor(Date.now() / 1000),
        status: 'SCHEDULED',
        contactEmail: 'test@example.com',
        contactPhone: '1234567890',
        notes: 'This is a test appointment',
        department: 'General Medicine'
      };
      
      // Set and save the test appointment
      const newAppointments = [testAppointment];
      setAppointments(newAppointments);
      saveAppointmentsToStorage(patientAadhar, newAppointments);
      
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to fetch appointments');
    }
  };

  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate date and time
      const appointmentDate = new Date(`${formData.date}T${formData.time}`);
      const now = new Date();
      
      if (appointmentDate <= now) {
        throw new Error('Please select a future date and time for the appointment');
      }

      // Create a new test appointment with the form data
      const newAppointment: Appointment = {
        id: Math.floor(Math.random() * 1000) + 2, // Random ID for demonstration
        patientAadhar: aadharNumber,
        timestamp: Math.floor(appointmentDate.getTime() / 1000),
        status: 'SCHEDULED',
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        notes: formData.notes,
        department: formData.department
      };
      
      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get current appointments and add the new one
      const currentAppointments = [...appointments];
      const updatedAppointments = [...currentAppointments, newAppointment];
      
      // Update state and localStorage
      setAppointments(updatedAppointments);
      saveAppointmentsToStorage(aadharNumber, updatedAppointments);
      
      // Reset form
      setFormData({
        department: '',
        date: '',
        time: '',
        contactEmail: '',
        contactPhone: '',
        notes: ''
      });
      setShowScheduleForm(false);
      
    } catch (err: any) {
      console.error('Error scheduling appointment:', err);
      setError(err.message || 'Failed to schedule appointment');
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'text-blue-600 bg-blue-100';
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'CANCELLED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Appointments</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                console.log('Manual refresh triggered');
                fetchAppointments(aadharNumber);
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowScheduleForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Schedule New Appointment
            </motion.button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        {showScheduleForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-lg mb-6"
          >
            <h3 className="text-xl font-semibold mb-4">Schedule New Appointment</h3>
            <form onSubmit={handleScheduleAppointment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="ENT">ENT</option>
                  <option value="Ophthalmology">Ophthalmology</option>
                  <option value="Dental">Dental</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  required
                  pattern="[0-9]{10}"
                  title="Please enter a valid 10-digit phone number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowScheduleForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  {loading ? 'Scheduling...' : 'Schedule Appointment'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {appointments && appointments.length > 0 ? appointments.map((appointment) => {
              if (!appointment) return null;
              
              // Ensure timestamp is a number
              let timestamp: number;
              try {
                if (typeof appointment.timestamp === 'bigint') {
                  timestamp = Number(appointment.timestamp);
                } else if (appointment.timestamp && typeof appointment.timestamp === 'object') {
                  // Handle ethers.js BigNumber objects which have toNumber method
                  const timestampObj = appointment.timestamp as { toNumber?: () => number };
                  if (timestampObj.toNumber) {
                    timestamp = timestampObj.toNumber();
                  } else {
                    timestamp = Number(appointment.timestamp || 0);
                  }
                } else {
                  timestamp = Number(appointment.timestamp || 0);
                }
                
                const { date, time } = formatDate(timestamp);
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
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {appointment.department}
                          </p>
                          <div className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
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
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex space-x-4 text-sm text-gray-500">
                        <span>Email: {appointment.contactEmail}</span>
                        <span>Phone: {appointment.contactPhone}</span>
                      </div>
                    </div>
                  </motion.li>
                );
              } catch (error) {
                console.error('Error rendering appointment:', error, appointment);
                return null;
              }
            }) : (
              <li className="px-4 py-5 text-center text-sm text-gray-500">
                No appointments scheduled yet.
              </li>
            )}
          </ul>
        </div>
      </div>
    </Layout>
  );
}
