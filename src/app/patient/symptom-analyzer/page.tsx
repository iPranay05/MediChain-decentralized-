'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaSpinner, FaExclamationTriangle, FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';

interface SymptomAnalysis {
  possibleConditions: {
    name: string;
    probability: string;
    description: string;
  }[];
  severity: string;
  recommendedActions: string[];
  seekMedicalAttention: string;
  disclaimer: string;
  rawText?: string;
}

export default function SymptomAnalyzerPage() {
  const [symptoms, setSymptoms] = useState('');
  const [analysis, setAnalysis] = useState<SymptomAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!symptoms.trim()) {
      setError('Please describe your symptoms');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/symptom-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symptoms }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'mild': return 'text-green-500';
      case 'moderate': return 'text-yellow-500';
      case 'severe': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getProbabilityColor = (probability: string) => {
    switch (probability.toLowerCase()) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
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
          <h1 className="text-2xl md:text-3xl font-bold text-blue-800 mb-2">Symptom Analyzer</h1>
          <p className="text-gray-600 mb-6">
            Describe your symptoms in detail to get a preliminary analysis. Remember, this is not a diagnosis.
          </p>
          
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-4">
              <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-1">
                Describe your symptoms
              </label>
              <textarea
                id="symptoms"
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Example: I've had a headache for the past 3 days, along with a fever of 100°F. I also feel tired and have a sore throat."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
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
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze Symptoms
                  <FaArrowRight className="ml-2" />
                </>
              )}
            </button>
          </form>
        </motion.div>
        
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-blue-800 mb-4">Analysis Results</h2>
            
            {analysis.rawText ? (
              <div className="p-4 bg-gray-50 rounded-md mb-4">
                <pre className="whitespace-pre-wrap text-sm">{analysis.rawText}</pre>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Possible Conditions</h3>
                  {analysis.possibleConditions && analysis.possibleConditions.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {analysis.possibleConditions.map((condition, index) => (
                        <div key={index} className="border rounded-md p-3 bg-gray-50">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-medium">{condition.name}</h4>
                            <span className={`text-sm font-medium ${getProbabilityColor(condition.probability)}`}>
                              {condition.probability}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{condition.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No specific conditions identified.</p>
                  )}
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold">Severity</h3>
                    <span className={`ml-2 px-2 py-1 rounded-full text-sm font-medium ${getSeverityColor(analysis.severity)}`}>
                      {analysis.severity}
                    </span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Recommended Actions</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {analysis.recommendedActions && analysis.recommendedActions.map((action, index) => (
                      <li key={index} className="text-gray-700">{action}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">When to Seek Medical Attention</h3>
                  <div className="p-3 bg-red-50 text-red-700 rounded-md">
                    {analysis.seekMedicalAttention}
                  </div>
                </div>
              </>
            )}
            
            <div className="p-4 border-t border-gray-200 mt-4">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-yellow-500 mt-1 mr-2 flex-shrink-0" />
                <p className="text-sm text-gray-600">
                  <strong>Disclaimer:</strong> {analysis.disclaimer}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <Link href="/patient/health-advisor" className="text-blue-600 hover:text-blue-800 flex items-center">
                <span>Talk to Health Advisor</span>
                <FaArrowRight className="ml-1" />
              </Link>
              
              <button
                onClick={() => setAnalysis(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition duration-200"
              >
                Start New Analysis
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
