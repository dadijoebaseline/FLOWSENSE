import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { staticDataService } from '@/lib/staticDataService';
import AnomalyMap from '@/components/map/AnomalyMap';
import { ANOMALY_COLORS, ANOMALY_LABELS } from '@/lib/anomalyDetection';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Map } from 'lucide-react';

export default function MapView() {
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: anomalies = [], isLoading } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => staticDataService.getAnomalies(),
  });

  const filtered = typeFilter === 'all'
    ? anomalies
    : anomalies.filter(a => a.anomalyType === typeFilter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
          <p className="text-sm text-slate-500">Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <Map className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white font-space tracking-tight">Anomaly Map</h2>
            <p className="text-sm text-slate-500 mt-0.5">Geographic distribution of anomalies</p>
          </div>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger
            className="w-full sm:w-48 rounded-xl text-sm text-slate-300 border-white/[0.08]"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-white/10" style={{ background: '#111318' }}>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="sudden_high">Sudden High</SelectItem>
            <SelectItem value="zero_consumption">Zero Consumption</SelectItem>
            <SelectItem value="sudden_down">Sudden Down</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap items-center gap-5"
      >
        {Object.entries(ANOMALY_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: ANOMALY_COLORS[key], boxShadow: `0 0 8px ${ANOMALY_COLORS[key]}80` }} />
            <span className="text-xs text-slate-400 font-space">{label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-600">
          <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
          Marker size = severity
        </div>
        <div
          className="px-3 py-1 rounded-lg text-xs font-medium text-blue-400"
          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
        >
          {filtered.length} markers
        </div>
      </motion.div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        <AnomalyMap anomalies={filtered} height="calc(100vh - 300px)" />
      </motion.div>
    </div>
  );
}