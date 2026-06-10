import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * ClickableBarChart - Wraps Recharts BarChart to enable click-to-filter
 * @param {string} filterType - 'area' | 'route' | 'status' | 'classification'
 * @param {function} onBarClick - Callback when bar is clicked: onBarClick(value)
 * @param {Array} data - Chart data
 * @param {string} dataKey - Property to display as bar height
 * @param {string} labelKey - Property to use as bar label
 * @param {string} fill - Bar color
 * @param {number} height - Chart height in px
 */
export function ClickableBarChart({
  filterType,
  onBarClick,
  data,
  dataKey,
  labelKey = 'name',
  fill = '#3b82f6',
  height = 300,
}) {
  const handleBarClick = (data) => {
    if (onBarClick && data[labelKey]) {
      onBarClick(data[labelKey]);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey={labelKey} tick={{ fontSize: 12, fill: '#cbd5e1' }} />
        <YAxis tick={{ fontSize: 12, fill: '#cbd5e1' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
          formatter={(value) => {
            if (typeof value === 'number') {
              return value.toLocaleString('en-US', { maximumFractionDigits: 1 });
            }
            return value;
          }}
        />
        <Bar
          dataKey={dataKey}
          fill={fill}
          radius={[8, 8, 0, 0]}
          onClick={handleBarClick}
          cursor="pointer"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * ClickablePieChart - Wraps Recharts PieChart to enable click-to-filter
 * @param {string} filterType - 'status' | 'classification'
 * @param {function} onSegmentClick - Callback when segment is clicked
 * @param {Array} data - Chart data
 * @param {string} dataKey - Property to use as segment size
 * @param {string} labelKey - Property to use as segment label
 * @param {Array} colors - Color array for segments
 * @param {number} height - Chart height in px
 */
export function ClickablePieChart({
  filterType,
  onSegmentClick,
  data,
  dataKey = 'value',
  labelKey = 'name',
  colors = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'],
  height = 300,
}) {
  const handleSegmentClick = (entry) => {
    if (onSegmentClick && entry[labelKey]) {
      onSegmentClick(entry[labelKey]);
    }
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey={dataKey}
          onClick={(entry) => handleSegmentClick(entry)}
          cursor="pointer"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => {
            if (typeof value === 'number') {
              return value.toLocaleString('en-US', { maximumFractionDigits: 1 });
            }
            return value;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/**
 * ScatterChartWrapper - Non-clickable scatter chart (for reference/future use)
 */
export function ScatterChartWrapper({
  data,
  xKey = 'accounts',
  yKey = 'efficiency',
  height = 300,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis
          dataKey={xKey}
          type="number"
          name="Accounts"
          tick={{ fontSize: 12, fill: '#cbd5e1' }}
        />
        <YAxis
          dataKey={yKey}
          type="number"
          name="Efficiency"
          tick={{ fontSize: 12, fill: '#cbd5e1' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
          }}
          cursor={{ strokeDasharray: '3 3' }}
        />
        <Scatter name="Items" data={data} fill="#8b5cf6" fillOpacity={0.7} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
