import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { getAuditLog, downloadPDFReport, AuditLog } from '../lib/api';

export function ReportsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLog()
      .then(setLogs)
      .catch((e: any) => toast.error('Failed to load audit log', { description: e.message }))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadPDF = async () => {
    try {
      await downloadPDFReport();
      toast.success('PDF report downloaded!');
    } catch (e: any) {
      toast.error('PDF download failed', { description: e.message });
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div variants={itemVariants} className="space-y-8">
      {}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-3xl p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-display font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg"><FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" /></div>
              Reports & Audit Log
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">System activity log and downloadable reports</p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={handleDownloadPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md shadow-indigo-500/20">
              <Download className="h-4 w-4 mr-2" /> Download PDF Report
            </Button>
          </motion.div>
        </div>

        {}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-100/50 dark:bg-slate-800/50 text-xs uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8">Loading audit log...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12">
                  <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="font-medium">No audit entries</p>
                  <p className="text-xs mt-1">Activity will appear as actions are performed</p>
                </td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">{log.action}</td>
                    <td className="px-6 py-4">{log.details}</td>
                    <td className="px-6 py-4 text-slate-400">{log.performed_by}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
