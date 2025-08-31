export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export interface Appointment {
  id: number;
  patientAadhar: string;
  timestamp: number;
  status: AppointmentStatus;
  contactEmail: string;
  contactPhone: string;
  notes: string;
  department: string;
  doctorName: string;
  patientName: string;
}
