'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DataPoint {
  label: string;
  value: number;
  color: string;
}

interface BarChartProps {
  data: DataPoint[];
  title: string;
  height?: number;
}

interface LineChartProps {
  data: { x: string; y: number }[];
  title: string;
  color?: string;
  height?: number;
}

interface PieChartProps {
  data: DataPoint[];
  title: string;
  size?: number;
}

interface DashboardMetricsProps {
  patientCount: number;
  appointmentCount: number;
  prescriptionCount: number;
  diagnosisDistribution: Record<string, number>;
  medicationDistribution: Record<string, number>;
  timelineData: { date: string; count: number }[];
}

export const BarChart: React.FC<BarChartProps> = ({ data, title, height = 300 }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div style={{ height: `${height}px` }} className="flex items-end space-x-2">
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          return (
            <motion.div 
              key={index}
              className="flex flex-col items-center flex-1"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="w-full flex justify-center mb-1">
                <span className="text-xs font-medium">{item.value}</span>
              </div>
              <motion.div 
                className="w-full rounded-t-md"
                style={{ 
                  height: `${barHeight}%`, 
                  backgroundColor: item.color,
                  minHeight: '4px'
                }}
                initial={{ height: 0 }}
                animate={{ height: `${barHeight}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              />
              <div className="w-full text-center mt-2">
                <span className="text-xs font-medium text-gray-600">{item.label}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export const LineChart: React.FC<LineChartProps> = ({ data, title, color = '#3b82f6', height = 200 }) => {
  if (data.length < 2) return <div>Not enough data points</div>;
  
  const yValues = data.map(d => d.y);
  const maxY = Math.max(...yValues);
  const minY = Math.min(...yValues);
  const range = maxY - minY;
  
  // Generate SVG path
  const generatePath = () => {
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d.y - minY) / (range || 1)) * 100;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div style={{ height: `${height}px` }} className="relative">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1="0" x2="100" y2="0" stroke="#e5e7eb" strokeWidth="0.5" />
          <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.5" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="#e5e7eb" strokeWidth="0.5" />
          <line x1="0" y1="100" x2="100" y2="100" stroke="#e5e7eb" strokeWidth="0.5" />
          
          {/* Data path */}
          <motion.path
            d={generatePath()}
            fill="none"
            stroke={color}
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          
          {/* Data points */}
          {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((d.y - minY) / (range || 1)) * 100;
            return (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r="1.5"
                fill={color}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              />
            );
          })}
        </svg>
        
        {/* X-axis labels */}
        <div className="flex justify-between mt-2">
          {data.map((d, i) => (
            <div key={i} className="text-xs text-gray-500">
              {d.x}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const PieChart: React.FC<PieChartProps> = ({ data, title, size = 200 }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex justify-center">
        <div style={{ width: `${size}px`, height: `${size}px` }} className="relative">
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const angle = (percentage / 100) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              currentAngle = endAngle;
              
              // Convert angles to radians
              const startRad = (startAngle - 90) * (Math.PI / 180);
              const endRad = (endAngle - 90) * (Math.PI / 180);
              
              // Calculate path coordinates
              const x1 = 50 + 40 * Math.cos(startRad);
              const y1 = 50 + 40 * Math.sin(startRad);
              const x2 = 50 + 40 * Math.cos(endRad);
              const y2 = 50 + 40 * Math.sin(endRad);
              
              // Determine if the arc should be drawn as a large arc
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              // Create the SVG path
              const path = `
                M 50 50
                L ${x1} ${y1}
                A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}
                Z
              `;
              
              return (
                <motion.path
                  key={index}
                  d={path}
                  fill={item.color}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              );
            })}
          </svg>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-3 h-3 mr-2" style={{ backgroundColor: item.color }}></div>
            <span className="text-xs text-gray-700">{item.label} ({Math.round((item.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AnalyticsDashboard: React.FC<DashboardMetricsProps> = ({
  patientCount,
  appointmentCount,
  prescriptionCount,
  diagnosisDistribution,
  medicationDistribution,
  timelineData
}) => {
  // Prepare data for charts
  const diagnosisChartData = Object.entries(diagnosisDistribution).map(([key, value], index) => ({
    label: key,
    value,
    color: getColorFromIndex(index)
  }));
  
  const medicationChartData = Object.entries(medicationDistribution).map(([key, value], index) => ({
    label: key,
    value,
    color: getColorFromIndex(index + 5) // Offset to get different colors
  }));
  
  const timelineChartData = timelineData.map(item => ({
    x: item.date,
    y: item.count
  }));
  
  const metricsData = [
    { label: 'Patients', value: patientCount, color: '#3b82f6' },
    { label: 'Appointments', value: appointmentCount, color: '#10b981' },
    { label: 'Prescriptions', value: prescriptionCount, color: '#f59e0b' }
  ];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart 
          data={metricsData} 
          title="Key Metrics" 
          height={250}
        />
        <LineChart 
          data={timelineChartData} 
          title="Activity Timeline" 
          color="#3b82f6"
          height={250}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChart 
          data={diagnosisChartData} 
          title="Diagnosis Distribution" 
          size={250}
        />
        <PieChart 
          data={medicationChartData} 
          title="Medication Distribution" 
          size={250}
        />
      </div>
    </div>
  );
};

// Helper function to generate colors
function getColorFromIndex(index: number): string {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#14b8a6', // teal
    '#6366f1'  // indigo
  ];
  
  return colors[index % colors.length];
}
