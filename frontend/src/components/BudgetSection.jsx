import React, { useEffect } from 'react';
import { Target, AlertCircle, Edit2, Trash2 } from 'lucide-react';

const BudgetCard = ({ budget, categoryName, spent, formatCurrency, onEdit, onDelete }) => {
  const limit = Number(budget.monthlyLimit ?? budget.limitAmount ?? budget.amount ?? 0);
  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const isOver = spent > limit;

  return (
    <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex flex-col transition-all hover:shadow-md">
      <div className="flex justify-between items-center mb-3">
        <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
          {categoryName}
        </span>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit && onEdit(budget)}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition"
            title="Edit Budget"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button 
            onClick={() => onDelete && onDelete(budget.id)}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition"
            title="Delete Budget"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {isOver && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full">
              <AlertCircle className="h-3 w-3" />
              Over Limit
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-end mb-2">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400">Spent</span>
          <span
            className={`font-bold ${
              isOver ? 'text-rose-500' : 'text-slate-900 dark:text-white'
            }`}
          >
            {formatCurrency ? formatCurrency(spent) : spent.toFixed(2)}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-xs text-slate-400">Budget</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {formatCurrency ? formatCurrency(limit) : limit.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Glassmorphism Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2 mt-auto overflow-hidden relative shadow-inner">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out ${
            percentage >= 90
              ? 'bg-rose-500'
              : percentage >= 75
              ? 'bg-amber-500'
              : 'bg-indigo-500'
          }`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="mt-1 text-right text-[10px] text-slate-400 font-medium">
        {percentage.toFixed(0)}%
      </div>
    </div>
  );
};

const BudgetSection = ({ budgets = [], transactions = [], formatCurrency, onEditBudget, onDeleteBudget }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  useEffect(() => {
    console.log('Budget data received from backend:', budgets);
  }, [budgets]);

  // Calculate total spent for a specific category in the current month
  const getSpentAmount = (category) => {
    if (!category) return 0;
    return transactions
      .filter((tx) => {
        if (!tx.date || !tx.category) return false;
        const date = new Date(tx.date);
        const isCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        const isCategoryMatch = tx.category.trim().toLowerCase() === category.trim().toLowerCase();
        return isCategoryMatch && isCurrentMonth;
      })
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm mt-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Target className="h-5 w-5 text-indigo-500" />
          Active Budgets
        </h3>
      </div>

      {budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm mb-3 text-indigo-500">
            <Target className="h-6 w-6" />
          </div>
          <p className="text-slate-500 font-medium text-sm">No budgets found. Add your first budget above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const categoryName = budget.categoryName || budget.category?.name || budget.category || 'Uncategorized';
            return (
              <BudgetCard 
                budget={budget} 
                categoryName={categoryName}
                key={budget.id || categoryName} 
                formatCurrency={formatCurrency} 
                spent={getSpentAmount(categoryName)}
                onEdit={onEditBudget}
                onDelete={onDeleteBudget}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BudgetSection;
