import React, { useState, useEffect, useRef } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaSpinner, FaStopCircle, FaPause, FaPlay } from 'react-icons/fa';
import { motion } from 'framer-motion';

// TypeScript definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// Medical terminology for better recognition
const MEDICAL_TERMS = [
  // Common diagnoses
  "hypertension", "diabetes mellitus", "asthma", "COPD", "arthritis", 
  "hypothyroidism", "hyperthyroidism", "anemia", "gastritis", "tuberculosis",
  
  // Indian-specific conditions and Ayurvedic terms
  "dengue fever", "malaria", "chikungunya", "typhoid", "jaundice",
  "vata dosha", "pitta dosha", "kapha dosha", "ama", "dhatus",
  
  // Medications - Western
  "paracetamol", "ibuprofen", "metformin", "amlodipine", "atorvastatin",
  "omeprazole", "amoxicillin", "azithromycin", "cetirizine", "montelukast",
  
  // Medications - Ayurvedic
  "ashwagandha", "triphala", "brahmi", "tulsi", "turmeric",
  "neem", "amla", "shatavari", "guduchi", "ginger",
  
  // Common medical phrases
  "twice daily", "three times a day", "before meals", "after meals",
  "with food", "on empty stomach", "as needed", "for pain", "for fever",
  
  // Examination terms
  "blood pressure", "heart rate", "respiratory rate", "temperature",
  "oxygen saturation", "auscultation", "percussion", "palpation"
];

// Section templates for structured medical records
const RECORD_SECTIONS = [
  { name: "chief complaint", keywords: ["complains of", "came with", "presenting with", "chief complaint"] },
  { name: "history", keywords: ["history", "past medical history", "previous", "earlier", "before"] },
  { name: "examination", keywords: ["examination", "exam", "vital signs", "vitals", "observed", "found"] },
  { name: "diagnosis", keywords: ["diagnosis", "impression", "assessment", "diagnosed with"] },
  { name: "plan", keywords: ["plan", "treatment", "advised", "prescribed", "recommended"] },
  { name: "medication", keywords: ["medication", "medicine", "drug", "tablet", "capsule", "syrup", "prescription"] },
  { name: "follow-up", keywords: ["follow up", "review", "come back", "return", "next visit"] }
];

interface MedicalVoiceRecognitionProps {
  onTranscriptionComplete: (structuredData: Record<string, string>) => void;
  patientInfo?: {
    name: string;
    age: number;
    gender: string;
    aadharNumber: string;
  };
  initialSections?: Record<string, string>;
}

const MedicalVoiceRecognition: React.FC<MedicalVoiceRecognitionProps> = ({
  onTranscriptionComplete,
  patientInfo,
  initialSections = {}
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [recordedTime, setRecordedTime] = useState(0);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, string>>(initialSections);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize timer for recording duration
  useEffect(() => {
    if (isListening && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordedTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isListening, isPaused]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
  // Detect section based on keywords
  const detectSection = (text: string): string | null => {
    const lowercaseText = text.toLowerCase();
    
    for (const section of RECORD_SECTIONS) {
      for (const keyword of section.keywords) {
        if (lowercaseText.includes(keyword.toLowerCase())) {
          return section.name;
        }
      }
    }
    
    return currentSection; // Keep current section if no new section detected
  };
  
  // Function to structure the transcript into different sections
  const structureTranscript = (text: string): Record<string, string> => {
    // If we already have sections, use those instead of restructuring
    if (Object.keys(sections).length > 0) {
      return sections;
    }
    
    // Otherwise, try to structure the text
    const result: Record<string, string> = {};
    
    // Split by common section markers
    const lines = text.split('\n');
    let currentSection = 'notes';
    
    lines.forEach(line => {
      const trimmedLine = line.trim().toLowerCase();
      
      // Check if this line is a section header
      if (trimmedLine.startsWith('history') || trimmedLine.includes('history of present illness')) {
        currentSection = 'history';
      } else if (trimmedLine.startsWith('examination') || trimmedLine.includes('physical examination')) {
        currentSection = 'examination';
      } else if (trimmedLine.startsWith('diagnosis') || trimmedLine.includes('impression')) {
        currentSection = 'diagnosis';
      } else if (trimmedLine.startsWith('plan') || trimmedLine.includes('treatment plan')) {
        currentSection = 'plan';
      } else if (trimmedLine.startsWith('medication') || trimmedLine.includes('prescribe') || trimmedLine.includes('prescription')) {
        currentSection = 'medication';
      } else if (line.trim()) {
        // If not a section header and not empty, add to current section
        result[currentSection] = (result[currentSection] || '') + line + '\n';
      }
    });
    
    return result;
  };
  
  const startSpeechRecognition = () => {
    setError(null);
    setProcessing(true);
    
    try {
      // Initialize the SpeechRecognition object
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognitionClass) {
        throw new Error('Speech recognition is not supported in this browser.');
      }
      
      // Always create a new instance to avoid issues with reusing the same instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error('Error aborting previous recognition instance:', e);
        }
      }
      
      const recognition = new SpeechRecognitionClass();
      
      recognition.lang = 'en-IN'; // Set language to English (India)
      recognition.continuous = true; // Enable continuous recognition for longer dictations
      recognition.interimResults = true; // Get interim results for real-time feedback
      
      recognition.onstart = () => {
        console.log('Medical speech recognition started');
        setIsListening(true);
        setIsPaused(false);
        setTranscript('Listening...');
      };
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        // Process final transcript
        if (finalTranscript) {
          // Detect section from the transcript
          const detectedSection = detectSection(finalTranscript);
          if (detectedSection && detectedSection !== currentSection) {
            setCurrentSection(detectedSection);
            console.log(`Detected new section: ${detectedSection}`);
          }
          
          // Update sections with the new transcript
          setSections(prev => {
            const section = detectedSection || currentSection || "notes";
            return {
              ...prev,
              [section]: ((prev[section] || '') + ' ' + finalTranscript).trim()
            };
          });
        }
        
        // Show the current transcript (both final and interim)
        setTranscript(finalTranscript + interimTranscript || 'Listening...');
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setError(`Error occurred in recognition: ${event.error}`);
        setProcessing(false);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        
        // Only stop the timer if we're not paused (as we'll restart recognition when unpausing)
        if (!isPaused) {
          setProcessing(false);
          setIsListening(false);
          
          // Complete the transcription process
          const structuredData = structureTranscript(transcript);
          onTranscriptionComplete(structuredData);
        }
      };
      
      recognitionRef.current = recognition;
      recognition.start();
      console.log('Medical speech recognition starting...');
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError(`Failed to start speech recognition: ${err instanceof Error ? err.message : String(err)}`);
      setProcessing(false);
      setIsListening(false);
    }
  };
  
  const pauseRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsPaused(true);
    }
  };
  
  const resumeRecognition = () => {
    if (isPaused) {
      startSpeechRecognition();
      setIsPaused(false);
    }
  };
  
  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setIsPaused(false);
    setProcessing(false);
    
    // Complete the transcription process
    const structuredData = structureTranscript(transcript);
    onTranscriptionComplete(structuredData);
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="w-full bg-white rounded-lg shadow-md p-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Medical Voice Recognition</h3>
        {patientInfo && (
          <div className="text-sm text-gray-600">
            Patient: {patientInfo.name}, {patientInfo.age} years, {patientInfo.gender}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <motion.button
            type="button"
            onClick={isListening ? (isPaused ? resumeRecognition : pauseRecognition) : startSpeechRecognition}
            className={`flex items-center justify-center p-3 rounded-full shadow-md ${
              isListening 
                ? (isPaused ? 'bg-yellow-500' : 'bg-red-500') 
                : 'bg-blue-500'
            } text-white hover:opacity-90`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isListening ? (isPaused ? "Resume recording" : "Pause recording") : "Start recording"}
          >
            {processing && !isPaused ? (
              <FaSpinner className="w-5 h-5 animate-spin" />
            ) : isPaused ? (
              <FaPlay className="w-5 h-5" />
            ) : isListening ? (
              <FaPause className="w-5 h-5" />
            ) : (
              <FaMicrophone className="w-5 h-5" />
            )}
          </motion.button>
          
          {isListening && (
            <motion.button
              type="button"
              onClick={stopRecognition}
              className="flex items-center justify-center p-3 rounded-full shadow-md bg-gray-700 text-white hover:bg-gray-800"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Stop recording"
            >
              <FaStopCircle className="w-5 h-5" />
            </motion.button>
          )}
        </div>
        
        <div className="flex items-center">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isListening 
              ? (isPaused ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800 animate-pulse') 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isListening 
              ? (isPaused ? 'Paused' : 'Recording...') 
              : 'Ready'
            }
          </div>
          <div className="ml-2 text-sm font-mono text-gray-600">
            {formatTime(recordedTime)}
          </div>
        </div>
      </div>
      
      {currentSection && (
        <div className="mb-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
            Current section: {currentSection}
          </span>
        </div>
      )}
      
      <div className="mb-4">
        <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-700 min-h-[100px] max-h-[200px] overflow-y-auto">
          {transcript || 'Click the microphone button to start recording...'}
          {isListening && !isPaused && (
            <span className="inline-block w-1 h-4 ml-1 bg-blue-500 animate-pulse"></span>
          )}
        </div>
      </div>
      
      {Object.keys(sections).length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Structured Record</h4>
          <div className="space-y-2">
            {Object.entries(sections).map(([section, content]) => (
              <div key={section} className="p-2 bg-gray-100 rounded-md">
                <div className="text-xs font-medium text-gray-600 uppercase mb-1">{section}</div>
                <div className="text-sm text-gray-800">{content}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {error && (
        <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            // Make sure we have some content in the sections
            if (Object.keys(sections).length === 0 && transcript.trim()) {
              // If no sections were detected but we have transcript, structure it now
              const structuredData = structureTranscript(transcript);
              console.log("Structured data from transcript:", structuredData);
              setSections(structuredData);
              
              // Use timeout to ensure state is updated before calling the callback
              setTimeout(() => {
                console.log("Sending structured data to parent:", structuredData);
                onTranscriptionComplete(structuredData);
              }, 100);
            } else {
              // Use the already structured sections
              console.log("Sections being sent to parent:", sections);
              
              // Check if there's any medication-related content
              const hasMedicationContent = Object.entries(sections).some(([section, content]) => {
                const lowerContent = content.toLowerCase();
                return (
                  section === 'medication' || 
                  section === 'prescriptions' || 
                  section === 'plan' || 
                  section === 'treatment' ||
                  lowerContent.includes('prescribe') ||
                  lowerContent.includes('medication') ||
                  lowerContent.includes('tablet') ||
                  lowerContent.includes('capsule') ||
                  lowerContent.includes('syrup') ||
                  lowerContent.includes('mg') ||
                  lowerContent.includes('ml') ||
                  lowerContent.includes('dose') ||
                  lowerContent.includes('daily') ||
                  lowerContent.includes('times a day') ||
                  lowerContent.includes('every') ||
                  lowerContent.includes('take')
                );
              });
              
              console.log("Contains medication content:", hasMedicationContent);
              
              // If no medication content is found, add a sample prescription section for testing
              if (!hasMedicationContent && !sections.medication && !sections.prescriptions) {
                // For testing only - add this to your voice input instead
                console.log("No medication content found - you need to mention prescriptions in your voice input");
              }
              
              onTranscriptionComplete(sections);
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Complete Record
        </button>
      </div>
    </div>
  );
};

export default MedicalVoiceRecognition;
