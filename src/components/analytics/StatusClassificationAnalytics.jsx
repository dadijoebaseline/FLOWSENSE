import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { staticDataService } from '../../lib/staticDataService';
import { getClassificationName } from '../../lib/rateCodeMap';

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];
const STATUS_COLORS = { ACTIVE: '#10b981', DISCONNECTED: '#ef4444' };

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

export default function StatusClassificationAnalytics({ selectedMonth }) {
  // Fetch status data
  const { data: statusByMonth, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['statusByMonth'],
    queryFn: () => staticDataService.getAccountsByStatusPerMonth(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch metrics by classification
  const { data: metricsByClassification, isLoading: isLoadingClassification } = useQuery({
    queryKey: ['metricsByClassification'],
    queryFn: () => staticDataService.getMetricsByClassificationPerMonth(),
    staleTime: 5 * 60 * 1000,
  });

  // Prepare status distribution data
  const statusDistribution = useMemo(() => {
    if (!statusByMonth || !selectedMonth) return [];

    return Object.entries(statusByMonth).map(([status, monthData]) => ({
      name: status,
      count: monthData[selectedMonth]?.count || 0,
    }));
  }, [statusByMonth, selectedMonth]);

  // Prepare classification data
  const classificationData = useMemo(() => {
    if (!metricsByClassification || !selectedMonth) return [];

    return Object.entries(metricsByClassification)
      .map(([rateCode, monthData]) => {
        const data = monthData[selectedMonth];
        return {
          name: getClassificationName(rateCode),
          rateCode,
          count: data?.count || 0,
          consumption: data?.consumption?.total || 0,
          revenue: data?.revenue?.total || 0,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [metricsByClassification, selectedMonth]);

  // Categorize classifications
  const classificationGroups = useMemo(() => {
    if (!metricsByClassification || !selectedMonth) {
      return { residential: 0, commercial: 0, industrial: 0, government: 0, other: 0 };
    }

    const groups = { residential: 0, commercial: 0, industrial: 0, government: 0, other: 0 };
    const residentialCodes = ['01', '02', '02A'];
    const commercialCodes = ['03', '04', '06', '07', '08', '10', '11', '12', '18', '19'];
    const industrialCodes = ['05'];
    const governmentCodes = ['09', '09A', '09B'];
    const institutionalCodes = ['14', '15', '15A', '16', '17'];
    const otherCodes = ['13', '20', '21'];

    for (const [rateCode, monthData] of Object.entries(metricsByClassification)) {
      const data = monthData[selectedMonth];
      if (!data) continue;

      const count = data.count;
      if (residentialCodes.includes(rateCode)) {
        groups.residential += count;
      } else if (commercialCodes.includes(rateCode)) {
        groups.commercial += count;
      } else if (industrialCodes.includes(rateCode)) {
        groups.industrial += count;
      } else if (governmentCodes.includes(rateCode) || institutionalCodes.includes(rateCode)) {
        groups.government += count;
      } else if (otherCodes.includes(rateCode)) {
        groups.other += count;
      } else {
        groups.other += count;
      }
    }

    return groups;
  }, [metricsByClassification, selectedMonth]);

  // Format classification groups for chart
  const classificationGroupsChart = useMemo(() => {
    return [
      { name: 'Residential', count: classificationGroups.residential },
      { name: 'Commercial', count: classificationGroups.commercial },
      { name: 'Industrial', count: classificationGroups.industrial },
      { name: 'Government', count: classificationGroups.government },
      { name: 'Other', count: classificationGroups.other },
    ].filter((d) => d.count > 0);
  }, [classificationGroups]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalAccounts = statusDistribution.reduce((sum, s) => sum + s.count, 0);
    const activeAccounts = statusDistribution.find((s) => s.name === 'ACTIVE')?.count || 0;
    const disconnectedAccounts = statusDistribution.find((s) => s.name === 'DISCONNECTED')?.count || 0;
    const activePercentage = totalAccounts > 0 ? ((activeAccounts / totalAccounts) * 100).toFixed(1) : 0;

    return {
      totalAccounts,
      activeAccounts,
      disconnectedAccounts,
      activePercentage,
    };
  }, [statusDistribution]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-2"
      >
        <h2 className="text-2xl font-bold text-white">Status & Classification Analytics</h2>
        <p className="text-sm text-slate-400">
          Account status and customer classification distribution for {selectedMonth}
        </p>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <MetricBox label="Total Accounts" value={metrics.totalAccounts} />
        <MetricBox label="Active Accounts" value={metrics.activeAccounts} />
        <MetricBox label="Disconnected" value={metrics.disconnectedAccounts} />
        <MetricBox label="Active %" value={metrics.activePercentage} unit="%" />
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Status Distribution */}
        <div
          className="rounded-xl p-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Account Status Distribution
          </h3>
          {isLoadingStatus ? (
            <LoadingChart />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.name] || COLORS[index]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Accounts']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Classification Groups Distribution */}
        <div
          className="rounded-xl p-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Classification Group Distribution
          </h3>
          {isLoadingClassification ? (
            <LoadingChart />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classificationGroupsChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 12, fill: '#cbd5e1' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [value, 'Accounts']}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Top Classifications */}
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
          Top 10 Classifications by Account Count
        </h3>
        {isLoadingClassification ? (
          <LoadingChart />
        ) : (
          <div className="space-y-2">
            {classificationData.map((item, index) => (
              <div
                key={item.rateCode}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xl font-bold text-indigo-400">#{index + 1}</span>
                  <div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      Consumption: {item.consumption.toLocaleString('en-US', { maximumFractionDigits: 0 })} cu.m
                      · Revenue: PHP
                      {item.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
                <span className="text-indigo-300 font-semibold">
                  {item.count} accounts
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
