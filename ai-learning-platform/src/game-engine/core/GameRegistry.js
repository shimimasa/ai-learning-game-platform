// ゲームレジストリ - ゲームタイプの登録と管理
import { BaseGame } from './BaseGame';
import { GamePluginSystem } from './GamePluginSystem';

export class GameRegistry {
  constructor() {
    this.gameTypes = new Map();
    this.gameTemplates = new Map();
    this.gameFactories = new Map();
    this.validators = new Map();
    this.pluginSystem = new GamePluginSystem();
  }

  // ゲームレジストリ初期化
  async initialize() {
    // デフォルトのゲームタイプを登録
    this.registerDefaultGameTypes();
    
    // プラグインシステムを初期化
    await this.pluginSystem.initializeAll(this);
  }

  // デフォルトゲームタイプの登録
  registerDefaultGameTypes() {
    // 基本的なゲームタイプを事前登録
    // 実際のゲームクラスは後でプラグインとして追加される
  }

  // ゲームタイプ登録
  registerGameType(typeId, gameClass, config = {}) {
    // BaseGameを継承しているか確認
    if (!(gameClass.prototype instanceof BaseGame)) {
      throw new Error(`Game class must extend BaseGame: ${typeId}`);
    }

    const gameTypeConfig = {
      typeId,
      gameClass,
      name: config.name || typeId,
      description: config.description || '',
      category: config.category || 'general',
      subjects: config.subjects || ['*'],
      gradeRange: config.gradeRange || [1, 12],
      features: config.features || [],
      thumbnail: config.thumbnail || null,
      metadata: config.metadata || {}
    };

    this.gameTypes.set(typeId, gameTypeConfig);
    
    // バリデータがあれば登録
    if (config.validator) {
      this.validators.set(typeId, config.validator);
    }

    // ファクトリー関数があれば登録
    if (config.factory) {
      this.gameFactories.set(typeId, config.factory);
    }

    console.log(`Registered game type: ${typeId}`);
    return gameTypeConfig;
  }

  // ゲームクラス取得
  getGameClass(typeId) {
    const gameType = this.gameTypes.get(typeId);
    return gameType?.gameClass || null;
  }

  // ゲームタイプ情報取得
  getGameTypeInfo(typeId) {
    return this.gameTypes.get(typeId) || null;
  }

  // 全ゲームタイプ取得
  getAllGameTypes() {
    return Array.from(this.gameTypes.values());
  }

  // 科目別ゲームタイプ取得
  getGameTypesBySubject(subject) {
    const types = [];
    
    this.gameTypes.forEach((config) => {
      if (config.subjects.includes('*') || config.subjects.includes(subject)) {
        types.push(config);
      }
    });

    return types;
  }

  // カテゴリ別ゲームタイプ取得
  getGameTypesByCategory(category) {
    const types = [];
    
    this.gameTypes.forEach((config) => {
      if (config.category === category) {
        types.push(config);
      }
    });

    return types;
  }

  // ゲームインスタンス作成
  createGameInstance(typeId, gameData) {
    const gameType = this.gameTypes.get(typeId);
    if (!gameType) {
      throw new Error(`Unknown game type: ${typeId}`);
    }

    // カスタムファクトリーがあれば使用
    if (this.gameFactories.has(typeId)) {
      const factory = this.gameFactories.get(typeId);
      return factory(gameData);
    }

    // デフォルトのインスタンス作成
    const GameClass = gameType.gameClass;
    return new GameClass(gameData);
  }

  // ゲームテンプレート登録
  registerTemplate(templateId, template) {
    const validatedTemplate = {
      id: templateId,
      name: template.name || templateId,
      typeId: template.typeId,
      description: template.description || '',
      defaultConfig: template.defaultConfig || {},
      defaultContent: template.defaultContent || {},
      metadata: template.metadata || {}
    };

    // テンプレートが有効なゲームタイプを参照しているか確認
    if (!this.gameTypes.has(validatedTemplate.typeId)) {
      throw new Error(`Invalid game type in template: ${validatedTemplate.typeId}`);
    }

    this.gameTemplates.set(templateId, validatedTemplate);
    console.log(`Registered game template: ${templateId}`);
    return validatedTemplate;
  }

  // テンプレート取得
  getTemplate(templateId) {
    return this.gameTemplates.get(templateId) || null;
  }

  // テンプレートからゲーム作成
  createFromTemplate(templateId, overrides = {}) {
    const template = this.gameTemplates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const gameData = {
      ...template.defaultConfig,
      ...overrides,
      type: template.typeId,
      content: {
        ...template.defaultContent,
        ...(overrides.content || {})
      }
    };

    return this.createGameInstance(template.typeId, gameData);
  }

  // ゲーム設定検証
  validateGameConfig(typeId, config) {
    const validator = this.validators.get(typeId);
    if (!validator) {
      // デフォルトバリデーション
      return this.defaultValidator(config);
    }

    return validator(config);
  }

  // デフォルトバリデーター
  defaultValidator(config) {
    const errors = [];

    if (!config.title || config.title.trim() === '') {
      errors.push('ゲームタイトルは必須です');
    }

    if (!config.subject) {
      errors.push('科目の指定は必須です');
    }

    if (!config.difficulty || config.difficulty < 1 || config.difficulty > 5) {
      errors.push('難易度は1〜5の範囲で指定してください');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // プラグイン登録（ゲームタイプをプラグインとして追加）
  registerGamePlugin(pluginConfig) {
    return this.pluginSystem.register(pluginConfig);
  }

  // 統計情報取得
  getRegistryStats() {
    const stats = {
      totalGameTypes: this.gameTypes.size,
      totalTemplates: this.gameTemplates.size,
      gameTypesByCategory: {},
      gameTypesBySubject: {},
      pluginStats: this.pluginSystem.getPluginStats()
    };

    // カテゴリ別集計
    this.gameTypes.forEach((config) => {
      const category = config.category;
      if (!stats.gameTypesByCategory[category]) {
        stats.gameTypesByCategory[category] = 0;
      }
      stats.gameTypesByCategory[category]++;

      // 科目別集計
      config.subjects.forEach(subject => {
        if (!stats.gameTypesBySubject[subject]) {
          stats.gameTypesBySubject[subject] = 0;
        }
        stats.gameTypesBySubject[subject]++;
      });
    });

    return stats;
  }

  // ゲームタイプ検索
  searchGameTypes(criteria) {
    const results = [];

    this.gameTypes.forEach((config) => {
      let match = true;

      // 名前で検索
      if (criteria.name) {
        match = match && config.name.toLowerCase().includes(criteria.name.toLowerCase());
      }

      // カテゴリで検索
      if (criteria.category) {
        match = match && config.category === criteria.category;
      }

      // 科目で検索
      if (criteria.subject) {
        match = match && (
          config.subjects.includes('*') || 
          config.subjects.includes(criteria.subject)
        );
      }

      // 学年で検索
      if (criteria.grade) {
        const [min, max] = config.gradeRange;
        match = match && criteria.grade >= min && criteria.grade <= max;
      }

      // 機能で検索
      if (criteria.features && criteria.features.length > 0) {
        match = match && criteria.features.every(feature => 
          config.features.includes(feature)
        );
      }

      if (match) {
        results.push(config);
      }
    });

    return results;
  }

  // クリーンアップ
  async cleanup() {
    await this.pluginSystem.cleanup();
    this.gameTypes.clear();
    this.gameTemplates.clear();
    this.gameFactories.clear();
    this.validators.clear();
  }
}