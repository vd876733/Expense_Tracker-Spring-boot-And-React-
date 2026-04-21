/**
 * ExpenseChart Component Usage Examples
 * 
 * This file demonstrates how to use the ExpenseChart component
 * to visualize transaction spending by category.
 */

import React from 'react';
import ExpenseChart from '../components/ExpenseChart';

/**
 * Example 1: Basic usage with transactions
 */
function ExpenseChartExample1() {
  const transactions = [
    { id: 1, description: 'Groceries', amount: 50.00, category: 'Food', date: '2026-04-10' },
    { id: 2, description: 'Gas', amount: 45.00, category: 'Transport', date: '2026-04-09' },
    { id: 3, description: 'Movie', amount: 15.00, category: 'Entertainment', date: '2026-04-08' },
    { id: 4, description: 'Dinner', amount: 35.00, category: 'Food', date: '2026-04-07' },
    { id: 5, description: 'Electricity Bill', amount: 120.00, category: 'Utilities', date: '2026-04-06' },
    { id: 6, description: 'Shopping', amount: 80.00, category: 'Shopping', date: '2026-04-05' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Expense Chart Example</h1>
      <ExpenseChart transactions={transactions} />
    </div>
  );
}

/**
 * Example 2: Using with fetched data from API
 */
function ExpenseChartWithAPI() {
  const [transactions, setTransactions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // Assuming you have an api.js service
        // const data = await getTransactions();
        // setTransactions(data);
        
        // For demo purposes:
        setTransactions([
          { id: 1, description: 'Groceries', amount: 50.00, category: 'Food', date: '2026-04-10' },
          { id: 2, description: 'Gas', amount: 45.00, category: 'Transport', date: '2026-04-09' },
        ]);
      } catch (err) {
        setError('Failed to fetch transactions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return <ExpenseChart transactions={transactions} />;
}

/**
 * Example 3: Filtering transactions before passing to chart
 */
function ExpenseChartFiltered() {
  const allTransactions = [
    { id: 1, description: 'Groceries', amount: 50.00, category: 'Food', date: '2026-04-10' },
    { id: 2, description: 'Gas', amount: 45.00, category: 'Transport', date: '2026-04-09' },
    { id: 3, description: 'Movie', amount: 15.00, category: 'Entertainment', date: '2026-04-08' },
    { id: 4, description: 'Dinner', amount: 35.00, category: 'Food', date: '2026-04-07' },
    { id: 5, description: 'Electricity Bill', amount: 120.00, category: 'Utilities', date: '2026-03-20' },
  ];

  // Filter transactions from this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthTransactions = allTransactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">This Month's Expenses</h1>
      <ExpenseChart transactions={thisMonthTransactions} />
    </div>
  );
}

/**
 * Example 4: Empty state (no transactions)
 */
function ExpenseChartEmpty() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">No Transactions</h1>
      <ExpenseChart transactions={[]} />
    </div>
  );
}

export {
  ExpenseChartExample1,
  ExpenseChartWithAPI,
  ExpenseChartFiltered,
  ExpenseChartEmpty,
};
