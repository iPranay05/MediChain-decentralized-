'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaHospital, FaUserMd, FaPrescriptionBottleAlt, FaUserLock } from 'react-icons/fa';

const PharmacyHome = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            <span className="text-green-600">Pharmacy</span> Portal
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Securely access patient prescriptions, verify medication details, and manage dispensing records with blockchain-backed security.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <FaUserMd className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">For Registered Pharmacies</h2>
              <p className="text-gray-600 mb-8">
                Already registered? Access the pharmacy dashboard to verify prescriptions and dispense medications securely.
              </p>
              <Link 
                href="/pharmacy/login" 
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-all transform hover:scale-105"
              >
                <FaUserLock className="mr-2" />
                Login to Pharmacy Portal
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <FaPrescriptionBottleAlt className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">New Pharmacy Registration</h2>
              <p className="text-gray-600 mb-8">
                Join our network of trusted pharmacies to provide secure and verified medication dispensing to patients.
              </p>
              <Link 
                href="/pharmacy/register" 
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-all transform hover:scale-105"
              >
                Register Your Pharmacy
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-green-600">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Verify Patient</h3>
              <p className="text-gray-600">
                Scan or enter the patient's Aadhar number to securely access their prescription information.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">View Prescriptions</h3>
              <p className="text-gray-600">
                Access blockchain-verified prescriptions with complete medication details and dosage information.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Dispense Medication</h3>
              <p className="text-gray-600">
                Record medication dispensing on the blockchain for complete transparency and accountability.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PharmacyHome;
