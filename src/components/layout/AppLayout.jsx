import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getUserPermissions } from '@/lib/roleAccess';
import { staticDataService } from '@/lib/staticDataService';
import {
  LayoutDashboard,
  TrendingUp,
  AlertTriangle,
  Map,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [datasetErrors, setDatasetErrors] = useState([]);
  const location = useLocation();

  const role = user?.role || 'viewer';
  const perms = getUserPermissions(role);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ds = await staticDataService.getDatasets();
        if (!mounted) return;
        const errs = ds.filter(d => d.loadError).map(d => `${d.file}: ${d.loadError}`);
        setDatasetErrors(errs);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const navItems = [
    perms.canViewDashboard && { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    perms.canViewAnalytics && { path: '/analytics', label: 'Analytics', icon: TrendingUp },
    perms.canViewAnomalyList && { path: '/anomalies', label: 'Anomalies', icon: AlertTriangle },
    perms.canViewMap && { path: '/map', label: 'Map', icon: Map },
  ].filter(Boolean);

  const isActive = (path) => location.pathname === path;

  const roleColors = {
    admin: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    manager: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    viewer: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] glass-backdrop">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img src="/images/logo.png" alt="TCWD Flowsense logo" className="w-7 h-7 sm:w-9 sm:h-9 object-contain rounded-xl" />
              <div className="block">
                <h1 className="text-sm font-semibold text-white font-space leading-tight tracking-tight">TCWD Flowsense</h1>
                <p className="text-[10px] text-slate-500 leading-tight tracking-wider uppercase">Anomaly Engine</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                  }`}
                >
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg"
                      style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(99,102,241,0.25))', border: '1px solid rgba(59,130,246,0.3)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${roleColors[role] || roleColors.viewer}`}>
                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-glow" />
                <span className="capitalize font-space">{role}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] rounded-xl"
                onClick={() => logout()}
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9 text-slate-400 hover:bg-white/[0.05] rounded-xl"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      {datasetErrors.length > 0 && (
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="rounded-md glass-backdrop-light text-black px-4 py-2 text-sm">
            <strong>Dataset load errors:</strong>
            <ul className="list-disc pl-5 mt-1">
              {datasetErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        </div>
      )}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 top-16 z-40 glass-backdrop"
          >
            <nav className="p-5 space-y-1.5">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                      isActive(item.path)
                        ? 'text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    style={isActive(item.path) ? { background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))', border: '1px solid rgba(59,130,246,0.25)' } : { border: '1px solid transparent' }}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-space">{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <main className="flex-1">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 glass-backdrop-light">
          <Outlet context={{ user, role, perms }} />
        </div>
      </main>
    </div>
  );
}