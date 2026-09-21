import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#2563eb',
  '#16a34a',
  '#f97316',
  '#e11d48',
  '#7c3aed',
  '#0f766e',
  '#facc15',
];

const MonthlyCategoryDoughnut = ({ data = [] }) => {

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => setIsDarkMode(root.classList.contains('dark'));
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (!data.length) {
    return (
      <div className="card bg-white dark:bg-slate-800 dark:border-slate-700/60">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Current Month Category Totals</h2>
        <p className="text-slate-500 dark:text-slate-400">No transactions for the current month.</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.category,
    value: Math.abs(Number(item.total || 0)),
  }));

  return (
    <div className="card bg-white dark:bg-slate-800 dark:border-slate-700/60">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Current Month Category Totals</h2>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Total']} 
              contentStyle={{
                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                color: isDarkMode ? '#f1f5f9' : '#0f172a',
              }}
              itemStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(MonthlyCategoryDoughnut);
