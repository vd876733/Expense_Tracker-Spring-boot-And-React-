import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

/**
 * Add Transaction Modal Component
 * Opens a modal dialog for adding new transactions
 */
const AddTransactionModal = ({
  isOpen,
  onClose,
  onSubmit,
  currentCategory,
  categories,
  totalIncome,
  totalSpent,
  formatCurrency,
}) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: currentCategory || 'Food',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [shakeAmount, setShakeAmount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (name === 'amount') {
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountValue = Number(formData.amount);
    const availableBalance = Number(totalIncome || 0) - Number(totalSpent || 0);

    if (Number.isFinite(amountValue) && amountValue > availableBalance) {
      const formattedBalance = formatCurrency
        ? formatCurrency(availableBalance)
        : `₹${availableBalance.toFixed(2)}`;
      setErrorMessage(`Insufficient funds! Your current balance is ${formattedBalance}.`);
      setShakeAmount(true);
      setTimeout(() => setShakeAmount(false), 300);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      
      // Reset form
      setFormData({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: currentCategory || 'Food',
      });
      setErrorMessage('');
    } catch (error) {
      console.error('Failed to add transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        {/* Dialog Content */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-11/12 max-w-lg mx-auto transform bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 p-4 sm:p-6 rounded-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-left align-middle transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    ➕ Add Transaction
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 transition-colors text-2xl leading-none"
                  >
                    ✕
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      name="description"
                      placeholder="e.g., Grocery shopping"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 rounded-xl p-3 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Amount
                    </label>
                    <input
                      type="number"
                      name="amount"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className={`w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 rounded-xl p-3 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors ${shakeAmount ? 'shake' : ''}`}
                      required
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 rounded-xl p-3 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 rounded-xl p-3 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-colors"
                      required
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Buttons */}
                  {errorMessage && (
                    <p className="text-sm font-semibold text-red-600">
                      {errorMessage}
                    </p>
                  )}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="flex-1 bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors border border-slate-200 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Adding...' : 'Add Transaction'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AddTransactionModal;
