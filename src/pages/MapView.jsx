// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { staticDataService } from '@/lib/staticDataService';
import AnomalyMap from '@/components/map/AnomalyMap';
import { ANOMALY_COLORS, ANOMALY_LABELS } from '@/lib/anomalyDetection';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Map, Search } from 'lucide-react';

export default function MapView() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [rawSearchInput, setRawSearchInput] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedAnomalyKey, setSelectedAnomalyKey] = useState(null);

  const { data: anomalies = [], isLoading } = useQuery({
    queryKey: ['anomalies'],
    queryFn: () => staticDataService.getAnomalies(),
  });

  const normalizeSearch = (value) =>
    (value || '').toString().toLowerCase().replace(/[^a-z0-9]+/g, '');

  const searchTokens = (value) =>
    (value || '')
      .toString()
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .map(token => normalizeSearch(token));

  const getHighlightParts = (text, query) => {
    const tokens = searchTokens(query);
    if (tokens.length === 0) return [text];
    const regex = new RegExp(`(${tokens.map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    return text.split(regex).map((part, index) => {
      const lower = part.toLowerCase();
      const isMatch = tokens.some(token => token && lower.includes(token));
      return isMatch ? <mark key={index} className="bg-yellow-300/25 text-yellow-100">{part}</mark> : part;
    });
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(rawSearchInput.trim());
    }, 250);
    return () => clearTimeout(timeout);
  }, [rawSearchInput]);

  const handleSearchChange = useCallback((value) => {
    setRawSearchInput(value);
    setSelectedAnomalyKey(null);
  }, []);

  const suggested = useMemo(() => {
    const tokens = searchTokens(rawSearchInput);
    if (tokens.length < 1) return [];

    return anomalies
      .map(anomaly => {
        const fields = [anomaly.name, anomaly.accountNumber, anomaly.meterNo, anomaly.address].map(normalizeSearch);
        const matchesAllTokens = tokens.every(token => fields.some(field => field.includes(token)));
        if (!matchesAllTokens) return null;

        const score = fields.reduce((acc, field) => {
          if (field === tokens[0]) return acc + 1000;
          if (field.startsWith(tokens[0])) return acc + 100;
          if (field.includes(tokens[0])) return acc + 10;
          return acc;
        }, 0);

        return { anomaly, score };
      })
      .filter(item => item !== null)
      .sort((a, b) => b.score - a.score)
      .map(item => item.anomaly)
      .slice(0, 8);
  }, [anomalies, rawSearchInput]);

  const filtered = useMemo(() => {
    const tokens = searchTokens(rawSearchInput);
    const typeFiltered = typeFilter === 'all'
      ? anomalies
      : anomalies.filter(a => a.anomalyType === typeFilter);

    if (tokens.length < 1) return typeFiltered;

    return typeFiltered.filter(anomaly => {
      const fields = [anomaly.name, anomaly.accountNumber, anomaly.meterNo, anomaly.address].map(normalizeSearch);
      return tokens.every(token => fields.some(field => field.includes(token)));
    });
  }, [anomalies, typeFilter, rawSearchInput]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
          <p className="text-sm text-slate-500">Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <Map className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white font-space tracking-tight">Anomaly Map</h2>
            <p className="text-sm text-slate-500 mt-0.5">Geographic distribution of anomalies</p>
          </div>
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger
            className="w-full sm:w-48 rounded-xl text-sm text-slate-300 border-white/[0.08]"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-white/10" style={{ background: '#111318' }}>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="sudden_high">Sudden High</SelectItem>
            <SelectItem value="zero_consumption">Zero Consumption</SelectItem>
            <SelectItem value="sudden_down">Sudden Down</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>
      <div className="relative max-w-xl">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={rawSearchInput}
            onChange={e => handleSearchChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && suggested.length > 0) {
                const item = suggested[0];
                const key = item.accountNumber || item.meterNo || item.name;
                const value = item.name || item.accountNumber || item.meterNo || item.address || '';
                setSelectedAnomalyKey(key);
                setRawSearchInput(value);
                setDebouncedSearchQuery(value.trim());
              }
            }}
            placeholder="Search map by name, account, meter, or address..."
            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 py-3 pl-11 pr-4 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          />
        </div>
        {rawSearchInput.trim().length > 0 && suggested.length > 0 && (
          <div className="absolute left-0 right-0 z-20 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/30 backdrop-blur-xl">
            {suggested.map((anomaly, index) => {
              const baseKey = anomaly.accountNumber || anomaly.meterNo || anomaly.name || anomaly.address || 'anomaly';
              const key = `${baseKey}-${index}`;
              const title = anomaly.name || anomaly.accountNumber || anomaly.meterNo || 'Unknown';
              const subtitle = [anomaly.accountNumber, anomaly.meterNo].filter(Boolean).join(' • ');
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    const value = anomaly.name || anomaly.accountNumber || anomaly.meterNo || anomaly.address || '';
                    setSelectedAnomalyKey(key);
                    setRawSearchInput(value);
                    setDebouncedSearchQuery(value.trim());
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-900"
                >
                  <div className="font-medium truncate">{getHighlightParts(title, rawSearchInput)}</div>
                  <div className="text-xs text-slate-500 truncate">{getHighlightParts(subtitle, rawSearchInput)}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap items-center gap-5"
      >
        {Object.entries(ANOMALY_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: ANOMALY_COLORS[key], boxShadow: `0 0 8px ${ANOMALY_COLORS[key]}80` }} />
            <span className="text-xs text-slate-400 font-space">{label}</span>
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-600">
          <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
          Marker size = severity
        </div>
        <div
          className="px-3 py-1 rounded-lg text-xs font-medium text-blue-400"
          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
        >
          {filtered.length} markers
        </div>
      </motion.div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      >
        <AnomalyMap anomalies={filtered} height="calc(100vh - 300px)" highlightKey={selectedAnomalyKey} />
      </motion.div>
    </div>
  );
}