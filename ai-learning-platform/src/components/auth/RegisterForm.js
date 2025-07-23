// 会員登録フォームコンポーネント
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { isValidEmail } from '../../utils/helpers';
import { USER_ROLES, SUBJECTS } from '../../constants/config';

const RegisterForm = ({ onSuccess, onLoginClick, defaultRole = USER_ROLES.STUDENT }) => {
  const { register, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: defaultRole,
    grade: '',
    subjects: []
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

  // 科目選択の変更処理
  const handleSubjectChange = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  // バリデーション
  const validate = () => {
    const errors = {};
    
    if (!formData.name) {
      errors.name = '名前を入力してください';
    }
    
    if (!formData.email) {
      errors.email = 'メールアドレスを入力してください';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'メールアドレスの形式が正しくありません';
    }
    
    if (!formData.password) {
      errors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 6) {
      errors.password = 'パスワードは6文字以上で設定してください';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'パスワード（確認）を入力してください';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'パスワードが一致しません';
    }
    
    if (formData.role === USER_ROLES.STUDENT && !formData.grade) {
      errors.grade = '学年を選択してください';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // フォーム送信処理
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    const userData = {
      name: formData.name,
      role: formData.role,
      grade: formData.role === USER_ROLES.STUDENT ? parseInt(formData.grade) : null,
      subjects: formData.subjects
    };
    
    const result = await register(formData.email, formData.password, userData);
    setIsSubmitting(false);
    
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="register-form-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h2 className="form-title">新規登録</h2>
        
        {error && (
          <div className="error-message">
            {error.message}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            名前 <span className="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`form-input ${validationErrors.name ? 'error' : ''}`}
            placeholder="山田太郎"
            disabled={isSubmitting}
          />
          {validationErrors.name && (
            <span className="field-error">{validationErrors.name}</span>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            メールアドレス <span className="required">*</span>
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
            パスワード <span className="required">*</span>
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`form-input ${validationErrors.password ? 'error' : ''}`}
            placeholder="6文字以上"
            disabled={isSubmitting}
          />
          {validationErrors.password && (
            <span className="field-error">{validationErrors.password}</span>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            パスワード（確認） <span className="required">*</span>
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
            placeholder="パスワードを再入力"
            disabled={isSubmitting}
          />
          {validationErrors.confirmPassword && (
            <span className="field-error">{validationErrors.confirmPassword}</span>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="role" className="form-label">
            ユーザー種別 <span className="required">*</span>
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="form-input"
            disabled={isSubmitting}
          >
            <option value={USER_ROLES.STUDENT}>学習者</option>
            <option value={USER_ROLES.TEACHER}>教師</option>
            <option value={USER_ROLES.PARENT}>保護者</option>
          </select>
        </div>
        
        {formData.role === USER_ROLES.STUDENT && (
          <>
            <div className="form-group">
              <label htmlFor="grade" className="form-label">
                学年 <span className="required">*</span>
              </label>
              <select
                id="grade"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className={`form-input ${validationErrors.grade ? 'error' : ''}`}
                disabled={isSubmitting}
              >
                <option value="">選択してください</option>
                {[1, 2, 3, 4, 5, 6].map(g => (
                  <option key={g} value={g}>小学{g}年生</option>
                ))}
                {[1, 2, 3].map(g => (
                  <option key={`j${g}`} value={g + 6}>中学{g}年生</option>
                ))}
              </select>
              {validationErrors.grade && (
                <span className="field-error">{validationErrors.grade}</span>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">興味のある科目</label>
              <div className="checkbox-group">
                {Object.entries(SUBJECTS).map(([key, value]) => (
                  <label key={key} className="checkbox-label">
                    <input
                      type="checkbox"
                      value={value}
                      checked={formData.subjects.includes(value)}
                      onChange={() => handleSubjectChange(value)}
                      disabled={isSubmitting}
                    />
                    <span>{value === 'mathematics' ? '算数・数学' :
                          value === 'science' ? '理科' :
                          value === 'language' ? '国語' :
                          value === 'history' ? '社会・歴史' :
                          value === 'geography' ? '地理' : value}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
        
        <button
          type="submit"
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? '登録中...' : '登録する'}
        </button>
        
        <div className="form-footer">
          <p>
            すでにアカウントをお持ちの方は
            <button
              type="button"
              onClick={onLoginClick}
              className="link-button"
            >
              ログイン
            </button>
          </p>
        </div>
      </form>
      
      <style jsx>{`
        .register-form-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .register-form {
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
        
        .required {
          color: #f44336;
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
        
        .checkbox-group {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 8px;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 14px;
          color: #666;
        }
        
        .checkbox-label input[type="checkbox"] {
          cursor: pointer;
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
          margin-top: 24px;
        }
        
        .submit-button:hover {
          background-color: #45a049;
        }
        
        .submit-button:disabled {
          background-color: #cccccc;
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

export default RegisterForm;