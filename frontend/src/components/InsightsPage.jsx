import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, TrendingUp, Target } from 'lucide-react';
import {
  getSavingsGoals,
  getAiCoachInsights,
  getTransactions,
  sendGroupReminderForGroup,
  acceptGroupInvite,
  getGroupsByStatus,
  getPendingGroupInvites,
} from '../services/api';
import { toast } from 'react-toastify';
import CategorySpendingDonut from './CategorySpendingDonut';
import '../styles/InsightsPage.css';

const InsightsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [emailInputs, setEmailInputs] = useState(['', '', '']);
  const [groups, setGroups] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('selectedGroupId') || '';
  });
  const [groupExpenses, setGroupExpenses] = useState({});
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    date: '',
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
    fetchGroupData();
  }, []);
  const fetchGroupData = async () => {
    try {
      const [acceptedGroups, invites] = await Promise.all([
        getGroupsByStatus('ACCEPTED'),
        getPendingGroupInvites(),
      ]);

      setGroups(Array.isArray(acceptedGroups) ? acceptedGroups : []);
      setPendingInvites(Array.isArray(invites) ? invites : []);

      if (acceptedGroups?.length) {
        const storedId = typeof window === 'undefined'
          ? ''
          : localStorage.getItem('selectedGroupId');
        const match = acceptedGroups.find((group) => String(group.id) === String(storedId));
        if (!match) {
          localStorage.removeItem('selectedGroupId');
          setActiveGroupId('');
        }
      }
    } catch (err) {
      console.error('Error fetching group data:', err);
      toast.error('Failed to load groups and invites.');
    }
  };
  const handleGroupSelect = (value) => {
    setActiveGroupId(value);
    if (typeof window !== 'undefined') {
      if (value) {
        localStorage.setItem('selectedGroupId', value);
      } else {
        localStorage.removeItem('selectedGroupId');
      }
    }
  };

  useEffect(() => {
    const groupId = searchParams.get('groupId');
    const action = searchParams.get('action');

    if (groupId && action === 'accept') {
      acceptGroupInvite(groupId)
        .then(() => {
          toast.success('You have joined the group successfully!');
          setSearchParams({});
        })
        .catch(() => {
          toast.error('Failed to accept the group invite.');
        });
    }
  }, [searchParams, setSearchParams]);

  /**
   * Fetch savings goals and AI insights simultaneously
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both endpoints in parallel
      const [goalsResponse, insightsResponse, transactionsResponse] = await Promise.all([
        getSavingsGoals(),
        getAiCoachInsights(),
        getTransactions(),
      ]);

      // Set state with fetched data
      setSavingsGoals(Array.isArray(goalsResponse) ? goalsResponse : []);
      setAiInsights(insightsResponse?.insights || '');
      setTransactions(Array.isArray(transactionsResponse) ? transactionsResponse : []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load insights and goals');
      toast.error('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh data with loading indicator
   */
  const handleRefreshInsights = async () => {
    try {
      setRefreshing(true);
      const insightsResponse = await getAiCoachInsights();
      setAiInsights(insightsResponse?.insights || '');
      toast.success('Insights refreshed!');
    } catch (err) {
      console.error('Error refreshing insights:', err);
      toast.error('Failed to refresh insights');
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Calculate progress percentage
   */
  const calculateProgress = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const calculateSettlements = (members, expenses) => {
    if (!members?.length || !expenses?.length) return [];

    const totals = new Map();
    members.forEach((member) => totals.set(member.id, 0));

    let totalSpent = 0;
    expenses.forEach((expense) => {
      const payerId = expense?.payer?.id;
      const amount = Number(expense?.totalAmount) || 0;
      totalSpent += amount;
      if (payerId && totals.has(payerId)) {
        totals.set(payerId, totals.get(payerId) + amount);
      }
    });

    const share = totalSpent / members.length;
    const balances = members.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      net: (totals.get(member.id) || 0) - share,
    }));

    const creditors = balances
      .filter((b) => b.net > 0.01)
      .map((b) => ({ ...b }))
      .sort((a, b) => b.net - a.net);
    const debtors = balances
      .filter((b) => b.net < -0.01)
      .map((b) => ({ ...b, net: Math.abs(b.net) }))
      .sort((a, b) => b.net - a.net);

    const settlements = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.net, creditor.net);

      if (amount > 0.01) {
        settlements.push({
          debtorName: debtor.name,
          debtorEmail: debtor.email,
          creditorName: creditor.name,
          amount,
        });
      }

      debtor.net -= amount;
      creditor.net -= amount;

      if (debtor.net <= 0.01) i += 1;
      if (creditor.net <= 0.01) j += 1;
    }

    return settlements;
  };

  const handleEmailChange = (index, value) => {
    setEmailInputs((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addEmailInput = () => {
    setEmailInputs((prev) => [...prev, '']);
  };

  const createGroupLocal = () => {
    const cleaned = emailInputs
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    const uniqueEmails = Array.from(new Set(cleaned));

    if (!groupName.trim()) {
      toast.error('Group name is required.');
      return;
    }
    if (uniqueEmails.length < 3) {
      toast.error('Please add at least 3 unique emails.');
      return;
    }

    const members = uniqueEmails.map((email, index) => ({
      id: `${email}-${index}`,
      name: email.split('@')[0] || email,
      email,
    }));

    const newGroup = {
      id: `group-${Date.now()}`,
      name: groupName.trim(),
      members,
    };

    setGroups((prev) => [newGroup, ...prev]);
    setActiveGroupId(newGroup.id);
    setGroupName('');
    setEmailInputs(['', '', '']);
    setGroupExpenses((prev) => ({ ...prev, [newGroup.id]: [] }));
    toast.success('Group created locally. Wire this to /api/groups when ready.');
  };

  const activeGroup = groups.find((group) => group.id === activeGroupId);
  const activeExpenses = activeGroup ? groupExpenses[activeGroup.id] || [] : [];
  const settlementLines = activeGroup
    ? calculateSettlements(activeGroup.members, activeExpenses)
    : [];

  const handleSendReminder = async (settlement) => {
    try {
      if (!activeGroup?.id) {
        toast.error('Select a group before sending reminders.');
        return;
      }
      await sendGroupReminderForGroup(activeGroup.id, {
        debtorEmail: settlement.debtorEmail,
        creditorName: settlement.creditorName,
        amountOwed: settlement.amount,
      });
      toast.success(`Reminder sent to ${settlement.debtorName}`);
    } catch (err) {
      console.error('Error sending reminder:', err);
      toast.error('Failed to send reminder.');
    }
  };

  const openExpenseModal = () => {
    setExpenseForm({ description: '', amount: '', date: '' });
    setShowExpenseModal(true);
  };

  const closeExpenseModal = () => {
    setShowExpenseModal(false);
  };

  const handleExpenseChange = (field, value) => {
    setExpenseForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveExpenseLocal = () => {
    if (!activeGroup) {
      toast.error('Select a group first.');
      return;
    }
    if (!expenseForm.description.trim()) {
      toast.error('Description is required.');
      return;
    }
    const amountNumber = Number(expenseForm.amount);
    if (!amountNumber || amountNumber <= 0) {
      toast.error('Amount must be greater than 0.');
      return;
    }

    const newExpense = {
      id: `expense-${Date.now()}`,
      description: expenseForm.description.trim(),
      totalAmount: amountNumber,
      date: expenseForm.date || new Date().toISOString().split('T')[0],
      payer: {
        id: 'current-user',
        name: 'You',
      },
    };

    setGroupExpenses((prev) => ({
      ...prev,
      [activeGroup.id]: [newExpense, ...(prev[activeGroup.id] || [])],
    }));
    closeExpenseModal();
    toast.success('Expense added locally.');
  };

  return (
    <div className="insights-page">
      {/* Header with Back Button */}
      <div className="insights-header">
        <button
          onClick={handleBackToDashboard}
          className="back-button"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        <h1 className="page-title">Financial Insights</h1>
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={fetchData} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your insights and goals...</p>
        </div>
      ) : (
        <>
          {/* Three-Column Grid Layout with Charts and Goals */}
          <div className="insights-grid-three-column">
            {/* AI Coach Insights Box */}
            <div className="insight-card ai-coach">
              <div className="card-header">
                <h2>🤖 AI Coach Insights</h2>
                <button
                  onClick={handleRefreshInsights}
                  className="refresh-icon-button"
                  disabled={refreshing}
                  title="Refresh insights"
                >
                  <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
                </button>
              </div>
              <div className="card-body">
                {refreshing ? (
                  <div className="loading-text">
                    <div className="small-spinner"></div>
                    <p>Generating insights...</p>
                  </div>
                ) : aiInsights ? (
                  <div className="ai-insights-content">
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                      {aiInsights}
                    </p>
                  </div>
                ) : (
                  <div className="placeholder">
                    <p className="placeholder-text">
                      No insights available yet. Add some transactions to get started!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Category Spending Donut Chart */}
            <CategorySpendingDonut 
              transactions={transactions} 
              title="Spending by Category"
            />

            {/* Savings Goals Box */}
            <div className="insight-card savings-goals">
              <div className="card-header">
                <h2>🎯 Savings Goals</h2>
              </div>
              <div className="card-body">
                {savingsGoals.length > 0 ? (
                  <div className="goals-list">
                    {savingsGoals.map((goal) => {
                      const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
                      const isAchieved = goal.currentAmount >= goal.targetAmount;

                      return (
                        <div key={goal.id} className="goal-item">
                          <div className="goal-header">
                            <span className="goal-name">
                              {isAchieved ? '✅' : '🎯'} {goal.goalName}
                            </span>
                            <span className="goal-deadline">
                              {new Date(goal.deadline).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${progress}%`,
                                background: isAchieved
                                  ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                                  : 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)',
                              }}
                            ></div>
                          </div>
                          <div className="goal-amount">
                            <span className="current">
                              {formatCurrency(goal.currentAmount)}
                            </span>
                            <span className="divider">of</span>
                            <span className="target">
                              {formatCurrency(goal.targetAmount)}
                            </span>
                            <span className="percentage">({progress.toFixed(0)}%)</span>
                          </div>
                          {goal.currentAmount < goal.targetAmount && (
                            <div className="remaining">
                              <TrendingUp size={14} />
                              <span>
                                {formatCurrency(
                                  Math.max(0, goal.targetAmount - goal.currentAmount)
                                )}{' '}
                                remaining
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="placeholder">
                    <p className="placeholder-text">
                      No savings goals yet. Create one to start tracking your financial targets!
                    </p>
                    <div className="empty-state-icon">
                      <Target size={48} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Group Expense Splitter */}
          <section className="group-splitter">
            <div className="group-splitter-header">
              <div>
                <h2>Group Expense Splitter</h2>
                <p>Plan shared spends, track who paid, and settle up in seconds.</p>
              </div>
            </div>

            <div className="group-splitter-grid">
              <div className="splitter-card">
                <h3>Create Group</h3>
                <label className="splitter-label" htmlFor="groupName">
                  Group name
                </label>
                <input
                  id="groupName"
                  type="text"
                  className="splitter-input"
                  placeholder="Weekend trip"
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                />

                <div className="splitter-emails">
                  <div className="splitter-label-row">
                    <span className="splitter-label">Member emails</span>
                    <button type="button" className="splitter-link" onClick={addEmailInput}>
                      + Add email
                    </button>
                  </div>
                  {emailInputs.map((email, index) => (
                    <input
                      key={`email-${index}`}
                      type="email"
                      className="splitter-input"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(event) => handleEmailChange(index, event.target.value)}
                    />
                  ))}
                </div>

                <button type="button" className="splitter-primary" onClick={createGroupLocal}>
                  Create Group
                </button>
              </div>

              <div className="splitter-card">
                <h3>Active Group</h3>
                <label className="splitter-label" htmlFor="activeGroup">
                  Select group
                </label>
                <select
                  id="activeGroup"
                  className="splitter-select"
                  value={activeGroupId}
                  onChange={(event) => handleGroupSelect(event.target.value)}
                >
                  <option value="">Choose a group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>

                {activeGroup ? (
                  <div className="group-details">
                    <div className="group-actions">
                      <button type="button" className="splitter-secondary" onClick={openExpenseModal}>
                        Add Expense
                      </button>
                    </div>
                    <div className="group-members">
                      <h4>Members</h4>
                      <div className="member-chips">
                        {activeGroup.members.map((member) => (
                          <span key={member.id} className="member-chip">
                            {member.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="group-expenses">
                      <h4>Expenses</h4>
                      {activeExpenses.length === 0 ? (
                        <div className="empty-expenses">
                          No expenses logged yet.
                        </div>
                      ) : (
                        <ul className="expense-list">
                          {activeExpenses.map((expense) => (
                            <li key={expense.id} className="expense-item">
                              <div>
                                <span className="expense-title">{expense.description}</span>
                                <span className="expense-meta">Paid by {expense.payer.name}</span>
                              </div>
                              <span className="expense-amount">
                                {formatINR(expense.totalAmount)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="group-settlements">
                      <h4>Settle Up</h4>
                      {settlementLines.length === 0 ? (
                        <div className="empty-expenses">
                          Add expenses to see who owes whom.
                        </div>
                      ) : (
                        <ul className="settlement-list">
                          {settlementLines.map((line, index) => (
                            <li key={`${line.debtorName}-${line.creditorName}-${index}`} className="settlement-item">
                              <div className="settlement-text">
                                {line.debtorName} owes {line.creditorName} {formatINR(line.amount)}
                              </div>
                              <button
                                type="button"
                                className="settlement-button"
                                onClick={() => handleSendReminder(line)}
                                disabled={!line.debtorEmail}
                              >
                                Send Email Reminder
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="empty-expenses">Create or select a group to get started.</div>
                )}
              </div>
            </div>
          </section>

          {showExpenseModal && (
            <div className="splitter-modal-overlay" role="dialog" aria-modal="true">
              <div className="splitter-modal">
                <div className="splitter-modal-header">
                  <h3>Add Group Expense</h3>
                  <button type="button" className="splitter-link" onClick={closeExpenseModal}>
                    Close
                  </button>
                </div>
                <div className="splitter-modal-body">
                  <label className="splitter-label" htmlFor="expenseDescription">
                    Description
                  </label>
                  <input
                    id="expenseDescription"
                    type="text"
                    className="splitter-input"
                    value={expenseForm.description}
                    onChange={(event) => handleExpenseChange('description', event.target.value)}
                    placeholder="Dinner, cab, groceries"
                  />

                  <label className="splitter-label" htmlFor="expenseAmount">
                    Amount
                  </label>
                  <input
                    id="expenseAmount"
                    type="number"
                    className="splitter-input"
                    value={expenseForm.amount}
                    onChange={(event) => handleExpenseChange('amount', event.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />

                  <label className="splitter-label" htmlFor="expenseDate">
                    Date
                  </label>
                  <input
                    id="expenseDate"
                    type="date"
                    className="splitter-input"
                    value={expenseForm.date}
                    onChange={(event) => handleExpenseChange('date', event.target.value)}
                  />
                </div>
                <div className="splitter-modal-footer">
                  <button type="button" className="splitter-secondary" onClick={closeExpenseModal}>
                    Cancel
                  </button>
                  <button type="button" className="splitter-primary" onClick={saveExpenseLocal}>
                    Save Expense
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Additional Info Section */}
          <div className="insights-footer">
            <p className="footer-text">
              💼 Your financial data is updated regularly. Check back often for fresh insights!
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default InsightsPage;
