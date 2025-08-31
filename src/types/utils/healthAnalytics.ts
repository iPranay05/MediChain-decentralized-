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
  metricType: string;
  value: number;
  timestamp: number;
  notes: string;
}

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable';
  rateOfChange: number;
  volatility: number;
  recentValue: number;
  averageValue: number;
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
  frequency: number;
  significance: 'low' | 'medium' | 'high';
}

export interface HealthRecommendation {
  type: string;
  priority: 'low' | 'medium' | 'high';
  suggestion: string;
  reason: string;
}

// Analyze trend in health metrics
export function analyzeTrend(metrics: HealthMetric[]): TrendAnalysis {
  if (!metrics.length) {
    return {
      trend: 'stable',
      rateOfChange: 0,
      volatility: 0,
      recentValue: 0,
      averageValue: 0
    };
  }

  // Sort metrics by timestamp
  const sortedMetrics = [...metrics].sort((a, b) => a.timestamp - b.timestamp);
  
  // Calculate changes between consecutive measurements
  const changes = [];
  for (let i = 1; i < sortedMetrics.length; i++) {
    const change = {
      value: sortedMetrics[i].value - sortedMetrics[i-1].value,
      timeSpan: sortedMetrics[i].timestamp - sortedMetrics[i-1].timestamp
    };
    changes.push(change);
  }
  
  // Calculate rate of change (per day)
  const avgChange = changes.length ? 
    changes.reduce((sum, change) => sum + (change.value / (change.timeSpan / (24 * 60 * 60))), 0) / changes.length : 
    0;
  
  // Calculate volatility (standard deviation of changes)
  const volatility = calculateVolatility(changes.map(c => c.value));
  
  // Get most recent and average values
  const recentValue = sortedMetrics[sortedMetrics.length - 1].value;
  const averageValue = sortedMetrics.reduce((sum, m) => sum + m.value, 0) / sortedMetrics.length;

  return {
    trend: avgChange > 0.1 ? 'increasing' : avgChange < -0.1 ? 'decreasing' : 'stable',
    rateOfChange: avgChange,
    volatility,
    recentValue,
    averageValue
  };
}

// Check for health alerts based on thresholds and patterns
export function checkForAlerts(
  metric: HealthMetric, 
  trend: TrendAnalysis
): HealthAlert[] {
  const alerts: HealthAlert[] = [];
  const thresholds = HEALTH_THRESHOLDS[metric.metricType as keyof typeof HEALTH_THRESHOLDS];
  
  if (!thresholds) return alerts;

  // Check current value against thresholds
  if (metric.value > thresholds.high) {
    alerts.push({
      type: 'HIGH_VALUE',
      severity: 'high',
      message: `${metric.metricType} is above normal range (${metric.value} ${thresholds.unit})`,
      timestamp: Date.now()
    });
  } else if (metric.value < thresholds.low) {
    alerts.push({
      type: 'LOW_VALUE',
      severity: 'high',
      message: `${metric.metricType} is below normal range (${metric.value} ${thresholds.unit})`,
      timestamp: Date.now()
    });
  }

  // Check rapid changes
  if (Math.abs(trend.rateOfChange) > 5) {
    alerts.push({
      type: 'RAPID_CHANGE',
      severity: 'medium',
      message: `Rapid change detected in ${metric.metricType}`,
      timestamp: Date.now()
    });
  }

  // Check high volatility
  if (trend.volatility > 10) {
    alerts.push({
      type: 'HIGH_VOLATILITY',
      severity: 'medium',
      message: `Unusual variations detected in ${metric.metricType}`,
      timestamp: Date.now()
    });
  }

  return alerts;
}

// Recognize patterns in health data
export function recognizePatterns(metrics: HealthMetric[]): HealthPattern[] {
  const patterns: HealthPattern[] = [];
  
  if (metrics.length < 3) return patterns;

  // Time-based patterns
  const timePatterns = analyzeTimePatterns(metrics);
  patterns.push(...timePatterns);

  // Value-based patterns
  const valuePatterns = analyzeValuePatterns(metrics);
  patterns.push(...valuePatterns);

  return patterns;
}

// Generate health recommendations based on metrics and patterns
export function generateRecommendations(
  metrics: HealthMetric[],
  patterns: HealthPattern[]
): HealthRecommendation[] {
  const recommendations: HealthRecommendation[] = [];
  const trend = analyzeTrend(metrics);

  // Basic recommendations based on metric type
  if (metrics.length > 0) {
    const latestMetric = metrics[metrics.length - 1];
    const thresholds = HEALTH_THRESHOLDS[latestMetric.metricType as keyof typeof HEALTH_THRESHOLDS];

    if (thresholds) {
      if (latestMetric.value > thresholds.high) {
        recommendations.push({
          type: 'LIFESTYLE',
          priority: 'high',
          suggestion: `Consider lifestyle changes to lower your ${latestMetric.metricType}`,
          reason: `Your ${latestMetric.metricType} is above the normal range`
        });
      } else if (latestMetric.value < thresholds.low) {
        recommendations.push({
          type: 'CONSULTATION',
          priority: 'high',
          suggestion: `Consult with your healthcare provider about your ${latestMetric.metricType}`,
          reason: `Your ${latestMetric.metricType} is below the normal range`
        });
      }
    }
  }

  // Pattern-based recommendations
  patterns.forEach(pattern => {
    if (pattern.significance === 'high') {
      recommendations.push({
        type: 'PATTERN',
        priority: 'medium',
        suggestion: `Monitor your ${pattern.type} pattern closely`,
        reason: pattern.description
      });
    }
  });

  // Trend-based recommendations
  if (trend.trend !== 'stable') {
    recommendations.push({
      type: 'TREND',
      priority: trend.trend === 'increasing' ? 'medium' : 'low',
      suggestion: `Keep tracking your measurements regularly`,
      reason: `Your values show a ${trend.trend} trend`
    });
  }

  return recommendations;
}

// Helper functions
function calculateVolatility(values: number[]): number {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(variance);
}

function analyzeTimePatterns(metrics: HealthMetric[]): HealthPattern[] {
  const patterns: HealthPattern[] = [];
  const sortedMetrics = [...metrics].sort((a, b) => a.timestamp - b.timestamp);
  
  // Check for daily patterns
  const dailyValues = groupMetricsByTimeOfDay(sortedMetrics);
  Object.entries(dailyValues).forEach(([timeOfDay, values]) => {
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const significance = values.length >= 3 ? 'high' : 'medium';
    
    patterns.push({
      type: 'DAILY',
      description: `Typical ${timeOfDay} value: ${avg.toFixed(1)}`,
      frequency: values.length,
      significance
    });
  });

  return patterns;
}

function analyzeValuePatterns(metrics: HealthMetric[]): HealthPattern[] {
  const patterns: HealthPattern[] = [];
  const values = metrics.map(m => m.value);
  
  // Check for consistent ranges
  const range = {
    min: Math.min(...values),
    max: Math.max(...values)
  };
  
  const rangeSize = range.max - range.min;
  const significance = rangeSize > 20 ? 'high' : rangeSize > 10 ? 'medium' : 'low';
  
  patterns.push({
    type: 'RANGE',
    description: `Values typically between ${range.min.toFixed(1)} and ${range.max.toFixed(1)}`,
    frequency: metrics.length,
    significance
  });

  return patterns;
}

function groupMetricsByTimeOfDay(metrics: HealthMetric[]): Record<string, number[]> {
  const groups: Record<string, number[]> = {
    morning: [],
    afternoon: [],
    evening: [],
    night: []
  };
  
  metrics.forEach(metric => {
    const hour = new Date(metric.timestamp * 1000).getHours();
    if (hour >= 5 && hour < 12) groups.morning.push(metric.value);
    else if (hour >= 12 && hour < 17) groups.afternoon.push(metric.value);
    else if (hour >= 17 && hour < 22) groups.evening.push(metric.value);
    else groups.night.push(metric.value);
  });
  
  return groups;
}
