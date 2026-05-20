/**
 * Role-based access control helpers
 */

export const ROLE_PERMISSIONS = {
  admin: {
    canViewAnalytics: true,
    canViewDashboard: true,
    canViewMap: true,
    canViewAnomalyList: true,
    canApproveUsers: true,
    canTriggerDetection: true,
  },
  manager: {
    canViewAnalytics: false,
    canViewDashboard: true,
    canViewMap: true,
    canViewAnomalyList: true,
    canTriggerDetection: false,
  },
  viewer: {
    canViewAnalytics: false,
    canViewDashboard: false,
    canViewMap: true,
    canViewAnomalyList: true,
    canTriggerDetection: false,
  },
};

export function getUserPermissions(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer;
}

export function hasPermission(role, permission) {
  const perms = getUserPermissions(role);
  return perms[permission] || false;
}