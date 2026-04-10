import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity, HeartPulse, ArrowRight,
  AlertCircle, CheckCircle2, ShieldCheck, MapPin,
  LogOut, MessageSquare, Send, X, Sparkles,
  Phone, Star, Ambulance, Clock, Search, SlidersHorizontal,
  LocateFixed, Calendar, Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { getBedSummary, admitPatient, getNearbyHospitals, BedSummary, NearbyHospital, sendChat, getPatientAppointments, Appointment } from '@/src/lib/api';
import { HospitalMap } from '../components/HospitalMap';


const mockUser = { full_name: 'Patient User', phone: '9876543210' };


const BG   = 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 40%,#0c1a2e 100%)';
const CARD = { background:'rgba(255,255,255,0.05)', backdropFilter:'blur(20px) saturate(160%)', border:'1px solid rgba(255,255,255,0.09)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.1)' };

export default function PatientPortal() {
  const navigate = useNavigate();
  const user = mockUser;
  const isLoading = false;
  const logout = () => navigate('/login');
  const [isChatOpen, setIsChatOpen]  = useState(false);
  const [showAppointmentBooking, setShowAppointmentBooking] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [chatMessages, setChatMessages] = useState<{role:string;text:string}[]>([
    { role:'bot', text:"Hello! I'm Aura, your AI health assistant. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [hospitals, setHospitals] = useState<BedSummary[]>([]);
  const [nearbyHospitals, setNearbyHospitals] = useState<NearbyHospital[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(true);
  const [bookingDone, setBookingDone] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<number|null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState(10);
  const [userLocation, setUserLocation] = useState<{lat:number;lng:number}|undefined>(undefined);

  const sessionId = React.useRef(`patient-${Date.now()}`);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'patient')) navigate('/login');
  }, [isLoading, user, navigate]);


  useEffect(() => {
    if (user && user.phone) {
      getPatientAppointments(user.phone)
        .then(setAppointments)
        .catch(() => setAppointments([]))
        .finally(() => setLoadingAppointments(false));
    }
  }, [user]);

  const fetchNearby = React.useCallback((loc?: {lat:number;lng:number}) => {
    setLoadingNearby(true);
    getNearbyHospitals({ lat:loc?.lat, lng:loc?.lng, radius_km:radiusKm })
      .then(setNearbyHospitals).catch(()=>{}).finally(()=>setLoadingNearby(false));
  }, [radiusKm]);

  useEffect(() => {
    getBedSummary().then(setHospitals).catch(()=>{});
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { const loc={lat:pos.coords.latitude,lng:pos.coords.longitude}; setUserLocation(loc); fetchNearby(loc); },
        () => { setUserLocation(undefined); fetchNearby(); }
      );
    } else { fetchNearby(); }
  }, []);

  useEffect(() => { fetchNearby(userLocation); }, [radiusKm]);

  const filteredHospitals = useMemo(() =>
    nearbyHospitals.filter(h =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.type.toLowerCase().includes(searchQuery.toLowerCase())
    ), [nearbyHospitals, searchQuery]);

  const handleEmergencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const name     = fd.get('patient_name') as string;
    const ageStr   = fd.get('age')          as string;
    const age      = ageStr ? Number(ageStr) : NaN;
    const symptoms = fd.get('symptoms')     as string;
    const priority = fd.get('priority')     as string;
    if (!name||!symptoms||!priority||isNaN(age)||age <= 0||age > 150) { toast.error('Please fill all fields with valid age (1-150)'); return; }
    const priorityMap: Record<string,string> = { low:'normal', medium:'urgent', high:'critical' };
    try {
      const res = await admitPatient({ name, age, gender:'other', condition:symptoms, priority:priorityMap[priority]||'normal', ward:priority==='high'?'Emergency':undefined });
      setBookingResult(res); setBookingDone(true);
      toast.success(res.message);
      getBedSummary().then(setHospitals).catch(()=>{});
    } catch (err:any) { toast.error('Booking failed',{description:err.message}); }
  };

  const handleChatSend = async () => {
    const msg = chatInput.trim(); if (!msg) return;
    setChatMessages(prev=>[...prev,{role:'user',text:msg}]); setChatInput('');
    try {
      const {response} = await sendChat(msg,'patient',sessionId.current);
      setChatMessages(prev=>[...prev,{role:'bot',text:response}]);
    } catch { setChatMessages(prev=>[...prev,{role:'bot',text:'Error connecting to service.'}]); }
  };

  return (
    <div className="min-h-screen font-sans relative overflow-hidden" style={{ background:BG }}>

      {}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[60vw] h-[60vw] rounded-full animate-ambient"
          style={{ background:'radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 70%)',filter:'blur(80px)' }} />
        <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full animate-ambient-slow"
          style={{ background:'radial-gradient(circle,rgba(20,184,166,0.16) 0%,transparent 70%)',filter:'blur(80px)' }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage:'linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)', backgroundSize:'60px 60px' }} />
      </div>

      {}
      <header className="fixed top-0 left-0 right-0 z-50" style={{ background:'rgba(15,23,42,0.7)', backdropFilter:'blur(24px) saturate(160%)', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-[1600px] mx-auto px-6 h-18 py-3 flex items-center justify-between">
          <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.35)', boxShadow:'0 0 12px rgba(99,102,241,0.25)' }}>
              <HeartPulse className="h-6 w-6 text-indigo-300" />
            </div>
            <div>
              <span className="text-xl font-display font-extrabold tracking-tight bg-clip-text text-transparent"
                style={{ backgroundImage:'linear-gradient(135deg,#a5b4fc,#67e8f9)' }}>AuraCare</span>
              <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase leading-none">Patient Portal</p>
            </div>
          </motion.div>
          <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(148,163,184,0.9)' }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background:'linear-gradient(135deg,#6366f1,#14b8a6)', color:'#fff' }}>
                  {user.full_name?.[0]?.toUpperCase() ?? 'P'}
                </div>
                {user.full_name}
              </div>
            )}
            <button onClick={()=>{logout();navigate('/login');}}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{ background:'rgba(239,68,68,0.1)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.25)' }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.18)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(239,68,68,0.1)';}}>
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 pt-20">
        <div className="max-w-[1600px] mx-auto px-6 space-y-20 pb-24">

          {}
          <motion.section initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} transition={{duration:0.7,ease:[0.22,1,0.36,1]}}
            className="text-center pt-24 pb-12 flex flex-col items-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8"
              style={{ background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc', backdropFilter:'blur(12px)' }}>
              <ShieldCheck className="h-4 w-4" /> AI-Powered Healthcare
            </div>
            <h1 className="text-6xl md:text-8xl font-display font-extrabold tracking-tighter leading-[0.9] mb-8">
              <span style={{ color:'rgba(255,255,255,0.92)' }}>Smart Care,{' '}</span><br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage:'linear-gradient(135deg,#818cf8,#38bdf8,#34d399)' }}>When You Need It</span>
            </h1>
            <p className="text-xl mb-10" style={{ color:'rgba(148,163,184,0.85)' }}>
              Connect to the right hospital instantly, get AI-driven health insights,<br />and book emergencies seamlessly.
            </p>
            <div className="flex gap-4">
              <button onClick={()=>document.getElementById('emergency-section')?.scrollIntoView({behavior:'smooth'})}
                className="h-14 px-8 text-lg font-bold rounded-full text-white transition-all hover:scale-105 hover:-translate-y-1 active:scale-95"
                style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow:'0 12px 32px rgba(99,102,241,0.45), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                Emergency Booking
              </button>
              <button onClick={()=>{setShowAppointmentBooking(true); setTimeout(() => document.getElementById('appointment-section')?.scrollIntoView({behavior:'smooth'}), 100);}}
                className="h-14 px-8 text-lg font-bold rounded-full transition-all hover:scale-105 hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                style={{ background:'rgba(34,197,94,0.15)', color:'rgba(34,197,94,0.9)', border:'1px solid rgba(34,197,94,0.3)', backdropFilter:'blur(12px)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.12)' }}>
                <Calendar className="h-5 w-5" /> Book Appointment
              </button>
              <button onClick={()=>document.getElementById('hospitals-section')?.scrollIntoView({behavior:'smooth'})}
                className="h-14 px-8 text-lg font-bold rounded-full transition-all hover:scale-105 hover:-translate-y-1 active:scale-95"
                style={{ background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.9)', border:'1px solid rgba(255,255,255,0.15)', backdropFilter:'blur(12px)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.12)' }}>
                View Nearby Hospitals
              </button>
            </div>
          </motion.section>

          {}
          <motion.section id="appointment-section" initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
            <div className="mb-8">
              <div>
                <h2 className="text-4xl font-display font-bold mb-1" style={{ color:'rgba(255,255,255,0.92)' }}>Your Appointments</h2>
                <p style={{ color:'rgba(148,163,184,0.7)' }}>
                  {loadingAppointments ? 'Loading appointments...' : `${appointments.length} active appointment${appointments.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            {loadingAppointments ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-medium mt-4" style={{ color:'rgba(148,163,184,0.6)' }}>Loading your appointments…</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12 rounded-3xl" style={CARD}>
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-40" style={{ color:'rgba(148,163,184,0.5)' }} />
                <h3 className="text-xl font-bold mb-2" style={{ color:'rgba(148,163,184,0.6)' }}>No Active Appointments</h3>
                <p className="text-sm mb-6" style={{ color:'rgba(148,163,184,0.4)' }}>You don't have any upcoming appointments yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {appointments.map(apt => (
                  <motion.div
                    key={apt.id}
                    initial={{opacity:0,y:20}}
                    whileInView={{opacity:1,y:0}}
                    className="rounded-2xl p-6 group cursor-pointer transition-all hover:scale-105"
                    style={{ ...CARD, border:`1px solid ${apt.status === 'confirmed' ? 'rgba(34,197,94,0.3)' : 'rgba(251,191,36,0.3)'}`, background: apt.status === 'confirmed' ? 'rgba(34,197,94,0.08)' : 'rgba(251,191,36,0.08)' }}
                  >
                    {}
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
                        style={{
                          background: apt.status === 'confirmed' ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.2)',
                          color: apt.status === 'confirmed' ? '#86efac' : '#fbbf24',
                        }}>
                        {apt.status === 'confirmed' ? '✓ Confirmed' : '⏱ Pending'}
                      </span>
                      {apt.available_at_requested_time ? (
                        <span className="text-xs font-bold text-emerald-400">⚡ Instant</span>
                      ) : null}
                    </div>

                    {}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color:'rgba(148,163,184,0.7)' }}>DATE & TIME</p>
                        <p className="text-sm font-bold" style={{ color:'rgba(255,255,255,0.9)' }}>
                          {new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color:'rgba(148,163,184,0.7)' }}>SPECIALTY</p>
                        <p className="text-sm font-bold" style={{ color:'rgba(255,255,255,0.9)' }}>{apt.specialty}</p>
                      </div>

                      {apt.hospital_name && (
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color:'rgba(148,163,184,0.7)' }}>HOSPITAL</p>
                          <p className="text-sm font-bold flex items-center gap-2" style={{ color: apt.available_at_requested_time ? '#86efac' : 'rgba(255,255,255,0.9)' }}>
                            <Building2 className="h-4 w-4" />{apt.hospital_name}
                          </p>
                        </div>
                      )}

                      {apt.suggested_time && !apt.available_at_requested_time && (
                        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-3">
                          <p className="text-xs font-semibold mb-1" style={{ color:'#fbbf24' }}>SUGGESTED TIME</p>
                          <p className="text-sm font-bold" style={{ color:'#fbbf24' }}>{apt.suggested_time}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color:'rgba(148,163,184,0.7)' }}>REASON</p>
                        <p className="text-xs" style={{ color:'rgba(148,163,184,0.8)' }}>{apt.reason_for_visit}</p>
                      </div>
                    </div>

                    {}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-[10px] font-mono text-center" style={{ color:'rgba(148,163,184,0.5)' }}>ID: {apt.id}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>

          {}
          <motion.section id="hospitals-section" initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-4xl font-display font-bold mb-1" style={{ color:'rgba(255,255,255,0.92)' }}>Nearby Hospitals</h2>
                <p style={{ color:'rgba(148,163,184,0.7)' }}>
                  {userLocation ? `${filteredHospitals.length} hospitals within ${radiusKm}km of your location` : `${filteredHospitals.length} healthcare facilities within ${radiusKm}km`}
                </p>
              </div>
              <div className="flex gap-2">
                {[{icon:SlidersHorizontal, label:'Filter'}, {icon:Clock, label:'Refresh', onClick:()=>navigate(0)}].map(({icon:Icon,label,onClick},i)=>(
                  <button key={i} onClick={onClick}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
                    style={{ background:'rgba(255,255,255,0.06)', color:'rgba(148,163,184,0.9)', border:'1px solid rgba(255,255,255,0.1)', backdropFilter:'blur(8px)' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.06)';}}>
                    <Icon className="h-4 w-4" />{label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2.5rem] overflow-hidden flex h-[800px]" style={{ ...CARD, boxShadow:'0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
              {}
              <div className="w-[450px] flex flex-col" style={{ borderRight:'1px solid rgba(255,255,255,0.07)' }}>
                <div className="p-6 space-y-5" style={{ background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
                  {}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color:'rgba(148,163,184,0.5)' }} />
                    <input type="text" placeholder="Search hospital or specialty..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                      className="w-full h-12 rounded-xl pl-11 pr-4 text-sm outline-none transition-all"
                      style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.9)' }}
                      onFocus={e=>{e.target.style.borderColor='rgba(99,102,241,0.5)';}}
                      onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.1)';}}
                    />
                  </div>
                  {}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span style={{ color:'rgba(148,163,184,0.7)' }}>SEARCH RADIUS</span>
                      <span className="px-2.5 py-1 rounded-lg" style={{ background:'rgba(99,102,241,0.15)', color:'#a5b4fc', border:'1px solid rgba(99,102,241,0.3)' }}>{radiusKm} km</span>
                    </div>
                    <input type="range" min="1" max="50" step="1" value={radiusKm} onChange={e=>setRadiusKm(parseInt(e.target.value))}
                      className="w-full h-1.5 rounded-full cursor-pointer appearance-none accent-indigo-500"
                      style={{ background:'rgba(255,255,255,0.08)' }} />
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight" style={{ color:'rgba(148,163,184,0.4)' }}>
                      <span>1 km</span><span>50 km</span>
                    </div>
                  </div>
                </div>
                {}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingNearby ? (
                    <div className="py-20 text-center space-y-4">
                      <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-sm font-medium" style={{ color:'rgba(148,163,184,0.6)' }}>Finding nearby facilities…</p>
                    </div>
                  ) : filteredHospitals.length===0 ? (
                    <div className="py-20 text-center px-6">
                      <MapPin className="h-10 w-10 mx-auto mb-4 opacity-30" style={{ color:'rgba(148,163,184,0.5)' }} />
                      <h4 className="text-base font-bold mb-2" style={{ color:'rgba(148,163,184,0.6)' }}>No hospitals found</h4>
                      <p className="text-sm mb-4" style={{ color:'rgba(148,163,184,0.4)' }}>Try expanding your search radius.</p>
                      <button onClick={()=>{setSearchQuery('');setRadiusKm(50);}}
                        className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Reset Filters</button>
                    </div>
                  ) : (
                    filteredHospitals.map(h => {
                      const selected = selectedHospitalId===h.id;
                      return (
                        <motion.div key={h.id} layoutId={`hosp-${h.id}`}
                          onClick={()=>setSelectedHospitalId(h.id)}
                          className="cursor-pointer p-4 rounded-2xl transition-all duration-200"
                          style={{
                            background: selected ? 'linear-gradient(135deg,rgba(99,102,241,0.35),rgba(79,70,229,0.25))' : 'rgba(255,255,255,0.04)',
                            border: selected ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.07)',
                            boxShadow: selected ? '0 0 20px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
                          }}
                          whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-base mb-0.5 truncate" style={{ color: selected?'#fff':'rgba(255,255,255,0.88)' }}>{h.name}</h3>
                              <div className="flex items-center gap-1.5 text-xs mb-2" style={{ color: selected?'rgba(165,180,252,0.8)':'rgba(148,163,184,0.6)' }}>
                                <MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{h.address}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className="text-sm font-black italic" style={{ color: selected?'#fff':'#818cf8' }}>{h.distance_km} km</span>
                              <div className="flex items-center gap-1 text-amber-400">
                                <Star className="h-3 w-3 fill-amber-400" /><span className="text-[10px] font-bold">{h.rating}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                              style={{ background: selected?'rgba(255,255,255,0.15)':'rgba(16,185,129,0.15)', color: selected?'#fff':'#34d399', border:`1px solid ${selected?'rgba(255,255,255,0.2)':'rgba(16,185,129,0.3)'}` }}>
                              {h.available_beds} Beds Free
                            </span>
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                              style={{ background: selected?'rgba(255,255,255,0.15)':'rgba(99,102,241,0.15)', color: selected?'#fff':'#a5b4fc', border:`1px solid ${selected?'rgba(255,255,255,0.2)':'rgba(99,102,241,0.3)'}` }}>
                              {h.type}
                            </span>
                          </div>
                          <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                            <div className="flex gap-2" style={{ color: selected?'rgba(255,255,255,0.5)':'rgba(148,163,184,0.4)' }}>
                              {h.has_ambulance===1 && <Ambulance className="h-3.5 w-3.5" />}
                              {h.is_open_24h===1  && <Clock       className="h-3.5 w-3.5" />}
                            </div>
                            <button className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                              style={{ color: selected?'rgba(165,180,252,1)':'rgba(99,102,241,0.8)' }}>
                              Details <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>

              {}
              <div className="flex-1 relative" style={{ background:'rgba(0,0,0,0.3)' }}>
                <HospitalMap hospitals={filteredHospitals} selectedId={selectedHospitalId} onSelect={setSelectedHospitalId} userLocation={userLocation} />
                <button onClick={()=>setUserLocation(userLocation)}
                  className="absolute bottom-8 right-8 w-13 h-13 p-3.5 rounded-2xl transition-all hover:scale-110 active:scale-95"
                  style={{ background:'rgba(15,23,42,0.85)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.15)', boxShadow:'0 8px 24px rgba(0,0,0,0.4)', color:'#818cf8' }}>
                  <LocateFixed className="h-6 w-6" />
                </button>
              </div>
            </div>
          </motion.section>

          {}
          <motion.section id="emergency-section" initial={{opacity:0,y:40}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
            <div className="max-w-xl mx-auto rounded-[2.5rem] overflow-hidden" style={{ ...CARD, border:'1px solid rgba(239,68,68,0.25)', boxShadow:'0 32px 80px rgba(0,0,0,0.4), 0 0 40px rgba(239,68,68,0.1), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
              <div className="p-10" style={{ background:'linear-gradient(135deg,rgba(239,68,68,0.1),rgba(239,68,68,0.04))', borderBottom:'1px solid rgba(239,68,68,0.15)' }}>
                <h3 className="text-3xl font-display font-bold flex items-center gap-3 mb-3" style={{ color:'#fca5a5' }}>
                  <div className="p-2 rounded-xl" style={{ background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)' }}>
                    <AlertCircle className="h-7 w-7" />
                  </div>
                  Emergency Booking
                </h3>
                <p style={{ color:'rgba(148,163,184,0.8)' }}>Request immediate medical attention. Our AI will route you to the nearest hospital with available beds.</p>
              </div>
              {bookingDone ? (
                <div className="p-10 space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                      style={{ background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', boxShadow:'0 0 30px rgba(16,185,129,0.2)' }}>
                      <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2" style={{ color:'rgba(255,255,255,0.9)' }}>Booking Confirmed</h3>
                    <p className="text-sm" style={{ color:'rgba(148,163,184,0.7)' }}>{bookingResult?.message}</p>
                  </div>

                  {}
                  {bookingResult?.bed && (
                    <div className="rounded-xl p-4" style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.3)' }}>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color:'rgba(165,180,252,1)' }}>
                        <Activity className="h-4 w-4" />
                        Bed Allocation
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span style={{ color:'rgba(148,163,184,0.7)' }}>Bed Number:</span>
                          <span className="font-semibold" style={{ color:'rgba(255,255,255,0.9)' }}>{bookingResult.bed.bed_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color:'rgba(148,163,184,0.7)' }}>Ward:</span>
                          <span className="font-semibold" style={{ color:'rgba(255,255,255,0.9)' }}>{bookingResult.bed.ward}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {}
                  {bookingResult?.hospital && (
                    <div className="rounded-xl p-4" style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)' }}>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color:'rgba(52,211,153,1)' }}>
                        <MapPin className="h-4 w-4" />
                        Hospital Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-semibold block" style={{ color:'rgba(255,255,255,0.9)' }}>{bookingResult.hospital.name}</span>
                          <span style={{ color:'rgba(148,163,184,0.7)' }}>{bookingResult.hospital.address}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span style={{ color:'rgba(148,163,184,0.7)' }}>📞 {bookingResult.hospital.phone}</span>
                          <span style={{ color:'rgba(100,200,100,0.8)' }}>⭐ {bookingResult.hospital.rating}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {}
                  <div className="flex gap-3 pt-4">
                    {bookingResult?.hospital && (
                      <button
                        onClick={() => {
                          const lat = bookingResult.hospital.latitude;
                          const lng = bookingResult.hospital.longitude;
                          const mapsUrl = `https:
                          window.open(mapsUrl, '_blank');
                        }}
                        className="flex-1 h-12 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 text-sm"
                        style={{ background:'rgba(59,130,246,0.2)', color:'rgba(96,165,250,1)', border:'1px solid rgba(59,130,246,0.4)' }}>
                        <LocateFixed className="h-4 w-4" />
                        View Directions
                      </button>
                    )}
                    <button onClick={()=>setBookingDone(false)}
                      className="flex-1 h-12 rounded-2xl font-semibold transition-all"
                      style={{ background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.9)', border:'1px solid rgba(255,255,255,0.12)' }}>
                      Book Another
                    </button>
                  </div>
                </div>
              ) : (
                <form className="p-10 space-y-6" onSubmit={handleEmergencySubmit}>
                  {[
                    { label:'Patient Name', name:'patient_name', type:'text', placeholder:'Full Name' },
                    { label:'Age', name:'age', type:'number', placeholder:'Enter age (1-150)', min:'1', max:'150' },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color:'rgba(148,163,184,0.6)' }}>{f.label}</label>
                      <input {...f} required className="mt-2 w-full h-13 rounded-xl px-5 text-sm outline-none transition-all"
                        style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.9)' }}
                        onFocus={e=>{e.target.style.borderColor='rgba(239,68,68,0.5)';e.target.style.boxShadow='0 0 0 3px rgba(239,68,68,0.1)';}}
                        onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.1)';e.target.style.boxShadow='none';}}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color:'rgba(148,163,184,0.6)' }}>Current Symptoms</label>
                    <textarea name="symptoms" rows={3} required placeholder="Describe condition…"
                      className="mt-2 w-full rounded-xl p-5 text-sm outline-none transition-all resize-none"
                      style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.9)' }}
                      onFocus={e=>{e.target.style.borderColor='rgba(239,68,68,0.5)';e.target.style.boxShadow='0 0 0 3px rgba(239,68,68,0.1)';}}
                      onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.1)';e.target.style.boxShadow='none';}}
                    />
                  </div>
                  <input type="hidden" name="priority" value="high" />
                  <button type="submit"
                    className="w-full h-14 rounded-2xl font-bold text-base text-white transition-all hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]"
                    style={{ background:'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow:'0 10px 30px rgba(220,38,38,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
                    Request Emergency Assistance
                  </button>
                </form>
              )}
            </div>
          </motion.section>
        </div>

        {}
        <div className="fixed bottom-8 right-8 z-[100]">
          <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.95}}
            onClick={()=>setIsChatOpen(true)}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow:'0 12px 32px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
            <MessageSquare className="h-7 w-7 text-white" />
          </motion.button>
        </div>

        <PatientChatSidebar isOpen={isChatOpen} onClose={()=>setIsChatOpen(false)} messages={chatMessages} input={chatInput} setInput={setChatInput} onSend={handleChatSend} />

        {}
        {}
      </main>
    </div>
  );
}


function PatientChatSidebar({isOpen,onClose,messages,input,setInput,onSend}:any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={onClose} className="fixed inset-0 z-[110]" style={{ background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)' }} />
          <motion.div initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}}
            transition={{type:'spring',damping:28,stiffness:220}}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[380px] z-[120] flex flex-col"
            style={{ background:'rgba(15,23,42,0.92)', backdropFilter:'blur(40px) saturate(180%)', borderLeft:'1px solid rgba(255,255,255,0.1)', boxShadow:'-20px 0 60px rgba(0,0,0,0.5)' }}>
            <div className="p-5 flex items-center justify-between shrink-0" style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.4)', boxShadow:'0 0 12px rgba(99,102,241,0.3)' }}>
                  <Sparkles className="h-5 w-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white/90">Aura AI</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'#818cf8' }}>Patient Support</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full transition-colors" style={{ color:'rgba(148,163,184,0.7)' }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((m:any,i:number) => (
                <div key={i} className={`flex gap-3 ${m.role==='user'?'justify-end':''}`}>
                  {m.role==='bot' && <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.3)' }}><Sparkles className="h-4 w-4 text-indigo-300" /></div>}
                  <div className="rounded-2xl p-3 text-sm max-w-[85%]"
                    style={ m.role==='user'
                      ? { background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', borderBottomRightRadius:4, boxShadow:'0 4px 12px rgba(99,102,241,0.4)' }
                      : { background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.85)', borderTopLeftRadius:4, border:'1px solid rgba(255,255,255,0.1)' }}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-5 shrink-0" style={{ borderTop:'1px solid rgba(255,255,255,0.08)' }}>
              <div className="relative">
                <input type="text" value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&onSend()}
                  placeholder="Ask Aura anything…"
                  className="w-full rounded-xl px-5 py-3.5 pr-14 text-sm outline-none transition-all"
                  style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.9)' }}
                  onFocus={e=>{e.target.style.borderColor='rgba(99,102,241,0.5)';e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.15)';}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.1)';e.target.style.boxShadow='none';}}
                />
                <button onClick={onSend} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all"
                  style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow:'0 4px 10px rgba(99,102,241,0.4)' }}>
                  <Send className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
