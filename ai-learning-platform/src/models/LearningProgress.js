// 学習進捗モデルクラス
import { generateId } from '../utils/helpers';

export class LearningProgress {
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.userId = data.userId || null;
    this.subject = data.subject || null;
    this.currentLevel = data.currentLevel || 1;
    this.experience = data.experience || 0;
    this.skillMastery = data.skillMastery || [];
    this.weakAreas = data.weakAreas || [];
    this.strongAreas = data.strongAreas || [];
    this.completedGames = data.completedGames || [];
    this.achievements = data.achievements || [];
    this.statistics = data.statistics || this.createDefaultStatistics();
    this.learningPath = data.learningPath || [];
    this.recommendations = data.recommendations || [];
    this.lastActivity = data.lastActivity || new Date();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // デフォルト統計の作成
  createDefaultStatistics() {
    return {
      totalPlayTime: 0, // 総プレイ時間（秒）
      gamesCompleted: 0, // 完了したゲーム数
      questionsAnswered: 0, // 回答した問題数
      correctAnswers: 0, // 正解数
      averageAccuracy: 0, // 平均正答率
      currentStreak: 0, // 現在の連続学習日数
      longestStreak: 0, // 最長連続学習日数
      lastStreakDate: null, // 最後の学習日
      weeklyGoals: {
        target: 300, // 週間目標時間（分）
        current: 0 // 今週の学習時間（分）
      },
      monthlyProgress: [] // 月別進捗
    };
  }

  // ゲーム結果から進捗を更新
  updateFromGameResult(gameSession) {
    // 統計を更新
    this.statistics.gamesCompleted++;
    this.statistics.totalPlayTime += gameSession.getPlayTime();
    this.statistics.questionsAnswered += gameSession.results.length;
    this.statistics.correctAnswers += gameSession.performance.totalCorrect;
    
    // 平均正答率を再計算
    if (this.statistics.questionsAnswered > 0) {
      this.statistics.averageAccuracy = 
        this.statistics.correctAnswers / this.statistics.questionsAnswered;
    }
    
    // 経験値を追加
    this.addExperience(gameSession.score);
    
    // 完了したゲームを記録
    this.completedGames.push({
      gameId: gameSession.gameId,
      sessionId: gameSession.id,
      completedAt: gameSession.endTime || new Date(),
      score: gameSession.score,
      accuracy: gameSession.performance.accuracy
    });
    
    // スキル分析
    this.analyzeSkills(gameSession);
    
    // 連続学習日数を更新
    this.updateStreak();
    
    // 最終活動時刻を更新
    this.lastActivity = new Date();
    this.updatedAt = new Date();
  }

  // 経験値を追加
  addExperience(points) {
    this.experience += points;
    
    // レベルアップチェック
    const newLevel = this.calculateLevel(this.experience);
    if (newLevel > this.currentLevel) {
      this.currentLevel = newLevel;
      this.addAchievement({
        type: 'level_up',
        level: newLevel,
        timestamp: new Date()
      });
    }
  }

  // レベル計算
  calculateLevel(experience) {
    // 100ポイントごとにレベルアップ（調整可能）
    return Math.floor(experience / 100) + 1;
  }

  // スキル分析
  analyzeSkills(gameSession) {
    gameSession.results.forEach(result => {
      if (result.skillArea) {
        const skillIndex = this.skillMastery.findIndex(
          skill => skill.name === result.skillArea
        );
        
        if (skillIndex >= 0) {
          // 既存のスキルを更新
          const skill = this.skillMastery[skillIndex];
          skill.attempts++;
          if (result.isCorrect) skill.correct++;
          skill.mastery = skill.correct / skill.attempts;
        } else {
          // 新しいスキルを追加
          this.skillMastery.push({
            name: result.skillArea,
            attempts: 1,
            correct: result.isCorrect ? 1 : 0,
            mastery: result.isCorrect ? 1 : 0
          });
        }
      }
    });
    
    // 弱点と強みを特定
    this.identifyStrengthsAndWeaknesses();
  }

  // 強みと弱点を特定
  identifyStrengthsAndWeaknesses() {
    const threshold = { weak: 0.5, strong: 0.8 };
    
    this.weakAreas = this.skillMastery
      .filter(skill => skill.attempts >= 5 && skill.mastery < threshold.weak)
      .map(skill => skill.name);
    
    this.strongAreas = this.skillMastery
      .filter(skill => skill.attempts >= 5 && skill.mastery >= threshold.strong)
      .map(skill => skill.name);
  }

  // 連続学習日数を更新
  updateStreak() {
    const today = new Date().toDateString();
    const lastDate = this.statistics.lastStreakDate 
      ? new Date(this.statistics.lastStreakDate).toDateString() 
      : null;
    
    if (lastDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastDate === yesterday.toDateString()) {
        // 連続している
        this.statistics.currentStreak++;
      } else {
        // 連続が途切れた
        this.statistics.currentStreak = 1;
      }
      
      this.statistics.lastStreakDate = new Date();
      
      // 最長記録を更新
      if (this.statistics.currentStreak > this.statistics.longestStreak) {
        this.statistics.longestStreak = this.statistics.currentStreak;
      }
    }
  }

  // 週間進捗を更新
  updateWeeklyProgress(minutes) {
    this.statistics.weeklyGoals.current += minutes;
  }

  // 週間目標をリセット
  resetWeeklyGoals() {
    this.statistics.weeklyGoals.current = 0;
  }

  // 実績を追加
  addAchievement(achievement) {
    this.achievements.push({
      id: generateId(),
      ...achievement,
      unlockedAt: new Date()
    });
  }

  // 推奨を追加
  addRecommendation(recommendation) {
    this.recommendations.push({
      id: generateId(),
      ...recommendation,
      createdAt: new Date()
    });
  }

  // 学習パスに項目を追加
  addToLearningPath(pathItem) {
    this.learningPath.push({
      id: generateId(),
      ...pathItem,
      addedAt: new Date()
    });
  }

  // 月別進捗を記録
  recordMonthlyProgress() {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const existingIndex = this.statistics.monthlyProgress.findIndex(
      mp => mp.month === currentMonth
    );
    
    const monthData = {
      month: currentMonth,
      playTime: this.statistics.totalPlayTime,
      gamesCompleted: this.statistics.gamesCompleted,
      accuracy: this.statistics.averageAccuracy,
      level: this.currentLevel
    };
    
    if (existingIndex >= 0) {
      this.statistics.monthlyProgress[existingIndex] = monthData;
    } else {
      this.statistics.monthlyProgress.push(monthData);
    }
  }

  // Firestoreドキュメント形式に変換
  toFirestore() {
    return {
      userId: this.userId,
      subject: this.subject,
      currentLevel: this.currentLevel,
      experience: this.experience,
      skillMastery: this.skillMastery,
      weakAreas: this.weakAreas,
      strongAreas: this.strongAreas,
      completedGames: this.completedGames,
      achievements: this.achievements,
      statistics: this.statistics,
      learningPath: this.learningPath,
      recommendations: this.recommendations,
      lastActivity: this.lastActivity,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Supabaseレコード形式に変換
  toSupabase() {
    return {
      id: this.id,
      user_id: this.userId,
      subject: this.subject,
      current_level: this.currentLevel,
      experience: this.experience,
      skill_mastery: JSON.stringify(this.skillMastery),
      weak_areas: this.weakAreas,
      strong_areas: this.strongAreas,
      completed_games: JSON.stringify(this.completedGames),
      achievements: JSON.stringify(this.achievements),
      statistics: JSON.stringify(this.statistics),
      learning_path: JSON.stringify(this.learningPath),
      recommendations: JSON.stringify(this.recommendations),
      last_activity: this.lastActivity.toISOString(),
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString()
    };
  }

  // Firestoreドキュメントから作成
  static fromFirestore(id, data) {
    return new LearningProgress({
      id,
      ...data,
      lastActivity: data.lastActivity?.toDate ? data.lastActivity.toDate() : new Date(data.lastActivity),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
    });
  }

  // Supabaseレコードから作成
  static fromSupabase(data) {
    return new LearningProgress({
      id: data.id,
      userId: data.user_id,
      subject: data.subject,
      currentLevel: data.current_level,
      experience: data.experience,
      skillMastery: typeof data.skill_mastery === 'string' ? JSON.parse(data.skill_mastery) : data.skill_mastery,
      weakAreas: data.weak_areas,
      strongAreas: data.strong_areas,
      completedGames: typeof data.completed_games === 'string' ? JSON.parse(data.completed_games) : data.completed_games,
      achievements: typeof data.achievements === 'string' ? JSON.parse(data.achievements) : data.achievements,
      statistics: typeof data.statistics === 'string' ? JSON.parse(data.statistics) : data.statistics,
      learningPath: typeof data.learning_path === 'string' ? JSON.parse(data.learning_path) : data.learning_path,
      recommendations: typeof data.recommendations === 'string' ? JSON.parse(data.recommendations) : data.recommendations,
      lastActivity: new Date(data.last_activity),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    });
  }
}