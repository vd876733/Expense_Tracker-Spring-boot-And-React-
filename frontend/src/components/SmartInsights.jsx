import React from 'react';
import { IconButton, LinearProgress, Tooltip } from '@mui/material';
// Changed CrystalBall to Sparkles below
import { Flame, Trophy, Target, AlertTriangle, Sparkles, Plus, RefreshCcw } from 'lucide-react';
import { calculateProjectedEndOfMonthTotal } from '../utils/projectionUtils';

const SmartInsights = ({
  transactions = [],
  budgetAnalyses = [],
  budgets = [],
  spendingChange = null,
  topCategory = null,
  formatCurrency,
  onSetBudgetClick,
  onResetBudgets,
}) => {
  const formatValue = formatCurrency || ((amount) => `$${amount.toFixed(2)}`);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonth = previousMonthDate.getMonth() + 1;
  const previousYear = previousMonthDate.getFullYear();

  const monthlyTotals = transactions.reduce((totals, transaction) => {
    const date = new Date(transaction.date);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const key = `${transaction.category}`;

    if (!totals[key]) {
      totals[key] = { current: 0, previous: 0 };
    }

    if (year === currentYear && month === currentMonth) {
      totals[key].current += Number(transaction.amount || 0);
    }

    if (year === previousYear && month === previousMonth) {
      totals[key].previous += Number(transaction.amount || 0);
    }

    return totals;
  }, {});

  const comparisonData = Object.entries(monthlyTotals).map(([category, values]) => {
    const previous = values.previous;
    const current = values.current;
    const change = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

    return {
      category,
      current,
      previous,
      change,
      increased: current > previous && change > 20,
      decreased: current < previous,
    };
  });

  const topCategoryFromMonthlyComparison = comparisonData.reduce(
    (best, item) => (item.current > (best?.current || 0) ? item : best),
    null
  );

  const topSpendingCategory = topCategory || topCategoryFromMonthlyComparison;

  const increaseAlerts = comparisonData.filter((item) => item.increased);
  const savingsAlerts = comparisonData.filter((item) => item.decreased);
  const today = new Date();
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysLeft = Math.max(lastDayOfMonth - today.getDate(), 0);
  const currentMonthTotal = Object.values(monthlyTotals).reduce((sum, value) => sum + value.current, 0);
  const projectedEndOfMonthTotal = calculateProjectedEndOfMonthTotal(currentMonthTotal, today.getDate());
  const projectionTip = `At your current pace, you will spend ${formatValue(projectedEndOfMonthTotal)} by the end of the month.`;

  const budgetWarnings = budgetAnalyses.filter((budget) => {
    const percentage = Number(budget.percentageSpent || 0);
    return percentage >= 90 && percentage < 100;
  });

  const overBudgetItems = budgetAnalyses.filter((budget) => budget.isOverBudget);

  const activeBudgets = budgets.filter((budget) => {
    const limit = Number(budget.monthlyLimit ?? budget.limitAmount ?? 0);
    return limit > 0;
  });

  const getSpentForCategory = (category) => {
    return transactions
      .filter((transaction) => {
        const date = new Date(transaction.date);
        return (
          transaction.category === category &&
          date.getFullYear() === currentYear &&
          date.getMonth() + 1 === currentMonth
        );
      })
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  };

  if (!comparisonData.length && !budgetAnalyses.length) {
    return null;
  }

  return (
    <div className="grid gap-4 mb-6 lg:grid-cols-5">
      <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4 text-yellow-700">
          <Target className="h-6 w-6" />
          <h3 className="text-lg font-semibold">Top Spending Category</h3>
        </div>
        {topSpendingCategory ? (
          <div>
            <p className="text-2xl font-bold text-gray-900">{topSpendingCategory.category}</p>
            <p className="text-sm text-gray-600 mt-2">
              Spent {formatValue(topSpendingCategory.total ?? topSpendingCategory.current ?? 0)} overall.
            </p>
          </div>
        ) : (
          <p className="text-gray-600">No spending data available yet.</p>
        )}
      </div>

      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4 text-red-700">
          <Flame className="h-6 w-6" />
          <h3 className="text-lg font-semibold">Spending Alert</h3>
        </div>
        {spendingChange ? (
          <div>
            <p className="font-semibold text-gray-900">Monthly Total Spending</p>
            <p className="text-sm text-gray-600">
              Spending {spendingChange.percentageChange >= 0 ? 'up' : 'down'} {Math.abs(spendingChange.percentageChange).toFixed(1)}% from last month.
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {formatValue(spendingChange.currentMonthTotal)} this month vs {formatValue(spendingChange.previousMonthTotal)} last month.
            </p>
          </div>
        ) : increaseAlerts.length > 0 ? (
          increaseAlerts.map((item) => (
            <div key={item.category} className="mb-4 last:mb-0">
              <p className="font-semibold text-gray-900">{item.category}</p>
              <p className="text-sm text-gray-600">
                Spending up {item.change.toFixed(0)}% from last month.
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No dramatic spending increases this month.</p>
        )}
      </div>

      <div className="rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4 text-green-700">
          <Trophy className="h-6 w-6" />
          <h3 className="text-lg font-semibold">Savings Trend</h3>
        </div>
        {savingsAlerts.length > 0 ? (
          savingsAlerts.map((item) => (
            <div key={item.category} className="mb-4 last:mb-0">
              <p className="font-semibold text-gray-900">{item.category}</p>
              <p className="text-sm text-gray-600">
                Spending down {Math.abs(item.change).toFixed(0)}% from last month.
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No categories are trending lower yet.</p>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4 text-slate-700">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <h3 className="text-lg font-semibold">Budget Progress</h3>
          </div>
          <div className="flex gap-2">
            <Tooltip title="Set Budget">
              <IconButton
                size="small"
                color="primary"
                onClick={onSetBudgetClick}
                aria-label="Set Budget"
              >
                <Plus className="h-4 w-4" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset Budgets">
              <IconButton
                size="small"
                color="error"
                onClick={onResetBudgets}
                aria-label="Reset Budgets"
              >
                <RefreshCcw className="h-4 w-4" />
              </IconButton>
            </Tooltip>
          </div>
        </div>
        {activeBudgets.length > 0 ? (
          activeBudgets.map((budget) => {
            const monthlyLimit = Number(budget.monthlyLimit ?? budget.limitAmount ?? 0);
            const amountSpent = getSpentForCategory(budget.category);
            const percentage = monthlyLimit > 0 ? (amountSpent / monthlyLimit) * 100 : 0;
            const boundedPercentage = Math.min(percentage, 100);
            const isOverLimit = percentage > 100;
            const isNearLimit = percentage > 90 && percentage <= 100;
            const remainingPercentage = Math.max(0, 100 - percentage);
            const progressBarColor = isOverLimit ? '#d32f2f' : isNearLimit ? '#ed6c02' : '#1976d2';

            return (
              <div key={budget.id || budget.category} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-gray-900">{budget.category}</p>
                  <p className="text-xs text-gray-600">{Math.round(percentage)}%</p>
                </div>
                <LinearProgress
                  variant="determinate"
                  value={boundedPercentage}
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: '#e5e7eb',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: progressBarColor,
                    },
                  }}
                />
                <p className="text-sm text-gray-600 mt-1">
                  {formatValue(amountSpent)} / {formatValue(monthlyLimit)}
                </p>
                <p className="text-sm text-gray-600">
                  {remainingPercentage.toFixed(0)}% of {budget.category} budget remaining
                </p>
                {isOverLimit && (
                  <p className="text-sm text-red-600">
                    Over limit by {formatValue(amountSpent - monthlyLimit)}
                  </p>
                )}
              </div>
            );
          })
        ) : budgetWarnings.length > 0 ? (
          budgetWarnings.map((budget) => (
            <div key={budget.category} className="mb-4 last:mb-0">
              <p className="font-semibold text-gray-900">{budget.category}</p>
              <p className="text-sm text-gray-600">
                Careful! You've used {Math.round(budget.percentageSpent)}% of your {budget.category} budget with {daysLeft} days left in the month.
              </p>
            </div>
          ))
        ) : overBudgetItems.length > 0 ? (
          overBudgetItems.map((budget) => (
            <div key={budget.category} className="mb-4 last:mb-0">
              <p className="font-semibold text-gray-900">{budget.category} (Over Budget)</p>
              <p className="text-sm text-gray-600">
                You've exceeded your {budget.category} budget by {formatValue(budget.amountSpent - budget.monthlyLimit)}.
              </p>
            </div>
          ))
        ) : budgetAnalyses.length > 0 ? (
          <p className="text-gray-600">All tracked budgets are within safe limits this month.</p>
        ) : (
          <p className="text-gray-600">No budgets available yet. Add budget goals to get progress alerts.</p>
        )}
      </div>

      <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4 text-indigo-700">
          {/* Changed CrystalBall to Sparkles here too */}
          <Sparkles className="h-6 w-6" />
          <h3 className="text-lg font-semibold">Projected Total</h3>
        </div>
        <p className="text-2xl font-bold text-gray-900">{formatValue(projectedEndOfMonthTotal)}</p>
        <p className="text-sm text-gray-600 mt-2">{projectionTip}</p>
      </div>
    </div>
  );
};

export default SmartInsights;