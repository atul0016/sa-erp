import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Notifications } from '../common/Notifications';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { useApp } from '../../context';

export function MainLayout() {
  const { state, dispatch } = useApp();

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && state.sidebarOpen) {
        dispatch({ type: 'TOGGLE_SIDEBAR' });
      }
    };
    // Only run on mount for initial mobile detection
    if (window.innerWidth < 1024 && state.sidebarOpen) {
      dispatch({ type: 'TOGGLE_SIDEBAR' });
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`flex min-h-screen ${state.theme === 'dark' ? 'dark' : ''}`}>
      {/* Mobile overlay */}
      {state.sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar - fixed on mobile, static on desktop */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        transform transition-transform duration-300 ease-in-out
        ${state.sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 bg-surface-50 dark:bg-surface-900 transition-colors duration-200">
        <Header />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto scrollbar-thin">
          <ErrorBoundary>
            <div className="page-fade-in max-w-[1600px] mx-auto">
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>
      </div>
      <Notifications />
    </div>
  );
}
