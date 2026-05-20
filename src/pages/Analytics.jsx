import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp as AnalyticsIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Analytics() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] rounded-3xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-center rounded-3xl bg-slate-900/70 p-6"
      >
        <AnalyticsIcon className="w-10 h-10 text-slate-200" />
      </motion.div>

      <div className="space-y-4 max-w-xl">
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Analytics is coming soon. This section will provide deeper insights into water usage and anomalies once it becomes available.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center justify-center rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
