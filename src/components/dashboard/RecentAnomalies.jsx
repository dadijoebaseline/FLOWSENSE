import React from 'react';
import { ANOMALY_LABELS } from '@/lib/anomalyDetection';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus, TrendingUp } from 'lucide-react';

const typeConfig = {
  sudden_high: {
    icon: ArrowUpRight,
    color: 'text-red-400',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.2)',
    dot: '#ef4444',
  },
  sudden_down: {
    icon: ArrowDownRight,
    color: 'text-sky-400',
    bg: 'rgba(14,165,233,0.1)',
    border: 'rgba(14,165,233,0.2)',
    dot: '#0ea5e9',
  },
  zero_consumption: {
    icon: Minus,
    color: 'text-amber-400',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.2)',
    dot: '#f59e0b',
  },
};

const severityColors = {
  low: 'text-emerald-400 bg-emerald-500/10',
  medium: 'text-amber-400 bg-amber-500/10',
  high: 'text-orange-400 bg-orange-500/10',
  critical: 'text-red-400 bg-red-500/10',
};

export default function RecentAnomalies({ anomalies, className = '' }) {
  const recent = anomalies.slice(0, 7);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className={`rounded-2xl p-6 flex flex-col ${className}`}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white font-space">Recent Anomalies</h3>
          <p className="text-xs text-slate-500 mt-0.5">Latest flagged accounts</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-blue-400" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <TrendingUp className="w-3 h-3" />
          {anomalies.length} total
        </div>
      </div>

      <div className="space-y-2 flex-1">
        {recent.length === 0 && (
          <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
            No anomalies detected yet
          </div>
        )}
        {recent.map((anomaly, i) => {
          const cfg = typeConfig[anomaly.anomalyType] || typeConfig.sudden_high;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={anomaly.accountNumber || i}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.04 }}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); anomaly._onClick?.(); } }}
              onClick={() => anomaly._onClick?.()}
              className="flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer group"
              style={{ border: '1px solid transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                <Icon className={`w-4 h-4 ${cfg.color}`} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate leading-tight">
                  {anomaly.name || anomaly.accountNumber}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-slate-500 truncate">{anomaly.meterNo ? `${anomaly.meterNo} - ` : ''}{ANOMALY_LABELS[anomaly.anomalyType]}</span>
                  <span className="text-slate-700">·</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${severityColors[anomaly.severity] || ''}`}>
                    {anomaly.severity}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className={`text-sm font-semibold tabular-nums ${anomaly.deviationPercent > 0 ? 'text-red-400' : 'text-sky-400'}`}>
                  {anomaly.deviationPercent > 0 ? '+' : ''}{anomaly.deviationPercent}%
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}