import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, ArrowLeft, Sun, Moon } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });
  const navigate = useNavigate();

  React.useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/api/admin/auth', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid administrator credentials.');
      }

      const data = await response.json();
      
      // Store token (if backend provides it in body) or our cookie marker
      localStorage.setItem('adminToken', data.token || 'cookie-active');
      
      toast.success('Admin authentication successful');
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center transition-colors ${isDarkMode ? 'bg-[#070a12]' : 'bg-slate-50'}`}>
      
      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
            isDarkMode 
              ? 'text-amber-400 hover:bg-slate-800' 
              : 'text-indigo-600 hover:bg-slate-200'
          }`}
        >
          {isDarkMode ? (
            <><Sun size={18} /> Light Mode</>
          ) : (
            <><Moon size={18} /> Dark Mode</>
          )}
        </button>
      </div>

      <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl border transition-colors ${isDarkMode ? 'border-slate-800 bg-[#0b1329]' : 'border-slate-200 bg-white'}`}>
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className={`p-4 rounded-full mb-4 ${isDarkMode ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
            <Shield className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Admin Portal Access</h1>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Admin Authentication Required</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-sm font-medium text-center">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleAdminLogin} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full px-4 py-2.5 rounded-xl border transition-colors outline-none ${
                isDarkMode 
                  ? 'bg-slate-900/90 text-white border-slate-700 placeholder-slate-500 focus:border-blue-500' 
                  : 'bg-slate-100 text-slate-900 border-slate-300 placeholder-slate-400 focus:border-blue-600'
              }`}
              placeholder="admin@kosh.app"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`w-full px-4 py-2.5 rounded-xl border transition-colors outline-none ${
                isDarkMode 
                  ? 'bg-slate-900/90 text-white border-slate-700 placeholder-slate-500 focus:border-blue-500' 
                  : 'bg-slate-100 text-slate-900 border-slate-300 placeholder-slate-400 focus:border-blue-600'
              }`}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition-colors"
          >
            {isLoading ? 'Authenticating...' : 'Authenticate as Administrator'}
            {!isLoading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            className={`inline-flex items-center gap-2 text-sm transition-colors ${
              isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Return to User Login
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
