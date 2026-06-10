import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { staticDataService } from '../../lib/staticDataService';
import { AreaFilter, RouteFilter, StatusFilter, ClassificationFilter } from './FilterDropdowns';
import { RangeSlider } from './RangeSlider';
import { FilterChips } from './FilterChips';
import { formatRateCode } from '../../lib/rateCodeMap';

export function FilterPanel({
  filters,
  onToggleArea,
  onToggleRoute,
  onToggleStatus,
  onToggleClassification,
  setConsumptionRange,
  setRevenueRange,
  resetFilters,
  removeFilter,
  matchCount,
  totalCount,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [consumptionRange, setConsumptionRangeLocal] = useState([0, 50000]);
  const [revenueRange, setRevenueRangeLocal] = useState([0, 100000]);

  // Fetch filter options
  const { data: filterOptions, isLoading: isLoadingOptions } = useQuery({
    queryKey: ['filterOptions'],
    queryFn: () => staticDataService.getFilterOptions(),
    staleTime: 5 * 60 * 1000,
  });

  // Update local consumption range when filters change
  useEffect(() => {
    setConsumptionRangeLocal([filters.consumptionMin, filters.consumptionMax < Infinity ? filters.consumptionMax : 50000]);
  }, [filters.consumptionMin, filters.consumptionMax]);

  // Update local revenue range when filters change
  useEffect(() => {
    setRevenueRangeLocal([filters.revenueMin, filters.revenueMax < Infinity ? filters.revenueMax : 100000]);
  }, [filters.revenueMin, filters.revenueMax]);

  const hasActiveFilters =
    filters.areas.length > 0 ||
    filters.routes.length > 0 ||
    filters.statuses.length > 0 ||
    filters.classifications.length > 0 ||
    filters.consumptionMin > 0 ||
    filters.consumptionMax < Infinity ||
    filters.revenueMin > 0 ||
    filters.revenueMax < Infinity;

  const handleConsumptionChange = (newRange) => {
    setConsumptionRangeLocal(newRange);
    setConsumptionRange(newRange[0], newRange[1]);
  };

  const handleRevenueChange = (newRange) => {
    setRevenueRangeLocal(newRange);
    setRevenueRange(newRange[0], newRange[1]);
  };

  const formatRateCodes = (rateCodes) => {
    return rateCodes.map((rc) => formatRateCode(rc));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Filter Header */}
      <div
        className="rounded-xl p-4 bg-slate-900/50 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">Filters</h3>
            {hasActiveFilters && (
              <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium">
                {filters.areas.length + filters.routes.length + filters.statuses.length + filters.classifications.length + (filters.consumptionMin > 0 || filters.consumptionMax < Infinity ? 1 : 0) + (filters.revenueMin > 0 || filters.revenueMax < Infinity ? 1 : 0)} active
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Filter Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Filter Controls */}
            <div className="rounded-xl p-6 bg-slate-900/50 border border-slate-700 space-y-4">
              {/* Dropdowns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AreaFilter
                  areas={filterOptions?.areas || []}
                  selectedAreas={filters.areas}
                  onToggle={onToggleArea}
                  disabled={isLoadingOptions}
                />
                <RouteFilter
                  routes={filterOptions?.routes || []}
                  selectedRoutes={filters.routes}
                  onToggle={onToggleRoute}
                  disabled={isLoadingOptions}
                />
                <StatusFilter
                  selectedStatuses={filters.statuses}
                  onToggle={onToggleStatus}
                  disabled={isLoadingOptions}
                />
                <ClassificationFilter
                  classifications={
                    filterOptions?.rateCodes ? formatRateCodes(filterOptions.rateCodes) : []
                  }
                  selectedClassifications={filters.classifications}
                  onToggle={onToggleClassification}
                  disabled={isLoadingOptions}
                />
              </div>

              {/* Range Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RangeSlider
                  label="Consumption Range (cu.m)"
                  min={0}
                  max={50000}
                  step={100}
                  value={consumptionRange}
                  onChange={handleConsumptionChange}
                  formatValue={(v) => (v === Infinity ? '∞' : v.toLocaleString())}
                  unit="cu.m"
                  disabled={isLoadingOptions}
                />
                <RangeSlider
                  label="Revenue Range (PHP)"
                  min={0}
                  max={100000}
                  step={1000}
                  value={revenueRange}
                  onChange={handleRevenueChange}
                  formatValue={(v) => (v === Infinity ? '∞' : `PHP ${v.toLocaleString()}`)}
                  disabled={isLoadingOptions}
                />
              </div>

              {/* Action Buttons */}
              {hasActiveFilters && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={resetFilters}
                    className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-sm font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset All Filters
                  </button>
                </div>
              )}
            </div>

            {/* Active Filters Display */}
            <FilterChips
              filters={filters}
              onRemove={removeFilter}
              matchCount={matchCount}
              totalCount={totalCount}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
