'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '@/context/Web3Context';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { SignedIn } from '@clerk/nextjs';
import { BsArrowLeft, BsCalendar, BsClock, BsEnvelope, BsTelephone, BsJournal, BsHospital } from 'react-icons/bs';

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

export default function Appointments() {
  const [aadharNumber, setAadharNumber] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [department, setDepartment] = useState('General');

  const { contract, connectWallet, isConnected, account } = useWeb3();

  const departments = [
    'General',
    'Cardiology',
    'Dermatology',
    'ENT',
    'Gastroenterology',
    'Neurology',
    'Oncology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Urology'
  ];

  // Validation functions
  const validateAadhar = (aadhar: string) => /^\d{12}$/.test(aadhar);
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^\d{10}$/.test(phone);

  const fetchAppointments = async () => {
    if (!contract || !aadharNumber) return;
    
    if (!validateAadhar(aadharNumber)) {
      setError('Please enter a valid 12-digit Aadhar number');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const appointments = await contract.getPatientAppointments(aadharNumber);
      setAppointments(appointments);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError(err.message || 'Error fetching appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !isConnected) {
      await connectWallet();
      return;
    }

    // Validate all fields
    if (!validateAadhar(aadharNumber)) {
      setError('Please enter a valid 12-digit Aadhar number');
      return;
    }
    if (!validateEmail(contactEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!validatePhone(contactPhone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const timestamp = new Date(`${appointmentDate}T${appointmentTime}`).getTime() / 1000;

      const tx = await contract.scheduleAppointment(
        aadharNumber,
        timestamp,
        contactEmail,
        contactPhone,
        notes,
        department
      );
      await tx.wait();

      setSuccess('Appointment scheduled successfully! You will receive a confirmation email shortly.');
      await fetchAppointments();

      // Clear form
      setAppointmentDate('');
      setAppointmentTime('');
      setContactEmail('');
      setContactPhone('');
      setNotes('');
      setDepartment('General');
    } catch (err: any) {
      console.error('Error scheduling appointment:', err);
      setError(err.message || 'Error scheduling appointment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.SCHEDULED: return 'Scheduled';
      case AppointmentStatus.CONFIRMED: return 'Confirmed';
      case AppointmentStatus.CANCELLED: return 'Cancelled';
      case AppointmentStatus.COMPLETED: return 'Completed';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'bg-green-100 text-green-800 border-green-500';
      case AppointmentStatus.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-500';
      case AppointmentStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800 border-blue-500';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-500';
    }
  };

  return (
    <SignedIn>
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Schedule an Appointment</h1>
              <Link 
                href="/patient"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BsArrowLeft className="mr-2" />
                Back to Portal
              </Link>
            </div>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
                <p className="text-green-700">{success}</p>
              </div>
            )}

            <form onSubmit={handleScheduleAppointment} className="space-y-6">
              {/* Aadhar Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhar Number
                  </label>
                  <input
                    type="text"
                    value={aadharNumber}
                    onChange={(e) => setAadharNumber(e.target.value)}
                    placeholder="Enter 12-digit Aadhar number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={12}
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      <BsHospital className="mr-2" />
                      Department
                    </span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      <BsCalendar className="mr-2" />
                      Date
                    </span>
                  </label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      <BsClock className="mr-2" />
                      Time
                    </span>
                  </label>
                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      <BsEnvelope className="mr-2" />
                      Contact Email
                    </span>
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="flex items-center">
                      <BsTelephone className="mr-2" />
                      Contact Phone
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Enter 10-digit phone number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center">
                    <BsJournal className="mr-2" />
                    Notes
                  </span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes or concerns..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Schedule Appointment'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Appointments List */}
          {appointments.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Your Appointments</h2>
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border ${getStatusColor(appointment.status)}`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">Date & Time</p>
                        <p>{new Date(appointment.timestamp * 1000).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="font-medium">Department</p>
                        <p>{appointment.department}</p>
                      </div>
                      <div>
                        <p className="font-medium">Status</p>
                        <p>{getStatusText(appointment.status)}</p>
                      </div>
                      <div>
                        <p className="font-medium">Contact</p>
                        <p>{appointment.contactEmail}</p>
                        <p>{appointment.contactPhone}</p>
                      </div>
                    </div>
                    {appointment.notes && (
                      <div className="mt-4">
                        <p className="font-medium">Notes</p>
                        <p className="text-gray-600">{appointment.notes}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Layout>
    </SignedIn>
  );
}
