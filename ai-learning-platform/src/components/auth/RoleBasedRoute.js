// 役割ベースのルートコンポーネント
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { USER_ROLES } from '../../constants/config';

const RoleBasedRoute = ({ children }) => {
  const { user, loading, hasRole } = useAuth();

  // 認証状態の読み込み中
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <style jsx>{`
          .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
          }
          
          .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #4CAF50;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 未認証の場合
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 役割に基づいて適切なダッシュボードにリダイレクト
  if (hasRole(USER_ROLES.STUDENT)) {
    return <Navigate to="/student/dashboard" replace />;
  } else if (hasRole(USER_ROLES.TEACHER)) {
    return <Navigate to="/teacher/dashboard" replace />;
  } else if (hasRole(USER_ROLES.PARENT)) {
    return <Navigate to="/parent/dashboard" replace />;
  } else if (hasRole(USER_ROLES.ADMIN)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // デフォルトは学習者ダッシュボード
  return <Navigate to="/student/dashboard" replace />;
};

export default RoleBasedRoute;