// ゲームプラグインシステム - 拡張可能なゲームアーキテクチャ
export class GamePluginSystem {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
    this.loadOrder = [];
    this.dependencies = new Map();
  }

  // プラグイン登録
  register(pluginConfig) {
    const { 
      id, 
      name, 
      version, 
      gameTypes, 
      dependencies = [], 
      initialize, 
      hooks = {},
      components = {},
      api = {}
    } = pluginConfig;

    // 必須フィールドの検証
    if (!id || !name || !version || !initialize) {
      throw new Error('Plugin must have id, name, version, and initialize function');
    }

    // プラグイン情報を保存
    const plugin = {
      id,
      name,
      version,
      gameTypes: gameTypes || ['*'], // デフォルトは全ゲームタイプ
      dependencies,
      initialize,
      hooks,
      components,
      api,
      isLoaded: false
    };

    this.plugins.set(id, plugin);
    this.dependencies.set(id, dependencies);

    // フックを登録
    Object.entries(hooks).forEach(([hookName, handler]) => {
      this.registerHook(id, hookName, handler);
    });

    console.log(`Registered plugin: ${name} v${version}`);
    return plugin;
  }

  // プラグイン取得
  getPlugin(pluginId) {
    return this.plugins.get(pluginId);
  }

  // ゲームタイプに対応するプラグイン取得
  getPluginsForGameType(gameType) {
    const applicablePlugins = [];
    
    this.plugins.forEach((plugin) => {
      if (plugin.gameTypes.includes('*') || plugin.gameTypes.includes(gameType)) {
        applicablePlugins.push(plugin);
      }
    });

    return applicablePlugins;
  }

  // フック登録
  registerHook(pluginId, hookName, handler) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    
    this.hooks.get(hookName).push({
      pluginId,
      handler
    });
  }

  // フック実行
  async executeHook(hookName, context = {}) {
    const hookHandlers = this.hooks.get(hookName) || [];
    const results = [];

    for (const { pluginId, handler } of hookHandlers) {
      try {
        const plugin = this.plugins.get(pluginId);
        if (plugin && plugin.isLoaded) {
          const result = await handler(context);
          results.push({ pluginId, result });
        }
      } catch (error) {
        console.error(`Hook error in plugin ${pluginId}:`, error);
        results.push({ pluginId, error: error.message });
      }
    }

    return results;
  }

  // プラグイン初期化
  async initializePlugin(pluginId, gameEngine) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (plugin.isLoaded) {
      return plugin;
    }

    // 依存関係を先に初期化
    for (const depId of plugin.dependencies) {
      if (!this.plugins.get(depId)?.isLoaded) {
        await this.initializePlugin(depId, gameEngine);
      }
    }

    // プラグインを初期化
    try {
      const pluginContext = this.createPluginContext(pluginId, gameEngine);
      await plugin.initialize(pluginContext);
      plugin.isLoaded = true;
      this.loadOrder.push(pluginId);
      
      console.log(`Initialized plugin: ${plugin.name}`);
      return plugin;
    } catch (error) {
      console.error(`Failed to initialize plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  // プラグインコンテキスト作成
  createPluginContext(pluginId, gameEngine) {
    return {
      pluginId,
      gameEngine,
      
      // 他のプラグインのAPIアクセス
      getPluginAPI: (targetPluginId) => {
        const targetPlugin = this.plugins.get(targetPluginId);
        return targetPlugin?.api || null;
      },
      
      // フック登録
      registerHook: (hookName, handler) => {
        this.registerHook(pluginId, hookName, handler);
      },
      
      // イベントバスアクセス
      eventBus: gameEngine.eventBus,
      
      // ゲームレジストリアクセス
      gameRegistry: gameEngine.gameRegistry,
      
      // ユーティリティ
      utils: {
        loadScript: this.loadScript.bind(this),
        loadStyle: this.loadStyle.bind(this)
      }
    };
  }

  // 全プラグイン初期化
  async initializeAll(gameEngine) {
    // 依存関係を解決して初期化順序を決定
    const sortedPluginIds = this.topologicalSort();
    
    for (const pluginId of sortedPluginIds) {
      await this.initializePlugin(pluginId, gameEngine);
    }

    console.log(`Initialized ${this.loadOrder.length} plugins`);
  }

  // トポロジカルソート（依存関係解決）
  topologicalSort() {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    const visit = (pluginId) => {
      if (visited.has(pluginId)) return;
      if (visiting.has(pluginId)) {
        throw new Error(`Circular dependency detected involving plugin: ${pluginId}`);
      }

      visiting.add(pluginId);
      
      const deps = this.dependencies.get(pluginId) || [];
      deps.forEach(depId => {
        if (this.plugins.has(depId)) {
          visit(depId);
        }
      });

      visiting.delete(pluginId);
      visited.add(pluginId);
      sorted.push(pluginId);
    };

    this.plugins.forEach((_, pluginId) => {
      visit(pluginId);
    });

    return sorted;
  }

  // コンポーネント取得
  getComponent(pluginId, componentName) {
    const plugin = this.plugins.get(pluginId);
    return plugin?.components[componentName] || null;
  }

  // 全コンポーネント取得
  getAllComponents(componentType) {
    const components = [];
    
    this.plugins.forEach((plugin, pluginId) => {
      if (plugin.components[componentType]) {
        components.push({
          pluginId,
          component: plugin.components[componentType]
        });
      }
    });

    return components;
  }

  // プラグイン無効化
  async disablePlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin || !plugin.isLoaded) return;

    // 依存しているプラグインも無効化
    const dependentPlugins = this.getDependentPlugins(pluginId);
    for (const depId of dependentPlugins) {
      await this.disablePlugin(depId);
    }

    // クリーンアップフックを実行
    await this.executeHook('plugin:cleanup', { pluginId });

    plugin.isLoaded = false;
    const index = this.loadOrder.indexOf(pluginId);
    if (index > -1) {
      this.loadOrder.splice(index, 1);
    }

    console.log(`Disabled plugin: ${plugin.name}`);
  }

  // 依存しているプラグインを取得
  getDependentPlugins(pluginId) {
    const dependents = [];
    
    this.dependencies.forEach((deps, id) => {
      if (deps.includes(pluginId)) {
        dependents.push(id);
      }
    });

    return dependents;
  }

  // 外部スクリプト読み込み
  async loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // 外部スタイル読み込み
  async loadStyle(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  // プラグイン状態取得
  getPluginStats() {
    const stats = {
      total: this.plugins.size,
      loaded: 0,
      byGameType: {}
    };

    this.plugins.forEach((plugin) => {
      if (plugin.isLoaded) stats.loaded++;
      
      plugin.gameTypes.forEach(type => {
        if (!stats.byGameType[type]) {
          stats.byGameType[type] = 0;
        }
        stats.byGameType[type]++;
      });
    });

    return stats;
  }

  // クリーンアップ
  async cleanup() {
    // 逆順でプラグインを無効化
    const reverseOrder = [...this.loadOrder].reverse();
    
    for (const pluginId of reverseOrder) {
      await this.disablePlugin(pluginId);
    }

    this.plugins.clear();
    this.hooks.clear();
    this.loadOrder = [];
    this.dependencies.clear();
  }
}

// プラグイン設定のヘルパー関数
export function createPlugin(config) {
  return {
    id: config.id,
    name: config.name,
    version: config.version || '1.0.0',
    gameTypes: config.gameTypes || ['*'],
    dependencies: config.dependencies || [],
    
    initialize: config.initialize || async function() {},
    
    hooks: config.hooks || {},
    components: config.components || {},
    api: config.api || {}
  };
}