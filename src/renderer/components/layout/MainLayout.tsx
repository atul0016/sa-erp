import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Notifications } from '../common/Notifications';
import { useApp } from '../../context';

export function MainLayout() {
  const { state } = useApp();

  return (
    <div className={`flex min-h-screen ${state.theme === 'dark' ? 'dark' : ''}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col bg-slate-50/70 dark:bg-slate-900 transition-colors duration-300">
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="page-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      <Notifications />
    </div>
  );
}
