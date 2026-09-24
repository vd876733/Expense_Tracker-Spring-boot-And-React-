import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getTransactions, getFilteredTransactions, addTransaction, deleteTransaction, getBudgetAnalyses, getBudgetAnalysesByUsername, getAiInsights, resetBudgetsByUser, createBudget, updateBudget, deleteBudget, getCurrentMonthCategoryTotals, getDailySpendingChartData, updateUserIncome, getTransactionHistoryById, getUserCategories, addCategory } from '../services/api';
import { Menu, History, Sparkles, HandCoins, TrendingUp, LayoutDashboard, ArrowRightLeft, PieChart, Wallet, Target, FileText, Settings, Search, Bell, Zap, AlertTriangle, Calendar, Users } from 'lucide-react';
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
import SettlementPage from './SettlementPage';
import BudgetSection from './BudgetSection';
import Login from './Login';
import GoalsPage from './GoalsPage';
const demoData = {
  transactions: [
    { id: 'd1', description: 'Whole Foods Market', amount: 145.20, date: new Date().toISOString(), category: 'Food', type: 'expense' },
    { id: 'd2', description: 'Uber Ride', amount: 24.50, date: new Date(Date.now() - 86400000).toISOString(), category: 'Transportation', type: 'expense' },
    { id: 'd3', description: 'Netflix Subscription', amount: 15.99, date: new Date(Date.now() - 172800000).toISOString(), category: 'Entertainment', type: 'expense' },
    { id: 'd4', description: 'Salary Deposit', amount: 4500.00, date: new Date(Date.now() - 432000000).toISOString(), category: 'Income', type: 'income' }
  ],
  monthlyCategoryTotals: [
    { category: 'Food', total: 145.20 },
    { category: 'Transportation', total: 24.50 },
    { category: 'Entertainment', total: 15.99 }
  ],
  dailySpendingChartData: [
    { date: new Date(Date.now() - 172800000).toISOString().split('T')[0], total: 15.99 },
    { date: new Date(Date.now() - 86400000).toISOString().split('T')[0], total: 24.50 },
    { date: new Date().toISOString().split('T')[0], total: 145.20 }
  ],
  budgets: [
    { id: 'b1', category: 'Food', limitAmount: 500, amountSpent: 145.20, remainingAmount: 354.80, status: 'ON_TRACK' },
    { id: 'b2', category: 'Transportation', limitAmount: 150, amountSpent: 24.50, remainingAmount: 125.50, status: 'ON_TRACK' }
  ],
  settlements: [
    { id: 's1', groupName: 'Roommates', amountOwed: 50, owedTo: 'Alex', status: 'PENDING' },
    { id: 's2', groupName: 'Trip to Hawaii', amountOwed: 250, owedTo: 'Sarah', status: 'SETTLED' }
  ],
  income: 4500
};

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
  const [activeTab, setActiveTab] = useState('dashboard');
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
  const notificationsStorageKey = 'systemNotifications';
  const getInitialNotifications = () => {
    const stored = localStorage.getItem(notificationsStorageKey);
    return stored ? JSON.parse(stored) : [];
  };
  const [notifications, setNotifications] = useState(getInitialNotifications);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [categories, setCategories] = useState([
    { label: 'Food & Dining', value: 'Food' },
    { label: 'Transport', value: 'Transport' },
    { label: 'Entertainment', value: 'Entertainment' },
    { label: 'Utilities', value: 'Utilities' },
    { label: 'Shopping', value: 'Shopping' },
    { label: 'Healthcare', value: 'Healthcare' },
    { label: 'Other', value: 'Other' },
  ]);

  useEffect(() => {
    const fetchCategories = async () => {
      if (isAuthenticated) {
        try {
          const customCategories = await getUserCategories();
          if (customCategories && customCategories.length > 0) {
            setCategories(prev => {
              const existingValues = new Set(prev.map(c => c.value.toLowerCase()));
              const newOptions = customCategories
                .filter(c => !existingValues.has(c.name.toLowerCase()))
                .map(c => ({ label: c.name, value: c.name }));
              return [...prev, ...newOptions];
            });
          }
        } catch (error) {
          console.error('Failed to fetch custom categories:', error);
        }
      }
    };
    fetchCategories();
  }, [isAuthenticated]);

  const addNotification = useCallback(({ title, description, category, type, timestamp }) => {
    setNotifications((prev) => {
      const newNotification = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2),
        title,
        description,
        category,
        type,
        timestamp: timestamp || new Date().toISOString(),
        read: false,
      };
      const updated = [newNotification, ...prev];
      localStorage.setItem(notificationsStorageKey, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(notificationsStorageKey, JSON.stringify(updated));
  };
  const unreadCount = notifications.filter(n => !n.read).length;

  const incomeStorageKey = 'userIncome';
  const getInitialIncome = () => {
    const stored = localStorage.getItem(incomeStorageKey);
    const parsed = Number(stored);
    if (!localStorage.getItem('token') && !Number.isFinite(parsed)) return demoData.income;
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
  const [customBudgetCategory, setCustomBudgetCategory] = useState('');
  const [editingBudget, setEditingBudget] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);

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

  // Removed accessibility fix for modals to prevent Headless UI transitions from freezing the UI
  const handleLogout = useCallback(() => {
    googleLogout();
    
    // Clear user session data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('googleUser');
    localStorage.removeItem('lastSessionToken');

    // Load default mock/demo dataset
    setTransactions(demoData.transactions);
    setMonthlyCategoryTotals(demoData.monthlyCategoryTotals);
    setDailySpendingChartData(demoData.dailySpendingChartData);
    setBudgets(demoData.budgets);
    setBudgetAnalyses(demoData.budgets);
    setIncome(demoData.income);
    setIsEditingIncome(false);
    
    // Reset user data back to default guest profile
    setGoogleUser(null);
    
    // Reset authentication state
    setIsAuthenticated(false);
    
    // Switch view back to main dashboard tab
    setActiveTab('dashboard');
    
    // Trigger success notification for the transition to Guest Demo
    addNotification({
      title: 'Signed Out',
      description: 'You have been switched to the Guest Demo account.',
      category: 'System',
      type: 'info',
      timestamp: new Date().toLocaleString()
    });

    if (onLogout) {
      onLogout();
    }
    
    toast.info("Signed out. Returning to Guest Mode.");
  }, [onLogout, addNotification]);

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
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        return parsedProfile?.email || null;
      }
      const token = localStorage.getItem('token');
      if (token) {
        return getUsernameFromToken(token);
      }
      return null;
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
    if (!isAuthenticated) {
      const guestTx = localStorage.getItem('guest_transactions');
      setTransactions(guestTx ? JSON.parse(guestTx) : demoData.transactions);
      return;
    }

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
      throw err; // Re-throw to be caught by fetchDashboardData
    }
  }, [isAuthenticated]);

  const fetchMonthlyCategoryTotals = useCallback(async () => {
    if (!isAuthenticated) {
      setMonthlyCategoryTotals(demoData.monthlyCategoryTotals);
      return;
    }

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
  }, [isAuthenticated]);

  const fetchDailySpendingChartData = useCallback(async (startDate, endDate) => {
    if (!isAuthenticated) {
      setDailySpendingChartData(demoData.dailySpendingChartData);
      return;
    }

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
  }, [isAuthenticated]);

  const fetchBudgets = useCallback(async () => {
    if (!isAuthenticated) {
      const guestBudgets = localStorage.getItem('guest_budgets');
      const parsedBudgets = guestBudgets ? JSON.parse(guestBudgets) : demoData.budgets;
      setBudgets(parsedBudgets);
      setBudgetAnalyses(parsedBudgets);
      return;
    }

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
    const budgetsData = Number.isFinite(numericUserId) && numericUserId > 0
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
  }, [getUsernameFromToken, userId, isAuthenticated]);

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
      let errorMessage = 'Failed to fetch dashboard data. Make sure the backend is running.';
      
      // Extract detailed error information
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.status) {
        errorMessage = `HTTP Error ${err.status}: ${err.statusText || 'Unknown'}`;
      }
      
      setError(errorMessage);
      console.error('Dashboard error:', {
        fullError: err,
        message: errorMessage,
        status: err?.response?.status,
        data: err?.response?.data,
      });
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

    const token = localStorage.getItem('token');
    const lastSessionToken = localStorage.getItem('lastSessionToken');
    
    if (token && token !== lastSessionToken) {
      addNotification({
        title: 'Successful Login',
        description: `Logged in as ${user?.name || 'Varad Deshmukh'}`,
        category: 'Security / Account',
        timestamp: new Date().toLocaleString(),
        type: 'info'
      });
      localStorage.setItem('lastSessionToken', token);
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
    addNotification,
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

      if (!isAuthenticated) {
        // Guest mode: save locally
        const newTransaction = {
          id: `guest_${Date.now()}`,
          ...transactionData,
          type: transactionData.category === 'Income' ? 'income' : 'expense'
        };
        const guestTx = localStorage.getItem('guest_transactions');
        const currentTxs = guestTx ? JSON.parse(guestTx) : demoData.transactions;
        const updatedTxs = [newTransaction, ...currentTxs];
        localStorage.setItem('guest_transactions', JSON.stringify(updatedTxs));
        setTransactions(updatedTxs);
      } else {
        console.log('Sending to backend:', transactionData);
        await addTransaction(transactionData);
        
        // Handle custom category
        const catValue = transactionData.category.trim();
        const categoryExists = categories.some(c => c.value.toLowerCase() === catValue.toLowerCase());
        if (!categoryExists) {
          try {
            await addCategory(catValue);
            setCategories(prev => [...prev, { label: catValue, value: catValue }]);
          } catch (catError) {
            console.error('Failed to save custom category:', catError);
          }
        }
        
        await fetchTransactions(globalStartDate, globalEndDate);
      }
      
      // Close modal and show success toast
      setIsModalOpen(false);
      const formattedAmount = formatCurrency(parseFloat(formDataToSubmit.amount));
      toast.success(`✓ Transaction added: ${formattedAmount}`);
      
      addNotification({
        title: 'New Transaction Added',
        description: `${transactionData.type === 'expense' ? 'Spent' : 'Received'} ${formattedAmount} on "${transactionData.description}"`,
        category: transactionData.category,
        timestamp: new Date().toLocaleString(),
        type: 'success'
      });

      setError(null);
    } catch (err) {
      toast.error(
        err.response?.data?.message || 
        'Failed to add transaction. Session may have expired.'
      );
      console.error(err);
      throw err;
    } finally {
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const transactionToDelete = transactions.find(t => t.id === id);
      
      if (!isAuthenticated) {
        const guestTx = localStorage.getItem('guest_transactions');
        const currentTxs = guestTx ? JSON.parse(guestTx) : demoData.transactions;
        const updatedTxs = currentTxs.filter(t => t.id !== id);
        localStorage.setItem('guest_transactions', JSON.stringify(updatedTxs));
        setTransactions(updatedTxs);
      } else {
        await deleteTransaction(id);
        await fetchTransactions(globalStartDate, globalEndDate);
      }

      toast.success('✓ Transaction deleted');
      
      if (transactionToDelete) {
        addNotification({
          title: 'Transaction Deleted',
          description: `Removed "${transactionToDelete.description}"`,
          category: transactionToDelete.category || 'System',
          timestamp: new Date().toLocaleString(),
          type: 'info'
        });
      }

      setError(null);
    } catch (err) {
      toast.error('Failed to delete transaction');
      console.error(err);
    }
  };

  const fetchHistory = async (id) => {
    try {
      const transaction = transactions.find((t) => t.id === id);
      const historyData = await getTransactionHistoryById(id);
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
      // Immediately refresh transactions and charts
      await fetchTransactions(globalStartDate, globalEndDate);
      await fetchDashboardData(globalStartDate, globalEndDate);
      await fetchDailySpendingChartData(globalStartDate, globalEndDate);
    }
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setBudgetForm({
      category: budget.categoryName || budget.category?.name || budget.category || 'Food',
      monthlyLimit: budget.monthlyLimit ?? budget.limitAmount ?? budget.amount ?? '',
    });
    setIsBudgetModalOpen(true);
  };

  const handleDeleteBudget = (id) => {
    setBudgetToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteBudget = async () => {
    if (!budgetToDelete) return;

    try {
      if (!isAuthenticated) {
        const guestBudgetsStr = localStorage.getItem('guest_budgets');
        if (guestBudgetsStr) {
          const guestBudgets = JSON.parse(guestBudgetsStr);
          const filtered = guestBudgets.filter(b => b.id !== budgetToDelete);
          localStorage.setItem('guest_budgets', JSON.stringify(filtered));
          setBudgets(filtered);
          setBudgetAnalyses(filtered);
        }
      } else {
        await deleteBudget(budgetToDelete);
        await fetchBudgets();
      }
      toast.success('Budget deleted successfully');
    } catch (err) {
      toast.error('Failed to delete budget');
      console.error(err);
    } finally {
      setIsDeleteDialogOpen(false);
      setBudgetToDelete(null);
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

      let finalCategory = budgetForm.category;
      if (finalCategory === 'Other (Custom)') {
        if (!customBudgetCategory || !customBudgetCategory.trim()) {
          toast.error('Please enter a custom category name');
          setIsSavingBudget(false);
          return;
        }
        finalCategory = customBudgetCategory.trim();
        
        // Handle custom category saving
        const categoryExists = categories.some(c => c.value.toLowerCase() === finalCategory.toLowerCase());
        if (!categoryExists) {
          try {
            await addCategory(finalCategory);
            setCategories(prev => [...prev, { label: finalCategory, value: finalCategory }]);
          } catch (catError) {
            console.error('Failed to save custom category:', catError);
          }
        }
      }

      const payload = {
        category: finalCategory,
        monthlyLimit: parseFloat(budgetForm.monthlyLimit),
      };

      if (!isAuthenticated) {
        const guestBudgetsStr = localStorage.getItem('guest_budgets');
        let guestBudgets = guestBudgetsStr ? JSON.parse(guestBudgetsStr) : demoData.budgets;
        
        if (editingBudget) {
          const existingIdx = guestBudgets.findIndex(b => b.id === editingBudget.id);
          if (existingIdx >= 0) {
             guestBudgets[existingIdx] = { ...guestBudgets[existingIdx], limitAmount: payload.monthlyLimit, category: payload.category, remainingAmount: payload.monthlyLimit - guestBudgets[existingIdx].amountSpent };
          }
        } else {
          const existingIdx = guestBudgets.findIndex(b => b.category === payload.category);
          const newBudget = {
            id: `guest_budget_${Date.now()}`,
            category: payload.category,
            limitAmount: payload.monthlyLimit,
            amountSpent: 0,
            remainingAmount: payload.monthlyLimit,
            status: 'ON_TRACK'
          };
          if (existingIdx >= 0) {
             guestBudgets[existingIdx] = { ...guestBudgets[existingIdx], limitAmount: payload.monthlyLimit, remainingAmount: payload.monthlyLimit - guestBudgets[existingIdx].amountSpent };
          } else {
             guestBudgets.push(newBudget);
          }
        }
        
        localStorage.setItem('guest_budgets', JSON.stringify(guestBudgets));
        setBudgets(guestBudgets);
        setBudgetAnalyses(guestBudgets);
      } else {
        const numericUserId = Number(userId);
        if (Number.isFinite(numericUserId) && numericUserId > 0) {
          payload.userId = numericUserId;
        }
        
        if (editingBudget) {
          await updateBudget(editingBudget.id, payload);
        } else {
          await createBudget(payload);
        }
        await fetchBudgets();
      }

      toast.success('✓ Budget saved successfully');
    } catch (err) {
      toast.error('Failed to save budget');
      console.error(err);
    } finally {
      setIsSavingBudget(false);
      setIsBudgetModalOpen(false);
      setEditingBudget(null);
      setBudgetForm({ category: 'Food', monthlyLimit: '' });
      setCustomBudgetCategory('');
    }
  };

  const handleResetBudgets = () => {
    setIsResetBudgetDialogOpen(true);
  };

  const handleConfirmResetBudgets = async () => {
    try {
      if (!isAuthenticated) {
        localStorage.removeItem('guest_budgets');
        setBudgets([]);
        setBudgetAnalyses([]);
      } else {
        const numericUserId = Number(userId);
        if (!Number.isFinite(numericUserId)) {
          toast.error('Unable to determine the logged-in user');
          return;
        }
        await resetBudgetsByUser(numericUserId);
        setBudgets([]);
        setBudgetAnalyses([]);
      }

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
      const response = await getAiInsights(email);
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
          const updatedUser = await updateUserIncome(email, income);
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

  const formatCurrency = useCallback((amount) => {
    if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
      return 'N/A';
    }
    const numericValue = Number(amount);
    const formattedNumber = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(numericValue));
    const formatted = `₹${formattedNumber}`;
    return numericValue < 0 ? `-${formatted}` : formatted;
  }, []);

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
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-slate-300 p-6 flex flex-col justify-between shrink-0 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          {/* Branding Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-indigo-500 p-2 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Kosh</h1>
              <p className="text-xs text-indigo-300">Your Digital Treasury</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2 mt-4">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
              { id: 'transactions', label: 'Transactions', icon: <ArrowRightLeft size={20} /> },
              { id: 'analytics', label: 'Analytics', icon: <PieChart size={20} /> },
              { id: 'settlements', label: 'Settlements', icon: <Users size={20} /> },
              { id: 'budgets', label: 'Budgets', icon: <Wallet size={20} /> },
              { id: 'goals', label: 'Goals', icon: <Target size={20} /> },
              { id: 'reports', label: 'Reports', icon: <FileText size={20} /> },
              { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white font-semibold shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Promo Widget */}
        <div className="mt-8 bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-2xl border border-slate-700/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={64} />
          </div>
          <div className="relative z-10">
            <h3 className="text-white font-bold mb-1">Pro Tip</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Better Money Habits,<br />Brighter Future.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {/* Demo Mode Banner */}
          {!isAuthenticated && (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl flex items-center justify-between mb-4 shadow-md flex-col sm:flex-row gap-3 text-center sm:text-left sticky top-0 z-20">
              <div>
                <p className="font-bold text-sm">Guest Mode — You can test all features freely. Click Sign In anytime to save data across devices.</p>
              </div>
              <button 
                onClick={() => setShowAuthModal(true)} 
                className="bg-white text-indigo-600 font-semibold px-5 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors whitespace-nowrap shadow-sm"
              >
                Sign In / Register
              </button>
            </div>
          )}

        {/* Top Search & Profile Row */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button 
              className="block md:hidden p-2 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu size={20} />
            </button>
            <div className="relative hidden sm:flex w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input 
                type="text" 
                placeholder="Search transactions, categories, or anything..." 
                className="rounded-full pl-10 pr-4 py-2 text-sm w-full outline-none transition-colors bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div 
                  className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-md transition-all duration-300"
                  onClick={() => setIsNotificationOpen(false)}
                >
                  <div 
                    className="relative w-11/12 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-6 shadow-2xl backdrop-blur-xl max-h-[80vh] flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                      <h3 className="font-bold text-xl">Notifications</h3>
                      <div className="flex items-center gap-4">
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                          >
                            Mark all as read
                          </button>
                        )}
                        <button 
                          onClick={() => setIsNotificationOpen(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-4 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors ${!notif.read ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-2xl mt-1 leading-none">{getCategoryEmoji(notif.category)}</div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start gap-2">
                                <p className={`font-semibold text-sm leading-tight ${!notif.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {notif.title}
                                </p>
                                {!notif.read && (
                                  <span className="h-2.5 w-2.5 bg-indigo-500 rounded-full mt-0.5 flex-shrink-0 shadow-sm shadow-indigo-500/50"></span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                                {notif.description}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium uppercase tracking-wider">
                                {notif.timestamp}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  </div>
                </div>
              )}
            </div>
            <ThemeToggle />
            {/* Guest / Demo Mode Badge */}
            {!isAuthenticated && (
              <div className="hidden sm:flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-medium">
                Guest / Demo Mode
              </div>
            )}

            {/* Prominent Sign In Button */}
            {!isAuthenticated && (
              <button 
                onClick={() => setShowAuthModal(true)} 
                className="hidden sm:block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-md"
              >
                Sign In
              </button>
            )}
            {googleUser || !isAuthenticated ? (
              <div className="flex items-center gap-3 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-1 shadow-sm border border-slate-200 dark:border-slate-700">
                {googleUser?.picture ? (
                  <img
                    src={googleUser.picture}
                    alt={googleUser.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                    {googleUser?.name ? googleUser.name.charAt(0) : 'G'}
                  </div>
                )}
                <div className="flex flex-col pr-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {googleUser?.name || 'Guest User'}
                  </span>
                  {!localStorage.getItem('token') ? (
                    <button
                      type="button"
                      onClick={() => setShowAuthModal(true)}
                      className="text-left text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors leading-tight font-semibold"
                    >
                      Sign In / Register
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="text-left text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors leading-tight"
                      >
                        Sign Out
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAuthenticated(!isAuthenticated)}
                        className="text-left text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors leading-tight mt-1.5"
                      >
                        {!isAuthenticated ? 'Switch to Live Account' : 'Switch to Demo Account'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <GoogleLogin onSuccess={handleGoogleLoginSuccess} onError={handleGoogleLoginError} width="250" />
            )}
          </div>
        </div>

        

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 mb-8">
            {/* Greeting & Action Buttons Row */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Welcome, {googleUser ? googleUser.name.split(' ')[0] : 'Varad'}!
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1 font-medium">
              Here's your financial overview for this month.
            </p>
          </div>
          <div className="flex items-center flex-wrap md:flex-nowrap gap-2">

            <button
              onClick={() => navigate('/settlements')}
              className="flex items-center gap-2 px-5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold transition-all duration-200 shadow-sm"
              title="Group Settlements"
            >
              <HandCoins size={18} className="text-indigo-500" />
              <span>Settlements</span>
            </button>
            <button
              onClick={() => navigate('/insights')}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-sm"
              title="View Financial Insights"
            >
              <TrendingUp size={18} />
              <span>Insights</span>
            </button>
          </div>
        </div>

        {/* SmartInsights Replacement: 5-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
          {/* Top Spending Category */}
          <div className="bg-blue-50 dark:bg-slate-800/80 p-4 rounded-2xl flex flex-col justify-between border border-blue-100 dark:border-slate-700/60">
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-semibold text-blue-700 dark:text-slate-300">Top Spending</span>
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg shadow-sm">
                <Zap size={16} className="text-blue-600 dark:text-blue-300" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-blue-900 dark:text-slate-100 truncate">
                {topCategory ? topCategory.category : 'N/A'}
              </div>
              <div className="text-sm text-blue-600 dark:text-slate-400 mt-1">
                {topCategory ? formatCurrency(topCategory.total) : formatCurrency(0)}
              </div>
            </div>
          </div>

          {/* Spending Alert */}
          <div className="bg-pink-50 dark:bg-slate-800/80 p-4 rounded-2xl flex flex-col justify-between border border-pink-100 dark:border-slate-700/60">
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-semibold text-pink-700 dark:text-slate-300">Spending Alert</span>
              <div className="p-1.5 bg-pink-100 dark:bg-pink-900/50 rounded-lg shadow-sm">
                <AlertTriangle size={16} className="text-pink-600 dark:text-pink-300" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-pink-900 dark:text-slate-100">
                {spendingChange.percentageChange > 0 ? '+' : ''}{spendingChange.percentageChange.toFixed(1)}%
              </div>
              <div className="text-sm text-pink-600 dark:text-slate-400 mt-1">
                vs last month
              </div>
            </div>
          </div>

          {/* Savings Trend */}
          <div className="bg-emerald-50 dark:bg-slate-800/80 p-4 rounded-2xl flex flex-col justify-between border border-emerald-100 dark:border-slate-700/60">
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-semibold text-emerald-700 dark:text-slate-300">Savings Trend</span>
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg shadow-sm">
                <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-300" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-emerald-900 dark:text-slate-100">
                {formatCurrency(income - totalSpent)}
              </div>
              <div className="text-sm text-emerald-600 dark:text-slate-400 mt-1">
                Net savings
              </div>
            </div>
          </div>

          {/* Budget Progress */}
          <div className="bg-purple-50 dark:bg-slate-800/80 p-4 rounded-2xl flex flex-col justify-between border border-purple-100 dark:border-slate-700/60">
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-semibold text-purple-700 dark:text-slate-300">Budget Progress</span>
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg shadow-sm">
                <Target size={16} className="text-purple-600 dark:text-purple-300" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-900 dark:text-slate-100">
                {budgets.length > 0 ? `${((totalSpent / (budgets.reduce((sum, b) => sum + Number(b.monthlyLimit || 0), 0) || 1)) * 100).toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-sm text-purple-600 dark:text-slate-400 mt-1 truncate">
                {budgets.length > 0 ? 'of total limit' : 'No budgets set'}
              </div>
            </div>
          </div>

          {/* Projected Total */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl flex flex-col justify-between border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Projected Total</span>
              <div className="p-1.5 bg-slate-200 dark:bg-slate-700/50 rounded-lg shadow-sm">
                <Calendar size={16} className="text-slate-600 dark:text-slate-300" />
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(new Date().getDate() > 0 ? (totalSpent / new Date().getDate()) * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() : totalSpent)}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Estimated this month
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:border-red-700 dark:bg-red-950 dark:text-red-200">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <Stack spacing={4} sx={{ mb: 4 }}>
          {/* Summary Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Income Card */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-300 font-semibold text-sm tracking-wide uppercase">Total Income</span>
                <button
                  type="button"
                  onClick={toggleIncomeEdit}
                  className="bg-white/10 hover:bg-white/20 transition-colors text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10"
                >
                  {isEditingIncome ? 'Save' : 'Edit Income'}
                </button>
              </div>
              <div>
                {isEditingIncome ? (
                  <input
                    type="number"
                    value={income}
                    onChange={handleIncomeChange}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-xl font-bold text-white focus:outline-none focus:border-blue-400 mb-2"
                    min="0"
                  />
                ) : (
                  <h2 className="text-3xl font-extrabold tracking-tight mb-2 text-white dark:text-white">
                    {formatCurrency(income)}
                  </h2>
                )}
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-md border border-emerald-500/30">
                  <TrendingUp size={14} />
                  <span>+12% from last month</span>
                </div>
              </div>
            </div>

            {/* Total Spent Card */}
            <div className="bg-white dark:bg-slate-800/90 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-sm p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm tracking-wide uppercase">Total Spent</span>
                </div>
                <div className="bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 p-2.5 rounded-full">
                  <HandCoins size={20} />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-1 tracking-tight">
                  {formatCurrency(totalSpent)}
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Based on {transactions.length} transactions
                </p>
              </div>
            </div>

            {/* Net Balance Card */}
            <div className="bg-white dark:bg-slate-800/90 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-sm p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm tracking-wide uppercase">Net Balance</span>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 p-2.5 rounded-full">
                  <Wallet size={20} />
                </div>
              </div>
              <div>
                <h2 className={`text-3xl font-extrabold tracking-tight mb-1 ${netBalance < 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-800 dark:text-slate-100'}`}>
                  {formatCurrency(netBalance)}
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {netBalance < 0 ? 'Warning: Low Balance' : 'Healthy standing'}
                </p>
              </div>
            </div>

            {/* Total Transactions Card */}
            <div className="bg-white dark:bg-slate-800/90 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-sm p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm tracking-wide uppercase">Transactions</span>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400 p-2.5 rounded-full">
                  <PieChart size={20} />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-1 tracking-tight">
                  {transactions.length}
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  +3 new this month
                </p>
              </div>
            </div>
          </div>

          </Stack>
          </div>
        )}



        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div className="space-y-8 mb-8">

          {/* Controls Panel */}
          <div className="mb-8 bg-white dark:bg-slate-800/90 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-2xl p-4 shadow-sm border border-slate-200/60 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 w-full">
            
            {/* Title */}
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Date Range</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Showing {globalLabel.toLowerCase()}</p>
            </div>

            {/* Presets & Custom Date */}
            <div className="flex flex-wrap xl:flex-nowrap items-center gap-4">
              <div className="inline-flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                {[
                  { id: '7D', label: '7 Days' },
                  { id: '30D', label: '30 Days' },
                  { id: '90D', label: '90 Days' },
                  { id: '1Y', label: '1 Year' },
                  { id: 'ALL', label: 'All Time' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setDateFilter(preset.id)}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      dateFilter === preset.id
                        ? 'bg-slate-900 text-white shadow-md dark:bg-blue-600'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(event) => setCustomStartDate(event.target.value)}
                  className="h-9 rounded-lg px-2 text-sm font-medium outline-none transition-colors bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-400 font-bold px-1">-</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(event) => setCustomEndDate(event.target.value)}
                  className="h-9 rounded-lg px-2 text-sm font-medium outline-none transition-colors bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleCustomDateApply}
                  className="h-9 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm ml-1"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          

        
            {/* Filter Section */}
        <div className="card bg-white dark:bg-slate-800/90 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 mb-8  ">
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
                className="w-full rounded-lg px-4 py-2 outline-none transition-colors bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
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
                className="w-full rounded-lg px-4 py-2 outline-none transition-colors bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
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
                className="w-full rounded-lg px-4 py-2 outline-none transition-colors bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
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
            
            {/* CSV Import Section */}
        <div className="mb-8">
          <CsvImport onImportSuccess={handleImportSuccess} />
        </div>
            
            <div className="grid grid-cols-1 gap-8">
          {/* Transactions Table */}
          <div className="lg:col-span-2">
            <div className="card bg-white dark:bg-slate-800/90 dark:border-slate-700/60 text-slate-900 dark:text-slate-100  ">
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
                <div className="overflow-x-auto w-full">
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

        {/* Recent Activity Timeline */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }} className="dark:bg-slate-800 dark:text-white rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700">
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

          </div>
        )}



        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 mb-8">
{/* Controls Panel */}
          <div className="mb-8 bg-white dark:bg-slate-800/90 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 rounded-2xl p-4 shadow-sm border border-slate-200/60 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 w-full">
            
            {/* Title */}
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Date Range</h2>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Showing {globalLabel.toLowerCase()}</p>
            </div>

            {/* Presets & Custom Date */}
            <div className="flex flex-wrap xl:flex-nowrap items-center gap-4">
              <div className="inline-flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                {[
                  { id: '7D', label: '7 Days' },
                  { id: '30D', label: '30 Days' },
                  { id: '90D', label: '90 Days' },
                  { id: '1Y', label: '1 Year' },
                  { id: 'ALL', label: 'All Time' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setDateFilter(preset.id)}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                      dateFilter === preset.id
                        ? 'bg-slate-900 text-white shadow-md dark:bg-blue-600'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(event) => setCustomStartDate(event.target.value)}
                  className="h-9 rounded-lg px-2 text-sm font-medium outline-none transition-colors bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-400 font-bold px-1">-</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(event) => setCustomEndDate(event.target.value)}
                  className="h-9 rounded-lg px-2 text-sm font-medium outline-none transition-colors bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleCustomDateApply}
                  className="h-9 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm ml-1"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          

        
            

            <Stack spacing={4} sx={{ mb: 4 }}>
              {/* Expense Chart Section (Category Tools & Spending Breakdown) */}
              <div className="w-full">
                <ExpenseChart transactions={transactions} formatCurrency={formatCurrency} />
              </div>

              {/* Daily Spending */}
              {isDailySpendingLoading ? (
            <div className="card bg-white dark:bg-slate-800/90 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 flex items-center justify-center h-60  ">
              <p className="text-gray-500 dark:text-gray-300">Loading daily spending...</p>
            </div>
          ) : (
            <div className="card bg-white dark:bg-slate-800/90 dark:border-slate-700/60 text-slate-900 dark:text-slate-100  ">
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

              {/* Monthly Category Totals */}
              {isMonthlyTotalsLoading ? (
            <div className="card bg-white dark:bg-slate-800/90 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 flex items-center justify-center h-60  ">
              <p className="text-gray-500 dark:text-gray-300">Loading monthly category totals...</p>
            </div>
          ) : (
            <MonthlyCategoryDoughnut data={monthlyCategoryTotals} />
          )}
            </Stack>

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

            </div>
          )}

        {/* SETTLEMENTS TAB */}
        {activeTab === 'settlements' && (
          <SettlementPage />
        )}

        {/* BUDGETS TAB */}
        {activeTab === 'budgets' && (
          <div className="w-full">
            <div className="flex justify-between items-center mb-6 px-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Budgets</h2>
              <button
                onClick={() => {
                  setEditingBudget(null);
                  setBudgetForm({ category: 'Food', monthlyLimit: '' });
                  setIsBudgetModalOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm font-semibold flex items-center gap-2"
              >
                Set New Budget
              </button>
            </div>
            <BudgetSection 
              budgets={budgets} 
              transactions={transactions} 
              formatCurrency={formatCurrency} 
              onEditBudget={handleEditBudget}
              onDeleteBudget={handleDeleteBudget}
            />
          </div>
        )}

        {/* GOALS TAB */}
        {activeTab === 'goals' && (
          <GoalsPage transactions={transactions} />
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="bg-white dark:bg-slate-800/90 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 p-8 rounded-2xl shadow-sm text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reports</h2>
            <p className="text-gray-500 dark:text-gray-400">Detailed financial reports coming soon.</p>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-slate-800/90 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 p-8 rounded-2xl shadow-sm text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Settings</h2>
            <p className="text-gray-500 dark:text-gray-400">Account settings coming soon.</p>
          </div>
        )}

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
          PaperProps={{ className: 'w-11/12 max-w-lg mx-auto p-4 sm:p-6 rounded-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-2xl' }}
          BackdropProps={{ className: 'bg-black/60 backdrop-blur-sm' }}
        >
          <DialogTitle className="text-slate-900 dark:text-slate-100 font-bold">{editingBudget ? 'Edit Monthly Budget' : 'Set Monthly Budget'}</DialogTitle>
          <DialogContent dividers>
            <div className="grid grid-cols-1 gap-4 pt-1">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2 dark:text-slate-300">Category</label>
                <select
                  name="category"
                  value={budgetForm.category}
                  onChange={handleBudgetInputChange}
                  className="w-full rounded-lg px-4 py-2 outline-none transition-colors bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                  {!categories.some(cat => cat.value === 'Other (Custom)') && (
                    <option value="Other (Custom)">Other (Custom)</option>
                  )}
                </select>
              </div>
              
              {budgetForm.category === 'Other (Custom)' && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2 dark:text-slate-300">Custom Category Name</label>
                  <input
                    type="text"
                    value={customBudgetCategory}
                    onChange={(e) => setCustomBudgetCategory(e.target.value)}
                    className="w-full rounded-lg px-4 py-2 outline-none transition-colors bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Gaming"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2 dark:text-slate-300">Amount</label>
                <input
                  name="monthlyLimit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={budgetForm.monthlyLimit}
                  onChange={handleBudgetInputChange}
                  className="w-full rounded-lg px-4 py-2 outline-none transition-colors bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                />
              </div>
            </div>
          </DialogContent>
          <DialogActions className="px-6 pb-6 pt-2">
            <button type="button" onClick={() => setIsBudgetModalOpen(false)} className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">Cancel</button>
            <button type="button" onClick={handleSaveBudget} disabled={isSavingBudget} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl text-sm shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isSavingBudget ? 'Saving...' : 'Save Budget'}
            </button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={isResetBudgetDialogOpen}
          onClose={() => setIsResetBudgetDialogOpen(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>Reset All Budgets</DialogTitle>
          <DialogContent>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              This will remove all your budget goals. This action cannot be undone.
            </p>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsResetBudgetDialogOpen(false)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={handleConfirmResetBudgets}>Reset All</Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          fullWidth
          maxWidth="xs"
          PaperProps={{ className: 'w-11/12 max-w-sm mx-auto p-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-2xl' }}
          BackdropProps={{ className: 'bg-black/60 backdrop-blur-sm' }}
        >
          <DialogTitle className="text-slate-900 dark:text-slate-100 font-bold">Delete Budget</DialogTitle>
          <DialogContent>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Are you sure you want to delete this budget? This action cannot be undone.
            </p>
          </DialogContent>
          <DialogActions className="px-6 pb-6 pt-2">
            <button type="button" onClick={() => setIsDeleteDialogOpen(false)} className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors">Cancel</button>
            <button type="button" onClick={confirmDeleteBudget} className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-5 py-2 rounded-xl text-sm shadow-md transition-colors">Delete</button>
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

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/70 backdrop-blur-md transition-colors duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAuthModal(false);
          }}
        >
          <Login 
            isModal={true} 
            onLoginSuccess={() => {
              setShowAuthModal(false);
              setIsAuthenticated(true);
              const storedGoogleUser = localStorage.getItem('googleUser');
              if (storedGoogleUser) {
                try {
                  setGoogleUser(JSON.parse(storedGoogleUser));
                } catch (e) {
                  console.error('Failed to parse googleUser:', e);
                }
              }
            }}
            onClose={() => setShowAuthModal(false)}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
