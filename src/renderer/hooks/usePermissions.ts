/**
 * SA ERP - Permission Hook
 * Provides role-based access control utilities to components
 */

import { useMemo, useCallback } from 'react';
import { useApp } from '../context';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessRoute,
  getUserLevel,
  resolvePermissions,
  SYSTEM_ROLES,
} from '../utils/rbac';

export function usePermissions() {
  const { state } = useApp();

  const userRoles = useMemo(() => {
    if (!state.user?.roles) return [];
    try {
      const parsed = JSON.parse(state.user.roles);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [state.user.roles];
    }
  }, [state.user?.roles]);

  const permissions = useMemo(() => resolvePermissions(userRoles), [userRoles]);
  
  const userLevel = useMemo(() => getUserLevel(userRoles), [userRoles]);

  const can = useCallback(
    (permission: string) => hasPermission(permissions, permission),
    [permissions]
  );

  const canAny = useCallback(
    (perms: string[]) => hasAnyPermission(permissions, perms),
    [permissions]
  );

  const canAll = useCallback(
    (perms: string[]) => hasAllPermissions(permissions, perms),
    [permissions]
  );

  const canRoute = useCallback(
    (route: string) => canAccessRoute(permissions, route),
    [permissions]
  );

  const isAdmin = useMemo(
    () => userRoles.includes('admin') || userRoles.includes('ceo') || permissions.includes('*'),
    [userRoles, permissions]
  );

  const isCEO = useMemo(
    () => userRoles.includes('ceo'),
    [userRoles]
  );

  const isManager = useMemo(
    () => userLevel <= 2,
    [userLevel]
  );

  const roleName = useMemo(() => {
    for (const roleId of userRoles) {
      const role = Object.values(SYSTEM_ROLES).find(r => r.id === roleId);
      if (role) return role.name;
    }
    return 'User';
  }, [userRoles]);

  return {
    permissions,
    userRoles,
    userLevel,
    roleName,
    can,
    canAny,
    canAll,
    canRoute,
    isAdmin,
    isCEO,
    isManager,
  };
}
