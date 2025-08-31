'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaUserMd, FaFileMedical, FaSave, FaPrescription } from 'react-icons/fa';
import { useWeb3 } from '@/context/Web3Context';
import MedicalVoiceRecognition from '@/components/MedicalVoiceRecognition';
import AadharScanner from '@/components/AadharScanner';

interface PatientInfo {
  name: string;
  age: number;
  gender: string;
  aadharNumber: string;
}

interface MedicalRecord {
  patientInfo: PatientInfo;
  recordDate: string;
  sections: Record<string, string>;
  prescriptions: Prescription[];
}

interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

const CreateMedicalRecord = () => {
  const router = useRouter();
  const { contract, account } = useWeb3();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: '',
    age: 0,
    gender: '',
    aadharNumber: ''
  });
  
  const [recordSections, setRecordSections] = useState<Record<string, string>>({});
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [currentPrescription, setCurrentPrescription] = useState<Prescription>({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: ''
  });
  const [editingPrescriptionIndex, setEditingPrescriptionIndex] = useState<number | null>(null);
  
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  
  // Handle Aadhar scan result
  const handleAadharScan = async (aadharNumber: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, you would fetch patient details from a database
      // For now, we'll simulate fetching patient data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock patient data - in production this would come from your backend
      const mockPatientData = {
        name: 'Raj Sharma',
        age: 42,
        gender: 'Male',
        aadharNumber: aadharNumber
      };
      
      setPatientInfo(mockPatientData);
      setStep(2);
    } catch (err) {
      console.error('Error fetching patient data:', err);
      setError('Failed to fetch patient data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle manual patient info entry
  const handlePatientInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPatientInfo(prev => ({
      ...prev,
      [name]: name === 'age' ? parseInt(value) || 0 : value
    }));
  };
  
  // Handle voice transcription completion
  const handleTranscriptionComplete = (structuredData: Record<string, string>) => {
    console.log("Received structured data:", structuredData);
    setRecordSections(structuredData);
    
    // Add a sample medication section for testing if needed
    // This is just to help debug - you should comment this out for production
    /*
    if (!structuredData.medication && !structuredData.prescriptions) {
      structuredData.medication = "Prescribe Paracetamol 500mg three times daily for 7 days.";
      console.log("Added sample medication for testing");
    }
    */
    
    // Analyze the transcription for potential prescriptions
    const medicationSection = structuredData.medication || structuredData.prescriptions || structuredData.plan || structuredData.treatment || '';
    console.log("Medication section content:", medicationSection);
    
    // Check all sections for medication-related content
    let foundMedications = false;
    
    if (medicationSection) {
      // Extract prescriptions from the medication section
      const prescriptionLines = medicationSection.split('\n');
      console.log("Prescription lines:", prescriptionLines);
      
      const extractedPrescriptions: Prescription[] = [];
      
      prescriptionLines.forEach(line => {
        if (line.trim() === '') return; // Skip empty lines
        
        console.log("Analyzing line:", line);
        
        // More comprehensive check for prescription-related content
        const keywordMatches = [
          'prescribe', 'medication', 'tablet', 'capsule', 'syrup',
          'mg', 'ml', 'dose', 'daily', 'times a day', 'every', 'take'
        ].some(keyword => line.toLowerCase().includes(keyword));
        
        console.log("Contains medication keywords:", keywordMatches);
        
        if (keywordMatches) {
          // Try to extract dosage and frequency if possible
          let medication = line;
          let dosage = '';
          let frequency = '';
          let duration = '';
          
          // Extract dosage (e.g., 500mg, 10ml)
          const dosageMatch = line.match(/\d+\s*(?:mg|ml|g|mcg)/i);
          if (dosageMatch) {
            dosage = dosageMatch[0];
            console.log("Extracted dosage:", dosage);
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
              console.log("Extracted frequency:", frequency);
              break;
            }
          }
          
          // Extract duration (e.g., for 7 days, for 2 weeks)
          const durationMatch = line.match(/for \d+\s*(?:days?|weeks?|months?)/i);
          if (durationMatch) {
            duration = durationMatch[0];
            console.log("Extracted duration:", duration);
          }
          
          const newPrescription: Prescription = {
            medication,
            dosage,
            frequency,
            duration,
            notes: ''
          };
          
          console.log("Created prescription:", newPrescription);
          extractedPrescriptions.push(newPrescription);
          foundMedications = true;
        }
      });
      
      if (extractedPrescriptions.length > 0) {
        console.log("Final extracted prescriptions:", extractedPrescriptions);
        setPrescriptions(extractedPrescriptions);
      } else {
        console.log("No prescriptions extracted from the medication section");
      }
    } else {
      console.log("No medication section found in the structured data");
    }
    
    // If we didn't find any prescriptions, check all sections for medication-related content
    if (!foundMedications) {
      console.log("Checking all sections for medication content");
      
      // Check all sections for medication keywords
      for (const [section, content] of Object.entries(structuredData)) {
        if (section === 'medication' || section === 'prescriptions') continue; // Already checked
        
        console.log(`Checking section '${section}' for medication content`);
        
        const lines = content.split('\n');
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          const hasMedicationKeywords = [
            'prescribe', 'medication', 'tablet', 'capsule', 'syrup',
            'mg', 'ml', 'dose', 'daily', 'times a day', 'every', 'take'
          ].some(keyword => line.toLowerCase().includes(keyword));
          
          if (hasMedicationKeywords) {
            console.log(`Found medication content in section '${section}':`, line);
            
            // Create a simple prescription from this line
            const newPrescription: Prescription = {
              medication: line,
              dosage: '',
              frequency: '',
              duration: '',
              notes: ''
            };
            
            setPrescriptions(prev => [...prev, newPrescription]);
            foundMedications = true;
          }
        }
      }
    }
    
    // Move to the next step only after processing is complete
    setTimeout(() => {
      setStep(3);
    }, 300);
  };
  
  // Handle prescription form input
  const handlePrescriptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentPrescription(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Add a new prescription
  const addPrescription = () => {
    if (editingPrescriptionIndex !== null) {
      setPrescriptions(prev => {
        const newPrescriptions = [...prev];
        newPrescriptions[editingPrescriptionIndex] = currentPrescription;
        return newPrescriptions;
      });
    } else {
      setPrescriptions(prev => [...prev, currentPrescription]);
    }
    setCurrentPrescription({
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      notes: ''
    });
    setEditingPrescriptionIndex(null);
    setShowPrescriptionForm(false);
  };
  
  // Remove a prescription
  const removePrescription = (index: number) => {
    setPrescriptions(prev => prev.filter((_, i) => i !== index));
  };
  
  // Save the complete medical record
  const saveRecord = async () => {
    if (!patientInfo.aadharNumber) {
      setError('Patient Aadhar number is required');
      return;
    }
    
    // Check if we have medical record content or prescriptions
    if (Object.keys(recordSections).length === 0 && prescriptions.length === 0) {
      setError('Medical record cannot be empty');
      return;
    }
    
    // If we have prescriptions but no record sections, create a default section
    if (Object.keys(recordSections).length === 0 && prescriptions.length > 0) {
      // Create a default notes section with prescription information
      const prescriptionSummary = prescriptions.map(p => 
        `${p.medication} ${p.dosage} ${p.frequency} ${p.duration}`
      ).join('\n');
      
      setRecordSections({
        notes: `Prescription only visit.\nPrescriptions:\n${prescriptionSummary}`
      });
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create the complete medical record
      const medicalRecord: MedicalRecord = {
        patientInfo,
        recordDate: new Date().toISOString(),
        sections: Object.keys(recordSections).length > 0 ? recordSections : {
          notes: "Prescription only visit."
        },
        prescriptions
      };
      
      // Convert to JSON string for storage
      const recordJSON = JSON.stringify(medicalRecord);
      
      // For demo purposes, we'll simulate saving to blockchain
      // In a real app, this would be replaced with actual blockchain calls
      console.log("Medical record to be saved:", recordJSON);
      
      // Simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage for demo purposes
      const savedRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
      savedRecords.push({
        id: `REC${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        patientName: patientInfo.name,
        patientAadhar: patientInfo.aadharNumber,
        recordType: 'Medical Record',
        date: new Date().toISOString().split('T')[0],
        department: 'General Medicine',
        doctor: 'Dr. ' + (localStorage.getItem('hospitalName') || 'Unknown'),
        status: 'completed',
        fileType: 'pdf',
        data: recordJSON
      });
      localStorage.setItem('medicalRecords', JSON.stringify(savedRecords));
      
      // Also save prescriptions separately
      if (prescriptions.length > 0) {
        const savedPrescriptions = JSON.parse(localStorage.getItem('prescriptions') || '[]');
        
        for (const prescription of prescriptions) {
          savedPrescriptions.push({
            id: `PRESC${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            patientName: patientInfo.name,
            patientAadhar: patientInfo.aadharNumber,
            medication: prescription.medication,
            dosage: prescription.dosage,
            frequency: prescription.frequency,
            duration: prescription.duration,
            notes: prescription.notes,
            date: new Date().toISOString().split('T')[0],
            doctor: 'Dr. ' + (localStorage.getItem('hospitalName') || 'Unknown'),
            status: 'active'
          });
        }
        
        localStorage.setItem('prescriptions', JSON.stringify(savedPrescriptions));
      }
      
      setSuccess('Medical record and prescriptions saved successfully!');
      
      // Redirect to records page after a short delay
      setTimeout(() => {
        router.push('/hospital/records');
      }, 2000);
      
    } catch (err) {
      console.error('Error saving medical record:', err);
      setError(`Failed to save medical record: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <FaFileMedical className="mr-2 text-blue-600" />
          Create Medical Record
        </h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {success}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Step indicator */}
          <div className="bg-gray-100 px-6 py-4">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <div className={`flex-1 h-1 mx-2 ${
                step >= 2 ? 'bg-blue-600' : 'bg-gray-300'
              }`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <div className={`flex-1 h-1 mx-2 ${
                step >= 3 ? 'bg-blue-600' : 'bg-gray-300'
              }`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <div className="text-center">Patient Info</div>
              <div className="text-center">Medical Record</div>
              <div className="text-center">Prescriptions</div>
            </div>
          </div>
          
          <div className="p-6">
            {/* Step 1: Patient Information */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <FaUserMd className="mr-2 text-blue-600" />
                  Patient Information
                </h2>
                
                <div className="mb-6">
                  <h3 className="text-md font-medium mb-2">Scan Aadhar Card</h3>
                  <AadharScanner onScanComplete={handleAadharScan} />
                </div>
                
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2">Or Enter Patient Details Manually</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Aadhar Number
                      </label>
                      <input
                        type="text"
                        name="aadharNumber"
                        value={patientInfo.aadharNumber}
                        onChange={handlePatientInfoChange}
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
                        onChange={handlePatientInfoChange}
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
                        onChange={handlePatientInfoChange}
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
                        onChange={handlePatientInfoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (patientInfo.aadharNumber && patientInfo.name) {
                        setStep(2);
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
              </motion.div>
            )}
            
            {/* Step 2: Medical Record */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold mb-4">
                  Medical Record for {patientInfo.name}
                </h2>
                
                <div className="mb-6">
                  <MedicalVoiceRecognition
                    onTranscriptionComplete={handleTranscriptionComplete}
                    patientInfo={patientInfo}
                    initialSections={recordSections}
                  />
                </div>
                
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Back
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      if (Object.keys(recordSections).length > 0) {
                        setStep(3);
                      } else {
                        setError('Please record some medical information before proceeding');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Next: Prescriptions
                  </button>
                </div>
              </motion.div>
            )}
            
            {/* Step 3: Prescriptions */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <FaPrescription className="mr-2 text-blue-600" />
                  Prescriptions
                </h2>
                
                {prescriptions.length > 0 ? (
                  <div className="mb-6">
                    <h3 className="text-md font-medium mb-2">Current Prescriptions</h3>
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
                                  
                                  // Open form for editing
                                  setCurrentPrescription(editedPrescription);
                                  setEditingPrescriptionIndex(index);
                                  setShowPrescriptionForm(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => removePrescription(index)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-yellow-50 text-yellow-700 rounded-md">
                    <p>No prescriptions were automatically detected from your voice input.</p>
                    <p className="mt-1">For best results, try to include phrases like:</p>
                    <ul className="list-disc pl-5 mt-1 text-sm">
                      <li>"Prescribe Paracetamol 500mg twice daily for 7 days"</li>
                      <li>"Medication includes Amoxicillin 250mg every 8 hours"</li>
                      <li>"Patient should take Omeprazole 20mg once daily"</li>
                    </ul>
                    <div className="mt-3 flex space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPrescriptions([
                            {
                              medication: "Paracetamol",
                              dosage: "500mg",
                              frequency: "twice daily",
                              duration: "for 7 days",
                              notes: "Take after meals"
                            }
                          ]);
                        }}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm hover:bg-blue-200"
                      >
                        Add Sample Prescription
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPrescription({
                            medication: '',
                            dosage: '',
                            frequency: '',
                            duration: '',
                            notes: ''
                          });
                          setEditingPrescriptionIndex(null);
                          setShowPrescriptionForm(true);
                        }}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm hover:bg-green-200"
                      >
                        Add Prescription Manually
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="mb-4">
                  {!showPrescriptionForm ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPrescription({
                          medication: '',
                          dosage: '',
                          frequency: '',
                          duration: '',
                          notes: ''
                        });
                        setEditingPrescriptionIndex(null);
                        setShowPrescriptionForm(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Add New Prescription
                    </button>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                      <h3 className="text-md font-medium mb-3">
                        {editingPrescriptionIndex !== null ? 'Edit Prescription' : 'Add New Prescription'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Medication
                          </label>
                          <input
                            type="text"
                            name="medication"
                            value={currentPrescription.medication}
                            onChange={handlePrescriptionChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Medication name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Dosage
                          </label>
                          <input
                            type="text"
                            name="dosage"
                            value={currentPrescription.dosage}
                            onChange={handlePrescriptionChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 500mg"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Frequency
                          </label>
                          <input
                            type="text"
                            name="frequency"
                            value={currentPrescription.frequency}
                            onChange={handlePrescriptionChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Twice daily"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration
                          </label>
                          <input
                            type="text"
                            name="duration"
                            value={currentPrescription.duration}
                            onChange={handlePrescriptionChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 7 days"
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                          </label>
                          <textarea
                            name="notes"
                            value={currentPrescription.notes}
                            onChange={handlePrescriptionChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Additional instructions"
                            rows={2}
                          ></textarea>
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-4 space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowPrescriptionForm(false)}
                          className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={addPrescription}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          disabled={!currentPrescription.medication}
                        >
                          {editingPrescriptionIndex !== null ? 'Save Changes' : 'Add Prescription'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Back
                  </button>
                  
                  <button
                    type="button"
                    onClick={saveRecord}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                    disabled={loading}
                  >
                    <FaSave className="mr-2" />
                    {loading ? 'Saving...' : 'Save Medical Record'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateMedicalRecord;
