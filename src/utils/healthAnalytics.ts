// Health metric thresholds for different measurements
export const HEALTH_THRESHOLDS = {
  blood_pressure_systolic: { high: 140, low: 90, unit: 'mmHg' },
  blood_pressure_diastolic: { high: 90, low: 60, unit: 'mmHg' },
  heart_rate: { high: 100, low: 60, unit: 'bpm' },
  blood_sugar: { high: 200, low: 70, unit: 'mg/dL' },
  temperature: { high: 38.3, low: 36, unit: '°C' },
  oxygen_saturation: { high: 100, low: 95, unit: '%' }
};

export interface HealthMetric {
  type: string;
  value: number;
  timestamp: number;
  notes: string;
  hospital?: string;
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  rateOfChange: string;
  recentValue: number;
  averageValue: string;
}

export interface HealthAlert {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: number;
}

export interface HealthPattern {
  type: string;
  description: string;
  significance: string;
  details: string;
}

export interface HealthRecommendation {
  type: string;
  priority: string;
  description: string;
  details: string;
}

// Analyze trend in health metrics
export function analyzeTrend(metrics: HealthMetric[]): TrendAnalysis {
  if (!metrics.length) {
    return {
      direction: 'stable',
      rateOfChange: '0 per day',
      recentValue: 0,
      averageValue: '0'
    };
  }

  // Sort metrics by timestamp
  const sortedMetrics = [...metrics].sort((a, b) => a.timestamp - b.timestamp);
  
  // Calculate days between first and last prescription
  const firstDate = new Date(sortedMetrics[0].timestamp * 1000);
  const lastDate = new Date(sortedMetrics[sortedMetrics.length - 1].timestamp * 1000);
  const daysDiff = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Calculate prescriptions per day
  const prescriptionsPerDay = metrics.length / daysDiff;

  return {
    direction: prescriptionsPerDay > 1 ? 'increasing' : prescriptionsPerDay < 0.5 ? 'decreasing' : 'stable',
    rateOfChange: `${prescriptionsPerDay.toFixed(2)} per day`,
    recentValue: metrics.length,
    averageValue: prescriptionsPerDay.toFixed(2)
  };
}

// Check for health alerts based on thresholds and patterns
export function checkForAlerts(metrics: HealthMetric[]): HealthAlert[] {
  const alerts: HealthAlert[] = [];
  
  if (!metrics.length) return alerts;
  
  // Check for frequent prescriptions
  if (metrics.length > 5) {
    alerts.push({
      type: 'HIGH_PRESCRIPTION_COUNT',
      severity: 'medium',
      message: `You have ${metrics.length} prescriptions recorded. Consider reviewing your medication regimen.`,
      timestamp: Date.now()
    });
  }
  
  // Check for recent prescriptions (in the last 7 days)
  const recentPrescriptions = metrics.filter(m => {
    const prescriptionDate = new Date(m.timestamp * 1000);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - prescriptionDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  });
  
  if (recentPrescriptions.length >= 3) {
    alerts.push({
      type: 'FREQUENT_RECENT_PRESCRIPTIONS',
      severity: 'high',
      message: `You have ${recentPrescriptions.length} prescriptions in the last 7 days. Please consult your doctor.`,
      timestamp: Date.now()
    });
  }

  return alerts;
}

// Recognize patterns in health data
export function recognizePatterns(metrics: HealthMetric[]): HealthPattern[] {
  const patterns: HealthPattern[] = [];
  
  if (metrics.length < 3) return patterns;

  // Group prescriptions by diagnosis
  const prescriptionsByDiagnosis: Record<string, HealthMetric[]> = {};
  
  metrics.forEach(metric => {
    try {
      const diagnosisPart = metric.notes.split(',')[0];
      if (!diagnosisPart) return;
      
      const diagnosisSplit = diagnosisPart.split(':');
      if (diagnosisSplit.length !== 2) return;
      
      const diagnosis = diagnosisSplit[1].trim();
      if (!diagnosis) return;
      
      if (!prescriptionsByDiagnosis[diagnosis]) {
        prescriptionsByDiagnosis[diagnosis] = [];
      }
      prescriptionsByDiagnosis[diagnosis].push(metric);
    } catch (error) {
      console.error('Error processing metric:', error);
    }
  });
  
  // Generate patterns based on prescription history
  Object.entries(prescriptionsByDiagnosis).forEach(([diagnosis, prescriptions]) => {
    if (prescriptions.length >= 2) {
      const lastPrescription = prescriptions[prescriptions.length - 1];
      patterns.push({
        type: 'PRESCRIPTION',
        description: `${diagnosis}: ${prescriptions.length} prescriptions`,
        significance: prescriptions.length > 3 ? 'HIGH' : 'MEDIUM',
        details: `Last prescribed on ${new Date(lastPrescription.timestamp * 1000).toLocaleDateString()}`
      });
    }
  });

  return patterns;
}

// Generate health recommendations based on metrics and patterns
export function generateRecommendations(
  metrics: HealthMetric[],
  patterns: HealthPattern[]
): HealthRecommendation[] {
  const recommendations: HealthRecommendation[] = [];
  
  if (metrics.length === 0) return recommendations;
  
  // Sort metrics by timestamp
  const sortedMetrics = [...metrics].sort((a, b) => a.timestamp - b.timestamp);
  const firstDate = new Date(sortedMetrics[0].timestamp * 1000);
  const lastDate = new Date(sortedMetrics[sortedMetrics.length - 1].timestamp * 1000);
  
  // Calculate days between first and last prescription
  const daysDiff = Math.max(1, Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Group prescriptions by diagnosis
  const prescriptionsByDiagnosis: Record<string, HealthMetric[]> = {};
  
  metrics.forEach(metric => {
    try {
      const diagnosisPart = metric.notes.split(',')[0];
      if (!diagnosisPart) return;
      
      const diagnosisSplit = diagnosisPart.split(':');
      if (diagnosisSplit.length !== 2) return;
      
      const diagnosis = diagnosisSplit[1].trim();
      if (!diagnosis) return;
      
      if (!prescriptionsByDiagnosis[diagnosis]) {
        prescriptionsByDiagnosis[diagnosis] = [];
      }
      prescriptionsByDiagnosis[diagnosis].push(metric);
    } catch (error) {
      console.error('Error processing metric:', error);
    }
  });
  
  // Generate recommendations based on prescription history
  Object.entries(prescriptionsByDiagnosis).forEach(([diagnosis, prescriptions]) => {
    recommendations.push({
      type: 'PRESCRIPTION_MANAGEMENT',
      priority: prescriptions.length > 3 ? 'HIGH' : 'MEDIUM',
      description: `Monitor ${diagnosis} treatment closely`,
      details: `You have ${prescriptions.length} prescriptions over ${daysDiff} days. Average of ${(prescriptions.length / daysDiff).toFixed(2)} prescriptions per day for this condition.`
    });
  });
  
  // Add general recommendations
  if (metrics.length > 0) {
    recommendations.push({
      type: 'GENERAL_HEALTH',
      priority: 'MEDIUM',
      description: 'Regular health check-ups',
      details: 'Consider scheduling regular health check-ups to monitor your overall health status.'
    });
  }

  return recommendations;
}
