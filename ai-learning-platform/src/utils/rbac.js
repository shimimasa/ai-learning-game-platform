// 役割ベースのアクセス制御（RBAC）ユーティリティ
import { USER_ROLES } from '../constants/config';

// 権限定義
export const PERMISSIONS = {
  // ゲーム関連
  PLAY_GAMES: 'play_games',
  VIEW_GAME_STATS: 'view_game_stats',
  
  // 進捗関連
  VIEW_OWN_PROGRESS: 'view_own_progress',
  VIEW_ALL_PROGRESS: 'view_all_progress',
  VIEW_CHILD_PROGRESS: 'view_child_progress',
  
  // 管理関連
  MANAGE_GAMES: 'manage_games',
  MANAGE_USERS: 'manage_users',
  MANAGE_CONTENT: 'manage_content',
  MANAGE_AI_SETTINGS: 'manage_ai_settings',
  
  // 分析関連
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_REPORTS: 'export_reports',
  
  // 教師関連
  VIEW_STUDENT_LIST: 'view_student_list',
  CREATE_ASSIGNMENTS: 'create_assignments',
  GRADE_STUDENTS: 'grade_students'
};

// 役割と権限のマッピング
const ROLE_PERMISSIONS = {
  [USER_ROLES.STUDENT]: [
    PERMISSIONS.PLAY_GAMES,
    PERMISSIONS.VIEW_GAME_STATS,
    PERMISSIONS.VIEW_OWN_PROGRESS
  ],
  
  [USER_ROLES.TEACHER]: [
    PERMISSIONS.VIEW_STUDENT_LIST,
    PERMISSIONS.VIEW_ALL_PROGRESS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.CREATE_ASSIGNMENTS,
    PERMISSIONS.GRADE_STUDENTS,
    PERMISSIONS.PLAY_GAMES,
    PERMISSIONS.VIEW_GAME_STATS
  ],
  
  [USER_ROLES.PARENT]: [
    PERMISSIONS.VIEW_CHILD_PROGRESS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_REPORTS
  ],
  
  [USER_ROLES.ADMIN]: [
    // 管理者は全ての権限を持つ
    ...Object.values(PERMISSIONS)
  ]
};

// ユーザーが特定の権限を持っているかチェック
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

// ユーザーが複数の権限のいずれかを持っているかチェック
export const hasAnyPermission = (userRole, permissions) => {
  if (!userRole || !permissions || permissions.length === 0) return false;
  
  return permissions.some(permission => hasPermission(userRole, permission));
};

// ユーザーが全ての権限を持っているかチェック
export const hasAllPermissions = (userRole, permissions) => {
  if (!userRole || !permissions || permissions.length === 0) return false;
  
  return permissions.every(permission => hasPermission(userRole, permission));
};

// 役割に基づいてアクセス可能なルートを取得
export const getAccessibleRoutes = (userRole) => {
  const routes = {
    [USER_ROLES.STUDENT]: [
      '/student/dashboard',
      '/games',
      '/games/:id',
      '/profile',
      '/progress'
    ],
    
    [USER_ROLES.TEACHER]: [
      '/teacher/dashboard',
      '/students',
      '/students/:id',
      '/analytics',
      '/assignments',
      '/games',
      '/profile'
    ],
    
    [USER_ROLES.PARENT]: [
      '/parent/dashboard',
      '/children',
      '/children/:id/progress',
      '/reports',
      '/profile'
    ],
    
    [USER_ROLES.ADMIN]: [
      '/admin/dashboard',
      '/admin/users',
      '/admin/games',
      '/admin/content',
      '/admin/settings',
      '/admin/analytics',
      '/profile'
    ]
  };
  
  return routes[userRole] || [];
};

// 役割に基づいてデフォルトのリダイレクト先を取得
export const getDefaultRoute = (userRole) => {
  const defaultRoutes = {
    [USER_ROLES.STUDENT]: '/student/dashboard',
    [USER_ROLES.TEACHER]: '/teacher/dashboard',
    [USER_ROLES.PARENT]: '/parent/dashboard',
    [USER_ROLES.ADMIN]: '/admin/dashboard'
  };
  
  return defaultRoutes[userRole] || '/';
};

// 役割の表示名を取得
export const getRoleDisplayName = (role) => {
  const displayNames = {
    [USER_ROLES.STUDENT]: '学習者',
    [USER_ROLES.TEACHER]: '教師',
    [USER_ROLES.PARENT]: '保護者',
    [USER_ROLES.ADMIN]: '管理者'
  };
  
  return displayNames[role] || role;
};