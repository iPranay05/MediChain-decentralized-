export interface Prescription {
  id: number;
  patientAadhar: string;
  diagnosis: string;
  medication: string;
  dosage: string;
  notes: string;
  timestamp: number;
}
