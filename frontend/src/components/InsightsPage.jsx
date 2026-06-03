import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, TrendingUp, Target } from 'lucide-react';
import { getSavingsGoals, getAiCoachInsights, getTransactions } from '../services/api';
import { toast } from 'react-toastify';
import CategorySpendingDonut from './CategorySpendingDonut';
import '../styles/InsightsPage.css';

const InsightsPage = () => {
  const navigate = useNavigate();
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

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
