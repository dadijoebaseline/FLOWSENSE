import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { staticDataService } from '@/lib/staticDataService';
import { Database, Info, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
};

export default function Upload() {
  const { data: datasets = [], isLoading } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => staticDataService.getDatasets(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
          <p className="text-sm text-slate-500">Loading datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <Database className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white font-space tracking-tight">Available Datasets</h2>
          <p className="text-sm text-slate-500 mt-0.5">Static demo data for anomaly detection</p>
        </div>
      </motion.div>

      {/* Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="rounded-2xl p-6"
        style={cardStyle}
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Static Demo Data</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              This is a static version of FlowSense using pre-loaded GeoJSON data. In a production environment,
              you would upload new monthly data files to the <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">public/data/</code> folder
              and redeploy to Vercel to add new months.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Datasets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {datasets.map((dataset, index) => (
          <motion.div
            key={dataset.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="rounded-2xl p-5 space-y-4"
            style={cardStyle}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{dataset.month_label}</span>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                dataset.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {dataset.status}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-1">{dataset.name}</h3>
              <p className="text-sm text-slate-400">GeoJSON water meter data</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Accounts</p>
                <p className="text-lg font-semibold text-white">{dataset.total_accounts}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">Anomalies</p>
                <p className="text-lg font-semibold text-red-400">{dataset.anomalies_found}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}