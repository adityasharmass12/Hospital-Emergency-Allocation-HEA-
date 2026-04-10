import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Users, Activity, BarChart3, PieChart, ShieldCheck, Clock, Phone } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { getRegisteredHospitals, RegisteredHospital } from '../lib/api';

export function HospitalAnalyticsTab() {
  const [hospitals, setHospitals] = useState<RegisteredHospital[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRegisteredHospitals()
      .then(setHospitals)
      .catch((e: any) => toast.error('Failed to load hospital analytics', { description: e.message }))
      .finally(() => setLoading(false));
  }, []);

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading network analytics...</div>;

  return (
    <div className="space-y-8">
      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-600/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 -mr-12 -mt-12 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
          <h4 className="text-indigo-100 text-sm font-medium mb-1">Total Facilities</h4>
          <div className="text-4xl font-bold mb-2">{hospitals.length}</div>
          <div className="text-xs text-indigo-200 flex items-center gap-1">
            <Building2 className="h-3 w-3" /> Registered Hospitals in HEA Network
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-3xl p-6">
          <h4 className="text-slate-500 text-sm font-medium mb-1">Pending Approvals</h4>
          <div className="text-4xl font-bold text-amber-600 mb-2">
            {hospitals.filter(h => h.status === 'pending').length}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Facilities awaiting verification
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-3xl p-6">
          <h4 className="text-slate-500 text-sm font-medium mb-1">Total Capacity</h4>
          <div className="text-4xl font-bold text-teal-600 mb-2">
            {hospitals.reduce((a, b) => a + b.bed_capacity, 0)}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Activity className="h-3 w-3" /> Total beds across all units
          </div>
        </motion.div>
      </div>

      {}
      <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-3xl p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Registered Facilities</h3>
            <p className="text-sm text-slate-500">Live directory of hospital network</p>
          </div>
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl"><BarChart3 className="h-5 w-5 text-slate-500" /></div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-6 py-4 font-bold">Hospital Name</th>
                <th className="px-6 py-4 font-bold">Location</th>
                <th className="px-6 py-4 font-bold text-center">Beds</th>
                <th className="px-6 py-4 font-bold text-center">ICU Units</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {hospitals.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No registered hospitals found in database.</td></tr>
              ) : (
                hospitals.map((hospital, i) => (
                  <tr key={hospital.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{hospital.name}</p>
                          <p className="text-xs text-slate-400">Registered: {new Date(hospital.registered_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {hospital.location}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-100">{hospital.bed_capacity}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-100">{hospital.icu_availability}</td>
                    <td className="px-6 py-4">
                      <Badge className={`
                        ${hospital.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                          hospital.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                          'bg-red-50 text-red-600 border-red-200'}
                      `}>
                        {hospital.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                       <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {hospital.contact}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-3xl p-8 h-[300px] flex flex-col items-center justify-center text-center">
          <PieChart className="h-12 w-12 text-slate-200 mb-4" />
          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Regional Distribution</h4>
          <p className="text-sm text-slate-500 max-w-xs">Connecting hospitals across urban and rural zones for optimal allocation.</p>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-3xl p-8 h-[300px] flex flex-col items-center justify-center text-center">
          <ShieldCheck className="h-12 w-12 text-slate-200 mb-4" />
          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Network Security</h4>
          <p className="text-sm text-slate-500 max-w-xs">All registered facilities undergo mandatory verification for emergency data access.</p>
        </motion.div>
      </div>
    </div>
  );
}
