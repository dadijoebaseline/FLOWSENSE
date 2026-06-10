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
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { getClassificationName } from '../../lib/rateCodeMap';
import { useSharedFilters } from '../../lib/FilterContext';

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

export default function StatusClassificationAnalytics({ selectedMonth, filteredAccounts = [] }) {
  const { toggleStatus, toggleClassification } = useSharedFilters();
  // Prepare status distribution data from filtered accounts
  const statusDistribution = useMemo(() => {
    const statusMap = {};

    for (const account of filteredAccounts) {
      if (account.datasetId !== selectedMonth || !account.status) continue;

      if (!statusMap[account.status]) {
        statusMap[account.status] = 0;
      }
      statusMap[account.status] += 1;
    }

    return Object.entries(statusMap).map(([status, count]) => ({
      name: status,
      count,
    }));
  }, [filteredAccounts, selectedMonth]);

  // Prepare classification data from filtered accounts
  const classificationData = useMemo(() => {
    const classificationMap = {};

    for (const account of filteredAccounts) {
      if (account.datasetId !== selectedMonth || !account.rateCode) continue;

      if (!classificationMap[account.rateCode]) {
        classificationMap[account.rateCode] = { count: 0, consumption: 0, revenue: 0 };
      }
      classificationMap[account.rateCode].count += 1;
      classificationMap[account.rateCode].consumption += Number(account.cumUsed) || 0;
      classificationMap[account.rateCode].revenue += Number(account.billAmount) || 0;
    }

    return Object.entries(classificationMap)
      .map(([rateCode, data]) => ({
        name: getClassificationName(rateCode),
        rateCode,
        count: data.count,
        consumption: data.consumption,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredAccounts, selectedMonth]);

  // Categorize classifications
  const classificationGroups = useMemo(() => {
    const groups = { residential: 0, commercial: 0, industrial: 0, government: 0, other: 0 };
    const residentialCodes = ['01', '02', '02A'];
    const commercialCodes = ['03', '04', '06', '07', '08', '10', '11', '12', '18', '19'];
    const industrialCodes = ['05'];
    const governmentCodes = ['09', '09A', '09B'];
    const institutionalCodes = ['14', '15', '15A', '16', '17'];
    const otherCodes = ['13', '20', '21'];

    for (const account of filteredAccounts) {
      if (account.datasetId !== selectedMonth || !account.rateCode) continue;

      const rateCode = account.rateCode;
      if (residentialCodes.includes(rateCode)) {
        groups.residential += 1;
      } else if (commercialCodes.includes(rateCode)) {
        groups.commercial += 1;
      } else if (industrialCodes.includes(rateCode)) {
        groups.industrial += 1;
      } else if (governmentCodes.includes(rateCode) || institutionalCodes.includes(rateCode)) {
        groups.government += 1;
      } else if (otherCodes.includes(rateCode)) {
        groups.other += 1;
      } else {
        groups.other += 1;
      }
    }

    return groups;
  }, [filteredAccounts, selectedMonth]);

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
          {statusDistribution.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">No data available</div>
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
                  onClick={(entry) => toggleStatus(entry.name)}
                  cursor="pointer"
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
          {classificationGroupsChart.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">No data available</div>
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
                <Bar
                  dataKey="count"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                  onClick={(data) => toggleClassification(data.rateCode)}
                  cursor="pointer"
                />
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
        {classificationData.length === 0 ? (
          <div className="text-slate-400">No data available</div>
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
