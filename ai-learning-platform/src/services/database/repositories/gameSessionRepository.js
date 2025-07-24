// ゲームセッションリポジトリ
import { GameSession } from '../../../models/GameSession';
import { FirebaseRepository } from '../firebaseRepository';
import { SupabaseRepository } from '../supabaseRepository';
import { SESSION_STATUS } from '../../../constants/config';

// Firebase用ゲームセッションリポジトリ
export class FirebaseGameSessionRepository extends FirebaseRepository {
  constructor() {
    super('gameSessions', GameSession);
  }

  // ユーザーのセッションを取得
  async findByUser(userId, options = {}) {
    return this.findMany({
      where: [{ field: 'userId', operator: '==', value: userId }],
      orderBy: [{ field: 'startTime', direction: 'desc' }],
      ...options
    });
  }

  // ゲームのセッションを取得
  async findByGame(gameId, options = {}) {
    return this.findMany({
      where: [{ field: 'gameId', operator: '==', value: gameId }],
      orderBy: [{ field: 'startTime', direction: 'desc' }],
      ...options
    });
  }

  // アクティブなセッションを取得
  async findActiveByUser(userId) {
    return this.findMany({
      where: [
        { field: 'userId', operator: '==', value: userId },
        { field: 'status', operator: 'in', value: [SESSION_STATUS.IN_PROGRESS, SESSION_STATUS.PAUSED] }
      ]
    });
  }

  // 完了したセッションを取得
  async findCompletedByUser(userId, options = {}) {
    return this.findMany({
      where: [
        { field: 'userId', operator: '==', value: userId },
        { field: 'status', operator: '==', value: SESSION_STATUS.COMPLETED }
      ],
      orderBy: [{ field: 'endTime', direction: 'desc' }],
      ...options
    });
  }

  // 期間内のセッションを取得
  async findByDateRange(userId, startDate, endDate, options = {}) {
    return this.findMany({
      where: [
        { field: 'userId', operator: '==', value: userId },
        { field: 'startTime', operator: '>=', value: startDate },
        { field: 'startTime', operator: '<=', value: endDate }
      ],
      orderBy: [{ field: 'startTime', direction: 'desc' }],
      ...options
    });
  }

  // 科目別セッションを取得（ゲーム情報と結合が必要）
  async findBySubject(userId, subject, options = {}) {
    // Firestoreでは結合クエリが制限されているため、
    // アプリケーション側で処理する必要がある
    const sessions = await this.findByUser(userId, options);
    // ここでは簡易的に全セッションを返す
    return sessions;
  }

  // セッション統計を取得
  async getSessionStats(userId, period = 'week') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const sessions = await this.findByDateRange(userId, startDate, now);
    
    // 統計を計算
    const stats = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === SESSION_STATUS.COMPLETED).length,
      totalPlayTime: sessions.reduce((sum, s) => sum + s.getPlayTime(), 0),
      averageScore: 0,
      averageAccuracy: 0
    };

    const completedSessions = sessions.filter(s => s.status === SESSION_STATUS.COMPLETED);
    if (completedSessions.length > 0) {
      stats.averageScore = completedSessions.reduce((sum, s) => sum + s.score, 0) / completedSessions.length;
      stats.averageAccuracy = completedSessions.reduce((sum, s) => sum + s.performance.accuracy, 0) / completedSessions.length;
    }

    return stats;
  }

  // 古いセッションをクリーンアップ
  async cleanupOldSessions(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const oldSessions = await this.findMany({
      where: [
        { field: 'endTime', operator: '<', value: cutoffDate },
        { field: 'status', operator: '!=', value: SESSION_STATUS.IN_PROGRESS }
      ]
    });

    const deletePromises = oldSessions.map(session => this.delete(session.id));
    await Promise.all(deletePromises);

    return oldSessions.length;
  }
}

// Supabase用ゲームセッションリポジトリ
export class SupabaseGameSessionRepository extends SupabaseRepository {
  constructor() {
    super('game_sessions', GameSession);
  }

  // ユーザーのセッションを取得
  async findByUser(userId, options = {}) {
    return this.findMany({
      where: [{ field: 'user_id', operator: '==', value: userId }],
      orderBy: [{ field: 'start_time', direction: 'desc' }],
      ...options
    });
  }

  // ゲームのセッションを取得
  async findByGame(gameId, options = {}) {
    return this.findMany({
      where: [{ field: 'game_id', operator: '==', value: gameId }],
      orderBy: [{ field: 'start_time', direction: 'desc' }],
      ...options
    });
  }

  // アクティブなセッションを取得
  async findActiveByUser(userId) {
    return this.findMany({
      where: [
        { field: 'user_id', operator: '==', value: userId },
        { field: 'status', operator: 'in', value: [SESSION_STATUS.IN_PROGRESS, SESSION_STATUS.PAUSED] }
      ]
    });
  }

  // 完了したセッションを取得
  async findCompletedByUser(userId, options = {}) {
    return this.findMany({
      where: [
        { field: 'user_id', operator: '==', value: userId },
        { field: 'status', operator: '==', value: SESSION_STATUS.COMPLETED }
      ],
      orderBy: [{ field: 'end_time', direction: 'desc' }],
      ...options
    });
  }

  // 期間内のセッションを取得
  async findByDateRange(userId, startDate, endDate, options = {}) {
    return this.findMany({
      where: [
        { field: 'user_id', operator: '==', value: userId },
        { field: 'start_time', operator: '>=', value: startDate.toISOString() },
        { field: 'start_time', operator: '<=', value: endDate.toISOString() }
      ],
      orderBy: [{ field: 'start_time', direction: 'desc' }],
      ...options
    });
  }

  // 科目別セッションを取得（ゲーム情報と結合が必要）
  async findBySubject(userId, subject, options = {}) {
    // Supabaseでは結合クエリが可能だが、ここでは簡易実装
    const sessions = await this.findByUser(userId, options);
    return sessions;
  }

  // セッション統計を取得
  async getSessionStats(userId, period = 'week') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const sessions = await this.findByDateRange(userId, startDate, now);
    
    // 統計を計算
    const stats = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === SESSION_STATUS.COMPLETED).length,
      totalPlayTime: sessions.reduce((sum, s) => sum + s.getPlayTime(), 0),
      averageScore: 0,
      averageAccuracy: 0
    };

    const completedSessions = sessions.filter(s => s.status === SESSION_STATUS.COMPLETED);
    if (completedSessions.length > 0) {
      stats.averageScore = completedSessions.reduce((sum, s) => sum + s.score, 0) / completedSessions.length;
      stats.averageAccuracy = completedSessions.reduce((sum, s) => sum + s.performance.accuracy, 0) / completedSessions.length;
    }

    return stats;
  }

  // 古いセッションをクリーンアップ
  async cleanupOldSessions(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const oldSessions = await this.findMany({
      where: [
        { field: 'end_time', operator: '<', value: cutoffDate.toISOString() },
        { field: 'status', operator: '!=', value: SESSION_STATUS.IN_PROGRESS }
      ]
    });

    const deletePromises = oldSessions.map(session => this.delete(session.id));
    await Promise.all(deletePromises);

    return oldSessions.length;
  }
}

// 環境変数に基づいてリポジトリを選択
export const createGameSessionRepository = () => {
  const provider = process.env.REACT_APP_AUTH_PROVIDER || 'firebase';
  return provider === 'supabase' 
    ? new SupabaseGameSessionRepository() 
    : new FirebaseGameSessionRepository();
};