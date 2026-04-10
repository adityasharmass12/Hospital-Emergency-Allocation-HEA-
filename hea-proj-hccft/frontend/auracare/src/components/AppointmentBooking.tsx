import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Clock, User, Phone, Mail, MapPin, AlertCircle, 
  CheckCircle2, Stethoscope, Heart, FileText, X, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { bookAppointment } from '@/src/lib/api';

interface AppointmentFormData {
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  patient_age: string;
  patient_gender: string;
  patient_address: string;
  patient_city: string;
  patient_state: string;
  patient_zip: string;
  medical_history: string;
  allergies: string;
  current_medications: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  specialty: string;
  reason_for_visit: string;
  insurance_provider: string;
  insurance_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

const INITIAL_FORM: AppointmentFormData = {
  patient_name: '',
  patient_email: '',
  patient_phone: '',
  patient_age: '',
  patient_gender: '',
  patient_address: '',
  patient_city: '',
  patient_state: '',
  patient_zip: '',
  medical_history: '',
  allergies: '',
  current_medications: '',
  appointment_date: '',
  appointment_time: '',
  appointment_type: 'routine',
  specialty: 'general',
  reason_for_visit: '',
  insurance_provider: '',
  insurance_id: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
};

const SPECIALTIES = [
  'General Medicine',
  'Cardiology',
  'Orthopedics',
  'Neurology',
  'Pediatrics',
  'Psychiatry',
  'Dermatology',
  'ENT',
  'Ophthalmology',
  'Dentistry',
  'Physiotherapy',
  'Other',
];

const APPOINTMENT_TYPES = [
  'Routine Checkup',
  'Follow-up',
  'Consultation',
  'Diagnostic Test',
  'Vaccination',
  'Minor Procedure',
];

const BG = 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 40%,#0c1a2e 100%)';
const CARD = { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px) saturate(160%)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)' };

interface AppointmentBookingProps {
  onClose?: () => void;
  userPhone?: string;
  userName?: string;
}

export default function AppointmentBooking({ onClose, userPhone = '', userName = '' }: AppointmentBookingProps) {
  const [formData, setFormData] = useState<AppointmentFormData>({
    ...INITIAL_FORM,
    patient_phone: userPhone,
    patient_name: userName,
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [appointmentId, setAppointmentId] = useState<number | null>(null);
  const [hospitalInfo, setHospitalInfo] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      const required = ['patient_name', 'patient_phone', 'patient_age', 'patient_gender'];
      for (let field of required) {
        if (!formData[field as keyof AppointmentFormData]) {
          toast.error(`Please fill in ${field.replace(/_/g, ' ')}`);
          return false;
        }
      }
      const age = parseInt(formData.patient_age);
      if (isNaN(age) || age <= 0 || age > 150) {
        toast.error('Age must be between 1 and 150');
        return false;
      }
    } else if (currentStep === 2) {
      const required = ['appointment_date', 'appointment_time', 'appointment_type', 'specialty', 'reason_for_visit'];
      for (let field of required) {
        if (!formData[field as keyof AppointmentFormData]) {
          toast.error(`Please fill in ${field.replace(/_/g, ' ')}`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(2)) return;

    setLoading(true);
    try {
      const result = await bookAppointment({
        patient_name: formData.patient_name,
        patient_email: formData.patient_email || undefined,
        patient_phone: formData.patient_phone,
        patient_age: parseInt(formData.patient_age),
        patient_gender: formData.patient_gender,
        patient_address: formData.patient_address || undefined,
        patient_city: formData.patient_city || undefined,
        patient_state: formData.patient_state || undefined,
        patient_zip: formData.patient_zip || undefined,
        medical_history: formData.medical_history || undefined,
        allergies: formData.allergies || undefined,
        current_medications: formData.current_medications || undefined,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        appointment_type: formData.appointment_type,
        specialty: formData.specialty,
        reason_for_visit: formData.reason_for_visit,
        insurance_provider: formData.insurance_provider || undefined,
        insurance_id: formData.insurance_id || undefined,
        emergency_contact_name: formData.emergency_contact_name || undefined,
        emergency_contact_phone: formData.emergency_contact_phone || undefined,
      });

      setAppointmentId(result.appointment_id);
      setHospitalInfo(result.hospital_info);
      setResponseMessage(result.message);
      setBookingSuccess(true);
      toast.success('Appointment booked successfully!');
      
      // Reset form after 4 seconds if instant booking
      const delay = result.hospital_info?.is_available ? 3000 : 4000;
      setTimeout(() => {
        setFormData({
          ...INITIAL_FORM,
          patient_phone: userPhone,
          patient_name: userName,
        });
        setStep(1);
        setBookingSuccess(false);
        setAppointmentId(null);
        setHospitalInfo(null);
        if (onClose) onClose();
      }, delay);
    } catch (err: any) {
      toast.error('Booking failed', { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (bookingSuccess && appointmentId) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full rounded-3xl p-8 text-center space-y-6"
          style={CARD}
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
            style={{ background: hospitalInfo?.is_available ? 'linear-gradient(135deg,#34d399,#10b981)' : 'linear-gradient(135deg,#fbbf24,#f59e0b)' }}
          >
            <CheckCircle2 className="h-10 w-10 text-white" />
          </motion.div>

          {/* Title and Message */}
          <div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {hospitalInfo?.is_available ? 'Appointment Confirmed!' : 'Appointment Requested!'}
            </h3>
            <p style={{ color: 'rgba(148,163,184,0.7)' }} className="text-sm">
              {responseMessage}
            </p>
          </div>

          {/* Confirmation ID */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-4">
            <p className="text-sm font-mono text-emerald-400 mb-2">Confirmation ID</p>
            <p className="text-2xl font-bold text-white">{appointmentId}</p>
          </div>

          {/* Hospital Info - if available */}
          {hospitalInfo?.hospital_name && (
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-4">
              <p className="text-sm font-semibold mb-2 flex items-center justify-center gap-2" style={{ color: '#60a5fa' }}>
                <span>🏥</span> Hospital Assignment
              </p>
              <p className="text-lg font-bold text-white" style={{ color: hospitalInfo?.is_available ? '#86efac' : '#fbbf24' }}>
                {hospitalInfo.hospital_name}
              </p>
              {hospitalInfo?.suggested_time && !hospitalInfo?.is_available && (
                <p className="text-xs mt-3 p-2 bg-amber-500/20 rounded text-amber-300">
                  Suggested time: {hospitalInfo.suggested_time}
                </p>
              )}
              {hospitalInfo?.is_available && (
                <p className="text-xs mt-3 p-2 bg-emerald-500/20 rounded text-emerald-300">
                  ⚡ Instant booking confirmed
                </p>
              )}
            </div>
          )}

          {/* Additional Info */}
          <p style={{ color: 'rgba(148,163,184,0.6)' }} className="text-xs pt-2">
            You will receive a confirmation email with all appointment details. Please arrive 10 minutes early.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen font-sans relative overflow-hidden" style={{ background: BG }}>
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="fixed top-6 right-6 z-50 p-2 rounded-full transition-all"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
        >
          <X className="h-6 w-6" />
        </button>
      )}

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[60vw] h-[60vw] rounded-full animate-ambient"
          style={{ background: 'radial-gradient(circle,rgba(34,197,94,0.2) 0%,transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full animate-ambient-slow"
          style={{ background: 'radial-gradient(circle,rgba(20,184,166,0.16) 0%,transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <main className="relative z-10 pt-12 pb-12">
        <div className="max-w-3xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
              style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', backdropFilter: 'blur(12px)' }}>
              <Calendar className="h-4 w-4" /> Book Appointment
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tighter leading-[0.9] mb-4">
              <span style={{ color: 'rgba(255,255,255,0.92)' }}>Schedule Your </span>
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg,#22c55e,#10b981)' }}>Appointment</span>
            </h1>
            <p style={{ color: 'rgba(148,163,184,0.85)' }} className="text-lg">
              Book a non-emergency appointment with all necessary details for your visit
            </p>
          </motion.div>

          {/* Progress indicators */}
          <div className="flex justify-center gap-4 mb-12">
            {[1, 2, 3].map((s) => (
              <motion.div
                key={s}
                className="flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all"
                  style={{
                    background: s <= step ? 'linear-gradient(135deg,#22c55e,#10b981)' : 'rgba(255,255,255,0.1)',
                    color: s <= step ? 'white' : 'rgba(148,163,184,0.6)',
                    border: '2px solid ' + (s <= step ? 'transparent' : 'rgba(255,255,255,0.15)'),
                  }}
                >
                  {s === 3 ? <FileText className="h-5 w-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className="w-12 h-1 mx-2 rounded-full transition-all"
                    style={{
                      background: s < step ? 'linear-gradient(90deg,#22c55e,#10b981)' : 'rgba(255,255,255,0.1)',
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Form Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl overflow-hidden"
            style={CARD}
          >
            <div className="p-8 md:p-12">
              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  {/* Step 1: Personal Information */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-2xl font-bold mb-8" style={{ color: 'rgba(255,255,255,0.92)' }}>
                        Personal Information
                      </h2>

                      <div className="space-y-6">
                        {/* Name */}
                        <div>
                          <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                            <User className="inline h-4 w-4 mr-2" />Full Name *
                          </label>
                          <input
                            type="text"
                            name="patient_name"
                            value={formData.patient_name}
                            onChange={handleInputChange}
                            placeholder="Enter your full name"
                            className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: 'rgba(255,255,255,0.9)',
                            }}
                            onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; }}
                            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                          />
                        </div>

                        {/* Age & Gender */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                              Age *
                            </label>
                            <input
                              type="number"
                              name="patient_age"
                              value={formData.patient_age}
                              onChange={handleInputChange}
                              placeholder="Age"
                              min="1"
                              max="150"
                              className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.9)',
                              }}
                              onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; }}
                              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                              Gender *
                            </label>
                            <select
                              name="patient_gender"
                              value={formData.patient_gender}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.9)',
                              }}
                              onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; }}
                              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                            >
                              <option value="">Select</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>

                        {/* Phone & Email */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                              <Phone className="inline h-4 w-4 mr-2" />Phone *
                            </label>
                            <input
                              type="tel"
                              name="patient_phone"
                              value={formData.patient_phone}
                              onChange={handleInputChange}
                              placeholder="Your phone number"
                              className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.9)',
                              }}
                              onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; }}
                              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                              <Mail className="inline h-4 w-4 mr-2" />Email
                            </label>
                            <input
                              type="email"
                              name="patient_email"
                              value={formData.patient_email}
                              onChange={handleInputChange}
                              placeholder="Your email"
                              className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.9)',
                              }}
                              onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; }}
                              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                            />
                          </div>
                        </div>

                        {/* Address Details - Optional */}
                        <div className="pt-4 border-t border-white/10">
                          <p className="text-sm font-semibold mb-4" style={{ color: 'rgba(148,163,184,0.8)' }}>
                            Address (Optional)
                          </p>
                          <div>
                            <input
                              type="text"
                              name="patient_address"
                              value={formData.patient_address}
                              onChange={handleInputChange}
                              placeholder="Street address"
                              className="w-full px-4 py-3 rounded-xl outline-none transition-all mb-3"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.9)',
                              }}
                              onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; }}
                              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <input
                              type="text"
                              name="patient_city"
                              value={formData.patient_city}
                              onChange={handleInputChange}
                              placeholder="City"
                              className="px-4 py-3 rounded-xl outline-none transition-all"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.9)',
                              }}
                            />
                            <input
                              type="text"
                              name="patient_state"
                              value={formData.patient_state}
                              onChange={handleInputChange}
                              placeholder="State"
                              className="px-4 py-3 rounded-xl outline-none transition-all"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.9)',
                              }}
                            />
                            <input
                              type="text"
                              name="patient_zip"
                              value={formData.patient_zip}
                              onChange={handleInputChange}
                              placeholder="ZIP"
                              className="px-4 py-3 rounded-xl outline-none transition-all"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.9)',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Appointment Details */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-2xl font-bold mb-8" style={{ color: 'rgba(255,255,255,0.92)' }}>
                        Appointment Details
                      </h2>

                      <div className="space-y-6">
                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                              <Calendar className="inline h-4 w-4 mr-2" />Date *
                            </label>
                            <input
                              type="date"
                              name="appointment_date"
                              value={formData.appointment_date}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.9)',
                              }}
                              onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; }}
                              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                              <Clock className="inline h-4 w-4 mr-2" />Time *
                            </label>
                            <input
                              type="time"
                              name="appointment_time"
                              value={formData.appointment_time}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.9)',
                              }}
                              onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; }}
                              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                            />
                          </div>
                        </div>

                        {/* Type & Specialty */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                              <Heart className="inline h-4 w-4 mr-2" />Type *
                            </label>
                            <select
                              name="appointment_type"
                              value={formData.appointment_type}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.9)',
                              }}
                              onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; }}
                              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                            >
                              {APPOINTMENT_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                              <Stethoscope className="inline h-4 w-4 mr-2" />Specialty *
                            </label>
                            <select
                              name="specialty"
                              value={formData.specialty}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.9)',
                              }}
                              onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; }}
                              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                            >
                              <option value="">Select specialty</option>
                              {SPECIALTIES.map(spec => (
                                <option key={spec} value={spec}>{spec}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Reason for Visit */}
                        <div>
                          <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                            Reason for Visit *
                          </label>
                          <textarea
                            name="reason_for_visit"
                            value={formData.reason_for_visit}
                            onChange={handleInputChange}
                            placeholder="Describe your symptoms or reason for visiting"
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl outline-none transition-all resize-none"
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: 'rgba(255,255,255,0.9)',
                            }}
                            onFocus={e => { e.target.style.borderColor = 'rgba(34,197,94,0.5)'; }}
                            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                          />
                        </div>

                        {/* Medical History */}
                        <div>
                          <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                            Medical History (Optional)
                          </label>
                          <textarea
                            name="medical_history"
                            value={formData.medical_history}
                            onChange={handleInputChange}
                            placeholder="Any previous medical conditions or surgeries"
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl outline-none transition-all resize-none"
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: 'rgba(255,255,255,0.9)',
                            }}
                          />
                        </div>

                        {/* Allergies & Medications */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                              Allergies
                            </label>
                            <textarea
                              name="allergies"
                              value={formData.allergies}
                              onChange={handleInputChange}
                              placeholder="Any allergies"
                              rows={2}
                              className="w-full px-4 py-3 rounded-xl outline-none transition-all resize-none"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.9)',
                              }}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>
                              Current Medications
                            </label>
                            <textarea
                              name="current_medications"
                              value={formData.current_medications}
                              onChange={handleInputChange}
                              placeholder="Any current medications"
                              rows={2}
                              className="w-full px-4 py-3 rounded-xl outline-none transition-all resize-none"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.9)',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Insurance & Emergency Contact */}
                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h2 className="text-2xl font-bold mb-8" style={{ color: 'rgba(255,255,255,0.92)' }}>
                        Insurance & Emergency Contact
                      </h2>

                      <div className="space-y-6">
                        {/* Insurance */}
                        <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <p className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>Insurance Information</p>
                          <div className="grid grid-cols-2 gap-4">
                            <input
                              type="text"
                              name="insurance_provider"
                              value={formData.insurance_provider}
                              onChange={handleInputChange}
                              placeholder="Insurance provider"
                              className="px-4 py-3 rounded-xl outline-none transition-all"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.9)',
                              }}
                            />
                            <input
                              type="text"
                              name="insurance_id"
                              value={formData.insurance_id}
                              onChange={handleInputChange}
                              placeholder="Insurance ID"
                              className="px-4 py-3 rounded-xl outline-none transition-all"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.9)',
                              }}
                            />
                          </div>
                        </div>

                        {/* Emergency Contact */}
                        <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <p className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.8)' }}>Emergency Contact</p>
                          <div className="grid grid-cols-2 gap-4">
                            <input
                              type="text"
                              name="emergency_contact_name"
                              value={formData.emergency_contact_name}
                              onChange={handleInputChange}
                              placeholder="Contact person name"
                              className="px-4 py-3 rounded-xl outline-none transition-all"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.9)',
                              }}
                            />
                            <input
                              type="tel"
                              name="emergency_contact_phone"
                              value={formData.emergency_contact_phone}
                              onChange={handleInputChange}
                              placeholder="Contact phone"
                              className="px-4 py-3 rounded-xl outline-none transition-all"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.9)',
                              }}
                            />
                          </div>
                        </div>

                        {/* Terms & Review */}
                        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4 flex gap-3">
                          <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: '#fbbf24' }} />
                          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            Please review all details carefully before submitting. You'll receive a confirmation with your appointment ID.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex gap-4 mt-12 pt-8 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={step === 1}
                    className="flex-1 py-4 px-6 rounded-xl font-bold transition-all disabled:opacity-50"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.9)',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                    onMouseEnter={e => { !((e.target as HTMLButtonElement).disabled) && (e.currentTarget.style.background = 'rgba(255,255,255,0.12)'); }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  >
                    Previous
                  </button>

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 py-4 px-6 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg,#22c55e,#10b981)',
                        boxShadow: '0 12px 32px rgba(34,197,94,0.45)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      Next <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-4 px-6 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg,#22c55e,#10b981)',
                        boxShadow: '0 12px 32px rgba(34,197,94,0.45)',
                      }}
                      onMouseEnter={e => { !((e.target as HTMLButtonElement).disabled) && (e.currentTarget.style.transform = 'translateY(-2px)'); }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      {loading ? 'Booking...' : (<><CheckCircle2 className="h-4 w-4" /> Book Appointment</>)}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
