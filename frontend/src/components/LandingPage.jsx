import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowRight, Sparkles, AlertTriangle, Moon, Sun, Loader2 } from 'lucide-react';

const ExpenseMockup = () => (
  <div className="w-full h-32 bg-white dark:bg-[#0F172A] rounded-xl p-3 flex flex-col gap-2 overflow-hidden relative border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none transition-colors">
    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1 ml-1">Recent Transactions</div>
    
    <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/30">
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-700 dark:text-white">kanteshwaram coffee</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300 w-max mt-1 border border-purple-200 dark:border-purple-500/20">zepto</span>
      </div>
      <span className="text-sm font-bold text-slate-700 dark:text-white">-₹45.00</span>
    </motion.div>
    
    <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/30">
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-700 dark:text-white">Uber Ride</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 w-max mt-1 border border-blue-200 dark:border-blue-500/20">Transportation</span>
      </div>
      <span className="text-sm font-bold text-slate-700 dark:text-white">-₹124.50</span>
    </motion.div>
  </div>
);

const BudgetMockup = () => (
  <div className="w-full h-32 bg-white dark:bg-[#0F172A] rounded-xl p-4 flex flex-col justify-center border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none transition-colors relative">
    <div className="flex justify-between items-start mb-3">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Transportation</span>
        <span className="text-sm font-bold text-slate-800 dark:text-white mt-1">₹24.50 / ₹150.00</span>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-500/20">
        <AlertTriangle className="w-3 h-3" />
        <span>Alert</span>
      </div>
    </div>
    
    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1 border border-slate-200 dark:border-slate-700/50">
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: '16%' }}
        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        className="h-full bg-gradient-to-r from-rose-400 to-amber-400 rounded-full"
      />
    </div>
  </div>
);

const AnalyticsMockup = () => (
  <div className="w-full h-32 bg-white dark:bg-[#0F172A] rounded-xl p-3 flex flex-col justify-between border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none transition-colors relative">
    <div className="text-center mt-1">
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Spent</span>
      <span className="text-xl font-bold text-slate-800 dark:text-white">₹4,725.69</span>
    </div>
    <div className="flex gap-4 justify-center items-end h-12 mb-1">
      <div className="flex flex-col items-center">
        <motion.div initial={{ height: 0 }} whileInView={{ height: '32px' }} transition={{ duration: 0.6 }} className="w-3 bg-teal-400 rounded-t-sm" />
        <span className="text-[9px] text-teal-600 dark:text-teal-400 mt-1">Income</span>
      </div>
      <div className="flex flex-col items-center">
        <motion.div initial={{ height: 0 }} whileInView={{ height: '24px' }} transition={{ duration: 0.6, delay: 0.1 }} className="w-3 bg-amber-400 rounded-t-sm" />
        <span className="text-[9px] text-amber-600 dark:text-amber-400 mt-1">Food</span>
      </div>
      <div className="flex flex-col items-center">
        <motion.div initial={{ height: 0 }} whileInView={{ height: '16px' }} transition={{ duration: 0.6, delay: 0.2 }} className="w-3 bg-purple-400 rounded-t-sm" />
        <span className="text-[9px] text-purple-600 dark:text-purple-400 mt-1">zepto</span>
      </div>
    </div>
  </div>
);

const SettlementsMockup = () => (
  <div className="w-full h-32 bg-white dark:bg-[#0F172A] rounded-xl p-4 flex flex-col justify-center items-center relative border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-none transition-colors">
    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider absolute top-3 left-3">Group Flow</div>
    <div className="flex items-center gap-4 mt-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-bold mb-1 shadow-md shadow-blue-500/20">V</div>
        <span className="text-[10px] text-slate-500 dark:text-slate-300">Varad</span>
      </div>
      
      <div className="flex flex-col items-center pb-3">
        <motion.div 
          animate={{ x: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <ArrowRight className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
        </motion.div>
        <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-bold mt-1">₹450</span>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-700 dark:text-white font-bold mb-1 border border-slate-200 dark:border-slate-600">G</div>
        <span className="text-[10px] text-slate-500 dark:text-slate-300">Group</span>
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  // Default to Light mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleGetStarted = () => {
    setIsNavigating(true);
    setTimeout(() => navigate('/dashboard'), 1200);
  };

  const features = [
    {
      mockup: <ExpenseMockup />,
      title: "Smart Tracking",
      description: "Auto-categorize transactions."
    },
    {
      mockup: <BudgetMockup />,
      title: "Active Budgets",
      description: "Stay ahead with custom alerts."
    },
    {
      mockup: <AnalyticsMockup />,
      title: "Visual Insights",
      description: "Understand your spending."
    },
    {
      mockup: <SettlementsMockup />,
      title: "Group Splitting",
      description: "Settle up with friends easily."
    }
  ];

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col justify-between font-sans relative transition-colors duration-500 ${isDarkMode ? 'dark bg-[#0B0F19]' : 'bg-slate-50'}`}>
      
      {/* Background ambient glow - Changes based on theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {isDarkMode ? (
          <>
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/15 blur-[120px] transition-all duration-1000" />
            <div className="absolute bottom-[0%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] transition-all duration-1000" />
          </>
        ) : (
          <>
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-300/30 blur-[120px] transition-all duration-1000" />
            <div className="absolute bottom-[0%] -right-[10%] w-[50%] h-[50%] rounded-full bg-teal-200/40 blur-[120px] transition-all duration-1000" />
            <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] rounded-full bg-amber-100/40 blur-[100px] transition-all duration-1000" />
          </>
        )}
      </div>

      {/* Header & Theme Toggle */}
      <div className="w-full pt-8 px-6 lg:px-12 flex items-center justify-between z-20 pointer-events-none relative">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">K</div>
          <div className="flex flex-col justify-center">
            <span className="text-slate-900 dark:text-white font-bold text-lg leading-none transition-colors">Kosh</span>
          </div>
        </div>
        
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="pointer-events-auto p-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-sm backdrop-blur-sm text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:scale-110 active:scale-95"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="relative z-10 max-w-7xl w-full mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center flex-grow">
        
        {/* Left Column: Hero Text */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-5 flex flex-col justify-center items-start text-left gap-6 lg:gap-8"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-2 lg:mb-4 rounded-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 font-medium text-xs sm:text-sm tracking-wide shadow-sm dark:shadow-none transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            <span>Kosh — YOUR DIGITAL TREASURY</span>
          </motion.div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white transition-colors">
            Master Your Money, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Effortlessly</span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg transition-colors">
            Track expenses, manage budgets, and settle split bills effortlessly. The path to financial freedom starts here.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGetStarted}
            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 dark:shadow-blue-600/30 transition-all text-base sm:text-lg w-full sm:w-auto"
          >
            Get Started Now <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Right Column: Feature Grid */}
        <div className="lg:col-span-7 w-full flex items-center justify-center h-full">
          <div className="grid grid-cols-2 gap-4 lg:gap-6 w-full max-w-2xl">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                whileHover={{ y: -5 }}
                className="bg-white/80 dark:bg-[#1E293B]/90 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 p-4 lg:p-5 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none transition-all duration-300 group flex flex-col h-full hover:border-blue-400 dark:hover:border-blue-500/50"
              >
                <div className="mb-4 w-full">
                  {feature.mockup}
                </div>
                <h3 className="text-sm lg:text-base font-semibold text-slate-800 dark:text-white mb-1 transition-colors">{feature.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed transition-colors">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="w-full pb-6 flex justify-center z-20 pointer-events-none relative">
        <span className="text-xs text-slate-500 dark:text-slate-400 transition-colors">© 2026 Kosh. All rights reserved.</span>
      </div>

      {/* Navigation Overlay */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-md transition-colors duration-300 ${
              isDarkMode ? 'bg-slate-950/85 text-white' : 'bg-white/85 text-slate-900'
            }`}
          >
            <div className="flex flex-col items-center justify-center relative">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 rounded-2xl animate-ping opacity-25"></div>
                <div className="w-16 h-16 bg-blue-600 shadow-lg shadow-blue-600/30 rounded-2xl flex items-center justify-center relative z-10">
                  <span className="text-white font-bold text-3xl">K</span>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mt-6">Opening Kosh</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-center max-w-xs">
                Preparing your personal financial workspace...
              </p>
              
              <div className="flex items-center gap-2 mt-8">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading Dashboard...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
