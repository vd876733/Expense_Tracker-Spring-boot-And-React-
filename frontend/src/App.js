import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import SettlementPage from './components/SettlementPage';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Protected Route component
const ProtectedRoute = ({ children, token }) => {
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userId, setUserId] = useState(localStorage.getItem('userId'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setToken(null);
    setUserId(null);
  };

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login setToken={setToken} setUserId={setUserId} />} />
            <Route path="/register" element={<Register setToken={setToken} setUserId={setUserId} />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute token={token}>
                  <Dashboard onLogout={handleLogout} userId={userId} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settlements"
              element={
                <ProtectedRoute token={token}>
                  <SettlementPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
          </Routes>
          <ToastContainer
            position="bottom-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
