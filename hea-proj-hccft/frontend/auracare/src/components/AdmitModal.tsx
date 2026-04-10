import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { admitPatient } from '../lib/api';

interface AdmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdmitted: () => void;
}

export function AdmitModal({ isOpen, onClose, onAdmitted }: AdmitModalProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const name = fd.get('name') as string;
    const ageStr = fd.get('age') as string;
    const age = ageStr ? Number(ageStr) : NaN;
    const gender = fd.get('gender') as string;
    const condition = fd.get('condition') as string;
    const priority = fd.get('priority') as string;
    const ward = fd.get('ward') as string;


    if (!name || !name.trim()) {
      toast.error('Patient name is required');
      return;
    }
    
    if (!ageStr || isNaN(age) || age <= 0 || age > 150) {
      toast.error('Please enter a valid age (1-150 years)');
      return;
    }
    
    if (!gender) {
      toast.error('Gender is required');
      return;
    }
    
    if (!condition || !condition.trim()) {
      toast.error('Medical condition is required');
      return;
    }

    try {
      const res = await admitPatient({ name, age, gender, condition, priority, ward: ward || undefined });
      toast.success(res.message + (res.bed ? ` — Bed: ${res.bed.bed_number}` : ''));
      onClose();
      onAdmitted();
    } catch (e: any) {
      toast.error('Failed to admit', { description: e.message });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-display font-bold text-slate-800 dark:text-slate-100">Admit New Patient</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Patient Name *</label>
                <input name="name" type="text" required placeholder="Enter patient name" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              {}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Age *</label>
                  <input name="age" type="number" min="1" max="150" required placeholder="Enter age" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gender *</label>
                  <select name="gender" defaultValue="male" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Medical Condition *</label>
                <input name="condition" type="text" required placeholder="e.g., Fever, Chest Pain, Fracture" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              {}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Priority</label>
                  <select name="priority" defaultValue="normal" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ward</label>
                  <select name="ward" defaultValue="" className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Auto-assign (by priority)</option>
                    <option value="General">General</option>
                    <option value="ICU">ICU</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Pediatric">Pediatric</option>
                    <option value="Maternity">Maternity</option>
                  </select>
                </div>
              </div>

              {}
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl h-12 border-slate-200 dark:border-slate-700">Cancel</Button>
                <Button type="submit" className="flex-1 rounded-xl h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">Admit Patient</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
