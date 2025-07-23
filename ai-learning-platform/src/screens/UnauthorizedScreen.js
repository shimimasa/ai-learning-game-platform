// 権限エラー画面コンポーネント
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const UnauthorizedScreen = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    if (user) {
      // ユーザーの役割に基づいてホームにリダイレクト
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <div className="icon-container">
          <svg className="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h1 className="title">アクセス権限がありません</h1>
        
        <p className="message">
          申し訳ございませんが、このページへのアクセス権限がありません。
        </p>
        
        <div className="actions">
          <button onClick={handleGoBack} className="action-button secondary">
            前のページに戻る
          </button>
          <button onClick={handleGoHome} className="action-button primary">
            ホームに戻る
          </button>
        </div>
        
        {user && (
          <button onClick={handleLogout} className="logout-link">
            別のアカウントでログイン
          </button>
        )}
      </div>
      
      <style jsx>{`
        .unauthorized-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f5;
          padding: 20px;
        }
        
        .unauthorized-content {
          background: white;
          padding: 48px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 500px;
          width: 100%;
        }
        
        .icon-container {
          margin-bottom: 24px;
        }
        
        .warning-icon {
          width: 64px;
          height: 64px;
          color: #ff9800;
          margin: 0 auto;
        }
        
        .title {
          font-size: 24px;
          color: #333;
          margin-bottom: 16px;
          font-weight: 600;
        }
        
        .message {
          color: #666;
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        
        .actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 24px;
        }
        
        .action-button {
          padding: 12px 24px;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          border: none;
        }
        
        .action-button.primary {
          background-color: #4CAF50;
          color: white;
        }
        
        .action-button.primary:hover {
          background-color: #45a049;
        }
        
        .action-button.secondary {
          background-color: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
        }
        
        .action-button.secondary:hover {
          background-color: #e8e8e8;
        }
        
        .logout-link {
          background: none;
          border: none;
          color: #4CAF50;
          text-decoration: underline;
          cursor: pointer;
          font-size: 14px;
          padding: 0;
        }
        
        .logout-link:hover {
          color: #45a049;
        }
        
        @media (max-width: 600px) {
          .unauthorized-content {
            padding: 32px 24px;
          }
          
          .actions {
            flex-direction: column;
            width: 100%;
          }
          
          .action-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default UnauthorizedScreen;