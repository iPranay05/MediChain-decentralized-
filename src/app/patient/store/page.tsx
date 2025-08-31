'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Medicine {
  name: string;
  description: string;
  category: string;
  requiresPrescription: boolean;
  prices: {
    pharmacy: string;
    price: number;
    url: string;
  }[];
}

const medicines: Medicine[] = [
  {
    name: 'Paracetamol (Calpol 650mg)',
    description: 'Pain reliever and fever reducer',
    category: 'Pain Relief',
    requiresPrescription: false,
    prices: [
      { pharmacy: 'PharmEasy', price: 29.99, url: 'https://pharmeasy.in/online-medicine-order/calpol-650mg-strip-of-15-tablets-38478' },
      { pharmacy: 'Netmeds', price: 32.50, url: 'https://www.netmeds.com/prescriptions/calpol-650mg-tablet-15-s' },
      { pharmacy: '1mg', price: 27.99, url: 'https://www.1mg.com/drugs/calpol-650mg-tablet-150665' }
    ]
  },
  {
    name: 'Azithromycin (500mg)',
    description: 'Antibiotic for bacterial infections',
    category: 'Antibiotics',
    requiresPrescription: true,
    prices: [
      { pharmacy: 'PharmEasy', price: 145.99, url: 'https://pharmeasy.in/online-medicine-order/azithral-500mg-tablet-38478' },
      { pharmacy: 'Netmeds', price: 149.00, url: 'https://www.netmeds.com/prescriptions/azithral-500mg-tablet-5-s' },
      { pharmacy: '1mg', price: 142.50, url: 'https://www.1mg.com/drugs/azithral-500-tablet-150665' }
    ]
  },
  {
    name: 'Cetirizine (10mg)',
    description: 'Antihistamine for allergies',
    category: 'Allergy',
    requiresPrescription: false,
    prices: [
      { pharmacy: 'PharmEasy', price: 48.99, url: 'https://pharmeasy.in/online-medicine-order/cetirizine-10mg-tablet-38478' },
      { pharmacy: 'Netmeds', price: 45.50, url: 'https://www.netmeds.com/prescriptions/cetirizine-10mg-tablet-10-s' },
      { pharmacy: '1mg', price: 42.99, url: 'https://www.1mg.com/drugs/cetirizine-10mg-tablet-150665' }
    ]
  },
  {
    name: 'Omeprazole (20mg)',
    description: 'For acid reflux and heartburn',
    category: 'Digestive Health',
    requiresPrescription: false,
    prices: [
      { pharmacy: 'PharmEasy', price: 89.99, url: 'https://pharmeasy.in/online-medicine-order/omez-20mg-capsule-38478' },
      { pharmacy: 'Netmeds', price: 92.50, url: 'https://www.netmeds.com/prescriptions/omez-20mg-capsule-15-s' },
      { pharmacy: '1mg', price: 86.99, url: 'https://www.1mg.com/drugs/omez-20mg-capsule-150665' }
    ]
  },
  {
    name: 'Metformin (500mg)',
    description: 'Oral diabetes medicine to control blood sugar',
    category: 'Diabetes',
    requiresPrescription: true,
    prices: [
      { pharmacy: 'PharmEasy', price: 32.99, url: 'https://pharmeasy.in/online-medicine-order/glycomet-500mg-tablet-38478' },
      { pharmacy: 'Netmeds', price: 34.50, url: 'https://www.netmeds.com/prescriptions/glycomet-500mg-tablet-10-s' },
      { pharmacy: '1mg', price: 31.99, url: 'https://www.1mg.com/drugs/glycomet-500mg-tablet-150665' }
    ]
  },
  {
    name: 'Amlodipine (5mg)',
    description: 'Calcium channel blocker for high blood pressure',
    category: 'Blood Pressure',
    requiresPrescription: true,
    prices: [
      { pharmacy: 'PharmEasy', price: 42.99, url: 'https://pharmeasy.in/online-medicine-order/amlong-5mg-tablet-38478' },
      { pharmacy: 'Netmeds', price: 45.50, url: 'https://www.netmeds.com/prescriptions/amlong-5mg-tablet-10-s' },
      { pharmacy: '1mg', price: 40.99, url: 'https://www.1mg.com/drugs/amlong-5mg-tablet-150665' }
    ]
  },
  {
    name: 'Montelukast (10mg)',
    description: 'For asthma and seasonal allergies',
    category: 'Respiratory',
    requiresPrescription: true,
    prices: [
      { pharmacy: 'PharmEasy', price: 125.99, url: 'https://pharmeasy.in/online-medicine-order/montair-10mg-tablet-38478' },
      { pharmacy: 'Netmeds', price: 129.50, url: 'https://www.netmeds.com/prescriptions/montair-10mg-tablet-10-s' },
      { pharmacy: '1mg', price: 122.99, url: 'https://www.1mg.com/drugs/montair-10mg-tablet-150665' }
    ]
  }
];

export default function Store() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [aadharNumber, setAadharNumber] = useState<string>('');

  // Authentication check
  useEffect(() => {
    const storedAadhar = localStorage.getItem('aadharNumber');
    if (!storedAadhar) {
      router.push('/patient/login');
      return;
    }
    setAadharNumber(storedAadhar);
  }, [router]);

  // Fix TypeScript error by converting Set to Array
  const categories = ['all', ...Array.from(new Set(medicines.map(m => m.category)))];

  const filteredMedicines = medicines
    .filter(medicine => 
      (selectedCategory === 'all' || medicine.category === selectedCategory) &&
      (searchQuery === '' || 
        medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        medicine.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        medicine.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  if (!aadharNumber) {
    return null; // Don't render anything while checking authentication
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Medicine Store</h1>
      
      <p className="text-gray-600 mb-8">
        Compare prices across leading online pharmacies and find the best deals on common medicines.
      </p>

      {/* Search and Filter Section */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search medicines by name, description, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Found {filteredMedicines.length} {filteredMedicines.length === 1 ? 'medicine' : 'medicines'}
        {searchQuery && ' matching your search'}
        {selectedCategory !== 'all' && ` in ${selectedCategory}`}
      </div>

      {/* Medicines Grid */}
      <div className="space-y-6">
        {filteredMedicines.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No medicines found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        ) : (
          filteredMedicines.map((medicine, index) => {
            // Find the cheapest price
            const cheapestPrice = Math.min(...medicine.prices.map(p => p.price));
            const cheapestPharmacy = medicine.prices.find(p => p.price === cheapestPrice);

            return (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-xl font-semibold">{medicine.name}</h2>
                        {medicine.requiresPrescription && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                            Prescription Required
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">{medicine.description}</p>
                      <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {medicine.category}
                      </span>
                    </div>
                    <div className="flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
                      </svg>
                      Best Price: ₹{cheapestPrice} at {cheapestPharmacy?.pharmacy}
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pharmacy
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {medicine.prices.map((price, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {price.pharmacy}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                              ₹{price.price}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <a
                                href={price.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white ${
                                  price.price === cheapestPrice
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                } transition-colors`}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                </svg>
                                Buy Now
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Note: Prices are indicative and may vary. Please consult with a healthcare professional before purchasing any medication.
          Some medicines may require a valid prescription.
        </p>
      </div>
    </div>
  );
}
