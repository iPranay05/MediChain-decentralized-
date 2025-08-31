'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/context/Web3Context';
import Layout from '@/components/Layout';
import { motion } from 'framer-motion';

interface HealthMetric {
  date: string;
  type: string;
  value: number;
  unit: string;
}

interface Prescription {
  id: number;
  diagnosis: string;
  medicines: string;
  timestamp: number;
  hospitalName: string;
}

interface Appointment {
  id: number;
  timestamp: number;
  department: string;
  status: string;
}

interface HealthInsight {
  type: 'info' | 'warning' | 'success';
  title: string;
  description: string;
  recommendation: string;
}

// Chart component for department visits
const DepartmentVisitsChart = ({ data }: { data: { department: string; count: number }[] }) => {
  const maxCount = Math.max(...data.map(item => item.count));
  const colors = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
  
  return (
    <div className="w-full h-64 relative">
      <svg width="100%" height="100%" viewBox="0 0 500 250" preserveAspectRatio="xMidYMid meet">
        {/* Background grid */}
        <g className="grid">
          {[0, 1, 2, 3, 4].map((i) => (
            <line 
              key={`grid-y-${i}`} 
              x1="40" 
              y1={220 - i * 45} 
              x2="480" 
              y2={220 - i * 45} 
              stroke="#E5E7EB" 
              strokeWidth="1" 
              strokeDasharray="5,5" 
            />
          ))}
        </g>
        
        {/* Y-axis */}
        <line x1="40" y1="20" x2="40" y2="220" stroke="#94A3B8" strokeWidth="1.5" />
        {/* X-axis */}
        <line x1="40" y1="220" x2="480" y2="220" stroke="#94A3B8" strokeWidth="1.5" />
        
        {/* Bars */}
        {data.map((item, index) => {
          const barWidth = 40;
          const gap = 20;
          const barHeight = (item.count / maxCount) * 180;
          const x = 60 + index * (barWidth + gap);
          const y = 220 - barHeight;
          
          return (
            <g key={index}>
              <defs>
                <linearGradient id={`barGradient${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={colors[index % colors.length]} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={colors[index % colors.length]} stopOpacity="0.5" />
                </linearGradient>
              </defs>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={`url(#barGradient${index})`}
                rx="4"
                filter="drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.1))"
              />
              <text
                x={x + barWidth / 2}
                y={y - 10}
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#4B5563"
              >
                {item.count}
              </text>
              <text
                x={x + barWidth / 2}
                y={235}
                textAnchor="middle"
                fontSize="11"
                fill="#4B5563"
              >
                {item.department.length > 10 ? item.department.substring(0, 10) + '...' : item.department}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Pie chart component for medicine distribution
const MedicinePieChart = ({ data }: { data: { medicine: string; count: number }[] }) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const colors = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#8B5CF6'];
  
  // Calculate pie slices
  let startAngle = 0;
  const slices = data.map((item, index) => {
    const percentage = item.count / total;
    const angle = percentage * 360;
    const endAngle = startAngle + angle;
    
    // Calculate SVG arc path
    const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
    const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
    const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
    const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M 100 100`,
      `L ${x1} ${y1}`,
      `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    const slice = {
      path: pathData,
      color: colors[index % colors.length],
      startAngle,
      endAngle,
      percentage,
      medicine: item.medicine,
      count: item.count
    };
    
    startAngle = endAngle;
    return slice;
  });
  
  return (
    <div className="w-full h-64 relative">
      <div className="flex">
        <div className="w-1/2">
          <svg width="100%" height="200" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
            <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.2" />
            </filter>
            <g filter="url(#dropShadow)">
              {slices.map((slice, index) => (
                <path
                  key={index}
                  d={slice.path}
                  fill={slice.color}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                >
                  <title>{`${slice.medicine}: ${slice.count} (${Math.round(slice.percentage * 100)}%)`}</title>
                </path>
              ))}
            </g>
            {/* Center white circle for donut effect */}
            <circle cx="100" cy="100" r="40" fill="white" />
          </svg>
        </div>
        <div className="w-1/2 pl-4 flex flex-col justify-center">
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {slices.map((slice, index) => (
              <div key={index} className="flex items-center text-xs">
                <div className="w-3 h-3 mr-2 rounded-sm" style={{ backgroundColor: slice.color }}></div>
                <span className="truncate font-medium">{slice.medicine}</span>
                <span className="ml-1 text-gray-500 text-xs">{Math.round(slice.percentage * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Line chart for health trends
const HealthTrendsChart = ({ prescriptions }: { prescriptions: Prescription[] }) => {
  // Group prescriptions by month
  const monthlyData = prescriptions.reduce((acc: { [key: string]: number }, curr) => {
    const date = new Date(curr.timestamp * 1000);
    const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
    acc[monthYear] = (acc[monthYear] || 0) + 1;
    return acc;
  }, {});
  
  // Convert to array and sort by date
  const sortedData = Object.entries(monthlyData)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => {
      const [aMonth, aYear] = a.date.split('/').map(Number);
      const [bMonth, bYear] = b.date.split('/').map(Number);
      return aYear === bYear ? aMonth - bMonth : aYear - bYear;
    });
  
  // Take last 6 months
  const recentData = sortedData.slice(-6);
  
  const maxCount = Math.max(...recentData.map(item => item.count), 1);
  
  return (
    <div className="w-full h-64 relative">
      <svg width="100%" height="100%" viewBox="0 0 500 250" preserveAspectRatio="xMidYMid meet">
        {/* Background grid */}
        <g className="grid">
          {[0, 1, 2, 3, 4].map((i) => (
            <line 
              key={`grid-y-${i}`} 
              x1="40" 
              y1={220 - i * 45} 
              x2="480" 
              y2={220 - i * 45} 
              stroke="#E5E7EB" 
              strokeWidth="1" 
              strokeDasharray="5,5" 
            />
          ))}
        </g>
        
        {/* Y-axis */}
        <line x1="40" y1="20" x2="40" y2="220" stroke="#94A3B8" strokeWidth="1.5" />
        {/* X-axis */}
        <line x1="40" y1="220" x2="480" y2="220" stroke="#94A3B8" strokeWidth="1.5" />
        
        {/* Area under the line */}
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path
          d={`
            M ${60} ${220}
            ${recentData.map((item, index) => {
              const x = 60 + index * 70;
              const y = 220 - (item.count / maxCount) * 180;
              return `L ${x} ${y}`;
            }).join(' ')}
            L ${60 + (recentData.length - 1) * 70} ${220}
            Z
          `}
          fill="url(#areaGradient)"
        />
        
        {/* Line */}
        <path
          d={`
            M ${recentData.length > 0 ? 60 : 0} ${recentData.length > 0 ? 220 - (recentData[0].count / maxCount) * 180 : 0}
            ${recentData.map((item, index) => {
              const x = 60 + index * 70;
              const y = 220 - (item.count / maxCount) * 180;
              return `L ${x} ${y}`;
            }).join(' ')}
          `}
          fill="none"
          stroke="#4F46E5"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Points */}
        {recentData.map((item, index) => {
          const x = 60 + index * 70;
          const y = 220 - (item.count / maxCount) * 180;
          
          return (
            <g key={index}>
              <circle cx={x} cy={y} r="6" fill="white" stroke="#4F46E5" strokeWidth="2" />
              <text
                x={x}
                y={y - 15}
                textAnchor="middle"
                fontSize="12"
                fontWeight="bold"
                fill="#4B5563"
              >
                {item.count}
              </text>
              <text
                x={x}
                y={235}
                textAnchor="middle"
                fontSize="11"
                fill="#4B5563"
              >
                {item.date}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default function PatientAnalytics() {
  const router = useRouter();
  const { contract, isConnected, connectWallet } = useWeb3();
  const [aadharNumber, setAadharNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [healthCoins, setHealthCoins] = useState(0);
  const [insights, setInsights] = useState<HealthInsight[]>([]);

  useEffect(() => {
    const storedAadhar = localStorage.getItem('aadharNumber');
    if (!storedAadhar) {
      router.push('/patient/login');
      return;
    }
    setAadharNumber(storedAadhar);
    fetchData(storedAadhar);
  }, [router]);

  const fetchData = async (patientAadhar: string) => {
    try {
      if (!isConnected || !contract) {
        await connectWallet();
        return;
      }

      setLoading(true);
      setError('');

      // Fetch prescriptions
      const prescriptionData = await contract.getPrescriptions(patientAadhar);
      const prescriptionList = prescriptionData.map((p: any) => ({
        id: typeof p.id === 'bigint' ? Number(p.id) : (p.id?.toNumber ? p.id.toNumber() : Number(p.id)),
        diagnosis: p.diagnosis,
        medicines: p.medicines,
        timestamp: typeof p.timestamp === 'bigint' ? Number(p.timestamp) : (p.timestamp?.toNumber ? p.timestamp.toNumber() : Number(p.timestamp)),
        hospitalName: p.hospitalName
      }));
      setPrescriptions(prescriptionList);

      // Fetch appointments
      const appointmentIds = await contract.getPatientAppointments(patientAadhar);
      const appointmentDetails = await Promise.all(
        appointmentIds.map(async (id: any) => {
          try {
            const idNumber = typeof id === 'bigint' ? Number(id) : (id?.toNumber ? id.toNumber() : Number(id));
            const appointment = await contract.appointments(idNumber);
            return {
              id: idNumber,
              timestamp: typeof appointment.timestamp === 'bigint' ? Number(appointment.timestamp) : 
                        (appointment.timestamp?.toNumber ? appointment.timestamp.toNumber() : Number(appointment.timestamp)),
              department: appointment.department || 'General',
              status: ['SCHEDULED', 'COMPLETED', 'CANCELLED'][appointment.status] || 'SCHEDULED'
            };
          } catch (err) {
            console.error('Error fetching appointment:', err);
            return null;
          }
        })
      );
      const validAppointments = appointmentDetails.filter((a): a is Appointment => a !== null);
      setAppointments(validAppointments);

      // Fetch health coins
      const coins = await contract.healthCoins(patientAadhar);
      setHealthCoins(typeof coins === 'bigint' ? Number(coins) : (coins?.toNumber ? coins.toNumber() : Number(coins)));

      // Generate AI insights
      generateHealthInsights(prescriptionList, validAppointments);

    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const generateHealthInsights = (prescriptions: Prescription[], appointments: Appointment[]) => {
    const insights: HealthInsight[] = [];
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
    const recentPrescriptions = prescriptions.filter(p => p.timestamp > thirtyDaysAgo);
    const recentAppointments = appointments.filter(a => a.timestamp > thirtyDaysAgo);
    const completedAppointments = appointments.filter(a => a.status === 'COMPLETED');
    const upcomingAppointments = appointments.filter(a => a.timestamp > now && a.status === 'SCHEDULED');

    // Check appointment frequency
    if (completedAppointments.length === 0) {
      insights.push({
        type: 'warning',
        title: 'No Recent Check-ups',
        description: 'You haven\'t had any completed medical check-ups yet.',
        recommendation: 'Consider scheduling a general health check-up to maintain your well-being.'
      });
    }

    // Check upcoming appointments
    if (upcomingAppointments.length > 0) {
      insights.push({
        type: 'info',
        title: 'Upcoming Appointments',
        description: `You have ${upcomingAppointments.length} upcoming appointment(s).`,
        recommendation: 'Make sure to prepare any necessary medical documents and arrive on time.'
      });
    }

    // Analyze department visits
    const departmentVisits = appointments.reduce((acc: { [key: string]: number }, curr) => {
      acc[curr.department] = (acc[curr.department] || 0) + 1;
      return acc;
    }, {});

    const mostVisitedDept = Object.entries(departmentVisits).sort((a, b) => b[1] - a[1])[0];
    if (mostVisitedDept) {
      insights.push({
        type: 'info',
        title: 'Department Visit Pattern',
        description: `You've visited ${mostVisitedDept[0]} department ${mostVisitedDept[1]} times.`,
        recommendation: 'Consider discussing with your doctor if there are preventive measures you can take.'
      });
    }

    // Analyze prescriptions
    if (recentPrescriptions.length > 0) {
      const medicines = recentPrescriptions.reduce((acc: string[], curr) => {
        const medList = curr.medicines.split(',').map(m => m.trim());
        return [...acc, ...medList];
      }, []);

      if (medicines.length > 0) {
        insights.push({
          type: 'info',
          title: 'Recent Medications',
          description: `You've been prescribed ${medicines.length} different medications in the last 30 days.`,
          recommendation: 'Ensure you are following the prescribed dosage and timing for all medications.'
        });
      }
    }

    // Health coins analysis
    if (healthCoins > 0) {
      insights.push({
        type: 'success',
        title: 'Health Engagement',
        description: `You've earned ${healthCoins} health coins!`,
        recommendation: 'Keep up the good work by attending appointments and following prescriptions.'
      });
    }

    setInsights(insights);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDepartmentStats = () => {
    const stats = appointments.reduce((acc: { [key: string]: number }, curr) => {
      acc[curr.department] = (acc[curr.department] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(stats).map(([department, count]) => ({
      department,
      count
    }));
  };

  const getMedicineFrequency = () => {
    const medicines = prescriptions.reduce((acc: { [key: string]: number }, curr) => {
      try {
        const medicineList = curr.medicines.split(',').map(med => med.trim());
        medicineList.forEach((medicine: string) => {
          if (medicine) {
            acc[medicine] = (acc[medicine] || 0) + 1;
          }
        });
      } catch (err) {
        console.error('Error parsing medicines:', err);
      }
      return acc;
    }, {});
    return Object.entries(medicines).map(([medicine, count]) => ({
      medicine,
      count
    }));
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Visual Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Visual Analytics</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Department Visits Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-lg shadow-md border border-gray-200 bg-white hover:shadow-lg transition-shadow duration-300"
            >
              <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm8 6a6 6 0 100-12 6 6 0 000 12zm1-5a1 1 0 10-2 0v2a1 1 0 102 0v-2z"></path>
                </svg>
                Department Visits
              </h3>
              <DepartmentVisitsChart data={getDepartmentStats()} />
            </motion.div>
            
            {/* Medicine Distribution Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 rounded-lg shadow-md border border-gray-200 bg-white hover:shadow-lg transition-shadow duration-300"
            >
              <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm10-6a1 1 0 10-2 0v5a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 7.586V4z"></path>
                </svg>
                Medicine Distribution
              </h3>
              <MedicinePieChart data={getMedicineFrequency().slice(0, 8)} />
            </motion.div>
            
            {/* Health Trends Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-lg shadow-md border border-gray-200 bg-white hover:shadow-lg transition-shadow duration-300 md:col-span-2"
            >
              <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
                </svg>
                Health Trends (Prescriptions by Month)
              </h3>
              <HealthTrendsChart prescriptions={prescriptions} />
            </motion.div>
          </div>
        </motion.div>

        {/* AI Health Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">AI Health Insights</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-lg shadow-md border border-gray-200 bg-white hover:shadow-lg transition-shadow duration-300 ${
                  insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  insight.type === 'success' ? 'bg-green-50 border-green-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <h3 className={`text-lg font-medium mb-2 ${
                  insight.type === 'warning' ? 'text-yellow-800' :
                  insight.type === 'success' ? 'text-green-800' :
                  'text-blue-800'
                }`}>{insight.title}</h3>
                <p className="text-gray-600 mb-3">{insight.description}</p>
                <p className={`text-sm font-medium ${
                  insight.type === 'warning' ? 'text-yellow-600' :
                  insight.type === 'success' ? 'text-green-600' :
                  'text-blue-600'
                }`}>
                  Recommendation: {insight.recommendation}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
          {/* Health Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-w-0 rounded-lg shadow-md border border-gray-200 bg-white hover:shadow-lg transition-shadow duration-300"
          >
            <div className="p-4 flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"></path>
                </svg>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">Health Coins</p>
                <p className="text-lg font-semibold text-gray-700">{healthCoins}</p>
              </div>
            </div>
          </motion.div>

          {/* Total Appointments Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            className="min-w-0 rounded-lg shadow-md border border-gray-200 bg-white hover:shadow-lg transition-shadow duration-300"
          >
            <div className="p-4 flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                </svg>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-lg font-semibold text-gray-700">{appointments.length}</p>
              </div>
            </div>
          </motion.div>

          {/* Prescriptions Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
            className="min-w-0 rounded-lg shadow-md border border-gray-200 bg-white hover:shadow-lg transition-shadow duration-300"
          >
            <div className="p-4 flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"></path>
                </svg>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-600">Total Prescriptions</p>
                <p className="text-lg font-semibold text-gray-700">{prescriptions.length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
          className="mb-8 bg-white rounded-lg shadow-md"
        >
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="overflow-x-auto">
              <table className="w-full whitespace-no-wrap">
                <thead>
                  <tr className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[...appointments.map(a => ({
                    date: a.timestamp,
                    type: 'Appointment',
                    details: `${a.department} - ${a.status}`
                  })), ...prescriptions.map(p => ({
                    date: p.timestamp,
                    type: 'Prescription',
                    details: `${p.diagnosis} at ${p.hospitalName}`
                  }))].sort((a, b) => b.date - a.date).slice(0, 10).map((activity, i) => (
                    <tr key={i} className="text-gray-700">
                      <td className="px-4 py-3 text-sm">{formatDate(activity.date)}</td>
                      <td className="px-4 py-3 text-sm">{activity.type}</td>
                      <td className="px-4 py-3 text-sm">{activity.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Department Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
          className="mb-8 bg-white rounded-lg shadow-md"
        >
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Visits</h2>
            <div className="grid gap-4">
              {getDepartmentStats().map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{stat.department}</span>
                  <div className="flex items-center">
                    <div className="w-48 h-2 bg-blue-100 rounded-full mr-2">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{
                          width: `${(stat.count / appointments.length) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{stat.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Medicine Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
          className="bg-white rounded-lg shadow-md"
        >
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Prescribed Medicines</h2>
            <div className="grid gap-4">
              {getMedicineFrequency().map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{stat.medicine}</span>
                  <div className="flex items-center">
                    <div className="w-48 h-2 bg-purple-100 rounded-full mr-2">
                      <div
                        className="h-2 bg-purple-500 rounded-full"
                        style={{
                          width: `${(stat.count / prescriptions.length) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{stat.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
