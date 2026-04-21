import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';

const Login = ({ setToken, setUserId }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username,
        password,
      });

      const { token, userId } = response.data;
      localStorage.setItem('token', token);
      if (Number.isFinite(Number(userId))) {
        localStorage.setItem('userId', String(userId));
        setUserId(String(userId));
      }
      setToken(token);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      toast.error('Google sign-in failed. Please try again.');
      return;
    }

    try {
      const idToken = credentialResponse.credential;
      console.log('Google ID token:', idToken);

      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/google`, {
        idToken,
      });

      const payload = response.data || {};
      const { token, user } = payload;
      if (!token) {
        toast.error('Google sign-in failed. Please try again.');
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
        localStorage.setItem('googleUser', JSON.stringify({
          name: resolvedProfile?.name || 'Google User',
          picture: resolvedProfile?.picture || '',
        }));
      }

      localStorage.setItem('token', token);
      if (Number.isFinite(Number(user?.id))) {
        localStorage.setItem('userId', String(user.id));
        setUserId(String(user.id));
      }
      setToken(token);
      toast.success('Signed in with Google.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Google login error:', error);
      toast.error(error.response?.data?.message || 'Google sign-in failed. Please try again.');
    }
  };

  const handleGoogleLoginError = () => {
    toast.error('Google sign-in failed. Please try again.');
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
            <div className="w-full">
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
                width="250"
              />
            </div>
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