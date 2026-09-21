import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const formatDateLabel = (value) => {
  const date = new Date(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const DailySpendingAreaChart = ({ data = [], title = 'Daily Spending', formatValue }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => setIsDarkMode(root.classList.contains('dark'));

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const axisStroke = isDarkMode ? '#cbd5f5' : '#64748b';
  const gridStroke = isDarkMode ? '#334155' : '#e2e8f0';

  if (!data.length) {
    return (
      <div className="card bg-white dark:bg-slate-800 dark:border-slate-700/60">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h2>
        <p className="text-slate-500 dark:text-slate-400">No data available.</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    date: item.date,
    total: Number(item.total ?? 0),
  }));

  return (
    <div className="card bg-white dark:bg-slate-800 dark:border-slate-700/60">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">{title}</h2>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="dailySpendingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="date"
              type="category"
              allowDuplicatedCategory={false}
              stroke={axisStroke}
              tickFormatter={formatDateLabel}
            />
            <YAxis
              stroke={axisStroke}
              width={80}
              tickFormatter={(value) => (formatValue ? formatValue(value) : `₹${Number(value).toFixed(2)}`)}
            />
            <Tooltip
              formatter={(value) => [
                formatValue ? formatValue(Number(value)) : `₹${Number(value).toFixed(2)}`,
                'Total',
              ]}
              labelFormatter={formatDateLabel}
              contentStyle={{
                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                color: isDarkMode ? '#f1f5f9' : '#0f172a',
              }}
              itemStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              fill="url(#dailySpendingGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(DailySpendingAreaChart);
