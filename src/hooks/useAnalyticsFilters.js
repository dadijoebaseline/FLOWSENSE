import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for managing analytics filters with AND logic
 * All selected filters must match (no account will be included unless it matches ALL criteria)
 */
export function useAnalyticsFilters() {
  const [filters, setFilters] = useState({
    areas: [],
    routes: [],
    statuses: [],
    classifications: [],
    consumptionMin: 0,
    consumptionMax: Infinity,
    revenueMin: 0,
    revenueMax: Infinity,
  });

  // Add/remove area filter
  const toggleArea = useCallback((area) => {
    setFilters((prev) => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter((a) => a !== area)
        : [...prev.areas, area],
    }));
  }, []);

  // Add/remove route filter
  const toggleRoute = useCallback((route) => {
    setFilters((prev) => ({
      ...prev,
      routes: prev.routes.includes(route)
        ? prev.routes.filter((r) => r !== route)
        : [...prev.routes, route],
    }));
  }, []);

  // Add/remove status filter
  const toggleStatus = useCallback((status) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
  }, []);

  // Add/remove classification filter
  const toggleClassification = useCallback((classification) => {
    setFilters((prev) => ({
      ...prev,
      classifications: prev.classifications.includes(classification)
        ? prev.classifications.filter((c) => c !== classification)
        : [...prev.classifications, classification],
    }));
  }, []);

  // Update consumption range
  const setConsumptionRange = useCallback((min, max) => {
    setFilters((prev) => ({
      ...prev,
      consumptionMin: Math.max(0, min),
      consumptionMax: max,
    }));
  }, []);

  // Update revenue range
  const setRevenueRange = useCallback((min, max) => {
    setFilters((prev) => ({
      ...prev,
      revenueMin: Math.max(0, min),
      revenueMax: max,
    }));
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.areas.length > 0 ||
      filters.routes.length > 0 ||
      filters.statuses.length > 0 ||
      filters.classifications.length > 0 ||
      filters.consumptionMin > 0 ||
      filters.consumptionMax < Infinity ||
      filters.revenueMin > 0 ||
      filters.revenueMax < Infinity
    );
  }, [filters]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({
      areas: [],
      routes: [],
      statuses: [],
      classifications: [],
      consumptionMin: 0,
      consumptionMax: Infinity,
      revenueMin: 0,
      revenueMax: Infinity,
    });
  }, []);

  // Remove individual filter
  const removeFilter = useCallback((filterType, value) => {
    if (filterType === 'area') {
      toggleArea(value);
    } else if (filterType === 'route') {
      toggleRoute(value);
    } else if (filterType === 'status') {
      toggleStatus(value);
    } else if (filterType === 'classification') {
      toggleClassification(value);
    } else if (filterType === 'consumptionMin') {
      setConsumptionRange(0, filters.consumptionMax);
    } else if (filterType === 'consumptionMax') {
      setConsumptionRange(filters.consumptionMin, Infinity);
    } else if (filterType === 'revenueMin') {
      setRevenueRange(0, filters.revenueMax);
    } else if (filterType === 'revenueMax') {
      setRevenueRange(filters.revenueMin, Infinity);
    }
  }, [filters, toggleArea, toggleRoute, toggleStatus, toggleClassification, setConsumptionRange, setRevenueRange]);

  /**
   * Apply filters to accounts with AND logic
   * All conditions must be true for an account to be included
   */
  const applyFilters = useCallback(
    (accounts) => {
      if (!hasActiveFilters) return accounts;

      return accounts.filter((account) => {
        // Area filter: if areas selected, account must be in one of them
        if (filters.areas.length > 0 && !filters.areas.includes(account.area)) {
          return false;
        }

        // Route filter: if routes selected, account must be in one of them
        if (filters.routes.length > 0 && !filters.routes.includes(account.bookNo)) {
          return false;
        }

        // Status filter: if statuses selected, account must have one of them
        if (filters.statuses.length > 0 && !filters.statuses.includes(account.status)) {
          return false;
        }

        // Classification filter: if classifications selected, account must have one of them
        if (filters.classifications.length > 0 && !filters.classifications.includes(account.rateCode)) {
          return false;
        }

        // Consumption range filter
        const consumption = Number(account.cumUsed) || 0;
        if (consumption < filters.consumptionMin || consumption > filters.consumptionMax) {
          return false;
        }

        // Revenue range filter
        const revenue = Number(account.billAmount) || 0;
        if (revenue < filters.revenueMin || revenue > filters.revenueMax) {
          return false;
        }

        return true;
      });
    },
    [hasActiveFilters, filters]
  );

  return {
    filters,
    toggleArea,
    toggleRoute,
    toggleStatus,
    toggleClassification,
    setConsumptionRange,
    setRevenueRange,
    resetFilters,
    removeFilter,
    applyFilters,
    hasActiveFilters,
  };
}
