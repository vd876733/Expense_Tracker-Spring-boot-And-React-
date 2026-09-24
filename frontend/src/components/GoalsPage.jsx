import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles, Target, TrendingUp, AlertTriangle, Plus, X, Trash2, Pencil } from 'lucide-react';
import { API_BASE_URL } from '../api';

const defaultDemoCaps = {
  Food: { cap: 300, icon: '🍽️' },
  Transport: { cap: 100, icon: '🚗' },
  Entertainment: { cap: 150, icon: '🍿' }
};

const defaultDemoGoals = [
  { id: 1, name: 'New Shoes', targetAmount: 1500, currentAmount: 520, categoryIcon: '👟', priorityRank: 1 },
  { id: 2, name: 'Emergency Fund', targetAmount: 10000, currentAmount: 3000, categoryIcon: '🏦', priorityRank: 2 },
  { id: 3, name: 'Goa Trip', targetAmount: 25000, currentAmount: 5000, categoryIcon: '🌴', priorityRank: 3 }
];

const GoalsPage = ({ transactions = [] }) => {
  const [categoryCaps, setCategoryCaps] = useState({});
  const [capHistory, setCapHistory] = useState([]);
  const [goals, setGoals] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modals state
  const [isAddGoalModalOpen, setAddGoalModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', targetAmount: '', categoryIcon: '🎯' });

  const [isEditGoalModalOpen, setEditGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const [isAddAllowanceModalOpen, setAddAllowanceModalOpen] = useState(false);
  const [newAllowance, setNewAllowance] = useState({ category: '', customCategory: '', amount: '', icon: '✨' });

  const [isEditAllowanceModalOpen, setEditAllowanceModalOpen] = useState(false);
  const [editingAllowance, setEditingAllowance] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const getUserIdFromToken = (token) => {
    try {
      const payload = token?.split('.')[1];
      if (!payload) return null;
      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(normalizedPayload));
      return decoded?.userId ?? decoded?.id ?? decoded?.uid ?? decoded?.sub ?? null;
    } catch (error) {
      return null;
    }
  };

  // 1. Dynamic Unique Categories Extraction
  const uniqueCategories = useMemo(() => {
    const defaultCategories = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Shopping', 'Other'];
    if (!transactions || transactions.length === 0) return defaultCategories;
    
    const cats = new Set();
    transactions.forEach(tx => {
      if (tx.category && tx.category.trim()) {
        cats.add(tx.category.trim());
      }
    });
    
    if (cats.size === 0) return defaultCategories;
    
    defaultCategories.forEach(c => cats.add(c));
    return Array.from(cats).sort();
  }, [transactions]);


  // 2. Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token');
      const uId = getUserIdFromToken(token);
      
      if (!token || !uId) {
        setIsGuest(true);
        const savedData = sessionStorage.getItem('kosh_goals_demo');
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            if (parsed.categoryCaps) setCategoryCaps(parsed.categoryCaps);
            if (parsed.capHistory) setCapHistory(parsed.capHistory);
            if (parsed.goals) setGoals(parsed.goals);
          } catch (e) {
            console.error("Failed to parse demo data", e);
          }
        } else {
          setCategoryCaps(defaultDemoCaps);
          setCapHistory([{ effectiveDate: new Date().toISOString().split('T')[0], caps: defaultDemoCaps }]);
          setGoals(defaultDemoGoals);
        }
        setIsInitialized(true);
        return;
      }

      setIsGuest(false);
      try {
        const goalsRes = await fetch(`${API_BASE_URL}/goals`, { headers: getAuthHeaders() });
        if (!goalsRes.ok) throw new Error('Failed to fetch goals');
        const goalsData = await goalsRes.json();
        setGoals(goalsData || []);

        const capsRes = await fetch(`${API_BASE_URL}/category-caps`, { headers: getAuthHeaders() });
        if (!capsRes.ok) throw new Error('Failed to fetch category caps');
        const capsData = await capsRes.json();
        
        const capsMap = {};
        if (capsData && capsData.length > 0) {
           capsData.forEach(cap => {
             capsMap[cap.categoryName] = { id: cap.id, cap: cap.dailyCap, icon: cap.icon };
           });
        }
        setCategoryCaps(capsMap);
        setCapHistory([{ effectiveDate: new Date().toISOString().split('T')[0], caps: capsMap }]);

      } catch (err) {
        console.error(err);
        setErrorMsg("Failed to connect to the database. Please try again later.");
      } finally {
        setIsInitialized(true);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isInitialized || !isGuest) return;
    const payload = JSON.stringify({ categoryCaps, capHistory, goals });
    sessionStorage.setItem('kosh_goals_demo', payload);
  }, [categoryCaps, capHistory, goals, isGuest, isInitialized]);


  // 3. Calculation Engines with Automatic Case Normalization
  const spentToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const totals = {};
    transactions.forEach(tx => {
      if (!tx.date) return;
      const txDate = tx.date.split('T')[0];
      if (txDate === today && (!tx.type || tx.type.toLowerCase() === 'expense')) {
        const rawCat = tx.category || 'Other';
        const normalizedCat = rawCat.trim().toLowerCase(); // Normalize to prevent case mismatch
        totals[normalizedCat] = (totals[normalizedCat] || 0) + Number(tx.amount || 0);
      }
    });
    return totals;
  }, [transactions]);

  const categoryNets = useMemo(() => {
    const nets = {};
    Object.entries(categoryCaps).forEach(([cat, data]) => {
      const normalizedCat = cat.trim().toLowerCase();
      nets[cat] = data.cap - (spentToday[normalizedCat] || 0);
    });
    return nets;
  }, [categoryCaps, spentToday]);

  const netDailyRollover = useMemo(() => {
    return Object.values(categoryNets).reduce((acc, curr) => acc + curr, 0);
  }, [categoryNets]);


  // 4. Persistence Handlers
  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 5000);
  };

  const handleCapChange = async (category, value) => {
    const numValue = Number(value);
    const validValue = isNaN(numValue) ? 0 : numValue;
    
    const previousCaps = { ...categoryCaps };
    const currentData = categoryCaps[category];
    const newCapMap = { ...categoryCaps, [category]: { ...currentData, cap: validValue } };
    setCategoryCaps(newCapMap);

    if (!isGuest) {
      try {
        const payload = {
          id: currentData.id,
          categoryName: category,
          dailyCap: validValue,
          icon: currentData.icon || '✨'
        };
        const res = await fetch(`${API_BASE_URL}/category-caps`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error();
      } catch (e) {
        showError("Failed to update allowance in database.");
        setCategoryCaps(previousCaps); 
      }
    }
  };

  const handleAddAllowance = async () => {
    const isCustom = newAllowance.category === 'custom';
    const rawCatName = isCustom ? newAllowance.customCategory : newAllowance.category;
    const catName = rawCatName?.trim();

    if (!catName || !newAllowance.amount) return;
    
    const validCap = Number(newAllowance.amount);
    const icon = newAllowance.icon || '✨';

    if (!isGuest) {
      try {
        const payload = { categoryName: catName, dailyCap: validCap, icon: icon };
        const res = await fetch(`${API_BASE_URL}/category-caps`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error();
        const savedData = await res.json();
        setCategoryCaps(prev => ({
          ...prev,
          [catName]: { id: savedData.id, cap: savedData.dailyCap, icon: savedData.icon }
        }));
      } catch (e) {
        showError("Failed to save new allowance.");
        return;
      }
    } else {
      setCategoryCaps(prev => ({
        ...prev,
        [catName]: { cap: validCap, icon: icon }
      }));
    }

    setAddAllowanceModalOpen(false);
    setNewAllowance({ category: '', customCategory: '', amount: '', icon: '✨' });
  };

  const handleDeleteAllowance = async (category) => {
    const currentData = categoryCaps[category];
    if (!isGuest && currentData.id) {
      try {
        const res = await fetch(`${API_BASE_URL}/category-caps/${currentData.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error();
      } catch (e) {
        showError("Failed to delete allowance from DB.");
        return;
      }
    }

    setCategoryCaps(prev => {
      const newCaps = { ...prev };
      delete newCaps[category];
      return newCaps;
    });
  };

  const openEditAllowanceModal = (category, data) => {
    const isCatInList = uniqueCategories.includes(category);
    setEditingAllowance({
      id: data.id,
      originalCategory: category,
      category: isCatInList ? category : 'custom',
      customCategory: isCatInList ? '' : category,
      isCustom: !isCatInList,
      amount: data.cap,
      icon: data.icon || '✨'
    });
    setEditAllowanceModalOpen(true);
  };

  const handleSaveEditedAllowance = async () => {
    const rawCatName = editingAllowance.isCustom ? editingAllowance.customCategory : editingAllowance.category;
    const catName = rawCatName?.trim();

    if (!catName || editingAllowance.amount === '') return;

    if (!isGuest) {
      try {
        const payload = {
          id: editingAllowance.id,
          categoryName: catName,
          dailyCap: Number(editingAllowance.amount),
          icon: editingAllowance.icon || '✨'
        };
        const res = await fetch(`${API_BASE_URL}/category-caps`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) throw new Error();
        const savedData = await res.json();

        if (editingAllowance.originalCategory !== catName && editingAllowance.id) {
            await fetch(`${API_BASE_URL}/category-caps/${editingAllowance.id}`, {
              method: 'DELETE',
              headers: getAuthHeaders()
            });
        }

        setCategoryCaps(prev => {
          const newCaps = { ...prev };
          if (editingAllowance.originalCategory !== catName) {
            delete newCaps[editingAllowance.originalCategory];
          }
          newCaps[catName] = { id: savedData.id, cap: savedData.dailyCap, icon: savedData.icon };
          return newCaps;
        });

      } catch (e) {
        showError("Failed to save edited allowance.");
        return;
      }
    } else {
      setCategoryCaps(prev => {
        const newCaps = { ...prev };
        if (editingAllowance.originalCategory !== catName) {
          delete newCaps[editingAllowance.originalCategory];
        }
        newCaps[catName] = { cap: Number(editingAllowance.amount), icon: editingAllowance.icon || '✨' };
        return newCaps;
      });
    }

    setEditAllowanceModalOpen(false);
    setEditingAllowance(null);
  };

  const handleAddGoal = async () => {
    const newRank = goals.length + 1;
    const goalPayload = {
      name: newGoal.name,
      targetAmount: Number(newGoal.targetAmount) || 0,
      currentAmount: 0,
      categoryIcon: newGoal.categoryIcon || '🎯',
      priorityRank: newRank
    };

    if (!isGuest) {
      try {
        const res = await fetch(`${API_BASE_URL}/goals`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(goalPayload)
        });
        if (!res.ok) throw new Error();
        const savedGoal = await res.json();
        setGoals(prev => [...prev, savedGoal]);
      } catch (e) {
        showError("Failed to create goal in database.");
        return;
      }
    } else {
      goalPayload.id = Math.max(...goals.map(g => g.id), 0) + 1;
      setGoals(prev => [...prev, goalPayload]);
    }

    setAddGoalModalOpen(false);
    setNewGoal({ name: '', targetAmount: '', categoryIcon: '🎯' });
  };

  const handleSaveEditedGoal = async () => {
    if (!isGuest) {
      try {
        const payload = { ...editingGoal, priorityRank: Number(editingGoal.priorityRank) };
        const res = await fetch(`${API_BASE_URL}/goals/${editingGoal.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error();
        const savedGoal = await res.json();

        setGoals(prev => {
          const prevGoals = [...prev];
          const index = prevGoals.findIndex(g => g.id === savedGoal.id);
          const oldRank = prevGoals[index].priorityRank;
          const newRank = savedGoal.priorityRank;
          
          if (oldRank !== newRank) {
             const swapped = prevGoals.map(g => {
              if (g.id === savedGoal.id) return savedGoal;
              if (g.priorityRank === newRank) return { ...g, priorityRank: oldRank };
              return g;
            });
            fetch(`${API_BASE_URL}/goals/reorder`, {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify(swapped)
            });
            return swapped.sort((a, b) => a.priorityRank - b.priorityRank);
          } else {
             prevGoals[index] = savedGoal;
             return prevGoals;
          }
        });
      } catch (e) {
        showError("Failed to update goal.");
        return;
      }
    } else {
      setGoals(prev => {
        const prevGoals = [...prev];
        const index = prevGoals.findIndex(g => g.id === editingGoal.id);
        const oldRank = prevGoals[index].priorityRank;
        const newRank = Number(editingGoal.priorityRank);
        
        if (oldRank !== newRank) {
           return prevGoals.map(g => {
            if (g.id === editingGoal.id) return { ...editingGoal, priorityRank: newRank };
            if (g.priorityRank === newRank) return { ...g, priorityRank: oldRank };
            return g;
          }).sort((a, b) => a.priorityRank - b.priorityRank);
        } else {
           prevGoals[index] = { ...editingGoal };
           return prevGoals;
        }
      });
    }
    setEditGoalModalOpen(false);
    setEditingGoal(null);
  };

  const handlePriorityChange = async (goalId, newRank) => {
    let swappedGoals = [];
    setGoals(prev => {
      const targetGoal = prev.find(g => g.id === goalId);
      const oldRank = targetGoal.priorityRank;
      if (oldRank === newRank) return prev;
      
      swappedGoals = prev.map(g => {
        if (g.id === goalId) return { ...g, priorityRank: newRank };
        if (g.priorityRank === newRank) return { ...g, priorityRank: oldRank };
        return g;
      });
      return [...swappedGoals].sort((a, b) => a.priorityRank - b.priorityRank);
    });

    if (!isGuest && swappedGoals.length > 0) {
      try {
        await fetch(`${API_BASE_URL}/goals/reorder`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(swappedGoals)
        });
      } catch (e) {
        showError("Failed to save new priority order.");
      }
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!isGuest) {
      try {
        const res = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error();
      } catch (e) {
        showError("Failed to delete goal.");
        return;
      }
    }
    setGoals(prev => {
      const filtered = prev.filter(g => g.id !== goalId);
      return filtered.sort((a, b) => a.priorityRank - b.priorityRank)
        .map((g, index) => ({ ...g, priorityRank: index + 1 }));
    });
  };

  const openEditModal = (goal) => {
    setEditingGoal({ ...goal });
    setEditGoalModalOpen(true);
  };

  const sortedGoals = [...goals].sort((a, b) => a.priorityRank - b.priorityRank);

  if (!isInitialized) {
    return <div className="flex h-64 items-center justify-center text-slate-500 font-semibold">Connecting to Kosh Treasury...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8 font-sans">
      
      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] bg-rose-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 font-semibold text-sm"
          >
            <AlertTriangle className="h-5 w-5" />
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="h-8 w-8 text-indigo-500" />
            Goals & Rollover Engine
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage daily caps and accelerate your priority targets.
          </p>
        </div>
        <button 
          onClick={() => setAddGoalModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl px-5 py-2.5 shadow-lg shadow-blue-500/25 transition-all"
        >
          <Plus className="h-5 w-5" />
          Add New Goal
        </button>
      </div>

      <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  Daily Category Allowances
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Adjust caps to see real-time rollover impact.
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={() => setAddAllowanceModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Allowance
              </button>
              
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold shadow-sm ${netDailyRollover >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                <TrendingUp className="h-5 w-5" />
                <span>
                  Net Daily Rollover: {netDailyRollover >= 0 ? '+' : '-'}₹{Math.abs(netDailyRollover)}
                </span>
              </div>
            </div>
          </div>
          
          {Object.keys(categoryCaps).length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">No allowances configured. Add a category cap to start calculating rollovers!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {Object.entries(categoryCaps).map(([category, data]) => {
                  const net = categoryNets[category];
                  const isSurplus = net >= 0;
                  const normalizedCat = category.trim().toLowerCase();
                  
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={category} 
                      className="group relative bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                    >
                      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => openEditAllowanceModal(category, data)}
                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                          title="Edit Allowance"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAllowance(category)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
                          title="Delete Allowance"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex flex-col mb-4 pr-16">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-2" title={category}>
                          <span>{data.icon || '✨'}</span>
                          {category}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-1 mt-2 rounded-full w-fit ${isSurplus ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                          {isSurplus ? '+' : '-'}₹{Math.abs(net)} {isSurplus ? 'Saved' : 'Over'}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                            Daily Cap
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                            <input 
                              type="number"
                              value={data.cap}
                              onChange={(e) => handleCapChange(category, e.target.value)}
                              className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Spent Today</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">₹{spentToday[normalizedCat] || 0}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Priority Waterfall Goal Cards Grid */}
      {sortedGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-lg border-dashed">
          <Target className="w-12 h-12 text-blue-500/40 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No active goals found in your treasury.</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-center max-w-sm">
            Click '+ Add New Goal' to get started!
          </p>
          <button 
            onClick={() => setAddGoalModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl px-5 py-2.5 shadow-lg shadow-blue-500/25 transition-all"
          >
            <Plus className="h-5 w-5" />
            Add New Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <AnimatePresence>
            {sortedGoals.map((goal, index) => {
              const isPriority1 = index === 0;
              let effectiveSaved = goal.currentAmount;
              
              if (isPriority1) {
                effectiveSaved = Math.max(0, goal.currentAmount + netDailyRollover);
              }

              const progressPercent = Math.min(100, (effectiveSaved / goal.targetAmount) * 100);

              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={goal.id} 
                  className={`relative flex flex-col rounded-3xl overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 transition-all duration-300 ${
                    isPriority1 
                      ? 'border-2 border-blue-500 shadow-2xl shadow-blue-500/10 md:col-span-1 transform scale-[1.02]' 
                      : 'border border-slate-200/80 dark:border-slate-800/80 shadow-lg hover:-translate-y-1'
                  }`}
                >
                  <div className="p-6 md:p-8 flex-1 flex flex-col">
                    
                    {isPriority1 && (
                      <div className="mb-6">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md text-xs font-bold tracking-wide">
                          <Flame className="h-3.5 w-3.5 fill-white" />
                          #1 Priority Target
                        </div>
                      </div>
                    )}

                    {/* Card Top Action Bar */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className={`font-extrabold text-slate-900 dark:text-white flex items-center gap-2 ${isPriority1 ? 'text-2xl' : 'text-xl'}`}>
                          <span className="text-3xl">{goal.categoryIcon}</span>
                          {goal.name}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                          Target: ₹{goal.targetAmount.toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => openEditModal(goal)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            title="Edit Goal"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                            title="Delete Goal"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="relative group">
                          <select
                            value={goal.priorityRank}
                            onChange={(e) => handlePriorityChange(goal.id, Number(e.target.value))}
                            className={`appearance-none cursor-pointer pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold border transition-colors outline-none focus:ring-2 focus:ring-indigo-500 ${
                              isPriority1 
                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' 
                                : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:border-indigo-300'
                            }`}
                          >
                            {goals.map((_, i) => (
                              <option key={i+1} value={i+1}>
                                Priority #{i+1}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <div className="mb-3 flex items-end gap-3">
                        <div>
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                            Current Balance
                          </span>
                          <span className={`font-black text-slate-900 dark:text-white ${isPriority1 ? 'text-4xl' : 'text-2xl'}`}>
                            ₹{effectiveSaved.toLocaleString()}
                          </span>
                        </div>
                        
                        {isPriority1 && netDailyRollover !== 0 && (
                          <div className={`mb-1.5 px-2 py-0.5 rounded text-xs font-bold ${netDailyRollover > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'}`}>
                            {netDailyRollover > 0 ? '+' : '-'}₹{Math.abs(netDailyRollover)} today
                          </div>
                        )}
                      </div>
                      
                      <div className="relative h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`absolute top-0 left-0 h-full rounded-full ${
                            isPriority1 
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                              : 'bg-slate-400 dark:bg-slate-500'
                          }`}
                        />
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {progressPercent.toFixed(1)}% Completed
                        </span>
                      </div>
                    </div>
                    
                    {/* Penalty Alert */}
                    {isPriority1 && netDailyRollover < 0 && (
                      <div className="mt-6 flex items-start gap-3 p-3 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50">
                        <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                          Goal Penalty Applied: -₹{Math.abs(netDailyRollover)} deducted today due to overspending.
                        </p>
                      </div>
                    )}

                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add New Goal Modal */}
      <AnimatePresence>
        {isAddGoalModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddGoalModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Target</h2>
                <button 
                  onClick={() => setAddGoalModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Goal Name</label>
                  <input 
                    type="text"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Dream Vacation"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Target Amount (₹)</label>
                  <input 
                    type="number"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: e.target.value }))}
                    placeholder="50000"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Icon (Emoji)</label>
                  <input 
                    type="text"
                    value={newGoal.categoryIcon}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, categoryIcon: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                <button 
                  onClick={() => setAddGoalModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddGoal}
                  disabled={!newGoal.name || !newGoal.targetAmount}
                  className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Add Goal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Goal Modal */}
      <AnimatePresence>
        {isEditGoalModalOpen && editingGoal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setEditGoalModalOpen(false); setEditingGoal(null); }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Goal</h2>
                <button 
                  onClick={() => { setEditGoalModalOpen(false); setEditingGoal(null); }}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Goal Name</label>
                  <input 
                    type="text"
                    value={editingGoal.name}
                    onChange={(e) => setEditingGoal(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Target Amount (₹)</label>
                  <input 
                    type="number"
                    value={editingGoal.targetAmount}
                    onChange={(e) => setEditingGoal(prev => ({ ...prev, targetAmount: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Icon (Emoji)</label>
                  <input 
                    type="text"
                    value={editingGoal.categoryIcon}
                    onChange={(e) => setEditingGoal(prev => ({ ...prev, categoryIcon: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Priority Rank</label>
                  <select
                    value={editingGoal.priorityRank}
                    onChange={(e) => setEditingGoal(prev => ({ ...prev, priorityRank: Number(e.target.value) }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  >
                    {goals.map((_, i) => (
                      <option key={i+1} value={i+1}>Priority #{i+1}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                <button 
                  onClick={() => { setEditGoalModalOpen(false); setEditingGoal(null); }}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEditedGoal}
                  disabled={!editingGoal.name || !editingGoal.targetAmount}
                  className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add New Allowance Modal */}
      <AnimatePresence>
        {isAddAllowanceModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddAllowanceModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Category Allowance</h2>
                <button 
                  onClick={() => setAddAllowanceModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Category Name</label>
                  <select 
                    value={newAllowance.category}
                    onChange={(e) => setNewAllowance(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all mb-3"
                  >
                    <option value="" disabled>Select a category</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="custom">+ Custom Category...</option>
                  </select>
                  
                  {newAllowance.category === 'custom' && (
                    <motion.input 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      type="text"
                      value={newAllowance.customCategory || ''}
                      onChange={(e) => setNewAllowance(prev => ({ ...prev, customCategory: e.target.value }))}
                      placeholder="Enter custom category"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Daily Cap (₹)</label>
                  <input 
                    type="number"
                    value={newAllowance.amount}
                    onChange={(e) => setNewAllowance(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="300"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Icon (Emoji)</label>
                  <input 
                    type="text"
                    value={newAllowance.icon}
                    onChange={(e) => setNewAllowance(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="✨"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                <button 
                  onClick={() => setAddAllowanceModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddAllowance}
                  disabled={!newAllowance.category || (newAllowance.category === 'custom' && !newAllowance.customCategory) || !newAllowance.amount}
                  className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Add Cap
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Allowance Modal */}
      <AnimatePresence>
        {isEditAllowanceModalOpen && editingAllowance && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setEditAllowanceModalOpen(false); setEditingAllowance(null); }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Category Allowance</h2>
                <button 
                  onClick={() => { setEditAllowanceModalOpen(false); setEditingAllowance(null); }}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Category Name</label>
                  <select 
                    value={editingAllowance.isCustom ? 'custom' : editingAllowance.category}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingAllowance(prev => ({ 
                        ...prev, 
                        category: val === 'custom' ? '' : val,
                        isCustom: val === 'custom'
                      }));
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all mb-3"
                  >
                    {!uniqueCategories.includes(editingAllowance.originalCategory) && !editingAllowance.isCustom && (
                      <option value={editingAllowance.originalCategory}>{editingAllowance.originalCategory}</option>
                    )}
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="custom">+ Custom Category...</option>
                  </select>

                  {editingAllowance.isCustom && (
                    <motion.input 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      type="text"
                      value={editingAllowance.customCategory || ''}
                      onChange={(e) => setEditingAllowance(prev => ({ ...prev, customCategory: e.target.value }))}
                      placeholder="Enter custom category"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                  )}
                  {editingAllowance.originalCategory !== (editingAllowance.isCustom ? editingAllowance.customCategory : editingAllowance.category) && (
                    <p className="text-xs text-blue-500 mt-2 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Note: This will remap past caps to the new name.
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Daily Cap (₹)</label>
                  <input 
                    type="number"
                    value={editingAllowance.amount}
                    onChange={(e) => setEditingAllowance(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Icon (Emoji)</label>
                  <input 
                    type="text"
                    value={editingAllowance.icon}
                    onChange={(e) => setEditingAllowance(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                <button 
                  onClick={() => { setEditAllowanceModalOpen(false); setEditingAllowance(null); }}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEditedAllowance}
                  disabled={!(editingAllowance.isCustom ? editingAllowance.customCategory : editingAllowance.category) || editingAllowance.amount === ''}
                  className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default GoalsPage;
