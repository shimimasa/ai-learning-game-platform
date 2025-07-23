// パスワードリセットフォームコンポーネント
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { isValidEmail } from '../../utils/helpers';

const PasswordResetForm = ({ onSuccess, onBackToLogin }) => {
  const { resetPassword, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 入力値の変更処理
  const handleChange = (e) => {
    setEmail(e.target.value);
    
    // エラーをクリア
    if (validationError) {
      setValidationError('');
    }
    if (error) {
      clearError();
    }
  };

  // バリデーション
  const validate = () => {
    if (!email) {
      setValidationError('メールアドレスを入力してください');
      return false;
    }
    
    if (!isValidEmail(email)) {
      setValidationError('メールアドレスの形式が正しくありません');
      return false;
    }
    
    return true;
  };

  // フォーム送信処理
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    const result = await resetPassword(email);
    setIsSubmitting(false);
    
    if (result.success) {
      setIsSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <div className="password-reset-form-container">
      <div className="password-reset-form">
        <h2 className="form-title">パスワードリセット</h2>
        
        {isSuccess ? (
          <div className="success-container">
            <div className="success-message">
              <svg className="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3>メールを送信しました</h3>
              <p>
                パスワードリセット用のリンクを含むメールを送信しました。
                メールボックスをご確認ください。
              </p>
            </div>
            <button
              onClick={onBackToLogin}
              className="back-button"
            >
              ログイン画面に戻る
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="form-description">
              登録済みのメールアドレスを入力してください。
              パスワードリセット用のリンクをお送りします。
            </p>
            
            {error && (
              <div className="error-message">
                {error.message}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                メールアドレス
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleChange}
                className={`form-input ${validationError ? 'error' : ''}`}
                placeholder="example@email.com"
                disabled={isSubmitting}
              />
              {validationError && (
                <span className="field-error">{validationError}</span>
              )}
            </div>
            
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? '送信中...' : 'リセットリンクを送信'}
            </button>
            
            <button
              type="button"
              onClick={onBackToLogin}
              className="link-button"
            >
              ログイン画面に戻る
            </button>
          </form>
        )}
      </div>
      
      <style jsx>{`
        .password-reset-form-container {
          max-width: 400px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .password-reset-form {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .form-title {
          text-align: center;
          margin-bottom: 24px;
          font-size: 24px;
          color: #333;
        }
        
        .form-description {
          color: #666;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        
        .success-container {
          text-align: center;
        }
        
        .success-message {
          margin-bottom: 24px;
        }
        
        .success-icon {
          width: 64px;
          height: 64px;
          color: #4CAF50;
          margin: 0 auto 16px;
        }
        
        .success-message h3 {
          color: #333;
          margin-bottom: 12px;
          font-size: 20px;
        }
        
        .success-message p {
          color: #666;
          font-size: 14px;
          line-height: 1.6;
        }
        
        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #555;
        }
        
        .form-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
          transition: border-color 0.3s;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #4CAF50;
        }
        
        .form-input.error {
          border-color: #f44336;
        }
        
        .form-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
        
        .field-error {
          display: block;
          margin-top: 4px;
          color: #f44336;
          font-size: 12px;
        }
        
        .submit-button {
          width: 100%;
          padding: 12px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
          margin-bottom: 16px;
        }
        
        .submit-button:hover {
          background-color: #45a049;
        }
        
        .submit-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .back-button {
          padding: 12px 24px;
          background-color: #f5f5f5;
          color: #333;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .back-button:hover {
          background-color: #e8e8e8;
        }
        
        .link-button {
          width: 100%;
          background: none;
          border: none;
          color: #4CAF50;
          text-decoration: underline;
          cursor: pointer;
          font-size: 14px;
          padding: 8px;
          text-align: center;
        }
        
        .link-button:hover {
          color: #45a049;
        }
      `}</style>
    </div>
  );
};

export default PasswordResetForm;