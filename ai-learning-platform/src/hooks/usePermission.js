// 権限チェック用カスタムフック
import { useAuth } from './useAuth';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../utils/rbac';

export const usePermission = () => {
  const { user } = useAuth();
  
  const checkPermission = (permission) => {
    return hasPermission(user?.role, permission);
  };
  
  const checkAnyPermission = (permissions) => {
    return hasAnyPermission(user?.role, permissions);
  };
  
  const checkAllPermissions = (permissions) => {
    return hasAllPermissions(user?.role, permissions);
  };
  
  return {
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    userRole: user?.role
  };
};