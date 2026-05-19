import React, { useState, useEffect } from 'react';
import { staticDataService } from '@/lib/staticDataService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ChartContainer } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ANOMALY_LABELS } from '@/lib/anomalyDetection';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { Search, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

const typeConfig = {
  sudden_high: { icon: ArrowUpRight, color: 'text-red-400', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', label: 'Sudden High' },
  zero_consumption: { icon: Minus, color: 'text-amber-400', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', label: 'Zero Usage' },
  sudden_down: { icon: ArrowDownRight, color: 'text-sky-400', bg: 'rgba(14,165,233,0.1)', border: 'rgba(14,165,233,0.2)', label: 'Sudden Down' },
};

const severityConfig = {
  low: { text: 'text-emerald-400', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
  medium: { text: 'text-amber-400', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  high: { text: 'text-orange-400', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' },
  critical: { text: 'text-red-400', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
};

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#e2e8f0',
};

export default function AnomalyTable({ anomalies, initialType = 'all', initialSeverity = 'all' }) {
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(initialType || 'all');
  const [severityFilter, setSeverityFilter] = useState(initialSeverity || 'all');

  useEffect(() => {
    // when parent supplies a different initial filter (via URL), apply it
    setTypeFilter(initialType || 'all');
    setSeverityFilter(initialSeverity || 'all');
    setPage(1);
  }, [initialType, initialSeverity]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    console.log('DEBUG: useEffect triggered, selected:', selected);
    if (!selected) return () => { mounted = false };
    const accountKey = selected.accountId || selected.accountNumber;
    if (!accountKey) {
      setHistory([]);
      return () => { mounted = false };
    }
    (async () => {
      setHistLoading(true);
      try {
        let h = await staticDataService.getAccountHistory(accountKey, 3);
        // Map cumUsed to consumption for chart compatibility
        if (Array.isArray(h)) {
          h = h.map(entry => ({
            ...entry,
            consumption: entry.consumption ?? entry.cumUsed ?? null
          }));
        }
        if (mounted) {
          console.log('DEBUG: Account history for trend', accountKey, h);
          setHistory(h);
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setHistLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [selected]);

  // Listen for global anomaly open events (dispatched from RecentAnomalies)
  useEffect(() => {
    function onOpen(e) {
      if (e && e.detail) {
        setSelected(e.detail);
        setDialogOpen(true);
      }
    }
    window.addEventListener('anomaly:open', onOpen);
    return () => window.removeEventListener('anomaly:open', onOpen);
  }, []);

  function openDetails(anomaly) {
    setSelected(anomaly);
    setDialogOpen(true);
  }

  function handleDialogOpenChange(open) {
    setDialogOpen(open);
    if (!open) setSelected(null);
  }

  const filtered = anomalies.filter(a => {
    const matchSearch = !search ||
      (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.accountNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.address || '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || a.anomalyType === typeFilter;
    const matchSeverity = severityFilter === 'all' || a.severity === severityFilter;
    return matchSearch && matchType && matchSeverity;
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 if filter/search changes and page is out of range
  useEffect(() => {
    if (page > totalPages) setPage(1);
    // eslint-disable-next-line
  }, [search, typeFilter, severityFilter, anomalies]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            placeholder="Search by name, ID or address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all placeholder:text-slate-600 focus:border-blue-500/50"
            style={inputStyle}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44 rounded-xl text-sm text-slate-300 border-white/[0.08]" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-white/10" style={{ background: '#111318' }}>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="sudden_high">Sudden High</SelectItem>
            <SelectItem value="zero_consumption">Zero Consumption</SelectItem>
            <SelectItem value="sudden_down">Sudden Down</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-44 rounded-xl text-sm text-slate-300 border-white/[0.08]" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <SelectValue placeholder="All Severities" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-white/10" style={{ background: '#111318' }}>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {['Account', 'Meter', 'Address', 'Type', 'Avg (cu.m.)', 'Current (cu.m.)', 'Deviation', 'Severity'].map((h, i) => (
                  <th
                    key={h}
                    className={`text-left px-5 py-3.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500 font-space ${
                      (i === 1 || i === 2) ? 'hidden md:table-cell' :
                      (i === 4 || i === 5) ? 'hidden sm:table-cell' : ''
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-600">
                    <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No anomalies found</p>
                  </td>
                </tr>
              )}
              {paged.map((anomaly, i) => {
                const tc = typeConfig[anomaly.anomalyType];
                const sc = severityConfig[anomaly.severity];
                const Icon = tc?.icon || Minus;
                const isPos = anomaly.deviationPercent > 0;

                return (
                  <motion.tr
                    key={anomaly.accountNumber || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="transition-colors group cursor-pointer"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => openDetails(anomaly)}
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-200 font-space">{anomaly.name || anomaly.accountNumber}</p>
                      <p className="text-xs text-slate-600 mt-0.5 font-mono">{anomaly.accountNumber}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-sm hidden md:table-cell">{anomaly.meterNo || '\u2014'}</td>
                    <td className="px-5 py-4 text-slate-500 text-sm hidden md:table-cell">{anomaly.address || '\u2014'}</td>
                    <td className="px-5 py-4">
                      {tc && (
                        <div
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                          style={{ background: tc.bg, border: `1px solid ${tc.border}` }}
                        >
                          <Icon className={`w-3 h-3 ${tc.color}`} />
                          <span className={tc.color}>{tc.label}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-400 tabular-nums hidden sm:table-cell">{anomaly.averageConsumption}</td>
                    <td className="px-5 py-4 text-slate-400 tabular-nums hidden sm:table-cell">{anomaly.currentConsumption}</td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-semibold tabular-nums font-space ${isPos ? 'text-red-400' : 'text-sky-400'}`}>
                        {isPos ? '+' : ''}{anomaly.deviationPercent}%
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {sc && (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${sc.text}`}
                          style={{ background: sc.bg, border: `1px solid ${sc.border}` }}
                        >
                          {anomaly.severity}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3.5 text-xs text-slate-600 font-space flex flex-col gap-2 items-center sm:flex-row sm:justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <span>
            {filtered.length === 0
              ? '0'
              : `${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, filtered.length)}`}
            {' of '}{filtered.length} records
          </span>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={e => { e.preventDefault(); setPage(1); }}
                    aria-disabled={page === 1}
                    tabIndex={page === 1 ? -1 : 0}
                  >First</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={e => { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }}
                    aria-disabled={page === 1}
                    tabIndex={page === 1 ? -1 : 0}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={e => { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)); }}
                    aria-disabled={page === totalPages}
                    tabIndex={page === totalPages ? -1 : 0}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    onClick={e => { e.preventDefault(); setPage(totalPages); }}
                    aria-disabled={page === totalPages}
                    tabIndex={page === totalPages ? -1 : 0}
                  >Last</PaginationLink>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
      {/* Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-lg w-full">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Account Details</DialogTitle>
                <DialogDescription>
                  <div className="mt-2 mb-3">
                    <div className="font-semibold text-base text-slate-200">{selected.name || selected.accountNumber || selected.accountId}</div>
                    <div className="text-xs text-slate-500 font-mono">Account: {selected.accountNumber || selected.accountId}</div>
                    <div className="text-xs text-slate-500 font-mono">Meter: {selected.meterNo || '\u2014'}</div>
                    <div className="text-xs text-slate-500 font-mono">Status: {selected.status || '\u2014'}</div>
                    {selected.address && <div className="text-xs text-slate-400 mt-1">{selected.address}</div>}
                  </div>
                  <div className="flex gap-4 mb-2">
                    <div>
                      <span className="text-xs text-slate-500">Type: </span>
                      <span className="font-medium text-slate-300">{ANOMALY_LABELS[selected.anomalyType]}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Severity: </span>
                      <span className="font-medium capitalize" style={{ color: severityConfig[selected.severity]?.text ? undefined : '#fff' }}>{selected.severity}</span>
                    </div>
                  </div>
                  <div className="flex gap-4 mb-2">
                    <div>
                      <span className="text-xs text-slate-500">Avg: </span>
                      <span className="font-medium text-slate-300">{selected.averageConsumption} cu.m.</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Current: </span>
                      <span className="font-medium text-slate-300">
                        {selected.reportedReading !== undefined && selected.reportedReading !== null
                                                  ? selected.reportedReading
                                                  : (Array.isArray(history) && history.length > 0
                                                      ? (history.find(h => h.month === selected.datasetId)?.consumption ?? history[history.length - 1].consumption)
                                                      : selected.currentConsumption)} cu.m.
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Deviation: </span>
                      <span className={`font-medium ${selected.deviationPercent > 0 ? 'text-red-400' : 'text-sky-400'}`}>{selected.deviationPercent > 0 ? '+' : ''}{selected.deviationPercent}%</span>
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <div className="font-semibold text-xs text-slate-400 mb-2">3-Month Consumption Trend</div>
                {histLoading ? (
                  <div className="text-xs text-slate-500">Loading...</div>
                ) : (
                  <>
                    {history && history.length > 0 ? (
                      <>
                        {!selected?.accountId && !selected?.accountNumber && (
                          <div style={{background:'#a00',color:'#fff',padding:'8px',marginBottom:'8px',fontSize:'12px',borderRadius:'4px'}}>
                            <strong>WARNING:</strong> No accountId or accountNumber found for this anomaly. Trend chart cannot load.
                          </div>
                        )}
                        <ChartContainer style={{ height: 180 }} config={{}}>
                          <AreaChart data={history} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                            <defs>
                              <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.7} />
                                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.1} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} width={32} />
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12, color: '#e2e8f0' }} />
                            <Area 
                              type="monotone"
                              dataKey="consumption"
                              stroke="#38bdf8"
                              fill="url(#colorCons)"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                            />
                          </AreaChart>
                        </ChartContainer>
                      </>
                    ) : (
                      <div className="text-xs text-slate-500">No consumption history available.</div>
                    )}
                </>
              )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}