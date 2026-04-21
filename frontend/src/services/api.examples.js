/**
 * API Service Usage Examples for React Components
 * 
 * This file shows how to use the api.js service in your React components
 */

// Example 1: Using in a functional component with hooks
import { useState, useEffect } from 'react';
import { getTransactions, addTransaction, deleteTransaction } from '../services/api';

function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch transactions on component mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      setError('Failed to fetch transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (formData) => {
    try {
      const newTransaction = await addTransaction(formData);
      setTransactions([...transactions, newTransaction]);
    } catch (err) {
      setError('Failed to add transaction');
      console.error(err);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await deleteTransaction(id);
      setTransactions(transactions.filter(t => t.id !== id));
    } catch (err) {
      setError('Failed to delete transaction');
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Transactions</h1>
      {transactions.map(transaction => (
        <div key={transaction.id}>
          <p>{transaction.description} - ${transaction.amount}</p>
          <button onClick={() => handleDeleteTransaction(transaction.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}

export default TransactionList;

/**
 * Example 2: Using in a form submission
 */
function AddTransactionForm() {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: '',
    category: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert amount to number
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
      };
      const result = await addTransaction(data);
      console.log('Transaction added:', result);
      // Reset form
      setFormData({ description: '', amount: '', date: '', category: '' });
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={handleChange}
        required
      />
      <input
        type="number"
        name="amount"
        placeholder="Amount"
        value={formData.amount}
        onChange={handleChange}
        step="0.01"
        required
      />
      <input
        type="date"
        name="date"
        value={formData.date}
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="category"
        placeholder="Category (e.g., Food, Transport)"
        value={formData.category}
        onChange={handleChange}
        required
      />
      <button type="submit">Add Transaction</button>
    </form>
  );
}

export { AddTransactionForm };
