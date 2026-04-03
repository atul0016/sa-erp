/**
 * SA ERP - Access Denied Component
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

export function AccessDenied() {
  const navigate = useNavigate();
  const { roleName } = usePermissions();

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
      <div className="card p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">
          Access Restricted
        </h2>
        <p className="text-sm text-surface-500 mb-2">
          You don't have permission to access this page.
        </p>
        <p className="text-xs text-surface-400 mb-6">
          Current role: <span className="font-medium text-surface-600 dark:text-surface-300">{roleName}</span>
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/')} className="btn-primary">
            Go to Dashboard
          </button>
          <button onClick={() => navigate(-1)} className="btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
