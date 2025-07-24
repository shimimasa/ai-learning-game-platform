// 学習進捗リポジトリ
import { LearningProgress } from '../../../models/LearningProgress';
import { FirebaseRepository } from '../firebaseRepository';
import { SupabaseRepository } from '../supabaseRepository';

// Firebase用学習進捗リポジトリ
export class FirebaseLearningProgressRepository extends FirebaseRepository {
  constructor() {
    super('learningProgress', LearningProgress);
  }

  // ユーザーと科目で進捗を取得
  async findByUserAndSubject(userId, subject) {
    return this.findOne({
      where: [
        { field: 'userId', operator: '==', value: userId },
        { field: 'subject', operator: '==', value: subject }
      ]
    });
  }

  // ユーザーの全科目進捗を取得
  async findByUser(userId, options = {}) {
    return this.findMany({
      where: [{ field: 'userId', operator: '==', value: userId }],
      orderBy: [{ field: 'lastActivity', direction: 'desc' }],
      ...options
    });
  }

  // 特定レベル以上のユーザーを取得
  async findByMinLevel(minLevel, subject = null, options = {}) {
    const where = [{ field: 'currentLevel', operator: '>=', value: minLevel }];
    if (subject) {
      where.push({ field: 'subject', operator: '==', value: subject });
    }

    return this.findMany({
      where,
      orderBy: [{ field: 'currentLevel', direction: 'desc' }],
      ...options
    });
  }

  // 弱点分野を持つユーザーを検索
  async findUsersWithWeakness(weakness, options = {}) {
    return this.findMany({
      where: [{ field: 'weakAreas', operator: 'array-contains', value: weakness }],
      ...options
    });
  }

  // アクティブな学習者を取得（最近の活動がある）
  async findActiveLearners(daysSinceLastActivity = 7, options = {}) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastActivity);

    return this.findMany({
      where: [{ field: 'lastActivity', operator: '>=', value: cutoffDate }],
      orderBy: [{ field: 'lastActivity', direction: 'desc' }],
      ...options
    });
  }

  // トップパフォーマーを取得
  async findTopPerformers(subject, limit = 10) {
    const where = subject ? [{ field: 'subject', operator: '==', value: subject }] : [];

    const allProgress = await this.findMany({
      where,
      orderBy: [{ field: 'experience', direction: 'desc' }]
    });

    // 正答率も考慮してソート
    const sorted = allProgress.sort((a, b) => {
      const scoreA = a.experience * (a.statistics.averageAccuracy || 0);
      const scoreB = b.experience * (b.statistics.averageAccuracy || 0);
      return scoreB - scoreA;
    });

    return sorted.slice(0, limit);
  }

  // 学習統計サマリーを取得
  async getLearningStats(userId) {
    const allProgress = await this.findByUser(userId);
    
    const stats = {
      totalSubjects: allProgress.length,
      totalExperience: 0,
      totalPlayTime: 0,
      averageLevel: 0,
      completedGamesCount: 0,
      achievementsCount: 0,
      strongAreasCount: 0,
      weakAreasCount: 0
    };

    allProgress.forEach(progress => {
      stats.totalExperience += progress.experience;
      stats.totalPlayTime += progress.statistics.totalPlayTime;
      stats.averageLevel += progress.currentLevel;
      stats.completedGamesCount += progress.completedGames.length;
      stats.achievementsCount += progress.achievements.length;
      stats.strongAreasCount += progress.strongAreas.length;
      stats.weakAreasCount += progress.weakAreas.length;
    });

    if (allProgress.length > 0) {
      stats.averageLevel = stats.averageLevel / allProgress.length;
    }

    return stats;
  }

  // 進捗レポートを生成
  async generateProgressReport(userId, startDate, endDate) {
    const allProgress = await this.findByUser(userId);
    
    const report = {
      userId,
      period: { start: startDate, end: endDate },
      subjects: [],
      summary: {
        totalGamesPlayed: 0,
        totalTimeSpent: 0,
        averageAccuracy: 0,
        newAchievements: 0
      }
    };

    allProgress.forEach(progress => {
      const subjectReport = {
        subject: progress.subject,
        level: progress.currentLevel,
        experience: progress.experience,
        gamesCompleted: progress.completedGames.filter(g => 
          g.completedAt >= startDate && g.completedAt <= endDate
        ).length,
        achievements: progress.achievements.filter(a => 
          a.unlockedAt >= startDate && a.unlockedAt <= endDate
        ),
        strongAreas: progress.strongAreas,
        weakAreas: progress.weakAreas,
        accuracy: progress.statistics.averageAccuracy
      };

      report.subjects.push(subjectReport);
      report.summary.totalGamesPlayed += subjectReport.gamesCompleted;
      report.summary.newAchievements += subjectReport.achievements.length;
    });

    return report;
  }
}

// Supabase用学習進捗リポジトリ
export class SupabaseLearningProgressRepository extends SupabaseRepository {
  constructor() {
    super('learning_progress', LearningProgress);
  }

  // ユーザーと科目で進捗を取得
  async findByUserAndSubject(userId, subject) {
    return this.findOne({
      where: [
        { field: 'user_id', operator: '==', value: userId },
        { field: 'subject', operator: '==', value: subject }
      ]
    });
  }

  // ユーザーの全科目進捗を取得
  async findByUser(userId, options = {}) {
    return this.findMany({
      where: [{ field: 'user_id', operator: '==', value: userId }],
      orderBy: [{ field: 'last_activity', direction: 'desc' }],
      ...options
    });
  }

  // 特定レベル以上のユーザーを取得
  async findByMinLevel(minLevel, subject = null, options = {}) {
    const where = [{ field: 'current_level', operator: '>=', value: minLevel }];
    if (subject) {
      where.push({ field: 'subject', operator: '==', value: subject });
    }

    return this.findMany({
      where,
      orderBy: [{ field: 'current_level', direction: 'desc' }],
      ...options
    });
  }

  // 弱点分野を持つユーザーを検索
  async findUsersWithWeakness(weakness, options = {}) {
    return this.findMany({
      where: [{ field: 'weak_areas', operator: 'contains', value: weakness }],
      ...options
    });
  }

  // アクティブな学習者を取得（最近の活動がある）
  async findActiveLearners(daysSinceLastActivity = 7, options = {}) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastActivity);

    return this.findMany({
      where: [{ field: 'last_activity', operator: '>=', value: cutoffDate.toISOString() }],
      orderBy: [{ field: 'last_activity', direction: 'desc' }],
      ...options
    });
  }

  // トップパフォーマーを取得
  async findTopPerformers(subject, limit = 10) {
    const where = subject ? [{ field: 'subject', operator: '==', value: subject }] : [];

    const allProgress = await this.findMany({
      where,
      orderBy: [{ field: 'experience', direction: 'desc' }]
    });

    // 正答率も考慮してソート
    const sorted = allProgress.sort((a, b) => {
      const scoreA = a.experience * (a.statistics.averageAccuracy || 0);
      const scoreB = b.experience * (b.statistics.averageAccuracy || 0);
      return scoreB - scoreA;
    });

    return sorted.slice(0, limit);
  }

  // 学習統計サマリーを取得
  async getLearningStats(userId) {
    const allProgress = await this.findByUser(userId);
    
    const stats = {
      totalSubjects: allProgress.length,
      totalExperience: 0,
      totalPlayTime: 0,
      averageLevel: 0,
      completedGamesCount: 0,
      achievementsCount: 0,
      strongAreasCount: 0,
      weakAreasCount: 0
    };

    allProgress.forEach(progress => {
      stats.totalExperience += progress.experience;
      stats.totalPlayTime += progress.statistics.totalPlayTime;
      stats.averageLevel += progress.currentLevel;
      stats.completedGamesCount += progress.completedGames.length;
      stats.achievementsCount += progress.achievements.length;
      stats.strongAreasCount += progress.strongAreas.length;
      stats.weakAreasCount += progress.weakAreas.length;
    });

    if (allProgress.length > 0) {
      stats.averageLevel = stats.averageLevel / allProgress.length;
    }

    return stats;
  }

  // 進捗レポートを生成
  async generateProgressReport(userId, startDate, endDate) {
    const allProgress = await this.findByUser(userId);
    
    const report = {
      userId,
      period: { start: startDate, end: endDate },
      subjects: [],
      summary: {
        totalGamesPlayed: 0,
        totalTimeSpent: 0,
        averageAccuracy: 0,
        newAchievements: 0
      }
    };

    allProgress.forEach(progress => {
      const subjectReport = {
        subject: progress.subject,
        level: progress.currentLevel,
        experience: progress.experience,
        gamesCompleted: progress.completedGames.filter(g => 
          g.completedAt >= startDate && g.completedAt <= endDate
        ).length,
        achievements: progress.achievements.filter(a => 
          a.unlockedAt >= startDate && a.unlockedAt <= endDate
        ),
        strongAreas: progress.strongAreas,
        weakAreas: progress.weakAreas,
        accuracy: progress.statistics.averageAccuracy
      };

      report.subjects.push(subjectReport);
      report.summary.totalGamesPlayed += subjectReport.gamesCompleted;
      report.summary.newAchievements += subjectReport.achievements.length;
    });

    return report;
  }
}

// 環境変数に基づいてリポジトリを選択
export const createLearningProgressRepository = () => {
  const provider = process.env.REACT_APP_AUTH_PROVIDER || 'firebase';
  return provider === 'supabase' 
    ? new SupabaseLearningProgressRepository() 
    : new FirebaseLearningProgressRepository();
};