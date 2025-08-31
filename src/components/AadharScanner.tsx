import React, { useState, useRef, useEffect } from 'react';
import { extractAadharNumber } from '@/utils/aadharScanner';
import { motion } from 'framer-motion';
import { FaCamera, FaSpinner, FaUpload, FaCheck, FaTimes, FaSync } from 'react-icons/fa';

interface AadharScannerProps {
  onScanComplete: (aadharNumber: string) => void;
}

const AadharScanner: React.FC<AadharScannerProps> = ({ onScanComplete }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processImage(file);
  };

  const processImage = async (file: File) => {
    try {
      // Reset states
      setError(null);
      setScanning(true);
      setExtractionProgress(0);
      
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      
      // Extract Aadhar number with progress tracking
      const progressTracker = (info: any) => {
        if (info.status === 'recognizing text') {
          setExtractionProgress(info.progress * 100);
        }
      };
      
      const aadharNumber = await extractAadharNumber(file);
      
      if (aadharNumber) {
        setExtractionProgress(100);
        setTimeout(() => {
          onScanComplete(aadharNumber);
        }, 500);
      } else {
        setError('Could not detect Aadhar number. Please try again with a clearer image.');
      }
    } catch (err) {
      setError('An error occurred while scanning. Please try again.');
      console.error('Aadhar scanning error:', err);
    } finally {
      setScanning(false);
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      
      // Stop any existing stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode }
      });
      
      // Set the stream to the video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraStream(stream);
      setShowCamera(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError('Could not access camera. Please check permissions or try uploading an image instead.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the video frame to the canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (blob) {
          // Stop the camera
          stopCamera();
          
          // Process the captured image
          await processImage(new File([blob], 'aadhar-capture.jpg', { type: 'image/jpeg' }));
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const switchCamera = () => {
    // Toggle between front and back camera
    setFacingMode(prevMode => prevMode === 'environment' ? 'user' : 'environment');
    
    // Restart camera with new facing mode
    if (showCamera) {
      startCamera();
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="flex flex-col items-center">
        {/* Live camera view */}
        {showCamera && (
          <div className="relative w-full max-w-md mb-4 rounded-lg overflow-hidden shadow-md bg-black">
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              className="w-full h-auto"
            />
            
            {/* Camera UI overlay */}
            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-white opacity-70">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 border-2 border-white rounded-lg">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500"></div>
              </div>
            </div>
            
            {/* Camera controls */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
              <motion.button
                onClick={stopCamera}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 bg-red-500 rounded-full text-white shadow-lg"
              >
                <FaTimes />
              </motion.button>
              
              <motion.button
                onClick={captureImage}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-4 bg-white rounded-full shadow-lg"
              >
                <div className="w-12 h-12 rounded-full border-4 border-blue-500"></div>
              </motion.button>
              
              <motion.button
                onClick={switchCamera}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 bg-blue-500 rounded-full text-white shadow-lg relative"
              >
                <FaSync />
                <span className="absolute -top-1 -right-1 bg-white text-xs text-blue-500 rounded-full px-1 font-bold">
                  {facingMode === 'environment' ? 'Back' : 'Front'}
                </span>
              </motion.button>
            </div>
          </div>
        )}
        
        {/* Preview area (only shown when not in camera mode) */}
        {!showCamera && preview && (
          <div className="relative w-full max-w-md mb-4 rounded-lg overflow-hidden shadow-md">
            <img 
              src={preview} 
              alt="Aadhar card preview" 
              className="w-full h-auto object-contain"
            />
            
            {/* Scanning overlay */}
            {scanning && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                <FaSpinner className="animate-spin text-white text-2xl mb-2" />
                <div className="w-3/4 bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${extractionProgress}%` }}
                  ></div>
                </div>
                <p className="text-white mt-2">Extracting Aadhar Number...</p>
              </div>
            )}
            
            {/* Success indicator */}
            {!scanning && extractionProgress === 100 && (
              <div className="absolute top-2 right-2 bg-green-500 text-white p-2 rounded-full">
                <FaCheck />
              </div>
            )}
          </div>
        )}
        
        {/* Camera error message */}
        {cameraError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {cameraError}
          </div>
        )}
        
        {/* Action buttons (only shown when not in camera mode) */}
        {!showCamera && (
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <motion.button
              type="button"
              onClick={startCamera}
              disabled={scanning}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-white ${
                scanning ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              <FaCamera className="text-lg" />
              <span>Open Camera</span>
            </motion.button>
            
            <motion.button
              type="button"
              onClick={triggerFileInput}
              disabled={scanning}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md ${
                scanning ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              } transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2`}
            >
              <FaUpload />
              <span>Upload Image</span>
            </motion.button>
          </div>
        )}
        
        {/* Error message */}
        {error && !showCamera && (
          <div className="mt-3 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {/* Instructions */}
        {!showCamera && !preview && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            <p>Position your Aadhar card within the frame and ensure good lighting for best results.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AadharScanner;
