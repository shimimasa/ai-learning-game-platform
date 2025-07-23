// Supabase Authentication Service (Alternative to Firebase)
import { getSupabaseClient, isSupabaseConfigured } from '../supabase';
import { USER_ROLES } from '../../constants/config';

class SupabaseAuthService {
  constructor() {
    this.supabase = null;
    if (isSupabaseConfigured()) {
      this.supabase = getSupabaseClient();
    }
  }

  // サービスが利用可能かチェック
  isAvailable() {
    return this.supabase !== null;
  }

  // ユーザー登録
  async register(email, password, userData) {
    if (!this.isAvailable()) {
      return { user: null, error: { message: 'Supabase is not configured' } };
    }

    try {
      // Supabase Authでユーザー作成
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name || '',
            role: userData.role || USER_ROLES.STUDENT
          }
        }
      });

      if (authError) throw authError;

      // プロファイルテーブルにユーザー情報を保存
      if (authData.user) {
        const { error: profileError } = await this.supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            email: authData.user.email,
            name: userData.name || '',
            role: userData.role || USER_ROLES.STUDENT,
            grade: userData.grade || null,
            subjects: userData.subjects || [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      return { user: authData.user, error: null };
    } catch (error) {
      return { user: null, error: this.handleAuthError(error) };
    }
  }

  // ログイン
  async login(email, password) {
    if (!this.isAvailable()) {
      return { user: null, error: { message: 'Supabase is not configured' } };
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // プロファイル情報を取得
      if (data.user) {
        const userData = await this.getUserData(data.user.id);
        return { user: { ...data.user, ...userData }, error: null };
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: this.handleAuthError(error) };
    }
  }

  // Googleログイン
  async loginWithGoogle() {
    if (!this.isAvailable()) {
      return { user: null, error: { message: 'Supabase is not configured' } };
    }

    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: this.handleAuthError(error) };
    }
  }

  // ログアウト
  async logout() {
    if (!this.isAvailable()) {
      return { error: { message: 'Supabase is not configured' } };
    }

    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: this.handleAuthError(error) };
    }
  }

  // パスワードリセット
  async resetPassword(email) {
    if (!this.isAvailable()) {
      return { error: { message: 'Supabase is not configured' } };
    }

    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: this.handleAuthError(error) };
    }
  }

  // ユーザー情報取得
  async getUserData(userId) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  // ユーザー情報更新
  async updateUserData(userId, data) {
    if (!this.isAvailable()) {
      return { error: { message: 'Supabase is not configured' } };
    }

    try {
      const { error } = await this.supabase
        .from('profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: this.handleAuthError(error) };
    }
  }

  // 認証状態の監視
  onAuthStateChange(callback) {
    if (!this.isAvailable()) {
      callback(null);
      return () => {};
    }

    const { data: { subscription } } = this.supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session && session.user) {
          const userData = await this.getUserData(session.user.id);
          callback({ ...session.user, ...userData });
        } else {
          callback(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }

  // 現在のユーザー取得
  async getCurrentUser() {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user) {
        const userData = await this.getUserData(user.id);
        return { ...user, ...userData };
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // エラーハンドリング
  handleAuthError(error) {
    const errorMessages = {
      'Invalid login credentials': 'メールアドレスまたはパスワードが正しくありません',
      'Email not confirmed': 'メールアドレスの確認が完了していません',
      'User already registered': 'このメールアドレスは既に登録されています',
      'Password should be at least 6 characters': 'パスワードは6文字以上で設定してください',
      'Network request failed': 'ネットワークエラーが発生しました',
      'Invalid email': 'メールアドレスの形式が正しくありません'
    };

    const message = error.message || '';
    const matchedMessage = Object.keys(errorMessages).find(key => 
      message.includes(key)
    );

    return {
      code: error.code || 'unknown',
      message: matchedMessage ? errorMessages[matchedMessage] : message || '認証エラーが発生しました'
    };
  }
}

export default new SupabaseAuthService();