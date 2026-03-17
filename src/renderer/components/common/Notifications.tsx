import React from 'react';
import { useApp } from '../../context';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export function Notifications() {
  const { state, dispatch } = useApp();

  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };

  if (state.notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {state.notifications.map((notification) => {
        const Icon = icons[notification.type];
        return (
          <div
            key={notification.id}
            className={`flex items-center p-4 rounded-lg border shadow-lg ${colors[notification.type]} animate-slide-in`}
          >
            <Icon className={`h-5 w-5 mr-3 ${iconColors[notification.type]}`} />
            <span className="flex-1">{notification.message}</span>
            <button
              onClick={() =>
                dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id })
              }
              className="ml-4 hover:opacity-70"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
