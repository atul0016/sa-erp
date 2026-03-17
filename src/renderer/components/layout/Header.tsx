import React from 'react';
import { useApp } from '../../context';
import {
  BellIcon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

export function Header() {
  const { state, dispatch } = useApp();

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'light' ? 'dark' : 'light' });
  };

  return (
    <header className="bg-white/85 dark:bg-slate-800/90 backdrop-blur border-b border-slate-200/80 dark:border-slate-700 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search anything in SA ERP..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300/90 dark:border-slate-600 rounded-xl bg-slate-50/80 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600/35"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-slate-400">
              Ctrl+K
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:block text-right mr-2">
            <p className="text-xs uppercase tracking-wider text-slate-500">Workspace</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">SA ERP</p>
          </div>

          {/* Fiscal Year */}
          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-700 px-3 py-1.5 rounded-lg">
            <CalendarIcon className="h-5 w-5" />
            <span>FY {state.fiscalYear}</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {state.theme === 'light' ? (
              <MoonIcon className="h-5 w-5 text-slate-600" />
            ) : (
              <SunIcon className="h-5 w-5 text-yellow-400" />
            )}
          </button>

          {/* Notifications */}
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg relative transition-colors">
            <BellIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Avatar */}
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
              {state.user?.first_name?.[0]}
              {state.user?.last_name?.[0]}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
