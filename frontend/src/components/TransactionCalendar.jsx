import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TransactionCalendar = ({ transactions, formatCurrency }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Build grid data
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Process transactions by date
  const transactionsByDate = useMemo(() => {
    const map = {};
    if (!transactions) return map;
    
    transactions.forEach(t => {
      const dateStr = t.date.split('T')[0];
      if (!map[dateStr]) {
        map[dateStr] = { spent: 0, earned: 0 };
      }
      const amount = Math.abs(t.amount);
      const isIncome = t.type === 'income' || ['Income', 'Salary'].includes(t.category);
      if (isIncome) {
        map[dateStr].earned += amount;
      } else {
        map[dateStr].spent += amount;
      }
    });
    return map;
  }, [transactions]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const renderCells = () => {
    const cells = [];
    const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
    
    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - startDay + 1;
      const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
      
      if (!isCurrentMonth) {
        cells.push(
          <div key={`empty-${i}`} className="h-10 w-10 mx-auto flex items-center justify-center text-slate-300 dark:text-slate-600/50 border-2 border-dashed border-transparent dark:border-slate-700/30 rounded-full text-sm font-medium">
            {dayNumber <= 0 ? new Date(year, month, dayNumber).getDate() : dayNumber - daysInMonth}
          </div>
        );
        continue;
      }

      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
      const hasTransaction = !!transactionsByDate[dateStr];
      const isToday = dateStr === todayStr;

      let cellClass = "h-10 w-10 flex items-center justify-center rounded-full text-sm font-semibold transition-all relative group cursor-pointer ";
      
      if (isToday) {
        cellClass += "bg-blue-600 text-white shadow-md ";
      } else if (hasTransaction) {
        cellClass += "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 ";
      } else {
        cellClass += "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 ";
      }

      cells.push(
        <div key={dateStr} className="flex justify-center relative">
          <div className={cellClass}>
            {dayNumber}
            {hasTransaction && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-2 bg-slate-800 dark:bg-slate-900 text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl z-20 border border-slate-700 pointer-events-none">
                <div className="font-semibold mb-1 border-b border-slate-700 pb-1 text-slate-200">
                  {new Date(year, month, dayNumber).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                {transactionsByDate[dateStr].spent > 0 && (
                  <div className="text-rose-400 mt-1">Spent: {formatCurrency ? formatCurrency(transactionsByDate[dateStr].spent) : transactionsByDate[dateStr].spent}</div>
                )}
                {transactionsByDate[dateStr].earned > 0 && (
                  <div className="text-emerald-400 mt-1">Earned: {formatCurrency ? formatCurrency(transactionsByDate[dateStr].earned) : transactionsByDate[dateStr].earned}</div>
                )}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800 dark:border-t-slate-900"></div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return cells;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200/60 dark:border-gray-700/60 shadow-lg flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Activity Calendar
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={handlePrevMonth} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 min-w-[110px] text-center">
            {monthNames[month]} {year}
          </span>
          <button onClick={handleNextMonth} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-y-4 gap-x-1">
        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2">
            {day}
          </div>
        ))}
        {renderCells()}
      </div>
    </div>
  );
};

export default TransactionCalendar;
