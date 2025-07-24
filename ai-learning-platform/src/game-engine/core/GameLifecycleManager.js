// ゲームライフサイクル管理
import { GAME_EVENTS } from './GameEventBus';

export class GameLifecycleManager {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.lifecycleHooks = new Map();
    this.stateTransitions = new Map();
    this.currentStates = new Map(); // ゲームID -> 現在の状態
    
    // 有効な状態の定義
    this.validStates = [
      'unloaded',
      'loading',
      'loaded',
      'initializing',
      'initialized',
      'starting',
      'running',
      'paused',
      'resuming',
      'completing',
      'completed',
      'error'
    ];
    
    // 有効な状態遷移の定義
    this.setupStateTransitions();
    
    // デフォルトのライフサイクルフックを設定
    this.setupDefaultHooks();
  }

  // 状態遷移の設定
  setupStateTransitions() {
    // 各状態から遷移可能な状態を定義
    this.stateTransitions.set('unloaded', ['loading']);
    this.stateTransitions.set('loading', ['loaded', 'error']);
    this.stateTransitions.set('loaded', ['initializing', 'unloaded']);
    this.stateTransitions.set('initializing', ['initialized', 'error']);
    this.stateTransitions.set('initialized', ['starting', 'unloaded']);
    this.stateTransitions.set('starting', ['running', 'error']);
    this.stateTransitions.set('running', ['paused', 'completing', 'error']);
    this.stateTransitions.set('paused', ['resuming', 'completing', 'error']);
    this.stateTransitions.set('resuming', ['running', 'error']);
    this.stateTransitions.set('completing', ['completed', 'error']);
    this.stateTransitions.set('completed', ['unloaded']);
    this.stateTransitions.set('error', ['unloaded']);
  }

  // デフォルトのライフサイクルフック設定
  setupDefaultHooks() {
    // ゲーム読み込み前
    this.addHook('beforeLoad', async (game) => {
      console.log(`Loading game: ${game.id}`);
    });

    // ゲーム初期化前
    this.addHook('beforeInitialize', async (game, session) => {
      console.log(`Initializing game: ${game.id} for session: ${session.id}`);
    });

    // エラー発生時
    this.addHook('onError', async (game, error) => {
      console.error(`Game error in ${game.id}:`, error);
    });
  }

  // ライフサイクルフック追加
  addHook(hookName, handler) {
    if (!this.lifecycleHooks.has(hookName)) {
      this.lifecycleHooks.set(hookName, []);
    }
    this.lifecycleHooks.get(hookName).push(handler);
  }

  // ライフサイクルフック削除
  removeHook(hookName, handler) {
    const hooks = this.lifecycleHooks.get(hookName);
    if (hooks) {
      const index = hooks.indexOf(handler);
      if (index > -1) {
        hooks.splice(index, 1);
      }
    }
  }

  // フック実行
  async executeHooks(hookName, ...args) {
    const hooks = this.lifecycleHooks.get(hookName) || [];
    
    for (const hook of hooks) {
      try {
        await hook(...args);
      } catch (error) {
        console.error(`Error in lifecycle hook ${hookName}:`, error);
        // フックのエラーは伝播させない
      }
    }
  }

  // 状態遷移の検証
  canTransition(gameId, newState) {
    const currentState = this.currentStates.get(gameId) || 'unloaded';
    const allowedStates = this.stateTransitions.get(currentState) || [];
    
    return allowedStates.includes(newState);
  }

  // 状態遷移の実行
  async transitionState(game, newState) {
    const gameId = game.id;
    const currentState = this.currentStates.get(gameId) || 'unloaded';
    
    // 遷移可能かチェック
    if (!this.canTransition(gameId, newState)) {
      throw new Error(
        `Invalid state transition: ${currentState} -> ${newState} for game ${gameId}`
      );
    }
    
    // 遷移前フック
    await this.executeHooks(`before${this.capitalize(newState)}`, game);
    
    // 状態を更新
    this.currentStates.set(gameId, newState);
    
    // 状態変更イベント発火
    this.eventBus.emit(GAME_EVENTS.STATE_CHANGED, {
      gameId,
      from: currentState,
      to: newState
    });
    
    // 遷移後フック
    await this.executeHooks(`after${this.capitalize(newState)}`, game);
  }

  // ゲーム読み込み処理
  async handleGameLoaded(game) {
    await this.transitionState(game, 'loaded');
    
    this.eventBus.emit(GAME_EVENTS.LOADED, {
      gameId: game.id,
      gameType: game.type
    });
  }

  // ゲーム開始処理
  async handleGameStarted(game, session) {
    await this.executeHooks('beforeStart', game, session);
    await this.transitionState(game, 'starting');
    await this.transitionState(game, 'running');
    
    this.eventBus.emit(GAME_EVENTS.STARTED, {
      gameId: game.id,
      sessionId: session.id
    });
    
    await this.executeHooks('afterStart', game, session);
  }

  // ゲーム一時停止処理
  async handleGamePaused(game, session) {
    await this.executeHooks('beforePause', game, session);
    await this.transitionState(game, 'paused');
    
    await this.executeHooks('afterPause', game, session);
  }

  // ゲーム再開処理
  async handleGameResumed(game, session) {
    await this.executeHooks('beforeResume', game, session);
    await this.transitionState(game, 'resuming');
    await this.transitionState(game, 'running');
    
    await this.executeHooks('afterResume', game, session);
  }

  // ゲーム完了処理
  async handleGameCompleted(game, session) {
    await this.executeHooks('beforeComplete', game, session);
    await this.transitionState(game, 'completing');
    await this.transitionState(game, 'completed');
    
    await this.executeHooks('afterComplete', game, session);
  }

  // エラー処理
  async handleGameError(game, error) {
    await this.executeHooks('onError', game, error);
    await this.transitionState(game, 'error');
  }

  // ゲームアンロード処理
  async handleGameUnloaded(game) {
    await this.executeHooks('beforeUnload', game);
    await this.transitionState(game, 'unloaded');
    
    // 状態をクリア
    this.currentStates.delete(game.id);
    
    this.eventBus.emit(GAME_EVENTS.UNLOADED, {
      gameId: game.id
    });
    
    await this.executeHooks('afterUnload', game);
  }

  // 現在の状態取得
  getCurrentState(gameId) {
    return this.currentStates.get(gameId) || 'unloaded';
  }

  // 状態履歴取得
  getStateHistory(gameId) {
    // イベントバスの履歴から状態遷移を抽出
    const history = this.eventBus.getEventHistory(GAME_EVENTS.STATE_CHANGED);
    return history.filter(event => event.data.gameId === gameId);
  }

  // 実行中のゲーム取得
  getRunningGames() {
    const runningGames = [];
    
    this.currentStates.forEach((state, gameId) => {
      if (state === 'running') {
        runningGames.push(gameId);
      }
    });
    
    return runningGames;
  }

  // ライフサイクル統計取得
  getLifecycleStats() {
    const stats = {
      totalGames: this.currentStates.size,
      gamesByState: {}
    };
    
    // 状態別のゲーム数を集計
    this.validStates.forEach(state => {
      stats.gamesByState[state] = 0;
    });
    
    this.currentStates.forEach((state) => {
      if (stats.gamesByState[state] !== undefined) {
        stats.gamesByState[state]++;
      }
    });
    
    return stats;
  }

  // ヘルパー関数：文字列の最初を大文字にする
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // クリーンアップ
  cleanup() {
    this.currentStates.clear();
    this.lifecycleHooks.clear();
  }
}