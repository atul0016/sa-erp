import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { Button } from '../components/common';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const DEMO_ROLES = [
  { label: 'Admin', username: 'admin', password: 'admin123' },
  { label: 'CEO', username: 'ceo', password: 'ceo12345' },
  { label: 'Sales Manager', username: 'sales_mgr', password: 'sales123' },
  { label: 'Accountant', username: 'accountant', password: 'acc12345' },
  { label: 'HR Manager', username: 'hr_mgr', password: 'hrm12345' },
  { label: 'Viewer', username: 'viewer', password: 'view1234' },
];

export function Login() {
  const navigate = useNavigate();
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    const success = await login(username, password);
    if (success) navigate('/');
    setLoading(false);
  };

  const fillDemo = (role: typeof DEMO_ROLES[number]) => {
    setUsername(role.username);
    setPassword(role.password);
  };

  return (
    <div className="min-h-screen flex bg-surface-50 dark:bg-surface-900">
      {/* Left - branding panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 items-center justify-center p-12">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary-500/20 blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-accent-500/10 blur-3xl translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative z-10 max-w-md text-white">
          <div className="h-14 w-14 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center mb-8">
            <span className="text-2xl font-bold">SA</span>
          </div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">Enterprise Resource Planning</h2>
          <p className="text-primary-200 text-lg mb-8 leading-relaxed">
            Complete business management platform built for modern Indian enterprises. GST-compliant, audit-ready, and production-proven.
          </p>
          <div className="space-y-3">
            {['Multi-Module ERP Suite', 'Role-Based Access Control', 'GST & TDS Automation', 'Real-Time Analytics'].map(feature => (
              <div key={feature} className="flex items-center gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-accent-400 flex-shrink-0" />
                <span className="text-primary-100">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - login form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary-600 mb-3">
              <span className="text-white font-bold text-lg">SA</span>
            </div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">SA ERP</h1>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-card border border-surface-200 dark:border-surface-700 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-1">Sign in</h2>
            <p className="text-sm text-surface-400 mb-6">Enter your credentials to access the dashboard</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input"
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pr-10"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeSlashIcon className="h-4.5 w-4.5" /> : <EyeIcon className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500/30" />
                  <span className="text-sm text-surface-500">Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 text-sm font-semibold"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Demo roles */}
            <div className="mt-6 pt-5 border-t border-surface-100 dark:border-surface-700">
              <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-3">Quick demo access</p>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_ROLES.map(role => (
                  <button
                    key={role.label}
                    type="button"
                    onClick={() => fillDemo(role)}
                    className="px-2.5 py-1 text-xs font-medium rounded-md transition-colors
                      bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300
                      hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-900/20 dark:hover:text-primary-400"
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-surface-400 mt-6">
            Made in India · GST Compliant · MCA Audit Ready
          </p>
        </div>
      </div>
    </div>
  );
}

