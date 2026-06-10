import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getClassificationName } from '../../lib/rateCodeMap';
import { useSharedFilters } from '../../lib/FilterContext';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

function LoadingChart() {
  return (
    <div className="h-64 bg-slate-700/50 rounded-lg animate-pulse" />
  );
}

function MetricBox({ label, value, unit = '' }) {
  return (
    <div className="rounded-lg p-4 bg-slate-900/50 border border-slate-700">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">
        {typeof value === 'number'
          ? value.toLocaleString('en-US', { maximumFractionDigits: 1 })
          : value}
        {unit && <span className="text-sm ml-1">{unit}</span>}
      </p>
    </div>
  );
}

export default function RevenueAnalytics({ selectedMonth, filteredAccounts = [] }) {
  const { toggleRoute, toggleClassification } = useSharedFilters();
  // Prepare revenue by route chart data for selected month from filtered accounts
  const revenueRouteChartData = useMemo(() => {
    const routeMap = {};

    for (const account of filteredAccounts) {
      if (account.datasetId !== selectedMonth || !account.bookNo || account.billAmount === undefined) continue;

      if (!routeMap[account.bookNo]) {
        routeMap[account.bookNo] = 0;
      }
      routeMap[account.bookNo] += Number(account.billAmount) || 0;
    }

    return Object.entries(routeMap)
      .map(([route, revenue]) => ({
        name: route,
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredAccounts, selectedMonth]);

  // Prepare revenue by classification chart data for selected month from filtered accounts
  const revenueClassificationChartData = useMemo(() => {
    const classificationMap = {};

    for (const account of filteredAccounts) {
      if (account.datasetId !== selectedMonth || !account.rateCode || account.billAmount === undefined) continue;

      if (!classificationMap[account.rateCode]) {
        classificationMap[account.rateCode] = 0;
      }
      classificationMap[account.rateCode] += Number(account.billAmount) || 0;
    }

    return Object.entries(classificationMap)
      .map(([rateCode, revenue]) => ({
        name: getClassificationName(rateCode),
        rateCode,
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [filteredAccounts, selectedMonth]);

  // Calculate metrics for selected month
  const monthMetrics = useMemo(() => {
    let total = 0;
    let min = Infinity;
    let max = 0;
    let topRoute = '';
    let topValue = 0;

    const routeMap = {};

    for (const account of filteredAccounts) {
      if (account.datasetId !== selectedMonth || account.billAmount === undefined) continue;

      const revenue = Number(account.billAmount) || 0;
      total += revenue;
      min = Math.min(min, revenue);
      max = Math.max(max, revenue);

      if (account.bookNo) {
        if (!routeMap[account.bookNo]) routeMap[account.bookNo] = 0;
        routeMap[account.bookNo] += revenue;

        if (routeMap[account.bookNo] > topValue) {
          topValue = routeMap[account.bookNo];
          topRoute = account.bookNo;
        }
      }
    }

    return {
      total: Math.round(total * 100) / 100,
      avg: filteredAccounts.length > 0 ? Math.round((total / filteredAccounts.length) * 100) / 100 : 0,
      min: min === Infinity ? 0 : Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      topRoute,
    };
  }, [filteredAccounts, selectedMonth]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-2"
      >
        <h2 className="text-2xl font-bold text-white">Revenue Analytics</h2>
        <p className="text-sm text-slate-400">
          Billing revenue breakdown by route and classification for {selectedMonth}
        </p>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <MetricBox label="Total Revenue" value={monthMetrics.total} unit="PHP" />
        <MetricBox label="Avg per Account" value={monthMetrics.avg} unit="PHP" />
        <MetricBox label="Min" value={monthMetrics.min} unit="PHP" />
        <MetricBox label="Max" value={monthMetrics.max} unit="PHP" />
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Top 10 Routes by Revenue */}
        <div
          className="rounded-xl p-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Top 10 Routes by Revenue
          </h3>
          {revenueRouteChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueRouteChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 12, fill: '#cbd5e1' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [
                    `PHP ${(value || 0).toLocaleString('en-US', {
                      maximumFractionDigits: 0,
                    })}`,
                  ]}
                />
                <Bar
                  dataKey="revenue"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                  onClick={(data) => toggleRoute(data.name)}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top 8 Classifications by Revenue */}
        <div
          className="rounded-xl p-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Top Classifications by Revenue
          </h3>
          {revenueClassificationChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueClassificationChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                  onClick={(entry) => toggleClassification(entry.rateCode)}
                  cursor="pointer"
                >
                  {revenueClassificationChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    `PHP ${(value || 0).toLocaleString('en-US', {
                      maximumFractionDigits: 0,
                    })}`,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Top 10 Revenue Routes List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl p-6"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <h3 className="text-lg font-semibold text-white mb-4">
          Top 10 Revenue Routes
        </h3>
        {revenueRouteChartData.length === 0 ? (
          <div className="text-slate-400">No data available</div>
        ) : (
          <div className="space-y-2">
            {revenueRouteChartData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-green-400">#{index + 1}</span>
                  <span className="text-white font-medium">{item.name}</span>
                </div>
                <span className="text-green-300 font-semibold">
                  PHP{' '}
                  {item.revenue.toLocaleString('en-US', {
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
