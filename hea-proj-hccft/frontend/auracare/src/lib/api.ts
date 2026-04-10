/**
 * api.ts — HEA Backend API Service
 * Connects HEA frontend to Flask backend at localhost:5000
 */

export const API_BASE = 'http://localhost:5000/api';

// ── Types ──────────────────────────────────────────────────────────
export interface BedSummary {
  ward: string;
  total: number;
  occupied: number;
  available: number;
  maintenance: number;
}

export interface Bed {
  id: number;
  bed_number: string;
  ward: string;
  status: 'available' | 'occupied' | 'maintenance';
  patient_id?: number;
}

export interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  condition: string;
  priority: 'normal' | 'urgent' | 'critical';
  ward: string;
  bed_number?: string;
  admitted_at: string;
}

export interface Resource {
  id: number;
  name: string;
  category: string;
  total: number;
  available: number;
}

export interface Alert {
  id: number;
  level: 'critical' | 'warning' | 'info';
  message: string;
  created_at: string;
}

export interface ForecastDay {
  day: string;
  date: string;
  predicted_admissions: number;
  predicted_emergency: number;
  predicted_icu: number;
  is_holiday: boolean;
  surge_alert: boolean;
  model_used: string;
}

export interface DashboardData {
  bed_summary: BedSummary[];
  patient_stats: { total_active: number; urgent: number; admitted_today: number };
  resources: Resource[];
  alerts: Alert[];
  occupancy_rate: number;
}

export interface StaffMember {
  id: number;
  name: string;
  role: string;
  ward: string;
  shift: string;
  on_duty: number;
  /** @deprecated alias kept for backward compat */
  department?: string;
  /** @deprecated alias kept for backward compat */
  status?: string;
}

export interface AuditLog {
  id: number;
  action: string;
  details: string;
  performed_by: string;
  timestamp: string;
}

export interface NearbyHospital {
  id: number;
  name: string;
  address: string;
  distance_km: number;
  latitude: number;
  longitude: number;
  phone: string;
  type: string;
  rating: number;
  total_beds: number;
  available_beds: number;
  icu_total: number;
  icu_available: number;
  emergency_total: number;
  emergency_available: number;
  general_total: number;
  general_available: number;
  has_ambulance: number;
  is_open_24h: number;
}

export interface RegisteredHospital {
  id: number;
  name: string;
  location: string;
  contact: string;
  bed_capacity: number;
  icu_availability: number;
  status: 'pending' | 'approved' | 'rejected';
  registered_at: string;
}

export interface Insight {
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  action: string;
}

export interface Appointment {
  id: number;
  patient_name: string;
  patient_email?: string;
  patient_phone: string;
  patient_age: number;
  patient_gender: string;
  patient_address?: string;
  patient_city?: string;
  patient_state?: string;
  patient_zip?: string;
  medical_history?: string;
  allergies?: string;
  current_medications?: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  specialty: string;
  reason_for_visit: string;
  insurance_provider?: string;
  insurance_id?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  booked_at: string;
  confirmed_at?: string;
  completed_at?: string;
  notes?: string;
  hospital_id?: number;
  hospital_name?: string;
  availability_status?: string;
  available_at_requested_time?: boolean;
  suggested_time?: string;
}

export interface AppointmentStats {
  total_appointments: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

// ── API Functions ───────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('hea_access_token');
  const headers: Record<string, string> = { 
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const getDashboard = () => apiFetch<DashboardData>('/dashboard');
export const getBeds = () => apiFetch<Bed[]>('/beds');
export const getBedSummary = () => apiFetch<BedSummary[]>('/beds/summary');
export const getPatients = () => apiFetch<Patient[]>('/patients');
export const getResources = () => apiFetch<Resource[]>('/resources');
export const getAlerts = () => apiFetch<Alert[]>('/alerts');
export const getForecast = () => apiFetch<ForecastDay[]>('/forecast');
export const getInsights = () => apiFetch<Insight[]>('/insights');
export const getStaff = () => apiFetch<StaffMember[]>('/staff');
export const getAuditLog = () => apiFetch<AuditLog[]>('/reports/audit');
export const checkHealth = () => apiFetch<{ status: string }>('/health');
export const getNearbyHospitals = (params?: {
  lat?: number;
  lng?: number;
  radius_km?: number;
}) => {
  const qs = params
    ? '?' + new URLSearchParams(
        Object.entries({lat: params.lat, lng: params.lng, radius_km: params.radius_km})
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';
  return apiFetch<NearbyHospital[]>(`/nearby-hospitals${qs}`);
};
export const getRegisteredHospitals = () => apiFetch<RegisteredHospital[]>('/hospitals');

export const admitPatient = (data: {
  name: string; age: number; gender: string;
  condition: string; priority: string; ward?: string;
}) => apiFetch<{ message: string; bed?: Bed; hospital?: NearbyHospital }>('/patients/admit', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const dischargePatient = (id: number) =>
  apiFetch<{ message: string }>(`/patients/${id}/discharge`, { method: 'POST' });

export const updateBedStatus = (id: number, status: string) =>
  apiFetch<{ message: string }>(`/beds/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });

export const updateWardCapacity = (ward: string, total: number) =>
  apiFetch<{ message: string }>('/wards/capacity', {
    method: 'POST',
    body: JSON.stringify({ ward, total }),
  });

export const sendChat = (query: string, context: 'admin' | 'patient' | 'staff' = 'admin', session_id: string = 'default') =>
  apiFetch<{ response: string }>('/chat', {
    method: 'POST',
    body: JSON.stringify({ query, context, session_id }),
  });

// ─── APPOINTMENTS (Non-Emergency Booking) ──────────────────────────
export const bookAppointment = (data: {
  patient_name: string;
  patient_email?: string;
  patient_phone: string;
  patient_age: number;
  patient_gender: string;
  patient_address?: string;
  patient_city?: string;
  patient_state?: string;
  patient_zip?: string;
  medical_history?: string;
  allergies?: string;
  current_medications?: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  specialty: string;
  reason_for_visit: string;
  insurance_provider?: string;
  insurance_id?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}) => apiFetch<{ message: string; appointment_id: number; appointment: Appointment; hospital_info: { hospital_name: string; hospital_id: number; is_available: boolean; suggested_time?: string } }>('/appointments', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const getAppointments = (status?: string) => {
  const qs = status ? `?status=${status}` : '';
  return apiFetch<Appointment[]>(`/appointments${qs}`);
};

export const getPatientAppointments = (phone: string) =>
  apiFetch<Appointment[]>(`/appointments/patient/${phone}`);

export const getAppointmentById = (id: number) =>
  apiFetch<Appointment>(`/appointments/${id}`);

export const getAppointmentStats = () =>
  apiFetch<AppointmentStats>('/appointments/stats');

export const confirmAppointment = (id: number) =>
  apiFetch<{ message: string }>(`/appointments/${id}/confirm`, { method: 'POST' });

export const cancelAppointment = (id: number, reason?: string) =>
  apiFetch<{ message: string }>(`/appointments/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || '' }),
  });

export const completeAppointment = (id: number, notes?: string) =>
  apiFetch<{ message: string }>(`/appointments/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({ notes: notes || '' }),
  });

export const downloadPDFReport = async () => {
  const res = await fetch(`${API_BASE}/reports/pdf`);
  if (!res.ok) throw new Error('Failed to generate PDF');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'HEA_Report.pdf';
  a.click();
  URL.revokeObjectURL(url);
};
