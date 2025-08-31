'use client';

import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { motion } from 'framer-motion';
import { AnalyticsDashboard, BarChart, LineChart, PieChart } from '@/components/AnalyticsVisualizations';
import {
  HealthMetric,
  TrendAnalysis,
  HealthAlert,
  HealthPattern,
  HealthRecommendation,
  analyzeTrend,
  checkForAlerts,
  recognizePatterns,
  generateRecommendations,
  HEALTH_THRESHOLDS
} from '@/utils/healthAnalytics';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [aadharNumber, setAadharNumber] = useState<string | null>(null);
  const [metricType, setMetricType] = useState<string>('diagnosis');
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [medication, setMedication] = useState<string | null>(null);
  const [dosage, setDosage] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<string>('daily');
  const [bloodPressure, setBloodPressure] = useState<string | null>(null);
  const [bloodSugar, setBloodSugar] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<string | null>(null);
  const [weight, setWeight] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null);
  const [healthAlerts, setHealthAlerts] = useState<HealthAlert[]>([]);
  const [patterns, setPatterns] = useState<HealthPattern[]>([]);
  const [recommendations, setRecommendations] = useState<HealthRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dashboard stats
  const [totalPatients, setTotalPatients] = useState<number>(0);
  const [totalPatientChange, setTotalPatientChange] = useState<string>('+0%');
  const [activeAppointments, setActiveAppointments] = useState<number>(0);
  const [activeAppointmentsChange, setActiveAppointmentsChange] = useState<string>('+0%');
  const [averageRating, setAverageRating] = useState<number>(0);
  const [averageRatingChange, setAverageRatingChange] = useState<string>('+0');
  const [responseTime, setResponseTime] = useState<number>(0);
  const [responseTimeChange, setResponseTimeChange] = useState<string>('0%');

  // Dashboard data states
  const [diagnosisDistribution, setDiagnosisDistribution] = useState<Record<string, number>>({});
  const [medicationDistribution, setMedicationDistribution] = useState<Record<string, number>>({});
  const [timelineData, setTimelineData] = useState<{ date: string; count: number }[]>([]);
  const [prescriptionCount, setPrescriptionCount] = useState<number>(0);

  // Patient analytics data
  const [patientAgeGroups, setPatientAgeGroups] = useState<Record<string, number>>({
    '0-18': 12,
    '19-35': 28,
    '36-50': 24,
    '51-65': 18,
    '65+': 8
  });
  const [patientGenderDistribution, setPatientGenderDistribution] = useState<Record<string, number>>({
    'Male': 45,
    'Female': 42,
    'Other': 3
  });
  const [patientLocationData, setPatientLocationData] = useState<Record<string, number>>({
    'Urban': 58,
    'Suburban': 24,
    'Rural': 8
  });

  // Appointment analytics data
  const [appointmentStatusData, setAppointmentStatusData] = useState<Record<string, number>>({
    'Scheduled': 24,
    'Completed': 38,
    'Cancelled': 6,
    'No-show': 2
  });
  const [appointmentTypeData, setAppointmentTypeData] = useState<Record<string, number>>({
    'Initial Consultation': 18,
    'Follow-up': 32,
    'Emergency': 8,
    'Specialist Referral': 12
  });
  const [appointmentTimeData, setAppointmentTimeData] = useState<{ x: string; y: number }[]>([
    { x: 'Mon', y: 12 },
    { x: 'Tue', y: 14 },
    { x: 'Wed', y: 16 },
    { x: 'Thu', y: 18 },
    { x: 'Fri', y: 10 },
    { x: 'Sat', y: 8 },
    { x: 'Sun', y: 2 }
  ]);

  // Revenue analytics data
  const [revenueByServiceData, setRevenueByServiceData] = useState<Record<string, number>>({
    'Consultations': 12500,
    'Prescriptions': 8200,
    'Lab Tests': 6800,
    'Procedures': 15400,
    'Follow-ups': 4200
  });
  const [revenueTimelineData, setRevenueTimelineData] = useState<{ x: string; y: number }[]>([
    { x: 'Jan', y: 8200 },
    { x: 'Feb', y: 9400 },
    { x: 'Mar', y: 11200 },
    { x: 'Apr', y: 10800 },
    { x: 'May', y: 12400 },
    { x: 'Jun', y: 14200 }
  ]);
  const [paymentMethodData, setPaymentMethodData] = useState<Record<string, number>>({
    'Insurance': 65,
    'Self-pay': 20,
    'Medicare/Medicaid': 12,
    'Other': 3
  });

  const metricTypes = [
    { value: 'diagnosis', label: 'Diagnosis' },
    { value: 'medication', label: 'Medication' },
    { value: 'dosage', label: 'Dosage' },
  ];

  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'twice_daily', label: 'Twice Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'as_needed', label: 'As Needed' }
  ];

  const { contract, connectWallet, isConnected } = useWeb3();

  const validateAadhar = (aadhar: string | null) => {
    if (!aadhar) return false;
    const aadharRegex = /^\d{12}$/;
    return aadharRegex.test(aadhar);
  };

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !isConnected) {
      await connectWallet();
      return;
    }

    if (!validateAadhar(aadharNumber)) {
      setError('Please enter a valid 12-digit Aadhar number');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Format health metrics into notes
      const healthDetails = {
        bloodPressure: bloodPressure ? `BP: ${bloodPressure}` : '',
        bloodSugar: bloodSugar ? `Sugar: ${bloodSugar} mg/dL` : '',
        temperature: temperature ? `Temp: ${temperature}°F` : '',
        weight: weight ? `Weight: ${weight} kg` : '',
        symptoms: symptoms ? `Symptoms: ${symptoms}` : '',
        frequency: `Frequency: ${frequency}`,
      };

      const formattedNotes = Object.values(healthDetails)
        .filter(detail => detail)
        .join(', ');

      // Add prescription with detailed health metrics
      const tx = await contract.addPrescription(
        aadharNumber as string,
        diagnosis as string,
        JSON.stringify([{
          medication: medication as string,
          dosage: dosage as string,
          frequency: "As needed",
          duration: "As directed",
          instructions: "Follow doctor's advice"
        }]),
        formattedNotes,
        "Self-Reported" // Hospital name for self-reported data
      );
      await tx.wait();
      
      setSuccess('Health record added successfully!');
      setError(null);
      await fetchHealthData();

      // Reset form
      setDiagnosis(null);
      setMedication(null);
      setDosage(null);
      setBloodPressure(null);
      setBloodSugar(null);
      setTemperature(null);
      setWeight(null);
      setSymptoms(null);
    } catch (err: any) {
      console.error('Error adding health record:', err);
      setError(err.message || 'Error adding health record');
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthData = async () => {
    if (!contract || !aadharNumber || !validateAadhar(aadharNumber)) return;

    try {
      setLoading(true);
      setError(null);

      // Get prescriptions instead of health metrics
      const prescriptionsData = await contract.getPrescriptions(aadharNumber as string);
      
      // Transform prescription data into health metrics format
      const transformedMetrics = prescriptionsData.map((prescription: any) => ({
        type: 'prescription',
        value: 0, // Since prescriptions don't have numeric values
        timestamp: prescription.timestamp.toNumber(),
        notes: `Medication: ${prescription.medication}, Dosage: ${prescription.dosage}, Diagnosis: ${prescription.diagnosis}, Notes: ${prescription.notes}`,
        hospital: prescription.hospital
      }));

      setHealthMetrics(transformedMetrics);
    } catch (err: any) {
      console.error('Error fetching health data:', err);
      setError(err.message || 'Error fetching health data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    if (!contract || !isConnected) return;

    try {
      setLoading(true);
      
      // Fetch all prescriptions to calculate total patients
      const allPrescriptions = await contract.getAllPrescriptions();
      
      // Calculate unique patients
      const uniquePatients = new Set();
      allPrescriptions.forEach((prescription: any) => {
        uniquePatients.add(prescription.patientAadhar);
      });
      
      const currentTotalPatients = uniquePatients.size;
      setTotalPatients(currentTotalPatients);
      
      // Calculate change (this would normally compare to previous period)
      // For demo purposes, we'll use a random positive change
      const patientChange = Math.floor(Math.random() * 15) + 1;
      setTotalPatientChange(`+${patientChange}%`);
      
      // Get active appointments (scheduled status)
      let scheduledAppointments = 0;
      let completedAppointments = 0;
      let totalResponseTime = 0;
      
      // In a real implementation, you would fetch all appointments
      // For demo purposes, we'll use the prescription count as a proxy
      scheduledAppointments = Math.floor(allPrescriptions.length * 0.4); // 40% of prescriptions
      completedAppointments = Math.floor(allPrescriptions.length * 0.6); // 60% of prescriptions
      
      setActiveAppointments(scheduledAppointments);
      
      // Calculate appointment change (random for demo)
      const appointmentChange = Math.floor(Math.random() * 10) + 1;
      setActiveAppointmentsChange(`+${appointmentChange}%`);
      
      // Calculate average rating (random for demo between 4.0 and 5.0)
      const rating = (4 + Math.random()).toFixed(1);
      setAverageRating(parseFloat(rating));
      
      // Rating change (random for demo)
      const ratingChange = (Math.random() * 0.5).toFixed(1);
      setAverageRatingChange(`+${ratingChange}`);
      
      // Calculate response time (random for demo between 10 and 30 minutes)
      const respTime = Math.floor(Math.random() * 20) + 10;
      setResponseTime(respTime);
      
      // Response time change (random for demo, negative is good)
      const respTimeChange = Math.floor(Math.random() * 30) + 5;
      setResponseTimeChange(`-${respTimeChange}%`);
      
      // Set total prescription count
      setPrescriptionCount(allPrescriptions.length);
      
      // Process prescriptions for visualization data
      const diagnoses: Record<string, number> = {};
      const medications: Record<string, number> = {};
      const timeline: Record<string, number> = {};
      
      allPrescriptions.forEach((prescription: any) => {
        // Process diagnosis
        if (prescription.diagnosis) {
          diagnoses[prescription.diagnosis] = (diagnoses[prescription.diagnosis] || 0) + 1;
        }
        
        // Process medication
        if (prescription.medicines) {
          medications[prescription.medicines] = (medications[prescription.medicines] || 0) + 1;
        }
        
        // Process timeline
        const date = new Date(prescription.timestamp.toNumber() * 1000);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        timeline[dateStr] = (timeline[dateStr] || 0) + 1;
      });
      
      // Prepare visualization data
      setDiagnosisDistribution(diagnoses);
      setMedicationDistribution(medications);
      
      // Convert timeline to array format
      const timelineArray = Object.entries(timeline).map(([date, count]) => ({
        date,
        count
      }));
      
      // Sort timeline by date
      timelineArray.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
      
      setTimelineData(timelineArray);
      
      // In a real implementation, we would fetch and process data for patient demographics,
      // appointment types, and revenue metrics from the blockchain
      // For now, we'll use the dummy data initialized in state variables
      
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeHealthData = () => {
    if (!healthMetrics.length) return;

    try {
      // Group prescriptions by diagnosis
      const prescriptionsByDiagnosis = healthMetrics.reduce((acc: Record<string, HealthMetric[]>, metric) => {
        try {
          const diagnosisPart = metric.notes.split(',')[0];
          if (!diagnosisPart) throw new Error('Invalid notes format');
          
          const diagnosisSplit = diagnosisPart.split(':');
          if (diagnosisSplit.length !== 2) throw new Error('Invalid diagnosis format');
          
          const diagnosis = diagnosisSplit[1].trim();
          if (!diagnosis) throw new Error('Empty diagnosis');
          
          if (!acc[diagnosis]) {
            acc[diagnosis] = [];
          }
          acc[diagnosis].push(metric);
          return acc;
        } catch (error) {
          console.error('Error processing metric:', error);
          return acc;
        }
      }, {});

      // Sort metrics by timestamp
      const sortedMetrics = [...healthMetrics].sort((a, b) => a.timestamp - b.timestamp);
      const firstDate = new Date(sortedMetrics[0].timestamp * 1000);
      const lastDate = new Date(sortedMetrics[sortedMetrics.length - 1].timestamp * 1000);
      
      // Calculate days between first and last prescription
      const daysDiff = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      // Calculate prescriptions per day
      const prescriptionsPerDay = healthMetrics.length / daysDiff;

      // Analyze trends based on prescription frequency
      const trend: TrendAnalysis = {
        direction: prescriptionsPerDay > 1 ? 'increasing' : prescriptionsPerDay < 0.5 ? 'decreasing' : 'stable',
        rateOfChange: `${prescriptionsPerDay.toFixed(2)} per day`,
        recentValue: Object.keys(prescriptionsByDiagnosis).length,
        averageValue: prescriptionsPerDay.toFixed(2)
      };
      setTrendAnalysis(trend);

      // Generate patterns based on prescription timing
      const patterns: HealthPattern[] = Object.entries(prescriptionsByDiagnosis).map(([diagnosis, prescriptions]) => {
        const lastPrescription = prescriptions[prescriptions.length - 1];
        return {
          type: 'PRESCRIPTION',
          description: `${diagnosis}: ${prescriptions.length} prescriptions`,
          significance: prescriptions.length > 3 ? 'HIGH' : 'MEDIUM',
          details: `Last prescribed on ${new Date(lastPrescription.timestamp * 1000).toLocaleDateString()}`
        };
      });
      setPatterns(patterns);

      // Generate recommendations based on prescription history
      const recommendations: HealthRecommendation[] = Object.entries(prescriptionsByDiagnosis).map(([diagnosis, prescriptions]) => ({
        type: 'PRESCRIPTION_MANAGEMENT',
        priority: prescriptions.length > 3 ? 'HIGH' : 'MEDIUM',
        description: `Monitor ${diagnosis} treatment closely`,
        details: `You have ${prescriptions.length} prescriptions over ${daysDiff} days. Average of ${(prescriptions.length / daysDiff).toFixed(2)} prescriptions per day for this condition.`
      }));
      setRecommendations(recommendations);
    } catch (error) {
      console.error('Error analyzing health data:', error);
      // Set default values in case of error
      setTrendAnalysis({
        direction: 'stable',
        rateOfChange: '0 per day',
        recentValue: 0,
        averageValue: '0'
      });
      setPatterns([]);
      setRecommendations([]);
    }
  };

  useEffect(() => {
    if (healthMetrics.length > 0) {
      analyzeHealthData();
    }
  }, [healthMetrics]);

  useEffect(() => {
    if (contract && isConnected) {
      fetchDashboardData();
    }
  }, [contract, isConnected]);

  const getAlertColor = (alertType: string) => {
    switch (alertType) {
      case 'HIGH_BLOOD_PRESSURE':
      case 'HIGH_BLOOD_SUGAR':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getMedicationEffectivenessColor = (effectiveness: string) => {
    switch (effectiveness.toLowerCase()) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getColorFromIndex = (index: number) => {
    const colors = [
      '#3b82f6',
      '#10b981',
      '#ef4444',
      '#f59e0b',
      '#8b9467',
      '#22c55e',
      '#4f46e5',
      '#f97316',
      '#6b7280',
      '#a855f7',
    ];
    return colors[index % colors.length];
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <div className="mt-4 sm:mt-0">
            <div className="flex space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Report
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: 'Total Patients', value: totalPatients.toString(), change: totalPatientChange, trend: 'up' },
            { name: 'Active Appointments', value: activeAppointments.toString(), change: activeAppointmentsChange, trend: 'up' },
            { name: 'Average Rating', value: averageRating.toString(), change: averageRatingChange, trend: 'up' },
            { name: 'Response Time', value: `${responseTime}m`, change: responseTimeChange, trend: 'down' },
          ].map((stat) => (
            <div
              key={stat.name}
              className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
            >
              <dt>
                <div className="absolute bg-blue-500 rounded-md p-3">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                  {stat.name}
                </p>
              </dt>
              <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
                <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </p>
              </dd>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'patients', 'appointments', 'revenue'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <div>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <AnalyticsDashboard
                  patientCount={totalPatients}
                  appointmentCount={activeAppointments}
                  prescriptionCount={prescriptionCount}
                  diagnosisDistribution={diagnosisDistribution}
                  medicationDistribution={medicationDistribution}
                  timelineData={timelineData}
                />
              )}
            </div>
          )}
          
          {activeTab === 'patients' && (
            <div>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PieChart 
                      data={Object.entries(patientGenderDistribution).map(([key, value], index) => ({
                        label: key,
                        value,
                        color: getColorFromIndex(index)
                      }))}
                      title="Gender Distribution" 
                      size={250}
                    />
                    <BarChart 
                      data={Object.entries(patientAgeGroups).map(([key, value], index) => ({
                        label: key,
                        value,
                        color: getColorFromIndex(index + 3)
                      }))}
                      title="Age Distribution" 
                      height={250}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PieChart 
                      data={Object.entries(patientLocationData).map(([key, value], index) => ({
                        label: key,
                        value,
                        color: getColorFromIndex(index + 6)
                      }))}
                      title="Geographic Distribution" 
                      size={250}
                    />
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold mb-4">Patient Growth</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Total Patients</span>
                          <span className="text-sm font-semibold">{totalPatients}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">New This Month</span>
                          <span className="text-sm font-semibold">{Math.floor(totalPatients * 0.15)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Returning Patients</span>
                          <span className="text-sm font-semibold">{Math.floor(totalPatients * 0.65)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Patient Retention</span>
                          <span className="text-sm font-semibold">78%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'appointments' && (
            <div>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PieChart 
                      data={Object.entries(appointmentStatusData).map(([key, value], index) => ({
                        label: key,
                        value,
                        color: getColorFromIndex(index)
                      }))}
                      title="Appointment Status" 
                      size={250}
                    />
                    <PieChart 
                      data={Object.entries(appointmentTypeData).map(([key, value], index) => ({
                        label: key,
                        value,
                        color: getColorFromIndex(index + 4)
                      }))}
                      title="Appointment Types" 
                      size={250}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <LineChart 
                      data={appointmentTimeData}
                      title="Appointments by Day of Week" 
                      color="#3b82f6"
                      height={250}
                    />
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold mb-4">Appointment Metrics</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Average Duration</span>
                          <span className="text-sm font-semibold">25 minutes</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">No-show Rate</span>
                          <span className="text-sm font-semibold">5.7%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Cancellation Rate</span>
                          <span className="text-sm font-semibold">8.2%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Avg. Response Time</span>
                          <span className="text-sm font-semibold">{responseTime} minutes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'revenue' && (
            <div>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <BarChart 
                      data={Object.entries(revenueByServiceData).map(([key, value], index) => ({
                        label: key,
                        value: value / 1000, // Display in thousands
                        color: getColorFromIndex(index)
                      }))}
                      title="Revenue by Service (₹ thousands)" 
                      height={250}
                    />
                    <LineChart 
                      data={revenueTimelineData.map(item => ({
                        x: item.x,
                        y: item.y / 1000 // Display in thousands
                      }))}
                      title="Monthly Revenue (₹ thousands)" 
                      color="#10b981"
                      height={250}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PieChart 
                      data={Object.entries(paymentMethodData).map(([key, value], index) => ({
                        label: key,
                        value,
                        color: getColorFromIndex(index + 5)
                      }))}
                      title="Payment Methods (%)" 
                      size={250}
                    />
                    <div className="bg-white p-6 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold mb-4">Financial Metrics</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Total Revenue (YTD)</span>
                          <span className="text-sm font-semibold">₹ {(Object.values(revenueByServiceData).reduce((a, b) => a + b, 0)).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Avg. Revenue per Patient</span>
                          <span className="text-sm font-semibold">₹ {Math.round(Object.values(revenueByServiceData).reduce((a, b) => a + b, 0) / totalPatients).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Avg. Revenue per Appointment</span>
                          <span className="text-sm font-semibold">₹ {Math.round(Object.values(revenueByServiceData).reduce((a, b) => a + b, 0) / (appointmentStatusData.Completed + appointmentStatusData.Scheduled)).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Growth Rate (YoY)</span>
                          <span className="text-sm font-semibold text-green-600">+18.5%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Updated Health Metrics Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleAddMetric} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Aadhar Number
                </label>
                <input
                  type="text"
                  pattern="\d{12}"
                  maxLength={12}
                  required
                  value={aadharNumber || ''}
                  onChange={(e) => setAadharNumber(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter 12-digit Aadhar number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Diagnosis
                </label>
                <input
                  type="text"
                  required
                  value={diagnosis || ''}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter diagnosis"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Medication
                </label>
                <input
                  type="text"
                  required
                  value={medication || ''}
                  onChange={(e) => setMedication(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter medication name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Dosage
                </label>
                <input
                  type="text"
                  required
                  value={dosage || ''}
                  onChange={(e) => setDosage(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter dosage (e.g., 10mg)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {frequencies.map((freq) => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Blood Pressure
                </label>
                <input
                  type="text"
                  value={bloodPressure || ''}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., 120/80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Blood Sugar
                </label>
                <input
                  type="text"
                  value={bloodSugar || ''}
                  onChange={(e) => setBloodSugar(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter blood sugar level"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Temperature
                </label>
                <input
                  type="text"
                  value={temperature || ''}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter temperature"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Weight (kg)
                </label>
                <input
                  type="text"
                  value={weight || ''}
                  onChange={(e) => setWeight(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter weight in kg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Symptoms & Notes
              </label>
              <textarea
                value={symptoms || ''}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter any symptoms or additional notes"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !isConnected || !validateAadhar(aadharNumber)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Add Health Record
            </button>
          </form>
        </div>

        {/* Analytics Dashboard */}
        {healthMetrics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Trend Analysis */}
            {trendAnalysis && (
              <div className="bg-white p-6 rounded-lg shadow border">
                <h3 className="text-lg font-semibold mb-4">Trend Analysis</h3>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Trend:</span>{' '}
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      trendAnalysis.direction === 'increasing' 
                        ? 'bg-red-100 text-red-800'
                        : trendAnalysis.direction === 'decreasing'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {trendAnalysis.direction.charAt(0).toUpperCase() + trendAnalysis.direction.slice(1)}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Rate of Change:</span>{' '}
                    {trendAnalysis.rateOfChange}
                  </p>
                  <p>
                    <span className="font-medium">Recent Value:</span>{' '}
                    {trendAnalysis.recentValue}
                  </p>
                  <p>
                    <span className="font-medium">Average Value:</span>{' '}
                    {trendAnalysis.averageValue}
                  </p>
                </div>
              </div>
            )}

            {/* Health Alerts */}
            {healthAlerts.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow border">
                <h3 className="text-lg font-semibold mb-4">Health Alerts</h3>
                <div className="space-y-3">
                  {healthAlerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-md ${
                        alert.severity === 'high'
                          ? 'bg-red-50 text-red-700'
                          : alert.severity === 'medium'
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {alert.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Patterns */}
            {patterns.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow border">
                <h3 className="text-lg font-semibold mb-4">Detected Patterns</h3>
                <div className="space-y-3">
                  {patterns.map((pattern, index) => (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-lg border border-gray-200 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-900">
                          {pattern.description}
                        </h4>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            pattern.significance === 'HIGH'
                              ? 'bg-red-100 text-red-800'
                              : pattern.significance === 'MEDIUM'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {pattern.significance} significance
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{pattern.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow border">
                <h3 className="text-lg font-semibold mb-4">Health Recommendations</h3>
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-md bg-gray-50"
                    >
                      <p className="font-medium">{rec.description}</p>
                      <p className="text-sm text-gray-600">{rec.details}</p>
                      <div className="mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rec.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : rec.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {rec.priority.toUpperCase()} priority
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
