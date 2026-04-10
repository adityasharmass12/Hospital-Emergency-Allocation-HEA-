import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ShieldCheck, HeartPulse, UserCircle2, ArrowRight,
  AlertCircle, Building2, UserPlus, Lock, Mail, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/src/components/ThemeToggle';
import { useAuth } from '@/src/lib/auth';

export default function Login() {
  const [role, setRole] = useState<'patient' | 'admin'>('patient');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = (formData.get('patient_email') as string)?.trim();
    const password = (formData.get('patient_password') as string)?.trim();
    const { success, error } = await login(email, password, 'patient');
    if (success) {
      toast.success('Welcome!', { description: 'Logged in successfully.' });
      navigate('/patient');
    } else {
      toast.error('Login failed', { description: error });
    }
    setLoading(false);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = (formData.get('admin_email') as string)?.trim();
    const password = (formData.get('admin_password') as string)?.trim();
    const { success, error } = await login(email, password, 'staff');
    if (success) {
      toast.success('Welcome!', { description: 'Logged in successfully.' });
      navigate('/admin');
    } else {
      toast.error('Access denied', { description: error });
    }
    setLoading(false);
  };

  const isPatient = role === 'patient';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-500"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0c1a2e 100%)' }}>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50"><ThemeToggle /></div>

      {/* ── Rich Glassmorphism Background Orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Large center glow */}
        <div className="absolute top-[-20%] left-[-15%] w-[70vw] h-[70vw] rounded-full animate-ambient"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-20%] right-[-15%] w-[60vw] h-[60vw] rounded-full animate-ambient-slow"
          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.2) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] rounded-full animate-ambient-fast"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }} />

        {/* Fine grain noise overlay for glass texture */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />

        {/* Subtle grid lines */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10"
      >
        {/* ── LEFT PANEL — Branding ── */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.7 }}
          className="flex flex-col justify-center p-8 lg:p-12"
        >
          {/* Logo */}
          <div className="flex flex-col gap-1 mb-10">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl border border-white/10"
                style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', boxShadow: '0 0 30px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
                <Activity className="h-8 w-8 text-indigo-300" />
              </div>
              <span className="text-3xl font-display font-extrabold tracking-tight bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #a5b4fc 0%, #67e8f9 100%)' }}>
                AuraCare
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-bold tracking-[0.25em] uppercase ml-1">Powered by HEA</span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-display font-bold leading-tight mb-5"
            style={{ color: 'rgba(255,255,255,0.92)' }}>
            Welcome to the<br />
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(135deg, #818cf8 0%, #38bdf8 60%, #34d399 100%)' }}>
              future of healthcare.
            </span>
          </h1>

          <p className="text-base mb-10" style={{ color: 'rgba(148,163,184,0.9)' }}>
            AI-powered hospital management system.<br />Select your role to continue.
          </p>

          {/* Role Selector */}
          <div className="flex gap-3 mb-8">
            {[
              { key: 'patient', icon: HeartPulse, label: 'Patient', accent: '#6366f1' },
              { key: 'admin', icon: ShieldCheck, label: 'Staff / Admin', accent: '#14b8a6' },
            ].map(({ key, icon: Icon, label, accent }) => (
              <button key={key} onClick={() => setRole(key as any)}
                className="flex-1 py-4 px-5 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2"
                style={{
                  background: role === key
                    ? `rgba(${key === 'patient' ? '99,102,241' : '20,184,166'},0.15)`
                    : 'rgba(255,255,255,0.04)',
                  borderColor: role === key ? `${accent}60` : 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: role === key ? `0 0 20px ${accent}25, inset 0 1px 0 rgba(255,255,255,0.1)` : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }}>
                <Icon className="h-6 w-6" style={{ color: role === key ? accent : 'rgba(148,163,184,0.6)' }} />
                <span className="text-sm font-semibold" style={{ color: role === key ? 'rgba(255,255,255,0.95)' : 'rgba(148,163,184,0.7)' }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Hospital Registration Card */}
          <div className="p-5 rounded-2xl border"
            style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl" style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)' }}>
                <Building2 className="h-5 w-5 text-teal-400" />
              </div>
              <div>
                <h3 className="font-bold text-white/90 text-sm">For Hospitals</h3>
                <p className="text-xs" style={{ color: 'rgba(148,163,184,0.7)' }}>Join our network and manage your facility.</p>
              </div>
            </div>
            <button onClick={() => navigate('/register-hospital')}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
              Register Your Hospital <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* ── RIGHT PANEL — Login Form ── */}
        <div className="flex items-center justify-center p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={role}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="w-full max-w-md rounded-3xl overflow-hidden relative"
              style={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              {/* Top gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: isPatient
                  ? 'linear-gradient(90deg, #6366f1, #818cf8, #38bdf8)'
                  : 'linear-gradient(90deg, #14b8a6, #34d399, #6ee7b7)' }} />

              {/* Inner glass shine */}
              <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 100%)' }} />

              <div className="p-8 relative">
                {/* Header */}
                <div className="mb-8 text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                    style={{
                      background: isPatient ? 'rgba(99,102,241,0.15)' : 'rgba(20,184,166,0.15)',
                      border: `1px solid ${isPatient ? 'rgba(99,102,241,0.3)' : 'rgba(20,184,166,0.3)'}`,
                      boxShadow: `0 0 20px ${isPatient ? 'rgba(99,102,241,0.2)' : 'rgba(20,184,166,0.2)'}`,
                    }}>
                    {isPatient
                      ? <UserCircle2 className="h-8 w-8 text-indigo-300" />
                      : <ShieldCheck className="h-8 w-8 text-teal-300" />}
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white/90">
                    {isPatient ? 'Patient Portal' : 'Staff Access'}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: 'rgba(148,163,184,0.8)' }}>
                    {isPatient ? 'Access your health records and bookings' : 'Secure staff access portal'}
                  </p>
                </div>

                {/* Forms */}
                {isPatient ? (
                  <motion.form key="patient" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onSubmit={handlePatientLogin} className="space-y-4">
                    <GlassInput icon={Mail} type="email" name="patient_email" placeholder="Email Address" accent="#6366f1" />
                    <GlassInput icon={Lock} type="password" name="patient_password" placeholder="Password" accent="#6366f1" />

                    <GlassButton loading={loading} accent="#6366f1" gradient="linear-gradient(135deg, #6366f1, #4f46e5)">
                      Sign In <ArrowRight className="h-4 w-4" />
                    </GlassButton>

                    <button type="button" onClick={() => navigate('/register')}
                      className="w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)', backdropFilter: 'blur(8px)' }}>
                      <UserPlus className="h-4 w-4" /> Create Account
                    </button>

                    <button type="button"
                      onClick={() => { sessionStorage.setItem('hea_auth', 'patient'); navigate('/patient'); }}
                      className="w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }}>
                      <AlertCircle className="h-4 w-4" /> Emergency Access
                    </button>
                  </motion.form>
                ) : (
                  <motion.form key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onSubmit={handleAdminLogin} className="space-y-4">
                    <GlassInput icon={Mail} type="email" name="admin_email" placeholder="Email (admin@hea.health)" accent="#14b8a6" />
                    <GlassInput icon={Lock} type="password" name="admin_password" placeholder="Password (admin123)" accent="#14b8a6" />

                    <GlassButton loading={loading} accent="#14b8a6" gradient="linear-gradient(135deg, #14b8a6, #0d9488)">
                      Secure Login <ArrowRight className="h-4 w-4" />
                    </GlassButton>

                    <button type="button" onClick={() => navigate('/register')}
                      className="w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{ background: 'rgba(20,184,166,0.1)', color: '#5eead4', border: '1px solid rgba(20,184,166,0.25)', backdropFilter: 'blur(8px)' }}>
                      <UserPlus className="h-4 w-4" /> Create Staff Account
                    </button>

                    {/* Security badge */}
                    <div className="flex items-center justify-center gap-2 py-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
                        style={{ background: 'rgba(20,184,166,0.1)', color: '#5eead4', border: '1px solid rgba(20,184,166,0.2)' }}>
                        <Sparkles className="h-3 w-3" /> AuraCare Healthcare Platform
                      </div>
                    </div>
                  </motion.form>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ── Reusable Glass Input ──────────────────────────────────────────
function GlassInput({ icon: Icon, accent, ...props }: any) {
  return (
    <div className="relative group">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200"
        style={{ color: 'rgba(148,163,184,0.6)' }} />
      <input {...props} required
        className="w-full h-12 rounded-xl pl-11 pr-4 text-sm outline-none transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)',
        }}
        onFocus={e => {
          e.target.style.borderColor = `${accent}80`;
          e.target.style.boxShadow = `0 0 0 3px ${accent}20, inset 0 1px 0 rgba(255,255,255,0.1)`;
          e.target.style.background = 'rgba(255,255,255,0.09)';
        }}
        onBlur={e => {
          e.target.style.borderColor = 'rgba(255,255,255,0.1)';
          e.target.style.boxShadow = 'none';
          e.target.style.background = 'rgba(255,255,255,0.06)';
        }}
      />
    </div>
  );
}

// ── Reusable Glass Button ─────────────────────────────────────────
function GlassButton({ loading, accent, gradient, children }: any) {
  return (
    <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
      type="submit" disabled={loading}
      className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60"
      style={{
        background: gradient,
        color: '#fff',
        boxShadow: `0 8px 24px ${accent}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
        border: '1px solid rgba(255,255,255,0.15)',
      }}>
      {loading
        ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</div>
        : children}
    </motion.button>
  );
}
