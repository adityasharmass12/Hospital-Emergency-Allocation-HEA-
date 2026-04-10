import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bed as BedIcon, X, CheckCircle, XCircle, Wrench, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { getBeds, updateBedStatus, Bed, updateWardCapacity } from '../lib/api';

export function BedsTab() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [updating, setUpdating] = useState(false);
  const [manageCapacityWard, setManageCapacityWard] = useState<string | null>(null);
  const [newCapacity, setNewCapacity] = useState<number>(0);

  const fetchBeds = () => {
    setLoading(true);
    getBeds()
      .then(setBeds)
      .catch((e: any) => toast.error('Failed to load beds', { description: e.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBeds(); }, []);

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedBed) return;
    setUpdating(true);
    try {
      await updateBedStatus(selectedBed.id, newStatus);
      toast.success(`${selectedBed.bed_number} → ${newStatus}`, {
        description: `Bed status updated successfully.`,
      });
      setSelectedBed(null);
      fetchBeds(); // Refresh bed data
    } catch (e: any) {
      toast.error('Failed to update bed status', { description: e.message });
    } finally {
      setUpdating(false);
    }
  };


  const handleUpdateCapacity = async (ward: string) => {
    if (newCapacity <= 0) { toast.error('Invalid capacity'); return; }
    setUpdating(true);
    try {
      const res = await updateWardCapacity(ward, newCapacity);
      toast.success(res.message);
      setManageCapacityWard(null);
      fetchBeds();
    } catch (e: any) {
      toast.error('Failed to update capacity', { description: e.message });
    } finally {
      setUpdating(false);
    }
  };

  const grouped = beds.reduce<Record<string, Bed[]>>((acc, b) => {
    (acc[b.ward] = acc[b.ward] || []).push(b);
    return acc;
  }, {});

  const statusConfig: Record<string, { bg: string; border: string; text: string; dot: string }> = {
    available: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-400' },
    occupied:  { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-300 dark:border-red-700', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-400' },
    maintenance: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-400' },
  };

  const statusColor = (s: string) => {
    const c = statusConfig[s] || statusConfig.available;
    return `${c.bg} ${c.border} ${c.text}`;
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading beds...</div>;

  return (
    <>
      <div className="space-y-8">
        {/* Header with Legend + Refresh */}
        <div className="flex justify-between items-center">
          <div className="flex gap-6 items-center text-sm">
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-400" /> Available</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-400" /> Occupied</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-400" /> Maintenance</span>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" onClick={fetchBeds} className="rounded-full text-sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </motion.div>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-3xl p-12 text-center text-slate-400">
            <BedIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No beds configured</p>
            <p className="text-sm mt-1">Connect backend to view bed map</p>
          </div>
        ) : (
          Object.entries(grouped).map(([ward, wardBeds]) => {
            const avail = wardBeds.filter(b => b.status === 'available').length;
            const occ = wardBeds.filter(b => b.status === 'occupied').length;
            return (
              <motion.div key={ward} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-slate-800/60 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-display font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <BedIcon className="h-5 w-5 text-blue-500" /> {ward} Ward
                  </h3>
                  <div className="flex items-center gap-3 text-xs">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">{avail} available</Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">{occ} occupied</Badge>
                    
                    {manageCapacityWard === ward ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={newCapacity} 
                          onChange={(e) => setNewCapacity(parseInt(e.target.value))}
                          className="w-16 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 text-center"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => handleUpdateCapacity(ward)} className="h-8 rounded-lg px-3">Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setManageCapacityWard(null)} className="h-8 rounded-lg px-2">Cancel</Button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setManageCapacityWard(ward); setNewCapacity(wardBeds.length); }}
                        className="text-slate-400 hover:text-blue-500 transition-colors flex items-center gap-1 font-medium bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-lg"
                      >
                        {wardBeds.length} total • Edit
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                  {wardBeds.map(bed => (
                    <motion.button
                      key={bed.id}
                      whileHover={{ scale: 1.12, y: -4 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setSelectedBed(bed)}
                      className={`p-3 rounded-xl border-2 text-center text-xs font-semibold cursor-pointer transition-all shadow-sm hover:shadow-md ${statusColor(bed.status)}`}
                      title={`${bed.bed_number} — ${bed.status} — Click to change`}
                    >
                      <BedIcon className="h-4 w-4 mx-auto mb-1" />
                      <span className="block truncate">{bed.bed_number.split('-')[1] || bed.bed_number}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ── Bed Status Modal ─────────────────────────────────── */}
      <AnimatePresence>
        {selectedBed && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !updating && setSelectedBed(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-display font-bold text-slate-800 dark:text-slate-100">
                    {selectedBed.bed_number}
                  </h3>
                  <p className="text-sm text-slate-500">{selectedBed.ward} Ward</p>
                </div>
                <button onClick={() => setSelectedBed(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              {/* Current Status */}
              <div className="px-6 pt-5 pb-3">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Current Status</p>
                <Badge className={`text-sm px-4 py-1.5 ${statusColor(selectedBed.status)}`}>
                  {selectedBed.status.charAt(0).toUpperCase() + selectedBed.status.slice(1)}
                </Badge>
              </div>

              {/* Status Options */}
              <div className="px-6 pb-6 pt-3 space-y-3">
                <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Change To</p>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  disabled={updating || selectedBed.status === 'available'}
                  onClick={() => handleStatusChange('available')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                    selectedBed.status === 'available'
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 opacity-50 cursor-not-allowed'
                      : 'border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                  }`}
                >
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                  <div className="text-left">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Available</p>
                    <p className="text-xs text-slate-500">Mark bed as free and ready</p>
                  </div>
                  {selectedBed.status === 'available' && <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-emerald-200">Current</Badge>}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  disabled={updating || selectedBed.status === 'occupied'}
                  onClick={() => handleStatusChange('occupied')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                    selectedBed.status === 'occupied'
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/30 opacity-50 cursor-not-allowed'
                      : 'border-slate-200 dark:border-slate-700 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                >
                  <XCircle className="h-6 w-6 text-red-500" />
                  <div className="text-left">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Occupied</p>
                    <p className="text-xs text-slate-500">Mark bed as in use by patient</p>
                  </div>
                  {selectedBed.status === 'occupied' && <Badge className="ml-auto bg-red-100 text-red-700 border-red-200">Current</Badge>}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  disabled={updating || selectedBed.status === 'maintenance'}
                  onClick={() => handleStatusChange('maintenance')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                    selectedBed.status === 'maintenance'
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 opacity-50 cursor-not-allowed'
                      : 'border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  }`}
                >
                  <Wrench className="h-6 w-6 text-amber-500" />
                  <div className="text-left">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Maintenance</p>
                    <p className="text-xs text-slate-500">Under repair or cleaning</p>
                  </div>
                  {selectedBed.status === 'maintenance' && <Badge className="ml-auto bg-amber-100 text-amber-700 border-amber-200">Current</Badge>}
                </motion.button>
              </div>

              {updating && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center rounded-3xl">
                  <p className="text-blue-600 font-medium animate-pulse">Updating...</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
