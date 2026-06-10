import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import { staticDataService } from '../../lib/staticDataService';

/**
 * SmartInsights - Dynamic, filter-aware insights panel
 * Generates rank-based, trend, anomaly, and comparative observations
 * 
 * Props:
 * - filteredAccounts: Array of filtered account objects
 * - filters: Active filter object (areas, routes, statuses, classifications, ranges)
 * - selectedMonth: Currently selected month (YYYY-MM)
 * - isLoading: Whether data is still loading
 */
export default function SmartInsights({
  filteredAccounts = [],
  filters = {},
  selectedMonth = '2026-05',
  isLoading = false,
}) {
  const [insights, setInsights] = useState([]);
  const [insightLoading, setInsightLoading] = useState(false);

  // Memoize filtered account count to avoid unnecessary recalculations
  const filteredCount = useMemo(() => filteredAccounts.length, [filteredAccounts.length]);
  const hasActiveFilters = useMemo(
    () =>
      (filters.areas && filters.areas.length > 0) ||
      (filters.routes && filters.routes.length > 0) ||
      (filters.statuses && filters.statuses.length > 0) ||
      (filters.classifications && filters.classifications.length > 0) ||
      (filters.consumptionMin !== 0 || filters.consumptionMax !== 50000) ||
      (filters.revenueMin !== 0 || filters.revenueMax !== 100000),
    [filters]
  );

  // Calculate insights when filter state or selected month changes
  useEffect(() => {
    const calculateInsights = async () => {
      setInsightLoading(true);
      try {
        const newInsights = await staticDataService.generateInsights(
          filteredAccounts,
          filters,
          selectedMonth
        );
        setInsights(newInsights);
      } catch (error) {
        console.error('Error generating insights:', error);
        setInsights([]);
      } finally {
        setInsightLoading(false);
      }
    };

    calculateInsights();
  }, [filteredAccounts, filters, selectedMonth]);

  // Map insight types to icons
  const getInsightIcon = (type) => {
    switch (type) {
      case 'rank':
        return <BarChart3 className="w-5 h-5 text-blue-600" />;
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-amber-600" />;
      case 'anomaly':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'comparative':
        return <BarChart3 className="w-5 h-5 text-indigo-600" />;
      default:
        return <Lightbulb className="w-5 h-5 text-yellow-600" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Smart Insights</h2>
          </div>
          {hasActiveFilters && (
            <span className="text-xs font-medium bg-blue-200 text-blue-800 px-2 py-1 rounded">
              Filtered to {filteredCount.toLocaleString()} account{filteredCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Insights Grid */}
        {isLoading || insightLoading ? (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white rounded animate-pulse" />
            ))}
          </motion.div>
        ) : insights.length > 0 ? (
          <AnimatePresence mode="wait">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.map((insight, idx) => (
                <motion.div
                  key={`${insight.type}-${idx}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`${insight.color} rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 pt-1">
                      {insight.icon || getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 text-sm leading-tight">
                        {insight.title}
                      </h3>
                      <p className="text-gray-700 text-xs mt-1 leading-snug">
                        {insight.description}
                      </p>
                      {insight.confidence && (
                        <div className="mt-2 flex items-center gap-1">
                          <div className="flex-1 h-1 bg-gray-300 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-400 to-indigo-600"
                              style={{ width: `${insight.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">
                            {Math.round(insight.confidence * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        ) : filteredAccounts.length === 0 ? (
          <div className="text-center py-6">
            <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">
              No data matches your filters. Try adjusting the selections.
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-600 text-sm">
              Not enough data to generate insights. Select more accounts or data.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
