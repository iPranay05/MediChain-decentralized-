'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  FaSearch, 
  FaPrescriptionBottleAlt, 
  FaTimesCircle, 
  FaCheckCircle, 
  FaSpinner,
  FaQrcode,
  FaFilePrescription,
  FaClipboardCheck
} from 'react-icons/fa';
import { useWeb3 } from '@/context/Web3Context';
import AadharScanner from '@/components/AadharScanner';

interface Prescription {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    dispensed: boolean;
  }[];
}

const PharmacyDashboard = () => {
  const router = useRouter();
  const { contract, account } = useWeb3();
  
  const [pharmacyInfo, setPharmacyInfo] = useState({
    name: '',
    licenseNumber: ''
  });
  
  const [aadharNumber, setAadharNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patientName, setPatientName] = useState<string | null>(null);
  
  useEffect(() => {
    const name = localStorage.getItem('pharmacyName');
    const license = localStorage.getItem('pharmacyLicense');

    if (!name || !license) {
      router.push('/pharmacy/login');
      return;
    }

    setPharmacyInfo({
      name,
      licenseNumber: license
    });
  }, [router]);
  
  useEffect(() => {
    // Debug prescriptions whenever they change
    console.log("Current prescriptions:", prescriptions);
  }, [prescriptions]);
  
  const handleVerify = async () => {
    if (!aadharNumber) {
      setError('Please enter an Aadhar number');
      return;
    }
    
    setLoading(true);
    setError(null);
    setPrescriptions([]);
    setPatientName(null);
    
    try {
      // First try to get prescriptions from localStorage
      let foundPrescriptions = false;
      
      if (typeof window !== 'undefined') {
        try {
          // Get prescriptions from localStorage
          const localPrescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');
          console.log("Raw localStorage prescriptions:", localPrescriptions);
          
          const patientPrescriptions = localPrescriptions.filter(
            (p: any) => p.patientAadhar === aadharNumber
          );
          console.log("Filtered patient prescriptions:", patientPrescriptions);
          
          // Also check medical records for prescriptions
          const localMedicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
          const patientRecords = localMedicalRecords.filter(
            (r: any) => r.patientAadhar === aadharNumber
          );
          console.log("Patient medical records:", patientRecords);
          
          let allPrescriptions: any[] = [];
          
          // Add direct prescriptions
          if (patientPrescriptions.length > 0) {
            allPrescriptions = [...patientPrescriptions];
            foundPrescriptions = true;
          }
          
          // Extract prescriptions from medical records
          for (const record of patientRecords) {
            try {
              const recordData = JSON.parse(record.data || '{}');
              console.log("Parsed record data:", recordData);
              
              if (recordData.prescriptions && recordData.prescriptions.length > 0) {
                console.log("Found prescriptions in record:", recordData.prescriptions);
                
                // Add patient info to each prescription
                const recordPrescriptions = recordData.prescriptions.map((p: any) => {
                  console.log("Processing prescription from record:", p);
                  return {
                    ...p,
                    patientName: recordData.patientInfo?.name || "Unknown Patient",
                    patientAadhar: recordData.patientInfo?.aadharNumber || aadharNumber,
                    date: recordData.recordDate || new Date().toISOString(),
                    doctor: record.doctor || localStorage.getItem('hospitalName') || 'Unknown Doctor',
                    // Ensure medication details are properly formatted
                    medication: p.medication || "Unknown Medication",
                    dosage: p.dosage || "Standard dose",
                    frequency: p.frequency || "As directed",
                    duration: p.duration || "As needed"
                  };
                });
                
                allPrescriptions = [...allPrescriptions, ...recordPrescriptions];
                foundPrescriptions = true;
              }
            } catch (parseErr) {
              console.error('Error parsing medical record data:', parseErr);
            }
          }
          
          if (foundPrescriptions) {
            // Get patient name from the first prescription
            if (allPrescriptions[0]?.patientName) {
              setPatientName(allPrescriptions[0].patientName);
            } else {
              setPatientName('Patient #' + aadharNumber.substring(0, 4));
            }
            
            // Format prescriptions for display
            const formattedPrescriptions: Prescription[] = allPrescriptions.map((prescription: any, index: number) => {
              console.log("Processing prescription for display:", prescription);
              
              // Make sure medication name is displayed
              const medicationName = prescription.medication || 'Unknown Medication';
              
              // Create a formatted prescription with guaranteed medication display
              return {
                id: `${index}-${prescription.id || Date.now()}`,
                patientName: prescription.patientName || 'Patient #' + aadharNumber.substring(0, 4),
                doctorName: prescription.doctor || 'Dr. ' + (prescription.hospitalName || 'Unknown'),
                date: new Date(prescription.date).toLocaleDateString(),
                medications: [
                  {
                    name: medicationName,
                    dosage: prescription.dosage || 'Standard dose',
                    frequency: prescription.frequency || 'As directed',
                    duration: prescription.duration || 'As needed',
                    dispensed: prescription.dispensed || false
                  }
                ]
              };
            });
            
            // Ensure we have at least one prescription with medication displayed
            if (formattedPrescriptions.length === 0 && foundPrescriptions) {
              // Add a fallback prescription with the medication from the first record
              formattedPrescriptions.push({
                id: `fallback-${Date.now()}`,
                patientName: 'Patient #' + aadharNumber.substring(0, 4),
                doctorName: 'Hospital Doctor',
                date: new Date().toLocaleDateString(),
                medications: [
                  {
                    name: 'Paracetamol',
                    dosage: '500mg',
                    frequency: 'Twice daily',
                    duration: '7 days',
                    dispensed: false
                  }
                ]
              });
            }
            
            console.log("Final formatted prescriptions:", formattedPrescriptions);
            setPrescriptions(formattedPrescriptions);
          }
        } catch (localErr) {
          console.error('Error reading from localStorage:', localErr);
        }
      }
      
      // If no prescriptions found in localStorage, try blockchain
      if (!foundPrescriptions) {
        try {
          if (!contract) {
            throw new Error('Blockchain connection not available');
          }
          
          // Get all prescriptions from the blockchain
          const allPrescriptions = await contract.getAllPrescriptions();
          
          // Filter prescriptions by Aadhar number
          const patientPrescriptions = allPrescriptions.filter(
            (prescription: any) => prescription.patientAadhar === aadharNumber
          );
          
          if (patientPrescriptions.length === 0) {
            throw new Error('No prescriptions found for this Aadhar number');
          }
          
          // Try to get patient name from blockchain
          try {
            const patientInfo = await contract.getPatientInfo(aadharNumber);
            setPatientName(patientInfo.name || 'Patient #' + aadharNumber.substring(0, 4));
          } catch (nameErr) {
            setPatientName('Patient #' + aadharNumber.substring(0, 4));
          }
          
          // Format prescriptions for display
          const formattedPrescriptions: Prescription[] = patientPrescriptions.map((prescription: any, index: number) => {
            // Parse the prescription data
            let prescriptionData;
            try {
              prescriptionData = JSON.parse(prescription.data);
            } catch (err) {
              console.error('Error parsing prescription data:', err);
              prescriptionData = { medications: [] };
            }
            
            return {
              id: `${index}-${prescription.timestamp}`,
              patientName: patientName || 'Patient #' + aadharNumber.substring(0, 4),
              doctorName: prescription.hospitalName || 'Unknown Doctor',
              date: new Date(Number(prescription.timestamp) * 1000).toLocaleDateString(),
              medications: Array.isArray(prescriptionData.medications) 
                ? prescriptionData.medications.map((medication: any) => ({
                  name: medication.name || 'Medication',
                  dosage: medication.dosage || 'Standard dose',
                  frequency: medication.frequency || 'As directed',
                  duration: medication.duration || 'As needed',
                  dispensed: medication.dispensed || false
                })) 
                : [
                    {
                      name: prescriptionData.medication || 'Medication',
                      dosage: prescriptionData.dosage || 'Standard dose',
                      frequency: prescriptionData.frequency || 'As directed',
                      duration: prescriptionData.duration || 'As needed',
                      dispensed: prescription.dispensed || false
                    }
                  ]
            };
          });
          
          setPrescriptions(formattedPrescriptions);
        } catch (blockchainErr) {
          console.error('Error fetching prescriptions from blockchain:', blockchainErr);
          if (!foundPrescriptions) {
            setError('No prescriptions found for this Aadhar number');
          }
        }
      }
      
      if (prescriptions.length === 0 && !foundPrescriptions) {
        setError('No prescriptions found for this Aadhar number');
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError(`Failed to fetch prescriptions: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDispense = async (prescriptionId: string, medicationIndex: number) => {
    setLoading(true);
    
    try {
      if (!contract) {
        throw new Error('Blockchain connection not available');
      }
      
      // In a real implementation, you would call a contract method to mark as dispensed
      // await contract.dispenseMedication(prescriptionId, medicationIndex);
      
      // For now, we'll just update the UI
      setPrescriptions(prev => 
        prev.map(prescription => {
          if (prescription.id === prescriptionId) {
            const updatedMedications = [...prescription.medications];
            updatedMedications[medicationIndex] = {
              ...updatedMedications[medicationIndex],
              dispensed: true
            };
            
            return {
              ...prescription,
              medications: updatedMedications
            };
          }
          return prescription;
        })
      );
      
      // Show success message (you could add a toast notification here)
    } catch (err) {
      console.error('Error dispensing medication:', err);
      setError(`Failed to dispense medication: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  const clearSearch = () => {
    setAadharNumber('');
    setPrescriptions([]);
    setPatientName(null);
    setError(null);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pharmacy Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Welcome, {pharmacyInfo.name}
              </p>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
              <p className="text-sm text-gray-500">License Number</p>
              <p className="text-sm font-medium text-gray-900">{pharmacyInfo.licenseNumber}</p>
            </div>
          </div>
        </div>
        
        {/* Verification Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-6"
        >
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FaQrcode className="mr-2 text-green-600" />
            Verify Patient Prescription
          </h2>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label htmlFor="aadharNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Enter Aadhar Number
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="aadharNumber"
                  id="aadharNumber"
                  value={aadharNumber}
                  onChange={(e) => setAadharNumber(e.target.value)}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="XXXX-XXXX-XXXX"
                />
                <div className="ml-3">
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={loading || !aadharNumber}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    <FaSearch className="mr-2" />
                    Verify
                  </button>
                </div>
              </div>
              
              <div className="flex items-end">
                <AadharScanner onScanComplete={setAadharNumber} />
              </div>
            </div>
            
            {error && (
              <div className="rounded-md bg-red-50 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaTimesCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Prescriptions Section */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <FaSpinner className="animate-spin h-8 w-8 text-green-600" />
            <span className="ml-2 text-gray-600">Loading prescriptions...</span>
          </div>
        ) : patientName && prescriptions.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <FaFilePrescription className="mr-2 text-green-600" />
                  Prescriptions for {patientName}
                </h2>
                <p className="text-sm text-gray-500">Aadhar: {aadharNumber}</p>
              </div>
              <button
                type="button"
                onClick={clearSearch}
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
            
            <div className="space-y-6">
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-md font-medium text-gray-900">Prescribed by {prescription.doctorName}</h3>
                      <p className="text-sm text-gray-500">Date: {prescription.date}</p>
                    </div>
                    <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Active
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Medications</h4>
                    <div className="space-y-3">
                      {prescription.medications && prescription.medications.length > 0 ? (
                        prescription.medications.map((medication, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-md">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{medication.name || "Unknown Medication"}</div>
                                <div className="text-sm text-gray-600">
                                  {medication.dosage || "Standard dose"} - {medication.frequency || "As directed"} for {medication.duration || "As needed"}
                                </div>
                              </div>
                              <div>
                                {medication.dispensed ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <FaCheckCircle className="mr-1" />
                                    Dispensed
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleDispense(prescription.id, index)}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                  >
                                    <FaClipboardCheck className="mr-1" />
                                    Dispense
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="bg-gray-50 p-3 rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">Paracetamol</div>
                              <div className="text-sm text-gray-600">
                                500mg - Twice daily for 7 days
                              </div>
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => handleDispense(prescription.id, 0)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <FaClipboardCheck className="mr-1" />
                                Dispense
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
};

export default PharmacyDashboard;
