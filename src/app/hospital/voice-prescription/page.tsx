'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaUserMd, FaUser, FaPrescription, FaHistory, FaIdCard, FaSearch, FaMicrophone, FaStop, FaPaperPlane } from 'react-icons/fa';
import Layout from '@/components/Layout';
import DoctorVoiceRecorder from '@/components/DoctorVoiceRecorder';
import { toast } from 'react-hot-toast';

interface Patient {
  id: string;
  name: string;
  aadharNumber: string;
  age: number;
  gender: string;
  lastVisit: string;
}

const VoicePrescriptionPage = () => {
  const router = useRouter();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentPrescriptions, setSentPrescriptions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [directAadharInput, setDirectAadharInput] = useState('');
  const [patientName, setPatientName] = useState('');
  const [useDirectInput, setUseDirectInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcription, setTranscription] = useState('');
  const [sending, setSending] = useState(false);

  // Timer interval for recording duration
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Sample patient data
  const patients: Patient[] = [
    {
      id: 'P001',
      name: 'Pranay Nair',
      aadharNumber: '4633 2655 6422',
      age: 35,
      gender: 'Male',
      lastVisit: '2025-03-15'
    },
    {
      id: 'P002',
      name: 'Aditya Dubey',
      aadharNumber: '5678 9012 3456',
      age: 42,
      gender: 'Male',
      lastVisit: '2025-03-10'
    },
    {
      id: 'P003',
      name: 'Nidhi Tripathi',
      aadharNumber: '7890 1234 5678',
      age: 29,
      gender: 'Female',
      lastVisit: '2025-03-18'
    },
    {
      id: 'P004',
      name: 'Bhoomi Pandey',
      aadharNumber: '8901 2345 6789',
      age: 45,
      gender: 'Female',
      lastVisit: '2025-03-05'
    }
  ];

  // Filter patients based on search query
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.aadharNumber.replace(/\s/g, '').includes(searchQuery.replace(/\s/g, ''))
  );

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setUseDirectInput(false);
  };

  const handleDirectAadharSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!directAadharInput || directAadharInput.replace(/\s/g, '').length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhar number');
      return;
    }
    
    if (!patientName.trim()) {
      toast.error('Please enter patient name');
      return;
    }
    
    // Create a temporary patient object
    const tempPatient: Patient = {
      id: `TEMP${Date.now()}`,
      name: patientName,
      aadharNumber: directAadharInput,
      age: 0, // Unknown
      gender: 'Unknown',
      lastVisit: new Date().toISOString()
    };
    
    setSelectedPatient(tempPatient);
    toast.success(`Ready to record prescription for Aadhar: ${directAadharInput}`);
  };

  // Function to start recording
  const startRecording = async () => {
    try {
      // Reset previous recording data
      setAudioChunks([]);
      setAudioBlob(null);
      setAudioData(null);
      setAudioURL(null);
      setTranscription('');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create a new MediaRecorder instance
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      setMediaRecorder(recorder);
      
      // Set up event handlers
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setAudioChunks((chunks) => [...chunks, e.data]);
        }
      };
      
      recorder.onstop = async () => {
        // Create a blob from the audio chunks
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        // Create a URL for the audio blob
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        
        // Convert blob to base64 for storage
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
          const base64Audio = base64data.split(',')[1];
          setAudioData(base64Audio);
          
          // In a real app, you would send the audio to a speech-to-text service
          // For now, let the doctor manually enter the transcription
          toast.success('Recording complete! Please enter the prescription text below.');
        };
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      recorder.start(200); // Collect data every 200ms
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerInterval.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      
      // Clear timer
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    }
  };

  const sendPrescription = async () => {
    try {
      if (!selectedPatient) {
        toast.error('Please select a patient or enter patient details');
        return;
      }
      
      if (!transcription) {
        toast.error('Please record a prescription first');
        return;
      }
      
      setSending(true);
      
      // Create prescription data
      const prescriptionData = {
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientAadhar: selectedPatient.aadharNumber.replace(/\s/g, ''), // Remove spaces
        doctorName: 'Dr. John Doe', // In a real app, get from user profile
        department: 'General Medicine', // In a real app, get from user profile
        date: new Date().toISOString(),
        transcription: transcription,
        audioData: audioData // Send the base64 encoded audio data
      };
      
      // Send to API
      const response = await fetch('/api/voice-prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prescriptionData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send prescription');
      }
      
      const result = await response.json();
      
      // Reset form
      setSelectedPatient(null);
      setTranscription('');
      setAudioBlob(null);
      setAudioData(null);
      setAudioURL(null);
      setAudioChunks([]);
      
      // Show success message
      toast.success('Prescription sent successfully!');
      
      // Add to sent prescriptions
      setSentPrescriptions([
        {
          id: result.prescription.id,
          patientName: selectedPatient.name,
          patientAadhar: selectedPatient.aadharNumber,
          date: new Date().toISOString(),
          transcription: transcription
        },
        ...sentPrescriptions
      ]);
      
    } catch (error) {
      console.error('Error sending prescription:', error);
      toast.error('Failed to send prescription');
    } finally {
      setSending(false);
    }
  };

  const handleSearchPatients = () => {
    setIsSearching(true);
    // Simulate API call delay
    setTimeout(() => {
      setIsSearching(false);
    }, 800);
  };

  useEffect(() => {
    // Fetch previously sent prescriptions
    const fetchSentPrescriptions = async () => {
      try {
        const response = await fetch('/api/voice-prescriptions');
        if (!response.ok) {
          throw new Error('Failed to fetch prescriptions');
        }
        
        const data = await response.json();
        setSentPrescriptions(data.prescriptions || []);
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
      }
    };
    
    fetchSentPrescriptions();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <FaPrescription className="mr-2 text-blue-600" />
          Voice Prescription System
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Patient Selection or Direct Aadhar Input */}
          <div className="md:col-span-1 bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium flex items-center">
                {useDirectInput ? (
                  <>
                    <FaIdCard className="mr-2 text-blue-600" />
                    Enter Aadhar
                  </>
                ) : (
                  <>
                    <FaUser className="mr-2 text-blue-600" />
                    Select Patient
                  </>
                )}
              </h2>
              <button 
                onClick={() => setUseDirectInput(!useDirectInput)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {useDirectInput ? "Select from list" : "Enter Aadhar directly"}
              </button>
            </div>
            
            {useDirectInput ? (
              <form onSubmit={handleDirectAadharSubmit} className="space-y-4">
                <div>
                  <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="aadharNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Aadhar Number
                  </label>
                  <input
                    type="text"
                    id="aadharNumber"
                    value={directAadharInput}
                    onChange={(e) => {
                      // Format as XXXX XXXX XXXX
                      const value = e.target.value.replace(/\D/g, '');
                      const formattedValue = value
                        .replace(/(\d{4})(?=\d)/g, '$1 ')
                        .trim()
                        .substring(0, 14); // 12 digits + 2 spaces
                      setDirectAadharInput(formattedValue);
                    }}
                    placeholder="XXXX XXXX XXXX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    maxLength={14}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Confirm Patient
                </button>
              </form>
            ) : (
              <>
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name or Aadhar number"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchPatients()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSearchPatients}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600"
                    >
                      {isSearching ? (
                        <div className="w-5 h-5 border-t-2 border-blue-600 rounded-full animate-spin"></div>
                      ) : (
                        <FaSearch className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredPatients.length > 0 ? (
                    filteredPatients.map(patient => (
                      <div
                        key={patient.id}
                        onClick={() => handlePatientSelect(patient)}
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          selectedPatient?.id === patient.id
                            ? 'bg-blue-100 border border-blue-300'
                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        <div className="font-medium">{patient.name}</div>
                        <div className="text-sm text-gray-600">Aadhar: {patient.aadharNumber}</div>
                        <div className="text-sm text-gray-600">
                          {patient.age} years, {patient.gender}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      {searchQuery ? 'No patients found' : 'Select a patient to continue'}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Middle Column - Voice Recorder */}
          <div className="md:col-span-2">
            {selectedPatient ? (
              <div>
                <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
                  <h3 className="font-medium text-blue-800">Selected Patient</h3>
                  <div className="mt-2">
                    <div className="font-medium">{selectedPatient.name}</div>
                    <div className="text-sm">
                      {selectedPatient.gender !== 'Unknown' ? `${selectedPatient.age} years, ${selectedPatient.gender}` : ''}
                    </div>
                    <div className="text-sm">Aadhar: {selectedPatient.aadharNumber}</div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <FaMicrophone className="mr-2 text-blue-600" />
                    Record Voice Prescription
                  </h2>
                  
                  <div className="flex flex-col space-y-4">
                    {/* Recording Controls */}
                    <div className="flex items-center justify-center space-x-4">
                      {!isRecording ? (
                        <button
                          onClick={startRecording}
                          disabled={!selectedPatient}
                          className="flex items-center justify-center w-16 h-16 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-300"
                        >
                          <FaMicrophone size={24} />
                        </button>
                      ) : (
                        <button
                          onClick={stopRecording}
                          className="flex items-center justify-center w-16 h-16 bg-gray-700 text-white rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700"
                        >
                          <FaStop size={24} />
                        </button>
                      )}
                    </div>
                    
                    {/* Recording Status */}
                    <div className="text-center">
                      {isRecording ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                            <span className="font-medium">Recording...</span>
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:
                            {(recordingTime % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                      ) : audioURL ? (
                        <div className="flex flex-col items-center">
                          <span className="font-medium text-green-600 mb-2">Recording Complete</span>
                          <audio src={audioURL} controls className="w-full max-w-md"></audio>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {selectedPatient 
                            ? "Click the microphone to start recording" 
                            : "Select a patient to enable recording"}
                        </span>
                      )}
                    </div>
                    
                    {/* Manual Transcription Input */}
                    {audioURL && (
                      <div className="mt-4">
                        <h3 className="font-medium text-gray-700 mb-2">Enter Prescription Text:</h3>
                        <textarea
                          value={transcription}
                          onChange={(e) => setTranscription(e.target.value)}
                          placeholder="Type the prescription details here..."
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={4}
                        />
                      </div>
                    )}
                    
                    {/* Send Button */}
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={sendPrescription}
                        disabled={!audioURL || !transcription || sending}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 flex items-center"
                      >
                        {sending ? (
                          <>
                            <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <FaPaperPlane className="mr-2" />
                            Send Prescription
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Sent Prescriptions History */}
                {sentPrescriptions.length > 0 && (
                  <div className="mt-6 bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      <FaHistory className="mr-2 text-blue-600" />
                      Recent Prescriptions
                    </h3>
                    
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {sentPrescriptions.map((prescription, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                          <div className="flex justify-between">
                            <div>
                              <div className="font-medium">{prescription.patientName}</div>
                              <div className="text-sm text-gray-600">
                                {new Date(prescription.date).toLocaleString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                Aadhar: {prescription.patientAadhar.replace(/(\d{4})(?=\d)/g, '$1 ')}
                              </div>
                            </div>
                            <div className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              {prescription.status || 'sent'}
                            </div>
                          </div>
                          
                          <div className="mt-2 text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                            {prescription.transcription}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <FaUserMd className="mx-auto text-gray-400 text-5xl mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">No Patient Selected</h3>
                <p className="text-gray-600 mb-4">
                  {useDirectInput 
                    ? 'Please enter an Aadhar number to record a voice prescription.'
                    : 'Please select a patient from the list to record a voice prescription.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VoicePrescriptionPage;
