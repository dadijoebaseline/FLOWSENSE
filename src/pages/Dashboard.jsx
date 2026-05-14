import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { staticDataService } from '@/lib/staticDataService';
import StatsCard from '@/components/dashboard/StatsCard';
import { AnomalyPieChart, AnomalySeverityChart } from '@/components/dashboard/AnomalyChart';
import RecentAnomalies from '@/components/dashboard/RecentAnomalies';
import AnomalyMap from '@/components/map/AnomalyMap';
import { AlertTriangle, ArrowUpRight, ArrowDownRight, Droplets, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { role } = useOutletContext();

  const { data: anomalies = [], isLoading } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => staticDataService.getAnomalies(),
  });

  const { data: datasets = [] } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => staticDataService.getDatasets(),
  });

  const suddenHigh = anomalies.filter(a => a.anomaly_type === 'sudden_high').length;
  const zeroCons = anomalies.filter(a => a.anomaly_type === 'zero_consumption').length;
  const suddenDown = anomalies.filter(a => a.anomaly_type === 'sudden_down').length;
  const critical = anomalies.filter(a => a.severity === 'critical').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
          <p className="text-sm text-slate-500">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="flex items-start justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-white font-space tracking-tight">Overview</h2>
          <p className="text-sm text-slate-500 mt-1">Water consumption anomaly intelligence</p>
        </div>
        {datasets.length > 0 && (
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-slate-400"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <Zap className="w-3 h-3 text-blue-400" />
            {datasets.length} dataset{datasets.length > 1 ? 's' : ''} loaded
          </div>
        )}
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Anomalies" value={anomalies.length} icon={AlertTriangle} color="red" delay={0} subtitle={`${critical} critical`} />
        <StatsCard title="Sudden High" value={suddenHigh} icon={ArrowUpRight} color="red" delay={0.07} subtitle="≥30% increase" />
        <StatsCard title="Zero Usage" value={zeroCons} icon={Droplets} color="amber" delay={0.14} subtitle="No consumption" />
        <StatsCard title="Sudden Down" value={suddenDown} icon={ArrowDownRight} color="blue" delay={0.21} subtitle="≥30% decrease" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AnomalyPieChart anomalies={anomalies} />
        <AnomalySeverityChart anomalies={anomalies} />
      </div>

      {/* Map + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white font-space">Anomaly Map</h3>
            <span className="text-xs text-slate-500">{anomalies.filter(a => a.latitude).length} plotted</span>
          </div>
          <AnomalyMap anomalies={anomalies} height="h-56 sm:h-72 md:h-80 lg:h-96" />
        </motion.div>
        <div className="lg:col-span-2">
          <RecentAnomalies anomalies={anomalies} />
        </div>
      </div>
    </div>
  );
}