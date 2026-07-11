import React, { useMemo, useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getGroups, getGroupSettlements, sendGroupReminder, createGroup } from '../services/api';

const SettlementPage = () => {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [debts, setDebts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [settleError, setSettleError] = useState('');
  const [remindingStatus, setRemindingStatus] = useState({});

  // Create Group Modal State
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState([{ type: 'email', value: '', countryCode: '+1' }]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const fetchedGroups = await getGroups();
        setGroups(fetchedGroups);
        if (fetchedGroups.length > 0) {
          setActiveGroup(fetchedGroups[0]);
        }
      } catch (error) {
        console.error('Error fetching groups', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeGroup) {
      const fetchSettlements = async () => {
        try {
          const settlements = await getGroupSettlements(activeGroup.id);
          setDebts(settlements);
        } catch (error) {
          console.error('Error fetching settlements', error);
        }
      };
      fetchSettlements();
    }
  }, [activeGroup]);

  const handleRemindClick = async (debt) => {
    const debtId = `${debt.debtor}-${debt.creditor}`;
    setRemindingStatus(prev => ({ ...prev, [debtId]: 'sending' }));
    try {
      await sendGroupReminder({
        debtorEmail: debt.debtorEmail || debt.debtorPhoneNumber,
        creditorName: debt.creditor,
        amountOwed: debt.amount
      });
      setRemindingStatus(prev => ({ ...prev, [debtId]: 'sent' }));
      setTimeout(() => {
        setRemindingStatus(prev => ({ ...prev, [debtId]: null }));
      }, 3000);
    } catch (error) {
      console.error('Error sending reminder', error);
      setRemindingStatus(prev => ({ ...prev, [debtId]: 'error' }));
      setTimeout(() => {
        setRemindingStatus(prev => ({ ...prev, [debtId]: null }));
      }, 3000);
    }
  };

  const handleSettleUpClick = (debt) => {
    setSelectedDebt(debt);
    setSettleError('');
    setIsModalOpen(true);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setCreateGroupError('');
    if (!newGroupName.trim()) {
      setCreateGroupError('Group name is required.');
      return;
    }
    
    // Process members
    const memberIdentifiers = newGroupMembers
      .map(m => {
        if (!m.value.trim()) return null;
        if (m.type === 'phone') {
          return `${m.countryCode}${m.value.trim()}`;
        }
        return m.value.trim();
      })
      .filter(s => s !== null);
      
    if (memberIdentifiers.length < 1) { 
      setCreateGroupError('Please add at least 1 other member.');
      return;
    }

    setIsCreatingGroup(true);
    try {
      const created = await createGroup({
        groupName: newGroupName.trim(),
        emails: memberIdentifiers // Backend expects 'emails'
      });
      // Refresh groups
      setGroups(prev => [...prev, created]);
      setActiveGroup(created);
      setIsCreateGroupModalOpen(false);
      setNewGroupName('');
      setNewGroupMembers([{ type: 'email', value: '', countryCode: '+1' }]);
    } catch (error) {
      setCreateGroupError('Failed to create group. ' + (error.message || ''));
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const addMemberField = () => {
    setNewGroupMembers([...newGroupMembers, { type: 'email', value: '', countryCode: '+1' }]);
  };

  const removeMemberField = (index) => {
    setNewGroupMembers(newGroupMembers.filter((_, i) => i !== index));
  };

  const updateMemberField = (index, field, value) => {
    const updated = [...newGroupMembers];
    updated[index][field] = value;
    setNewGroupMembers(updated);
  };

  const upiLink = useMemo(() => {
    if (!selectedDebt) {
      return '';
    }
    const amount = selectedDebt.amount.toFixed(2);
    const payeeName = encodeURIComponent(selectedDebt.creditor);
    // Stubbing UPI ID for now, since we don't have it in the DB
    const payeeId = encodeURIComponent(selectedDebt.creditorEmail ? selectedDebt.creditorEmail.replace('@', '') + '@upi' : 'user@upi');
    return `upi://pay?pa=${payeeId}&pn=${payeeName}&am=${amount}&cu=USD`;
  }, [selectedDebt]);

  const handleConfirmPayment = async () => {
    if (!selectedDebt) {
      return;
    }
    setIsSettling(true);
    setSettleError('');
    try {
      // In a real app, this would call an API to mark the debt as settled
      // await settleDebt(selectedDebt.id);
      setTimeout(() => {
        setIsModalOpen(false);
        setSelectedDebt(null);
        setIsSettling(false);
      }, 1000); // Simulate API delay
    } catch (error) {
      setSettleError('Failed to confirm payment. Please try again.');
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
            onClick={() => setIsCreateGroupModalOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Create New Group
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="card bg-white dark:bg-slate-800 dark:text-white">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Groups</h2>
            <ul className="space-y-3">
              {isLoading ? (
                <li className="text-sm text-gray-500">Loading groups...</li>
              ) : groups.length === 0 ? (
                <li className="text-sm text-gray-500">No active groups.</li>
              ) : (
                groups.map((group) => (
                  <li
                    key={group.id}
                    onClick={() => setActiveGroup(group)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition cursor-pointer ${
                      activeGroup?.id === group.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-200'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-slate-700 dark:text-gray-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {group.groupName}
                  </li>
                ))
              )}
            </ul>
          </aside>

          <div className="space-y-6">
            <section className="card bg-white dark:bg-slate-800 dark:text-white">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Simplified Debts</h2>
                <span className="text-sm text-gray-500 dark:text-gray-300">
                  {activeGroup ? activeGroup.groupName : 'Select a group'}
                </span>
              </div>
              
              {!activeGroup ? (
                <p className="text-gray-500">Please select a group from the sidebar to view settlements.</p>
              ) : debts.length === 0 ? (
                <p className="text-gray-500">No pending debts in this group! Everyone is settled up.</p>
              ) : (
                <div className="space-y-3">
                  {debts.map((debt, idx) => {
                    const debtId = `${debt.debtor}-${debt.creditor}`;
                    const rStatus = remindingStatus[debtId];
                    return (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 dark:border-slate-700"
                      >
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <strong>{debt.debtor}</strong> owes <strong>{debt.creditor}</strong>
                          </p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            ${debt.amount.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleRemindClick(debt)}
                            disabled={rStatus === 'sending' || rStatus === 'sent'}
                            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                              rStatus === 'sent' ? 'border-emerald-600 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30' :
                              rStatus === 'error' ? 'border-red-600 text-red-700 bg-red-50 dark:bg-red-900/30' :
                              'border-indigo-600 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-400 dark:text-indigo-300 dark:hover:bg-indigo-950'
                            }`}
                          >
                            {rStatus === 'sending' ? 'Sending...' : rStatus === 'sent' ? 'Sent!' : rStatus === 'error' ? 'Failed' : 'Remind'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSettleUpClick(debt)}
                            className="rounded-full border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition dark:border-blue-400 dark:text-blue-200 dark:hover:bg-blue-950"
                          >
                            Settle Up
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

        {isModalOpen && selectedDebt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800 dark:text-white">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">Settle Up</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedDebt.debtor} owes {selectedDebt.creditor}
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
                  {isSettling ? 'Confirming...' : 'Mark as Settled'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isCreateGroupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800 dark:text-white">
              <h3 className="text-xl font-semibold mb-4">Create New Group</h3>
              <form onSubmit={handleCreateGroup}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. Weekend Trip"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Members
                  </label>
                  
                  {newGroupMembers.map((member, index) => (
                    <div key={index} className="flex flex-wrap sm:flex-nowrap items-center gap-2 mb-2">
                      <select
                        value={member.type}
                        onChange={(e) => updateMemberField(index, 'type', e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 bg-white focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      >
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                      </select>

                      {member.type === 'phone' && (
                        <select
                          value={member.countryCode}
                          onChange={(e) => updateMemberField(index, 'countryCode', e.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-2 bg-white focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white w-24"
                        >
                          <option value="+1">+1 (US/CA)</option>
                          <option value="+44">+44 (UK)</option>
                          <option value="+91">+91 (IN)</option>
                          <option value="+61">+61 (AU)</option>
                          <option value="+81">+81 (JP)</option>
                          <option value="+49">+49 (DE)</option>
                          <option value="+33">+33 (FR)</option>
                          {/* Add more as needed */}
                        </select>
                      )}

                      <input
                        type={member.type === 'email' ? 'email' : 'tel'}
                        value={member.value}
                        onChange={(e) => updateMemberField(index, 'value', e.target.value)}
                        placeholder={member.type === 'email' ? "john@example.com" : "1234567890"}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white min-w-[150px]"
                      />

                      {newGroupMembers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMemberField(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          title="Remove Member"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addMemberField}
                    className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    + Add another member
                  </button>
                </div>

                {createGroupError && (
                  <p className="mb-4 text-sm text-red-600 dark:text-red-300">{createGroupError}</p>
                )}

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateGroupModalOpen(false);
                      setCreateGroupError('');
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition dark:border-slate-700 dark:text-gray-200 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingGroup}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCreatingGroup ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettlementPage;
