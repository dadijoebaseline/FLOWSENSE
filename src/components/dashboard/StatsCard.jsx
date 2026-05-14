import React from 'react';
import { motion } from 'framer-motion';

const colorConfig = {
  primary: {
    icon: 'text-blue-400',
    iconBg: 'rgba(59,130,246,0.12)',
    iconBorder: 'rgba(59,130,246,0.2)',
    bar: 'linear-gradient(90deg, #3b82f6, #6366f1)',
    glow: 'rgba(59,130,246,0.15)',
  },
  red: {
    icon: 'text-red-400',
    iconBg: 'rgba(239,68,68,0.12)',
    iconBorder: 'rgba(239,68,68,0.2)',
    bar: 'linear-gradient(90deg, #ef4444, #f97316)',
    glow: 'rgba(239,68,68,0.12)',
  },
  amber: {
    icon: 'text-amber-400',
    iconBg: 'rgba(245,158,11,0.12)',
    iconBorder: 'rgba(245,158,11,0.2)',
    bar: 'linear-gradient(90deg, #f59e0b, #f97316)',
    glow: 'rgba(245,158,11,0.1)',
  },
  blue: {
    icon: 'text-sky-400',
    iconBg: 'rgba(14,165,233,0.12)',
    iconBorder: 'rgba(14,165,233,0.2)',
    bar: 'linear-gradient(90deg, #0ea5e9, #6366f1)',
    glow: 'rgba(14,165,233,0.12)',
  },
  green: {
    icon: 'text-emerald-400',
    iconBg: 'rgba(16,185,129,0.12)',
    iconBorder: 'rgba(16,185,129,0.2)',
    bar: 'linear-gradient(90deg, #10b981, #06b6d4)',
    glow: 'rgba(16,185,129,0.1)',
  },
};

export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'primary', delay = 0 }) {
  const cfg = colorConfig[color] || colorConfig.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
      className="relative overflow-hidden rounded-2xl p-5 group cursor-default"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: `0 0 0 1px rgba(255,255,255,0.03), 0 8px 32px rgba(0,0,0,0.3), 0 0 60px ${cfg.glow}`,
      }}
    >
      {/* Ambient glow blob */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-30 blur-2xl group-hover:opacity-50 transition-opacity duration-500"
        style={{ background: cfg.bar }}
      />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 font-space">{title}</p>
          <p className="text-4xl font-bold text-white font-space tabular-nums leading-none">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500 font-inter">{subtitle}</p>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: cfg.iconBg, border: `1px solid ${cfg.iconBorder}` }}
        >
          {Icon && <Icon className={`w-5 h-5 ${cfg.icon}`} />}
        </div>
      </div>

      {/* Bottom gradient bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl" style={{ background: cfg.bar, opacity: 0.7 }} />
    </motion.div>
  );
}