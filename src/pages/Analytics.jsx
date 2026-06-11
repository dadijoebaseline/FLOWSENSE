import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
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
  BarChart3,
  MapPin,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { staticDataService } from '../lib/staticDataService';
import { getClassificationName } from '../lib/rateCodeMap';
import { useSharedFilters } from '../lib/FilterContext';
import SmartInsights from '../components/analytics/SmartInsights';
import { FilterPanel } from '../components/analytics/FilterPanel';

// Lazy-load analytics modules for code-splitting
const ConsumptionAnalytics = lazy(() => import('../components/analytics/ConsumptionAnalytics'));
const RevenueAnalytics = lazy(() => import('../components/analytics/RevenueAnalytics'));
const AreaAnalytics = lazy(() => import('../components/analytics/AreaAnalytics'));
const RouteAnalytics = lazy(() => import('../components/analytics/RouteAnalytics'));
const StatusClassificationAnalytics = lazy(() => import('../components/analytics/StatusClassificationAnalytics'));
const AccountTrends = lazy(() => import('../components/analytics/AccountTrends'));

const TABS = [
  { id: 'accounts', label: 'Account Trends', icon: '👥' },
  { id: 'kpi', label: 'Dashboard', icon: '📊' },
  { id: 'comparative', label: 'Anomaly Impact', icon: '⚠️' },
  { id: 'consumption', label: 'Consumption', icon: '💧' },
  { id: 'revenue', label: 'Revenue', icon: '💰' },
  { id: 'area', label: 'Area Performance', icon: '🗺️' },
  { id: 'route', label: 'Route Efficiency', icon: '🛣️' },
  { id: 'status', label: 'Status & Classification', icon: '📋' },
];

// Suspense loading fallback for lazy-loaded modules
function ModuleLoadingFallback() {
  return (
    <motion.div
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-96 bg-slate-800/50 rounded-lg border border-slate-700 animate-pulse"
        />
      ))}
    </motion.div>
  );
}

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

const KPI_ICONS = [
  { Icon: Droplets, color: 'text-blue-400', label: 'Total Consumption' },
  { Icon: DollarSign, color: 'text-green-400', label: 'Total Revenue' },
  { Icon: Users, color: 'text-purple-400', label: 'Total Accounts' },
  { Icon: Activity, color: 'text-orange-400', label: 'Active Accounts' },
  { Icon: AlertCircle, color: 'text-red-400', label: 'Disconnected' },
  { Icon: TrendingUp, color: 'text-cyan-400', label: 'Avg Consumption/Account' },
  { Icon: Zap, color: 'text-yellow-400', label: 'Avg Revenue/Account' },
];

export default function Analytics() {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthOptions, setMonthOptions] = useState([]);
  const [activeTab, setActiveTab] = useState('kpi');

  // Use shared filter context for bidirectional sync
  const {
    filters,
    isFilterActive,
    toggleArea,
    toggleRoute,
    toggleStatus,
    toggleClassification,
    setConsumptionRange,
    setRevenueRange,
    resetFilters,
    removeFilter,
    applyFilters,
  } = useSharedFilters();

  // Load available months
  useEffect(() => {
    const months = staticDataService.getAvailableMonths();
    setMonthOptions(months);
    if (months.length > 0 && !selectedMonth) {
      setSelectedMonth(months[months.length - 1]); // Default to latest month
    }
  }, [selectedMonth]);

  // Fetch all accounts with proper parsing and normalization
  const { data: allAccounts = [] } = useQuery({
    queryKey: ['allAccounts'],
    queryFn: async () => {
      return staticDataService.getAllAccounts();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Apply filters AND month selection to accounts
  const filteredAccounts = useMemo(() => {
    let filtered = applyFilters(allAccounts);
    // Filter by selected month
    if (selectedMonth) {
      filtered = filtered.filter(a => a.datasetId === selectedMonth);
    }
    return filtered;
  }, [allAccounts, applyFilters, selectedMonth]);

  // Fetch KPI metrics for selected month AND filtered accounts
  const kpiMetrics = useMemo(() => {
    if (!filteredAccounts || filteredAccounts.length === 0) return null;

    let totalConsumption = 0;
    let totalRevenue = 0;
    let activeCount = 0;
    let disconnectedCount = 0;

    for (const account of filteredAccounts) {
      totalConsumption += Number(account.cumUsed) || 0;
      totalRevenue += Number(account.billAmount) || 0;
      if (account.status === 'ACTIVE') activeCount += 1;
      if (account.status === 'DISCONNECTED') disconnectedCount += 1;
    }

    return {
      totalConsumption: Math.round(totalConsumption * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalAccounts: filteredAccounts.length,
      activeCount,
      disconnectedCount,
      avgConsumptionPerAccount: filteredAccounts.length > 0 ? Math.round((totalConsumption / filteredAccounts.length) * 100) / 100 : 0,
      avgRevenuePerAccount: filteredAccounts.length > 0 ? Math.round((totalRevenue / filteredAccounts.length) * 100) / 100 : 0,
      month: selectedMonth || 'all',
    };
  }, [filteredAccounts, selectedMonth]);

  const isLoadingKPI = !kpiMetrics;

  // Fetch monthly account metrics (per-month, not summed)
  const { data: monthlyMetrics = [], isLoading: isLoadingMonthly } = useQuery({
    queryKey: ['monthlyAccountMetrics'],
    queryFn: () => staticDataService.getMonthlyAccountMetrics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch anomalies once
  const { data: anomalies = [] } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => staticDataService.getAnomalies(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Compute comparative analysis (anomaly impact) from filtered accounts AND anomalies
  const comparativeAnalysis = useMemo(() => {
    if (!filteredAccounts || filteredAccounts.length === 0 || !anomalies) return null;

    const anomalousIds = new Set(anomalies.map(a => a.accountNumber || a.accountId));

    let totalConsumption = 0;
    let anomalousConsumption = 0;
    let totalRevenue = 0;
    let anomalousRevenue = 0;
    let anomalousAccounts = 0;

    // Aggregate metrics for filtered accounts only
    for (const account of filteredAccounts) {
      if (!account.accountId) continue;

      const consumption = Number(account.cumUsed) || 0;
      const revenue = Number(account.billAmount) || 0;

      totalConsumption += consumption;
      totalRevenue += revenue;

      if (anomalousIds.has(account.accountId)) {
        anomalousConsumption += consumption;
        anomalousRevenue += revenue;
        anomalousAccounts += 1;
      }
    }

    const normalConsumption = totalConsumption - anomalousConsumption;
    const normalRevenue = totalRevenue - anomalousRevenue;
    const normalAccounts = filteredAccounts.length - anomalousAccounts;

    // Build status breakdown
    const statuses = {};
    for (const account of filteredAccounts) {
      if (!account.accountId || !account.status) continue;
      const status = account.status;
      if (!statuses[status]) {
        statuses[status] = { total: 0, anomalous: 0 };
      }
      statuses[status].total += 1;
      if (anomalousIds.has(account.accountId)) {
        statuses[status].anomalous += 1;
      }
    }

    const anomalyRateByStatus = {};
    for (const status in statuses) {
      const data = statuses[status];
      anomalyRateByStatus[status] = {
        total: data.total,
        anomalous: data.anomalous,
        normal: data.total - data.anomalous,
        anomalyRate: data.total > 0 ? Math.round((data.anomalous / data.total) * 10000) / 100 : 0,
      };
    }

    // Build classification breakdown
    const classifications = {};
    for (const account of filteredAccounts) {
      if (!account.accountId || !account.rateCode) continue;
      const rateCode = account.rateCode;
      if (!classifications[rateCode]) {
        classifications[rateCode] = { total: 0, anomalous: 0 };
      }
      classifications[rateCode].total += 1;
      if (anomalousIds.has(account.accountId)) {
        classifications[rateCode].anomalous += 1;
      }
    }

    const anomalyRateByClassification = {};
    for (const rateCode in classifications) {
      const data = classifications[rateCode];
      anomalyRateByClassification[rateCode] = {
        total: data.total,
        anomalous: data.anomalous,
        normal: data.total - data.anomalous,
        anomalyRate: data.total > 0 ? Math.round((data.anomalous / data.total) * 10000) / 100 : 0,
      };
    }

    return {
      totalAccounts: filteredAccounts.length,
      anomalousAccounts,
      normalAccounts,
      anomalyAccountPercentage: filteredAccounts.length > 0 ? Math.round((anomalousAccounts / filteredAccounts.length) * 10000) / 100 : 0,
      normalAccountPercentage: filteredAccounts.length > 0 ? Math.round((normalAccounts / filteredAccounts.length) * 10000) / 100 : 0,

      totalConsumption: Math.round(totalConsumption * 100) / 100,
      anomalousConsumption: Math.round(anomalousConsumption * 100) / 100,
      normalConsumption: Math.round(normalConsumption * 100) / 100,
      anomalyConsumptionPercentage: totalConsumption > 0 ? Math.round((anomalousConsumption / totalConsumption) * 10000) / 100 : 0,
      normalConsumptionPercentage: totalConsumption > 0 ? Math.round((normalConsumption / totalConsumption) * 10000) / 100 : 0,

      totalRevenue: Math.round(totalRevenue * 100) / 100,
      anomalousRevenue: Math.round(anomalousRevenue * 100) / 100,
      normalRevenue: Math.round(normalRevenue * 100) / 100,
      anomalyRevenuePercentage: totalRevenue > 0 ? Math.round((anomalousRevenue / totalRevenue) * 10000) / 100 : 0,
      normalRevenuePercentage: totalRevenue > 0 ? Math.round((normalRevenue / totalRevenue) * 10000) / 100 : 0,

      anomalyRateByStatus,
      anomalyRateByClassification,
    };
  }, [filteredAccounts, anomalies]);

  const isLoadingComparative = !comparativeAnalysis;

  // Compute data distribution from filtered accounts
  const dataDistribution = useMemo(() => {
    if (!filteredAccounts || filteredAccounts.length === 0) return null;

    const statusCounts = {};
    const statusConsumption = {};
    const statusRevenue = {};
    const classificationCounts = {};
    const classificationConsumption = {};
    const classificationRevenue = {};
    const consumptionValues = [];
    const revenueValues = [];

    for (const account of filteredAccounts) {
      if (!account.accountId) continue;

      const consumption = Number(account.cumUsed) || 0;
      const revenue = Number(account.billAmount) || 0;

      consumptionValues.push(consumption);
      revenueValues.push(revenue);

      if (account.status) {
        statusCounts[account.status] = (statusCounts[account.status] || 0) + 1;
        statusConsumption[account.status] = (statusConsumption[account.status] || 0) + consumption;
        statusRevenue[account.status] = (statusRevenue[account.status] || 0) + revenue;
      }

      if (account.rateCode) {
        classificationCounts[account.rateCode] = (classificationCounts[account.rateCode] || 0) + 1;
        classificationConsumption[account.rateCode] = (classificationConsumption[account.rateCode] || 0) + consumption;
        classificationRevenue[account.rateCode] = (classificationRevenue[account.rateCode] || 0) + revenue;
      }
    }

    const sortedConsumption = consumptionValues.sort((a, b) => a - b);
    const sortedRevenue = revenueValues.sort((a, b) => a - b);

    const getQuartile = (sorted, q) => {
      const idx = Math.floor(sorted.length * q);
      return sorted[idx] || 0;
    };

    return {
      statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: (count / filteredAccounts.length) * 100,
        totalConsumption: Math.round(statusConsumption[status] * 100) / 100,
        totalRevenue: Math.round(statusRevenue[status] * 100) / 100,
        avgConsumption: count > 0 ? Math.round((statusConsumption[status] / count) * 100) / 100 : 0,
        avgRevenue: count > 0 ? Math.round((statusRevenue[status] / count) * 100) / 100 : 0,
      })),

      classificationDistribution: Object.entries(classificationCounts).map(([rateCode, count]) => ({
        rateCode,
        count,
        percentage: (count / filteredAccounts.length) * 100,
        totalConsumption: Math.round(classificationConsumption[rateCode] * 100) / 100,
        totalRevenue: Math.round(classificationRevenue[rateCode] * 100) / 100,
        avgConsumption: count > 0 ? Math.round((classificationConsumption[rateCode] / count) * 100) / 100 : 0,
        avgRevenue: count > 0 ? Math.round((classificationRevenue[rateCode] / count) * 100) / 100 : 0,
      })),

      consumptionDistribution: {
        min: sortedConsumption[0] || 0,
        q1: getQuartile(sortedConsumption, 0.25),
        median: getQuartile(sortedConsumption, 0.5),
        q3: getQuartile(sortedConsumption, 0.75),
        max: sortedConsumption[sortedConsumption.length - 1] || 0,
        mean: sortedConsumption.reduce((a, b) => a + b, 0) / sortedConsumption.length,
      },

      revenueDistribution: {
        min: sortedRevenue[0] || 0,
        q1: getQuartile(sortedRevenue, 0.25),
        median: getQuartile(sortedRevenue, 0.5),
        q3: getQuartile(sortedRevenue, 0.75),
        max: sortedRevenue[sortedRevenue.length - 1] || 0,
        mean: sortedRevenue.reduce((a, b) => a + b, 0) / sortedRevenue.length,
      },

      totalAccounts: filteredAccounts.length,
    };
  }, [filteredAccounts]);

  const isLoadingDistribution = !dataDistribution;

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
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-white">Analytics Dashboard</h1>
        <p className="text-slate-400">
          Temporal analysis of water consumption, revenue, and account metrics
          {isFilterActive && (
            <span className="ml-2 text-blue-400">
              ({filteredAccounts.length} accounts matching filters)
            </span>
          )}
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

      {/* Filter Panel */}
      <FilterPanel
        filters={filters}
        onToggleArea={toggleArea}
        onToggleRoute={toggleRoute}
        onToggleStatus={toggleStatus}
        onToggleClassification={toggleClassification}
        setConsumptionRange={setConsumptionRange}
        setRevenueRange={setRevenueRange}
        resetFilters={resetFilters}
        removeFilter={removeFilter}
        matchCount={filteredAccounts.length}
        totalCount={allAccounts.length}
      />

      {/* Smart Insights Panel */}
      <SmartInsights
        filteredAccounts={filteredAccounts}
        filters={filters}
        selectedMonth={selectedMonth || monthOptions[monthOptions.length - 1]}
        isLoading={false}
      />

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-2 overflow-x-auto pb-2"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                : 'bg-slate-900/50 text-slate-300 border border-slate-700 hover:border-slate-600'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Account Trends Tab */}
        {activeTab === 'accounts' && (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <AccountTrends monthlyData={monthlyMetrics} />
          </Suspense>
        )}

        {/* Dashboard Tab - KPI Cards */}
        {activeTab === 'kpi' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            </div>
          </div>
        )}

        {/* Comparative Analysis Tab - Anomaly Impact */}
        {activeTab === 'comparative' && comparativeAnalysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Executive Summary - Impact Overview */}
            <div className="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 rounded-xl border-2 border-orange-300 p-8 shadow-lg">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">⚠️ Anomaly Impact Analysis</h2>
                  <p className="text-gray-700 text-sm">Understanding the scope and severity of anomalies in your system</p>
                  <p className="text-xs text-orange-700 font-semibold mt-2 inline-block bg-orange-100 px-3 py-1 rounded">📅 Data: {selectedMonth ? `Selected Month Filter` : 'No month selected'} | Updated per month selection</p>
                </div>
              </div>

              {/* Key Impact Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Accounts Affected */}
                <div className="bg-white rounded-xl p-5 border-l-4 border-orange-500 shadow-md hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">ACCOUNTS AFFECTED</h3>
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="mb-3">
                    <p className="text-4xl font-bold text-orange-600">{comparativeAnalysis.anomalyAccountPercentage}%</p>
                    <p className="text-sm text-gray-600 font-medium mt-1">{comparativeAnalysis.anomalousAccounts} out of {comparativeAnalysis.totalAccounts}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ width: `${comparativeAnalysis.anomalyAccountPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {comparativeAnalysis.normalAccounts} normal accounts ({comparativeAnalysis.normalAccountPercentage}%)
                  </p>
                </div>

                {/* Consumption Impact */}
                <div className="bg-white rounded-xl p-5 border-l-4 border-red-500 shadow-md hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">CONSUMPTION IMPACT</h3>
                    <span className="text-2xl">💧</span>
                  </div>
                  <div className="mb-3">
                    <p className="text-4xl font-bold text-red-600">{comparativeAnalysis.anomalyConsumptionPercentage}%</p>
                    <p className="text-sm text-gray-600 font-medium mt-1">{(comparativeAnalysis.anomalousConsumption || 0).toLocaleString()} cu.m</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${comparativeAnalysis.anomalyConsumptionPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Normal: {(comparativeAnalysis.normalConsumption || 0).toLocaleString()} cu.m ({comparativeAnalysis.normalConsumptionPercentage}%)
                  </p>
                </div>

                {/* Revenue Impact */}
                <div className="bg-white rounded-xl p-5 border-l-4 border-rose-500 shadow-md hover:shadow-lg transition">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">REVENUE IMPACT</h3>
                    <span className="text-2xl">💰</span>
                  </div>
                  <div className="mb-3">
                    <p className="text-4xl font-bold text-rose-600">{comparativeAnalysis.anomalyRevenuePercentage}%</p>
                    <p className="text-sm text-gray-600 font-medium mt-1">₱{(comparativeAnalysis.anomalousRevenue || 0).toLocaleString()}</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-rose-500 h-2 rounded-full" 
                      style={{ width: `${comparativeAnalysis.anomalyRevenuePercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Normal: ₱{(comparativeAnalysis.normalRevenue || 0).toLocaleString()} ({comparativeAnalysis.normalRevenuePercentage}%)
                  </p>
                </div>
              </div>

              {/* Key Insights Summary */}
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase">🔍 Key Insights</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-orange-500 font-bold mr-2">•</span>
                    <span><strong>{comparativeAnalysis.anomalousAccounts}</strong> accounts ({comparativeAnalysis.anomalyAccountPercentage}%) are flagged as anomalous across all statuses and classifications</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 font-bold mr-2">•</span>
                    <span>Anomalies account for <strong>{comparativeAnalysis.anomalyConsumptionPercentage}%</strong> of total consumption ({(comparativeAnalysis.anomalousConsumption || 0).toLocaleString()} cu.m), indicating {'lower' in comparativeAnalysis && comparativeAnalysis.anomalyConsumptionPercentage < 5 ? 'localized' : 'widespread'} usage anomalies</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-rose-500 font-bold mr-2">•</span>
                    <span>Revenue impact is <strong>{comparativeAnalysis.anomalyRevenuePercentage}%</strong>, representing potential billing discrepancies worth ₱{(comparativeAnalysis.anomalousRevenue || 0).toLocaleString()}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Anomaly Rate by Status - More Detailed */}
            {comparativeAnalysis.anomalyRateByStatus && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Anomaly Rate by Account Status</h3>
                <p className="text-sm text-gray-600 mb-4">How many accounts in each status category are anomalous</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(comparativeAnalysis.anomalyRateByStatus).map(([status, data]) => (
                    <div key={status} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 hover:border-blue-400 transition">
                      <div className="flex justify-between items-start mb-3">
                        <p className="font-bold text-gray-900 text-lg">{status}</p>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">{data.anomalyRate}% anomalous</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-700">Total Accounts</span>
                            <span className="font-semibold">{data.total}</span>
                          </div>
                          <div className="w-full bg-gray-300 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-700">Anomalous</span>
                            <span className="font-semibold text-red-600">{data.anomalous}</span>
                          </div>
                          <div className="w-full bg-gray-300 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(data.anomalous / data.total) * 100}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-700">Normal</span>
                            <span className="font-semibold text-green-600">{data.total - data.anomalous}</span>
                          </div>
                          <div className="w-full bg-gray-300 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${((data.total - data.anomalous) / data.total) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Classification Distribution - Top Anomaly Risks */}
            {comparativeAnalysis.anomalyRateByClassification && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Anomaly Rate by Classification (Top 12)</h3>
                <p className="text-sm text-gray-600 mb-4">Which customer types have the highest anomaly rates</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(comparativeAnalysis.anomalyRateByClassification)
                    .sort(([, a], [, b]) => b.anomalyRate - a.anomalyRate)
                    .slice(0, 12)
                    .map(([rateCode, data], idx) => {
                      const severity = data.anomalyRate > 15 ? 'critical' : data.anomalyRate > 8 ? 'high' : data.anomalyRate > 3 ? 'medium' : 'low';
                      const severityColor = severity === 'critical' ? 'bg-red-100 border-red-300 text-red-700' 
                                           : severity === 'high' ? 'bg-orange-100 border-orange-300 text-orange-700'
                                           : severity === 'medium' ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                                           : 'bg-green-100 border-green-300 text-green-700';
                      return (
                        <div key={rateCode} className={`rounded-lg p-4 border-l-4 ${severityColor} bg-white border`}>
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-bold text-gray-900">{getClassificationName(rateCode)}</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${severityColor}`}>{data.anomalyRate}%</span>
                          </div>
                          <div className="text-sm text-gray-700 mb-2">
                            <p><span className="font-semibold text-red-600">{data.anomalous}</span> anomalous of <span className="font-semibold">{data.total}</span> total</p>
                          </div>
                          <div className="w-full bg-gray-300 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${severity === 'critical' ? 'bg-red-600' : severity === 'high' ? 'bg-orange-600' : severity === 'medium' ? 'bg-yellow-600' : 'bg-green-600'}`}
                              style={{ width: `${data.anomalyRate}%`, maxWidth: '100%' }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Comparative Analysis Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Normal Accounts Detail */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-300 p-6 shadow-md">
                <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center">
                  <span className="text-3xl mr-2">✅</span>
                  Normal Accounts (Healthy Baseline)
                </h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-gray-600 mb-1">Account Distribution</p>
                    <p className="text-3xl font-bold text-green-700">{comparativeAnalysis.normalAccountPercentage}%</p>
                    <p className="text-sm text-gray-700 mt-1">{comparativeAnalysis.normalAccounts} accounts operating normally</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-gray-600 mb-1">Consumption</p>
                    <p className="text-2xl font-bold text-green-700">{comparativeAnalysis.normalConsumptionPercentage}%</p>
                    <p className="text-sm text-gray-700 mt-1">{(comparativeAnalysis.normalConsumption || 0).toLocaleString()} cu.m total</p>
                    <p className="text-xs text-gray-600 mt-2">
                      Avg: {comparativeAnalysis.totalConsumption > 0 && comparativeAnalysis.normalAccounts > 0 ? ((comparativeAnalysis.normalConsumption || 0) / (comparativeAnalysis.normalAccounts || 1)).toFixed(2) : 0} cu.m/account
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-gray-600 mb-1">Revenue</p>
                    <p className="text-2xl font-bold text-green-700">{comparativeAnalysis.normalRevenuePercentage}%</p>
                    <p className="text-sm text-gray-700 mt-1">₱{(comparativeAnalysis.normalRevenue || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Anomalous Accounts Detail */}
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border-2 border-red-300 p-6 shadow-md">
                <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center">
                  <span className="text-3xl mr-2">⚠️</span>
                  Anomalous Accounts (Problem Cases)
                </h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-3 border border-red-200">
                    <p className="text-xs text-gray-600 mb-1">Account Distribution</p>
                    <p className="text-3xl font-bold text-red-700">{comparativeAnalysis.anomalyAccountPercentage}%</p>
                    <p className="text-sm text-gray-700 mt-1">{comparativeAnalysis.anomalousAccounts} accounts flagged</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-red-200">
                    <p className="text-xs text-gray-600 mb-1">Consumption</p>
                    <p className="text-2xl font-bold text-red-700">{comparativeAnalysis.anomalyConsumptionPercentage}%</p>
                    <p className="text-sm text-gray-700 mt-1">{(comparativeAnalysis.anomalousConsumption || 0).toLocaleString()} cu.m total</p>
                    <p className="text-xs text-gray-600 mt-2">
                      Avg: {comparativeAnalysis.totalConsumption > 0 && comparativeAnalysis.anomalousAccounts > 0 ? ((comparativeAnalysis.anomalousConsumption || 0) / (comparativeAnalysis.anomalousAccounts || 1)).toFixed(2) : 0} cu.m/account
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-red-200">
                    <p className="text-xs text-gray-600 mb-1">Revenue</p>
                    <p className="text-2xl font-bold text-red-700">{comparativeAnalysis.anomalyRevenuePercentage}%</p>
                    <p className="text-sm text-gray-700 mt-1">₱{(comparativeAnalysis.anomalousRevenue || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority Actions */}
            <div className="bg-blue-50 rounded-xl border-2 border-blue-300 p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-4">📋 Recommended Actions</h3>
              <ul className="space-y-2 text-sm text-blue-900">
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500 text-white text-xs font-bold mr-2 flex-shrink-0">1</span>
                  <span><strong>Review High-Risk Classifications:</strong> Focus on classifications with anomaly rates above 15% for immediate investigation</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500 text-white text-xs font-bold mr-2 flex-shrink-0">2</span>
                  <span><strong>Account Status Analysis:</strong> {Object.entries(comparativeAnalysis.anomalyRateByStatus).length > 0 ? `Check which status group (${Object.entries(comparativeAnalysis.anomalyRateByStatus).map(([s, d]) => `${s}: ${d.anomalyRate}%`).join(', ')}) needs attention` : 'Check which status group needs attention'}</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500 text-white text-xs font-bold mr-2 flex-shrink-0">3</span>
                  <span><strong>Use Anomalies Tab:</strong> View detailed list of {comparativeAnalysis.anomalousAccounts} flagged accounts with specific anomaly details and root causes</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-500 text-white text-xs font-bold mr-2 flex-shrink-0">4</span>
                  <span><strong>Revenue Recovery:</strong> Potential ₱{(comparativeAnalysis.anomalousRevenue || 0).toLocaleString()} in billing discrepancies worth investigating</span>
                </li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* Consumption Analytics Tab */}
        {activeTab === 'consumption' && selectedMonth && (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <ConsumptionAnalytics selectedMonth={selectedMonth} filteredAccounts={filteredAccounts} />
          </Suspense>
        )}

        {/* Revenue Analytics Tab */}
        {activeTab === 'revenue' && selectedMonth && (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <RevenueAnalytics selectedMonth={selectedMonth} filteredAccounts={filteredAccounts} />
          </Suspense>
        )}

        {/* Area Analytics Tab */}
        {activeTab === 'area' && selectedMonth && (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <AreaAnalytics selectedMonth={selectedMonth} filteredAccounts={filteredAccounts} />
          </Suspense>
        )}

        {/* Route Analytics Tab */}
        {activeTab === 'route' && selectedMonth && (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <RouteAnalytics selectedMonth={selectedMonth} filteredAccounts={filteredAccounts} />
          </Suspense>
        )}

        {/* Status & Classification Tab */}
        {activeTab === 'status' && selectedMonth && (
          <Suspense fallback={<ModuleLoadingFallback />}>
            <StatusClassificationAnalytics selectedMonth={selectedMonth} filteredAccounts={filteredAccounts} />
          </Suspense>
        )}
      </motion.div>
    </div>
  );
}
