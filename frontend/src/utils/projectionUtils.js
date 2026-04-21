export const calculateProjectedEndOfMonthTotal = (currentTotalSpending, dayOfMonth) => {
  if (!currentTotalSpending || currentTotalSpending <= 0 || !dayOfMonth || dayOfMonth <= 0) {
    return 0;
  }

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyAverage = currentTotalSpending / dayOfMonth;

  return Number((dailyAverage * daysInMonth).toFixed(2));
};
