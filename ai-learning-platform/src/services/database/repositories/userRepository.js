// ユーザーリポジトリ
import { User } from '../../../models/User';
import { FirebaseRepository } from '../firebaseRepository';
import { SupabaseRepository } from '../supabaseRepository';

// Firebase用ユーザーリポジトリ
export class FirebaseUserRepository extends FirebaseRepository {
  constructor() {
    super('users', User);
  }

  // 役割別にユーザーを取得
  async findByRole(role, options = {}) {
    return this.findMany({
      where: [{ field: 'role', operator: '==', value: role }],
      ...options
    });
  }

  // メールアドレスでユーザーを検索
  async findByEmail(email) {
    return this.findOne({
      where: [{ field: 'email', operator: '==', value: email }]
    });
  }

  // アクティブなユーザーを取得
  async findActiveUsers(options = {}) {
    return this.findMany({
      where: [{ field: 'isActive', operator: '==', value: true }],
      ...options
    });
  }

  // 生徒を担当する教師を検索
  async findTeachersByStudent(studentId) {
    // 実装は関連テーブルの設計に依存
    // ここでは仮実装
    return [];
  }

  // 保護者の子供を取得
  async findChildrenByParent(parentId) {
    const parent = await this.findById(parentId);
    if (!parent || parent.role !== 'parent' || !parent.profile.childrenIds) {
      return [];
    }

    const children = await Promise.all(
      parent.profile.childrenIds.map(childId => this.findById(childId))
    );

    return children.filter(child => child !== null);
  }
}

// Supabase用ユーザーリポジトリ
export class SupabaseUserRepository extends SupabaseRepository {
  constructor() {
    super('users', User);
  }

  // 役割別にユーザーを取得
  async findByRole(role, options = {}) {
    return this.findMany({
      where: [{ field: 'role', operator: '==', value: role }],
      ...options
    });
  }

  // メールアドレスでユーザーを検索
  async findByEmail(email) {
    return this.findOne({
      where: [{ field: 'email', operator: '==', value: email }]
    });
  }

  // アクティブなユーザーを取得
  async findActiveUsers(options = {}) {
    return this.findMany({
      where: [{ field: 'is_active', operator: '==', value: true }],
      ...options
    });
  }

  // 生徒を担当する教師を検索
  async findTeachersByStudent(studentId) {
    // 実装は関連テーブルの設計に依存
    // ここでは仮実装
    return [];
  }

  // 保護者の子供を取得
  async findChildrenByParent(parentId) {
    const parent = await this.findById(parentId);
    if (!parent || parent.role !== 'parent' || !parent.profile.childrenIds) {
      return [];
    }

    const children = await Promise.all(
      parent.profile.childrenIds.map(childId => this.findById(childId))
    );

    return children.filter(child => child !== null);
  }
}

// 環境変数に基づいてリポジトリを選択
export const createUserRepository = () => {
  const provider = process.env.REACT_APP_AUTH_PROVIDER || 'firebase';
  return provider === 'supabase' 
    ? new SupabaseUserRepository() 
    : new FirebaseUserRepository();
};