import React from 'react';
import { X } from 'lucide-react';
import { getClassificationName, formatRateCode } from '../../lib/rateCodeMap';

export function FilterChips({ filters, onRemove, matchCount, totalCount }) {
  const chips = [];

  // Area filters
  filters.areas.forEach((area) => {
    chips.push({
      id: `area-${area}`,
      label: `Area: ${area}`,
      type: 'area',
      value: area,
      color: 'bg-blue-500/20 text-blue-300',
    });
  });

  // Route filters
  filters.routes.forEach((route) => {
    chips.push({
      id: `route-${route}`,
      label: `Route: ${route}`,
      type: 'route',
      value: route,
      color: 'bg-cyan-500/20 text-cyan-300',
    });
  });

  // Status filters
  filters.statuses.forEach((status) => {
    chips.push({
      id: `status-${status}`,
      label: `Status: ${status}`,
      type: 'status',
      value: status,
      color: 'bg-green-500/20 text-green-300',
    });
  });

  // Classification filters
  filters.classifications.forEach((rateCode) => {
    chips.push({
      id: `classification-${rateCode}`,
      label: `Classification: ${formatRateCode(rateCode)}`,
      type: 'classification',
      value: rateCode,
      color: 'bg-purple-500/20 text-purple-300',
    });
  });

  // Consumption range filter
  if (filters.consumptionMin > 0 || filters.consumptionMax < Infinity) {
    const minLabel = filters.consumptionMin > 0 ? filters.consumptionMin.toLocaleString() : '0';
    const maxLabel = filters.consumptionMax < Infinity ? filters.consumptionMax.toLocaleString() : '∞';
    chips.push({
      id: 'consumption-range',
      label: `Consumption: ${minLabel} - ${maxLabel} cu.m`,
      type: 'consumptionRange',
      value: null,
      color: 'bg-orange-500/20 text-orange-300',
    });
  }

  // Revenue range filter
  if (filters.revenueMin > 0 || filters.revenueMax < Infinity) {
    const minLabel = filters.revenueMin > 0 ? `PHP ${filters.revenueMin.toLocaleString()}` : '0';
    const maxLabel = filters.revenueMax < Infinity ? `PHP ${filters.revenueMax.toLocaleString()}` : '∞';
    chips.push({
      id: 'revenue-range',
      label: `Revenue: ${minLabel} - ${maxLabel}`,
      type: 'revenueRange',
      value: null,
      color: 'bg-yellow-500/20 text-yellow-300',
    });
  }

  if (chips.length === 0 && matchCount === totalCount) {
    return null;
  }

  return (
    <div className="space-y-3">
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <div
              key={chip.id}
              className={`${chip.color} px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-current/20`}
            >
              <span>{chip.label}</span>
              <button
                onClick={() => onRemove(chip.type, chip.value)}
                className="hover:opacity-70 transition-opacity"
                aria-label={`Remove ${chip.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Match count */}
      <div className="text-sm text-slate-400">
        Showing{' '}
        <span className="font-semibold text-slate-200">
          {matchCount.toLocaleString()}
        </span>{' '}
        of{' '}
        <span className="font-semibold text-slate-200">
          {totalCount.toLocaleString()}
        </span>{' '}
        accounts
        {chips.length > 0 && (
          <span className="ml-2 text-blue-400">
            ({Math.round((matchCount / totalCount) * 100)}% match)
          </span>
        )}
      </div>
    </div>
  );
}
