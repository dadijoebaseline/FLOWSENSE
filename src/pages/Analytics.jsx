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

  // Fetch all accounts for filtering
  const { data: allAccounts = [] } = useQuery({
    queryKey: ['allAccounts'],
    queryFn: async () => {
      const accounts = [];
      for (const month of staticDataService.getAvailableMonths()) {
        const data = await staticDataService.getGeoJSONData(month);
        if (data.features) {
          accounts.push(
            ...data.features.map((f) => ({
              ...f.properties,
              datasetId: month,
            }))
          );
        }
      }
      return accounts;
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

  // Fetch KPI metrics for selected month
  const { data: kpiMetrics, isLoading: isLoadingKPI, error: errorKPI } = useQuery({
    queryKey: ['kpiMetrics', selectedMonth],
    queryFn: () => staticDataService.getKPIMetrics(selectedMonth || undefined),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!selectedMonth,
  });

  // Fetch monthly account metrics (per-month, not summed)
  const { data: monthlyMetrics = [], isLoading: isLoadingMonthly } = useQuery({
    queryKey: ['monthlyAccountMetrics'],
    queryFn: () => staticDataService.getMonthlyAccountMetrics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch comparative analysis (anomaly impact metrics)
  const { data: comparativeAnalysis, isLoading: isLoadingComparative } = useQuery({
    queryKey: ['comparativeAnalysis'],
    queryFn: () => staticDataService.getAnomalyComparativeAnalysis(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch data distribution metrics
  const { data: dataDistribution, isLoading: isLoadingDistribution } = useQuery({
    queryKey: ['dataDistribution'],
    queryFn: () => staticDataService.getDataDistribution(),
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
            {/* Anomaly Impact Overview */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Anomaly Impact Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <p className="text-sm text-gray-600 mb-1">Accounts Affected by Anomalies</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {comparativeAnalysis.anomalyAccountPercentage}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {comparativeAnalysis.anomalousAccounts} of {comparativeAnalysis.totalAccounts} accounts
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <p className="text-sm text-gray-600 mb-1">Consumption from Anomalies</p>
                  <p className="text-3xl font-bold text-red-600">
                    {comparativeAnalysis.anomalyConsumptionPercentage}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {comparativeAnalysis.anomalousConsumption?.toLocaleString()} of {comparativeAnalysis.totalConsumption?.toLocaleString()} cu.m
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-rose-200">
                  <p className="text-sm text-gray-600 mb-1">Revenue from Anomalies</p>
                  <p className="text-3xl font-bold text-rose-600">
                    {comparativeAnalysis.anomalyRevenuePercentage}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ₱{comparativeAnalysis.anomalousRevenue?.toLocaleString()} of ₱{comparativeAnalysis.totalRevenue?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Distribution */}
            {comparativeAnalysis.anomalyRateByStatus && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Anomaly Rate by Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(comparativeAnalysis.anomalyRateByStatus).map(([status, data]) => (
                    <div key={status} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="font-semibold text-gray-800">{status}</p>
                      <p className="text-2xl font-bold text-blue-600 mt-2">{data.anomalyRate}%</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {data.anomalous} of {data.total} accounts
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Classification Distribution (top anomaly rates) */}
            {comparativeAnalysis.anomalyRateByClassification && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Anomaly Rate by Classification (Top 10)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(comparativeAnalysis.anomalyRateByClassification)
                    .sort(([, a], [, b]) => b.anomalyRate - a.anomalyRate)
                    .slice(0, 10)
                    .map(([rateCode, data]) => (
                      <div key={rateCode} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <p className="font-semibold text-gray-700">{getClassificationName(rateCode)}</p>
                        <p className="text-lg font-bold text-red-600">{data.anomalyRate}%</p>
                        <p className="text-xs text-gray-600">
                          {data.anomalous}/{data.total}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Normal vs Anomalous Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-green-50 rounded-lg border border-green-200 p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-4">📈 Normal Accounts (Healthy Baseline)</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700"><span className="font-semibold">{comparativeAnalysis.normalAccountPercentage}%</span> of accounts</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">{comparativeAnalysis.normalConsumptionPercentage}%</span> of consumption</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">{comparativeAnalysis.normalRevenuePercentage}%</span> of revenue</p>
                  <p className="text-xs text-gray-600 mt-2">Avg: {comparativeAnalysis.totalConsumption > 0 ? (comparativeAnalysis.normalConsumption / comparativeAnalysis.normalAccounts).toFixed(1) : 0} cu.m/account</p>
                </div>
              </div>
              <div className="bg-red-50 rounded-lg border border-red-200 p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-4">⚠️ Anomalous Accounts (Problem Cases)</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-700"><span className="font-semibold">{comparativeAnalysis.anomalyAccountPercentage}%</span> of accounts</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">{comparativeAnalysis.anomalyConsumptionPercentage}%</span> of consumption</p>
                  <p className="text-sm text-gray-700"><span className="font-semibold">{comparativeAnalysis.anomalyRevenuePercentage}%</span> of revenue</p>
                  <p className="text-xs text-gray-600 mt-2">Avg: {comparativeAnalysis.totalConsumption > 0 ? (comparativeAnalysis.anomalousConsumption / comparativeAnalysis.anomalousAccounts).toFixed(1) : 0} cu.m/account</p>
                </div>
              </div>
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
