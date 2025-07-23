// ゲームセッションモデルクラス
import { generateId } from '../utils/helpers';
import { SESSION_STATUS } from '../constants/config';

export class GameSession {
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.gameId = data.gameId || null;
    this.userId = data.userId || null;
    this.status = data.status || SESSION_STATUS.IN_PROGRESS;
    this.startTime = data.startTime || new Date();
    this.endTime = data.endTime || null;
    this.pausedTime = data.pausedTime || 0; // 一時停止した時間の合計（ミリ秒）
    this.progress = data.progress || this.createDefaultProgress();
    this.results = data.results || [];
    this.score = data.score || 0;
    this.performance = data.performance || this.createDefaultPerformance();
    this.aiAdaptations = data.aiAdaptations || [];
    this.events = data.events || [];
    this.metadata = data.metadata || {};
  }

  // デフォルト進捗の作成
  createDefaultProgress() {
    return {
      currentLevel: 1,
      currentQuestion: 0,
      totalQuestions: 0,
      completedQuestions: [],
      skippedQuestions: [],
      checkpoints: []
    };
  }

  // デフォルトパフォーマンスの作成
  createDefaultPerformance() {
    return {
      accuracy: 0, // 正答率
      averageResponseTime: 0, // 平均回答時間（秒）
      totalCorrect: 0,
      totalIncorrect: 0,
      totalSkipped: 0,
      streakCurrent: 0, // 現在の連続正解数
      streakBest: 0, // 最高連続正解数
      hintsUsed: 0,
      difficultyChanges: []
    };
  }

  // セッション開始
  start() {
    this.status = SESSION_STATUS.IN_PROGRESS;
    this.startTime = new Date();
  }

  // セッション一時停止
  pause() {
    if (this.status === SESSION_STATUS.IN_PROGRESS) {
      this.status = SESSION_STATUS.PAUSED;
      this.pauseStartTime = new Date();
      this.addEvent('session_paused');
    }
  }

  // セッション再開
  resume() {
    if (this.status === SESSION_STATUS.PAUSED && this.pauseStartTime) {
      const pauseDuration = new Date() - this.pauseStartTime;
      this.pausedTime += pauseDuration;
      this.status = SESSION_STATUS.IN_PROGRESS;
      delete this.pauseStartTime;
      this.addEvent('session_resumed');
    }
  }

  // セッション完了
  complete(finalResult = {}) {
    this.status = SESSION_STATUS.COMPLETED;
    this.endTime = new Date();
    if (finalResult) {
      this.results.push(finalResult);
    }
    this.calculateFinalPerformance();
    this.addEvent('session_completed');
  }

  // セッション破棄
  abandon() {
    this.status = SESSION_STATUS.ABANDONED;
    this.endTime = new Date();
    this.addEvent('session_abandoned');
  }

  // 進捗更新
  updateProgress(progressData) {
    this.progress = { ...this.progress, ...progressData };
  }

  // 質問の結果を記録
  recordQuestionResult(questionId, result) {
    const questionResult = {
      questionId,
      timestamp: new Date(),
      ...result
    };
    
    this.results.push(questionResult);
    
    // パフォーマンス更新
    if (result.isCorrect) {
      this.performance.totalCorrect++;
      this.performance.streakCurrent++;
      if (this.performance.streakCurrent > this.performance.streakBest) {
        this.performance.streakBest = this.performance.streakCurrent;
      }
      this.score += result.points || 10;
    } else {
      this.performance.totalIncorrect++;
      this.performance.streakCurrent = 0;
      this.score += result.points || -5;
    }
    
    if (result.skipped) {
      this.performance.totalSkipped++;
    }
    
    if (result.hintUsed) {
      this.performance.hintsUsed++;
    }
    
    // 正答率を更新
    const totalAnswered = this.performance.totalCorrect + this.performance.totalIncorrect;
    if (totalAnswered > 0) {
      this.performance.accuracy = this.performance.totalCorrect / totalAnswered;
    }
    
    // 平均回答時間を更新
    if (result.responseTime) {
      const totalTime = this.results.reduce((sum, r) => sum + (r.responseTime || 0), 0);
      this.performance.averageResponseTime = totalTime / this.results.length;
    }
  }

  // AI適応を記録
  recordAIAdaptation(adaptation) {
    this.aiAdaptations.push({
      timestamp: new Date(),
      ...adaptation
    });
    
    if (adaptation.type === 'difficulty_change') {
      this.performance.difficultyChanges.push({
        from: adaptation.from,
        to: adaptation.to,
        reason: adaptation.reason,
        timestamp: new Date()
      });
    }
  }

  // イベントを追加
  addEvent(eventType, data = {}) {
    this.events.push({
      type: eventType,
      timestamp: new Date(),
      data
    });
  }

  // チェックポイントを保存
  saveCheckpoint(checkpointData) {
    this.progress.checkpoints.push({
      id: generateId(),
      timestamp: new Date(),
      ...checkpointData
    });
  }

  // 最終パフォーマンスを計算
  calculateFinalPerformance() {
    // 実プレイ時間を計算（一時停止時間を除く）
    if (this.endTime && this.startTime) {
      const totalTime = this.endTime - this.startTime - this.pausedTime;
      this.metadata.totalPlayTime = Math.floor(totalTime / 1000); // 秒単位
    }
    
    // その他の最終統計
    this.metadata.finalScore = this.score;
    this.metadata.finalAccuracy = this.performance.accuracy;
    this.metadata.questionsAttempted = this.results.length;
  }

  // プレイ時間を取得（秒）
  getPlayTime() {
    const now = this.endTime || new Date();
    const elapsed = now - this.startTime - this.pausedTime;
    return Math.floor(elapsed / 1000);
  }

  // セッションが有効かチェック
  isActive() {
    return this.status === SESSION_STATUS.IN_PROGRESS || this.status === SESSION_STATUS.PAUSED;
  }

  // Firestoreドキュメント形式に変換
  toFirestore() {
    return {
      gameId: this.gameId,
      userId: this.userId,
      status: this.status,
      startTime: this.startTime,
      endTime: this.endTime,
      pausedTime: this.pausedTime,
      progress: this.progress,
      results: this.results,
      score: this.score,
      performance: this.performance,
      aiAdaptations: this.aiAdaptations,
      events: this.events,
      metadata: this.metadata
    };
  }

  // Supabaseレコード形式に変換
  toSupabase() {
    return {
      id: this.id,
      game_id: this.gameId,
      user_id: this.userId,
      status: this.status,
      start_time: this.startTime.toISOString(),
      end_time: this.endTime ? this.endTime.toISOString() : null,
      paused_time: this.pausedTime,
      progress: JSON.stringify(this.progress),
      results: JSON.stringify(this.results),
      score: this.score,
      performance: JSON.stringify(this.performance),
      ai_adaptations: JSON.stringify(this.aiAdaptations),
      events: JSON.stringify(this.events),
      metadata: JSON.stringify(this.metadata)
    };
  }

  // Firestoreドキュメントから作成
  static fromFirestore(id, data) {
    return new GameSession({
      id,
      ...data,
      startTime: data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime),
      endTime: data.endTime?.toDate ? data.endTime.toDate() : (data.endTime ? new Date(data.endTime) : null),
      results: data.results || [],
      aiAdaptations: data.aiAdaptations || [],
      events: data.events || []
    });
  }

  // Supabaseレコードから作成
  static fromSupabase(data) {
    return new GameSession({
      id: data.id,
      gameId: data.game_id,
      userId: data.user_id,
      status: data.status,
      startTime: new Date(data.start_time),
      endTime: data.end_time ? new Date(data.end_time) : null,
      pausedTime: data.paused_time,
      progress: typeof data.progress === 'string' ? JSON.parse(data.progress) : data.progress,
      results: typeof data.results === 'string' ? JSON.parse(data.results) : data.results,
      score: data.score,
      performance: typeof data.performance === 'string' ? JSON.parse(data.performance) : data.performance,
      aiAdaptations: typeof data.ai_adaptations === 'string' ? JSON.parse(data.ai_adaptations) : data.ai_adaptations,
      events: typeof data.events === 'string' ? JSON.parse(data.events) : data.events,
      metadata: typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata
    });
  }
}