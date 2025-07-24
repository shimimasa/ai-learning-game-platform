// ゲームイベントバス - イベント駆動アーキテクチャの中核
import { EventEmitter } from 'events';

export class GameEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // 多数のリスナーをサポート
    this.eventHistory = [];
    this.eventFilters = new Map();
    this.asyncHandlers = new Map();
  }

  // イベント発火（履歴記録付き）
  emit(eventName, data) {
    const event = {
      name: eventName,
      data,
      timestamp: new Date(),
      id: this.generateEventId()
    };

    // イベント履歴に追加
    this.eventHistory.push(event);
    
    // 履歴サイズ制限（メモリ対策）
    if (this.eventHistory.length > 1000) {
      this.eventHistory.shift();
    }

    // フィルター適用
    if (this.shouldFilterEvent(eventName, data)) {
      return false;
    }

    // 通常のイベント発火
    super.emit(eventName, event);
    
    // ワイルドカードイベント
    super.emit('*', event);
    
    // 非同期ハンドラーの実行
    this.executeAsyncHandlers(eventName, event);
    
    return true;
  }

  // 非同期イベントハンドラー登録
  onAsync(eventName, handler) {
    if (!this.asyncHandlers.has(eventName)) {
      this.asyncHandlers.set(eventName, []);
    }
    this.asyncHandlers.get(eventName).push(handler);
  }

  // 非同期ハンドラーの実行
  async executeAsyncHandlers(eventName, event) {
    const handlers = this.asyncHandlers.get(eventName) || [];
    
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Async handler error for ${eventName}:`, error);
        this.emit('eventbus:error', {
          originalEvent: eventName,
          error: error.message
        });
      }
    }
  }

  // イベントフィルター追加
  addFilter(eventName, filterFn) {
    if (!this.eventFilters.has(eventName)) {
      this.eventFilters.set(eventName, []);
    }
    this.eventFilters.get(eventName).push(filterFn);
  }

  // イベントフィルター判定
  shouldFilterEvent(eventName, data) {
    const filters = this.eventFilters.get(eventName) || [];
    return filters.some(filter => filter(data));
  }

  // 一度だけ実行されるリスナー（Promise対応）
  onceAsync(eventName) {
    return new Promise((resolve) => {
      this.once(eventName, resolve);
    });
  }

  // タイムアウト付きイベント待機
  waitFor(eventName, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeListener(eventName, handler);
        reject(new Error(`Timeout waiting for event: ${eventName}`));
      }, timeout);

      const handler = (event) => {
        clearTimeout(timer);
        resolve(event);
      };

      this.once(eventName, handler);
    });
  }

  // イベント履歴取得
  getEventHistory(eventName = null, limit = 100) {
    let history = this.eventHistory;
    
    if (eventName) {
      history = history.filter(event => event.name === eventName);
    }
    
    return history.slice(-limit);
  }

  // イベント統計取得
  getEventStats() {
    const stats = {};
    
    this.eventHistory.forEach(event => {
      if (!stats[event.name]) {
        stats[event.name] = {
          count: 0,
          firstOccurrence: event.timestamp,
          lastOccurrence: event.timestamp
        };
      }
      
      stats[event.name].count++;
      stats[event.name].lastOccurrence = event.timestamp;
    });
    
    return stats;
  }

  // イベントチェーン作成
  createEventChain() {
    return new EventChain(this);
  }

  // デバッグ用：全イベントをコンソールに出力
  enableDebugMode() {
    this.on('*', (event) => {
      console.log(`[GameEventBus] ${event.name}:`, event.data);
    });
  }

  // イベントID生成
  generateEventId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 特定のイベントのリスナーをクリア
  clearEventListeners(eventName) {
    this.removeAllListeners(eventName);
  }

  // 全イベント履歴をクリア
  clearEventHistory() {
    this.eventHistory = [];
  }

  // イベントバスの状態をリセット
  reset() {
    this.removeAllListeners();
    this.clearEventHistory();
    this.eventFilters.clear();
    this.asyncHandlers.clear();
  }
}

// イベントチェーン - 複数イベントの連鎖処理
class EventChain {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.chain = [];
  }

  // イベント待機を追加
  wait(eventName, timeout) {
    this.chain.push({
      type: 'wait',
      eventName,
      timeout
    });
    return this;
  }

  // イベント発火を追加
  emit(eventName, data) {
    this.chain.push({
      type: 'emit',
      eventName,
      data
    });
    return this;
  }

  // 遅延を追加
  delay(ms) {
    this.chain.push({
      type: 'delay',
      duration: ms
    });
    return this;
  }

  // チェーン実行
  async execute() {
    const results = [];
    
    for (const action of this.chain) {
      try {
        let result;
        
        switch (action.type) {
          case 'wait':
            result = await this.eventBus.waitFor(action.eventName, action.timeout);
            break;
          case 'emit':
            result = this.eventBus.emit(action.eventName, action.data);
            break;
          case 'delay':
            await new Promise(resolve => setTimeout(resolve, action.duration));
            result = { delayed: action.duration };
            break;
        }
        
        results.push({ action, result });
      } catch (error) {
        results.push({ action, error: error.message });
        throw error; // チェーンを中断
      }
    }
    
    return results;
  }
}

// よく使用されるイベント名の定数
export const GAME_EVENTS = {
  // ライフサイクルイベント
  INITIALIZED: 'game:initialized',
  STARTED: 'game:started',
  PAUSED: 'game:paused',
  RESUMED: 'game:resumed',
  COMPLETED: 'game:completed',
  ERROR: 'game:error',
  
  // 進捗イベント
  PROGRESS: 'game:progress',
  CHECKPOINT_SAVED: 'game:checkpoint-saved',
  CHECKPOINT_RESTORED: 'game:checkpoint-restored',
  
  // インタラクションイベント
  ANSWER_RECORDED: 'game:answer-recorded',
  HINT_USED: 'game:hint-used',
  DIFFICULTY_CHANGED: 'game:difficulty-changed',
  
  // システムイベント
  LOADED: 'game:loaded',
  UNLOADED: 'game:unloaded',
  STATE_CHANGED: 'game:state-changed'
};