'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/context/Web3Context';
import { motion } from 'framer-motion';
import AadharScanner from '@/components/AadharScanner';

// Common diagnoses
const commonDiagnoses = [
  "Common Cold",
  "Influenza",
  "Hypertension",
  "Type 2 Diabetes",
  "Asthma",
  "Bronchitis",
  "Migraine",
  "Gastritis",
  "Allergic Rhinitis",
  "Urinary Tract Infection"
];

// Common medications with their standard dosages
const medicationOptions = {
  "Paracetamol": ["500mg", "650mg", "1000mg"],
  "Amoxicillin": ["250mg", "500mg", "875mg"],
  "Omeprazole": ["20mg", "40mg"],
  "Metformin": ["500mg", "850mg", "1000mg"],
  "Amlodipine": ["2.5mg", "5mg", "10mg"],
  "Cetirizine": ["5mg", "10mg"],
  "Salbutamol": ["2mg", "4mg"],
  "Azithromycin": ["250mg", "500mg"],
  "Ibuprofen": ["200mg", "400mg", "600mg"],
  "Montelukast": ["4mg", "5mg", "10mg"]
};

// Dosage frequencies
const frequencies = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "Every 4 hours",
  "Every 6 hours",
  "Every 8 hours",
  "Every 12 hours",
  "As needed",
  "Before meals",
  "After meals"
];

// Duration options
const durations = [
  "3 days",
  "5 days",
  "7 days",
  "10 days",
  "14 days",
  "1 month",
  "2 months",
  "3 months",
  "6 months",
  "Continuous"
];

// Interface for medicine entry
interface MedicineEntry {
  id: string;
  medication: string;
  customMedication: string;
  dosageAmount: string;
  customDosageAmount: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Prescription {
  id: number;
  patientAadhar: string;
  diagnosis: string;
  medicines: Array<{
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  notes: string;
  timestamp: number;
  hospitalName: string;
}

export default function Hospital() {
  const [aadharNumber, setAadharNumber] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [customDiagnosis, setCustomDiagnosis] = useState('');
  const [medicines, setMedicines] = useState<MedicineEntry[]>([
    {
      id: '1',
      medication: '',
      customMedication: '',
      dosageAmount: '',
      customDosageAmount: '',
      frequency: '',
      duration: '',
      instructions: ''
    }
  ]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'aadhar' | 'diagnosis' | 'medicine'>('all');
  const [dataProtection, setDataProtection] = useState(false);
  const [medicalEthics, setMedicalEthics] = useState(false);
  const [pharmaCompliance, setPharmaCompliance] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const router = useRouter();
  const { contract, account, isConnected, connectWallet } = useWeb3();

  useEffect(() => {
    const storedHospital = localStorage.getItem('hospitalName');
    if (!storedHospital) {
      router.push('/hospital/login');
      return;
    }
    setHospitalName(storedHospital);

    // Fetch all prescriptions for the hospital
    const fetchHospitalPrescriptions = async () => {
      try {
        if (!isConnected) {
          await connectWallet();
        }

        if (contract) {
          const allPrescriptions = await contract.getAllPrescriptions();
          const hospitalPrescriptions = allPrescriptions.filter(
            (p: any) => p.hospitalName === storedHospital
          );

          const formattedPrescriptions = hospitalPrescriptions.map((p: any) => {
            let medicines = [];
            try {
              medicines = JSON.parse(p.medicines || '[]');
            } catch (err) {
              console.warn('Failed to parse medicines JSON:', err);
            }

            return {
              id: typeof p.id === 'bigint' ? Number(p.id) : (p.id?.toNumber ? p.id.toNumber() : Number(p.id)),
              patientAadhar: p.patientAadhar,
              diagnosis: p.diagnosis,
              medicines,
              notes: p.notes || '',
              timestamp: typeof p.timestamp === 'bigint' ? Number(p.timestamp) : (p.timestamp?.toNumber ? p.timestamp.toNumber() : Number(p.timestamp)),
              hospitalName: p.hospitalName
            } as Prescription;
          });

          formattedPrescriptions.sort((a: Prescription, b: Prescription) => b.timestamp - a.timestamp);
          setPrescriptions(formattedPrescriptions);
        }
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
      }
    };

    fetchHospitalPrescriptions();
  }, [router, contract, isConnected, connectWallet]);

  // Filter prescriptions based on search query
  const filteredPrescriptions = prescriptions.filter(prescription => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;

    switch (searchFilter) {
      case 'aadhar':
        return prescription.patientAadhar.toLowerCase().includes(query);
      case 'diagnosis':
        return prescription.diagnosis.toLowerCase().includes(query);
      case 'medicine':
        return Array.isArray(prescription.medicines) && prescription.medicines.some(
          (med: any) => med.medication.toLowerCase().includes(query)
        );
      default:
        return prescription.patientAadhar.toLowerCase().includes(query) ||
          prescription.diagnosis.toLowerCase().includes(query) ||
          (Array.isArray(prescription.medicines) && prescription.medicines.some(
            (med: any) => med.medication.toLowerCase().includes(query)
          )) ||
          (prescription.notes && prescription.notes.toLowerCase().includes(query));
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('hospitalName');
    localStorage.removeItem('hospitalAddress');
    router.push('/hospital/login');
  };

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      {
        id: Date.now().toString(),
        medication: '',
        customMedication: '',
        dosageAmount: '',
        customDosageAmount: '',
        frequency: '',
        duration: '',
        instructions: ''
      }
    ]);
  };

  const removeMedicine = (id: string) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter(med => med.id !== id));
    }
  };

  const updateMedicine = (id: string, field: keyof MedicineEntry, value: string) => {
    setMedicines(medicines.map(med => {
      if (med.id === id) {
        return { ...med, [field]: value };
      }
      return med;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!contract || !isConnected) {
        setError('Please connect your wallet first');
        return;
      }

      // Validate form
      if (!aadharNumber || aadharNumber.length !== 12) {
        setError('Please enter a valid 12-digit Aadhar number');
        return;
      }

      if (!diagnosis || (diagnosis === 'custom' && !customDiagnosis)) {
        setError('Please select or enter a diagnosis');
        return;
      }

      if (!dataProtection || !medicalEthics || !pharmaCompliance) {
        setError('Please confirm all compliance checkboxes');
        return;
      }

      // Get hospital account
      let account;
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        account = accounts[0];
      } else {
        // Use the account from the Web3Context if window.ethereum is not available
        account = contract.signer.address;
      }
      
      // Instead of checking hasAccess (which is internal), directly try to grant access
      // The contract's onlyAuthorized modifier will handle access control when addPrescription is called
      try {
        // Grant hospital WRITE access to patient records
        const tx = await contract.grantAccess(aadharNumber, account, 2); // 2 is WRITE access
        await tx.wait();
        console.log('Access granted to hospital');
      } catch (accessError) {
        // If granting access fails, it might be because we already have access or the patient isn't registered
        // We'll continue and let the addPrescription function handle the authorization
        console.log('Note: Access grant operation result:', accessError);
      }

      const finalDiagnosis = diagnosis === 'custom' ? customDiagnosis : diagnosis;
      
      // Format medicines data, filtering out empty entries
      const medicinesData = medicines
        .filter(med => {
          const medication = med.medication === 'custom' ? med.customMedication : med.medication;
          return medication && medication.trim() !== '';
        })
        .map(med => ({
          medication: med.medication === 'custom' ? med.customMedication : med.medication,
          dosage: med.medication === 'custom' ? med.customDosageAmount : med.dosageAmount,
          frequency: med.frequency || '',
          duration: med.duration || '',
          instructions: med.instructions || ''
        }));

      if (medicinesData.length === 0) {
        setError('Please add at least one valid medicine');
        return;
      }

      // Convert medicines to string format for blockchain storage
      const medicinesString = JSON.stringify(medicinesData);

      console.log('Adding prescription with data:', {
        aadharNumber,
        finalDiagnosis,
        medicinesData,
        medicinesString,
        notes,
        hospitalName
      });

      const tx = await contract.addPrescription(
        aadharNumber,
        finalDiagnosis,
        medicinesString,
        notes,
        hospitalName
      );

      await tx.wait();
      console.log('Prescription added successfully');
      setSuccess('Prescription added successfully!');
      
      // Reset form
      setAadharNumber('');
      setDiagnosis('');
      setCustomDiagnosis('');
      setMedicines([{
        id: '1',
        medication: '',
        customMedication: '',
        dosageAmount: '',
        customDosageAmount: '',
        frequency: '',
        duration: '',
        instructions: ''
      }]);
      setNotes('');
      setDataProtection(false);
      setMedicalEthics(false);
      setPharmaCompliance(false);
    } catch (error: any) {
      console.error('Error adding prescription:', error);
      setError(error.message || 'Failed to add prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Hospital Records</h1>
          </div>

          {/* Add New Record Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Add New Record</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Aadhar Number */}
              <div>
                <label htmlFor="aadhar" className="block text-sm font-medium text-gray-700">
                  Aadhar Number *
                </label>
                <div className="mt-1 space-y-3">
                  <input
                    type="text"
                    id="aadhar"
                    value={aadharNumber}
                    onChange={(e) => setAadharNumber(e.target.value)}
                    placeholder="Enter 12-digit Aadhar number"
                    className="block w-full border-2 border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                    pattern="[0-9]{12}"
                  />
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Or scan Aadhar card</h3>
                    <AadharScanner onScanComplete={(number) => setAadharNumber(number)} />
                  </div>
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700">
                  Diagnosis *
                </label>
                <div className="mt-1 flex gap-4">
                  <select
                    id="diagnosis"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="block w-full border-2 border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  >
                    <option value="">Select diagnosis</option>
                    {commonDiagnoses.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                    <option value="custom">Other (specify)</option>
                  </select>
                  {diagnosis === 'custom' && (
                    <input
                      type="text"
                      value={customDiagnosis}
                      onChange={(e) => setCustomDiagnosis(e.target.value)}
                      placeholder="Enter diagnosis"
                      className="block w-full border-2 border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Medicines Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Medicines</h3>
                  <button
                    type="button"
                    onClick={addMedicine}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add Medicine
                  </button>
                </div>

                {medicines.map((medicine, index) => (
                  <div
                    key={medicine.id}
                    className="p-4 border-2 border-gray-200 rounded-lg space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-md font-medium">{`Medicine #${index + 1}`}</h4>
                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedicine(medicine.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Medication Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Medication *
                        </label>
                        <div className="mt-1 flex gap-4">
                          <select
                            value={medicine.medication}
                            onChange={(e) => updateMedicine(medicine.id, 'medication', e.target.value)}
                            className="block w-full border-2 border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            required
                          >
                            <option value="">Select medication</option>
                            {Object.keys(medicationOptions).map((med) => (
                              <option key={med} value={med}>{med}</option>
                            ))}
                            <option value="custom">Other (specify)</option>
                          </select>
                          {medicine.medication === 'custom' && (
                            <input
                              type="text"
                              value={medicine.customMedication}
                              onChange={(e) => updateMedicine(medicine.id, 'customMedication', e.target.value)}
                              placeholder="Enter medication"
                              className="block w-full border-2 border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              required
                            />
                          )}
                        </div>
                      </div>

                      {/* Dosage Amount */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Dosage Amount *
                        </label>
                        <div className="mt-1">
                          {medicine.medication && medicine.medication !== 'custom' ? (
                            <select
                              value={medicine.dosageAmount}
                              onChange={(e) => updateMedicine(medicine.id, 'dosageAmount', e.target.value)}
                              className="block w-full border-2 border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              required
                            >
                              <option value="">Select amount</option>
                              {medicationOptions[medicine.medication as keyof typeof medicationOptions].map((dose) => (
                                <option key={dose} value={dose}>{dose}</option>
                              ))}
                              <option value="custom">Other (specify)</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={medicine.customDosageAmount}
                              onChange={(e) => updateMedicine(medicine.id, 'customDosageAmount', e.target.value)}
                              placeholder="Enter dosage"
                              className="block w-full border-2 border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              required
                            />
                          )}
                        </div>
                      </div>

                      {/* Frequency */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Frequency *
                        </label>
                        <select
                          value={medicine.frequency}
                          onChange={(e) => updateMedicine(medicine.id, 'frequency', e.target.value)}
                          className="mt-1 block w-full border-2 border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        >
                          <option value="">Select frequency</option>
                          {frequencies.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>

                      {/* Duration */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Duration *
                        </label>
                        <select
                          value={medicine.duration}
                          onChange={(e) => updateMedicine(medicine.id, 'duration', e.target.value)}
                          className="mt-1 block w-full border-2 border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        >
                          <option value="">Select duration</option>
                          {durations.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Special Instructions
                      </label>
                      <input
                        type="text"
                        value={medicine.instructions}
                        onChange={(e) => updateMedicine(medicine.id, 'instructions', e.target.value)}
                        placeholder="E.g., Take after meals, Avoid alcohol, etc."
                        className="mt-1 block w-full border-2 border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Compliance Checkboxes */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Compliance Verification</h4>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="data-protection"
                        name="data-protection"
                        type="checkbox"
                        required
                        checked={dataProtection}
                        onChange={(e) => setDataProtection(e.target.checked)}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="data-protection" className="font-medium text-gray-700">
                        Data Protection & Privacy
                      </label>
                      <p className="text-sm text-gray-500">
                        I confirm that this prescription complies with DPDP Act 2023, IT Act 2000, and NDHM-HDM Policy 2020 
                        regarding patient data privacy and protection.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="medical-ethics"
                        name="medical-ethics"
                        type="checkbox"
                        required
                        checked={medicalEthics}
                        onChange={(e) => setMedicalEthics(e.target.checked)}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="medical-ethics" className="font-medium text-gray-700">
                        Medical Ethics & Professional Conduct
                      </label>
                      <p className="text-sm text-gray-500">
                        I confirm that this prescription follows CEA 2010 and IMC Regulations 2002 guidelines for 
                        professional medical conduct and ethics.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="pharma-compliance"
                        name="pharma-compliance"
                        type="checkbox"
                        required
                        checked={pharmaCompliance}
                        onChange={(e) => setPharmaCompliance(e.target.checked)}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="pharma-compliance" className="font-medium text-gray-700">
                        Pharmaceutical & Safety Regulations
                      </label>
                      <p className="text-sm text-gray-500">
                        I confirm that all prescribed medicines comply with DCA 1940, DCR 1945, and MD Rules 2017, 
                        and follow proper biomedical waste management as per BWM Rules 2016.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border-2 border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Any additional notes or observations"
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Success</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>{success}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading || !isConnected}
                  className={`inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    isConnected ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Adding Prescription...' : 'Add Prescription'}
                </motion.button>
              </div>
            </form>
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by Aadhar, diagnosis, or medicine..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <select
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value as any)}
                  className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Fields</option>
                  <option value="aadhar">Aadhar Number</option>
                  <option value="diagnosis">Diagnosis</option>
                  <option value="medicine">Medicine</option>
                </select>
              </div>
            </div>
            {searchQuery && (
              <div className="mt-2 text-sm text-gray-600">
                Found {filteredPrescriptions.length} record(s) matching "{searchQuery}"
              </div>
            )}
          </div>

          {/* Previous Records Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Previous Records</h2>
            {filteredPrescriptions.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500">
                  {searchQuery ? 'No matching records found.' : 'No records found.'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {(showAll ? filteredPrescriptions : filteredPrescriptions.slice(0, 3)).map((record) => (
                    <div key={record.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-medium">{record.diagnosis}</h3>
                          <p className="text-sm text-gray-500">Patient: {record.patientAadhar}</p>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(record.timestamp * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      {record.medicines && record.medicines.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Medicines:</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {record.medicines.map((med: any, idx: number) => (
                              <li key={idx}>
                                {med.medication} - {med.dosage}, {med.frequency}, {med.duration}
                                {med.instructions && ` (${med.instructions})`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {record.notes && (
                        <div className="mt-2">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Notes:</h4>
                          <p className="text-sm text-gray-600">{record.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {filteredPrescriptions.length > 3 && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {showAll ? 'Show Less' : `Show ${filteredPrescriptions.length - 3} More Records`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
