'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  trend: 'up' | 'down' | 'stable';
  status: 'normal' | 'warning' | 'critical';
}

interface Prediction {
  condition: string;
  probability: number;
  timeframe: string;
  preventionSteps: string[];
  confidence: number;
}

interface Recommendation {
  category: 'lifestyle' | 'nutrition' | 'medication' | 'activity';
  title: string;
  description: string;
  impact: number; // 0-100 scale of predicted positive impact
  evidence: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
}

export default function DigitalTwinPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [aadharNumber, setAadharNumber] = useState('');
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'short' | 'medium' | 'long'>('medium');
  const [twinScore, setTwinScore] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);

  useEffect(() => {
    // Get Aadhar number from local storage
    const storedAadhar = localStorage.getItem('aadharNumber');
    if (storedAadhar) {
      setAadharNumber(storedAadhar);
      // Load initial data
      loadMockData(storedAadhar);
    } else {
      router.push('/patient/login');
    }
  }, [router]);

  // This function simulates loading data from the blockchain/backend
  const loadMockData = (patientAadhar: string) => {
    // In a real implementation, this would fetch data from your blockchain or backend
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      // Mock health metrics
      const mockMetrics: HealthMetric[] = [
        { name: 'Blood Pressure (Systolic)', value: 125, unit: 'mmHg', timestamp: new Date(), trend: 'stable', status: 'normal' },
        { name: 'Blood Pressure (Diastolic)', value: 82, unit: 'mmHg', timestamp: new Date(), trend: 'up', status: 'warning' },
        { name: 'Heart Rate', value: 72, unit: 'bpm', timestamp: new Date(), trend: 'stable', status: 'normal' },
        { name: 'Blood Glucose', value: 105, unit: 'mg/dL', timestamp: new Date(), trend: 'down', status: 'normal' },
        { name: 'Body Temperature', value: 98.6, unit: '°F', timestamp: new Date(), trend: 'stable', status: 'normal' },
        { name: 'Oxygen Saturation', value: 97, unit: '%', timestamp: new Date(), trend: 'stable', status: 'normal' },
        { name: 'BMI', value: 24.5, unit: 'kg/m²', timestamp: new Date(), trend: 'stable', status: 'normal' },
      ];
      
      setHealthMetrics(mockMetrics);
      setTwinScore(85); // Initial health score
      setLoading(false);
    }, 1500);
  };

  const runDigitalTwinAnalysis = () => {
    setRunningAnalysis(true);
    
    // Simulate AI analysis delay
    setTimeout(() => {
      // Generate mock predictions based on health metrics
      const mockPredictions: Prediction[] = [
        {
          condition: 'Hypertension',
          probability: 0.32,
          timeframe: '5-10 years',
          preventionSteps: [
            'Reduce sodium intake',
            'Regular cardiovascular exercise',
            'Maintain healthy weight',
            'Limit alcohol consumption'
          ],
          confidence: 0.85
        },
        {
          condition: 'Type 2 Diabetes',
          probability: 0.18,
          timeframe: '7-12 years',
          preventionSteps: [
            'Maintain healthy weight',
            'Regular physical activity',
            'Balanced diet with limited refined carbs',
            'Regular health screenings'
          ],
          confidence: 0.78
        },
        {
          condition: 'Cardiovascular Disease',
          probability: 0.22,
          timeframe: '10-15 years',
          preventionSteps: [
            'Regular exercise',
            'Heart-healthy diet',
            'Avoid smoking',
            'Manage stress levels',
            'Regular check-ups'
          ],
          confidence: 0.82
        }
      ];
      
      // Generate personalized recommendations
      const mockRecommendations: Recommendation[] = [
        {
          category: 'lifestyle',
          title: 'Increase daily steps',
          description: 'Aim for 8,000-10,000 steps daily to improve cardiovascular health and reduce blood pressure.',
          impact: 75,
          evidence: 'Based on your current activity level and slight elevation in diastolic blood pressure.',
          difficulty: 'moderate'
        },
        {
          category: 'nutrition',
          title: 'Reduce sodium intake',
          description: 'Limit processed foods and add less salt to meals to help manage your blood pressure.',
          impact: 82,
          evidence: 'Your diastolic blood pressure shows an upward trend that could be mitigated with dietary changes.',
          difficulty: 'moderate'
        },
        {
          category: 'activity',
          title: 'Add strength training',
          description: 'Incorporate 2-3 strength training sessions weekly to improve metabolic health.',
          impact: 68,
          evidence: 'Would help maintain healthy glucose levels and reduce long-term diabetes risk.',
          difficulty: 'moderate'
        },
        {
          category: 'lifestyle',
          title: 'Improve sleep quality',
          description: 'Aim for 7-8 hours of quality sleep to help regulate blood pressure and stress hormones.',
          impact: 70,
          evidence: 'Based on correlation between sleep patterns and cardiovascular health metrics.',
          difficulty: 'easy'
        },
        {
          category: 'nutrition',
          title: 'Increase fiber intake',
          description: 'Add more whole grains, fruits, and vegetables to support healthy blood glucose levels.',
          impact: 65,
          evidence: 'Would help maintain your already improving blood glucose levels.',
          difficulty: 'easy'
        }
      ];
      
      setPredictions(mockPredictions);
      setRecommendations(mockRecommendations);
      setAnalysisComplete(true);
      setRunningAnalysis(false);
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600';
      case 'warning': return 'text-amber-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      case 'stable': return '→';
      default: return '-';
    }
  };

  const getTrendColor = (trend: string, status: string) => {
    if (status === 'normal') {
      return trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-blue-600';
    }
    return getStatusColor(status);
  };

  const getImpactColor = (impact: number) => {
    if (impact >= 80) return 'text-green-600';
    if (impact >= 60) return 'text-blue-600';
    if (impact >= 40) return 'text-amber-600';
    return 'text-gray-600';
  };

  const getProbabilityColor = (probability: number) => {
    if (probability < 0.2) return 'text-green-600';
    if (probability < 0.4) return 'text-amber-600';
    if (probability < 0.6) return 'text-orange-600';
    return 'text-red-600';
  };

  const filterPredictionsByTimeframe = () => {
    // In a real implementation, this would filter based on actual timeframe data
    if (selectedTimeframe === 'short') {
      return predictions.filter(p => p.probability > 0.3);
    } else if (selectedTimeframe === 'long') {
      return predictions;
    } else {
      // medium timeframe (default)
      return predictions.filter(p => p.probability > 0.15);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <h2 className="mt-4 text-xl font-semibold text-gray-700">Loading your Digital Health Twin...</h2>
            <p className="mt-2 text-gray-500">Fetching your health data and generating insights</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Your Digital Health Twin</h1>
          <p className="mt-2 text-blue-100">AI-powered health simulation and prediction system</p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Health Twin Score */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="md:flex">
            <div className="p-8 md:w-1/3 bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center">
              <div className="relative">
                <svg className="w-48 h-48" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={twinScore > 80 ? '#10B981' : twinScore > 60 ? '#3B82F6' : twinScore > 40 ? '#F59E0B' : '#EF4444'}
                    strokeWidth="8"
                    strokeDasharray="283"
                    strokeDashoffset={283 - (283 * twinScore) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold text-gray-800">{twinScore}</span>
                  <span className="text-gray-500">Health Score</span>
                </div>
              </div>
              <p className="mt-4 text-center text-gray-600 max-w-xs">
                Your Health Twin Score represents an overall assessment of your current health status and future outlook.
              </p>
            </div>
            <div className="p-8 md:w-2/3">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Digital Twin Analysis</h2>
              <p className="text-gray-600 mb-6">
                Your Digital Health Twin uses advanced AI to analyze your health data, predict potential health risks, and provide personalized recommendations to improve your wellbeing.
              </p>
              
              {!analysisComplete ? (
                <button
                  onClick={runDigitalTwinAnalysis}
                  disabled={runningAnalysis}
                  className={`px-6 py-3 rounded-lg shadow-md text-white font-medium ${runningAnalysis ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                >
                  {runningAnalysis ? (
                    <>
                      <span className="inline-block mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Running Analysis...
                    </>
                  ) : (
                    'Run Comprehensive Analysis'
                  )}
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setSelectedTimeframe('short')}
                    className={`px-4 py-2 rounded-lg ${selectedTimeframe === 'short' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
                  >
                    Short-term
                  </button>
                  <button
                    onClick={() => setSelectedTimeframe('medium')}
                    className={`px-4 py-2 rounded-lg ${selectedTimeframe === 'medium' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
                  >
                    Medium-term
                  </button>
                  <button
                    onClick={() => setSelectedTimeframe('long')}
                    className={`px-4 py-2 rounded-lg ${selectedTimeframe === 'long' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
                  >
                    Long-term
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Health Metrics */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Current Health Metrics</h2>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {healthMetrics.map((metric, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-sm text-gray-900">{metric.name}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          {metric.value} {metric.unit}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={`font-medium ${getTrendColor(metric.trend, metric.status)}`}>
                            {getTrendIcon(metric.trend)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${metric.status === 'normal' ? 'bg-green-100 text-green-800' : metric.status === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                            {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Health Predictions */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Health Risk Predictions</h2>
            </div>
            <div className="p-6">
              {!analysisComplete ? (
                <div className="text-center py-8">
                  <div className="inline-block p-4 rounded-full bg-blue-50 mb-4">
                    <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Run Analysis to See Predictions</h3>
                  <p className="text-gray-500">Click the "Run Comprehensive Analysis" button to generate personalized health predictions.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filterPredictionsByTimeframe().length > 0 ? (
                    filterPredictionsByTimeframe().map((prediction, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-medium text-gray-900">{prediction.condition}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProbabilityColor(prediction.probability)} bg-opacity-10`}>
                            {(prediction.probability * 100).toFixed(1)}% Risk
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">Timeframe: {prediction.timeframe}</p>
                        <div className="mt-3">
                          <h4 className="text-sm font-medium text-gray-700">Prevention Steps:</h4>
                          <ul className="mt-1 text-sm text-gray-600 list-disc list-inside space-y-1">
                            {prediction.preventionSteps.map((step, stepIndex) => (
                              <li key={stepIndex}>{step}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-3 flex items-center">
                          <span className="text-xs text-gray-500">AI Confidence:</span>
                          <div className="ml-2 flex-1 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full" 
                              style={{ width: `${prediction.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-xs font-medium text-gray-700">{(prediction.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No significant health risks predicted for this timeframe.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personalized Recommendations */}
        {analysisComplete && (
          <div className="mt-8 bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Personalized Recommendations</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${recommendation.category === 'lifestyle' ? 'bg-purple-100' : recommendation.category === 'nutrition' ? 'bg-green-100' : recommendation.category === 'medication' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                        <span className={`text-lg ${recommendation.category === 'lifestyle' ? 'text-purple-600' : recommendation.category === 'nutrition' ? 'text-green-600' : recommendation.category === 'medication' ? 'text-blue-600' : 'text-amber-600'}`}>
                          {recommendation.category === 'lifestyle' ? '🧘' : recommendation.category === 'nutrition' ? '🥗' : recommendation.category === 'medication' ? '💊' : '🏃'}
                        </span>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-md font-medium text-gray-900">{recommendation.title}</h3>
                        <p className="text-xs text-gray-500 capitalize">{recommendation.category}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs text-gray-500">Predicted Impact:</span>
                        <span className={`ml-1 text-sm font-medium ${getImpactColor(recommendation.impact)}`}>{recommendation.impact}%</span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${recommendation.difficulty === 'easy' ? 'bg-green-100 text-green-800' : recommendation.difficulty === 'moderate' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                        {recommendation.difficulty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
          <p><strong>Disclaimer:</strong> The Digital Health Twin provides predictions and recommendations based on available data and AI analysis. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical concerns.</p>
        </div>
      </div>
    </div>
  );
}
