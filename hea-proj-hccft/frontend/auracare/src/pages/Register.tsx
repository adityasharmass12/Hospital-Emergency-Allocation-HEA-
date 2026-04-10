import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ShieldCheck, HeartPulse, UserCircle2, ArrowRight, ArrowLeft,
  Eye, EyeOff, CheckCircle2, XCircle, Lock, Mail, Phone, User as UserIcon,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/src/components/ThemeToggle';
import { useAuth } from '@/src/lib/auth';

function getPasswordStrength(pwd: string) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 2) return { score, label: 'Weak', color: '#ef4444' };
  if (score <= 4) return { score, label: 'Medium', color: '#f59e0b' };
  return { score, label: 'Strong', color: '#10b981' };
}

const passwordRules = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
];

export default function Register() {
  const [role, setRole] = useState<'patient' | 'admin'>('patient');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();

  const strength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const isPatient = role === 'patient';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const full_name = (formData.get('full_name') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    const phone = (formData.get('phone') as string)?.trim();

    if (!full_name || !email) { toast.error('Please fill in all required fields'); setLoading(false); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); setLoading(false); return; }

    const { success, error } = await register({ full_name, email, password, phone, role });

    if (success) {
      toast.success('Account created!', {
        description: 'Welcome to AuraCare. Redirecting you now…',
        icon: <Sparkles className="h-5 w-5 text-indigo-400" />,
      });
      setTimeout(() => {
        const storedUser = localStorage.getItem('hea_user');
        const user = storedUser ? JSON.parse(storedUser) : null;
        navigate(user?.role === 'patient' ? '/patient' : '/admin');
      }, 800);
    } else {
      toast.error('Registration failed', { description: error });
    }
    setLoading(false);
  };

  const accentColor = isPatient ? '#6366f1' : '#14b8a6';
  const accentGradient = isPatient
    ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
    : 'linear-gradient(135deg, #14b8a6, #0d9488)';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0c1a2e 100%)' }}>

      <div className="absolute top-6 right-6 z-50"><ThemeToggle /></div>

      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-15%] w-[65vw] h-[65vw] rounded-full animate-ambient"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-[-20%] left-[-15%] w-[55vw] h-[55vw] rounded-full animate-ambient-slow"
          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.18) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-[40%] right-[30%] w-[40vw] h-[40vw] rounded-full animate-ambient-fast"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10"
      >
        {/* ── LEFT — Branding ── */}
        <div className="flex flex-col justify-center p-8 lg:p-12">
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

          <h1 className="text-4xl lg:text-5xl font-display font-bold leading-tight mb-5 text-white/90">
            Create your account.
          </h1>
          <p className="text-base mb-10" style={{ color: 'rgba(148,163,184,0.9)' }}>
            Join thousands on AuraCare's AI-powered<br />hospital management network.
          </p>

          {/* Role Selector */}
          <div className="flex gap-3 mb-8">
            {[
              { key: 'patient', icon: HeartPulse, label: 'Patient', accent: '#6366f1' },
              { key: 'admin', icon: ShieldCheck, label: 'Staff / Admin', accent: '#14b8a6' },
            ].map(({ key, icon: Icon, label, accent }) => (
              <button key={key} onClick={() => setRole(key as any)}
                className="flex-1 py-4 px-5 rounded-2xl border flex flex-col items-center gap-2 transition-all duration-300"
                style={{
                  background: role === key ? `rgba(${key === 'patient' ? '99,102,241' : '20,184,166'},0.15)` : 'rgba(255,255,255,0.04)',
                  borderColor: role === key ? `${accent}60` : 'rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: role === key ? `0 0 20px ${accent}25, inset 0 1px 0 rgba(255,255,255,0.1)` : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }}>
                <Icon className="h-6 w-6" style={{ color: role === key ? accent : 'rgba(148,163,184,0.5)' }} />
                <span className="text-sm font-semibold" style={{ color: role === key ? 'rgba(255,255,255,0.95)' : 'rgba(148,163,184,0.6)' }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Encryption badge */}
          <div className="p-4 rounded-2xl border flex items-center gap-3"
            style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)', backdropFilter: 'blur(12px)' }}>
            <div className="p-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <Lock className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="font-bold text-emerald-300 text-sm">End-to-End Encryption</h4>
              <p className="text-xs" style={{ color: 'rgba(110,231,183,0.7)' }}>Your data is encrypted and secured with AuraCare.</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <span className="text-sm" style={{ color: 'rgba(148,163,184,0.7)' }}>
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                Sign In
              </button>
            </span>
          </div>
        </div>

        {/* ── RIGHT — Form ── */}
        <div className="flex items-center justify-center p-4">
          <motion.div
            key={role}
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="w-full max-w-md rounded-3xl overflow-hidden relative"
            style={{
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: isPatient ? 'linear-gradient(90deg,#6366f1,#818cf8,#38bdf8)' : 'linear-gradient(90deg,#14b8a6,#34d399,#6ee7b7)' }} />
            {/* Inner shine */}
            <div className="absolute top-0 left-0 right-0 h-28 pointer-events-none"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 100%)' }} />

            <div className="p-8 relative">
              {/* Header */}
              <div className="mb-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: `rgba(${isPatient ? '99,102,241' : '20,184,166'},0.15)`,
                    border: `1px solid rgba(${isPatient ? '99,102,241' : '20,184,166'},0.3)`,
                    boxShadow: `0 0 20px rgba(${isPatient ? '99,102,241' : '20,184,166'},0.2)`,
                  }}>
                  {isPatient ? <UserCircle2 className="h-8 w-8 text-indigo-300" /> : <ShieldCheck className="h-8 w-8 text-teal-300" />}
                </div>
                <h2 className="text-2xl font-display font-bold text-white/90">
                  {isPatient ? 'Patient Registration' : 'Staff Registration'}
                </h2>
                <p className="text-sm mt-1" style={{ color: 'rgba(148,163,184,0.8)' }}>Your health data is encrypted and secure</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3">
                {/* Full Name */}
                <RegInput icon={UserIcon} type="text" name="full_name" placeholder="Full Name" accent={accentColor} />
                <RegInput icon={Mail} type="email" name="email" placeholder="Email Address" accent={accentColor} />
                <RegInput icon={Phone} type="tel" name="phone" placeholder="Phone (optional)" accent={accentColor} required={false} />

                {/* Password */}
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(148,163,184,0.6)' }} />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    required placeholder="Password"
                    className="w-full h-12 rounded-xl pl-11 pr-12 text-sm outline-none transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}
                    onFocus={e => { e.target.style.borderColor = `${accentColor}80`; e.target.style.boxShadow = `0 0 0 3px ${accentColor}20`; e.target.style.background = 'rgba(255,255,255,0.09)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(148,163,184,0.6)' }}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Strength */}
                {password.length > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <motion.div className="h-full rounded-full" animate={{ width: `${(strength.score / 6) * 100}%` }}
                          transition={{ type: 'spring', stiffness: 200 }} style={{ backgroundColor: strength.color }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color: strength.color }}>{strength.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {passwordRules.map((rule, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px]"
                          style={{ color: rule.test(password) ? '#34d399' : 'rgba(148,163,184,0.5)' }}>
                          {rule.test(password) ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {rule.label}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Confirm Password */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(148,163,184,0.6)' }} />
                  <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    required placeholder="Confirm Password"
                    className="w-full h-12 rounded-xl pl-11 pr-12 text-sm outline-none transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)', color: 'rgba(255,255,255,0.9)',
                      border: confirmPassword.length > 0
                        ? `1px solid ${passwordsMatch ? '#34d39980' : '#ef444480'}`
                        : '1px solid rgba(255,255,255,0.1)',
                    }}
                    onFocus={e => { e.target.style.background = 'rgba(255,255,255,0.09)'; }}
                    onBlur={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; }}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(148,163,184,0.6)' }}>
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="text-xs flex items-center gap-1" style={{ color: '#fca5a5' }}>
                    <XCircle className="h-3 w-3" /> Passwords do not match
                  </p>
                )}

                {/* Submit */}
                <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                  type="submit" disabled={loading || !passwordsMatch || strength.score < 3}
                  className="w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: accentGradient, boxShadow: `0 8px 24px ${accentColor}40, inset 0 1px 0 rgba(255,255,255,0.2)`, border: '1px solid rgba(255,255,255,0.15)' }}>
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Account…</>
                    : <>Create Account <ArrowRight className="h-4 w-4" /></>}
                </motion.button>

                <button type="button" onClick={() => navigate('/login')}
                  className="w-full py-3 text-sm flex items-center justify-center gap-2 transition-colors"
                  style={{ color: 'rgba(148,163,184,0.6)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(148,163,184,0.6)')}>
                  <ArrowLeft className="h-4 w-4" /> Back to Login
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function RegInput({ icon: Icon, accent, required = true, ...props }: any) {
  return (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(148,163,184,0.6)' }} />
      <input {...props} required={required}
        className="w-full h-12 rounded-xl pl-11 pr-4 text-sm outline-none transition-all duration-200"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}
        onFocus={e => { e.target.style.borderColor = `${accent}80`; e.target.style.boxShadow = `0 0 0 3px ${accent}20`; e.target.style.background = 'rgba(255,255,255,0.09)'; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
      />
    </div>
  );
}
