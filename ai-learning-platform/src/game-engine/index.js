// ゲームエンジンメインエクスポート
export { GameEngine } from './core/GameEngine';
export { BaseGame } from './core/BaseGame';
export { GameEventBus, GAME_EVENTS } from './core/GameEventBus';
export { GameLifecycleManager } from './core/GameLifecycleManager';
export { GamePluginSystem, createPlugin } from './core/GamePluginSystem';
export { GameRegistry } from './core/GameRegistry';

// シングルトンゲームエンジンインスタンス
import { GameEngine } from './core/GameEngine';

let gameEngineInstance = null;

// ゲームエンジンインスタンス取得
export const getGameEngine = () => {
  if (!gameEngineInstance) {
    gameEngineInstance = new GameEngine();
  }
  return gameEngineInstance;
};

// ゲームエンジン初期化
export const initializeGameEngine = async () => {
  const engine = getGameEngine();
  await engine.initialize();
  return engine;
};

// ゲームエンジンユーティリティ
export const GameEngineUtils = {
  // ゲーム開始のショートカット
  async startGame(gameId, userId, options = {}) {
    const engine = getGameEngine();
    return await engine.startGame(gameId, userId, options);
  },

  // アクティブセッション取得
  getActiveSession(sessionId) {
    const engine = getGameEngine();
    return engine.getActiveSession(sessionId);
  },

  // ユーザーのアクティブセッション取得
  getUserActiveSessions(userId) {
    const engine = getGameEngine();
    return engine.getUserActiveSessions(userId);
  },

  // セッション操作
  async pauseSession(sessionId) {
    const engine = getGameEngine();
    return await engine.pauseGame(sessionId);
  },

  async resumeSession(sessionId) {
    const engine = getGameEngine();
    return await engine.resumeGame(sessionId);
  },

  async completeSession(sessionId, result) {
    const engine = getGameEngine();
    return await engine.completeGame(sessionId, result);
  },

  // 進捗更新
  async updateProgress(sessionId, progressData) {
    const engine = getGameEngine();
    return await engine.updateProgress(sessionId, progressData);
  },

  // 難易度適応
  async adaptDifficulty(sessionId, aiRecommendation) {
    const engine = getGameEngine();
    return await engine.adaptDifficulty(sessionId, aiRecommendation);
  }
};

// ゲームレジストリユーティリティ
export const GameRegistryUtils = {
  // ゲームタイプ登録
  registerGameType(typeId, gameClass, config = {}) {
    const engine = getGameEngine();
    return engine.gameRegistry.registerGameType(typeId, gameClass, config);
  },

  // ゲームテンプレート登録
  registerTemplate(templateId, template) {
    const engine = getGameEngine();
    return engine.gameRegistry.registerTemplate(templateId, template);
  },

  // ゲームプラグイン登録
  registerPlugin(pluginConfig) {
    const engine = getGameEngine();
    return engine.gameRegistry.registerGamePlugin(pluginConfig);
  },

  // ゲームタイプ検索
  searchGameTypes(criteria) {
    const engine = getGameEngine();
    return engine.gameRegistry.searchGameTypes(criteria);
  },

  // 全ゲームタイプ取得
  getAllGameTypes() {
    const engine = getGameEngine();
    return engine.gameRegistry.getAllGameTypes();
  }
};

// イベントバスユーティリティ
export const EventBusUtils = {
  // イベントリスナー登録
  on(eventName, handler) {
    const engine = getGameEngine();
    engine.eventBus.on(eventName, handler);
  },

  // 一度だけ実行されるリスナー
  once(eventName, handler) {
    const engine = getGameEngine();
    engine.eventBus.once(eventName, handler);
  },

  // イベントリスナー削除
  off(eventName, handler) {
    const engine = getGameEngine();
    engine.eventBus.removeListener(eventName, handler);
  },

  // イベント発火
  emit(eventName, data) {
    const engine = getGameEngine();
    engine.eventBus.emit(eventName, data);
  },

  // イベント待機
  async waitFor(eventName, timeout) {
    const engine = getGameEngine();
    return await engine.eventBus.waitFor(eventName, timeout);
  }
};