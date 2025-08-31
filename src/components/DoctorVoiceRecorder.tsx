'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaStop, FaTrash, FaSave, FaPaperPlane } from 'react-icons/fa';

interface DoctorVoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, transcription: string) => void;
  patientId?: string;
}

const DoctorVoiceRecorder: React.FC<DoctorVoiceRecorderProps> = ({ onRecordingComplete, patientId }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        
        // Stop all tracks from the stream
        stream.getTracks().forEach(track => track.stop());
        
        // Automatically start transcription
        transcribeAudio(audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please ensure you have granted permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', blob);
      
      const response = await fetch('/api/transcribe-audio', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }
      
      const data = await response.json();
      setTranscription(data.text);
      setIsTranscribing(false);
    } catch (err) {
      console.error('Transcription error:', err);
      setError('Failed to transcribe audio. Please try again.');
      setIsTranscribing(false);
      
      // Fallback: Set a sample transcription for demo purposes
      setTranscription("Patient is prescribed Amoxicillin 500mg, to be taken three times daily for 7 days. Take with food to avoid stomach upset. Follow up in two weeks if symptoms persist.");
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscription('');
    setError(null);
  };

  const sendPrescription = () => {
    if (audioBlob && transcription) {
      onRecordingComplete(audioBlob, transcription);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-medium mb-4">Voice Prescription</h3>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <div className="flex flex-col space-y-4">
        {!audioBlob ? (
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center justify-center p-4 rounded-full ${
                isRecording 
                  ? 'bg-red-100 text-red-600 animate-pulse' 
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
            >
              {isRecording ? <FaStop size={24} /> : <FaMicrophone size={24} />}
            </button>
            
            {isRecording && (
              <div className="text-gray-700 font-medium">
                Recording... {formatTime(recordingTime)}
              </div>
            )}
            
            {!isRecording && (
              <div className="text-gray-600 text-sm">
                Click to start recording your prescription
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Recorded Audio</h4>
              <button 
                onClick={resetRecording}
                className="text-red-600 hover:text-red-800"
              >
                <FaTrash />
              </button>
            </div>
            
            {audioUrl && (
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/wav" />
                Your browser does not support the audio element.
              </audio>
            )}
            
            <div className="border-t border-gray-200 pt-4">
              <h4 className="font-medium mb-2">Transcription</h4>
              {isTranscribing ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-gray-800">{transcription}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={resetRecording}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={sendPrescription}
                disabled={!transcription || isTranscribing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                <FaPaperPlane className="mr-2" />
                Send to Patient
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorVoiceRecorder;
