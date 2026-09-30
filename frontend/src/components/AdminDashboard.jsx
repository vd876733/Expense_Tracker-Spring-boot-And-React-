import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, LogOut, Search, ArrowLeft, Sun, Moon } from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/admin/users', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 403 || response.status === 401) {
          navigate('/admin/login');
          return;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data.users || []);
        setTotalUsers(data.totalUsers || 0);
      } catch (err) {
        console.error('Error fetching users:', err);
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const lowerQuery = searchQuery.toLowerCase();
      return (
        (user.name && user.name.toLowerCase().includes(lowerQuery)) ||
        (user.email && user.email.toLowerCase().includes(lowerQuery))
      );
    });
  }, [users, searchQuery]);

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'text-slate-200 bg-slate-950' : 'text-slate-800 bg-slate-50'}`}>
      {/* Top Bar */}
      <nav className={`border-b backdrop-blur-md sticky top-0 z-10 transition-colors ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white/80'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <span className={`font-bold text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Admin Console — User Overview</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                  isDarkMode 
                    ? 'text-amber-400 hover:bg-slate-800' 
                    : 'text-indigo-600 hover:bg-slate-100'
                }`}
              >
                {isDarkMode ? (
                  <><Sun size={18} /> Light Mode</>
                ) : (
                  <><Moon size={18} /> Dark Mode</>
                )}
              </button>
              <button
                onClick={() => navigate('/')}
                className={`text-sm font-medium flex items-center gap-2 transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <ArrowLeft size={16} /> Back to App
              </button>
              <button
                onClick={handleLogout}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut size={16} /> Sign Out Admin
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {/* Metric Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className={`p-6 rounded-2xl border flex items-center gap-4 backdrop-blur-sm transition-colors ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
                <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'}`}>
                  <Users className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Registered Users</p>
                  <p className={`text-3xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{totalUsers}</p>
                </div>
              </div>
            </div>

            {/* Table Area */}
            <div className={`rounded-2xl border backdrop-blur-sm overflow-hidden transition-colors ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}>
              <div className={`px-6 py-5 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>User Data</h2>
                
                {/* Search Bar */}
                <div className="relative w-full sm:w-72">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-xl leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors ${
                      isDarkMode 
                        ? 'border-slate-700 bg-slate-950/50 text-slate-300 placeholder-slate-500' 
                        : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className={`min-w-full divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-200'}`}>
                  <thead className={isDarkMode ? 'bg-slate-950/50' : 'bg-slate-50'}>
                    <tr>
                      <th scope="col" className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        User Name
                      </th>
                      <th scope="col" className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Email Address
                      </th>
                      <th scope="col" className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Registration Date
                      </th>
                      <th scope="col" className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Last Signed In
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-200'}`}>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}`}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {user.name || 'Unknown User'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {user.email}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                          {user.lastIp && <span className={`block text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>IP: {user.lastIp}</span>}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-slate-500 text-sm">
                          No users found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
