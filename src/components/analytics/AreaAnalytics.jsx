import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { staticDataService } from '../../lib/staticDataService';

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

export default function AreaAnalytics({ selectedMonth }) {
  // Fetch consumption and status data
  const { data: consumptionByArea, isLoading: isLoadingConsumption } = useQuery({
    queryKey: ['consumptionByArea'],
    queryFn: () => staticDataService.getConsumptionByAreaPerMonth(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: revenueByRoute, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['revenueByRoute'],
    queryFn: () => staticDataService.getRevenueByRoutePerMonth(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: statusByMonth, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['statusByMonth'],
    queryFn: () => staticDataService.getAccountsByStatusPerMonth(),
    staleTime: 5 * 60 * 1000,
  });

  // Prepare area performance data for selected month
  const areaPerformanceData = useMemo(() => {
    if (!consumptionByArea || !selectedMonth) return [];

    return Object.entries(consumptionByArea)
      .map(([area, monthData]) => {
        const data = monthData[selectedMonth];
        return {
          name: area,
          consumption: data?.total || 0,
          avgConsumption: data?.avg || 0,
          accounts: data?.count || 0,
        };
      })
      .sort((a, b) => b.consumption - a.consumption)
      .slice(0, 10);
  }, [consumptionByArea, selectedMonth]);

  // Calculate area metrics
  const areaMetrics = useMemo(() => {
    if (!consumptionByArea || !selectedMonth) {
      return { totalAreas: 0, avgConsumption: 0, topArea: '', totalAccounts: 0 };
    }

    let totalConsumption = 0;
    let totalAccounts = 0;
    let topArea = '';
    let topValue = 0;
    let areaCount = 0;

    for (const [area, monthData] of Object.entries(consumptionByArea)) {
      const data = monthData[selectedMonth];
      if (!data) continue;

      totalConsumption += data.total;
      totalAccounts += data.count;
      areaCount += 1;

      if (data.total > topValue) {
        topValue = data.total;
        topArea = area;
      }
    }

    return {
      totalAreas: areaCount,
      avgConsumption: areaCount > 0 ? Math.round((totalConsumption / areaCount) * 100) / 100 : 0,
      topArea,
      totalAccounts,
    };
  }, [consumptionByArea, selectedMonth]);

  // Status distribution for selected month
  const statusData = useMemo(() => {
    if (!statusByMonth || !selectedMonth) return [];

    return Object.entries(statusByMonth).map(([status, monthData]) => ({
      name: status,
      count: monthData[selectedMonth]?.count || 0,
    }));
  }, [statusByMonth, selectedMonth]);

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
          {isLoadingConsumption ? (
            <LoadingChart />
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
          {isLoadingStatus ? (
            <LoadingChart />
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
        {isLoadingConsumption ? (
          <LoadingChart />
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
