import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';
import { Wallet } from 'lucide-react';


const Login = ({ setToken, setUserId, isModal, onLoginSuccess, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const hasInitialized = useRef(false);
  const googleButton = useRef(null);

  const handleGoogleLoginSuccess = async (response) => {
    if (!response?.credential) {
      toast.error('Google sign-in failed. Please try again.');
      return;
    }

    try {
      console.log('Google ID token received, authenticating with backend...');

      const apiResponse = await api.post('/auth/google', {
        idToken: response.credential,
      });

      const payload = apiResponse.data || {};
      
      const token = payload.token || payload.accessToken;
      const user = payload.user;

      if (!token) {
        toast.error('Google authentication failed: Token missing from server response.');
        return;
      }

      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userProfile', JSON.stringify(user));
        if (user.totalIncome !== undefined && user.totalIncome !== null) {
          localStorage.setItem('userIncome', String(user.totalIncome));
        }
      }

      const resolvedProfile = user
        ? { name: user.fullName, picture: user.profilePictureUrl }
        : null;

      if (resolvedProfile?.name || resolvedProfile?.picture) {
        localStorage.setItem(
          'googleUser',
          JSON.stringify({
            name: resolvedProfile?.name || 'Google User',
            picture: resolvedProfile?.picture || '',
          })
        );
      }

      localStorage.setItem('token', token);
      
      const resolvedUserId = user?.id || payload.userId;
      if (Number.isFinite(Number(resolvedUserId))) {
        localStorage.setItem('userId', String(resolvedUserId));
        if (setUserId) setUserId(String(resolvedUserId));
      }

      if (setToken) setToken(token);

      toast.success('Signed in securely with Google.');

      if (isModal && onLoginSuccess) {
        onLoginSuccess();
      } else {
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Google sign-in failed on the server. Please try again.'
      );
    }
  };

  useEffect(() => {
    if (hasInitialized.current) return;

    const initializeGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: '884510669054-acldripspk9ucf1kp50ad5qlv2l0fv6a.apps.googleusercontent.com',
          callback: handleGoogleLoginSuccess,
        });

        if (googleButton.current) {
          window.google.accounts.id.renderButton(googleButton.current, {
            theme: 'outline',
            size: 'large',
            width: '250',
          });
        }

        hasInitialized.current = true;
      }
    };

    if (!window.google?.accounts?.id) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    } else {
      initializeGoogle();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });

      const { token, accessToken, userId } = response.data;
      const jwtToken = token || accessToken;

      localStorage.setItem('token', jwtToken);
      if (Number.isFinite(Number(userId))) {
        localStorage.setItem('userId', String(userId));
        if (setUserId) setUserId(String(userId));
      }
      if (setToken) setToken(jwtToken);

      toast.success('Login successful!');
      if (isModal && onLoginSuccess) {
        onLoginSuccess();
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const containerClass = isModal
    ? "relative w-full max-w-md mx-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-8 shadow-2xl transition-all duration-200"
    : "min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8";

  const wrapperClass = isModal ? "space-y-6" : "max-w-md w-full space-y-8";

  return (
    <div className={containerClass}>
      {isModal && onClose && (
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <div className={wrapperClass}>
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-600 text-white mb-4 shadow-lg shadow-indigo-600/30">
            <Wallet className="h-7 w-7" />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
            Enter your credentials to access your expense tracker
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1 block">
                Username / Email
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 rounded-xl p-3 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1 block">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 rounded-xl p-3 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-slate-800 px-3 text-slate-400 dark:text-slate-500 text-xs uppercase font-semibold">OR</span>
            </div>
          </div>
          <div className="w-full flex justify-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-xl transition-colors">
            <div ref={googleButton} className="w-full flex justify-center"></div>
          </div>
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Don't have an account?{' '}
              <Link to="/register" onClick={onClose} className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                Sign up here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;