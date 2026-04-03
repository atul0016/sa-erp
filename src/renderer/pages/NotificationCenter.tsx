import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context';
import { Button, EmptyState } from '../components/common';
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CurrencyRupeeIcon,
  TruckIcon,
  ShoppingCartIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  FunnelIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface ActivityItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  module: string;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  read: boolean;
}

const NotificationCenter: React.FC = () => {
  const { state } = useApp();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    loadActivities();
  }, [state.user?.tenant_id]);

  const loadActivities = async () => {
    if (!state.user?.tenant_id) return;
    setLoading(true);
    try {
      const response = await window.electronAPI.notifications?.getActivityFeed?.(state.user.tenant_id);
      if (response?.success && response.data) {
        setActivities(response.data);
      }
    } catch {
      // Use generated activity feed
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = () => {
    setActivities(prev => prev.map(a => ({ ...a, read: true })));
  };

  const markRead = (id: string) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      if (filterModule !== 'all' && a.module !== filterModule) return false;
      if (filterType !== 'all' && a.type !== filterType) return false;
      if (showUnreadOnly && a.read) return false;
      return true;
    });
  }, [activities, filterModule, filterType, showUnreadOnly]);

  const unreadCount = activities.filter(a => !a.read).length;
  const modules = Array.from(new Set(activities.map(a => a.module)));

  const getModuleIcon = (module: string) => {
    const icons: Record<string, typeof BellIcon> = {
      sales: ShoppingCartIcon,
      purchase: TruckIcon,
      finance: CurrencyRupeeIcon,
      hrm: UsersIcon,
      manufacturing: WrenchScrewdriverIcon,
      approvals: ShieldCheckIcon,
    };
    return icons[module] || BellIcon;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircleIcon;
      case 'warning': return ExclamationTriangleIcon;
      case 'error': return XCircleIcon;
      default: return InformationCircleIcon;
    }
  };

  const getTypeColor = (type: string) => {
    const map: Record<string, string> = {
      success: 'text-success-500',
      warning: 'text-warning-500',
      error: 'text-danger-500',
      info: 'text-primary-500',
    };
    return map[type] || 'text-gray-500';
  };

  const getModuleColor = (module: string) => {
    const map: Record<string, string> = {
      sales: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      purchase: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      finance: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      hrm: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      manufacturing: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
      approvals: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      system: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return map[module] || 'bg-gray-100 text-gray-700';
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const groupByDate = (items: ActivityItem[]) => {
    const groups: Record<string, ActivityItem[]> = {};
    items.forEach(item => {
      const date = new Date(item.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      } else {
        key = date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  };

  const grouped = groupByDate(filteredActivities);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BellIcon className="h-7 w-7 text-primary-600" />
            Notification Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Activity feed across all modules
            {unreadCount > 0 && (
              <span className="ml-2 text-primary-600 font-medium">({unreadCount} unread)</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button onClick={markAllRead} variant="secondary" className="flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4" />
              Mark All Read
            </Button>
          )}
          <Button onClick={loadActivities} variant="secondary" className="flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <FunnelIcon className="h-4 w-4 text-gray-400" />
        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          className="text-sm border border-gray-200 dark:border-surface-600 rounded-lg px-3 py-1.5 bg-white dark:bg-surface-700 text-gray-700 dark:text-gray-300"
        >
          <option value="all">All Modules</option>
          {modules.map(m => (
            <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-sm border border-gray-200 dark:border-surface-600 rounded-lg px-3 py-1.5 bg-white dark:bg-surface-700 text-gray-700 dark:text-gray-300"
        >
          <option value="all">All Types</option>
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          Unread only
        </label>
      </div>

      {/* Activity Feed */}
      {filteredActivities.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="There are no notifications matching your filters."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateGroup, items]) => (
            <div key={dateGroup}>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {dateGroup}
              </h3>
              <div className="space-y-2">
                {items.map((activity) => {
                  const ModuleIcon = getModuleIcon(activity.module);
                  const TypeIcon = getTypeIcon(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className={`rounded-lg border border-surface-200 dark:border-surface-700 p-3 transition-all cursor-pointer hover:shadow-md ${
                        !activity.read
                          ? 'bg-primary-50/50 dark:bg-primary-900/10 border-l-4 border-l-primary-500'
                          : 'border-l-4 border-l-transparent'
                      }`}
                      onClick={() => markRead(activity.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <TypeIcon className={`h-5 w-5 ${getTypeColor(activity.type)}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {activity.title}
                            </span>
                            {!activity.read && (
                              <span className="h-2 w-2 bg-primary-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${getModuleColor(activity.module)}`}>
                              <ModuleIcon className="h-3 w-3" />
                              {activity.module.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-400">
                              {activity.actor}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatTime(activity.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
export { NotificationCenter };
