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
