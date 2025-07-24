// ゲームセッションAPI
import { BaseAPI } from './baseAPI';
import { getGameSessionRepository } from '../database';
import { GameSession } from '../../models/GameSession';

export class GameSessionAPI extends BaseAPI {
  constructor() {
    super();
    this.repository = getGameSessionRepository();
  }

  // セッション取得
  async getSession(sessionId) {
    try {
      const session = await this.repository.findById(sessionId);
      if (!session) {
        throw new Error('セッションが見つかりません');
      }
      return { success: true, data: session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ユーザーのセッション一覧取得
  async getUserSessions(userId, filters = {}) {
    try {
      const { 
        status,
        gameId,
        startDate,
        endDate,
        page = 1, 
        limit = 20 
      } = filters;

      let sessions;
      if (startDate && endDate) {
        sessions = await this.repository.findByDateRange(
          userId, 
          new Date(startDate), 
          new Date(endDate),
          { limit, offset: (page - 1) * limit }
        );
      } else {
        sessions = await this.repository.findByUser(userId, {
          limit,
          offset: (page - 1) * limit
        });
      }

      // フィルタリング
      if (status) {
        sessions = sessions.filter(s => s.status === status);
      }
      if (gameId) {
        sessions = sessions.filter(s => s.gameId === gameId);
      }

      return { 
        success: true, 
        data: {
          sessions,
          pagination: {
            page,
            limit,
            total: sessions.length
          }
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // アクティブセッション取得
  async getActiveSessions(userId) {
    try {
      const sessions = await this.repository.findActiveByUser(userId);
      return { success: true, data: sessions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 完了セッション取得
  async getCompletedSessions(userId, options = {}) {
    try {
      const sessions = await this.repository.findCompletedByUser(userId, options);
      return { success: true, data: sessions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // セッション作成（ゲーム開始）
  async createSession(gameId, userId) {
    try {
      const sessionData = {
        gameId,
        userId,
        startTime: new Date()
      };
      
      const session = await this.repository.create(sessionData);
      return { success: true, data: session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // セッション更新
  async updateSession(sessionId, updateData) {
    try {
      const session = await this.repository.update(sessionId, updateData);
      return { success: true, data: session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // セッション一時停止
  async pauseSession(sessionId) {
    try {
      const session = await this.repository.findById(sessionId);
      if (!session) {
        throw new Error('セッションが見つかりません');
      }
      
      session.pause();
      await this.repository.update(sessionId, session.toFirestore());
      
      return { success: true, data: session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // セッション再開
  async resumeSession(sessionId) {
    try {
      const session = await this.repository.findById(sessionId);
      if (!session) {
        throw new Error('セッションが見つかりません');
      }
      
      session.resume();
      await this.repository.update(sessionId, session.toFirestore());
      
      return { success: true, data: session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // セッション完了
  async completeSession(sessionId, finalResult = {}) {
    try {
      const session = await this.repository.findById(sessionId);
      if (!session) {
        throw new Error('セッションが見つかりません');
      }
      
      session.complete(finalResult);
      await this.repository.update(sessionId, session.toFirestore());
      
      return { success: true, data: session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // セッション破棄
  async abandonSession(sessionId) {
    try {
      const session = await this.repository.findById(sessionId);
      if (!session) {
        throw new Error('セッションが見つかりません');
      }
      
      session.abandon();
      await this.repository.update(sessionId, session.toFirestore());
      
      return { success: true, data: session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 質問結果記録
  async recordQuestionResult(sessionId, questionId, result) {
    try {
      const session = await this.repository.findById(sessionId);
      if (!session) {
        throw new Error('セッションが見つかりません');
      }
      
      session.recordQuestionResult(questionId, result);
      await this.repository.update(sessionId, session.toFirestore());
      
      return { success: true, data: session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // AI適応記録
  async recordAIAdaptation(sessionId, adaptation) {
    try {
      const session = await this.repository.findById(sessionId);
      if (!session) {
        throw new Error('セッションが見つかりません');
      }
      
      session.recordAIAdaptation(adaptation);
      await this.repository.update(sessionId, session.toFirestore());
      
      return { success: true, data: session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // チェックポイント保存
  async saveCheckpoint(sessionId, checkpointData) {
    try {
      const session = await this.repository.findById(sessionId);
      if (!session) {
        throw new Error('セッションが見つかりません');
      }
      
      session.saveCheckpoint(checkpointData);
      await this.repository.update(sessionId, session.toFirestore());
      
      return { success: true, data: session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // セッション統計取得
  async getSessionStats(userId, period = 'week') {
    try {
      const stats = await this.repository.getSessionStats(userId, period);
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ゲーム別セッション取得
  async getGameSessions(gameId, options = {}) {
    try {
      const sessions = await this.repository.findByGame(gameId, options);
      return { success: true, data: sessions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // セッション分析
  async analyzeSession(sessionId) {
    return this.get(`/sessions/${sessionId}/analysis`);
  }

  // バッチセッション更新
  async updateSessions(sessionIds, updateData) {
    try {
      const updatePromises = sessionIds.map(id => 
        this.repository.update(id, updateData)
      );
      const sessions = await Promise.all(updatePromises);
      return { success: true, data: sessions };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 古いセッションクリーンアップ
  async cleanupOldSessions(daysToKeep = 90) {
    try {
      const deletedCount = await this.repository.cleanupOldSessions(daysToKeep);
      return { 
        success: true, 
        data: { 
          message: `${deletedCount}件の古いセッションを削除しました` 
        } 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}