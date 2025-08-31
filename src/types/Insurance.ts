export interface InsurancePlan {
    id: string;
    policyNumber: string;
    provider: string;
    planName: string;
    coverageAmount: number;
    startDate: string;
    endDate: string;
    status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
    coverageDetails: {
        hospitalCoverage: boolean;
        medicineCoverage: boolean;
        accidentCoverage: boolean;
        criticalIllnessCoverage: boolean;
    };
    premiumAmount: number;
    nextPremiumDate: string;
    beneficiaries: string[];
}
