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
  '#2563eb',  // Blue
  '#16a34a',  // Green
  '#f97316',  // Orange
  '#e11d48',  // Red
  '#7c3aed',  // Purple
  '#0f766e',  // Teal
  '#facc15',  // Yellow
  '#ec4899',  // Pink
  '#0ea5e9',  // Sky Blue
  '#6366f1',  // Indigo
];

const categoryEmojis = {
  Food: '🍔',
  Transport: '🚗',
  Entertainment: '🎬',
  Utilities: '💡',
  Shopping: '🛍️',
  Healthcare: '🏥',
  Other: '📌',
};

/**
 * CategorySpendingDonut - Displays spending breakdown by category in a donut chart
 * @param {Array} transactions - Array of transaction objects with category and amount fields
 * @param {string} title - Title for the chart
 */
const CategorySpendingDonut = ({ transactions = [], title = 'Spending by Category' }) => {
  // Aggregate spending by category
  const aggregateByCategory = (txns) => {
    const categoryMap = {};

    txns.forEach((transaction) => {
      const category = transaction.category || 'Other';
      const amount = Math.abs(Number(transaction.amount || 0));

      if (categoryMap[category]) {
        categoryMap[category] += amount;
      } else {
        categoryMap[category] = amount;
      }
    });

    // Convert to array format for recharts
    return Object.entries(categoryMap)
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
        emoji: categoryEmojis[name] || '📌',
      }))
      .sort((a, b) => b.value - a.value); // Sort by spending amount descending
  };

  const chartData = aggregateByCategory(transactions);
  const totalSpending = chartData.reduce((sum, item) => sum + item.value, 0);

  if (!chartData.length || totalSpending === 0) {
    return (
      <div className="insight-card">
        <div className="card-header">
          <h2>📊 {title}</h2>
        </div>
        <div className="card-body">
          <div className="placeholder">
            <p className="placeholder-text">
              No spending data available yet. Add transactions to see your spending breakdown!
            </p>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Custom Donut label with emoji and percentage
   */
  const renderCustomLabel = ({ name, value, percent }) => {
    const emoji = categoryEmojis[name] || '📌';
    return `${emoji} ${(percent * 100).toFixed(0)}%`;
  };

  /**
   * Custom legend with category name, amount, and percentage
   */
  const renderCustomLegend = (props) => {
    const { payload } = props;

    return (
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {payload.map((entry, index) => {
          const item = chartData[index];
          const percentage = ((item.value / totalSpending) * 100).toFixed(1);

          return (
            <div
              key={`legend-${index}`}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {item.emoji} {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  ${item.value.toFixed(2)}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  ({percentage}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /**
   * Custom tooltip for hover
   */
  const renderCustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalSpending) * 100).toFixed(1);

      return (
        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700">
          <p className="font-semibold text-gray-800 dark:text-white">
            {data.emoji} {data.name}
          </p>
          <p className="text-blue-600 dark:text-blue-400 font-bold">
            ${data.value.toFixed(2)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {percentage}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="insight-card">
      <div className="card-header">
        <h2>📊 {title}</h2>
      </div>
      <div className="card-body">
        <div className="space-y-4">
          {/* Chart */}
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={1}
                  label={renderCustomLabel}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={renderCustomTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Total Spending Summary */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              Total Spending
            </p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              ${totalSpending.toFixed(2)}
            </p>
          </div>

          {/* Custom Legend */}
          {renderCustomLegend({
            payload: chartData.map((item, index) => ({
              color: COLORS[index % COLORS.length],
              value: item.name,
            })),
          })}
        </div>
      </div>
    </div>
  );
};

export default CategorySpendingDonut;
