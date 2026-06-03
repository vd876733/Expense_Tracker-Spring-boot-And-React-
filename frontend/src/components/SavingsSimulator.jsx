import React, { useState } from 'react';
import { TrendingDown, Zap, Calendar } from 'lucide-react';
import '../styles/SavingsSimulator.css';

/**
 * SavingsSimulator - Interactive tool to simulate impact of monthly expense cuts on savings goals
 * @param {Array} savingsGoals - Array of active savings goal objects with currentAmount and targetAmount
 * @param {Function} formatCurrency - Function to format currency (e.g., formatCurrency(1000) -> "$1,000")
 */
const SavingsSimulator = ({ savingsGoals = [], formatCurrency }) => {
  const [monthlyCut, setMonthlyCut] = useState(0);

  /**
   * Calculate remaining amount needed for a goal
   */
  const calculateRemaining = (goal) => {
    return Math.max(0, goal.targetAmount - goal.currentAmount);
  };

  /**
   * Calculate months faster to reach goal with expense cut
   */
  const calculateMonthsFaster = (remaining, monthlycut) => {
    if (monthlycut <= 0 || remaining <= 0) {
      return 0;
    }
    return Math.ceil(remaining / monthlycut);
  };

  /**
   * Convert months to a readable format (months + days or just months)
   */
  const formatMonthsAndDays = (months) => {
    if (months === 0) return '0 months';
    if (months === 1) return '1 month';
    return `${months} months`;
  };

  // Filter active (not achieved) goals
  const activeGoals = savingsGoals.filter(
    (goal) => goal.currentAmount < goal.targetAmount
  );

  // Calculate impact across all goals
  const totalImpact = activeGoals.reduce((sum, goal) => {
    return sum + calculateMonthsFaster(calculateRemaining(goal), monthlyCut);
  }, 0);

  return (
    <div className="savings-simulator">
      {/* Header */}
      <div className="simulator-header">
        <div className="simulator-title-section">
          <div className="simulator-icon">
            <Zap size={24} />
          </div>
          <div>
            <h2 className="simulator-title">What-If Savings Simulator</h2>
            <p className="simulator-subtitle">See how expense cuts accelerate your goals</p>
          </div>
        </div>
      </div>

      {/* Main Simulator Card */}
      <div className="simulator-card">
        {/* Slider Section */}
        <div className="slider-section">
          <div className="slider-header">
            <div className="slider-label-main">
              <p className="slider-title">Monthly Expense Cut</p>
              <p className="slider-description">
                Adjust how much you could save by reducing monthly expenses
              </p>
            </div>
            <div className="slider-value-display">
              <span className="slider-amount">₹{monthlyCut.toLocaleString('en-IN')}</span>
              <span className="slider-max">/₹10,000</span>
            </div>
          </div>

          {/* Range Slider */}
          <div className="slider-wrapper">
            <input
              type="range"
              min="0"
              max="10000"
              step="100"
              value={monthlyCut}
              onChange={(e) => setMonthlyCut(Number(e.target.value))}
              className="range-slider"
            />
            <div className="slider-track-fill" style={{ width: `${(monthlyCut / 10000) * 100}%` }}></div>
          </div>

          {/* Slider Labels */}
          <div className="slider-labels">
            <span className="label-start">₹0</span>
            <span className="label-mid">₹5,000</span>
            <span className="label-end">₹10,000</span>
          </div>

          {/* Preset Buttons */}
          <div className="preset-buttons">
            <button
              className={`preset-btn ${monthlyCut === 500 ? 'active' : ''}`}
              onClick={() => setMonthlyCut(500)}
            >
              ₹500
            </button>
            <button
              className={`preset-btn ${monthlyCut === 1000 ? 'active' : ''}`}
              onClick={() => setMonthlyCut(1000)}
            >
              ₹1K
            </button>
            <button
              className={`preset-btn ${monthlyCut === 2500 ? 'active' : ''}`}
              onClick={() => setMonthlyCut(2500)}
            >
              ₹2.5K
            </button>
            <button
              className={`preset-btn ${monthlyCut === 5000 ? 'active' : ''}`}
              onClick={() => setMonthlyCut(5000)}
            >
              ₹5K
            </button>
            <button
              className={`preset-btn ${monthlyCut === 0 ? 'active' : ''}`}
              onClick={() => setMonthlyCut(0)}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Results Section */}
        {activeGoals.length > 0 ? (
          <div className="results-section">
            {/* Overall Impact Card */}
            <div className="impact-summary">
              <div className="impact-content">
                <div className="impact-label">
                  <TrendingDown size={20} />
                  <span>Months Accelerated Across All Goals</span>
                </div>
                <div className={`impact-value ${monthlyCut > 0 ? 'active' : ''}`}>
                  {monthlyCut > 0 ? `${totalImpact}+` : '—'}
                </div>
              </div>
              <div className="impact-description">
                {monthlyCut > 0 ? (
                  <p>
                    By cutting ₹{monthlyCut.toLocaleString('en-IN')} monthly, you could reach all your goals
                    <strong> {totalImpact} months faster!</strong>
                  </p>
                ) : (
                  <p>Adjust the slider to see how expense cuts accelerate your savings goals.</p>
                )}
              </div>
            </div>

            {/* Individual Goal Impact Cards */}
            <div className="goals-impact-grid">
              {activeGoals.map((goal) => {
                const remaining = calculateRemaining(goal);
                const monthsFaster = calculateMonthsFaster(remaining, monthlyCut);
                const achievementDate = new Date();
                achievementDate.setMonth(achievementDate.getMonth() + monthsFaster);

                return (
                  <div key={goal.id} className="goal-impact-card">
                    <div className="goal-impact-header">
                      <h3 className="goal-impact-title">{goal.goalName}</h3>
                      <span className="goal-status">
                        {monthlyCut > 0 ? (
                          <span className="status-badge accelerated">
                            <Zap size={14} />
                            {monthsFaster} mo faster
                          </span>
                        ) : (
                          <span className="status-badge neutral">No change</span>
                        )}
                      </span>
                    </div>

                    <div className="goal-impact-details">
                      {/* Remaining Amount */}
                      <div className="detail-row">
                        <span className="detail-label">Remaining to Save</span>
                        <span className="detail-value">
                          {formatCurrency(remaining)}
                        </span>
                      </div>

                      {/* Target Amount */}
                      <div className="detail-row">
                        <span className="detail-label">Target Amount</span>
                        <span className="detail-value highlight">
                          {formatCurrency(goal.targetAmount)}
                        </span>
                      </div>

                      {/* Time to Goal */}
                      {monthlyCut > 0 && (
                        <div className="detail-row achievement">
                          <div className="achievement-content">
                            <div className="achievement-label">
                              <Calendar size={16} />
                              <span>Will Achieve By</span>
                            </div>
                            <div className="achievement-date">
                              {achievementDate.toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Monthly Acceleration */}
                      {monthlyCut > 0 && (
                        <div className="detail-row">
                          <span className="detail-label">Monthly Savings Boost</span>
                          <span className="detail-value boost">
                            +₹{monthlyCut.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress Indicator */}
                    <div className="goal-progress-mini">
                      <div className="progress-bar-mini">
                        <div
                          className="progress-fill-mini"
                          style={{
                            width: `${(goal.currentAmount / goal.targetAmount) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="progress-text-mini">
                        {((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}% complete
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="no-goals-message">
            <div className="no-goals-icon">📋</div>
            <p className="no-goals-text">
              You don't have any active savings goals yet.
            </p>
            <p className="no-goals-hint">
              Create a savings goal to see how expense cuts can help you reach it faster!
            </p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="simulator-info">
        <div className="info-item">
          <div className="info-icon">💡</div>
          <div>
            <p className="info-title">How It Works</p>
            <p className="info-text">
              The simulator shows how redirecting your expense savings to your goals accelerates
              your path to financial milestones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsSimulator;
