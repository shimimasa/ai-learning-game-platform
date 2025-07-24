// ユーザーAPI
import { BaseAPI } from './baseAPI';
import { getUserRepository } from '../database';

export class UserAPI extends BaseAPI {
  constructor() {
    super();
    this.repository = getUserRepository();
  }

  // ユーザー取得
  async getUser(userId) {
    try {
      const user = await this.repository.findById(userId);
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 現在のユーザー取得
  async getCurrentUser() {
    return this.get('/users/me');
  }

  // ユーザー一覧取得
  async getUsers(filters = {}) {
    try {
      const { role, isActive, page = 1, limit = 20 } = filters;
      
      const where = [];
      if (role) {
        where.push({ field: 'role', operator: '==', value: role });
      }
      if (isActive !== undefined) {
        where.push({ field: 'isActive', operator: '==', value: isActive });
      }

      const users = await this.repository.findMany({ 
        where,
        limit,
        offset: (page - 1) * limit
      });

      return { 
        success: true, 
        data: {
          users,
          pagination: {
            page,
            limit,
            total: await this.repository.count({ where })
          }
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ユーザー作成
  async createUser(userData) {
    try {
      const user = await this.repository.create(userData);
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ユーザー更新
  async updateUser(userId, updateData) {
    try {
      const user = await this.repository.update(userId, updateData);
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // プロフィール更新
  async updateProfile(userId, profileData) {
    return this.put(`/users/${userId}/profile`, profileData);
  }

  // 設定更新
  async updatePreferences(userId, preferences) {
    return this.put(`/users/${userId}/preferences`, preferences);
  }

  // ユーザー削除（非アクティブ化）
  async deleteUser(userId) {
    try {
      await this.repository.update(userId, { isActive: false });
      return { success: true, data: { message: 'ユーザーを非アクティブ化しました' } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 子供を追加（保護者用）
  async addChild(parentId, childId) {
    return this.post(`/users/${parentId}/children`, { childId });
  }

  // クラスを追加（教師用）
  async addClass(teacherId, classId) {
    return this.post(`/users/${teacherId}/classes`, { classId });
  }

  // 役割別ユーザー取得
  async getUsersByRole(role, options = {}) {
    return this.getUsers({ ...options, role });
  }

  // 生徒の教師を取得
  async getTeachersByStudent(studentId) {
    try {
      const teachers = await this.repository.findTeachersByStudent(studentId);
      return { success: true, data: teachers };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 保護者の子供を取得
  async getChildrenByParent(parentId) {
    try {
      const children = await this.repository.findChildrenByParent(parentId);
      return { success: true, data: children };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // バッチユーザー作成
  async createUsers(usersData) {
    try {
      const users = await this.repository.createMany(usersData);
      return { success: true, data: users };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ユーザー検索
  async searchUsers(query) {
    return this.get('/users/search', { q: query });
  }

  // ユーザー統計
  async getUserStats(userId) {
    return this.get(`/users/${userId}/stats`);
  }
}