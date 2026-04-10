import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Activity, MessageSquare,
  Bed, Stethoscope, AlertTriangle, BrainCircuit,
  Send, ChevronLeft, Menu, BarChart3,
  TrendingUp, Database, X, Sparkles,
  FileText, ClipboardList, LogOut
} from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import { toast } from 'sonner';
import { getDashboard, getAlerts, DashboardData, Alert, sendChat } from '@/src/lib/api';
import { PatientsTab } from '@/src/components/PatientsTab';
import { AdmitModal } from '@/src/components/AdmitModal';
import { BedsTab } from '@/src/components/BedsTab';
import { ForecastTab } from '@/src/components/ForecastTab';
import { ReportsTab } from '@/src/components/ReportsTab';
import { StaffTab } from '@/src/components/StaffTab';
import { InsightsTab } from '@/src/components/InsightsTab';
import { HospitalAnalyticsTab } from '@/src/components/HospitalAnalyticsTab';


const mockUser = { full_name: 'Admin User' };


const BG = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #0c1a2e 100%)';
const GLASS_SIDEBAR = { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(32px) saturate(160%)', borderRight:'1px solid rgba(255,255,255,0.08)' };
const GLASS_HEADER  = { background:'rgba(255,255,255,0.04)', backdropFilter:'blur(24px) saturate(160%)', borderBottom:'1px solid rgba(255,255,255,0.08)' };
const GLASS_CARD    = { background:'rgba(255,255,255,0.05)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.09)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.1)' };

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = mockUser;
  const logout = () => navigate('/login');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAdminChatOpen, setIsAdminChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [backendConnected, setBackendConnected] = useState(false);
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {


  }, [isLoading, user, navigate]);

  useEffect(() => {
    getDashboard()
      .then(data => { setDashData(data); setBackendConnected(true); })
      .catch(() => setBackendConnected(false));
    getAlerts().then(setAlerts).catch(() => {});
  }, [refreshKey]);

  useEffect(() => {
    const t = setInterval(() => setRefreshKey(k => k + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const totalBeds     = dashData?.bed_summary?.reduce((a, w) => a + w.total, 0) ?? 0;
  const availBeds     = dashData?.bed_summary?.reduce((a, w) => a + w.available, 0) ?? 0;
  const occRate       = dashData?.occupancy_rate ?? 0;
  const activePatients= dashData?.patient_stats?.total_active ?? 0;

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'patients',  icon: ClipboardList,   label: 'Patients'  },
    { id: 'beds',      icon: Bed,             label: 'Bed Map'   },
    { id: 'staff',     icon: Users,           label: 'Staff'     },
    { id: 'forecast',  icon: TrendingUp,      label: 'Forecast'  },
    { id: 'insights',  icon: BrainCircuit,    label: 'AI Insights'},
    { id: 'analytics', icon: BarChart3,       label: 'Analytics' },
    { id: 'reports',   icon: FileText,        label: 'Reports'   },
    { id: 'resources', icon: Database,        label: 'Resources' },
  ];

  const cv: any = { hidden:{opacity:0,y:10}, visible:{opacity:1,y:0,transition:{staggerChildren:0.07,delayChildren:0.05}} };
  const iv: any = { hidden:{opacity:0,y:18}, visible:{opacity:1,y:0,transition:{type:'spring',stiffness:120,damping:16}} };

  return (
    <div className="min-h-screen flex overflow-hidden font-sans relative" style={{ background: BG }}>

      {}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] rounded-full animate-ambient"
          style={{ background:'radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 70%)', filter:'blur(80px)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full animate-ambient-slow"
          style={{ background:'radial-gradient(circle,rgba(20,184,166,0.15) 0%,transparent 70%)', filter:'blur(80px)' }} />
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage:'linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)', backgroundSize:'60px 60px' }} />
      </div>

      {}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 256 : 76 }}
        transition={{ duration: 0.35, ease: [0.25,0.1,0.25,1] }}
        className="flex flex-col z-20 relative shrink-0"
        style={GLASS_SIDEBAR}
      >
        {}
        <div className="h-16 flex items-center px-4 shrink-0" style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div key="full" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 rounded-xl shrink-0" style={{ background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.3)', boxShadow:'0 0 12px rgba(99,102,241,0.25)' }}>
                  <Activity className="h-5 w-5 text-indigo-300" />
                </div>
                <div>
                  <span className="text-base font-bold bg-clip-text text-transparent whitespace-nowrap"
                    style={{ backgroundImage:'linear-gradient(135deg,#a5b4fc,#67e8f9)' }}>AuraCare</span>
                  <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">HEA Platform</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="icon" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex justify-center w-full">
                <div className="p-2 rounded-xl" style={{ background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.3)' }}>
                  <Activity className="h-5 w-5 text-indigo-300" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = activeTab === item.id;
            return (
              <motion.button key={item.id} onClick={() => setActiveTab(item.id)}
                whileHover={{ x: isSidebarOpen ? 3 : 0, scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex items-center w-full px-3 py-2.5 rounded-xl transition-all duration-200 text-left"
                style={{
                  background: active ? 'linear-gradient(135deg,rgba(99,102,241,0.35),rgba(79,70,229,0.25))' : 'transparent',
                  border: active ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                  boxShadow: active ? '0 0 16px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
                  color: active ? 'rgba(165,180,252,1)' : 'rgba(148,163,184,0.7)',
                }}>
                <item.icon className={`h-5 w-5 shrink-0 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                {isSidebarOpen && <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>}
              </motion.button>
            );
          })}
        </nav>

        {}
        <div className="p-3 shrink-0" style={{ borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium"
            style={{ background:'rgba(239,68,68,0.1)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.2)' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.1)'; }}
          >
            <LogOut className="h-4 w-4" />
            {isSidebarOpen && 'Logout'}
          </button>
        </div>
      </motion.aside>

      {}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">

        {}
        <header className="h-16 flex items-center justify-between px-6 shrink-0" style={GLASS_HEADER}>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl transition-all"
              style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; }}>
              <Menu className="h-5 w-5 text-slate-300" />
            </button>
            <h1 className="text-lg font-semibold text-white/90">{navItems.find(i => i.id === activeTab)?.label}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              backendConnected ? 'text-emerald-300' : 'text-red-400'}`}
              style={{ background: backendConnected ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${backendConnected ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: backendConnected ? '#34d399' : '#f87171' }} />
              {backendConnected ? 'Connected' : 'Disconnected'}
            </div>
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(148,163,184,0.9)' }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background:'linear-gradient(135deg,#6366f1,#14b8a6)', color:'#fff' }}>
                  {user.full_name?.[0]?.toUpperCase() ?? 'A'}
                </div>
                {user.full_name?.split(' ')[0]}
              </div>
            )}
            <button onClick={() => setIsAdminChatOpen(true)}
              className="h-9 w-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.4),rgba(79,70,229,0.3))', border:'1px solid rgba(99,102,241,0.4)', boxShadow:'0 0 12px rgba(99,102,241,0.3)' }}>
              <MessageSquare className="h-4 w-4 text-indigo-300" />
            </button>
          </div>
        </header>

        {}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} variants={cv} initial="hidden" animate="visible" exit={{ opacity:0 }}
              className="max-w-7xl mx-auto space-y-6 pb-12">

              {activeTab === 'dashboard' && (
                <>
                  {}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                      { title:'Total Beds',      value:totalBeds||'--',          icon:Bed,           accent:'#6366f1', glow:'rgba(99,102,241,0.25)'  },
                      { title:'Available Beds',  value:availBeds||'--',          icon:Activity,      accent:'#14b8a6', glow:'rgba(20,184,166,0.25)'  },
                      { title:'Occupancy Rate',  value:occRate?`${occRate}%`:'--',icon:AlertTriangle, accent:'#f59e0b', glow:'rgba(245,158,11,0.25)'  },
                      { title:'Active Patients', value:activePatients||'--',     icon:Stethoscope,   accent:'#818cf8', glow:'rgba(129,140,248,0.25)' },
                    ].map((stat, i) => (
                      <motion.div key={i} variants={iv} whileHover={{ y:-4, scale:1.02 }}
                        className="rounded-2xl p-5 relative overflow-hidden cursor-default"
                        style={GLASS_CARD}>
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 pointer-events-none"
                          style={{ background:`radial-gradient(circle,${stat.glow} 0%,transparent 70%)`, filter:'blur(20px)' }} />
                        <div className="flex items-center justify-between mb-4 relative z-10">
                          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color:'rgba(148,163,184,0.8)' }}>{stat.title}</p>
                          <div className="p-2 rounded-xl" style={{ background:`rgba(${stat.accent==='#6366f1'?'99,102,241':stat.accent==='#14b8a6'?'20,184,166':stat.accent==='#f59e0b'?'245,158,11':'129,140,248'},0.15)`, border:`1px solid ${stat.accent}40` }}>
                            <stat.icon className="h-4 w-4" style={{ color:stat.accent }} />
                          </div>
                        </div>
                        <div className="text-3xl font-bold relative z-10" style={{ color:'rgba(255,255,255,0.92)' }}>{stat.value}</div>
                      </motion.div>
                    ))}
                  </div>

                  {}
                  {alerts.length > 0 && (
                    <motion.div variants={iv} className="space-y-2">
                      {alerts.map((a, i) => (
                        <div key={i} className="p-4 rounded-xl flex items-center gap-3"
                          style={{ background: a.level==='critical'?'rgba(239,68,68,0.1)':'rgba(245,158,11,0.1)', border:`1px solid ${a.level==='critical'?'rgba(239,68,68,0.3)':'rgba(245,158,11,0.3)'}`, color: a.level==='critical'?'#fca5a5':'#fcd34d' }}>
                          {a.level==='critical'?'🚨':'⚠'} {a.message}
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {}
                  {dashData?.resources && dashData.resources.length > 0 && (
                    <motion.div variants={iv} className="rounded-2xl p-6" style={GLASS_CARD}>
                      <h3 className="text-base font-semibold mb-4" style={{ color:'rgba(255,255,255,0.9)' }}>Resource Availability</h3>
                      <div className="space-y-4">
                        {dashData.resources.map((r, i) => {
                          const pct = r.total > 0 ? Math.round((r.available/r.total)*100) : 0;
                          const color = pct<=20?'#ef4444':pct<=40?'#f59e0b':'#10b981';
                          return (
                            <div key={i}>
                              <div className="flex justify-between text-sm mb-1.5">
                                <span style={{ color:'rgba(255,255,255,0.8)' }}>{r.name}</span>
                                <span className="font-bold" style={{ color }}>{r.available}/{r.total}</span>
                              </div>
                              <div className="h-2 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.08)' }}>
                                <div className="h-full rounded-full transition-all duration-500" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}cc)`, boxShadow:`0 0 6px ${color}60` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </>
              )}

              {activeTab==='patients'  && <PatientsTab onAdmitClick={()=>setIsAdmitModalOpen(true)} />}
              {activeTab==='beds'      && <BedsTab />}
              {activeTab==='forecast'  && <ForecastTab />}
              {activeTab==='reports'   && <ReportsTab />}
              {activeTab==='staff'     && <StaffTab />}
              {activeTab==='insights'  && <InsightsTab />}
              {activeTab==='analytics' && <HospitalAnalyticsTab />}

              {activeTab==='resources' && (
                <motion.div variants={iv} className="rounded-2xl p-8 min-h-[60vh]" style={GLASS_CARD}>
                  <h3 className="text-lg font-semibold mb-6" style={{ color:'rgba(255,255,255,0.9)' }}>Resource Monitoring</h3>
                  {dashData?.resources && dashData.resources.length > 0 ? (
                    <div className="space-y-4">
                      {dashData.resources.map((r, i) => {
                        const pct = r.total>0 ? Math.round((r.available/r.total)*100) : 0;
                        const color = pct<=20?'#ef4444':pct<=40?'#f59e0b':'#10b981';
                        return (
                          <div key={i} className="rounded-xl p-5" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                            <div className="flex justify-between mb-2">
                              <span className="font-semibold" style={{ color:'rgba(255,255,255,0.85)' }}>{r.name}</span>
                              <span className="text-sm font-bold" style={{ color }}>{r.available}/{r.total} available</span>
                            </div>
                            <div className="h-2.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.08)' }}>
                              <div className="h-full rounded-full" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}aa)`, boxShadow:`0 0 8px ${color}60` }} />
                            </div>
                            <p className="text-xs mt-1" style={{ color:'rgba(148,163,184,0.5)' }}>{r.category}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-24 border-2 border-dashed rounded-xl" style={{ borderColor:'rgba(255,255,255,0.08)', color:'rgba(148,163,184,0.4)' }}>
                      <div className="text-center"><Database className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No resource data</p></div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AdmitModal isOpen={isAdmitModalOpen} onClose={()=>setIsAdmitModalOpen(false)} onAdmitted={()=>setRefreshKey(k=>k+1)} />
      <AdminChatSidebar isOpen={isAdminChatOpen} onClose={()=>setIsAdminChatOpen(false)} dashData={dashData} />
    </div>
  );
}


function AdminChatSidebar({ isOpen, onClose, dashData }: { isOpen:boolean; onClose:()=>void; dashData:DashboardData|null }) {
  const [messages, setMessages] = useState([
    { role:'bot', text:'Welcome! I can help with hospital analytics, staff scheduling, and resource optimization.' }
  ]);
  const [input, setInput] = useState('');
  const sessionId = React.useRef(`admin-${Date.now()}`);

  const handleSend = async () => {
    const msg = input.trim(); if (!msg) return;
    setMessages(prev => [...prev, { role:'user', text:msg }]);
    setInput('');
    try {
      const { response } = await sendChat(msg, 'admin', sessionId.current);
      setMessages(prev => [...prev, { role:'bot', text:response }]);
    } catch {
      setMessages(prev => [...prev, { role:'bot', text:'Error connecting to AI service.' }]);
    }
  };

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
                <div className="p-2 rounded-xl" style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(79,70,229,0.2))', border:'1px solid rgba(99,102,241,0.4)', boxShadow:'0 0 12px rgba(99,102,241,0.3)' }}>
                  <Sparkles className="h-5 w-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white/90">HEA Assistant</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'#818cf8' }}>Admin Support</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full transition-colors" style={{ color:'rgba(148,163,184,0.7)' }}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((m, i) => (
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
                  onKeyDown={e=>e.key==='Enter'&&handleSend()}
                  placeholder="Ask about beds, patients, resources..."
                  className="w-full rounded-xl px-5 py-3.5 pr-14 text-sm outline-none transition-all"
                  style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.9)' }}
                  onFocus={e=>{e.target.style.borderColor='rgba(99,102,241,0.5)'; e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.15)';}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none';}}
                />
                <button onClick={handleSend} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all"
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
