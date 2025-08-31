'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useWeb3 } from '@/context/Web3Context';
import Layout from '@/components/Layout';
import { ethers } from 'ethers';

interface InsurancePolicy {
  id: string;
  name: string;
  type: string;
  coverageAmount: number;
  premium: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
  hospitalCoverage: boolean;
  medicineCoverage: boolean;
  accidentCoverage: boolean;
  criticalIllnessCoverage: boolean;
}

interface InsuranceClaim {
  id: string;
  policyId: string;
  amount: number;
  date: string;
  hospital: string;
  diagnosis: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  documents: string[];
}

interface ClaimFormData {
  hospital: string;
  diagnosis: string;
  amount: number;
  documents: FileList | null;
}

export default function PatientInsurance() {
  const router = useRouter();
  const { contract, isConnected, connectWallet } = useWeb3();
  const [aadharNumber, setAadharNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [showNewClaimForm, setShowNewClaimForm] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<InsurancePolicy | null>(null);
  const [insuranceContract, setInsuranceContract] = useState<any>(null);
  const [claimFormData, setClaimFormData] = useState<ClaimFormData>({
    hospital: '',
    diagnosis: '',
    amount: 0,
    documents: null
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedAadhar = localStorage.getItem('aadharNumber');
    if (!storedAadhar) {
      router.push('/patient/login');
      return;
    }
    setAadharNumber(storedAadhar);
    
    const initializeContract = async () => {
      try {
        await initializeInsuranceContract();
      } catch (error) {
        console.error("Error in insurance initialization:", error);
        displaySampleData();
      }
    };
    
    initializeContract();
  }, [router]);

  const initializeInsuranceContract = async () => {
    try {
      if (!isConnected) {
        await connectWallet();
      }

      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = await provider.getSigner();
        
        const insuranceContractAddress = contract.address;
          
        const insuranceAbi = [
          "function getInsurancePlans(address _patient) public view returns (tuple(string policyNumber, string provider, string planName, uint256 coverageAmount, uint256 startDate, uint256 endDate, bool isActive, uint256 premiumAmount, uint256 nextPremiumDate, address[] beneficiaries, bool hospitalCoverage, bool medicineCoverage, bool accidentCoverage, bool criticalIllnessCoverage)[] memory)",
          "function getActiveInsurancePlans(address _patient) public view returns (tuple(string policyNumber, string provider, string planName, uint256 coverageAmount, uint256 startDate, uint256 endDate, bool isActive, uint256 premiumAmount, uint256 nextPremiumDate, address[] beneficiaries, bool hospitalCoverage, bool medicineCoverage, bool accidentCoverage, bool criticalIllnessCoverage)[] memory)",
          "function addInsurancePlan(string memory _policyNumber, string memory _provider, string memory _planName, uint256 _coverageAmount, uint256 _startDate, uint256 _endDate, uint256 _premiumAmount, uint256 _nextPremiumDate, address[] memory _beneficiaries, bool _hospitalCoverage, bool _medicineCoverage, bool _accidentCoverage, bool _criticalIllnessCoverage) public",
          "function cancelInsurancePlan(string memory _policyNumber) public"
        ];
          
        const insuranceContract = new ethers.Contract(insuranceContractAddress, insuranceAbi, signer);
        console.log("Insurance contract initialized:", insuranceContract.address);
        setInsuranceContract(insuranceContract);
          
        await fetchInsuranceData(await signer.getAddress());
      }
    } catch (error) {
      console.error("Error initializing insurance contract:", error);
      displaySampleData();
    } finally {
      setLoading(false);
    }
  };

  const fetchInsuranceData = async (userAddress: string) => {
    try {
      setLoading(true);
      
      if (insuranceContract) {
        try {
          const activePlansData = await insuranceContract.getActiveInsurancePlans(userAddress);
          console.log("Active plans data:", activePlansData);
            
          if (activePlansData && activePlansData.length > 0) {
            const formattedPolicies = activePlansData.map((plan: any, index: number) => {
              const startDate = new Date(Number(plan.startDate) * 1000);
              const endDate = new Date(Number(plan.endDate) * 1000);
                
              return {
                id: `POL${index + 1}`.padStart(6, '0'),
                name: plan.planName,
                type: plan.criticalIllnessCoverage ? 'Critical Illness' : 'Health',
                coverageAmount: Number(plan.coverageAmount),
                premium: Number(plan.premiumAmount),
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                status: 'ACTIVE',
                hospitalCoverage: plan.hospitalCoverage,
                medicineCoverage: plan.medicineCoverage,
                accidentCoverage: plan.accidentCoverage,
                criticalIllnessCoverage: plan.criticalIllnessCoverage
              };
            });
              
            setPolicies(formattedPolicies);
          } else {
            displaySampleData();
          }
            
          setClaims([
            {
              id: 'CLM001',
              policyId: 'POL001',
              amount: 25000,
              date: '2025-02-15',
              hospital: 'City Hospital',
              diagnosis: 'Appendicitis',
              status: 'APPROVED',
              documents: ['medical_report.pdf', 'bills.pdf']
            }
          ]);
        } catch (error) {
          console.error("Error fetching active plans:", error);
          displaySampleData();
        }
      } else {
        displaySampleData();
      }
    } catch (error) {
      console.error("Error in fetchInsuranceData:", error);
      displaySampleData();
    } finally {
      setLoading(false);
    }
  };

  const displaySampleData = () => {
    setPolicies([
      {
        id: 'POL001',
        name: 'Comprehensive Health Insurance',
        type: 'Health',
        coverageAmount: 500000,
        premium: 12000,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        status: 'ACTIVE',
        hospitalCoverage: true,
        medicineCoverage: true,
        accidentCoverage: true,
        criticalIllnessCoverage: false
      },
      {
        id: 'POL002',
        name: 'Critical Illness Cover',
        type: 'Critical Illness',
        coverageAmount: 1000000,
        premium: 15000,
        startDate: '2025-02-01',
        endDate: '2026-01-31',
        status: 'ACTIVE',
        hospitalCoverage: true,
        medicineCoverage: false,
        accidentCoverage: false,
        criticalIllnessCoverage: true
      }
    ]);
    
    setClaims([
      {
        id: 'CLM001',
        policyId: 'POL001',
        amount: 25000,
        date: '2025-02-15',
        hospital: 'City Hospital',
        diagnosis: 'Appendicitis',
        status: 'APPROVED',
        documents: ['medical_report.pdf', 'bills.pdf']
      }
    ]);
    
    setError("Note: Using sample insurance data for demonstration. Connect your wallet to see your actual policies.");
    setLoading(false);
  };

  const handleNewClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: {[key: string]: string} = {};
    
    if (!claimFormData.hospital.trim()) {
      errors.hospital = "Hospital name is required";
    }
    
    if (!claimFormData.diagnosis.trim()) {
      errors.diagnosis = "Diagnosis is required";
    }
    
    if (!claimFormData.amount || claimFormData.amount <= 0) {
      errors.amount = "Amount must be greater than 0";
    } else if (selectedPolicy && claimFormData.amount > selectedPolicy.coverageAmount) {
      errors.amount = `Amount cannot exceed coverage limit of ${formatCurrency(selectedPolicy.coverageAmount)}`;
    }
    
    if (!claimFormData.documents || claimFormData.documents.length === 0) {
      errors.documents = "At least one document is required";
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newClaim: InsuranceClaim = {
        id: `CLM${claims.length + 1}`.padStart(6, '0'),
        policyId: selectedPolicy?.id || '',
        amount: claimFormData.amount,
        date: new Date().toISOString().split('T')[0],
        hospital: claimFormData.hospital,
        diagnosis: claimFormData.diagnosis,
        status: 'PENDING',
        documents: Array.from(claimFormData.documents || []).map(file => file.name)
      };
      
      setClaims(prevClaims => [newClaim, ...prevClaims]);
      
      setClaimFormData({
        hospital: '',
        diagnosis: '',
        amount: 0,
        documents: null
      });
      setShowNewClaimForm(false);
      
      setError("Claim submitted successfully and is pending approval.");
      
    } catch (error) {
      console.error("Error submitting claim:", error);
      setFormErrors({ submit: "Failed to submit claim. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file' && files) {
      setClaimFormData(prev => ({
        ...prev,
        documents: files
      }));
    } else if (type === 'number') {
      setClaimFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setClaimFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading your insurance data...</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">Your Insurance Policies</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {policies.map((policy) => (
                  <motion.div
                    key={policy.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{policy.name}</h3>
                        <p className="text-sm text-gray-500">{policy.type}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        policy.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        policy.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {policy.status}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Coverage Amount</p>
                        <p className="text-lg font-medium text-gray-900">{formatCurrency(policy.coverageAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Annual Premium</p>
                        <p className="text-lg font-medium text-gray-900">{formatCurrency(policy.premium)}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">Valid Period</p>
                      <p className="text-sm text-gray-700">{policy.startDate} to {policy.endDate}</p>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">Coverage Details</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${policy.hospitalCoverage ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-sm text-gray-700">Hospital</span>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${policy.medicineCoverage ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-sm text-gray-700">Medicine</span>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${policy.accidentCoverage ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-sm text-gray-700">Accident</span>
                        </div>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${policy.criticalIllnessCoverage ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-sm text-gray-700">Critical Illness</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          setSelectedPolicy(policy);
                          setShowNewClaimForm(true);
                        }}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                      >
                        File New Claim
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Claims History</h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {claims.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {claims.map((claim) => (
                      <motion.li
                        key={claim.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-6"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Claim #{claim.id} - {claim.hospital}
                            </p>
                            <p className="text-sm text-gray-500">{claim.date}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            claim.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            claim.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {claim.status}
                          </span>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">Amount Claimed: {formatCurrency(claim.amount)}</p>
                          <p className="text-sm text-gray-500">Diagnosis: {claim.diagnosis}</p>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">Documents:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {claim.documents.map((doc, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">No claims history found</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {showNewClaimForm && selectedPolicy && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">File New Claim for {selectedPolicy.name}</h3>
              
              {formErrors.submit && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {formErrors.submit}
                </div>
              )}
              
              <form onSubmit={handleNewClaim} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Policy</label>
                  <input
                    type="text"
                    value={selectedPolicy.name}
                    disabled
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 p-2"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Coverage: {formatCurrency(selectedPolicy.coverageAmount)} | Valid until: {selectedPolicy.endDate}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hospital</label>
                  <input
                    type="text"
                    name="hospital"
                    value={claimFormData.hospital}
                    onChange={handleInputChange}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm p-2 border ${
                      formErrors.hospital ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    } focus:border-blue-500`}
                  />
                  {formErrors.hospital && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.hospital}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
                  <input
                    type="text"
                    name="diagnosis"
                    value={claimFormData.diagnosis}
                    onChange={handleInputChange}
                    required
                    className={`mt-1 block w-full rounded-md shadow-sm p-2 border ${
                      formErrors.diagnosis ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    } focus:border-blue-500`}
                  />
                  {formErrors.diagnosis && (
                    <p className="mt-1 text-xs text-red-600">{formErrors.diagnosis}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Claim Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={claimFormData.amount || ''}
                    onChange={handleInputChange}
                    required
                    min="0"
                    max={selectedPolicy.coverageAmount}
                    className={`mt-1 block w-full rounded-md shadow-sm p-2 border ${
                      formErrors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    } focus:border-blue-500`}
                  />
                  {formErrors.amount ? (
                    <p className="mt-1 text-xs text-red-600">{formErrors.amount}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      Maximum claim amount: {formatCurrency(selectedPolicy.coverageAmount)}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Upload Documents</label>
                  <input
                    type="file"
                    name="documents"
                    onChange={handleInputChange}
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    className={`mt-1 block w-full text-sm p-2 ${
                      formErrors.documents ? 'text-red-500' : 'text-gray-500'
                    } file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
                  />
                  {formErrors.documents ? (
                    <p className="mt-1 text-xs text-red-600">{formErrors.documents}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">
                      Upload medical reports, bills, prescriptions, etc. (PDF, JPG, PNG)
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewClaimForm(false);
                      setFormErrors({});
                      setClaimFormData({
                        hospital: '',
                        diagnosis: '',
                        amount: 0,
                        documents: null
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center ${
                      isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Submit Claim'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
}
