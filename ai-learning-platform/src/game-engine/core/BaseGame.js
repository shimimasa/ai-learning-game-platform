// ゲーム基底クラス
import React from 'react';

export class BaseGame {
  constructor(gameData) {
    this.id = gameData.id;
    this.title = gameData.title;
    this.description = gameData.description;
    this.subject = gameData.subject;
    this.type = gameData.type;
    this.difficulty = gameData.difficulty;
    this.metadata = gameData.metadata;
    this.config = gameData.config;
    this.aiConfig = gameData.aiConfig;
    this.content = gameData.content;
    
    // ゲーム状態
    this.session = null;
    this.eventBus = null;
    this.state = {
      isInitialized: false,
      isPaused: false,
      isCompleted: false,
      currentProgress: {}
    };
    
    // パフォーマンス追跡
    this.performance = {
      startTime: null,
      totalTime: 0,
      pausedTime: 0
    };
  }

  // ゲーム初期化（必須実装）
  async initialize(session, eventBus) {
    this.session = session;
    this.eventBus = eventBus;
    this.state.isInitialized = true;
    this.performance.startTime = new Date();
    
    // サブクラスの初期化処理を呼び出し
    await this.onInitialize();
    
    // 初期化完了イベント
    this.emitEvent('game:initialized', {
      gameId: this.id,
      sessionId: session.id
    });
  }

  // サブクラスでオーバーライドする初期化処理
  async onInitialize() {
    // サブクラスで実装
  }

  // ゲーム開始
  async start() {
    if (!this.state.isInitialized) {
      throw new Error('Game must be initialized before starting');
    }
    
    await this.onStart();
    
    this.emitEvent('game:started', {
      gameId: this.id,
      sessionId: this.session.id
    });
  }

  // サブクラスでオーバーライドする開始処理
  async onStart() {
    // サブクラスで実装
  }

  // ゲーム一時停止
  async pause() {
    if (this.state.isPaused) return;
    
    this.state.isPaused = true;
    this.performance.pauseStartTime = new Date();
    
    await this.onPause();
    
    this.emitEvent('game:paused', {
      gameId: this.id,
      sessionId: this.session.id,
      progress: this.getProgress()
    });
  }

  // サブクラスでオーバーライドする一時停止処理
  async onPause() {
    // サブクラスで実装
  }

  // ゲーム再開
  async resume() {
    if (!this.state.isPaused) return;
    
    // 一時停止時間を記録
    if (this.performance.pauseStartTime) {
      const pauseDuration = new Date() - this.performance.pauseStartTime;
      this.performance.pausedTime += pauseDuration;
    }
    
    this.state.isPaused = false;
    
    await this.onResume();
    
    this.emitEvent('game:resumed', {
      gameId: this.id,
      sessionId: this.session.id
    });
  }

  // サブクラスでオーバーライドする再開処理
  async onResume() {
    // サブクラスで実装
  }

  // ゲーム完了
  async complete(result = {}) {
    if (this.state.isCompleted) return;
    
    this.state.isCompleted = true;
    
    // 総プレイ時間を計算
    const now = new Date();
    this.performance.totalTime = now - this.performance.startTime - this.performance.pausedTime;
    
    const finalResult = {
      ...result,
      gameId: this.id,
      sessionId: this.session.id,
      performance: this.getPerformanceMetrics(),
      finalProgress: this.getProgress()
    };
    
    await this.onComplete(finalResult);
    
    this.emitEvent('game:completed', finalResult);
  }

  // サブクラスでオーバーライドする完了処理
  async onComplete(result) {
    // サブクラスで実装
  }

  // 進捗更新
  updateProgress(progress) {
    this.state.currentProgress = {
      ...this.state.currentProgress,
      ...progress,
      timestamp: new Date()
    };
    
    this.emitEvent('game:progress', {
      gameId: this.id,
      sessionId: this.session.id,
      progress: this.state.currentProgress
    });
  }

  // 現在の進捗取得
  getProgress() {
    return {
      ...this.state.currentProgress,
      isPaused: this.state.isPaused,
      isCompleted: this.state.isCompleted
    };
  }

  // パフォーマンスメトリクス取得
  getPerformanceMetrics() {
    return {
      totalTime: this.performance.totalTime,
      pausedTime: this.performance.pausedTime,
      activeTime: this.performance.totalTime - this.performance.pausedTime
    };
  }

  // 難易度適応
  async adaptDifficulty(recommendation) {
    await this.onAdaptDifficulty(recommendation);
    
    this.emitEvent('game:difficulty-changed', {
      gameId: this.id,
      sessionId: this.session.id,
      from: this.difficulty,
      to: recommendation.newDifficulty,
      reason: recommendation.reason
    });
    
    this.difficulty = recommendation.newDifficulty;
  }

  // サブクラスでオーバーライドする難易度適応処理
  async onAdaptDifficulty(recommendation) {
    // サブクラスで実装
  }

  // 質問結果を記録
  recordAnswer(questionId, answer, isCorrect, responseTime) {
    const result = {
      questionId,
      answer,
      isCorrect,
      responseTime,
      timestamp: new Date()
    };
    
    // セッションに記録
    if (this.session && this.session.recordQuestionResult) {
      this.session.recordQuestionResult(questionId, result);
    }
    
    this.emitEvent('game:answer-recorded', {
      gameId: this.id,
      sessionId: this.session.id,
      result
    });
    
    return result;
  }

  // ヒント使用を記録
  recordHintUsed(hintType, context = {}) {
    const hintData = {
      type: hintType,
      context,
      timestamp: new Date()
    };
    
    this.emitEvent('game:hint-used', {
      gameId: this.id,
      sessionId: this.session.id,
      hint: hintData
    });
  }

  // イベント発火
  emitEvent(eventName, data) {
    if (this.eventBus) {
      this.eventBus.emit(eventName, {
        ...data,
        timestamp: new Date()
      });
    }
  }

  // エラーハンドリング
  handleError(error, context = {}) {
    console.error(`Game error in ${this.id}:`, error);
    
    this.emitEvent('game:error', {
      gameId: this.id,
      sessionId: this.session?.id,
      error: {
        message: error.message,
        stack: error.stack,
        context
      }
    });
  }

  // Reactコンポーネントをレンダリング（必須実装）
  render() {
    throw new Error('render() must be implemented by subclass');
  }

  // リソースのクリーンアップ
  async cleanup() {
    await this.onCleanup();
    
    // イベントリスナーの削除など
    this.session = null;
    this.eventBus = null;
  }

  // サブクラスでオーバーライドするクリーンアップ処理
  async onCleanup() {
    // サブクラスで実装
  }

  // ゲーム設定を検証
  validateConfig() {
    if (!this.id) {
      throw new Error('Game ID is required');
    }
    if (!this.title) {
      throw new Error('Game title is required');
    }
    if (!this.type) {
      throw new Error('Game type is required');
    }
    if (!this.subject) {
      throw new Error('Game subject is required');
    }
  }

  // チェックポイント保存
  saveCheckpoint(checkpointData = {}) {
    const checkpoint = {
      gameId: this.id,
      progress: this.getProgress(),
      performance: this.getPerformanceMetrics(),
      ...checkpointData
    };
    
    if (this.session && this.session.saveCheckpoint) {
      this.session.saveCheckpoint(checkpoint);
    }
    
    this.emitEvent('game:checkpoint-saved', {
      gameId: this.id,
      sessionId: this.session.id,
      checkpoint
    });
    
    return checkpoint;
  }

  // チェックポイントから復元
  async restoreFromCheckpoint(checkpoint) {
    this.state.currentProgress = checkpoint.progress || {};
    
    await this.onRestoreCheckpoint(checkpoint);
    
    this.emitEvent('game:checkpoint-restored', {
      gameId: this.id,
      sessionId: this.session.id,
      checkpoint
    });
  }

  // サブクラスでオーバーライドする復元処理
  async onRestoreCheckpoint(checkpoint) {
    // サブクラスで実装
  }
}