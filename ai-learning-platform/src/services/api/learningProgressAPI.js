// 学習進捗API
import { BaseAPI } from './baseAPI';
import { getLearningProgressRepository } from '../database';

export class LearningProgressAPI extends BaseAPI {
  constructor() {
    super();
    this.repository = getLearningProgressRepository();
  }

  // 進捗取得
  async getProgress(progressId) {
    try {
      const progress = await this.repository.findById(progressId);
      if (!progress) {
        throw new Error('進捗データが見つかりません');
      }
      return { success: true, data: progress };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ユーザーの科目別進捗取得
  async getUserSubjectProgress(userId, subject) {
    try {
      const progress = await this.repository.findByUserAndSubject(userId, subject);
      if (!progress) {
        // 新規作成
        const newProgress = await this.repository.create({
          userId,
          subject
        });
        return { success: true, data: newProgress };
      }
      return { success: true, data: progress };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ユーザーの全進捗取得
  async getUserProgress(userId, options = {}) {
    try {
      const progressList = await this.repository.findByUser(userId, options);
      return { success: true, data: progressList };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ゲーム結果から進捗更新
  async updateProgressFromGameSession(userId, subject, gameSession) {
    try {
      let progress = await this.repository.findByUserAndSubject(userId, subject);
      
      if (!progress) {
        // 進捗データが存在しない場合は新規作成
        progress = await this.repository.create({
          userId,
          subject
        });
      }

      // ゲーム結果から進捗を更新
      progress.updateFromGameResult(gameSession);
      
      // 月別進捗を記録
      progress.recordMonthlyProgress();
      
      // データベースに保存
      await this.repository.update(progress.id, progress.toFirestore());
      
      return { success: true, data: progress };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // レベル別ユーザー取得
  async getUsersByLevel(minLevel, subject = null, options = {}) {
    try {
      const users = await this.repository.findByMinLevel(minLevel, subject, options);
      return { success: true, data: users };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 弱点分野のユーザー取得
  async getUsersWithWeakness(weakness, options = {}) {
    try {
      const users = await this.repository.findUsersWithWeakness(weakness, options);
      return { success: true, data: users };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // アクティブ学習者取得
  async getActiveLearners(daysSinceLastActivity = 7, options = {}) {
    try {
      const learners = await this.repository.findActiveLearners(daysSinceLastActivity, options);
      return { success: true, data: learners };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // トップパフォーマー取得
  async getTopPerformers(subject = null, limit = 10) {
    try {
      const performers = await this.repository.findTopPerformers(subject, limit);
      return { success: true, data: performers };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 学習統計取得
  async getLearningStats(userId) {
    try {
      const stats = await this.repository.getLearningStats(userId);
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 進捗レポート生成
  async generateProgressReport(userId, startDate, endDate) {
    try {
      const report = await this.repository.generateProgressReport(
        userId,
        new Date(startDate),
        new Date(endDate)
      );
      return { success: true, data: report };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 実績追加
  async addAchievement(progressId, achievement) {
    try {
      const progress = await this.repository.findById(progressId);
      if (!progress) {
        throw new Error('進捗データが見つかりません');
      }
      
      progress.addAchievement(achievement);
      await this.repository.update(progressId, progress.toFirestore());
      
      return { success: true, data: progress };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 推奨追加
  async addRecommendation(progressId, recommendation) {
    try {
      const progress = await this.repository.findById(progressId);
      if (!progress) {
        throw new Error('進捗データが見つかりません');
      }
      
      progress.addRecommendation(recommendation);
      await this.repository.update(progressId, progress.toFirestore());
      
      return { success: true, data: progress };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 学習パス追加
  async addToLearningPath(progressId, pathItem) {
    try {
      const progress = await this.repository.findById(progressId);
      if (!progress) {
        throw new Error('進捗データが見つかりません');
      }
      
      progress.addToLearningPath(pathItem);
      await this.repository.update(progressId, progress.toFirestore());
      
      return { success: true, data: progress };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 週間目標更新
  async updateWeeklyGoals(progressId, goals) {
    try {
      const progress = await this.repository.findById(progressId);
      if (!progress) {
        throw new Error('進捗データが見つかりません');
      }
      
      progress.statistics.weeklyGoals = {
        ...progress.statistics.weeklyGoals,
        ...goals
      };
      
      await this.repository.update(progressId, progress.toFirestore());
      
      return { success: true, data: progress };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 週間進捗リセット
  async resetWeeklyProgress(userId) {
    try {
      const progressList = await this.repository.findByUser(userId);
      
      const resetPromises = progressList.map(progress => {
        progress.resetWeeklyGoals();
        return this.repository.update(progress.id, progress.toFirestore());
      });
      
      await Promise.all(resetPromises);
      
      return { 
        success: true, 
        data: { message: '週間進捗をリセットしました' } 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // クラス進捗取得（教師用）
  async getClassProgress(classId, subject = null) {
    return this.get('/progress/class', { classId, subject });
  }

  // 進捗比較
  async compareProgress(userIds, subject) {
    return this.post('/progress/compare', { userIds, subject });
  }

  // 進捗予測（AI分析）
  async predictProgress(userId, subject) {
    return this.get(`/progress/${userId}/predict`, { subject });
  }

  // バッチ進捗更新
  async batchUpdateProgress(updates) {
    try {
      const updatePromises = updates.map(({ progressId, updateData }) => 
        this.repository.update(progressId, updateData)
      );
      
      const results = await Promise.all(updatePromises);
      return { success: true, data: results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}