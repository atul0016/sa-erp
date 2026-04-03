import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context';
import {
  BellIcon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  CalendarIcon,
  Bars3Icon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export function Header() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'light' ? 'dark' : 'light' });
  };

  // Close notification dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  const notifCount = state.notifications?.length || 0;

  // Fetch pending approval count
  useEffect(() => {
    const fetchApprovalCount = async () => {
      if (!state.user?.tenant_id) return;
      try {
        const roles = state.user.roles ? JSON.parse(state.user.roles) : [];
        const role = Array.isArray(roles) ? roles[0] : roles;
        const res = await window.electronAPI.approvals.getPendingCount(state.user.tenant_id, role);
        if (res.success && res.data) {
          setPendingApprovals(res.data.count);
        }
      } catch {
        // Approvals API may not be available
      }
    };
    fetchApprovalCount();
    const interval = setInterval(fetchApprovalCount, 30000);
    return () => clearInterval(interval);
  }, [state.user?.tenant_id]);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircleIcon className="h-4 w-4 text-success-500 flex-shrink-0" />;
      case 'error': return <ExclamationTriangleIcon className="h-4 w-4 text-danger-500 flex-shrink-0" />;
      case 'warning': return <ExclamationTriangleIcon className="h-4 w-4 text-warning-500 flex-shrink-0" />;
      default: return <InformationCircleIcon className="h-4 w-4 text-primary-500 flex-shrink-0" />;
    }
  };

  return (
    <header className="bg-white/90 dark:bg-surface-800/95 backdrop-blur-sm border-b border-surface-200 dark:border-surface-700 shadow-header sticky top-0 z-20">
      <div className="flex items-center justify-between h-14 px-3 sm:px-4 md:px-6">
        {/* Left - hamburger on mobile + search */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            className="lg:hidden p-2 -ml-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            {state.sidebarOpen ? (
              <XMarkIcon className="h-5 w-5 text-surface-600 dark:text-surface-300" />
            ) : (
              <Bars3Icon className="h-5 w-5 text-surface-600 dark:text-surface-300" />
            )}
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative group">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-16 py-2 text-sm border border-surface-200 dark:border-surface-600 rounded-lg
                  bg-surface-50 dark:bg-surface-700/50 text-surface-900 dark:text-surface-100
                  placeholder:text-surface-400
                  focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 dark:focus:border-primary-500
                  transition-all"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none
                px-1.5 py-0.5 text-[10px] font-medium text-surface-400
                bg-surface-100 dark:bg-surface-600 border border-surface-200 dark:border-surface-500 rounded">
                Ctrl K
              </kbd>
            </div>
          </div>

          {/* Mobile search button */}
          <button className="sm:hidden p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors" aria-label="Search">
            <MagnifyingGlassIcon className="h-5 w-5 text-surface-500" />
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Fiscal Year */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400 bg-surface-100 dark:bg-surface-700 px-2.5 py-1.5 rounded-lg">
            <CalendarIcon className="h-3.5 w-3.5" />
            <span className="font-medium">FY {state.fiscalYear}</span>
          </div>

          {/* Approval Badge */}
          <button
            onClick={() => navigate('/approvals')}
            className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg relative transition-colors"
            aria-label={`Approvals${pendingApprovals > 0 ? ` (${pendingApprovals} pending)` : ''}`}
            title="Approval Center"
          >
            <ShieldCheckIcon className="h-[18px] w-[18px] text-surface-500 dark:text-surface-400" />
            {pendingApprovals > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center
                bg-warning-500 text-white text-[10px] font-bold rounded-full px-1
                ring-2 ring-white dark:ring-surface-800 animate-pulse-soft">
                {pendingApprovals > 9 ? '9+' : pendingApprovals}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors"
            aria-label={state.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {state.theme === 'light' ? (
              <MoonIcon className="h-[18px] w-[18px] text-surface-500" />
            ) : (
              <SunIcon className="h-[18px] w-[18px] text-amber-400" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg relative transition-colors"
              aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} unread)` : ''}`}
              aria-expanded={notifOpen}
            >
              <BellIcon className="h-[18px] w-[18px] text-surface-500 dark:text-surface-400" />
              {notifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-danger-500 rounded-full ring-2 ring-white dark:ring-surface-800" />
              )}
            </button>

            {/* Notification dropdown */}
            {notifOpen && (
              <div className="absolute right-0 mt-1 w-80 max-h-96 overflow-y-auto scrollbar-thin
                bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700
                rounded-xl shadow-dropdown animate-scale-in origin-top-right z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-700">
                  <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100">Notifications</h3>
                  {notifCount > 0 && (
                    <span className="text-[10px] font-semibold bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400 px-1.5 py-0.5 rounded-full">
                      {notifCount}
                    </span>
                  )}
                </div>
                {notifCount === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <BellIcon className="h-8 w-8 text-surface-300 dark:text-surface-600 mx-auto mb-2" />
                    <p className="text-sm text-surface-400">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-surface-100 dark:divide-surface-700">
                    {state.notifications.map((notif: any) => (
                      <div key={notif.id} className="flex items-start gap-2.5 px-4 py-3 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
                        {getNotifIcon(notif.type)}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-surface-700 dark:text-surface-200 line-clamp-2">{notif.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Avatar */}
          <div className="hidden sm:flex items-center gap-2 ml-1">
            <div className="h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-semibold text-xs">
              {state.user?.first_name?.[0]}{state.user?.last_name?.[0]}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
