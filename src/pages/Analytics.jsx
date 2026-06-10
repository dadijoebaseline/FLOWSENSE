import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Droplets,
  TrendingUp,
  Users,
  Activity,
  AlertCircle,
  Zap,
  DollarSign,
} from 'lucide-react';
import { staticDataService } from '../lib/staticDataService';
import { getClassificationName } from '../lib/rateCodeMap';

const KPI_ICONS = [
  { Icon: Droplets, color: 'text-blue-400', label: 'Total Consumption' },
  { Icon: DollarSign, color: 'text-green-400', label: 'Total Revenue' },
  { Icon: Users, color: 'text-purple-400', label: 'Total Accounts' },
  { Icon: Activity, color: 'text-orange-400', label: 'Active Accounts' },
  { Icon: AlertCircle, color: 'text-red-400', label: 'Disconnected' },
  { Icon: TrendingUp, color: 'text-cyan-400', label: 'Avg Consumption/Account' },
  { Icon: Zap, color: 'text-yellow-400', label: 'Avg Revenue/Account' },
];

function KPICard({ icon: Icon, value, label, color, loading, decimals = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-400 mb-2">{label}</p>
          {loading ? (
            <div className="h-8 bg-slate-700/50 rounded animate-pulse w-32" />
          ) : (
            <p className="text-3xl font-bold text-white">
              {typeof value === 'number'
                ? value.toLocaleString('en-US', {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals,
                  })
                : value}
            </p>
          )}
        </div>
        <motion.div
          whileHover={{ scale: 1.1 }}
          className={`${color} p-3 rounded-full bg-slate-900/50`}
        >
          <Icon className="w-5 h-5" />
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function Analytics() {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthOptions, setMonthOptions] = useState([]);

  // Load available months
  useEffect(() => {
    const months = staticDataService.getAvailableMonths();
    setMonthOptions(months);
    if (months.length > 0 && !selectedMonth) {
      setSelectedMonth(months[months.length - 1]); // Default to latest month
    }
  }, [selectedMonth]);

  // Fetch KPI metrics
  const { data: kpiMetrics, isLoading: isLoadingKPI, error: errorKPI } = useQuery({
    queryKey: ['kpiMetrics'],
    queryFn: () => staticDataService.getKPIMetrics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const kpiData = useMemo(
    () =>
      kpiMetrics
        ? [
            {
              value: kpiMetrics.totalConsumption,
              label: 'Total Consumption (cu.m)',
              decimals: 2,
            },
            {
              value: kpiMetrics.totalRevenue,
              label: 'Total Revenue',
              decimals: 2,
            },
            {
              value: kpiMetrics.totalAccounts,
              label: 'Total Accounts',
              decimals: 0,
            },
            {
              value: kpiMetrics.activeCount,
              label: 'Active Accounts',
              decimals: 0,
            },
            {
              value: kpiMetrics.disconnectedCount,
              label: 'Disconnected Accounts',
              decimals: 0,
            },
            {
              value: kpiMetrics.avgConsumptionPerAccount,
              label: 'Avg Consumption/Account',
              decimals: 2,
            },
            {
              value: kpiMetrics.avgRevenuePerAccount,
              label: 'Avg Revenue/Account',
              decimals: 2,
            },
          ]
        : [],
    [kpiMetrics]
  );

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-white">Analytics Dashboard</h1>
        <p className="text-slate-400">
          Temporal analysis of water consumption, revenue, and account metrics
        </p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-4 flex-wrap"
      >
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-300">
            Select Month:
          </label>
          <select
            value={selectedMonth || ''}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Error State */}
      {errorKPI && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg bg-red-500/10 border border-red-500/20 p-4"
        >
          <p className="text-red-400 text-sm">
            Error loading analytics data: {errorKPI.message}
          </p>
        </motion.div>
      )}

      {/* KPI Cards Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {kpiData.map((kpi, index) => (
          <KPICard
            key={`kpi-${index}`}
            icon={KPI_ICONS[index % KPI_ICONS.length].Icon}
            color={KPI_ICONS[index % KPI_ICONS.length].color}
            value={kpi.value}
            label={kpi.label}
            loading={isLoadingKPI}
            decimals={kpi.decimals}
          />
        ))}
      </motion.div>

      {/* Placeholder for future modules */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl p-8 text-center"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        }}
      >
        <p className="text-slate-400">
          Analytics modules and filtering system coming in Phase 2-3...
        </p>
      </motion.div>
    </div>
  );
}
