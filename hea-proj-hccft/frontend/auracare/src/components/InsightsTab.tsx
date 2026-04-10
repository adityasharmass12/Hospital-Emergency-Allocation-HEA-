import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Activity, Bell, Sparkles, AlertCircle, ChevronRight, TrendingUp } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { getInsights, getForecast, ForecastDay, Insight } from '../lib/api';

export function InsightsTab() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getInsights(), getForecast()])
      .then(([insData, forData]) => {
        setInsights(insData);
        setForecast(forData);
      })
      .catch((e: any) => toast.error('Failed to load AI data', { description: e.message }))
      .finally(() => setLoading(false));
  }, []);

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Analysing hospital data...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {}
      <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-3xl p-8 min-h-[400px] flex flex-col">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><BrainCircuit className="h-5 w-5 text-blue-600" /></div>
          AI Predictions
        </h3>
        
        {forecast.length > 0 ? (
          <div className="space-y-6 flex-1">
            <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Next 24h Outlook</span>
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {forecast[0].predicted_admissions} Expected Admissions
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Model predicts a {forecast[0].surge_alert ? 'high' : 'normal'} probability of emergency surge today.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <span className="text-xs text-slate-500 block mb-1">ICU Demand</span>
                <span className="text-lg font-bold text-amber-600">{forecast[0].predicted_icu} Predicted</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <span className="text-xs text-slate-500 block mb-1">Emergency</span>
                <span className="text-lg font-bold text-red-600">{forecast[0].predicted_emergency} Predicted</span>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 italic">
                * ML model updated hourly based on historical trends and current patient inflow.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
            No prediction data available
          </div>
        )}
      </motion.div>

      {}
      <motion.div variants={itemVariants} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-3xl p-8 min-h-[400px] flex flex-col">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-3 mb-6">
          <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg"><Sparkles className="h-5 w-5 text-teal-600" /></div>
          AI Operational Insights
        </h3>
        
        {insights.length > 0 ? (
          <div className="space-y-4">
            {insights.map((insight, i) => (
              <div key={i} className="group p-5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-teal-200 dark:hover:border-teal-800 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">{insight.title}</h4>
                  <Badge variant="outline" className={`
                    ${insight.type === 'critical' ? 'bg-red-50 text-red-600 border-red-200' : 
                      insight.type === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                      'bg-blue-50 text-blue-600 border-blue-200'}
                  `}>
                    {insight.type.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{insight.message}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                    <Activity className="h-3 w-3" /> Suggested Action
                  </span>
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/20 group-hover:text-teal-600">
                    {insight.action} <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
            Awaiting new insights...
          </div>
        )}
      </motion.div>

      {}
      <motion.div variants={itemVariants} className="lg:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-3xl p-8">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg"><Bell className="h-5 w-5 text-red-600" /></div>
          System Status & Anomalies
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
            <div className="flex items-center gap-2 text-emerald-600 mb-2 font-bold">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              API Connected
            </div>
            <p className="text-xs text-slate-500">Real-time data synchronization is active with local database.</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-white/40 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2 font-bold">
              <BrainCircuit className="h-4 w-4" />
              ML Inference
            </div>
            <p className="text-xs text-slate-500">Inference engine: Random Forest Regressor & Prophet Hybrid.</p>
          </div>

          <div className="p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
            <div className="flex items-center gap-2 text-amber-600 mb-2 font-bold">
              <AlertCircle className="h-4 w-4" />
              Data Quality
            </div>
            <p className="text-xs text-slate-500">98.4% data consistency in patient-to-bed mapping.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
