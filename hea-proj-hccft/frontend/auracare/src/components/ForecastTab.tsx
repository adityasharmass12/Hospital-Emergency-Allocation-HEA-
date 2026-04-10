import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { getForecast, ForecastDay } from '../lib/api';

export function ForecastTab() {
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getForecast()
      .then(setForecast)
      .catch((e: any) => toast.error('Failed to load forecast', { description: e.message }))
      .finally(() => setLoading(false));
  }, []);

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading forecast...</div>;

  return (
    <motion.div variants={itemVariants} className="space-y-8">
      {}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-3xl p-8">
        <h3 className="text-2xl font-display font-semibold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" /></div>
          72-Hour Admission Forecast
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">AI-predicted patient admissions for the next 3 days</p>

        {forecast.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
            No forecast data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={forecast} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
              <Legend />
              <Bar dataKey="predicted_admissions" name="Admissions" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="predicted_emergency" name="Emergency" fill="#ef4444" radius={[6, 6, 0, 0]} />
              <Bar dataKey="predicted_icu" name="ICU" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {}
      {forecast.filter(f => f.surge_alert).length > 0 && (
        <div className="bg-red-50/60 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 rounded-3xl p-6">
          <h4 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5" /> Surge Alerts
          </h4>
          <div className="space-y-3">
            {forecast.filter(f => f.surge_alert).map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-white/60 dark:bg-slate-900/40 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{f.day} — {f.date}</p>
                  <p className="text-sm text-slate-500">{f.predicted_admissions} predicted admissions</p>
                </div>
                <Badge className="bg-red-100 text-red-700 border-red-200">SURGE</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {forecast.map((f, i) => (
          <motion.div key={i} whileHover={{ y: -4 }}
            className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-slate-800 dark:text-slate-100">{f.day}</h4>
              <span className="text-xs text-slate-400">{f.date}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Admissions</span><span className="font-semibold text-blue-600">{f.predicted_admissions}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Emergency</span><span className="font-semibold text-red-500">{f.predicted_emergency}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">ICU</span><span className="font-semibold text-amber-500">{f.predicted_icu}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Model</span><span className="text-slate-400">{f.model_used}</span></div>
            </div>
            {f.surge_alert && <Badge className="mt-3 bg-red-100 text-red-700 border-red-200 w-full justify-center">⚠ Surge Alert</Badge>}
            {f.is_holiday && <Badge className="mt-2 bg-purple-100 text-purple-700 border-purple-200 w-full justify-center">🎉 Holiday</Badge>}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
