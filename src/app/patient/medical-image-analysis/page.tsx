'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaSpinner, FaExclamationTriangle, FaUpload, FaArrowRight, FaCamera, FaImage } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';

interface AnalysisResult {
  analysis: string;
  imageProcessed: boolean;
  disclaimer: string;
  error?: string; // Add error property to AnalysisResult interface
}

export default function MedicalImageAnalysisPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPEG, PNG, etc.)');
        return;
      }
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedImage) {
      setError('Please select an image to analyze');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      if (description) {
        formData.append('description', description);
      }
      
      const response = await fetch('/api/medical-image-analysis', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const data = await response.json();
      setAnalysisResult(data.result);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setDescription('');
    setAnalysisResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-blue-800 mb-2">Medical Image Analysis</h1>
          <p className="text-gray-600 mb-6">
            Upload an image of a skin condition, wound, or other visible medical concern for AI-powered analysis.
            <span className="block mt-1 text-sm text-red-500 font-medium">
              Note: This is not a diagnosis. Always consult with a healthcare professional.
            </span>
          </p>
          
          {!analysisResult && (
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="mb-6">
                <div 
                  onClick={triggerFileInput}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    imagePreview ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {imagePreview ? (
                    <div className="flex flex-col items-center">
                      <div className="relative w-64 h-64 mb-4 overflow-hidden rounded-lg">
                        <Image 
                          src={imagePreview} 
                          alt="Selected image preview" 
                          fill
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetForm();
                        }}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Remove image
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <FaImage className="w-16 h-16 text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-2">Click to upload an image</p>
                      <p className="text-sm text-gray-400">JPEG, PNG, etc. (Max 5MB)</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your condition (e.g., 'Red rash on arm for 3 days, slightly itchy')"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center">
                  <FaExclamationTriangle className="mr-2" />
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoading || !selectedImage}
                className={`w-full font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center ${
                  !selectedImage 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Analyzing Image...
                  </>
                ) : (
                  <>
                    Analyze Image
                    <FaArrowRight className="ml-2" />
                  </>
                )}
              </button>
            </form>
          )}
          
          {analysisResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-50 rounded-lg p-6"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <FaCamera className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Analysis Results</h2>
              </div>
              
              {imagePreview && (
                <div className="mb-6 flex justify-center">
                  <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-gray-200">
                    <Image 
                      src={imagePreview} 
                      alt="Analyzed image" 
                      fill
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Assessment</h3>
                <div className="p-4 bg-white rounded-md border border-gray-200">
                  <div className="prose max-w-none">
                    {analysisResult.analysis.split('\n').map((paragraph, index) => (
                      <p key={index} className="mb-2">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Display API error information if available */}
              {analysisResult.error && (
                <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
                  <h4 className="font-semibold">Debug Information:</h4>
                  <p className="text-sm font-mono overflow-auto">{analysisResult.error}</p>
                </div>
              )}
              
              <div className="p-4 border-t border-gray-200 mt-4">
                <div className="flex items-start">
                  <FaExclamationTriangle className="text-yellow-500 mt-1 mr-2 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    <strong>Disclaimer:</strong> {analysisResult.disclaimer}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <Link href="/patient/health-advisor" className="text-blue-600 hover:text-blue-800 flex items-center">
                  <span>Talk to Health Advisor</span>
                  <FaArrowRight className="ml-1" />
                </Link>
                
                <button
                  onClick={resetForm}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  Analyze Another Image
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-blue-800 mb-4">About This Tool</h2>
          <div className="text-gray-600 space-y-3">
            <p>
              The Medical Image Analysis tool uses advanced AI to provide preliminary assessment of visible medical conditions.
              It can help with:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Skin conditions and rashes</li>
              <li>Wounds and injuries</li>
              <li>Eye conditions</li>
              <li>Visible infections</li>
              <li>Other external medical concerns</li>
            </ul>
            <p className="font-medium text-red-600">
              Important: This tool is for informational purposes only and does not replace professional medical advice, 
              diagnosis, or treatment. Always consult with a qualified healthcare provider for medical concerns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
