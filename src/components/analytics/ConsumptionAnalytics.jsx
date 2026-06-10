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
import { useSharedFilters } from '../../lib/FilterContext';
import { getClassificationName } from '../../lib/rateCodeMap';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

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

export default function ConsumptionAnalytics({ selectedMonth, filteredAccounts = [] }) {
  const { toggleArea, toggleClassification } = useSharedFilters();
  // Prepare consumption by area chart data for selected month
  const consumptionAreaChartData = useMemo(() => {
    const areaMap = {};

    for (const account of filteredAccounts) {
      if (account.datasetId !== selectedMonth || !account.area || account.cumUsed === undefined) continue;

      if (!areaMap[account.area]) {
        areaMap[account.area] = { total: 0, count: 0 };
      }
      areaMap[account.area].total += Number(account.cumUsed) || 0;
      areaMap[account.area].count += 1;
    }

    return Object.entries(areaMap)
      .map(([area, data]) => ({
        name: area,
        consumption: data.total,
      }))
      .sort((a, b) => b.consumption - a.consumption)
      .slice(0, 10);
  }, [filteredAccounts, selectedMonth]);

  // Prepare consumption by classification chart data for selected month
  const consumptionClassificationChartData = useMemo(() => {
    const classificationMap = {};

    for (const account of filteredAccounts) {
      if (account.datasetId !== selectedMonth || !account.rateCode || account.cumUsed === undefined) continue;

      if (!classificationMap[account.rateCode]) {
        classificationMap[account.rateCode] = 0;
      }
      classificationMap[account.rateCode] += Number(account.cumUsed) || 0;
    }

    return Object.entries(classificationMap)
      .map(([rateCode, consumption]) => ({
        name: getClassificationName(rateCode),
        rateCode,
        consumption,
      }))
      .sort((a, b) => b.consumption - a.consumption)
      .slice(0, 8);
  }, [filteredAccounts, selectedMonth]);

  // Calculate metrics for selected month
  const monthMetrics = useMemo(() => {
    let total = 0;
    let min = Infinity;
    let max = 0;
    let topArea = '';
    let topValue = 0;
    const areaMap = {};

    for (const account of filteredAccounts) {
      if (account.datasetId !== selectedMonth || account.cumUsed === undefined) continue;

      const consumption = Number(account.cumUsed) || 0;
      total += consumption;
      min = Math.min(min, consumption);
      max = Math.max(max, consumption);

      if (account.area) {
        if (!areaMap[account.area]) areaMap[account.area] = 0;
        areaMap[account.area] += consumption;

        if (areaMap[account.area] > topValue) {
          topValue = areaMap[account.area];
          topArea = account.area;
        }
      }
    }

    return {
      total: Math.round(total * 100) / 100,
      avg: filteredAccounts.length > 0 ? Math.round((total / filteredAccounts.length) * 100) / 100 : 0,
      min: min === Infinity ? 0 : Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      topArea,
    };
  }, [filteredAccounts, selectedMonth]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-2"
      >
        <h2 className="text-2xl font-bold text-white">Consumption Analytics</h2>
        <p className="text-sm text-slate-400">
          Water consumption breakdown by area and classification for {selectedMonth}
        </p>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <MetricBox label="Total Consumption" value={monthMetrics.total} unit="cu.m" />
        <MetricBox label="Avg per Account" value={monthMetrics.avg} unit="cu.m" />
        <MetricBox label="Min" value={monthMetrics.min} unit="cu.m" />
        <MetricBox label="Max" value={monthMetrics.max} unit="cu.m" />
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Top 10 Areas by Consumption */}
        <div
          className="rounded-xl p-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Top 10 Areas by Consumption
          </h3>
          {consumptionAreaChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={consumptionAreaChartData}>
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
                    `${(value || 0).toLocaleString('en-US', {
                      maximumFractionDigits: 1,
                    })} cu.m`,
                  ]}
                />
                <Bar
                  dataKey="consumption"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                  onClick={(data) => toggleArea(data.name)}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top 8 Classifications by Consumption */}
        <div
          className="rounded-xl p-6"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h3 className="text-lg font-semibold text-white mb-4">
            Top Classifications by Consumption
          </h3>
          {consumptionClassificationChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={consumptionClassificationChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="consumption"
                  onClick={(entry) => toggleClassification(entry.rateCode)}
                  cursor="pointer"
                >
                  {consumptionClassificationChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    `${(value || 0).toLocaleString('en-US', {
                      maximumFractionDigits: 1,
                    })} cu.m`,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Top 10 Consumers List */}
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
          Top 10 Consuming Areas
        </h3>
        {consumptionAreaChartData.length === 0 ? (
          <div className="text-slate-400">No data available</div>
        ) : (
          <div className="space-y-2">
            {consumptionAreaChartData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-blue-400">#{index + 1}</span>
                  <span className="text-white font-medium">{item.name}</span>
                </div>
                <span className="text-blue-300 font-semibold">
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
