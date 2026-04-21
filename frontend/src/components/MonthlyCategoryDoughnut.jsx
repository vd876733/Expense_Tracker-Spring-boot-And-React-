import React from 'react';
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
  if (!data.length) {
    return (
      <div className="card bg-white">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Current Month Category Totals</h2>
        <p className="text-gray-500">No transactions for the current month.</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: item.category,
    value: Math.abs(Number(item.total || 0)),
  }));

  return (
    <div className="card bg-white">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Current Month Category Totals</h2>
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
            <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Total']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyCategoryDoughnut;
