import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';

const Login = ({ setToken, setUserId }) => {
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
      
      // Support both "token" and "accessToken" response keys
      const token = payload.token || payload.accessToken;
      const user = payload.user;

      if (!token) {
        toast.error('Google authentication failed: Token missing from server response.');
        return;
      }

      // 1. Store user and profile payload in LocalStorage
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

      // 2. Persist Auth Token and User ID
      localStorage.setItem('token', token);
      
      const resolvedUserId = user?.id || payload.userId;
      if (Number.isFinite(Number(resolvedUserId))) {
        localStorage.setItem('userId', String(resolvedUserId));
        if (setUserId) setUserId(String(resolvedUserId));
      }

      if (setToken) setToken(token);

      toast.success('Signed in securely with Google.');

      // 3. Force redirection to Dashboard
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);

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
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your credentials to access your expense tracker
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 px-2 text-gray-500">OR</span>
            </div>
          </div>
          <div className="w-full flex justify-center">
            <div ref={googleButton} className="w-full flex justify-center"></div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
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