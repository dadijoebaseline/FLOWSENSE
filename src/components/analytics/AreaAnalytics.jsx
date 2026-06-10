import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from 'recharts';
import { useSharedFilters } from '../../lib/FilterContext';

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

export default function AreaAnalytics({ selectedMonth, filteredAccounts = [] }) {
  const { toggleArea } = useSharedFilters();
  // Prepare area performance data for selected month from filtered accounts
  const areaPerformanceData = useMemo(() => {
    const areaMap = {};

    for (const account of filteredAccounts) {
      if (account.datasetId !== selectedMonth || !account.area) continue;

      if (!areaMap[account.area]) {
        areaMap[account.area] = { consumption: 0, count: 0 };
      }
      areaMap[account.area].consumption += Number(account.cumUsed) || 0;
      areaMap[account.area].count += 1;
    }

    return Object.entries(areaMap)
      .map(([area, data]) => ({
        name: area,
        consumption: data.consumption,
        avgConsumption: data.count > 0 ? data.consumption / data.count : 0,
        accounts: data.count,
      }))
      .sort((a, b) => b.consumption - a.consumption)
      .slice(0, 10);
  }, [filteredAccounts, selectedMonth]);

  // Calculate area metrics from filtered accounts
  const areaMetrics = useMemo(() => {
    const areaMap = {};
    let totalConsumption = 0;
    let totalAccounts = 0;
    let topArea = '';
    let topValue = 0;

    for (const account of filteredAccounts) {
      if (account.datasetId !== selectedMonth || !account.area) continue;

      const consumption = Number(account.cumUsed) || 0;

      if (!areaMap[account.area]) {
        areaMap[account.area] = 0;
      }
      areaMap[account.area] += consumption;
      totalConsumption += consumption;
      totalAccounts += 1;

      if (areaMap[account.area] > topValue) {
        topValue = areaMap[account.area];
        topArea = account.area;
      }
    }

    const areaCount = Object.keys(areaMap).length;

    return {
      totalAreas: areaCount,
      avgConsumption: areaCount > 0 ? Math.round((totalConsumption / areaCount) * 100) / 100 : 0,
      topArea,
      totalAccounts,
    };
  }, [filteredAccounts, selectedMonth]);

  // Status distribution from filtered accounts
  const statusData = useMemo(() => {
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

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-2"
      >
        <h2 className="text-2xl font-bold text-white">Area Performance Analytics</h2>
        <p className="text-sm text-slate-400">
          Service area analysis with consumption and account distribution for {selectedMonth}
        </p>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <MetricBox label="Total Areas" value={areaMetrics.totalAreas} />
        <MetricBox label="Avg Consumption" value={areaMetrics.avgConsumption} unit="cu.m" />
        <MetricBox label="Total Accounts" value={areaMetrics.totalAccounts} />
        <MetricBox label="Top Area" value={areaMetrics.topArea} />
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Area Consumption Performance */}
        <div
          className="rounded-xl p-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Top 10 Areas - Consumption & Account Count
          </h3>
          {areaPerformanceData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={areaPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#cbd5e1' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#cbd5e1' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#cbd5e1' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                  formatter={(value, name) => {
                    if (name === 'consumption') {
                      return [
                        `${(value || 0).toLocaleString('en-US', {
                          maximumFractionDigits: 1,
                        })} cu.m`,
                        'Consumption',
                      ];
                    }
                    return [value, 'Accounts'];
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="consumption"
                  fill="#3b82f6"
                  name="Consumption (cu.m)"
                  radius={[8, 8, 0, 0]}
                  onClick={(data) => toggleArea(data.name)}
                  cursor="pointer"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="accounts"
                  stroke="#ef4444"
                  name="Accounts"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Account Status Distribution */}
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
          {statusData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 12, fill: '#cbd5e1' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                  formatter={(value) => [value, 'Count']}
                />
                <Bar
                  dataKey="count"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                  name="Accounts"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Top Areas Leaderboard */}
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
          Top 10 Areas by Performance
        </h3>
        {areaPerformanceData.length === 0 ? (
          <div className="text-slate-400">No data available</div>
        ) : (
          <div className="space-y-2">
            {areaPerformanceData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xl font-bold text-cyan-400">#{index + 1}</span>
                  <div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.accounts} accounts · Avg:{' '}
                      {item.avgConsumption.toLocaleString('en-US', {
                        maximumFractionDigits: 1,
                      })}{' '}
                      cu.m
                    </p>
                  </div>
                </div>
                <span className="text-cyan-300 font-semibold">
                  {item.consumption.toLocaleString('en-US', {
                    maximumFractionDigits: 1,
                  })}{' '}
                  cu.m
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
