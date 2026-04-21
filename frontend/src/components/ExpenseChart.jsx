import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const ExpenseChart = ({ transactions = [], formatCurrency }) => {
  // Define colors for each category
  const categoryColors = {
    Food: '#FF6384',
    Transport: '#36A2EB',
    Entertainment: '#FFCE56',
    Utilities: '#4BC0C0',
    Shopping: '#9966FF',
    Healthcare: '#FF9F40',
    Other: '#C9CBCF',
  };

  // Process and group transaction data by category
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    // Group by category and sum amounts
    const categoryMap = {};

    transactions.forEach((transaction) => {
      const category = transaction.category || 'Other';
      if (categoryMap[category]) {
        categoryMap[category] += transaction.amount;
      } else {
        categoryMap[category] = transaction.amount;
      }
    });

    // Convert to array format for Recharts
    return Object.entries(categoryMap).map(([category, amount]) => ({
      name: category,
      value: parseFloat(amount.toFixed(2)),
    }));
  }, [transactions]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const displayValue = formatCurrency
        ? formatCurrency(payload[0].value)
        : `$${payload[0].value.toFixed(2)}`;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{payload[0].name}</p>
          <p className="text-blue-600 font-bold">{displayValue}</p>
        </div>
      );
    }
    return null;
  };

  // Custom label renderer for pie slices
  const renderCustomLabel = ({ name, percent }) => {
    return `${(percent * 100).toFixed(0)}%`;
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="card bg-white flex items-center justify-center h-96">
        <p className="text-gray-500 text-lg">No transactions to display</p>
      </div>
    );
  }

  const totalAmount = chartData.reduce((sum, item) => sum + item.value, 0);
  const formattedTotal = formatCurrency
    ? formatCurrency(totalAmount)
    : `$${totalAmount.toFixed(2)}`;

  return (
    <div className="card bg-white">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Spending by Category</h2>
        <p className="text-gray-600">Total Spent: <span className="font-bold text-blue-600">{formattedTotal}</span></p>
      </div>

      <div className="w-full h-96 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 0 }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={categoryColors[entry.name] || '#999'}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry) => {
                const formatted = formatCurrency
                  ? formatCurrency(entry.payload.value)
                  : `$${entry.payload.value.toFixed(2)}`;
                return `${value}: ${formatted}`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown Table */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Category Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Category</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Amount</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {chartData
                .sort((a, b) => b.value - a.value)
                .map((item, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor: categoryColors[item.name] || '#999',
                          }}
                        ></div>
                        <span className="font-medium text-gray-800">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600">
                      {formatCurrency ? formatCurrency(item.value) : `$${item.value.toFixed(2)}`}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700">
                      {totalAmount > 0 ? ((item.value / totalAmount) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseChart;
