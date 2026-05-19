import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { staticDataService } from '@/lib/staticDataService';
import AnomalyTable from '@/components/anomalies/AnomalyTable';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function Anomalies() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'all';

  const { data: anomalies = [], isLoading } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => staticDataService.getAnomalies(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
          <p className="text-sm text-slate-500">Loading anomalies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="flex items-center gap-3"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white font-space tracking-tight">Anomaly Records</h2>
          <p className="text-sm text-slate-500 mt-0.5">All flagged water consumption anomalies</p>
        </div>
      </motion.div>
      <AnomalyTable anomalies={anomalies} initialType={initialType} />
    </div>
  );
}