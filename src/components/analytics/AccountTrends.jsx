import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Plus, Repeat2, TrendingUp } from 'lucide-react';

const AccountTrends = ({ monthlyData = [] }) => {
  const chartData = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) return [];
    return monthlyData.map(metric => ({
      month: metric.month,
      'Total Accounts': metric.totalAccounts,
      'New Accounts': metric.newAccounts,
      'Recurring': metric.recurringAccounts,
      'Active': metric.activeCount,
      'Disconnected': metric.disconnectedCount,
    }));
  }, [monthlyData]);

  const growth = useMemo(() => {
    if (monthlyData.length < 2) return 0;
    const latest = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];
    return latest.totalAccounts - previous.totalAccounts;
  }, [monthlyData]);

  const growthPercent = useMemo(() => {
    if (monthlyData.length < 2) return 0;
    const latest = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];
    return previous.totalAccounts > 0 ? ((growth / previous.totalAccounts) * 100).toFixed(1) : 0;
  }, [monthlyData, growth]);

  const latestMonth = monthlyData[monthlyData.length - 1];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Total Accounts (Latest)</p>
              <p className="text-2xl font-bold text-white mt-2">
                {latestMonth?.totalAccounts?.toLocaleString() || 0}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-400 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">New Accounts (Latest)</p>
              <p className="text-2xl font-bold text-white mt-2">
                {latestMonth?.newAccounts?.toLocaleString() || 0}
              </p>
              <p className={`text-xs mt-1 ${growthPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {growthPercent >= 0 ? '↑' : '↓'} {Math.abs(growthPercent)}% MoM
              </p>
            </div>
            <Plus className="w-8 h-8 text-green-400 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Recurring (Latest)</p>
              <p className="text-2xl font-bold text-white mt-2">
                {latestMonth?.recurringAccounts?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {latestMonth?.totalAccounts > 0 
                  ? ((latestMonth.recurringAccounts / latestMonth.totalAccounts) * 100).toFixed(1) 
                  : 0}% of total
              </p>
            </div>
            <Repeat2 className="w-8 h-8 text-purple-400 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">Active Accounts (Latest)</p>
              <p className="text-2xl font-bold text-white mt-2">
                {latestMonth?.activeCount?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {latestMonth?.totalAccounts > 0 
                  ? ((latestMonth.activeCount / latestMonth.totalAccounts) * 100).toFixed(1) 
                  : 0}% active
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-400 opacity-50" />
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-slate-700/50 bg-slate-900/20 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Monthly Account Growth Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Total Accounts" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ fill: '#3b82f6' }}
            />
            <Line 
              type="monotone" 
              dataKey="Active" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981' }}
            />
            <Line 
              type="monotone" 
              dataKey="Disconnected" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ fill: '#ef4444' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* New vs Recurring Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-slate-700/50 bg-slate-900/20 p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">New vs Recurring Accounts</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
            <YAxis stroke="rgba(255,255,255,0.5)" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Bar dataKey="New Accounts" fill="#10b981" radius={[8, 8, 0, 0]} />
            <Bar dataKey="Recurring" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Summary Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-slate-700/50 bg-slate-900/20 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-900/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300 uppercase">Month</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-300 uppercase">Total</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-300 uppercase">New</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-300 uppercase">Recurring</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-300 uppercase">Active</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-300 uppercase">Disconnected</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((metric, idx) => (
                <tr key={metric.month} className="border-b border-slate-700/30 hover:bg-slate-900/30 transition">
                  <td className="px-6 py-4 text-sm font-medium text-white">{metric.month}</td>
                  <td className="px-6 py-4 text-sm text-right text-blue-400">
                    {metric.totalAccounts.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-green-400">
                    {metric.newAccounts.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-purple-400">
                    {metric.recurringAccounts.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-orange-400">
                    {metric.activeCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-red-400">
                    {metric.disconnectedCount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default AccountTrends;
