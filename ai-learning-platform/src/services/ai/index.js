// AIサービスメインエクスポート
export { BaseAIClient, RateLimiter } from './baseAIClient';
export { OpenAIClient } from './openAIClient';
export { ClaudeClient } from './claudeClient';
export { PromptManager } from './promptManager';
export { AIService, getAIService } from './aiService';
export { AIPersonalizationEngine } from './AIPersonalizationEngine';

// シングルトンインスタンス
import { AIPersonalizationEngine } from './AIPersonalizationEngine';

let personalizationEngineInstance = null;

// AIパーソナライゼーションエンジン取得
export const getPersonalizationEngine = (config) => {
  if (!personalizationEngineInstance) {
    personalizationEngineInstance = new AIPersonalizationEngine(config);
  }
  return personalizationEngineInstance;
};

// AI機能ユーティリティ
export const AIUtils = {
  // パフォーマンス分析
  async analyzePerformance(userId, gameResults) {
    const engine = getPersonalizationEngine();
    return await engine.analyzePerformance(userId, gameResults);
  },

  // ゲーム推奨
  async recommendGames(userId, learningProfile, limit = 5) {
    const engine = getPersonalizationEngine();
    return await engine.recommendGames(userId, learningProfile, limit);
  },

  // 難易度適応
  async adaptDifficulty(currentLevel, performance) {
    const engine = getPersonalizationEngine();
    return await engine.adaptDifficulty(currentLevel, performance);
  },

  // コンテンツ生成
  async generateContent(profile, subject, difficulty) {
    const engine = getPersonalizationEngine();
    return await engine.generateContent(profile, subject, difficulty);
  },

  // フィードバック生成
  async generateFeedback(answerData) {
    const aiService = getAIService();
    return await aiService.generateFeedback(answerData);
  },

  // 分析履歴取得
  getAnalysisHistory(userId) {
    const engine = getPersonalizationEngine();
    return engine.getAnalysisHistory(userId);
  }
};

// プロンプトテンプレートのエクスポート
export const PromptTemplates = {
  // カスタムテンプレート登録
  register(name, template) {
    const aiService = getAIService();
    aiService.promptManager.registerTemplate(name, template);
  },

  // 変数設定
  setVariables(variables) {
    const aiService = getAIService();
    aiService.promptManager.setVariables(variables);
  },

  // 利用可能なテンプレート一覧
  getAvailable() {
    const aiService = getAIService();
    return Array.from(aiService.promptManager.templates.keys());
  }
};

// AI設定のエクスポート
export const AIConfig = {
  // デフォルト設定
  default: {
    provider: 'openai',
    openai: {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000
    },
    claude: {
      model: 'claude-3-opus-20240229',
      temperature: 0.7,
      maxTokens: 1000
    },
    personalization: {
      analysisInterval: 5,
      sensitivity: 'medium',
      recommendationCount: 5,
      contentGenerationEnabled: false
    }
  },

  // プロバイダー設定
  providers: {
    openai: {
      models: ['gpt-4', 'gpt-3.5-turbo'],
      rateLimit: 200, // requests per minute
      tokenLimit: 40000 // tokens per minute
    },
    claude: {
      models: [
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307'
      ],
      rateLimit: 60,
      tokenLimit: 100000
    }
  }
};

// エラークラスのエクスポート
export class AIError extends Error {
  constructor(message, code = 'AI_ERROR', details = null) {
    super(message);
    this.name = 'AIError';
    this.code = code;
    this.details = details;
  }
}

// デフォルトエクスポート
export default {
  getAIService,
  getPersonalizationEngine,
  AIUtils,
  PromptTemplates,
  AIConfig
};