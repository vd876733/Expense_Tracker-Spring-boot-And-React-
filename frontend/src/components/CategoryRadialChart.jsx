import React, { useState, useEffect } from 'react';
import {
  RadialBarChart,
  RadialBar,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#3b82f6', // blue
  '#fb7185', // pink/rose
  '#2dd4bf', // teal
  '#a78bfa', // purple
  '#facc15', // yellow
  '#fb923c', // orange
  '#4ade80', // green
];

const CategoryRadialChart = ({ data = [] }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => setIsDarkMode(root.classList.contains('dark'));
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (!data || !data.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-center p-8">
        <p className="text-slate-500 dark:text-slate-400">No categories found.</p>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => b.total - a.total);
  
  const chartData = sortedData.map((item, index) => ({
    name: item.category,
    value: Math.abs(Number(item.total || 0)),
    fill: COLORS[index % COLORS.length],
  }));

  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <ul className="flex flex-col gap-3">
        {payload.map((entry, index) => (
          <li key={`item-${index}`} className="flex items-center text-sm font-semibold text-slate-600 dark:text-slate-300">
            <span 
              className="w-3 h-3 rounded-full mr-3 inline-block" 
              style={{ backgroundColor: entry.color }} 
            />
            {entry.value}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadialBarChart 
        cx="70%" 
        cy="50%" 
        innerRadius="40%" 
        outerRadius="100%" 
        barSize={12} 
        data={chartData}
        startAngle={90}
        endAngle={-270}
      >
        <RadialBar
          minAngle={15}
          background={{ fill: isDarkMode ? '#334155' : '#f1f5f9' }}
          clockWise={true}
          dataKey="value"
          cornerRadius={10}
        />
        <Tooltip 
          formatter={(value) => [`${localStorage.getItem('selectedCurrency') === 'USD' ? '$' : '₹'}${Number(value).toFixed(2)}`, 'Total']} 
          contentStyle={{
            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
            borderColor: isDarkMode ? '#334155' : '#e2e8f0',
            color: isDarkMode ? '#f1f5f9' : '#0f172a',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
          itemStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a', fontWeight: 'bold' }}
        />
        <Legend 
          iconSize={10} 
          layout="vertical" 
          verticalAlign="middle" 
          align="left"
          content={renderLegend}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
};

export default React.memo(CategoryRadialChart);
