'use client';

import Layout from '@/components/Layout';
import { useState } from 'react';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';

export default function InsurancePage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: '₹999/month',
      features: [
        'Basic health coverage',
        'Emergency services',
        'Regular check-ups',
        'Prescription coverage'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: '₹1,999/month',
      features: [
        'Comprehensive coverage',
        'Specialist consultations',
        'Mental health support',
        'Dental & vision coverage',
        'Wellness programs'
      ]
    },
    {
      id: 'family',
      name: 'Family Plan',
      price: '₹2,999/month',
      features: [
        'Coverage for 4 family members',
        'Maternity benefits',
        'Child healthcare',
        'Regular health screenings',
        'Preventive care',
        'Emergency support'
      ]
    }
  ];

  return (
    <SignedIn>
      <Layout>
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Health Insurance Plans
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the perfect health insurance plan for you and your family. Our plans are designed to provide comprehensive coverage at affordable rates.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-6 bg-white rounded-xl shadow-md border-2 transition-all duration-200 ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-2xl font-bold text-blue-600">{plan.price}</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="h-5 w-5 text-green-500 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="ml-3 text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      setShowForm(true);
                    }}
                    className={`w-full py-2 px-4 rounded-md transition-colors duration-200 ${
                      selectedPlan === plan.id
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {selectedPlan === plan.id ? 'Selected' : 'Choose Plan'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Application Form */}
          {showForm && (
            <div className="mt-12 bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Insurance Application</h2>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input
                    type="date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter your full address"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </Layout>
    </SignedIn>
  );
}
