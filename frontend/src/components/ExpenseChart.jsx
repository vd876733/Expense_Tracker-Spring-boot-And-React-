import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const ExpenseChart = ({ transactions = [], formatCurrency }) => {
  const categoryColors = {
    Food: '#FF6384',
    Transport: '#36A2EB',
    Entertainment: '#FFCE56',
    Utilities: '#4BC0C0',
    Shopping: '#9966FF',
    Healthcare: '#FF9F40',
    Housing: '#8B5CF6',
    Education: '#10B981',
    Other: '#C9CBCF',
  };

  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    const categoryMap = {};
    transactions.forEach((t) => {
      const cat = t.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
    });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (!transactions || transactions.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border border-slate-200/60 dark:border-slate-700 h-96 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No transactions to display</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border border-slate-200/60 dark:border-slate-700 h-96 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No transactions to display</p>
        </div>
      </div>
    );
  }

  const totalAmount = chartData.reduce((sum, item) => sum + item.value, 0);
  const formattedTotal = formatCurrency ? formatCurrency(totalAmount) : `$${totalAmount.toFixed(2)}`;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-sm">
          <p className="font-semibold mb-1">{payload[0].name || payload[0].payload.name}</p>
          <p className="text-blue-400 font-bold">
            {formatCurrency ? formatCurrency(payload[0].value) : `$${payload[0].value.toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Left Card: Category Totals (Bar Chart) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border border-slate-200/60 dark:border-slate-700 flex flex-col">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Category Totals</h2>
        <div className="flex-1 w-full min-h-[250px] mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(value) => value.length > 8 ? `${value.substring(0, 8)}...` : value}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 12 }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={categoryColors[entry.name] || categoryColors.Other} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Itemized List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColors[item.name] || categoryColors.Other }} />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[90px]" title={item.name}>{item.name}</span>
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap pl-2">
                {formatCurrency ? formatCurrency(item.value) : `$${item.value.toFixed(2)}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Card: Spending Breakdown (Doughnut) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border border-slate-200/60 dark:border-slate-700 flex flex-col">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Spending Breakdown</h2>
        
        <div className="flex flex-col sm:flex-row items-center justify-between flex-1 gap-8">
          
          {/* Doughnut Chart with center text */}
          <div className="relative w-full sm:w-1/2 h-[250px] flex-shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75}
                  outerRadius={105}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={categoryColors[entry.name] || categoryColors.Other} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Hole Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Spent</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {formattedTotal}
              </span>
            </div>
          </div>

          {/* Detailed Legend */}
          <div className="w-full sm:w-1/2 flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2">
            {chartData.map((item, index) => {
              const percentage = totalAmount > 0 ? ((item.value / totalAmount) * 100).toFixed(1) : 0;
              return (
                <div key={index} className="flex flex-col gap-1 p-3 rounded-xl border border-slate-100 hover:border-slate-200 dark:border-slate-700 dark:hover:border-slate-600 transition-colors bg-white dark:bg-slate-800 shadow-sm hover:shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColors[item.name] || categoryColors.Other }} />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full">
                      {percentage}%
                    </span>
                  </div>
                  <div className="text-right text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {formatCurrency ? formatCurrency(item.value) : `$${item.value.toFixed(2)}`}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

    </div>
  );
};

export default React.memo(ExpenseChart);
