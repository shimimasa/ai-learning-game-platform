// AIパーソナライゼーションエンジン
import { getAIService } from './aiService';
import { getLearningProgressRepository, getGameRepository } from '../database';

export class AIPersonalizationEngine {
  constructor(config = {}) {
    this.aiService = getAIService(config.ai);
    this.progressRepository = getLearningProgressRepository();
    this.gameRepository = getGameRepository();
    
    // 設定
    this.config = {
      analysisInterval: config.analysisInterval || 5, // 5ゲームごとに分析
      difficultyAdjustmentSensitivity: config.sensitivity || 'medium',
      recommendationCount: config.recommendationCount || 5,
      contentGenerationEnabled: config.contentGenerationEnabled || false,
      ...config
    };
    
    // 分析履歴
    this.analysisHistory = new Map();
    
    // パフォーマンスしきい値
    this.thresholds = this.initializeThresholds();
  }

  // しきい値初期化
  initializeThresholds() {
    const sensitivity = this.config.difficultyAdjustmentSensitivity;
    
    const thresholds = {
      low: {
        increaseThreshold: 0.9,    // 90%以上で難易度上昇
        decreaseThreshold: 0.4,    // 40%以下で難易度下降
        streakForIncrease: 10,    // 10連続正解で上昇
        responseTimeMultiplier: 2  // 平均の2倍遅いと考慮
      },
      medium: {
        increaseThreshold: 0.8,    // 80%以上で難易度上昇
        decreaseThreshold: 0.5,    // 50%以下で難易度下降
        streakForIncrease: 7,     // 7連続正解で上昇
        responseTimeMultiplier: 1.5
      },
      high: {
        increaseThreshold: 0.7,    // 70%以上で難易度上昇
        decreaseThreshold: 0.6,    // 60%以下で難易度下降
        streakForIncrease: 5,     // 5連続正解で上昇
        responseTimeMultiplier: 1.2
      }
    };
    
    return thresholds[sensitivity] || thresholds.medium;
  }

  // 学習パフォーマンス分析
  async analyzePerformance(userId, gameResults) {
    try {
      // 学習進捗データを取得
      const progressData = await this.gatherProgressData(userId);
      
      // 分析データを準備
      const analysisData = this.prepareAnalysisData(progressData, gameResults);
      
      // AI分析を実行
      const analysis = await this.aiService.analyzePerformance(analysisData);
      
      // 分析結果を保存
      this.saveAnalysisHistory(userId, analysis);
      
      // 学習プロファイルを生成
      const learningProfile = await this.generateLearningProfile(userId, analysisData, analysis);
      
      return learningProfile;
    } catch (error) {
      console.error('Performance analysis error:', error);
      throw error;
    }
  }

  // 進捗データ収集
  async gatherProgressData(userId) {
    const allProgress = await this.progressRepository.findByUser(userId);
    
    return allProgress.map(progress => ({
      subject: progress.subject,
      currentLevel: progress.currentLevel,
      experience: progress.experience,
      skillMastery: progress.skillMastery,
      weakAreas: progress.weakAreas,
      strongAreas: progress.strongAreas,
      statistics: progress.statistics
    }));
  }

  // 分析データ準備
  prepareAnalysisData(progressData, recentResults) {
    // 最新のゲーム結果から統計を計算
    const recentStats = this.calculateRecentStats(recentResults);
    
    // 全体的な学習データ
    const overallStats = this.calculateOverallStats(progressData);
    
    return {
      ...overallStats,
      ...recentStats,
      recentResults: recentResults.slice(-10) // 直近10件
    };
  }

  // 最近の統計計算
  calculateRecentStats(results) {
    if (results.length === 0) {
      return {
        recentAccuracy: 0,
        averageResponseTime: 0,
        recentCorrectStreak: 0
      };
    }
    
    const correctCount = results.filter(r => r.isCorrect).length;
    const totalResponseTime = results.reduce((sum, r) => sum + (r.responseTime || 0), 0);
    
    // 連続正解数を計算
    let currentStreak = 0;
    for (let i = results.length - 1; i >= 0; i--) {
      if (results[i].isCorrect) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return {
      recentAccuracy: Math.round((correctCount / results.length) * 100),
      averageResponseTime: Math.round(totalResponseTime / results.length / 1000), // 秒単位
      recentCorrectStreak: currentStreak
    };
  }

  // 全体統計計算
  calculateOverallStats(progressData) {
    const totalGames = progressData.reduce((sum, p) => 
      sum + p.statistics.gamesCompleted, 0
    );
    
    const totalTime = progressData.reduce((sum, p) => 
      sum + p.statistics.totalPlayTime, 0
    );
    
    const averageAccuracy = progressData.reduce((sum, p) => 
      sum + p.statistics.averageAccuracy, 0
    ) / (progressData.length || 1);
    
    return {
      totalSubjects: progressData.length,
      gamesCompleted: totalGames,
      totalPlayTime: Math.round(totalTime / 60), // 分単位
      accuracy: Math.round(averageAccuracy * 100)
    };
  }

  // 学習プロファイル生成
  async generateLearningProfile(userId, analysisData, analysis) {
    const profile = {
      userId,
      analysisDate: new Date(),
      currentState: {
        level: this.calculateOverallLevel(analysisData),
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        learningStyle: this.detectLearningStyle(analysisData)
      },
      recommendations: analysis.recommendations || [],
      adaptations: {
        difficultyAdjustment: this.calculateDifficultyAdjustment(analysisData),
        contentFocus: this.determineContentFocus(analysis),
        pacing: this.determinePacing(analysisData)
      },
      nextSteps: analysis.motivationAdvice || ''
    };
    
    return profile;
  }

  // 全体レベル計算
  calculateOverallLevel(analysisData) {
    // 精度、完了ゲーム数、プレイ時間を考慮
    const accuracyScore = analysisData.accuracy / 100;
    const experienceScore = Math.min(analysisData.gamesCompleted / 100, 1);
    const timeScore = Math.min(analysisData.totalPlayTime / 600, 1); // 10時間で満点
    
    const overallScore = (accuracyScore * 0.5 + experienceScore * 0.3 + timeScore * 0.2);
    
    return Math.ceil(overallScore * 10); // 1-10のレベル
  }

  // 学習スタイル検出
  detectLearningStyle(analysisData) {
    // 簡易的な学習スタイル判定
    if (analysisData.averageResponseTime < 10) {
      return 'quick-learner'; // 素早い学習者
    } else if (analysisData.accuracy > 80) {
      return 'careful-learner'; // 慎重な学習者
    } else {
      return 'balanced-learner'; // バランス型
    }
  }

  // 難易度調整計算
  calculateDifficultyAdjustment(analysisData) {
    const accuracy = analysisData.recentAccuracy / 100;
    const streak = analysisData.recentCorrectStreak;
    
    if (accuracy >= this.thresholds.increaseThreshold || 
        streak >= this.thresholds.streakForIncrease) {
      return {
        direction: 'increase',
        confidence: Math.min(accuracy, 0.9),
        reason: streak >= this.thresholds.streakForIncrease 
          ? `${streak}問連続正解` 
          : `高い正答率（${analysisData.recentAccuracy}%）`
      };
    } else if (accuracy <= this.thresholds.decreaseThreshold) {
      return {
        direction: 'decrease',
        confidence: 1 - accuracy,
        reason: `正答率が低い（${analysisData.recentAccuracy}%）`
      };
    }
    
    return {
      direction: 'maintain',
      confidence: 0.5,
      reason: '適切な難易度レベル'
    };
  }

  // コンテンツフォーカス決定
  determineContentFocus(analysis) {
    if (analysis.weaknesses && analysis.weaknesses.length > 0) {
      return {
        type: 'weakness-focused',
        areas: analysis.weaknesses.slice(0, 3), // 上位3つの弱点
        intensity: 0.7 // 70%を弱点克服に
      };
    }
    
    return {
      type: 'balanced',
      areas: [],
      intensity: 0.5
    };
  }

  // ペーシング決定
  determinePacing(analysisData) {
    const avgResponseTime = analysisData.averageResponseTime;
    
    if (avgResponseTime > 30) {
      return 'slow'; // ゆっくりペース
    } else if (avgResponseTime < 10) {
      return 'fast'; // 速いペース
    }
    
    return 'normal';
  }

  // ゲーム推奨
  async recommendGames(userId, learningProfile, limit = 5) {
    try {
      // 利用可能なゲームを取得
      const availableGames = await this.gameRepository.findActiveGames({ limit: 20 });
      
      // プロファイルに基づいてフィルタリング
      const filteredGames = this.filterGamesByProfile(availableGames, learningProfile);
      
      // AI推奨を取得
      const recommendations = await this.aiService.recommendGames(
        {
          learningStyle: learningProfile.currentState.learningStyle,
          weakAreas: learningProfile.currentState.weaknesses,
          interests: [], // TODO: ユーザーの興味を追跡
          recentGames: [] // TODO: 最近のゲーム履歴
        },
        filteredGames
      );
      
      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Game recommendation error:', error);
      // フォールバック：ランダムに選択
      return availableGames.slice(0, limit);
    }
  }

  // プロファイルに基づくゲームフィルタリング
  filterGamesByProfile(games, profile) {
    return games.filter(game => {
      // 難易度が適切か
      const difficultyMatch = this.isDifficultyAppropriate(
        game.difficulty,
        profile.currentState.level,
        profile.adaptations.difficultyAdjustment
      );
      
      // 弱点分野に対応しているか
      const addressesWeakness = this.addressesWeakAreas(
        game,
        profile.currentState.weaknesses
      );
      
      return difficultyMatch || addressesWeakness;
    });
  }

  // 難易度が適切かチェック
  isDifficultyAppropriate(gameDifficulty, userLevel, adjustment) {
    const targetDifficulty = Math.max(1, Math.min(5, 
      Math.ceil(userLevel / 2) + (adjustment.direction === 'increase' ? 1 : 
                                  adjustment.direction === 'decrease' ? -1 : 0)
    ));
    
    return Math.abs(gameDifficulty - targetDifficulty) <= 1;
  }

  // 弱点分野に対応しているかチェック
  addressesWeakAreas(game, weakAreas) {
    if (!game.metadata || !game.metadata.skills) {
      return false;
    }
    
    return weakAreas.some(weakness => 
      game.metadata.skills.includes(weakness)
    );
  }

  // 難易度適応
  async adaptDifficulty(currentLevel, performance) {
    try {
      const recommendation = await this.aiService.recommendDifficulty({
        currentDifficulty: currentLevel,
        recentAccuracy: performance.accuracy,
        averageResponseTime: performance.averageResponseTime,
        correctStreak: performance.correctStreak,
        hintsUsed: performance.hintsUsed
      });
      
      return {
        newDifficulty: recommendation.recommendedDifficulty,
        reason: recommendation.reason,
        confidence: recommendation.confidence,
        suggestions: recommendation.suggestions
      };
    } catch (error) {
      console.error('Difficulty adaptation error:', error);
      // フォールバック：ルールベースの調整
      return this.fallbackDifficultyAdjustment(currentLevel, performance);
    }
  }

  // フォールバック難易度調整
  fallbackDifficultyAdjustment(currentLevel, performance) {
    const accuracy = performance.accuracy / 100;
    
    if (accuracy >= this.thresholds.increaseThreshold) {
      return {
        newDifficulty: Math.min(currentLevel + 1, 5),
        reason: '高い正答率',
        confidence: 0.7,
        suggestions: []
      };
    } else if (accuracy <= this.thresholds.decreaseThreshold) {
      return {
        newDifficulty: Math.max(currentLevel - 1, 1),
        reason: '低い正答率',
        confidence: 0.7,
        suggestions: []
      };
    }
    
    return {
      newDifficulty: currentLevel,
      reason: '現在の難易度が適切',
      confidence: 0.5,
      suggestions: []
    };
  }

  // コンテンツ生成
  async generateContent(profile, subject, difficulty) {
    if (!this.config.contentGenerationEnabled) {
      throw new Error('Content generation is not enabled');
    }
    
    try {
      const content = await this.aiService.generateContent({
        subject,
        grade: Math.ceil(profile.currentState.level / 2), // レベルから学年を推定
        difficulty,
        topic: profile.currentState.weaknesses[0] || '基礎',
        questionType: 'multiple-choice',
        learningObjective: `${subject}の理解を深める`
      });
      
      return content;
    } catch (error) {
      console.error('Content generation error:', error);
      throw error;
    }
  }

  // 分析履歴保存
  saveAnalysisHistory(userId, analysis) {
    if (!this.analysisHistory.has(userId)) {
      this.analysisHistory.set(userId, []);
    }
    
    const history = this.analysisHistory.get(userId);
    history.push({
      timestamp: new Date(),
      analysis
    });
    
    // 履歴サイズ制限
    if (history.length > 10) {
      history.shift();
    }
  }

  // 分析履歴取得
  getAnalysisHistory(userId) {
    return this.analysisHistory.get(userId) || [];
  }
}