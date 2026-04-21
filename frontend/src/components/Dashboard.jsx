import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getTransactions, getFilteredTransactions, addTransaction, deleteTransaction, getBudgetAnalyses, getBudgetAnalysesByUsername, getAiInsights, resetBudgetsByUser, createBudget, getCurrentMonthCategoryTotals, getDailySpendingChartData, updateUserIncome } from '../services/api';
import { History, Sparkles, HandCoins } from 'lucide-react';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Paper,
  Alert,
  CircularProgress,
  Snackbar,
  Typography,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import Card from './Card';
import ExpenseChart from './ExpenseChart';
import CsvImport from './CsvImport';
import AddTransactionModal from './AddTransactionModal';
import SmartInsights from './SmartInsights';
import MonthlyCategoryDoughnut from './MonthlyCategoryDoughnut';
import DailySpendingAreaChart from './DailySpendingAreaChart';
import ThemeToggle from './ThemeToggle';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';

const Dashboard = ({ onLogout, userId }) => {
  const navigate = useNavigate();
  const getUsernameFromToken = useCallback((token) => {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }
      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(normalizedPayload));
      return decoded?.sub || decoded?.username || null;
    } catch (error) {
      console.error('Failed to decode auth token:', error);
      return null;
    }
  }, []);

  const getUserIdFromToken = useCallback((token) => {
    try {
      const payload = token?.split('.')[1];
      if (!payload) {
        return null;
      }
      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(normalizedPayload));
      const candidateId = decoded?.userId ?? decoded?.id ?? decoded?.uid ?? null;
      const numericId = Number(candidateId);
      return Number.isFinite(numericId) && numericId > 0 ? numericId : null;
    } catch (error) {
      console.error('Failed to decode user ID from auth token:', error);
      return null;
    }
  }, []);
  const googleUserStorageKey = 'googleUser';
  const [googleUser, setGoogleUser] = useState(() => {
    try {
      const stored = localStorage.getItem(googleUserStorageKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to parse stored Google user:', error);
      return null;
    }
  });
  const [dateFilter, setDateFilter] = useState('30D');
  const [transactions, setTransactions] = useState([]);
  const [topCategory, setTopCategory] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [budgetAnalyses, setBudgetAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isResetBudgetDialogOpen, setIsResetBudgetDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [auditData, setAuditData] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [historyTitle, setHistoryTitle] = useState('Transaction History');
  const [aiInsights, setAiInsights] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState(null);
  const [monthlyCategoryTotals, setMonthlyCategoryTotals] = useState([]);
  const [isMonthlyTotalsLoading, setIsMonthlyTotalsLoading] = useState(false);
  const [dailySpendingChartData, setDailySpendingChartData] = useState([]);
  const [isDailySpendingLoading, setIsDailySpendingLoading] = useState(false);
  const currencyStorageKey = 'selectedCurrency';
  const incomeStorageKey = 'userIncome';
  const getInitialCurrency = () => {
    const stored = localStorage.getItem(currencyStorageKey);
    return stored === 'USD' || stored === 'EUR' || stored === 'INR' ? stored : 'INR';
  };
  const [selectedCurrency, setSelectedCurrency] = useState(getInitialCurrency);
  const getInitialIncome = () => {
    const stored = localStorage.getItem(incomeStorageKey);
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const [income, setIncome] = useState(getInitialIncome);
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [budgetResetSuccess, setBudgetResetSuccess] = useState(false);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Food',
  });
  const [budgetForm, setBudgetForm] = useState({
    category: 'Food',
    monthlyLimit: '',
  });

  const handleGoogleLoginSuccess = useCallback((credentialResponse) => {
    if (!credentialResponse?.credential) {
      toast.error('Google sign-in failed. Please try again.');
      return;
    }
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const nextUser = {
        name: decoded?.name || 'Google User',
        picture: decoded?.picture || '',
      };
      localStorage.setItem(googleUserStorageKey, JSON.stringify(nextUser));
      setGoogleUser(nextUser);
      toast.success('Signed in with Google.');
    } catch (error) {
      console.error('Failed to decode Google credential:', error);
      toast.error('Google sign-in failed. Please try again.');
    }
  }, []);

  const handleGoogleLoginError = useCallback(() => {
    toast.error('Google sign-in failed. Please try again.');
  }, []);

  const handleLogout = useCallback(() => {
    googleLogout();
    localStorage.clear();
    clearDashboardState();
    setIncome(0);
    setIsEditingIncome(false);
    setGoogleUser(null);
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  }, [navigate, onLogout]);

  // Filter state
  const [filters, setFilters] = useState({
    month: null,
    year: null,
    category: '',
  });

  const { globalStartDate, globalEndDate, globalLabel } = useMemo(() => {
    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];
    let startDate;
    let label;

    if (dateFilter === '7D') {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      startDate = formatDate(start);
      label = 'Last 7 Days';
    } else if (dateFilter === '90D') {
      const start = new Date(today);
      start.setDate(start.getDate() - 89);
      startDate = formatDate(start);
      label = 'Last 90 Days';
    } else if (dateFilter === '1Y') {
      const start = new Date(today);
      start.setFullYear(start.getFullYear() - 1);
      startDate = formatDate(start);
      label = 'Last 1 Year';
    } else if (dateFilter === 'CUSTOM' && customStartDate && customEndDate) {
      startDate = formatDate(new Date(customStartDate));
      label = 'Custom Range';
    } else {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      startDate = formatDate(start);
      label = 'Last 30 Days';
    }

    return {
      globalStartDate: startDate,
      globalEndDate:
        dateFilter === 'CUSTOM' && customEndDate
          ? formatDate(new Date(customEndDate))
          : formatDate(today),
      globalLabel: label,
    };
  }, [customEndDate, customStartDate, dateFilter]);

  useEffect(() => {
    localStorage.setItem(currencyStorageKey, selectedCurrency);
  }, [selectedCurrency]);

  useEffect(() => {
    localStorage.setItem(incomeStorageKey, String(income));
  }, [income]);

  const getTopCategoryByTotalSpending = (items) => {
    const categoryTotals = items.reduce((acc, transaction) => {
      const key = transaction.category || 'Other';
      acc[key] = (acc[key] || 0) + Number(transaction.amount || 0);
      return acc;
    }, {});

    return Object.entries(categoryTotals).reduce((best, [category, total]) => {
      if (!best || total > best.total) {
        return { category, total };
      }
      return best;
    }, null);
  };

  const getStoredUserEmail = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        return parsedUser?.email || null;
      }
      const storedProfile = localStorage.getItem('userProfile');
      if (!storedProfile) {
        return null;
      }
      const parsedProfile = JSON.parse(storedProfile);
      return parsedProfile?.email || null;
    } catch (error) {
      console.error('Failed to parse stored user profile:', error);
      return null;
    }
  };

  const clearDashboardState = () => {
    setTransactions([]);
    setTotalSpent(0);
    setMonthlyCategoryTotals([]);
    setDailySpendingChartData([]);
    setTopCategory(null);
    setError(null);
  };

  const fetchTransactions = useCallback(async (startDate, endDate) => {
    const token = localStorage.getItem('token');
    const authOptions = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};

    const email = getStoredUserEmail();
    if (!email) {
      setTransactions([]);
      return;
    }

    const transactionsData = await getFilteredTransactions({
      startDate,
      endDate,
      email,
    }, authOptions);
    setTransactions(transactionsData);
  }, []);

  const fetchMonthlyCategoryTotals = useCallback(async () => {
    setIsMonthlyTotalsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const authOptions = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      const email = getStoredUserEmail();
      if (!email) {
        setMonthlyCategoryTotals([]);
        return;
      }
      const totals = await getCurrentMonthCategoryTotals(email, authOptions);
      setMonthlyCategoryTotals(Array.isArray(totals) ? totals : []);
    } catch (err) {
      console.error('Failed to fetch current month category totals:', err);
      setMonthlyCategoryTotals([]);
    } finally {
      setIsMonthlyTotalsLoading(false);
    }
  }, []);

  const fetchDailySpendingChartData = useCallback(async (startDate, endDate) => {
    setIsDailySpendingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const authOptions = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      const email = getStoredUserEmail();
      if (!email) {
        setDailySpendingChartData([]);
        return;
      }
      const totals = await getDailySpendingChartData(startDate, endDate, email, authOptions);
      setDailySpendingChartData(Array.isArray(totals) ? totals : []);
    } catch (err) {
      console.error('Failed to fetch daily spending totals:', err);
      setDailySpendingChartData([]);
    } finally {
      setIsDailySpendingLoading(false);
    }
  }, []);

  const fetchBudgets = useCallback(async () => {
    const numericUserId = Number(userId);
    const token = localStorage.getItem('token');

    if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
      if (!token) {
        setBudgets([]);
        setBudgetAnalyses([]);
        return;
      }
    }

    const authOptions = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};

    const username = token ? getUsernameFromToken(token) : null;
    const budgetsData = Number.isFinite(numericUserId) && numericUserId > 0
      ? await getBudgetAnalyses(numericUserId, authOptions)
      : username
        ? await getBudgetAnalysesByUsername(username, authOptions)
        : [];
    setBudgets(budgetsData);
    setBudgetAnalyses(budgetsData);
  }, [getUsernameFromToken, userId]);

  const fetchDashboardData = useCallback(async (startDate, endDate) => {
    setLoading(true);
    setError(null);
    try {
      await fetchTransactions(startDate, endDate);
      await fetchMonthlyCategoryTotals();

      try {
        await fetchBudgets();
      } catch (budgetErr) {
        const status = budgetErr?.response?.status;
        const isEmptyBudgetPayload =
          Array.isArray(budgetErr?.response?.data) && budgetErr.response.data.length === 0;

        if (status === 404 || status === 204 || isEmptyBudgetPayload) {
          setBudgets([]);
          setBudgetAnalyses([]);
        } else {
          throw budgetErr;
        }
      }
    } catch (err) {
      setError('Failed to fetch dashboard data. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchMonthlyCategoryTotals, fetchTransactions, fetchBudgets]);

  const handleCustomDateApply = useCallback(async () => {
    if (!customStartDate || !customEndDate) {
      alert('Please select both a start date and an end date.');
      return;
    }
    if (new Date(customStartDate) > new Date(customEndDate)) {
      alert('Start date must be before end date.');
      return;
    }

    const normalizeDate = (value) => new Date(value).toISOString().split('T')[0];
    const startDate = normalizeDate(customStartDate);
    const endDate = normalizeDate(customEndDate);

    setDateFilter('CUSTOM');
    await fetchDashboardData(startDate, endDate);
    await fetchDailySpendingChartData(startDate, endDate);
  }, [
    customEndDate,
    customStartDate,
    fetchDailySpendingChartData,
    fetchDashboardData,
  ]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    let candidateId = userId ?? null;

    if (!candidateId && storedToken) {
      try {
        const parsed = JSON.parse(storedToken);
        candidateId = parsed?.userId ?? parsed?.id ?? parsed?.uid ?? parsed?.user?.id ?? null;
      } catch (error) {
        candidateId = getUserIdFromToken(storedToken);
      }
    }

    const numericId = Number(candidateId);
    setResolvedUserId(Number.isFinite(numericId) && numericId > 0 ? numericId : null);
  }, [userId]);

  useEffect(() => {
    setTopCategory(getTopCategoryByTotalSpending(transactions));
  }, [transactions]);

  useEffect(() => {
    const total = transactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    setTotalSpent(total);
  }, [transactions]);

  useEffect(() => {
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('user') || 'null');
    } catch (error) {
      user = null;
    }

    setTransactions([]);
    setTotalSpent(0);
    setMonthlyCategoryTotals([]);
    setDailySpendingChartData([]);
    clearDashboardState();
    fetchDashboardData(globalStartDate, globalEndDate);
    fetchDailySpendingChartData(globalStartDate, globalEndDate);
  }, [
    fetchDashboardData,
    fetchDailySpendingChartData,
    globalEndDate,
    globalStartDate,
  ]);

  // Handle filter changes
  const handleFilterChange = async (newFilters) => {
    setFilters(newFilters);
    setLoading(true);
    setError(null);
    try {
      const email = getStoredUserEmail();
      if (!email) {
        setTransactions([]);
        return;
      }
      const filteredData = await getFilteredTransactions({
        ...newFilters,
        email,
      });
      setTransactions(filteredData);
    } catch (err) {
      setError('Failed to fetch filtered transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Reset filters
  const resetFilters = async () => {
    setFilters({
      month: null,
      year: null,
      category: '',
    });
    setLoading(true);
    setError(null);
    try {
      const email = getStoredUserEmail();
      if (!email) {
        setTransactions([]);
        return;
      }
      const allTransactions = await getTransactions(email);
      setTransactions(allTransactions);
    } catch (err) {
      setError('Failed to reset filters');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleBudgetInputChange = (e) => {
    const { name, value } = e.target;
    setBudgetForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (formDataToSubmit) => {
    if (!formDataToSubmit.description || !formDataToSubmit.amount || !formDataToSubmit.date || !formDataToSubmit.category) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const rawDate = formDataToSubmit.date;
      const normalizedDate = typeof rawDate === 'string'
        ? rawDate.split('T')[0]
        : new Date(rawDate).toISOString().split('T')[0];

      const transactionData = {
        ...formDataToSubmit,
        amount: Number(formDataToSubmit.amount),
        date: normalizedDate,
      };

      console.log('Sending to backend:', transactionData);

      await addTransaction(transactionData);

      await fetchTransactions(globalStartDate, globalEndDate);
      
      // Close modal and show success toast
      setIsModalOpen(false);
      toast.success(`✓ Transaction added: ${formatCurrency(parseFloat(formDataToSubmit.amount))}`);
      setError(null);
    } catch (err) {
      toast.error('Failed to add transaction');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const authOptions = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      await deleteTransaction(id, authOptions);

      await fetchTransactions(globalStartDate, globalEndDate);
      toast.success('✓ Transaction deleted');

      setError(null);
    } catch (err) {
      toast.error('Failed to delete transaction');
      console.error(err);
    }
  };

  const fetchHistory = async (id) => {
    try {
      const transaction = transactions.find((t) => t.id === id);
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('You must be logged in to view transaction history');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/transactions/${id}/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const historyData = response.data;
      console.log('Audit history data:', historyData);
      setAuditData(historyData);

      const normalizedHistory = historyData.map((entry) => ({
        timestamp: entry.timestamp || entry.changeDateTime || null,
        revisionType: entry.revisionType || entry.changeType || 'UNKNOWN',
        transaction: entry.transaction || entry.transactionDetails || entry.transactionState || {},
      }));

      const activityWithMessages = normalizedHistory
        .sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime())
        .map((entry, index, arr) => {
          const previous = index > 0 ? arr[index - 1] : null;
          return {
            ...entry,
            message: getChangeMessage(entry, previous),
          };
        })
        .reverse();

      setSelectedHistory(activityWithMessages);
      setRecentActivity(activityWithMessages.slice(0, 5));
      setHistoryTitle(
        transaction
          ? `Transaction History - ${transaction.description}`
          : `Transaction History - ID ${id}`
      );
      setIsHistoryOpen(true);
    } catch (err) {
      toast.error('Failed to fetch transaction history');
      console.error(err);
    }
  };

  const handleImportSuccess = async (importResult) => {
    // Refresh dashboard data after successful import
    if (importResult.successfulRecords > 0) {
      toast.success(`✓ Successfully imported ${importResult.successfulRecords} transaction${importResult.successfulRecords !== 1 ? 's' : ''}!`);
      fetchDashboardData(globalStartDate, globalEndDate);
    }
  };

  const handleSaveBudget = async () => {
    if (isSavingBudget) {
      return;
    }
    if (!budgetForm.category || !budgetForm.monthlyLimit) {
      toast.error('Please select a category and enter monthly limit');
      return;
    }

    try {
      setIsSavingBudget(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You must be logged in to save a budget');
        return;
      }

      const numericUserId = Number(userId);

      const authOptions = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      const payload = {
        category: budgetForm.category,
        monthlyLimit: parseFloat(budgetForm.monthlyLimit),
      };

      if (Number.isFinite(numericUserId) && numericUserId > 0) {
        payload.userId = numericUserId;
      }

      await createBudget(payload, authOptions);

      await fetchBudgets();

      setIsBudgetModalOpen(false);
      setBudgetForm({ category: 'Food', monthlyLimit: '' });
      toast.success('✓ Budget saved successfully');
    } catch (err) {
      toast.error('Failed to save budget');
      console.error(err);
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleResetBudgets = () => {
    setIsResetBudgetDialogOpen(true);
  };

  const handleConfirmResetBudgets = async () => {
    try {
      const token = localStorage.getItem('token');
      const authOptions = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      const numericUserId = Number(userId);
      if (!Number.isFinite(numericUserId)) {
        toast.error('Unable to determine the logged-in user');
        return;
      }

      await resetBudgetsByUser(numericUserId, authOptions);
      setBudgets([]);
      setBudgetAnalyses([]);
      setBudgetResetSuccess(true);
      setIsResetBudgetDialogOpen(false);
    } catch (err) {
      toast.error('Failed to reset budgets');
      console.error(err);
    }
  };

  const handleGetAiInsights = async () => {
    const token = localStorage.getItem('token');
    const email = getStoredUserEmail();
    if (!email) {
      console.error('User email not found');
      return;
    }
    setIsAiLoading(true);
    try {
      const authOptions = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      const response = await getAiInsights(email, authOptions);
      setAiInsights(response?.insights || 'No insights available at the moment.');
    } catch (err) {
      toast.error('Failed to fetch AI insights');
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleIncomeChange = (event) => {
    const value = Number(event.target.value);
    setIncome(Number.isFinite(value) ? value : 0);
  };

  const toggleIncomeEdit = async () => {
    if (isEditingIncome) {
      const email = getStoredUserEmail();
      if (!email) {
        toast.error('Unable to save income. Please sign in again.');
      } else {
        try {
          const token = localStorage.getItem('token');
          const authOptions = token
            ? { headers: { Authorization: `Bearer ${token}` } }
            : {};
          const updatedUser = await updateUserIncome(email, income, authOptions);
          if (updatedUser?.totalIncome !== undefined && updatedUser?.totalIncome !== null) {
            setIncome(Number(updatedUser.totalIncome));
            localStorage.setItem('userIncome', String(updatedUser.totalIncome));
            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem('userProfile', JSON.stringify(updatedUser));
          }
          toast.success('✓ Total income saved');
        } catch (error) {
          toast.error('Failed to save income');
          console.error(error);
        }
      }
    }

    setIsEditingIncome((current) => !current);
  };

  const categories = [
    { label: 'Food & Dining', value: 'Food' },
    { label: 'Transport', value: 'Transport' },
    { label: 'Entertainment', value: 'Entertainment' },
    { label: 'Utilities', value: 'Utilities' },
    { label: 'Shopping', value: 'Shopping' },
    { label: 'Healthcare', value: 'Healthcare' },
    { label: 'Other', value: 'Other' },
  ];

  const getCategoryEmoji = (category) => {
    const emojiMap = {
      Food: '🍔',
      Transport: '🚗',
      Entertainment: '🎬',
      Utilities: '💡',
      Shopping: '🛍️',
      Healthcare: '🏥',
      Other: '📌',
    };
    return emojiMap[category] || '📌';
  };

  const getCurrentYear = new Date().getFullYear();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMonthOverMonthSpendingChange = (items) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const previousMonth = previousMonthDate.getMonth();
    const previousYear = previousMonthDate.getFullYear();

    const currentMonthTotal = items.reduce((sum, transaction) => {
      const date = new Date(transaction.date);
      if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
        return sum + Number(transaction.amount || 0);
      }
      return sum;
    }, 0);

    const previousMonthTotal = items.reduce((sum, transaction) => {
      const date = new Date(transaction.date);
      if (date.getFullYear() === previousYear && date.getMonth() === previousMonth) {
        return sum + Number(transaction.amount || 0);
      }
      return sum;
    }, 0);

    const percentageChange = previousMonthTotal > 0
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
      : currentMonthTotal > 0
        ? 100
        : 0;

    return {
      currentMonthTotal,
      previousMonthTotal,
      percentageChange,
    };
  };

  const spendingChange = getMonthOverMonthSpendingChange(transactions);

  const dailySpendingTitle = `Daily Spending (${globalLabel})`;

  const totalIncome = income;

  const netBalance = income - totalSpent;
  const isLowBalance = totalSpent > income;

  const sortedHistory = [...selectedHistory].sort(
    (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
  );

  const EXCHANGE_RATES = {
    USD: 1,
    INR: 83.5,
    EUR: 0.92,
  };

  const CURRENCY_SYMBOLS = {
    USD: '$',
    INR: '₹',
    EUR: '€',
  };

  const CURRENCY_LOCALES = {
    USD: 'en-US',
    INR: 'en-IN',
    EUR: 'de-DE',
  };

  const formatCurrency = (amountInUSD) => {
    if (amountInUSD === null || amountInUSD === undefined || Number.isNaN(Number(amountInUSD))) {
      return 'N/A';
    }
    const numericValue = Number(amountInUSD);
    const rate = EXCHANGE_RATES[selectedCurrency] ?? 1;
    const converted = Math.abs(numericValue) * rate;
    const locale = CURRENCY_LOCALES[selectedCurrency] ?? 'en-US';
    const symbol = CURRENCY_SYMBOLS[selectedCurrency] ?? '$';
    const formattedNumber = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
    const formatted = `${symbol}${formattedNumber}`;
    return numericValue < 0 ? `-${formatted}` : formatted;
  };

  const getChangeMessage = (currentEntry, previousEntry) => {
    const current = currentEntry.transaction || {};
    const previous = previousEntry?.transaction || null;

    if (currentEntry.revisionType === 'INSERT') {
      return `Original entry created with amount ${formatCurrency(current.amount)}`;
    }

    if (currentEntry.revisionType === 'DELETE') {
      return `Transaction deleted (last amount ${formatCurrency(current.amount)})`;
    }

    const changes = [];
    if (previous) {
      if (previous.amount !== current.amount) {
        changes.push(`Amount updated from ${formatCurrency(previous.amount)} to ${formatCurrency(current.amount)}`);
      }
      if (previous.description !== current.description) {
        changes.push(`Description updated from "${previous.description || 'N/A'}" to "${current.description || 'N/A'}"`);
      }
      if (previous.category !== current.category) {
        changes.push(`Category updated from "${previous.category || 'N/A'}" to "${current.category || 'N/A'}"`);
      }
    }

    if (changes.length === 0) {
      return 'Transaction updated';
    }

    return changes.join(' | ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 dark:text-white">💰 Finance Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage and track your personal finances</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {googleUser ? (
              <div className="flex items-center gap-3 rounded-full bg-white/70 px-3 py-1 shadow-sm">
                {googleUser.picture ? (
                  <img
                    src={googleUser.picture}
                    alt={googleUser.name}
                    className="h-9 w-9 rounded-full border border-white object-cover"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-slate-200" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800">{googleUser.name}</span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-left text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <GoogleLogin onSuccess={handleGoogleLoginSuccess} onError={handleGoogleLoginError} width="250" />
            )}
          </div>
        </div>

        <SmartInsights
          transactions={transactions}
          budgetAnalyses={budgetAnalyses}
          budgets={budgets}
          spendingChange={spendingChange}
          topCategory={topCategory}
          formatCurrency={formatCurrency}
          onSetBudgetClick={() => setIsBudgetModalOpen(true)}
          onResetBudgets={handleResetBudgets}
        />

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:border-red-700 dark:bg-red-950 dark:text-red-200">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <Stack spacing={4} sx={{ mb: 4 }}>
          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card
              title="Total Income"
              className={isLowBalance ? 'border-2 border-red-300' : ''}
              value={(
                <div className="flex items-center gap-3">
                  {isEditingIncome ? (
                    <input
                      type="number"
                      value={income}
                      onChange={handleIncomeChange}
                      className="h-9 w-32 rounded-md border border-white/60 bg-white/90 px-2 text-sm text-slate-900"
                      min="0"
                    />
                  ) : (
                    <span>{formatCurrency(income)}</span>
                  )}
                  <button
                    type="button"
                    onClick={toggleIncomeEdit}
                    className="rounded-full border border-white/60 px-2 py-0.5 text-xs font-semibold text-white/90 hover:bg-white/20"
                  >
                    {isEditingIncome ? 'Save' : 'Edit'}
                  </button>
                </div>
              )}
              warning={isLowBalance ? 'Warning: Low Balance' : ''}
              icon="💳"
              gradient="from-green-600 to-emerald-500"
            />
            <Card
              title="Total Spent"
              value={formatCurrency(totalSpent)}
              subtitle={`Based on ${transactions.length} transactions`}
              icon={<HandCoins />}
              gradient="from-orange-500 to-red-500"
            />
            <Card
              title="Net Balance"
              value={(
                <span className={netBalance < 0 ? 'text-red-200' : 'text-emerald-100'}>
                  {formatCurrency(netBalance)}
                </span>
              )}
              icon="📈"
              gradient="from-blue-600 to-indigo-600"
            />
            <Card
              title="Total Transactions"
              value={transactions.length}
              icon="📊"
              gradient="from-purple-600 to-pink-600"
            />
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Date Range</h2>
              <p className="text-sm text-gray-500 dark:text-gray-300">Showing {globalLabel.toLowerCase()}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="inline-flex items-center gap-2">
                {[
                  { symbol: '$', code: 'USD', label: 'USD' },
                  { symbol: '₹', code: 'INR', label: 'INR' },
                  { symbol: '€', code: 'EUR', label: 'EUR' },
                ].map((option, index) => (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => setSelectedCurrency(option.code)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      selectedCurrency === option.code
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-gray-600 border border-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700'
                    }`}
                  >
                    {option.label} {option.symbol}
                  </button>
                ))}
              </div>
              <div className="inline-flex rounded-full border border-gray-300 overflow-hidden dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setDateFilter('7D')}
                  className={`px-4 py-2 text-sm font-semibold transition ${
                    dateFilter === '7D'
                      ? 'bg-blue-600 text-white'
                      : 'bg-transparent text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                  }`}
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('30D')}
                  className={`px-4 py-2 text-sm font-semibold border-l border-gray-300 transition ${
                    dateFilter === '30D'
                      ? 'bg-blue-600 text-white'
                      : 'bg-transparent text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                  }`}
                >
                  30 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('90D')}
                  className={`px-4 py-2 text-sm font-semibold border-l border-gray-300 transition ${
                    dateFilter === '90D'
                      ? 'bg-blue-600 text-white'
                      : 'bg-transparent text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                  }`}
                >
                  90 Days
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('1Y')}
                  className={`px-4 py-2 text-sm font-semibold border-l border-gray-300 transition ${
                    dateFilter === '1Y'
                      ? 'bg-blue-600 text-white'
                      : 'bg-transparent text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                  }`}
                >
                  1 Year
                </button>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">From</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(event) => setCustomStartDate(event.target.value)}
                    className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300">To</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(event) => setCustomEndDate(event.target.value)}
                    className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCustomDateApply}
                  className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 transition"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {isMonthlyTotalsLoading ? (
            <div className="card bg-white flex items-center justify-center h-60 dark:bg-slate-800 dark:text-white">
              <p className="text-gray-500 dark:text-gray-300">Loading monthly category totals...</p>
            </div>
          ) : (
            <MonthlyCategoryDoughnut data={monthlyCategoryTotals} />
          )}

          {isDailySpendingLoading ? (
            <div className="card bg-white flex items-center justify-center h-60 dark:bg-slate-800 dark:text-white">
              <p className="text-gray-500 dark:text-gray-300">Loading daily spending...</p>
            </div>
          ) : (
            <div className="card bg-white dark:bg-slate-800 dark:text-white">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Daily Spending</h2>
                <span className="text-sm text-gray-500 dark:text-gray-300">{globalLabel}</span>
              </div>
              <DailySpendingAreaChart
                data={dailySpendingChartData}
                title={dailySpendingTitle}
                formatValue={formatCurrency}
              />
            </div>
          )}

          <Paper elevation={3} sx={{ p: 3 }} className="dark:bg-slate-800 dark:text-white">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-white">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300">Click a transaction's History button to view recent audit activity.</p>
            ) : (
              <Timeline position="right" sx={{ p: 0, m: 0 }}>
                {recentActivity.map((entry, index) => (
                  <TimelineItem key={`recent-${index}`}>
                    <TimelineOppositeContent sx={{ maxWidth: '180px', flex: 0.25 }} color="text.secondary">
                      {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color={entry.revisionType === 'DELETE' ? 'error' : 'primary'} />
                      {index < recentActivity.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <div className="p-3 border border-gray-200 rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700">
                        <p className="text-sm text-gray-800 dark:text-gray-100">{entry.message}</p>
                        <p className="text-sm text-gray-600 mt-1 dark:text-gray-300">
                          Amount: {formatCurrency(entry.transaction?.amount)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Description: {entry.transaction?.description || 'N/A'}
                        </p>
                      </div>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            )}
          </Paper>
        </Stack>

        {/* Filter Section */}
        <div className="card bg-white mb-8 dark:bg-slate-800 dark:text-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🔍 Filter Transactions</h2>
            {(filters.month || filters.year || filters.category) && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold dark:bg-slate-700 dark:text-gray-100 dark:hover:bg-slate-600"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange({
                  ...filters,
                  category: e.target.value,
                })}
                className="input-field w-full dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                Month
              </label>
              <select
                value={filters.month || ''}
                onChange={(e) => handleFilterChange({
                  ...filters,
                  month: e.target.value ? parseInt(e.target.value) : null,
                })}
                className="input-field w-full dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
              >
                <option value="">All Months</option>
                {monthNames.map((month, index) => (
                  <option key={index + 1} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">
                Year
              </label>
              <select
                value={filters.year || ''}
                onChange={(e) => handleFilterChange({
                  ...filters,
                  year: e.target.value ? parseInt(e.target.value) : null,
                })}
                className="input-field w-full dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
              >
                <option value="">All Years</option>
                {[getCurrentYear, getCurrentYear - 1, getCurrentYear - 2].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.month || filters.year || filters.category) && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2 dark:border-slate-700">
              {filters.category && (
                <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold dark:bg-blue-900 dark:text-blue-100">
                  Category: {categories.find(c => c.value === filters.category)?.label}
                  <button
                    onClick={() => handleFilterChange({ ...filters, category: '' })}
                    className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-200 dark:hover:text-blue-100"
                  >
                    ✕
                  </button>
                </span>
              )}
              {filters.month && (
                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold dark:bg-green-900 dark:text-green-100">
                  Month: {monthNames[filters.month - 1]}
                  <button
                    onClick={() => handleFilterChange({ ...filters, month: null })}
                    className="ml-2 text-green-600 hover:text-green-800 dark:text-green-200 dark:hover:text-green-100"
                  >
                    ✕
                  </button>
                </span>
              )}
              {filters.year && (
                <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold dark:bg-purple-900 dark:text-purple-100">
                  Year: {filters.year}
                  <button
                    onClick={() => handleFilterChange({ ...filters, year: null })}
                    className="ml-2 text-purple-600 hover:text-purple-800 dark:text-purple-200 dark:hover:text-purple-100"
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary px-8 py-3 text-lg font-semibold rounded-lg hover:shadow-lg transition-shadow"
          >
            + Add Transaction
          </button>
          <button
            onClick={() => setIsBudgetModalOpen(true)}
            className="px-8 py-3 text-lg font-semibold rounded-lg border border-indigo-500 text-indigo-700 bg-white hover:bg-indigo-50 transition-shadow"
          >
            Set Budget
          </button>
        </div>

        <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 3 }} className="dark:bg-slate-800 dark:text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-indigo-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">✨ Smart Insights</h2>
            </div>
            {!aiInsights && (
              <Button
                variant="contained"
                onClick={handleGetAiInsights}
                disabled={isAiLoading}
                startIcon={isAiLoading ? <CircularProgress size={16} color="inherit" /> : <Sparkles className="h-4 w-4" />}
              >
                {isAiLoading ? 'Analyzing...' : 'Generate AI Advice'}
              </Button>
            )}
          </div>

          {isAiLoading && !aiInsights && (
            <div className="mt-4 flex items-center gap-3 text-gray-600 dark:text-gray-300">
              <CircularProgress size={20} />
              <span className="text-sm font-medium">Generating your personalized insights...</span>
            </div>
          )}

          {aiInsights && (
            <Typography
              variant="body1"
              sx={{ mt: 2, whiteSpace: 'pre-line', color: 'text.primary' }}
            >
              {aiInsights}
            </Typography>
          )}
        </Paper>

        <div className="grid grid-cols-1 gap-8">
          {/* Transactions Table */}
          <div className="lg:col-span-2">
            <div className="card bg-white dark:bg-slate-800 dark:text-white">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 dark:text-white">
                {filters.month || filters.year || filters.category
                  ? 'Filtered Transactions'
                  : 'Recent Transactions'}
              </h2>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-600 font-semibold dark:text-gray-300">Loading transactions...</p>
                  </div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-300">
                    {filters.month || filters.year || filters.category
                      ? 'No transactions found for the selected filters'
                      : 'No transactions yet. Add one to get started!'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 dark:bg-slate-900 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Date</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Description</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Category</th>
                        <th className="px-6 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">Amount</th>
                        <th className="px-6 py-3 text-center font-semibold text-gray-700 dark:text-gray-200">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-gray-200 table-row-hover dark:border-slate-700">
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                            {new Date(transaction.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-4 text-gray-800 font-medium dark:text-gray-100">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                              {getCategoryEmoji(transaction.category)} {transaction.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-blue-600 dark:text-blue-300">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => fetchHistory(transaction.id)}
                                className="p-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition dark:border-slate-700 dark:text-gray-200 dark:hover:bg-slate-700"
                                aria-label="View transaction history"
                                title="History"
                              >
                                <History size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(transaction.id)}
                                className="btn-danger text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CSV Import Section */}
        <div className="mb-8">
          <CsvImport onImportSuccess={handleImportSuccess} />
        </div>

        {/* Expense Chart Section */}
        <div className="mb-8">
          <ExpenseChart transactions={transactions} formatCurrency={formatCurrency} />
        </div>

        {/* Add Transaction Modal */}
        <AddTransactionModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleSubmit}
          categories={categories}
          totalIncome={totalIncome}
          totalSpent={totalSpent}
          formatCurrency={formatCurrency}
        />

        <Dialog
          open={isBudgetModalOpen}
          onClose={() => setIsBudgetModalOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Set Monthly Budget</DialogTitle>
          <DialogContent dividers>
            <div className="grid grid-cols-1 gap-4 pt-1">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">Category</label>
                <select
                  name="category"
                  value={budgetForm.category}
                  onChange={handleBudgetInputChange}
                  className="input-field w-full dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">Amount</label>
                <input
                  name="monthlyLimit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={budgetForm.monthlyLimit}
                  onChange={handleBudgetInputChange}
                  className="input-field w-full dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100"
                  placeholder="Enter amount"
                />
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsBudgetModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveBudget} variant="contained" disabled={isSavingBudget}>
              {isSavingBudget ? 'Saving...' : 'Save Budget'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={isResetBudgetDialogOpen}
          onClose={() => setIsResetBudgetDialogOpen(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>Are you sure you want to reset all budget goals?</DialogTitle>
          <DialogContent dividers>
            <p className="text-gray-700 dark:text-gray-300">
              This will remove all your budget goals. This action cannot be undone.
            </p>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsResetBudgetDialogOpen(false)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={handleConfirmResetBudgets}>Reset All</Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>{historyTitle}</DialogTitle>
          <DialogContent dividers>
            {sortedHistory.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300">No history available for this transaction.</p>
            ) : (
              <Timeline position="right" sx={{ p: 0, m: 0 }}>
                {sortedHistory.map((entry, index) => (
                  <TimelineItem key={`history-${index}`}>
                    <TimelineOppositeContent sx={{ maxWidth: '180px', flex: 0.25 }} color="text.secondary">
                      {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color={entry.revisionType === 'DELETE' ? 'error' : 'primary'} />
                      {index < sortedHistory.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <div className="p-3 border border-gray-200 rounded-lg bg-white dark:bg-slate-900 dark:border-slate-700">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{entry.message}</p>
                        <p className="text-xs text-gray-500 mb-2 dark:text-gray-400">{entry.revisionType}</p>
                        <ul className="text-sm text-gray-700 space-y-1 dark:text-gray-200">
                          <li><strong>Amount:</strong> {formatCurrency(entry.transaction?.amount)}</li>
                          <li><strong>Description:</strong> {entry.transaction?.description || 'N/A'}</li>
                          <li><strong>Category:</strong> {entry.transaction?.category || 'N/A'}</li>
                        </ul>
                      </div>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsHistoryOpen(false)} variant="contained">Close</Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={budgetResetSuccess}
          autoHideDuration={3000}
          onClose={() => setBudgetResetSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={() => setBudgetResetSuccess(false)} severity="success" sx={{ width: '100%' }}>
            Budgets Reset
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default Dashboard;
