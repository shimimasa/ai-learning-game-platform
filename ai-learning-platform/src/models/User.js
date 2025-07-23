// ユーザーモデルクラス
import { generateId } from '../utils/helpers';
import { USER_ROLES } from '../constants/config';

export class User {
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.email = data.email || '';
    this.name = data.name || '';
    this.role = data.role || USER_ROLES.STUDENT;
    this.photoURL = data.photoURL || '';
    this.profile = data.profile || this.createDefaultProfile();
    this.preferences = data.preferences || this.createDefaultPreferences();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.lastLoginAt = data.lastLoginAt || null;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  // デフォルトプロファイルの作成
  createDefaultProfile() {
    const baseProfile = {
      bio: '',
      learningStyle: 'visual', // visual, auditory, kinesthetic
      aiProfile: {
        level: 1,
        preferences: {},
        history: []
      }
    };

    // 役割に応じた追加フィールド
    switch (this.role) {
      case USER_ROLES.STUDENT:
        return {
          ...baseProfile,
          grade: null,
          subjects: [],
          currentStreak: 0,
          totalPlayTime: 0,
          achievements: []
        };
      case USER_ROLES.TEACHER:
        return {
          ...baseProfile,
          school: '',
          subjects: [],
          classIds: []
        };
      case USER_ROLES.PARENT:
        return {
          ...baseProfile,
          childrenIds: []
        };
      case USER_ROLES.ADMIN:
        return {
          ...baseProfile,
          permissions: []
        };
      default:
        return baseProfile;
    }
  }

  // デフォルト設定の作成
  createDefaultPreferences() {
    return {
      language: 'ja',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        achievements: true,
        weeklyReport: true
      },
      privacy: {
        profileVisibility: 'private',
        shareProgress: false
      }
    };
  }

  // プロファイル更新
  updateProfile(profileData) {
    this.profile = { ...this.profile, ...profileData };
    this.updatedAt = new Date();
  }

  // 設定更新
  updatePreferences(preferences) {
    this.preferences = { ...this.preferences, ...preferences };
    this.updatedAt = new Date();
  }

  // 最終ログイン時刻更新
  updateLastLogin() {
    this.lastLoginAt = new Date();
  }

  // 子供を追加（保護者用）
  addChild(childId) {
    if (this.role === USER_ROLES.PARENT && this.profile.childrenIds) {
      if (!this.profile.childrenIds.includes(childId)) {
        this.profile.childrenIds.push(childId);
        this.updatedAt = new Date();
      }
    }
  }

  // クラスを追加（教師用）
  addClass(classId) {
    if (this.role === USER_ROLES.TEACHER && this.profile.classIds) {
      if (!this.profile.classIds.includes(classId)) {
        this.profile.classIds.push(classId);
        this.updatedAt = new Date();
      }
    }
  }

  // 実績を追加（学習者用）
  addAchievement(achievement) {
    if (this.role === USER_ROLES.STUDENT && this.profile.achievements) {
      this.profile.achievements.push({
        ...achievement,
        earnedAt: new Date()
      });
      this.updatedAt = new Date();
    }
  }

  // Firestoreドキュメント形式に変換
  toFirestore() {
    return {
      email: this.email,
      name: this.name,
      role: this.role,
      photoURL: this.photoURL,
      profile: this.profile,
      preferences: this.preferences,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt,
      isActive: this.isActive
    };
  }

  // Supabaseレコード形式に変換
  toSupabase() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      photo_url: this.photoURL,
      profile: JSON.stringify(this.profile),
      preferences: JSON.stringify(this.preferences),
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
      last_login_at: this.lastLoginAt ? this.lastLoginAt.toISOString() : null,
      is_active: this.isActive
    };
  }

  // Firestoreドキュメントから作成
  static fromFirestore(id, data) {
    return new User({
      id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate() : (data.lastLoginAt ? new Date(data.lastLoginAt) : null)
    });
  }

  // Supabaseレコードから作成
  static fromSupabase(data) {
    return new User({
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      photoURL: data.photo_url,
      profile: typeof data.profile === 'string' ? JSON.parse(data.profile) : data.profile,
      preferences: typeof data.preferences === 'string' ? JSON.parse(data.preferences) : data.preferences,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : null,
      isActive: data.is_active
    });
  }

  // バリデーション
  validate() {
    const errors = [];

    if (!this.email || !this.email.includes('@')) {
      errors.push('有効なメールアドレスを入力してください');
    }

    if (!this.name || this.name.trim().length === 0) {
      errors.push('名前を入力してください');
    }

    if (!Object.values(USER_ROLES).includes(this.role)) {
      errors.push('有効な役割を選択してください');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}