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

  const handleSubmit = (e) => {
    e.preventDefault();
    const amountValue = Number(formData.amount);
    const availableBalance = Number(totalIncome || 0) - Number(totalSpent || 0);

    if (Number.isFinite(amountValue) && amountValue > availableBalance) {
      const formattedBalance = formatCurrency
        ? formatCurrency(availableBalance)
        : `$${availableBalance.toFixed(2)}`;
      setErrorMessage(`Insufficient funds! Your current balance is ${formattedBalance}.`);
      setShakeAmount(true);
      setTimeout(() => setShakeAmount(false), 300);
      return;
    }

    onSubmit(formData);
    
    // Reset form
    setFormData({
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: currentCategory || 'Food',
    });
    setErrorMessage('');
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
          <div className="fixed inset-0 bg-black bg-opacity-50" />
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-2xl font-bold text-gray-900">
                    ➕ Add Transaction
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 transition text-2xl leading-none"
                  >
                    ✕
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      name="description"
                      placeholder="e.g., Grocery shopping"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                      className={`input-field ${shakeAmount ? 'shake' : ''}`}
                      required
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="input-field"
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
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold"
                    >
                      Add Transaction
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
