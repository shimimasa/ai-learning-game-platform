// 認証コンテキスト
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/auth/authService';
import { storage } from '../utils/helpers';
import { STORAGE_KEYS } from '../constants/config';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 初期化時に認証状態を確認
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((authUser) => {
      if (authUser) {
        setUser(authUser);
        // ユーザー情報をローカルストレージに保存
        storage.set(STORAGE_KEYS.USER_DATA, {
          uid: authUser.uid || authUser.id,
          email: authUser.email,
          name: authUser.name || authUser.displayName,
          role: authUser.role,
          photoURL: authUser.photoURL
        });
      } else {
        setUser(null);
        storage.remove(STORAGE_KEYS.USER_DATA);
      }
      setLoading(false);
    });

    // クリーンアップ
    return () => unsubscribe();
  }, []);

  // ユーザー登録
  const register = async (email, password, userData = {}) => {
    try {
      setLoading(true);
      setError(null);
      const { user, error } = await authService.register(email, password, userData);
      if (error) {
        setError(error);
        return { success: false, error };
      }
      return { success: true, user };
    } catch (err) {
      const error = { message: 'Registration failed' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // ログイン
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const { user, error } = await authService.login(email, password);
      if (error) {
        setError(error);
        return { success: false, error };
      }
      return { success: true, user };
    } catch (err) {
      const error = { message: 'Login failed' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // Googleログイン
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      const { user, error } = await authService.loginWithGoogle();
      if (error) {
        setError(error);
        return { success: false, error };
      }
      return { success: true, user };
    } catch (err) {
      const error = { message: 'Google login failed' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // ログアウト
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await authService.logout();
      if (error) {
        setError(error);
        return { success: false, error };
      }
      storage.remove(STORAGE_KEYS.USER_DATA);
      return { success: true };
    } catch (err) {
      const error = { message: 'Logout failed' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // パスワードリセット
  const resetPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await authService.resetPassword(email);
      if (error) {
        setError(error);
        return { success: false, error };
      }
      return { success: true };
    } catch (err) {
      const error = { message: 'Password reset failed' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // ユーザー情報更新
  const updateUserData = async (data) => {
    if (!user) {
      const error = { message: 'No user logged in' };
      setError(error);
      return { success: false, error };
    }

    try {
      setLoading(true);
      setError(null);
      const userId = user.uid || user.id;
      const { error } = await authService.updateUserData(userId, data);
      if (error) {
        setError(error);
        return { success: false, error };
      }
      
      // ローカルのユーザー情報も更新
      setUser(prevUser => ({ ...prevUser, ...data }));
      const storedUser = storage.get(STORAGE_KEYS.USER_DATA);
      if (storedUser) {
        storage.set(STORAGE_KEYS.USER_DATA, { ...storedUser, ...data });
      }
      
      return { success: true };
    } catch (err) {
      const error = { message: 'Update failed' };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  // 役割チェック関数
  const hasRole = (role) => {
    return user && user.role === role;
  };

  // 複数の役割チェック関数
  const hasAnyRole = (roles) => {
    return user && roles.includes(user.role);
  };

  // エラークリア
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserData,
    hasRole,
    hasAnyRole,
    clearError,
    isAuthenticated: !!user,
    authProvider: authService.getProviderName()
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};