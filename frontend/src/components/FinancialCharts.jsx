import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const FinancialCharts = ({ transactions }) => {
  // Process data for Pie Chart: Expenses by Category
  const expenseData = transactions
    .filter((t) => t.amount < 0)
    .reduce((acc, t) => {
      const category = t.category || 'Other';
      acc[category] = (acc[category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});

  const pieData = Object.entries(expenseData).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));

  // Process data for Bar Chart: Income vs Expenses
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const barData = [
    { name: 'Income', amount: totalIncome, color: '#10b981' }, // Emerald
    { name: 'Expenses', amount: totalExpenses, color: '#64748b' }, // Slate
  ];

  // Colors for Pie Chart
  const pieColors = [
    '#10b981', // Emerald
    '#64748b', // Slate
    '#06b6d4', // Cyan
    '#8b5cf6', // Violet
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
  ];

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Financial Analytics</h2>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Financial Analytics</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart: Expenses by Category */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart: Income vs Expenses */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
              <Legend />
              <Bar dataKey="amount">
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default FinancialCharts;