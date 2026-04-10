import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserCircle2, Plus, X, Stethoscope, Clock, MessageSquare, Sparkles, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { getStaff, StaffMember, getBedSummary, BedSummary, updateWardCapacity, sendChat } from '../lib/api';
import { Bed as BedIcon } from 'lucide-react';

export function StaffTab() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [bedSummary, setBedSummary] = useState<BedSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWard, setEditingWard] = useState<string | null>(null);
  const [newTotal, setNewTotal] = useState<number>(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role:string;text:string}[]>([
    { role:'bot', text:'Hi! I\'m MediAssist, your staff support AI. I can help with bed availability, patient loads, scheduling, and resource info. How can I assist?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const sessionId = React.useRef(`staff-${Date.now()}`);

  const handleChatSend = async () => {
    const msg = chatInput.trim(); if (!msg) return;
    setChatMessages(prev=>[...prev,{role:'user',text:msg}]); setChatInput('');
    try {
      const {response} = await sendChat(msg,'staff',sessionId.current);
      setChatMessages(prev=>[...prev,{role:'bot',text:response}]);
    } catch { setChatMessages(prev=>[...prev,{role:'bot',text:'Error connecting to service.'}]); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sData, bData] = await Promise.all([getStaff(), getBedSummary()]);
      setStaff(sData);
      setBedSummary(bData);
    } catch (e: any) {
      toast.error('Failed to load data', { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateCapacity = async (ward: string) => {
    try {
      const res = await updateWardCapacity(ward, newTotal);
      toast.success(res.message);
      setEditingWard(null);
      fetchData();
    } catch (e: any) {
      toast.error('Update failed', { description: e.message });
    }
  };

  const roleColor: Record<string, string> = {
    Doctor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    Nurse: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800',
  };

  const shiftColor: Record<string, string> = {
    Morning: 'bg-amber-50 text-amber-700 border-amber-200',
    Afternoon: 'bg-sky-50 text-sky-700 border-sky-200',
    Night: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading staff...</div>;

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-3xl p-8 min-h-[60vh] flex flex-col">
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-display font-semibold text-slate-800 dark:text-slate-100 mb-1">Staff & Resources</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage hospital personnel and bed allocation</p>
          </div>
          
          {}
          <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {bedSummary.map(w => (
              <div key={w.ward} className="min-w-[140px] bg-white/40 dark:bg-slate-800/40 p-3 rounded-2xl border border-white/40 dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{w.ward}</span>
                  <BedIcon className="h-3 w-3 text-blue-500" />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">{w.available}</div>
                    <div className="text-[9px] text-emerald-500 font-medium uppercase">Available</div>
                  </div>
                  {editingWard === w.ward ? (
                    <div className="flex items-center gap-1">
                      <input type="number" value={newTotal} onChange={e => setNewTotal(parseInt(e.target.value))} className="w-10 h-6 text-xs bg-white dark:bg-slate-700 rounded border border-slate-200 outline-none px-1 text-center" />
                      <button onClick={() => handleUpdateCapacity(w.ward)} className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"><Plus className="h-3 w-3" /></button>
                      <button onClick={() => setEditingWard(null)} className="p-1 bg-slate-200 dark:bg-slate-700 rounded hover:bg-slate-300"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingWard(w.ward); setNewTotal(w.total); }} 
                      className="text-[9px] text-slate-400 hover:text-blue-500 font-bold uppercase underline underline-offset-2">
                      {w.total} Total
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {staff.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl py-20">
            <Users className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-xl font-medium">No staff members found</p>
            <p className="text-sm mt-1">Staff data will appear from backend</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map((s) => (
              <motion.div key={s.id} whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}
                className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 flex flex-col items-center text-center transition-all shadow-sm">
                <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-800/50">
                  {s.role === 'Doctor' ? <Stethoscope className="h-10 w-10 text-blue-600 dark:text-blue-400" /> : <UserCircle2 className="h-10 w-10 text-teal-600 dark:text-teal-400" />}
                </div>
                <h4 className="font-display font-bold text-slate-800 dark:text-slate-100">{s.name}</h4>
                <Badge variant="outline" className={`mt-2 ${roleColor[s.role] || 'text-slate-500 bg-slate-50 border-slate-200'}`}>
                  {s.role}
                </Badge>
                <div className="w-full mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 uppercase tracking-wider font-bold">Ward</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{s.ward || '—'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 uppercase tracking-wider font-bold">Shift</span>
                    <Badge variant="outline" className={`text-[10px] ${shiftColor[s.shift] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      <Clock className="h-3 w-3 mr-1" /> {s.shift}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 uppercase tracking-wider font-bold">Status</span>
                    <span className={`font-semibold ${s.on_duty ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {s.on_duty ? '● On Duty' : '○ Off Duty'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {}
      <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.95}}
        onClick={()=>setIsChatOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-2xl flex items-center justify-center z-50"
        style={{ background:'linear-gradient(135deg,#14b8a6,#0d9488)', boxShadow:'0 12px 32px rgba(20,184,166,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
        <MessageSquare className="h-6 w-6 text-white" />
      </motion.button>

      {}
      <StaffChatSidebar isOpen={isChatOpen} onClose={()=>setIsChatOpen(false)} messages={chatMessages} input={chatInput} setInput={setChatInput} onSend={handleChatSend} />
    </>
  );
}

function StaffChatSidebar({isOpen,onClose,messages,input,setInput,onSend}:any) {
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
                <div className="p-2 rounded-xl" style={{ background:'rgba(20,184,166,0.2)', border:'1px solid rgba(20,184,166,0.4)', boxShadow:'0 0 12px rgba(20,184,166,0.3)' }}>
                  <Sparkles className="h-5 w-5 text-teal-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white/90">MediAssist</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color:'#2dd4bf' }}>Staff Support</p>
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
                  {m.role==='bot' && <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background:'rgba(20,184,166,0.2)', border:'1px solid rgba(20,184,166,0.3)' }}><Sparkles className="h-4 w-4 text-teal-300" /></div>}
                  <div className="rounded-2xl p-3 text-sm max-w-[85%]"
                    style={ m.role==='user'
                      ? { background:'linear-gradient(135deg,#14b8a6,#0d9488)', color:'#fff', borderBottomRightRadius:4, boxShadow:'0 4px 12px rgba(20,184,166,0.4)' }
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
                  placeholder="Ask about beds, patients, shifts…"
                  className="w-full rounded-xl px-5 py-3.5 pr-14 text-sm outline-none transition-all"
                  style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.9)' }}
                  onFocus={e=>{e.target.style.borderColor='rgba(20,184,166,0.5)';e.target.style.boxShadow='0 0 0 3px rgba(20,184,166,0.15)';}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.1)';e.target.style.boxShadow='none';}}
                />
                <button onClick={onSend} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all"
                  style={{ background:'linear-gradient(135deg,#14b8a6,#0d9488)', boxShadow:'0 4px 10px rgba(20,184,166,0.4)' }}>
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
