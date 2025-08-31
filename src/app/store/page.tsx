'use client';

import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import { SignedIn } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { useWeb3 } from '@/context/Web3Context';
import { BsCoin, BsWallet2 } from 'react-icons/bs';

interface StoreItem {
  id: number;
  name: string;
  description: string;
  originalPrice: number;
  discountPrice: number;
  coinsRequired: number;
  image: string;
  category: string;
}

export default function StorePage() {
  const [aadharNumber, setAadharNumber] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [healthCoins, setHealthCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingBalance, setCheckingBalance] = useState(false);
  const { contract, account, isConnected, connectWallet } = useWeb3();

  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'checkups', name: 'Health Checkups' },
    { id: 'dental', name: 'Dental Care' },
    { id: 'pharmacy', name: 'Pharmacy' },
    { id: 'wellness', name: 'Wellness' }
  ];

  const storeItems: StoreItem[] = [
    {
      id: 1,
      name: 'Premium Health Checkup',
      description: 'Comprehensive health screening with advanced diagnostics and specialist consultation',
      originalPrice: 8000,
      discountPrice: 6000,
      coinsRequired: 150,
      image: '/health-checkup.png',
      category: 'checkups'
    },
    {
      id: 2,
      name: 'Dental Care Package',
      description: 'Complete dental checkup with cleaning, X-rays, and cavity treatment',
      originalPrice: 5000,
      discountPrice: 3500,
      coinsRequired: 100,
      image: '/dental-care.jpg',
      category: 'dental'
    },
    {
      id: 3,
      name: 'Vision Care Bundle',
      description: 'Eye examination, prescription glasses, and contact lens fitting',
      originalPrice: 4000,
      discountPrice: 3000,
      coinsRequired: 80,
      image: '/vision-care.png',
      category: 'wellness'
    },
    {
      id: 4,
      name: 'Pharmacy Discount Card',
      description: '25% off on all medications for 3 months',
      originalPrice: 2000,
      discountPrice: 1500,
      coinsRequired: 50,
      image: '/pharmacy-discount.png',
      category: 'pharmacy'
    },
    {
      id: 5,
      name: 'Wellness Package',
      description: 'Yoga classes, nutrition consultation, and fitness assessment',
      originalPrice: 6000,
      discountPrice: 4500,
      coinsRequired: 120,
      image: '/wellness-package.png',
      category: 'wellness'
    },
    {
      id: 6,
      name: 'Lab Test Bundle',
      description: 'Complete blood work, thyroid, vitamin, and hormone panel',
      originalPrice: 4500,
      discountPrice: 3200,
      coinsRequired: 90,
      image: '/lab-test.png',
      category: 'checkups'
    },
    {
      id: 7,
      name: 'Physiotherapy Sessions',
      description: '5 sessions with certified physiotherapist',
      originalPrice: 3500,
      discountPrice: 2500,
      coinsRequired: 70,
      image: '/physiotherapy.png',
      category: 'wellness'
    },
    {
      id: 8,
      name: 'Mental Health Care',
      description: '3 counseling sessions with professional therapist',
      originalPrice: 4500,
      discountPrice: 3500,
      coinsRequired: 100,
      image: '/mental-health.png',
      category: 'wellness'
    },
    {
      id: 9,
      name: 'Vaccination Package',
      description: 'Essential vaccinations including flu shots',
      originalPrice: 3000,
      discountPrice: 2200,
      coinsRequired: 60,
      image: '/vaccination.png',
      category: 'pharmacy'
    },
    {
      id: 10,
      name: 'Nutrition Consultation',
      description: 'Personalized diet plan and 2 follow-up sessions',
      originalPrice: 2500,
      discountPrice: 1800,
      coinsRequired: 45,
      image: '/nutrition-consultation.png',
      category: 'wellness'
    },
    {
      id: 11,
      name: 'Diagnostic Imaging',
      description: 'MRI or CT scan with specialist consultation',
      originalPrice: 7000,
      discountPrice: 5500,
      coinsRequired: 140,
      image: '/diagnostic-imaging.png',
      category: 'checkups'
    },
    {
      id: 12,
      name: 'Emergency Care Card',
      description: '20% discount on emergency room visits for 6 months',
      originalPrice: 5000,
      discountPrice: 3800,
      coinsRequired: 110,
      image: '/emergency-care.png',
      category: 'pharmacy'
    }
  ];

  const handleCheckBalance = async () => {
    if (!aadharNumber) {
      setError('Please enter your Aadhar number');
      return;
    }

    if (!isConnected) {
      try {
        await connectWallet();
      } catch (err) {
        setError('Failed to connect wallet. Please make sure MetaMask is installed and try again.');
        return;
      }
    }

    if (!contract) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setCheckingBalance(true);
      setError('');
      const balance = await contract.getHealthCoins(aadharNumber);
      setHealthCoins(Number(balance));
    } catch (err) {
      console.error('Error checking balance:', err);
      setError('Failed to fetch balance. Please make sure you are connected to Avalanche Fuji Testnet.');
    } finally {
      setCheckingBalance(false);
    }
  };

  const handleRedeem = async (item: StoreItem) => {
    if (!isConnected || !contract) {
      setError('Please connect your wallet first');
      return;
    }

    if (!aadharNumber) {
      setError('Please enter your Aadhar number first');
      return;
    }

    if (healthCoins < item.coinsRequired) {
      setError(`You need ${item.coinsRequired - healthCoins} more coins to redeem this item`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const tx = await contract.redeemHealthCoins(aadharNumber, item.coinsRequired);
      await tx.wait();
      
      // Update balance after redemption
      const newBalance = await contract.getHealthCoins(aadharNumber);
      setHealthCoins(Number(newBalance));
      
      alert('Successfully redeemed! Your discount code will be sent to your registered mobile number.');
    } catch (err) {
      console.error('Error redeeming coins:', err);
      setError('Failed to redeem coins. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Health Store</h1>
          
          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex-1 sm:flex-initial">
              <input
                type="text"
                value={aadharNumber}
                onChange={(e) => {
                  setError('');
                  setAadharNumber(e.target.value.replace(/\D/g, '').slice(0, 12));
                }}
                placeholder="Enter Aadhar Number"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={12}
              />
            </div>
            
            {!isConnected && (
              <button
                onClick={connectWallet}
                className="flex items-center justify-center px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-all"
              >
                <BsWallet2 className="mr-2" />
                Connect Wallet
              </button>
            )}
            
            <button
              onClick={handleCheckBalance}
              disabled={checkingBalance || !aadharNumber || (!isConnected && !contract)}
              className={`flex items-center justify-center px-6 py-2 rounded-lg text-white font-medium transition-all ${
                checkingBalance || !aadharNumber || (!isConnected && !contract)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {checkingBalance ? 'Checking...' : 'Check Balance'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {isConnected && account && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <BsWallet2 className="text-blue-600" />
              <span className="text-sm text-blue-800">
                Connected: {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            </div>
          </div>
        )}

        {healthCoins > 0 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <BsCoin className="text-yellow-500 text-xl" />
              <span className="text-lg font-semibold text-green-800">
                Your Balance: {healthCoins} Health Coins
              </span>
            </div>
          </div>
        )}

        <div className="flex overflow-x-auto space-x-4 mb-8 pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveTab(category.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                activeTab === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {storeItems
            .filter((item) => activeTab === 'all' || item.category === activeTab)
            .map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: item.id * 0.1 }}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="object-cover w-full h-48"
                  />
                </div>
                <div className="p-4 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-blue-600">
                      ₹{item.discountPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      ₹{item.originalPrice.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <BsCoin className="text-yellow-500 mr-1" />
                    <span>{item.coinsRequired} Health Coins required</span>
                  </div>

                  <button
                    onClick={() => handleRedeem(item)}
                    disabled={!isConnected || !contract || loading || healthCoins < item.coinsRequired}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                      !isConnected || !contract
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : healthCoins < item.coinsRequired
                        ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                        : loading
                        ? 'bg-blue-400 text-white cursor-wait'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {!isConnected || !contract
                      ? 'Connect Wallet'
                      : healthCoins < item.coinsRequired
                      ? `Need ${item.coinsRequired - healthCoins} more coins`
                      : loading
                      ? 'Processing...'
                      : 'Redeem Now'}
                  </button>
                </div>
              </motion.div>
            ))}
        </div>
      </div>
    </main>
  );
}
