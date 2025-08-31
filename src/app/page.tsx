'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { BsShieldLock, BsShieldCheck, BsLink45Deg, BsEye } from 'react-icons/bs';

export default function Home() {
  const features = [
    {
      title: 'Security',
      description: 'Your medical records are secured by blockchain technology, making them tamper-proof and highly secure.',
      icon: <BsShieldLock className="w-8 h-8 text-blue-600" />
    },
    {
      title: 'Privacy',
      description: 'Access to your records is controlled by your unique Aadhar number, ensuring complete privacy.',
      icon: <BsShieldCheck className="w-8 h-8 text-blue-600" />
    },
    {
      title: 'Immutability',
      description: 'Once recorded, your medical history cannot be altered, ensuring accuracy and reliability.',
      icon: <BsLink45Deg className="w-8 h-8 text-blue-600" />
    },
    {
      title: 'Transparency',
      description: 'All transactions are recorded on the blockchain, providing complete transparency.',
      icon: <BsEye className="w-8 h-8 text-blue-600" />
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Healthcare on the{' '}
              <span className="text-blue-600 relative">
                Blockchain
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-blue-600/20 rounded-full"></div>
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Secure, transparent, and efficient healthcare record management
              <br className="hidden sm:block" /> powered by blockchain technology
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link 
                href="/hospital/login" 
                className="w-64 bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <span>Hospital Portal</span>
              </Link>
              <Link 
                href="/patient/login" 
                className="w-64 bg-white text-blue-600 px-8 py-4 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <span> Patient Portal</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Blockchain Healthcare?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Experience the future of healthcare with our blockchain-powered platform
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-lg bg-blue-50">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Store Preview Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 bg-gradient-to-b from-blue-50 to-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-xl">
            <div className="inline-block p-3 bg-green-100 rounded-lg mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Earn Health Coins</h2>
            <p className="text-lg text-gray-600 mb-8">
              Get rewarded with Health Coins for maintaining your health records. 
              Redeem them for exclusive health products and services.
            </p>
            <Link 
              href="/store" 
              className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-green-500 text-white px-8 py-4 rounded-lg hover:from-green-700 hover:to-green-600 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span>Visit Store</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
