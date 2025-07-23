// Firebase Authentication Service
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { USER_ROLES } from '../../constants/config';

class FirebaseAuthService {
  constructor() {
    this.auth = auth;
    this.db = db;
    this.googleProvider = new GoogleAuthProvider();
  }

  // ユーザー登録
  async register(email, password, userData) {
    try {
      // Firebase Authでユーザー作成
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // プロフィール更新
      if (userData.name) {
        await updateProfile(user, { displayName: userData.name });
      }

      // Firestoreにユーザー情報を保存
      await this.createUserDocument(user.uid, {
        email: user.email,
        name: userData.name || '',
        role: userData.role || USER_ROLES.STUDENT,
        grade: userData.grade || null,
        subjects: userData.subjects || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { user, error: null };
    } catch (error) {
      return { user: null, error: this.handleAuthError(error) };
    }
  }

  // ログイン
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const userData = await this.getUserData(userCredential.user.uid);
      return { user: { ...userCredential.user, ...userData }, error: null };
    } catch (error) {
      return { user: null, error: this.handleAuthError(error) };
    }
  }

  // Googleログイン
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(this.auth, this.googleProvider);
      const user = result.user;
      
      // 初回ログインの場合はユーザードキュメントを作成
      const userDoc = await getDoc(doc(this.db, 'users', user.uid));
      if (!userDoc.exists()) {
        await this.createUserDocument(user.uid, {
          email: user.email,
          name: user.displayName || '',
          role: USER_ROLES.STUDENT,
          photoURL: user.photoURL || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      const userData = await this.getUserData(user.uid);
      return { user: { ...user, ...userData }, error: null };
    } catch (error) {
      return { user: null, error: this.handleAuthError(error) };
    }
  }

  // ログアウト
  async logout() {
    try {
      await signOut(this.auth);
      return { error: null };
    } catch (error) {
      return { error: this.handleAuthError(error) };
    }
  }

  // パスワードリセット
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(this.auth, email);
      return { error: null };
    } catch (error) {
      return { error: this.handleAuthError(error) };
    }
  }

  // ユーザー情報取得
  async getUserData(uid) {
    try {
      const userDoc = await getDoc(doc(this.db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }

  // ユーザー情報更新
  async updateUserData(uid, data) {
    try {
      await updateDoc(doc(this.db, 'users', uid), {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { error: null };
    } catch (error) {
      return { error: this.handleAuthError(error) };
    }
  }

  // ユーザードキュメント作成
  async createUserDocument(uid, userData) {
    try {
      await setDoc(doc(this.db, 'users', uid), userData);
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  }

  // 認証状態の監視
  onAuthStateChange(callback) {
    return onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        const userData = await this.getUserData(user.uid);
        callback({ ...user, ...userData });
      } else {
        callback(null);
      }
    });
  }

  // エラーハンドリング
  handleAuthError(error) {
    const errorMessages = {
      'auth/email-already-in-use': 'このメールアドレスは既に使用されています',
      'auth/invalid-email': 'メールアドレスの形式が正しくありません',
      'auth/operation-not-allowed': 'この操作は許可されていません',
      'auth/weak-password': 'パスワードは6文字以上で設定してください',
      'auth/user-disabled': 'このアカウントは無効化されています',
      'auth/user-not-found': 'ユーザーが見つかりません',
      'auth/wrong-password': 'パスワードが正しくありません',
      'auth/invalid-credential': 'メールアドレスまたはパスワードが正しくありません',
      'auth/network-request-failed': 'ネットワークエラーが発生しました',
      'auth/requires-recent-login': '再度ログインしてください',
      'auth/too-many-requests': 'しばらく時間をおいて再度お試しください'
    };

    return {
      code: error.code,
      message: errorMessages[error.code] || error.message || '認証エラーが発生しました'
    };
  }
}

export default new FirebaseAuthService();