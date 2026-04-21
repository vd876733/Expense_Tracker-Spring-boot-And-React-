import React, { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { settleDebt } from '../services/api';

const SettlementPage = () => {
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [settleError, setSettleError] = useState('');

  const debts = [
    { id: 1, from: 'John', to: 'Sarah', amount: 25.0, payee: 'sarah@upi' },
    { id: 2, from: 'Priya', to: 'Sarah', amount: 15.5, payee: 'sarah@upi' },
    { id: 3, from: 'Miguel', to: 'Chris', amount: 10.0, payee: 'chris@upi' },
  ];

  const upiLink = useMemo(() => {
    if (!selectedDebt) {
      return '';
    }
    const amount = selectedDebt.amount.toFixed(2);
    const payeeName = encodeURIComponent(selectedDebt.to);
    const payeeId = encodeURIComponent(selectedDebt.payee);
    return `upi://pay?pa=${payeeId}&pn=${payeeName}&am=${amount}&cu=USD`;
  }, [selectedDebt]);

  const handleSettleUpClick = (debt) => {
    setSelectedDebt(debt);
    setSettleError('');
    setIsModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedDebt) {
      return;
    }
    setIsSettling(true);
    setSettleError('');
    try {
      await settleDebt(selectedDebt.id);
      setIsModalOpen(false);
      setSelectedDebt(null);
    } catch (error) {
      setSettleError('Failed to confirm payment. Please try again.');
    } finally {
      setIsSettling(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Group Settlements</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Minimize who owes whom with a smart settle-up plan.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Create New Group
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="card bg-white dark:bg-slate-800 dark:text-white">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Groups</h2>
            <ul className="space-y-3">
              {['Weekend Trip', 'Roommate Rent', 'Office Lunch'].map((group, index) => (
                <li
                  key={group}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    index === 0
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-200'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-slate-700 dark:text-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  {group}
                </li>
              ))}
            </ul>
          </aside>

          <div className="space-y-6">
            <section className="card bg-white dark:bg-slate-800 dark:text-white">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Net Balance</h2>
                <span className="text-sm text-gray-500 dark:text-gray-300">Weekend Trip</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { name: 'John', amount: -25.0 },
                  { name: 'Sarah', amount: 40.5 },
                  { name: 'Priya', amount: -15.5 },
                  { name: 'Miguel', amount: 0.0 },
                  { name: 'Ava', amount: 0.0 },
                  { name: 'Chris', amount: 10.0 },
                ].map((person) => (
                  <div
                    key={person.name}
                    className="rounded-lg border border-gray-200 p-3 dark:border-slate-700"
                  >
                    <p className="text-sm text-gray-500 dark:text-gray-300">{person.name}</p>
                    <p
                      className={`text-lg font-semibold ${
                        person.amount > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : person.amount < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {person.amount > 0 ? '+' : ''}${Math.abs(person.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {person.amount > 0
                        ? 'Gets back'
                        : person.amount < 0
                          ? 'Owes'
                          : 'Settled'}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="card bg-white dark:bg-slate-800 dark:text-white">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Simplified Debts</h2>
                <span className="text-sm text-gray-500 dark:text-gray-300">3 payments needed</span>
              </div>
              <div className="space-y-3">
                {debts.map((debt) => (
                  <div
                    key={`${debt.from}-${debt.to}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 dark:border-slate-700"
                  >
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{debt.from} owes {debt.to}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        ${debt.amount.toFixed(2)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSettleUpClick(debt)}
                      className="rounded-full border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition dark:border-blue-400 dark:text-blue-200 dark:hover:bg-blue-950"
                    >
                      Settle Up
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {isModalOpen && selectedDebt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800 dark:text-white">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Settle Up</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedDebt.from} owes {selectedDebt.to}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${selectedDebt.amount.toFixed(2)}
                </p>
              </div>

              <div className="flex justify-center rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <QRCodeSVG
                  value={upiLink}
                  size={256}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="L"
                />
              </div>

              {settleError && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-300">{settleError}</p>
              )}

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition dark:border-slate-700 dark:text-gray-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isSettling}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSettling ? 'Confirming...' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettlementPage;
