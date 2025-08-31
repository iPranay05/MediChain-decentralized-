'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { FaSearch, FaDownload, FaFilePdf, FaFileAlt, FaMicrophone, FaPlus, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import MedicalVoiceRecognition from '@/components/MedicalVoiceRecognition';
import AadharScanner from '@/components/AadharScanner';
import { useWeb3 } from '@/context/Web3Context';

interface MedicalRecord {
  id: string;
  patientName: string;
  patientAadhar: string;
  recordType: 'Lab Report' | 'Prescription' | 'Discharge Summary' | 'Imaging';
  date: string;
  department: string;
  doctor: string;
  status: 'completed' | 'pending' | 'archived';
  fileType: 'pdf' | 'doc';
}

const initialRecords: MedicalRecord[] = [
  {
    id: 'REC001',
    patientName: 'Pranay Nair',
    patientAadhar: '463326556422',
    recordType: 'Lab Report',
    date: '2025-03-20',
    department: 'Pathology',
    doctor: 'Dr. Rajesh Kumar',
    status: 'completed',
    fileType: 'pdf'
  },
  {
    id: 'REC002',
    patientName: 'Aditya Dubey',
    patientAadhar: '567890123456',
    recordType: 'Prescription',
    date: '2025-03-20',
    department: 'Cardiology',
    doctor: 'Dr. Priya Sharma',
    status: 'completed',
    fileType: 'pdf'
  },
  {
    id: 'REC003',
    patientName: 'Nidhi Tripathi',
    patientAadhar: '678901234567',
    recordType: 'Imaging',
    date: '2025-03-19',
    department: 'Radiology',
    doctor: 'Dr. Suresh Reddy',
    status: 'pending',
    fileType: 'doc'
  },
  {
    id: 'REC004',
    patientName: 'Bhoomi Pandey',
    patientAadhar: '789012345678',
    recordType: 'Discharge Summary',
    date: '2025-03-18',
    department: 'General Medicine',
    doctor: 'Dr. Priya Sharma',
    status: 'completed',
    fileType: 'pdf'
  },
  {
    id: 'REC005',
    patientName: 'Pranay Nair',
    patientAadhar: '463326556422',
    recordType: 'Prescription',
    date: '2025-03-17',
    department: 'Orthopedics',
    doctor: 'Dr. Suresh Reddy',
    status: 'archived',
    fileType: 'pdf'
  }
];

export default function MedicalRecords() {
  const { contract, account } = useWeb3();
  const [records, setRecords] = useState<MedicalRecord[]>(initialRecords);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAll, setShowAll] = useState(false);
  
  // Voice recognition states
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [structuredData, setStructuredData] = useState<Record<string, string>>({});
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    age: 0,
    gender: '',
    aadharNumber: ''
  });
  const [showAadharScanner, setShowAadharScanner] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.patientAadhar.includes(searchQuery) ||
      record.doctor.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || record.recordType === filterType;
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const displayedRecords = showAll ? filteredRecords : filteredRecords.slice(0, 3);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FaFilePdf className="w-5 h-5 text-red-500" />;
      case 'doc':
        return <FaFileAlt className="w-5 h-5 text-blue-500" />;
      default:
        return <FaFileAlt className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleDownload = async (recordId: string) => {
    try {
      const response = await fetch(`/api/records/download?id=${recordId}`);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `record_${recordId}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Record downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download record');
    }
  };

  // Function to handle voice recognition
  const startVoiceRecognition = () => {
    setIsRecording(true);
  };

  const stopVoiceRecognition = () => {
    setIsRecording(false);
  };

  const handleTranscriptComplete = (data: Record<string, string>) => {
    setStructuredData(data);
    extractPrescriptions(data);
    setCurrentStep(3);
  };

  const handleAadharScan = async (aadharNumber: string) => {
    setLoading(true);
    try {
      // In a real app, you would fetch patient details from a database
      // For now, we'll simulate fetching patient data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock patient data - in production this would come from your backend
      const mockPatientData = {
        name: 'Raj Sharma',
        age: 42,
        gender: 'Male',
        aadharNumber: aadharNumber
      };
      
      setPatientInfo(mockPatientData);
      setShowAadharScanner(false);
      setCurrentStep(2);
    } catch (err) {
      setError('Failed to fetch patient data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const extractPrescriptions = (data: Record<string, string>) => {
    // Look for prescriptions in multiple possible sections
    const medicationSection = data.medication || data.prescriptions || data.plan || data.treatment || '';
    
    if (medicationSection) {
      const prescriptionLines = medicationSection.split('\n');
      
      const extractedPrescriptions: any[] = [];
      
      prescriptionLines.forEach(line => {
        if (line.trim() === '') return; // Skip empty lines
        
        // More comprehensive check for prescription-related content
        if (line.toLowerCase().includes('prescribe') || 
            line.toLowerCase().includes('medication') || 
            line.toLowerCase().includes('tablet') || 
            line.toLowerCase().includes('capsule') || 
            line.toLowerCase().includes('syrup') ||
            line.toLowerCase().includes('mg') ||
            line.toLowerCase().includes('ml') ||
            line.toLowerCase().includes('dose') ||
            line.toLowerCase().includes('daily') ||
            line.toLowerCase().includes('times a day') ||
            line.toLowerCase().includes('every') ||
            line.toLowerCase().includes('take')) {
          
          // Try to extract dosage and frequency if possible
          let medication = line;
          let dosage = '';
          let frequency = '';
          let duration = '';
          
          // Extract dosage (e.g., 500mg, 10ml)
          const dosageMatch = line.match(/\d+\s*(?:mg|ml|g|mcg)/i);
          if (dosageMatch) {
            dosage = dosageMatch[0];
          }
          
          // Extract frequency (e.g., twice daily, every 8 hours)
          const frequencyMatches = [
            /once daily/i, /twice daily/i, /three times daily/i, /four times daily/i,
            /every \d+ hours/i, /every \d+ days/i, /\d+ times a day/i,
            /before meals/i, /after meals/i, /with meals/i, /as needed/i
          ];
          
          for (const pattern of frequencyMatches) {
            const match = line.match(pattern);
            if (match) {
              frequency = match[0];
              break;
            }
          }
          
          // Extract duration (e.g., for 7 days, for 2 weeks)
          const durationMatch = line.match(/for \d+\s*(?:days?|weeks?|months?)/i);
          if (durationMatch) {
            duration = durationMatch[0];
          }
          
          const newPrescription = {
            medication,
            dosage,
            frequency,
            duration,
            notes: ''
          };
          
          extractedPrescriptions.push(newPrescription);
        }
      });
      
      if (extractedPrescriptions.length > 0) {
        setPrescriptions(extractedPrescriptions);
        return true;
      }
    }
    
    return false;
  };

  const saveMedicalRecord = async () => {
    if (!patientInfo.aadharNumber) {
      setError('Patient Aadhar number is required');
      return;
    }
    
    if (Object.keys(structuredData).length === 0) {
      setError('Medical record cannot be empty');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (!contract) {
        throw new Error('Blockchain contract is not available');
      }
      
      // Create the complete medical record
      const medicalRecord = {
        patientInfo,
        recordDate: new Date().toISOString(),
        sections: structuredData,
        prescriptions
      };
      
      // Convert to JSON string for blockchain storage
      const recordJSON = JSON.stringify(medicalRecord);
      
      // Save to blockchain
      const tx = await contract.addMedicalRecord(
        patientInfo.aadharNumber,
        recordJSON
      );
      
      await tx.wait();
      
      // Create prescriptions if any
      if (prescriptions.length > 0) {
        for (const prescription of prescriptions) {
          const prescriptionJSON = JSON.stringify(prescription);
          
          const prescTx = await contract.addPrescription(
            patientInfo.aadharNumber,
            prescriptionJSON
          );
          
          await prescTx.wait();
        }
      }
      
      // Add the record to the local state
      const newRecord: MedicalRecord = {
        id: `REC${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        patientName: patientInfo.name,
        patientAadhar: patientInfo.aadharNumber,
        recordType: 'Prescription',
        date: new Date().toISOString().split('T')[0],
        department: 'General Medicine',
        doctor: 'Dr. ' + (localStorage.getItem('hospitalName') || 'Unknown'),
        status: 'completed',
        fileType: 'pdf'
      };
      
      setRecords(prev => [newRecord, ...prev]);
      
      // Reset states
      setCurrentStep(1);
      setPatientInfo({
        name: '',
        age: 0,
        gender: '',
        aadharNumber: ''
      });
      setStructuredData({});
      setPrescriptions([]);
      
      // Show success message
      toast.success('Medical record created successfully!');
    } catch (err) {
      console.error('Error saving medical record:', err);
      setError(`Failed to save medical record: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Medical Records</h1>
            
            <button
              onClick={() => {
                setCurrentStep(1);
                setShowAadharScanner(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaPlus className="mr-2" />
              Create New Record
            </button>
          </div>

          {/* Voice Recognition and Record Creation Section */}
          {currentStep > 0 && (
            <div className="mb-6 bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {currentStep === 1 ? 'Patient Identification' : 
                   currentStep === 2 ? 'Voice Medical Record' : 
                   'Review and Save'}
                </h2>
                <button 
                  onClick={() => {
                    setCurrentStep(1);
                    setPatientInfo({
                      name: '',
                      age: 0,
                      gender: '',
                      aadharNumber: ''
                    });
                    setStructuredData({});
                    setPrescriptions([]);
                    setShowAadharScanner(false);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              
              {/* Step indicator */}
              <div className="bg-gray-100 px-6 py-4 rounded-lg mb-6">
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    1
                  </div>
                  <div className={`flex-1 h-1 mx-2 ${
                    currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'
                  }`}></div>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    2
                  </div>
                  <div className={`flex-1 h-1 mx-2 ${
                    currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'
                  }`}></div>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    3
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <div className="text-center">Patient Info</div>
                  <div className="text-center">Medical Record</div>
                  <div className="text-center">Review & Save</div>
                </div>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              
              {/* Step 1: Patient Identification */}
              {currentStep === 1 && (
                <div>
                  {showAadharScanner ? (
                    <div className="mb-6">
                      <h3 className="text-md font-medium mb-2">Scan Aadhar Card</h3>
                      <AadharScanner onScanComplete={handleAadharScan} />
                      
                      <div className="mt-4">
                        <button
                          onClick={() => setShowAadharScanner(false)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Enter details manually instead
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <h3 className="text-md font-medium mb-2">Enter Patient Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Aadhar Number
                          </label>
                          <input
                            type="text"
                            name="aadharNumber"
                            value={patientInfo.aadharNumber}
                            onChange={(e) => setPatientInfo(prev => ({
                              ...prev,
                              aadharNumber: e.target.value
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="XXXX-XXXX-XXXX"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Patient Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={patientInfo.name}
                            onChange={(e) => setPatientInfo(prev => ({
                              ...prev,
                              name: e.target.value
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Full Name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Age
                          </label>
                          <input
                            type="number"
                            name="age"
                            value={patientInfo.age || ''}
                            onChange={(e) => setPatientInfo(prev => ({
                              ...prev,
                              age: parseInt(e.target.value) || 0
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Age"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Gender
                          </label>
                          <select
                            name="gender"
                            value={patientInfo.gender}
                            onChange={(e) => setPatientInfo(prev => ({
                              ...prev,
                              gender: e.target.value
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <button
                          onClick={() => setShowAadharScanner(true)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Scan Aadhar instead
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (patientInfo.aadharNumber && patientInfo.name) {
                          setCurrentStep(2);
                        } else {
                          setError('Aadhar number and patient name are required');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      {loading ? 'Processing...' : 'Next: Medical Record'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 2: Voice Medical Record */}
              {currentStep === 2 && (
                <div>
                  <h3 className="text-md font-medium mb-4">
                    Record Medical Information for {patientInfo.name}
                  </h3>
                  
                  <div className="mb-6">
                    <MedicalVoiceRecognition
                      onTranscriptionComplete={(data) => {
                        setStructuredData(data);
                        extractPrescriptions(data);
                        setCurrentStep(3);
                      }}
                      patientInfo={patientInfo}
                      initialSections={structuredData}
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
              
              {/* Step 3: Review and Save */}
              {currentStep === 3 && (
                <div>
                  <h3 className="text-md font-medium mb-4">
                    Review Medical Record
                  </h3>
                  
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Patient Information</h4>
                    <p><span className="font-medium">Name:</span> {patientInfo.name}</p>
                    <p><span className="font-medium">Aadhar:</span> {patientInfo.aadharNumber}</p>
                    <p><span className="font-medium">Age:</span> {patientInfo.age}</p>
                    <p><span className="font-medium">Gender:</span> {patientInfo.gender}</p>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Medical Record</h4>
                    {Object.entries(structuredData).map(([section, content]) => (
                      <div key={section} className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 capitalize mb-1">{section}</h5>
                        <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                          {content.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Prescriptions</h4>
                    {prescriptions.length > 0 ? (
                      <div className="space-y-3">
                        {prescriptions.map((prescription, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{prescription.medication}</div>
                                <div className="text-sm text-gray-600">
                                  {prescription.dosage && <span className="mr-2">{prescription.dosage}</span>}
                                  {prescription.frequency && <span className="mr-2">{prescription.frequency}</span>}
                                  {prescription.duration && <span>for {prescription.duration}</span>}
                                </div>
                                {prescription.notes && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    Note: {prescription.notes}
                                  </div>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Create a copy of the prescription for editing
                                    const editedPrescription = { ...prescription };
                                    // Open a modal or form for editing
                                    // For simplicity, we'll just prompt for now
                                    const newDosage = prompt("Enter dosage (e.g., 500mg):", prescription.dosage);
                                    if (newDosage !== null) editedPrescription.dosage = newDosage;
                                    
                                    const newFrequency = prompt("Enter frequency (e.g., twice daily):", prescription.frequency);
                                    if (newFrequency !== null) editedPrescription.frequency = newFrequency;
                                    
                                    const newDuration = prompt("Enter duration (e.g., 7 days):", prescription.duration);
                                    if (newDuration !== null) editedPrescription.duration = newDuration;
                                    
                                    // Update the prescription
                                    const updatedPrescriptions = [...prescriptions];
                                    updatedPrescriptions[index] = editedPrescription;
                                    setPrescriptions(updatedPrescriptions);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPrescriptions(prev => prev.filter((_, i) => i !== index))}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={() => {
                            setPrescriptions([
                              ...prescriptions,
                              {
                                medication: '',
                                dosage: '',
                                frequency: '',
                                duration: '',
                                notes: ''
                              }
                            ]);
                          }}
                          className="mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm hover:bg-green-200"
                        >
                          + Add Another Prescription
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md">
                        <p>No prescriptions were automatically detected from your voice input.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setPrescriptions([
                              {
                                medication: '',
                                dosage: '',
                                frequency: '',
                                duration: '',
                                notes: ''
                              }
                            ]);
                          }}
                          className="mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm hover:bg-green-200"
                        >
                          + Add Prescription Manually
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Back
                    </button>
                    
                    <button
                      type="button"
                      onClick={saveMedicalRecord}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Medical Record'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by patient name, Aadhar, or doctor..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="Lab Report">Lab Reports</option>
              <option value="Prescription">Prescriptions</option>
              <option value="Discharge Summary">Discharge Summaries</option>
              <option value="Imaging">Imaging</option>
            </select>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Records List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Record Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayedRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getFileIcon(record.fileType)}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {record.patientName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.patientAadhar}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.recordType}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{record.department}</div>
                      <div className="text-sm text-gray-500">{record.doctor}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleDownload(record.id)}
                        className="text-blue-600 hover:text-blue-900 mr-4 flex items-center gap-2"
                      >
                        <FaDownload className="w-5 h-5" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Show More Button */}
          {filteredRecords.length > 3 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {showAll ? 'Show Less' : `Show ${filteredRecords.length - 3} More Records`}
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
