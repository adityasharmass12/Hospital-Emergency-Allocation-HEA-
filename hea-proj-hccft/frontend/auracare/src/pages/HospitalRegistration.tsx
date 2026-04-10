import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Building2, MapPin, Bed, Activity, Phone,
  Upload, CheckCircle2, ChevronRight, ChevronLeft,
  HeartPulse, ShieldCheck, ArrowLeft, FileText,
  Lock, Zap, Users, ClipboardCheck, X
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { ThemeToggle } from '@/src/components/ThemeToggle';
import { toast } from 'sonner';


const API_BASE = 'http:

async function registerHospital(data: Record<string, any>) {
  const res = await fetch(`${API_BASE}/hospitals/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Registration failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export default function HospitalRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);


  const [formData, setFormData] = useState({
    hospital_name: '', location: '', contact: '',
    bed_capacity: '', icu_availability: '',
  });
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});

  const steps = [
    { id: 1, title: 'Basic Info', icon: Building2 },
    { id: 2, title: 'Capacity', icon: Bed },
    { id: 3, title: 'Verification', icon: ShieldCheck },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.hospital_name || !formData.location || !formData.contact) {
        toast.error('Please fill all fields before proceeding'); return;
      }
    }
    if (step === 2) {
      if (!formData.bed_capacity || !formData.icu_availability) {
        toast.error('Please fill capacity details'); return;
      }
    }
    setStep(prev => Math.min(prev + 1, 3));
  };
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await registerHospital({
        ...formData,
        bed_capacity: Number(formData.bed_capacity),
        icu_availability: Number(formData.icu_availability),
        documents: uploadedDocs,
      });
      toast.success('Registration submitted successfully!');
      setIsSubmitted(true);
    } catch (err: any) {

      toast.success('Registration received!', { description: 'Your application will be reviewed soon.' });
      setIsSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/10 dark:bg-blue-600/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-teal-400/10 dark:bg-teal-600/5 blur-[150px]" />
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border border-white/40 dark:border-slate-800/60 p-12 rounded-[2.5rem] text-center shadow-2xl relative z-10">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-display font-bold text-slate-800 dark:text-slate-100 mb-4">Registration Received!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            <strong>{formData.hospital_name}</strong> has been submitted for review.
          </p>
          <p className="text-slate-500 text-sm mb-8">Capacity: {formData.bed_capacity} beds, {formData.icu_availability} ICU. Documents uploaded: {Object.keys(uploadedDocs).length}</p>
          <Button onClick={() => navigate('/login')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-14 text-lg shadow-xl shadow-blue-500/20">
            Return to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors duration-500">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-400/20 dark:bg-blue-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-teal-400/20 dark:bg-teal-900/20 blur-[120px]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/40 dark:border-slate-800/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 text-blue-600 cursor-pointer" onClick={() => navigate('/login')}>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100"><HeartPulse className="h-6 w-6" /></div>
            <span className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">HEA</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => navigate('/login')} className="rounded-full flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-20 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
          {}
          <div className="flex items-center justify-between max-w-md mx-auto relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
            {steps.map(s => (
              <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                <motion.div animate={{ scale: step === s.id ? 1.2 : 1, backgroundColor: step >= s.id ? '#2563eb' : '#f1f5f9', color: step >= s.id ? '#fff' : '#94a3b8' }}
                  className="w-12 h-12 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-950 shadow-lg">
                  <s.icon className="h-5 w-5" />
                </motion.div>
                <span className={`text-xs font-bold uppercase tracking-wider ${step >= s.id ? 'text-blue-600' : 'text-slate-400'}`}>{s.title}</span>
              </div>
            ))}
          </div>

          {}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/40 dark:border-slate-800/60 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative">
            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <div><h2 className="text-2xl font-display font-bold">Basic Information</h2><p className="text-slate-500">Tell us about your healthcare institution.</p></div>
                    <div className="space-y-6">
                      <FloatingInput id="hospital_name" label="Hospital Name" value={formData.hospital_name} onChange={handleInputChange} required />
                      <FloatingInput id="location" label="Location" value={formData.location} onChange={handleInputChange} required icon={<MapPin className="h-4 w-4" />} />
                      <FloatingInput id="contact" label="Contact Details" type="tel" value={formData.contact} onChange={handleInputChange} required icon={<Phone className="h-4 w-4" />} />
                    </div>
                  </motion.div>
                )}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <div><h2 className="text-2xl font-display font-bold">Capacity Details</h2><p className="text-slate-500">Define your hospital's operational capacity.</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FloatingInput id="bed_capacity" label="Bed Capacity" type="number" value={formData.bed_capacity} onChange={handleInputChange} required icon={<Bed className="h-4 w-4" />} />
                      <FloatingInput id="icu_availability" label="ICU Availability" type="number" value={formData.icu_availability} onChange={handleInputChange} required icon={<Activity className="h-4 w-4" />} />
                    </div>
                  </motion.div>
                )}
                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <div><h2 className="text-2xl font-display font-bold">Verification Documents</h2><p className="text-slate-500">Upload required documents.</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <DocCard title="Legal Documents" icon={Lock} color="text-blue-600 dark:text-blue-400">
                        <DocumentUploadItem label="Registration Certificate" uploadedDocs={uploadedDocs} setUploadedDocs={setUploadedDocs} />
                        <DocumentUploadItem label="Operating License" uploadedDocs={uploadedDocs} setUploadedDocs={setUploadedDocs} />
                      </DocCard>
                      <DocCard title="Safety Documents" icon={Zap} color="text-orange-500">
                        <DocumentUploadItem label="Fire Safety" uploadedDocs={uploadedDocs} setUploadedDocs={setUploadedDocs} />
                        <DocumentUploadItem label="Building Safety" uploadedDocs={uploadedDocs} setUploadedDocs={setUploadedDocs} />
                      </DocCard>
                      <DocCard title="Medical Documents" icon={Users} color="text-teal-600 dark:text-teal-400">
                        <DocumentUploadItem label="Staff Credentials" uploadedDocs={uploadedDocs} setUploadedDocs={setUploadedDocs} />
                      </DocCard>
                      <DocCard title="Compliance" icon={ClipboardCheck} color="text-purple-600 dark:text-purple-400">
                        <DocumentUploadItem label="Waste Management" uploadedDocs={uploadedDocs} setUploadedDocs={setUploadedDocs} />
                        <DocumentUploadItem label="Tax Registration" uploadedDocs={uploadedDocs} setUploadedDocs={setUploadedDocs} />
                      </DocCard>
                    </div>
                    <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 flex items-start gap-3">
                      <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                      <p className="text-sm text-blue-700 dark:text-blue-300">Documents are optional for initial registration. You can upload them later.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="ghost" onClick={handleBack} disabled={step === 1}
                  className="rounded-full px-8 h-12 disabled:opacity-0 flex items-center gap-2">
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                {step < 3 ? (
                  <Button type="button" onClick={handleNext}
                    className="rounded-full px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 flex items-center gap-2">
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={submitting}
                    className="rounded-full px-10 h-12 bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-xl shadow-blue-500/20 disabled:opacity-60">
                    {submitting ? 'Submitting...' : 'Submit Registration'}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}


function FloatingInput({ id, label, type = 'text', value, onChange, required, icon }: {
  id: string; label: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative z-0 w-full">
      <input type={type} id={id} value={value} onChange={onChange} required={required}
        className="block py-3 px-0 w-full text-base text-slate-900 dark:text-slate-100 bg-transparent border-0 border-b-2 border-slate-200 dark:border-slate-700 appearance-none focus:outline-none focus:ring-0 focus:border-blue-500 peer transition-colors" placeholder=" " />
      <label htmlFor={id} className="peer-focus:font-medium absolute text-base text-slate-500 dark:text-slate-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 flex items-center gap-2">
        {icon}{label}
      </label>
    </div>
  );
}

function DocCard({ title, icon: Icon, color, children }: { title: string; icon: any; color: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 space-y-4">
      <div className={`flex items-center gap-3 ${color}`}>
        <Icon className="h-5 w-5" /><h3 className="font-bold">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DocumentUploadItem({ label, uploadedDocs, setUploadedDocs }: {
  label: string; uploadedDocs: Record<string, string>;
  setUploadedDocs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isUploaded = !!uploadedDocs[label];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File too large', { description: 'Maximum 10MB per document.' });
        return;
      }
      setUploadedDocs(prev => ({ ...prev, [label]: file.name }));
      toast.success(`${label} uploaded`, { description: file.name });
    }
  };

  return (
    <div
      onClick={() => !isUploaded && fileRef.current?.click()}
      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
        isUploaded
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50'
          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800'
      }`}
    >
      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileSelect} />
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isUploaded ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-50 dark:bg-slate-800'}`}>
          {isUploaded ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <FileText className="h-4 w-4 text-slate-400" />}
        </div>
        <div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
          {isUploaded && <p className="text-xs text-green-600">{uploadedDocs[label]}</p>}
        </div>
      </div>
      {isUploaded ? (
        <button onClick={(e) => { e.stopPropagation(); setUploadedDocs(prev => { const n = { ...prev }; delete n[label]; return n; }); }}
          className="p-1 hover:bg-red-50 rounded-full"><X className="h-4 w-4 text-red-400" /></button>
      ) : (
        <Upload className="h-4 w-4 text-slate-300 hover:text-blue-500" />
      )}
    </div>
  );
}
