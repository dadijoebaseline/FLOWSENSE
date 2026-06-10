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
  ScatterChart,
  Scatter,
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

export default function RouteAnalytics({ selectedMonth }) {
  // Fetch revenue by route per month
  const { data: revenueByRoute, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['revenueByRoute'],
    queryFn: () => staticDataService.getRevenueByRoutePerMonth(),
    staleTime: 5 * 60 * 1000,
  });

  // Prepare route efficiency data for selected month
  const routeEfficiencyData = useMemo(() => {
    if (!revenueByRoute || !selectedMonth) return [];

    return Object.entries(revenueByRoute)
      .map(([route, monthData]) => {
        const data = monthData[selectedMonth];
        return {
          name: route,
          revenue: data?.total || 0,
          avgRevenue: data?.avg || 0,
          accounts: data?.count || 0,
          efficiency: data?.count > 0 ? (data.total / data.count).toFixed(2) : 0, // Revenue per account
        };
      })
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 15);
  }, [revenueByRoute, selectedMonth]);

  // Top 10 routes by revenue
  const topRevenueRoutes = useMemo(() => {
    if (!revenueByRoute || !selectedMonth) return [];

    return Object.entries(revenueByRoute)
      .map(([route, monthData]) => {
        const data = monthData[selectedMonth];
        return {
          name: route,
          revenue: data?.total || 0,
          avgRevenue: data?.avg || 0,
          accounts: data?.count || 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [revenueByRoute, selectedMonth]);

  // Calculate route metrics
  const routeMetrics = useMemo(() => {
    if (!revenueByRoute || !selectedMonth) {
      return { totalRoutes: 0, avgRevenue: 0, topRoute: '', totalRevenue: 0 };
    }

    let totalRevenue = 0;
    let totalAccounts = 0;
    let topRoute = '';
    let topValue = 0;
    let routeCount = 0;

    for (const [route, monthData] of Object.entries(revenueByRoute)) {
      const data = monthData[selectedMonth];
      if (!data) continue;

      totalRevenue += data.total;
      totalAccounts += data.count;
      routeCount += 1;

      if (data.total > topValue) {
        topValue = data.total;
        topRoute = route;
      }
    }

    return {
      totalRoutes: routeCount,
      avgRevenue: routeCount > 0 ? Math.round((totalRevenue / routeCount) * 100) / 100 : 0,
      topRoute,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    };
  }, [revenueByRoute, selectedMonth]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-2"
      >
        <h2 className="text-2xl font-bold text-white">Route Analytics & Efficiency</h2>
        <p className="text-sm text-slate-400">
          Billing route performance and efficiency metrics for {selectedMonth}
        </p>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <MetricBox label="Total Routes" value={routeMetrics.totalRoutes} />
        <MetricBox label="Total Revenue" value={routeMetrics.totalRevenue} unit="PHP" />
        <MetricBox label="Avg per Route" value={routeMetrics.avgRevenue} unit="PHP" />
        <MetricBox label="Top Route" value={routeMetrics.topRoute} />
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
          {isLoadingRevenue ? (
            <LoadingChart />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topRevenueRoutes}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#cbd5e1' }} />
                <YAxis tick={{ fontSize: 12, fill: '#cbd5e1' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                  formatter={(value, name) => {
                    if (name === 'revenue') {
                      return [
                        `PHP ${(value || 0).toLocaleString('en-US', {
                          maximumFractionDigits: 0,
                        })}`,
                        'Revenue',
                      ];
                    }
                    return [value, name];
                  }}
                />
                <Bar dataKey="revenue" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Route Efficiency Scatter (Revenue per Account) */}
        <div
          className="rounded-xl p-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Route Efficiency (Revenue per Account)
          </h3>
          {isLoadingRevenue ? (
            <LoadingChart />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="accounts"
                  type="number"
                  name="Accounts"
                  tick={{ fontSize: 12, fill: '#cbd5e1' }}
                />
                <YAxis
                  dataKey="efficiency"
                  type="number"
                  name="Efficiency (PHP/Account)"
                  tick={{ fontSize: 12, fill: '#cbd5e1' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => {
                    if (name === 'efficiency') {
                      return [
                        `PHP ${(value || 0).toLocaleString('en-US', {
                          maximumFractionDigits: 2,
                        })}`,
                        'Efficiency',
                      ];
                    }
                    return [value, name];
                  }}
                />
                <Scatter
                  name="Routes"
                  data={routeEfficiencyData}
                  fill="#8b5cf6"
                  fillOpacity={0.7}
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Top Routes Leaderboard */}
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
          Top 15 Routes by Efficiency
        </h3>
        {isLoadingRevenue ? (
          <LoadingChart />
        ) : (
          <div className="space-y-2">
            {routeEfficiencyData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xl font-bold text-purple-400">#{index + 1}</span>
                  <div>
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.accounts} accounts · Total: PHP
                      {item.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
                <span className="text-purple-300 font-semibold">
                  PHP {item.efficiency.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  <span className="text-xs text-slate-400 ml-1">/account</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
