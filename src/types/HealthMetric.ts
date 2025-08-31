export interface HealthMetric {
    id: string;
    timestamp: number;
    notes: string;
    medicines: string[];
    patientAddress: string;
    doctorAddress: string;
}

export interface AnalysisTrend {
    direction: 'increasing' | 'decreasing' | 'stable';
    rateOfChange: string;
    recentValue: number;
    averageValue: string;
}

export interface AnalysisPattern {
    type: string;
    description: string;
    significance: 'HIGH' | 'MEDIUM' | 'LOW';
    details: string;
}

export interface AnalysisRecommendation {
    type: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    details: string;
}
