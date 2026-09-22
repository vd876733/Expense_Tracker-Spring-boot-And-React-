import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, TrendingUp, Target, Key, Eye, EyeOff } from 'lucide-react';
import { getSavingsGoals, getAiCoachInsights, getTransactions } from '../services/api';
import { toast } from 'react-toastify';
import CategorySpendingDonut from './CategorySpendingDonut';
import SavingsSimulator from './SavingsSimulator';

import '../styles/InsightsPage.css';

const InsightsPage = () => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showKeyText, setShowKeyText] = useState(false);
  const { data: savingsGoals = [], isLoading: goalsLoading, error: goalsError } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: async () => {
      const response = await getSavingsGoals();
      return Array.isArray(response) ? response : [];
    },
  });

  const { data: aiInsightsResponse, isLoading: insightsLoading, error: insightsError, refetch: refetchInsights } = useQuery({
    queryKey: ['aiCoachInsights'],
    queryFn: getAiCoachInsights,
  });
  const aiInsights = aiInsightsResponse?.insights || '';

  const { data: transactions = [], isLoading: txLoading, error: txError } = useQuery({
    queryKey: ['transactions', 'all'],
    queryFn: async () => {
      const response = await getTransactions();
      return Array.isArray(response) ? response : [];
    },
  });

  const loading = goalsLoading || insightsLoading || txLoading;
  const error = goalsError || insightsError || txError ? (goalsError?.message || insightsError?.message || txError?.message || 'Failed to load insights and goals') : null;

  const handleSaveApiKey = () => {
    const trimmed = tempApiKey.trim();
    if (!trimmed) {
      toast.error('Please enter a valid API key');
      return;
    }
    localStorage.setItem('gemini_api_key', trimmed);
    toast.success('Gemini API key saved! Refreshing insights...');
    setShowApiKeyInput(false);
    refetchInsights();
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setTempApiKey('');
    toast.success('Custom API key removed. Using default server key.');
    setShowApiKeyInput(false);
    refetchInsights();
  };

  /**
   * Refresh data with loading indicator
   */
  const handleRefreshInsights = async () => {
    setRefreshing(true);
    const { isError } = await refetchInsights();
    setRefreshing(false);
    if (isError) {
      toast.error('Failed to refresh insights');
    } else {
      toast.success('Insights refreshed!');
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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
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
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                    className={`refresh-icon-button ${showApiKeyInput ? 'active' : ''}`}
                    title="Configure Gemini API Key"
                  >
                    <Key size={18} />
                  </button>
                  <button
                    onClick={handleRefreshInsights}
                    className="refresh-icon-button"
                    disabled={refreshing}
                    title="Refresh insights"
                  >
                    <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
                  </button>
                </div>
              </div>
              <div className="card-body">
                {showApiKeyInput && (
                  <div className="api-key-config-container">
                    <div className="api-key-header">
                      <span className="api-key-title">Custom Gemini API Key</span>
                      <a
                        href="https://aistudio.google.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="api-key-link"
                      >
                        Get Free Key ↗
                      </a>
                    </div>
                    <div className="api-key-input-wrapper">
                      <input
                        type={showKeyText ? "text" : "password"}
                        value={tempApiKey}
                        onChange={(e) => setTempApiKey(e.target.value)}
                        placeholder="Paste your free Gemini API key here..."
                        className="api-key-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeyText(!showKeyText)}
                        className="api-key-toggle-visible"
                        title={showKeyText ? "Hide key" : "Show key"}
                      >
                        {showKeyText ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="api-key-actions">
                      <button onClick={handleSaveApiKey} className="api-key-save-btn">
                        Save Key
                      </button>
                      {localStorage.getItem('gemini_api_key') && (
                        <button onClick={handleClearApiKey} className="api-key-clear-btn">
                          Clear Key
                        </button>
                      )}
                    </div>
                  </div>
                )}
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

          {/* Savings Simulator Section */}
          <div className="simulator-section">
            <SavingsSimulator
              savingsGoals={savingsGoals}
              formatCurrency={formatCurrency}
            />
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
