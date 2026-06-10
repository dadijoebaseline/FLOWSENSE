import React, { useMemo, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

export function AreaFilter({ areas, selectedAreas, onToggle, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2 rounded-lg border text-left text-sm font-medium transition-all flex items-center justify-between ${
          disabled
            ? 'bg-slate-700/30 border-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
        }`}
      >
        <span>
          Area
          {selectedAreas.length > 0 && (
            <span className="ml-2 px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs">
              {selectedAreas.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-lg z-10">
          <div className="max-h-48 overflow-y-auto">
            {areas.length === 0 ? (
              <div className="p-3 text-slate-400 text-sm">No areas available</div>
            ) : (
              areas.map((area) => (
                <label
                  key={area}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedAreas.includes(area)}
                    onChange={() => onToggle(area)}
                    className="w-4 h-4 rounded border-slate-600"
                  />
                  <span className="text-slate-300">{area}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function RouteFilter({ routes, selectedRoutes, onToggle, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2 rounded-lg border text-left text-sm font-medium transition-all flex items-center justify-between ${
          disabled
            ? 'bg-slate-700/30 border-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
        }`}
      >
        <span>
          Route
          {selectedRoutes.length > 0 && (
            <span className="ml-2 px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs">
              {selectedRoutes.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-lg z-10">
          <div className="max-h-48 overflow-y-auto">
            {routes.length === 0 ? (
              <div className="p-3 text-slate-400 text-sm">No routes available</div>
            ) : (
              routes.map((route) => (
                <label
                  key={route}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoutes.includes(route)}
                    onChange={() => onToggle(route)}
                    className="w-4 h-4 rounded border-slate-600"
                  />
                  <span className="text-slate-300">{route}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function StatusFilter({ selectedStatuses, onToggle, disabled = false }) {
  const statuses = ['ACTIVE', 'DISCONNECTED'];
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2 rounded-lg border text-left text-sm font-medium transition-all flex items-center justify-between ${
          disabled
            ? 'bg-slate-700/30 border-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
        }`}
      >
        <span>
          Status
          {selectedStatuses.length > 0 && (
            <span className="ml-2 px-2 py-1 rounded bg-green-500/20 text-green-300 text-xs">
              {selectedStatuses.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-lg z-10">
          <div className="p-2">
            {statuses.map((status) => (
              <label
                key={status}
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(status)}
                  onChange={() => onToggle(status)}
                  className="w-4 h-4 rounded border-slate-600"
                />
                <span className="text-slate-300">{status}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ClassificationFilter({
  classifications,
  selectedClassifications,
  onToggle,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2 rounded-lg border text-left text-sm font-medium transition-all flex items-center justify-between ${
          disabled
            ? 'bg-slate-700/30 border-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-slate-900/50 border-slate-700 text-slate-300 hover:border-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
        }`}
      >
        <span>
          Classification
          {selectedClassifications.length > 0 && (
            <span className="ml-2 px-2 py-1 rounded bg-purple-500/20 text-purple-300 text-xs">
              {selectedClassifications.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-lg z-10">
          <div className="max-h-48 overflow-y-auto">
            {classifications.length === 0 ? (
              <div className="p-3 text-slate-400 text-sm">No classifications available</div>
            ) : (
              classifications.map((classification) => (
                <label
                  key={classification}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedClassifications.includes(classification)}
                    onChange={() => onToggle(classification)}
                    className="w-4 h-4 rounded border-slate-600"
                  />
                  <span className="text-slate-300">{classification}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
