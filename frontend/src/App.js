import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

const Dashboard = lazy(() => import('./components/Dashboard'));
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const InsightsPage = lazy(() => import('./components/InsightsPage'));

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
          <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
            <Routes>
              <Route path="/login" element={<Login setToken={setToken} setUserId={setUserId} />} />
              <Route path="/register" element={<Register setToken={setToken} setUserId={setUserId} />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard onLogout={handleLogout} userId={userId} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/insights"
                element={
                  <ProtectedRoute>
                    <InsightsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
            </Routes>
          </Suspense>
          <ToastContainer
            //position="bottom-right"
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
//this file 

export default App;
