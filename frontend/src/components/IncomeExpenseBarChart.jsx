import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const formatMonthLabel = (year, month) => {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
};

const IncomeExpenseBarChart = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div className="card bg-white">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Income vs Expenses (Last 6 Months)</h2>
        <p className="text-gray-500">No data available.</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: formatMonthLabel(item.year, item.month),
    income: Number(item.income || 0),
    expenses: Number(item.expenses || 0),
  }));

  return (
    <div className="card bg-white">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Income vs Expenses (Last 6 Months)</h2>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Income" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IncomeExpenseBarChart;
