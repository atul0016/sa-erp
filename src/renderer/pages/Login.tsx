import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { Button } from '../components/common';
import { BuildingOfficeIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export function Login() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(username, password);
    if (success) {
      navigate('/');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-slate-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 h-40 w-40 rounded-full bg-teal-200/30 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 h-56 w-56 rounded-full bg-cyan-200/30 blur-3xl"></div>
      </div>
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl mb-4 shadow-lg shadow-teal-500/20">
            <BuildingOfficeIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">SA ERP</h1>
          <p className="text-slate-600 mt-2">Simple operations platform for modern Indian businesses</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/90 dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200/80 p-8 backdrop-blur">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
            Welcome Back
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/35"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500/35"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                />
                <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">Remember me</span>
              </label>
              <a href="#" className="text-sm text-teal-700 hover:text-teal-600">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full py-3"
            >
              Sign In
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Demo Credentials:</p>
            <p className="text-sm font-mono text-slate-800 dark:text-slate-200">
              Username: admin | Password: admin123
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          Made in India 🇮🇳 | GST Compliant | MCA Audit Ready
        </p>
      </div>
    </div>
  );
}

