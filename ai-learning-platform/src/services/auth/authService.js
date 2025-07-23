// 統一認証サービスインターフェース
import firebaseAuth from './firebaseAuth';
import supabaseAuth from './supabaseAuth';

class AuthService {
  constructor() {
    // 環境変数に基づいて適切な認証プロバイダーを選択
    this.provider = this.selectAuthProvider();
  }

  selectAuthProvider() {
    // Firebaseが設定されている場合はFirebaseを使用
    if (process.env.REACT_APP_FIREBASE_API_KEY) {
      return firebaseAuth;
    }
    // Supabaseが設定されている場合はSupabaseを使用
    if (process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY) {
      return supabaseAuth;
    }
    // どちらも設定されていない場合はFirebaseをデフォルトとする
    console.warn('No authentication provider configured. Using Firebase as default.');
    return firebaseAuth;
  }

  // ユーザー登録
  async register(email, password, userData = {}) {
    return this.provider.register(email, password, userData);
  }

  // ログイン
  async login(email, password) {
    return this.provider.login(email, password);
  }

  // Googleログイン
  async loginWithGoogle() {
    return this.provider.loginWithGoogle();
  }

  // ログアウト
  async logout() {
    return this.provider.logout();
  }

  // パスワードリセット
  async resetPassword(email) {
    return this.provider.resetPassword(email);
  }

  // ユーザー情報取得
  async getUserData(userId) {
    return this.provider.getUserData(userId);
  }

  // ユーザー情報更新
  async updateUserData(userId, data) {
    return this.provider.updateUserData(userId, data);
  }

  // 認証状態の監視
  onAuthStateChange(callback) {
    return this.provider.onAuthStateChange(callback);
  }

  // 現在のユーザー取得（Supabase用）
  async getCurrentUser() {
    if (this.provider.getCurrentUser) {
      return this.provider.getCurrentUser();
    }
    return null;
  }

  // 現在の認証プロバイダー名を取得
  getProviderName() {
    if (this.provider === firebaseAuth) return 'Firebase';
    if (this.provider === supabaseAuth) return 'Supabase';
    return 'Unknown';
  }
}

export default new AuthService();