// ゲームエンジンコアクラス
import { getGameRepository, getGameSessionRepository, getLearningProgressRepository } from '../../services/database';
import { GameSession } from '../../models/GameSession';
import { GameEventBus } from './GameEventBus';
import { GameLifecycleManager } from './GameLifecycleManager';
import { GameRegistry } from './GameRegistry';
import { SESSION_STATUS } from '../../constants/config';

export class GameEngine {
  constructor() {
    this.gameRepository = getGameRepository();
    this.sessionRepository = getGameSessionRepository();
    this.progressRepository = getLearningProgressRepository();
    this.eventBus = new GameEventBus();
    this.lifecycleManager = new GameLifecycleManager(this.eventBus);
    this.gameRegistry = new GameRegistry();
    this.activeSessions = new Map(); // セッションIDをキーとする
    this.loadedGames = new Map(); // ゲームIDをキーとする
  }

  // ゲームエンジン初期化
  async initialize() {
    console.log('Initializing Game Engine...');
    
    // イベントハンドラーの登録
    this.setupEventHandlers();
    
    // ゲームレジストリの初期化
    await this.gameRegistry.initialize();
    
    console.log('Game Engine initialized successfully');
  }

  // イベントハンドラーの設定
  setupEventHandlers() {
    // ゲーム完了イベント
    this.eventBus.on('game:completed', async (data) => {
      await this.handleGameCompleted(data);
    });

    // ゲーム一時停止イベント
    this.eventBus.on('game:paused', async (data) => {
      await this.handleGamePaused(data);
    });

    // エラーイベント
    this.eventBus.on('game:error', (data) => {
      this.handleGameError(data);
    });
  }

  // ゲーム読み込み
  async loadGame(gameId) {
    try {
      // キャッシュチェック
      if (this.loadedGames.has(gameId)) {
        return this.loadedGames.get(gameId);
      }

      // データベースから読み込み
      const gameData = await this.gameRepository.findById(gameId);
      if (!gameData) {
        throw new Error(`Game not found: ${gameId}`);
      }

      // ゲームインスタンスを作成
      const GameClass = this.gameRegistry.getGameClass(gameData.type);
      if (!GameClass) {
        throw new Error(`Game type not registered: ${gameData.type}`);
      }

      const game = new GameClass(gameData);
      
      // キャッシュに保存
      this.loadedGames.set(gameId, game);
      
      // ライフサイクルイベント発火
      await this.lifecycleManager.handleGameLoaded(game);
      
      return game;
    } catch (error) {
      console.error('Failed to load game:', error);
      throw error;
    }
  }

  // ゲーム開始
  async startGame(gameId, userId, options = {}) {
    try {
      // ゲームを読み込み
      const game = await this.loadGame(gameId);
      
      // 既存のアクティブセッションをチェック
      const activeSessions = await this.sessionRepository.findActiveByUser(userId);
      const existingSession = activeSessions.find(s => s.gameId === gameId);
      
      if (existingSession) {
        // 既存セッションを再開
        return await this.resumeGame(existingSession.id);
      }

      // 新しいセッションを作成
      const sessionData = {
        gameId,
        userId,
        startTime: new Date(),
        status: SESSION_STATUS.IN_PROGRESS,
        metadata: options.metadata || {}
      };

      const session = await this.sessionRepository.create(sessionData);
      
      // アクティブセッションに追加
      this.activeSessions.set(session.id, {
        session,
        game,
        userId
      });

      // ゲームインスタンスを初期化
      await game.initialize(session, this.eventBus);
      
      // ライフサイクルイベント発火
      await this.lifecycleManager.handleGameStarted(game, session);
      
      return {
        sessionId: session.id,
        game,
        session
      };
    } catch (error) {
      console.error('Failed to start game:', error);
      throw error;
    }
  }

  // ゲーム一時停止
  async pauseGame(sessionId) {
    try {
      const activeSession = this.activeSessions.get(sessionId);
      if (!activeSession) {
        throw new Error(`Active session not found: ${sessionId}`);
      }

      const { session, game } = activeSession;
      
      // セッション状態を更新
      session.pause();
      await this.sessionRepository.update(sessionId, session.toFirestore());
      
      // ゲームインスタンスに通知
      if (game.pause) {
        await game.pause();
      }
      
      // ライフサイクルイベント発火
      await this.lifecycleManager.handleGamePaused(game, session);
      
      return session;
    } catch (error) {
      console.error('Failed to pause game:', error);
      throw error;
    }
  }

  // ゲーム再開
  async resumeGame(sessionId) {
    try {
      let activeSession = this.activeSessions.get(sessionId);
      
      if (!activeSession) {
        // データベースから復元
        const session = await this.sessionRepository.findById(sessionId);
        if (!session || !session.isActive()) {
          throw new Error(`Session not available for resume: ${sessionId}`);
        }
        
        const game = await this.loadGame(session.gameId);
        activeSession = {
          session,
          game,
          userId: session.userId
        };
        
        this.activeSessions.set(sessionId, activeSession);
      }

      const { session, game } = activeSession;
      
      // セッション状態を更新
      session.resume();
      await this.sessionRepository.update(sessionId, session.toFirestore());
      
      // ゲームインスタンスに通知
      if (game.resume) {
        await game.resume(session);
      }
      
      // ライフサイクルイベント発火
      await this.lifecycleManager.handleGameResumed(game, session);
      
      return {
        sessionId: session.id,
        game,
        session
      };
    } catch (error) {
      console.error('Failed to resume game:', error);
      throw error;
    }
  }

  // ゲーム完了
  async completeGame(sessionId, result = {}) {
    try {
      const activeSession = this.activeSessions.get(sessionId);
      if (!activeSession) {
        throw new Error(`Active session not found: ${sessionId}`);
      }

      const { session, game, userId } = activeSession;
      
      // セッションを完了
      session.complete(result);
      await this.sessionRepository.update(sessionId, session.toFirestore());
      
      // 学習進捗を更新
      await this.updateLearningProgress(userId, game, session);
      
      // ゲームインスタンスに通知
      if (game.complete) {
        await game.complete(session);
      }
      
      // ライフサイクルイベント発火
      await this.lifecycleManager.handleGameCompleted(game, session);
      
      // アクティブセッションから削除
      this.activeSessions.delete(sessionId);
      
      return session;
    } catch (error) {
      console.error('Failed to complete game:', error);
      throw error;
    }
  }

  // 進捗更新
  async updateProgress(sessionId, progressData) {
    try {
      const activeSession = this.activeSessions.get(sessionId);
      if (!activeSession) {
        throw new Error(`Active session not found: ${sessionId}`);
      }

      const { session } = activeSession;
      
      // セッション進捗を更新
      session.updateProgress(progressData);
      await this.sessionRepository.update(sessionId, session.toFirestore());
      
      // 進捗イベント発火
      this.eventBus.emit('game:progress', {
        sessionId,
        progress: progressData
      });
      
      return session;
    } catch (error) {
      console.error('Failed to update progress:', error);
      throw error;
    }
  }

  // 難易度適応
  async adaptDifficulty(sessionId, aiRecommendation) {
    try {
      const activeSession = this.activeSessions.get(sessionId);
      if (!activeSession) {
        throw new Error(`Active session not found: ${sessionId}`);
      }

      const { session, game } = activeSession;
      
      // AI適応を記録
      session.recordAIAdaptation({
        type: 'difficulty_change',
        ...aiRecommendation
      });
      
      // ゲームに難易度変更を適用
      if (game.adaptDifficulty) {
        await game.adaptDifficulty(aiRecommendation);
      }
      
      await this.sessionRepository.update(sessionId, session.toFirestore());
      
      return session;
    } catch (error) {
      console.error('Failed to adapt difficulty:', error);
      throw error;
    }
  }

  // 学習進捗更新
  async updateLearningProgress(userId, game, session) {
    try {
      let progress = await this.progressRepository.findByUserAndSubject(
        userId,
        game.subject
      );

      if (!progress) {
        // 新規作成
        progress = await this.progressRepository.create({
          userId,
          subject: game.subject
        });
      }

      // ゲーム結果から進捗を更新
      progress.updateFromGameResult(session);
      
      // データベースに保存
      await this.progressRepository.update(progress.id, progress.toFirestore());
      
      return progress;
    } catch (error) {
      console.error('Failed to update learning progress:', error);
      throw error;
    }
  }

  // イベントハンドラー
  async handleGameCompleted(data) {
    const { sessionId } = data;
    console.log(`Game completed: ${sessionId}`);
    // 追加の処理（通知、実績チェックなど）
  }

  async handleGamePaused(data) {
    const { sessionId } = data;
    console.log(`Game paused: ${sessionId}`);
    // 追加の処理
  }

  handleGameError(data) {
    const { sessionId, error } = data;
    console.error(`Game error in session ${sessionId}:`, error);
    // エラーログ、通知など
  }

  // アクティブセッション取得
  getActiveSession(sessionId) {
    return this.activeSessions.get(sessionId);
  }

  // ユーザーのアクティブセッション取得
  getUserActiveSessions(userId) {
    const sessions = [];
    this.activeSessions.forEach((data, sessionId) => {
      if (data.userId === userId) {
        sessions.push({
          sessionId,
          ...data
        });
      }
    });
    return sessions;
  }

  // クリーンアップ
  async cleanup() {
    // アクティブセッションを保存
    for (const [sessionId, data] of this.activeSessions) {
      try {
        await this.sessionRepository.update(sessionId, data.session.toFirestore());
      } catch (error) {
        console.error(`Failed to save session ${sessionId}:`, error);
      }
    }
    
    // リソースのクリーンアップ
    this.activeSessions.clear();
    this.loadedGames.clear();
    this.eventBus.removeAllListeners();
  }
}