import apiInterceptor from '../utils/apiInterceptor';

// API client using interceptor for authentication
const apiClient = apiInterceptor;

const API_ROUTES = {
  transactions: '/transactions',
  transactionById: (id) => `/transactions/${id}`,
  transactionHistoryById: (id) => `/transactions/${id}/history`,
  transactionsTotal: '/transactions/summary/total',
  transactionsByCategory: (category) => `/transactions/summary/category/${category}`,
  transactionsByCategoryCurrentMonth: '/transactions/summary/category/current-month',
  incomeExpenseLastSixMonths: '/transactions/summary/income-expense/last-6-months',
  incomeExpenseChart: '/transactions/charts/income-expenses',
  dailySpendingLastThirtyDays: '/transactions/summary/spending/daily-last-30-days',
  dailySpendingChart: '/transactions/charts/daily-spending',
  budgets: '/budgets',
  budgetsByUser: (userId) => `/budgets/user/${userId}`,
  budgetsAnalysis: (userId) => `/budgets/analysis?userId=${encodeURIComponent(userId)}`,
  importCsv: '/import/transactions/csv',
  importTemplate: '/import/transactions/csv-template',
  importInstructions: '/import/transactions/csv-instructions',
  aiInsights: '/ai/insights',
  aiInsightsByUser: (userId) => `/ai/insights/user/${userId}`,
  settlements: '/settlements',
  settleDebt: (debtId) => `/settlements/${debtId}/settle`,
  updateIncome: '/users/income',
};

/**
 * Fetch transactions with optional filters
 * @param {Object} filters - Filter options
 * @param {number} filters.month - Optional month (1-12)
 * @param {number} filters.year - Optional year
 * @param {string} filters.category - Optional category name
 * @param {string} filters.startDate - Optional start date (YYYY-MM-DD format)
 * @param {string} filters.endDate - Optional end date (YYYY-MM-DD format)
 * @param {string} filters.email - User email for scoping results
 * @returns {Promise<Array>} Filtered array of transactions
 */
export const getFilteredTransactions = async (filters = {}, options = {}) => {
  try {
    const params = new URLSearchParams();

    if (filters.month !== undefined && filters.month !== null) {
      params.append('month', filters.month);
    }
    if (filters.year !== undefined && filters.year !== null) {
      params.append('year', filters.year);
    }
    if (filters.category && filters.category !== '') {
      params.append('category', filters.category);
    }
    if (filters.startDate && filters.startDate !== '') {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate && filters.endDate !== '') {
      params.append('endDate', filters.endDate);
    }
    if (filters.email && filters.email !== '') {
      params.append('email', filters.email);
    }

    const queryString = params.toString();
    const url = queryString ? `${API_ROUTES.transactions}?${queryString}` : API_ROUTES.transactions;

    const response = await apiClient.get(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching filtered transactions:', error);
    throw error;
  }
};

/**
 * Fetch all transactions
 * @returns {Promise<Array>} Array of transactions
 */
export const getTransactions = async (email, options = {}) => {
  try {
    const params = new URLSearchParams();
    if (email) {
      params.append('email', email);
    }
    const url = params.toString()
      ? `${API_ROUTES.transactions}?${params.toString()}`
      : API_ROUTES.transactions;
    const response = await apiClient.get(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

/**
 * Mark a settlement debt as paid
 * @param {string|number} debtId - Debt identifier
 * @returns {Promise<Object>} Settlement response
 */
export const settleDebt = async (debtId, options = {}) => {
  try {
    const response = await apiClient.post(API_ROUTES.settleDebt(debtId), {}, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error settling debt:', error);
    throw error;
  }
};

/**
 * Fetch a specific transaction by ID
 * @param {number} id - Transaction ID
 * @returns {Promise<Object>} Transaction object
 */
export const getTransactionById = async (id, options = {}) => {
  try {
    const response = await apiClient.get(API_ROUTES.transactionById(id), options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching transaction ${id}:`, error);
    throw error;
  }
};

/**
 * Fetch a specific transaction history by ID
 * @param {number} id - Transaction ID
 * @returns {Promise<Array>} Transaction audit history
 */
export const getTransactionHistoryById = async (id, options = {}) => {
  try {
    const response = await apiClient.get(API_ROUTES.transactionHistoryById(id), options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching transaction history ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new transaction
 * @param {Object} data - Transaction data
 * @param {string} data.description - Transaction description
 * @param {number} data.amount - Transaction amount
 * @param {string} data.date - Transaction date (YYYY-MM-DD format)
 * @param {string} data.category - Transaction category
 * @returns {Promise<Object>} Created transaction object
 */
export const addTransaction = async (data, options = {}) => {
  try {
    const response = await apiClient.post(API_ROUTES.transactions, data, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

/**
 * Update an existing transaction
 * @param {number} id - Transaction ID
 * @param {Object} data - Updated transaction data
 * @returns {Promise<Object>} Updated transaction object
 */
export const updateTransaction = async (id, data, options = {}) => {
  try {
    const response = await apiClient.put(API_ROUTES.transactionById(id), data, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error updating transaction ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a transaction
 * @param {number} id - Transaction ID
 * @returns {Promise<void>}
 */
export const deleteTransaction = async (id, options = {}) => {
  try {
    const response = await apiClient.delete(API_ROUTES.transactionById(id), options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error deleting transaction ${id}:`, error);
    throw error;
  }
};

/**
 * Get total sum of all transactions
 * @returns {Promise<number>} Total sum
 */
export const getTotalSum = async (options = {}) => {
  try {
    const response = await apiClient.get(API_ROUTES.transactionsTotal, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching total sum:', error);
    throw error;
  }
};

/**
 * Get total sum by category
 * @param {string} category - Category name
 * @returns {Promise<number>} Total sum for the category
 */
export const getTotalSumByCategory = async (category, options = {}) => {
  try {
    const response = await apiClient.get(API_ROUTES.transactionsByCategory(category), options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching sum for category ${category}:`, error);
    throw error;
  }
};

/**
 * Get total amount by category for the current month
 * @returns {Promise<Array>} Array of category totals
 */
export const getCurrentMonthCategoryTotals = async (email, options = {}) => {
  try {
    const params = new URLSearchParams();
    if (email) {
      params.append('email', email);
    }
    const url = params.toString()
      ? `${API_ROUTES.transactionsByCategoryCurrentMonth}?${params.toString()}`
      : API_ROUTES.transactionsByCategoryCurrentMonth;
    const response = await apiClient.get(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching current month category totals:', error);
    throw error;
  }
};

/**
 * Get income vs expenses grouped by month for the last 6 months
 * @returns {Promise<Array>} Array of monthly totals
 */
export const getIncomeExpenseLastSixMonths = async (email, options = {}) => {
  try {
    const params = new URLSearchParams();
    if (email) {
      params.append('email', email);
    }
    const url = params.toString()
      ? `${API_ROUTES.incomeExpenseLastSixMonths}?${params.toString()}`
      : API_ROUTES.incomeExpenseLastSixMonths;
    const response = await apiClient.get(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching income/expense totals:', error);
    throw error;
  }
};

/**
 * Fetch chart data for income vs expenses (last 6 months)
 * @returns {Promise<Array>} Array of monthly totals
 */
export const getIncomeExpenseChartData = async (startDate, endDate, email, options = {}) => {
  try {
    const params = new URLSearchParams();
    if (startDate) {
      params.append('startDate', startDate);
    }
    if (endDate) {
      params.append('endDate', endDate);
    }
    if (email) {
      params.append('email', email);
    }
    const queryString = params.toString();
    const url = queryString
      ? `${API_ROUTES.incomeExpenseChart}?${queryString}`
      : API_ROUTES.incomeExpenseChart;

    const response = await apiClient.get(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching income/expense chart data:', error);
    throw error;
  }
};

/**
 * Get daily spending totals for the last 30 days
 * @returns {Promise<Array>} Array of daily totals
 */
export const getDailySpendingLastThirtyDays = async (email, options = {}) => {
  try {
    const params = new URLSearchParams();
    if (email) {
      params.append('email', email);
    }
    const url = params.toString()
      ? `${API_ROUTES.dailySpendingLastThirtyDays}?${params.toString()}`
      : API_ROUTES.dailySpendingLastThirtyDays;
    const response = await apiClient.get(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching daily spending totals:', error);
    throw error;
  }
};

/**
 * Fetch chart data for daily spending (last 30 days)
 * @returns {Promise<Array>} Array of daily totals
 */
export const getDailySpendingChartData = async (startDate, endDate, email, options = {}) => {
  try {
    const params = new URLSearchParams();
    if (startDate) {
      params.append('startDate', startDate);
    }
    if (endDate) {
      params.append('endDate', endDate);
    }
    if (email) {
      params.append('email', email);
    }
    const queryString = params.toString();
    const url = queryString
      ? `${API_ROUTES.dailySpendingChart}?${queryString}`
      : API_ROUTES.dailySpendingChart;

    const response = await apiClient.get(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching daily spending chart data:', error);
    throw error;
  }
};

/**
 * Fetch budget analyses for a user
 * @param {string} userId - User ID for budget analysis
 * @returns {Promise<Array>} List of budget analysis objects
 */
export const getBudgetAnalyses = async (userId, options = {}) => {
  try {
    const response = await apiClient.get(API_ROUTES.budgetsByUser(userId), options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching budget analyses:', error);
    throw error;
  }
};

/**
 * Fetch budget analyses for a user by username
 * @param {string} userId - Username for budget analysis
 * @returns {Promise<Array>} List of budget analysis objects
 */
export const getBudgetAnalysesByUsername = async (userId, options = {}) => {
  try {
    const response = await apiClient.get(API_ROUTES.budgetsAnalysis(userId), options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching budget analyses by username:', error);
    throw error;
  }
};

/**
 * Create a new budget
 * @param {Object} data - Budget payload
 * @param {string} data.category - Budget category
 * @param {number} data.monthlyLimit - Monthly limit amount
 * @param {string} data.userId - User ID
 * @returns {Promise<Object>} Created budget object
 */
export const createBudget = async (data, options = {}) => {
  try {
    const response = await apiClient.post(API_ROUTES.budgets, data, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating budget:', error);
    throw error;
  }
};

/**
 * Reset all budgets for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const resetBudgetsByUser = async (userId, options = {}) => {
  try {
    const response = await apiClient.delete(API_ROUTES.budgetsByUser(userId), options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error resetting budgets:', error);
    throw error;
  }
};

/**
 * Import transactions from CSV file
 * @param {File} file - The CSV file to import
 * @returns {Promise<Object>} Import result with summary of successes/failures
 */
export const importTransactionsFromCsv = async (file) => {
  try {
    const response = await apiClient.upload(API_ROUTES.importCsv, file);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error importing transactions from CSV:', error);
    throw error;
  }
};

/**
 * Get CSV template file
 * @returns {Promise<Blob>} CSV file blob
 */
export const downloadCsvTemplate = async () => {
  try {
    const response = await apiClient.get(API_ROUTES.importTemplate);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response; // Return the response object for blob handling
  } catch (error) {
    console.error('Error downloading CSV template:', error);
    throw error;
  }
};

/**
 * Get CSV import instructions
 * @returns {Promise<Object>} CSV import instructions and requirements
 */
export const getCsvImportInstructions = async () => {
  try {
    const response = await apiClient.get(API_ROUTES.importInstructions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching CSV instructions:', error);
    throw error;
  }
};

/**
 * Fetch AI-driven financial insights
 * @param {string|number} userId - Optional user ID for user-specific insights
 * @returns {Promise<Object>} Insights payload
 */
export const getAiInsights = async (email, options = {}) => {
  try {
    const params = new URLSearchParams();
    if (email) {
      params.append('email', email);
    }
    const route = params.toString()
      ? `${API_ROUTES.aiInsights}?${params.toString()}`
      : API_ROUTES.aiInsights;
    const response = await apiClient.get(route, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching AI insights:', error);
    throw error;
  }
};

/**
 * Update the stored total income for a user
 * @param {string} email - User email
 * @param {number} totalIncome - Updated income
 * @returns {Promise<Object>} Updated user
 */
export const updateUserIncome = async (email, totalIncome, options = {}) => {
  try {
    const response = await apiClient.put(API_ROUTES.updateIncome, { email, totalIncome }, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating user income:', error);
    throw error;
  }
};
