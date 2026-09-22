import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  getTransactions,
  getFilteredTransactions,
  addTransaction,
  deleteTransaction,
  getBudgetAnalyses,
  getBudgetAnalysesByUsername,
  getAiInsights,
  resetBudgetsByUser,
  createBudget,
  getCurrentMonthCategoryTotals,
  getDailySpendingChartData,
  updateUserIncome,
  getTransactionHistoryById,
} from '../services/api';

import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  PieChart,
  Target,
  FileText,
  Settings,
  Bell,
  Search,
  Sparkles,
  HandCoins,
  TrendingUp,
  History,
  Trash2,
  Plus,
  ArrowUpRight,
  Sun,
  Wallet,
  Calendar,
  Filter,
} from 'lucide-react';

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

import CsvImport from './CsvImport';
import AddTransactionModal from './AddTransactionModal';
import SmartInsights from './SmartInsights';
import BudgetSection from './BudgetSection';
import MonthlyCategoryDoughnut from './MonthlyCategoryDoughnut';
import DailySpendingAreaChart from './DailySpendingAreaChart';
import ThemeToggle from './ThemeToggle';


const Dashboard = ({ onLogout, userId }) => {
  const navigate = useNavigate();

  const getUsernameFromToken = useCallback((token) => {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
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
      if (!payload) return null;
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

  const [dateFilter, setDateFilter] = useState('ALL');
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
    return Number.isFinite(parsed) ? parsed : 10000;
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

  // Accessibility fix for modals to prevent 'aria-hidden' warnings
  useEffect(() => {
    const rootElement = document.getElementById('root');
    if (isModalOpen || isBudgetModalOpen || isResetBudgetDialogOpen || isHistoryOpen) {
      document.activeElement?.blur();
      if (rootElement) rootElement.setAttribute('inert', '');
    } else {
      if (rootElement) rootElement.removeAttribute('inert');
    }
    return () => {
      if (rootElement) rootElement.removeAttribute('inert');
    };
  }, [isModalOpen, isBudgetModalOpen, isResetBudgetDialogOpen, isHistoryOpen]);

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
    } else if (dateFilter === 'ALL') {
      startDate = '2000-01-01';
      label = 'All Time';
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
      if (!storedProfile) return null;
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
    const email = getStoredUserEmail();
    if (!email) {
      setTransactions([]);
      return;
    }

    try {
      const transactionsData = await getFilteredTransactions({
        startDate,
        endDate,
        email,
      });
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      throw err;
    }
  }, []);

  const fetchMonthlyCategoryTotals = useCallback(async () => {
    setIsMonthlyTotalsLoading(true);
    try {
      const email = getStoredUserEmail();
      if (!email) {
        setMonthlyCategoryTotals([]);
        return;
      }
      const totals = await getCurrentMonthCategoryTotals(email);
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
      const email = getStoredUserEmail();
      if (!email) {
        setDailySpendingChartData([]);
        return;
      }
      const totals = await getDailySpendingChartData(startDate, endDate, email);
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

    const username = token ? getUsernameFromToken(token) : null;
    const budgetsData =
      Number.isFinite(numericUserId) && numericUserId > 0
        ? await getBudgetAnalyses(numericUserId)
        : username
        ? await getBudgetAnalysesByUsername(username)
        : [];
        
    const data = Array.isArray(budgetsData) 
      ? budgetsData 
      : (budgetsData?.data || budgetsData?.content || []);
      
    console.log("Fetched budgets list:", data);
    setBudgets(data);
    setBudgetAnalyses(data);
  }, [getUsernameFromToken, userId]);

  const fetchDashboardData = useCallback(
    async (startDate, endDate) => {
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
            Array.isArray(budgetErr?.response?.data) &&
            budgetErr.response.data.length === 0;

          if (status === 404 || status === 204 || isEmptyBudgetPayload) {
            setBudgets([]);
            setBudgetAnalyses([]);
          } else {
            throw budgetErr;
          }
        }
      } catch (err) {
        let errorMessage =
          'Failed to fetch dashboard data. Make sure the backend is running.';

        if (err?.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err?.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err?.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [fetchMonthlyCategoryTotals, fetchTransactions, fetchBudgets]
  );

  const handleCustomDateApply = useCallback(async () => {
    if (!customStartDate || !customEndDate) {
      alert('Please select both a start date and an end date.');
      return;
    }
    if (new Date(customStartDate) > new Date(customEndDate)) {
      alert('Start date must be before end date.');
      return;
    }

    const normalizeDate = (value) =>
      new Date(value).toISOString().split('T')[0];
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
        candidateId =
          parsed?.userId ?? parsed?.id ?? parsed?.uid ?? parsed?.user?.id ?? null;
      } catch (error) {
        candidateId = getUserIdFromToken(storedToken);
      }
    }

    const numericId = Number(candidateId);
    setResolvedUserId(Number.isFinite(numericId) && numericId > 0 ? numericId : null);
  }, [userId, getUserIdFromToken]);

  useEffect(() => {
    setTopCategory(getTopCategoryByTotalSpending(transactions));
  }, [transactions]);

  useEffect(() => {
    const total = transactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount || 0),
      0
    );
    setTotalSpent(total);
  }, [transactions]);

  useEffect(() => {
    clearDashboardState();
    fetchDashboardData(globalStartDate, globalEndDate);
    fetchDailySpendingChartData(globalStartDate, globalEndDate);
  }, [
    fetchDashboardData,
    fetchDailySpendingChartData,
    globalEndDate,
    globalStartDate,
  ]);

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
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = async () => {
    setFilters({ month: null, year: null, category: '' });
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
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetInputChange = (e) => {
    const { name, value } = e.target;
    setBudgetForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (formDataToSubmit) => {
    if (
      !formDataToSubmit.description ||
      !formDataToSubmit.amount ||
      !formDataToSubmit.date ||
      !formDataToSubmit.category
    ) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const rawDate = formDataToSubmit.date;
      const normalizedDate =
        typeof rawDate === 'string'
          ? rawDate.split('T')[0]
          : new Date(rawDate).toISOString().split('T')[0];

      const transactionData = {
        ...formDataToSubmit,
        amount: Number(formDataToSubmit.amount),
        date: normalizedDate,
      };

      await addTransaction(transactionData);
      await fetchTransactions(globalStartDate, globalEndDate);

      setIsModalOpen(false);
      toast.success(
        `✓ Transaction added: ${formatCurrency(
          parseFloat(formDataToSubmit.amount)
        )}`
      );
      setError(null);
    } catch (err) {
      toast.error('Failed to add transaction');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTransaction(id);
      await fetchTransactions(globalStartDate, globalEndDate);
      toast.success('✓ Transaction deleted');
      setError(null);
    } catch (err) {
      toast.error('Failed to delete transaction');
    }
  };

  const fetchHistory = async (id) => {
    try {
      const transaction = transactions.find((t) => t.id === id);
      const historyData = await getTransactionHistoryById(id);
      setAuditData(historyData);

      const normalizedHistory = historyData.map((entry) => ({
        timestamp: entry.timestamp || entry.changeDateTime || null,
        revisionType: entry.revisionType || entry.changeType || 'UNKNOWN',
        transaction:
          entry.transaction ||
          entry.transactionDetails ||
          entry.transactionState ||
          {},
      }));

      const activityWithMessages = normalizedHistory
        .sort(
          (a, b) =>
            new Date(a.timestamp || 0).getTime() -
            new Date(b.timestamp || 0).getTime()
        )
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
    }
  };

  const handleImportSuccess = async (importResult) => {
    if (importResult.successfulRecords > 0) {
      toast.success(
        `✓ Successfully imported ${importResult.successfulRecords} transaction${
          importResult.successfulRecords !== 1 ? 's' : ''
        }!`
      );
      await fetchTransactions(globalStartDate, globalEndDate);
      await fetchDashboardData(globalStartDate, globalEndDate);
      await fetchDailySpendingChartData(globalStartDate, globalEndDate);
    }
  };

  const handleSaveBudget = async () => {
    if (isSavingBudget) return;
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

      const payload = {
        category: budgetForm.category,
        monthlyLimit: parseFloat(budgetForm.monthlyLimit),
      };

      if (Number.isFinite(numericUserId) && numericUserId > 0) {
        payload.userId = numericUserId;
      }

      const response = await createBudget(payload);
      setBudgets((prev) => [...prev, response]);
      await fetchBudgets();

      setIsBudgetModalOpen(false);
      setBudgetForm({ category: 'Food', monthlyLimit: '' });
      toast.success('✓ Budget saved successfully');
    } catch (err) {
      toast.error('Failed to save budget');
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleResetBudgets = () => {
    setIsResetBudgetDialogOpen(true);
  };

  const handleConfirmResetBudgets = async () => {
    try {
      const numericUserId = Number(userId);
      if (!Number.isFinite(numericUserId)) {
        toast.error('Unable to determine the logged-in user');
        return;
      }

      await resetBudgetsByUser(numericUserId);
      setBudgets([]);
      setBudgetAnalyses([]);
      setBudgetResetSuccess(true);
      setIsResetBudgetDialogOpen(false);
    } catch (err) {
      toast.error('Failed to reset budgets');
    }
  };

  const handleGetAiInsights = async () => {
    const email = getStoredUserEmail();
    if (!email) return;
    setIsAiLoading(true);
    try {
      const response = await getAiInsights(email);
      setAiInsights(response?.insights || 'No insights available at the moment.');
    } catch (err) {
      toast.error('Failed to fetch AI insights');
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
          const updatedUser = await updateUserIncome(email, income);
          if (
            updatedUser?.totalIncome !== undefined &&
            updatedUser?.totalIncome !== null
          ) {
            setIncome(Number(updatedUser.totalIncome));
            localStorage.setItem('userIncome', String(updatedUser.totalIncome));
            localStorage.setItem('user', JSON.stringify(updatedUser));
            localStorage.setItem('userProfile', JSON.stringify(updatedUser));
          }
          toast.success('✓ Total income saved');
        } catch (error) {
          toast.error('Failed to save income');
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
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
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
      if (
        date.getFullYear() === currentYear &&
        date.getMonth() === currentMonth
      ) {
        return sum + Number(transaction.amount || 0);
      }
      return sum;
    }, 0);

    const previousMonthTotal = items.reduce((sum, transaction) => {
      const date = new Date(transaction.date);
      if (
        date.getFullYear() === previousYear &&
        date.getMonth() === previousMonth
      ) {
        return sum + Number(transaction.amount || 0);
      }
      return sum;
    }, 0);

    const percentageChange =
      previousMonthTotal > 0
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
    (a, b) =>
      new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
  );

  const EXCHANGE_RATES = { USD: 1, INR: 83.5, EUR: 0.92 };
  const CURRENCY_SYMBOLS = { USD: '$', INR: '₹', EUR: '€' };
  const CURRENCY_LOCALES = { USD: 'en-US', INR: 'en-IN', EUR: 'de-DE' };

  const formatCurrency = (amountInUSD) => {
    if (
      amountInUSD === null ||
      amountInUSD === undefined ||
      Number.isNaN(Number(amountInUSD))
    ) {
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
      return `Original entry created with amount ${formatCurrency(
        current.amount
      )}`;
    }

    if (currentEntry.revisionType === 'DELETE') {
      return `Transaction deleted (last amount ${formatCurrency(current.amount)})`;
    }

    const changes = [];
    if (previous) {
      if (previous.amount !== current.amount) {
        changes.push(
          `Amount updated from ${formatCurrency(
            previous.amount
          )} to ${formatCurrency(current.amount)}`
        );
      }
      if (previous.description !== current.description) {
        changes.push(
          `Description updated from "${previous.description || 'N/A'}" to "${
            current.description || 'N/A'
          }"`
        );
      }
      if (previous.category !== current.category) {
        changes.push(
          `Category updated from "${previous.category || 'N/A'}" to "${
            current.category || 'N/A'
          }"`
        );
      }
    }

    return changes.length === 0 ? 'Transaction updated' : changes.join(' | ');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 flex text-slate-800 dark:text-slate-100 font-sans">
      {/* ----------------- LEFT SIDEBAR ----------------- */}
      <aside className="w-64 bg-[#0A1120] text-slate-300 hidden md:flex flex-col justify-between shrink-0 p-5 border-r border-slate-800">
        <div>
          {/* App Logo */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
              S
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                FinanceTracker
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                Track · Save · Grow
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm shadow-md transition-all">
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-medium text-sm transition-all">
              <Receipt className="h-4 w-4" />
              <span>Transactions</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-medium text-sm transition-all">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-medium text-sm transition-all">
              <PieChart className="h-4 w-4" />
              <span>Budgets</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-medium text-sm transition-all">
              <Target className="h-4 w-4" />
              <span>Goals</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-medium text-sm transition-all">
              <FileText className="h-4 w-4" />
              <span>Reports</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 font-medium text-sm transition-all">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Promo Box */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 p-4">
          <div className="relative z-10">
            <h4 className="text-xs font-semibold text-indigo-300">
              Better Money Habits
            </h4>
            <p className="text-[11px] text-slate-400 mt-1">
              Brighter Future with Automated Insights
            </p>
          </div>
          <Sparkles className="absolute -bottom-2 -right-2 h-16 w-16 text-indigo-500/10" />
        </div>
      </aside>

      {/* ----------------- MAIN CONTENT AREA ----------------- */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header / Search Nav */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Global Search */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search transactions, categories, or anything..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
            />
          </div>

          {/* Quick Actions & User Info */}
          <div className="flex items-center gap-3 shrink-0">
            <button className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full"></span>
            </button>

            <ThemeToggle />

            {googleUser ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
                {googleUser.picture ? (
                  <img
                    src={googleUser.picture}
                    alt={googleUser.name}
                    className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    VD
                  </div>
                )}
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {googleUser.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-left text-[10px] font-medium text-slate-400 hover:text-slate-600"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
                width="180"
              />
            )}
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Greeting Hero Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-amber-500" />
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Good Morning, Varad!
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Here's your financial overview for this month.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/settlements')}
                className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                <HandCoins className="h-3.5 w-3.5" />
                <span>Settlements</span>
              </button>
              <button
                onClick={() => navigate('/insights')}
                className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Insights</span>
              </button>
            </div>
          </div>

          {/* Smart AI Banner */}
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

          <BudgetSection
            budgets={budgets}
            transactions={transactions}
            formatCurrency={formatCurrency}
          />

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* KPI Dashboard Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Primary Hero Income Card */}
            <div
              className={`rounded-2xl p-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md relative overflow-hidden flex flex-col justify-between ${
                isLowBalance ? 'ring-2 ring-rose-500' : ''
              }`}
            >
              <div className="flex items-center justify-between z-10">
                <span className="text-xs font-medium text-slate-400">
                  Total Income
                </span>
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md">
                  <Wallet className="h-4 w-4 text-emerald-400" />
                </div>
              </div>

              <div className="mt-4 z-10">
                {isEditingIncome ? (
                  <input
                    type="number"
                    value={income}
                    onChange={handleIncomeChange}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-lg font-bold text-white focus:outline-none"
                  />
                ) : (
                  <h2 className="text-2xl font-black tracking-tight">
                    {formatCurrency(income)}
                  </h2>
                )}

                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-emerald-400 font-medium inline-flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" /> Verified Balance
                  </span>
                  <button
                    type="button"
                    onClick={toggleIncomeEdit}
                    className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded-md text-[10px] font-semibold transition"
                  >
                    {isEditingIncome ? 'Save' : 'Edit'}
                  </button>
                </div>
              </div>
            </div>

            {/* Total Spent */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  Total Spent
                </span>
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500">
                  <Receipt className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(totalSpent)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Based on {transactions.length} transactions
                </p>
              </div>
            </div>

            {/* Net Balance */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  Net Balance
                </span>
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <p
                  className={`text-2xl font-black ${
                    netBalance < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {formatCurrency(netBalance)}
                </p>
                <p className="text-[11px] text-emerald-600 font-medium mt-1">
                  Positive Cashflow
                </p>
              </div>
            </div>

            {/* Total Transactions */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  Total Transactions
                </span>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500">
                  <BarChart3 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {transactions.length}
                </p>
                <p className="text-[11px] text-indigo-600 font-medium mt-1">
                  Active account status
                </p>
              </div>
            </div>
          </div>

          {/* Date Filter Toolbar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                {[
                  { label: 'USD $', code: 'USD' },
                  { label: 'INR ₹', code: 'INR' },
                  { label: 'EUR €', code: 'EUR' },
                ].map((item) => (
                  <button
                    key={item.code}
                    onClick={() => setSelectedCurrency(item.code)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      selectedCurrency === item.code
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                {['7D', '30D', '90D', '1Y', 'ALL'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDateFilter(filter)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      dateFilter === filter
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {filter === 'ALL' ? 'All Time' : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Filters */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-2.5 py-1.5"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-2.5 py-1.5"
              />
              <button
                onClick={handleCustomDateApply}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Visual Analytics 2-Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Current Month Category Totals
              </h3>
              {isMonthlyTotalsLoading ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                  Loading totals...
                </div>
              ) : (
                <MonthlyCategoryDoughnut data={monthlyCategoryTotals} />
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                Daily Spending Breakdown
              </h3>
              {isDailySpendingLoading ? (
                <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                  Loading trend chart...
                </div>
              ) : (
                <DailySpendingAreaChart
                  data={dailySpendingChartData}
                  title={dailySpendingTitle}
                  formatValue={formatCurrency}
                />
              )}
            </div>
          </div>

          {/* Transactions List Section */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recent Transactions
                </h3>
                <p className="text-xs text-slate-400">
                  Overview of recent spending behavior
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Transaction</span>
                </button>
                <button
                  onClick={() => setIsBudgetModalOpen(true)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl text-xs font-semibold transition-all"
                >
                  Set Budget
                </button>
              </div>
            </div>

            {/* Table View */}
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Loading records...
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No transaction records available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                      <th className="py-3 px-5">Date</th>
                      <th className="py-3 px-5">Description</th>
                      <th className="py-3 px-5">Category</th>
                      <th className="py-3 px-5 text-right">Amount</th>
                      <th className="py-3 px-5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                    {transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition"
                      >
                        <td className="py-3.5 px-5 font-medium text-slate-500">
                          {new Date(tx.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                          {tx.description}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-medium inline-flex items-center gap-1">
                            {getCategoryEmoji(tx.category)} {tx.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => fetchHistory(tx.id)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                              title="Audit History"
                            >
                              <History className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              title="Delete Transaction"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

          {/* Import Tools & Full Detail Components */}
          <div className="space-y-6">
            <CsvImport onImportSuccess={handleImportSuccess} />
          </div>
        </div>
      </main>

      {/* Modal Dialogs */}
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
        <DialogTitle>Set Monthly Budget Goal</DialogTitle>
        <DialogContent dividers>
          <div className="grid grid-cols-1 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={budgetForm.category}
                onChange={handleBudgetInputChange}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monthly Spending Limit
              </label>
              <input
                name="monthlyLimit"
                type="number"
                value={budgetForm.monthlyLimit}
                onChange={handleBudgetInputChange}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs"
                placeholder="Enter limit amount"
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsBudgetModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveBudget}
            variant="contained"
            disabled={isSavingBudget}
          >
            {isSavingBudget ? 'Saving...' : 'Save Goal'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isResetBudgetDialogOpen}
        onClose={() => setIsResetBudgetDialogOpen(false)}
      >
        <DialogTitle>Reset Budget Limits?</DialogTitle>
        <DialogContent>
          <p className="text-xs text-slate-600">
            Are you sure you want to clear all budget thresholds? This operation cannot be undone.
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsResetBudgetDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmResetBudgets}>
            Confirm Reset
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Dashboard;