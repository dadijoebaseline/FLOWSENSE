import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * FilterContext - Shared filter state across Analytics and Dashboard pages
 * Enables bidirectional filtering: Analytics filters sync to map, map clicks apply filters
 */
const FilterContext = createContext();

export function FilterProvider({ children }) {
  const [sharedFilters, setSharedFilters] = useState({
    areas: [],
    routes: [],
    statuses: [],
    classifications: [],
    consumptionMin: 0,
    consumptionMax: 50000,
    revenueMin: 0,
    revenueMax: 100000,
  });

  const [isFilterActive, setIsFilterActive] = useState(false);

  // Toggle area filter
  const toggleArea = useCallback((area) => {
    setSharedFilters((prev) => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter((a) => a !== area)
        : [...prev.areas, area],
    }));
    setIsFilterActive(true);
  }, []);

  // Toggle route filter
  const toggleRoute = useCallback((route) => {
    setSharedFilters((prev) => ({
      ...prev,
      routes: prev.routes.includes(route)
        ? prev.routes.filter((r) => r !== route)
        : [...prev.routes, route],
    }));
    setIsFilterActive(true);
  }, []);

  // Toggle status filter
  const toggleStatus = useCallback((status) => {
    setSharedFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status],
    }));
    setIsFilterActive(true);
  }, []);

  // Toggle classification filter
  const toggleClassification = useCallback((classification) => {
    setSharedFilters((prev) => ({
      ...prev,
      classifications: prev.classifications.includes(classification)
        ? prev.classifications.filter((c) => c !== classification)
        : [...prev.classifications, classification],
    }));
    setIsFilterActive(true);
  }, []);

  // Set consumption range
  const setConsumptionRange = useCallback((min, max) => {
    setSharedFilters((prev) => ({
      ...prev,
      consumptionMin: min,
      consumptionMax: max,
    }));
    setIsFilterActive(true);
  }, []);

  // Set revenue range
  const setRevenueRange = useCallback((min, max) => {
    setSharedFilters((prev) => ({
      ...prev,
      revenueMin: min,
      revenueMax: max,
    }));
    setIsFilterActive(true);
  }, []);

  // Remove individual filter
  const removeFilter = useCallback((filterType, value) => {
    setSharedFilters((prev) => {
      const updated = { ...prev };
      if (filterType === 'area') {
        updated.areas = updated.areas.filter((a) => a !== value);
      } else if (filterType === 'route') {
        updated.routes = updated.routes.filter((r) => r !== value);
      } else if (filterType === 'status') {
        updated.statuses = updated.statuses.filter((s) => s !== value);
      } else if (filterType === 'classification') {
        updated.classifications = updated.classifications.filter((c) => c !== value);
      }
      return updated;
    });
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSharedFilters({
      areas: [],
      routes: [],
      statuses: [],
      classifications: [],
      consumptionMin: 0,
      consumptionMax: 50000,
      revenueMin: 0,
      revenueMax: 100000,
    });
    setIsFilterActive(false);
  }, []);

  // Apply filters to account list (AND logic)
  const applyFilters = useCallback((accounts) => {
    return accounts.filter((account) => {
      if (sharedFilters.areas.length > 0 && !sharedFilters.areas.includes(account.area)) {
        return false;
      }
      if (sharedFilters.routes.length > 0 && !sharedFilters.routes.includes(account.bookNo)) {
        return false;
      }
      if (sharedFilters.statuses.length > 0 && !sharedFilters.statuses.includes(account.status)) {
        return false;
      }
      if (
        sharedFilters.classifications.length > 0 &&
        !sharedFilters.classifications.includes(account.rateCode)
      ) {
        return false;
      }
      if (
        account.cumUsed < sharedFilters.consumptionMin ||
        account.cumUsed > sharedFilters.consumptionMax
      ) {
        return false;
      }
      if (
        account.billAmount < sharedFilters.revenueMin ||
        account.billAmount > sharedFilters.revenueMax
      ) {
        return false;
      }
      return true;
    });
  }, [sharedFilters]);

  const value = {
    // Shared filter state
    filters: sharedFilters,
    isFilterActive,

    // Toggle functions
    toggleArea,
    toggleRoute,
    toggleStatus,
    toggleClassification,

    // Range functions
    setConsumptionRange,
    setRevenueRange,

    // Management functions
    removeFilter,
    resetFilters,
    applyFilters,
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

/**
 * Hook to use shared filter context
 * Usage: const { filters, toggleArea, applyFilters } = useSharedFilters();
 */
export function useSharedFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useSharedFilters must be used within FilterProvider');
  }
  return context;
}
