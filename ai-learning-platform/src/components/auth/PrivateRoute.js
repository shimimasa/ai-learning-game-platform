// プロテクトルートコンポーネント
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const PrivateRoute = ({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/login' 
}) => {
  const { user, loading, hasRole, hasAnyRole } = useAuth();
  const location = useLocation();

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
    // 現在のパスを保存してログイン後にリダイレクトできるようにする
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 役割制限がある場合
  if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    // アクセス権限がない場合は権限エラーページへ
    return <Navigate to="/unauthorized" replace />;
  }

  // 認証済みで権限もある場合は子コンポーネントを表示
  return children;
};

export default PrivateRoute;