import React from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis,
    Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { ANOMALY_COLORS, ANOMALY_LABELS } from '@/lib/anomalyDetection';
import { motion } from 'framer-motion';

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
};

const tooltipStyle = {
  backgroundColor: 'rgba(15,17,26,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#e2e8f0',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
};

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function AnomalyPieChart({ anomalies }) {
  const data = Object.entries(
    anomalies.reduce((acc, a) => {
      acc[a.anomaly_type] = (acc[a.anomaly_type] || 0) + 1;
      return acc;
    }, {})
  ).map(([type, count]) => ({
    name: ANOMALY_LABELS[type] || type,
    value: count,
    color: ANOMALY_COLORS[type] || '#6b7280',
  }));

  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="rounded-2xl p-6 flex items-center justify-center h-80"
        style={cardStyle}
      >
        <p className="text-slate-500 text-sm">No anomaly data yet</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl p-6"
      style={cardStyle}
    >
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-white font-space">Anomaly Distribution</h3>
        <p className="text-xs text-slate-500 mt-0.5">Breakdown by anomaly type</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <defs>
            {data.map((entry, i) => (
              <radialGradient key={i} id={`grad-${i}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={entry.color} stopOpacity={0.9} />
                <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
              </radialGradient>
            ))}
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={105}
            paddingAngle={3}
            dataKey="value"
            labelLine={false}
            label={CustomPieLabel}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={`url(#grad-${index})`} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#e2e8f0' }} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function AnomalySeverityChart({ anomalies }) {
  const severityData = ['low', 'medium', 'high', 'critical'].map(sev => ({
    name: sev.charAt(0).toUpperCase() + sev.slice(1),
    count: anomalies.filter(a => a.severity === sev).length,
  }));

  const gradients = [
    ['#10b981', '#06b6d4'],
    ['#f59e0b', '#f97316'],
    ['#f97316', '#ef4444'],
    ['#ef4444', '#dc2626'],
  ];

  const CustomBar = (props) => {
    const { x, y, width, height, index } = props;
    const [c1, c2] = gradients[index] || ['#3b82f6', '#6366f1'];
    const id = `bar-grad-${index}`;
    return (
      <g>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c1} stopOpacity={0.9} />
            <stop offset="100%" stopColor={c2} stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <rect x={x} y={y} width={width} height={height} rx={6} ry={6} fill={`url(#${id})`} />
      </g>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl p-6"
      style={cardStyle}
    >
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-white font-space">Severity Breakdown</h3>
        <p className="text-xs text-slate-500 mt-0.5">Count per severity level</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={severityData} barCategoryGap="35%" margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Space Grotesk' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            itemStyle={{ color: '#e2e8f0' }}
            cursor={{ fill: 'rgba(255,255,255,0.04)', radius: 6 }}
          />
          <Bar dataKey="count" shape={<CustomBar />} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}