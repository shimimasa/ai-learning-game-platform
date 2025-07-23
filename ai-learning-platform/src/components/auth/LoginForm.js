// ログインフォームコンポーネント
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { isValidEmail } from '../../utils/helpers';

const LoginForm = ({ onSuccess, onRegisterClick }) => {
  const { login, loginWithGoogle, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 入力値の変更処理
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // エラーをクリア
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    if (error) {
      clearError();
    }
  };

  // バリデーション
  const validate = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'メールアドレスを入力してください';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'メールアドレスの形式が正しくありません';
    }
    
    if (!formData.password) {
      errors.password = 'パスワードを入力してください';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // フォーム送信処理
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    const result = await login(formData.email, formData.password);
    setIsSubmitting(false);
    
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  // Googleログイン処理
  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    const result = await loginWithGoogle();
    setIsSubmitting(false);
    
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="login-form-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2 className="form-title">ログイン</h2>
        
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
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`form-input ${validationErrors.email ? 'error' : ''}`}
            placeholder="example@email.com"
            disabled={isSubmitting}
          />
          {validationErrors.email && (
            <span className="field-error">{validationErrors.email}</span>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            パスワード
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`form-input ${validationErrors.password ? 'error' : ''}`}
            placeholder="パスワード"
            disabled={isSubmitting}
          />
          {validationErrors.password && (
            <span className="field-error">{validationErrors.password}</span>
          )}
        </div>
        
        <button
          type="submit"
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'ログイン中...' : 'ログイン'}
        </button>
        
        <div className="divider">
          <span>または</span>
        </div>
        
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="google-login-button"
          disabled={isSubmitting}
        >
          Googleでログイン
        </button>
        
        <div className="form-footer">
          <p>
            アカウントをお持ちでない方は
            <button
              type="button"
              onClick={onRegisterClick}
              className="link-button"
            >
              新規登録
            </button>
          </p>
        </div>
      </form>
      
      <style jsx>{`
        .login-form-container {
          max-width: 400px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .login-form {
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
        
        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        
        .form-group {
          margin-bottom: 16px;
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
        }
        
        .submit-button:hover {
          background-color: #45a049;
        }
        
        .submit-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .divider {
          text-align: center;
          margin: 20px 0;
          position: relative;
        }
        
        .divider span {
          background: white;
          padding: 0 10px;
          color: #999;
          font-size: 14px;
        }
        
        .divider:before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #ddd;
          z-index: -1;
        }
        
        .google-login-button {
          width: 100%;
          padding: 12px;
          background-color: #fff;
          color: #333;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .google-login-button:hover {
          background-color: #f5f5f5;
        }
        
        .google-login-button:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
        
        .form-footer {
          margin-top: 20px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        
        .link-button {
          background: none;
          border: none;
          color: #4CAF50;
          text-decoration: underline;
          cursor: pointer;
          font-size: 14px;
          padding: 0;
          margin-left: 4px;
        }
        
        .link-button:hover {
          color: #45a049;
        }
      `}</style>
    </div>
  );
};

export default LoginForm;