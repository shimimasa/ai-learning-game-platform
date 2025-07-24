// 統一AIサービスインターフェース
import { OpenAIClient } from './openAIClient';
import { ClaudeClient } from './claudeClient';
import { PromptManager } from './promptManager';

export class AIService {
  constructor(config = {}) {
    this.provider = config.provider || process.env.REACT_APP_AI_PROVIDER || 'openai';
    this.promptManager = new PromptManager();
    this.cache = new Map();
    this.cacheTimeout = config.cacheTimeout || 3600000; // 1時間
    
    // プロバイダーに応じてクライアントを初期化
    this.initializeClient(config);
  }

  // クライアント初期化
  initializeClient(config) {
    switch (this.provider) {
      case 'openai':
        this.client = new OpenAIClient(config.openai || {});
        break;
      case 'claude':
        this.client = new ClaudeClient(config.claude || {});
        break;
      default:
        throw new Error(`Unknown AI provider: ${this.provider}`);
    }
  }

  // プロンプト送信（キャッシュ付き）
  async sendPrompt(templateName, variables = {}, options = {}) {
    // キャッシュキー生成
    const cacheKey = this.generateCacheKey(templateName, variables);
    
    // キャッシュチェック
    if (!options.noCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.response;
      }
    }

    try {
      // プロンプト生成
      const prompt = this.promptManager.generatePrompt(templateName, variables);
      
      // AIリクエスト送信
      const response = await this.client.sendRequest(prompt, options);
      
      // レスポンス処理
      const processedResponse = this.processResponse(response, templateName);
      
      // キャッシュに保存
      if (!options.noCache) {
        this.cache.set(cacheKey, {
          response: processedResponse,
          timestamp: Date.now()
        });
      }

      return processedResponse;
    } catch (error) {
      console.error(`AI Service error for ${templateName}:`, error);
      throw error;
    }
  }

  // 直接メッセージ送信
  async sendMessage(messages, options = {}) {
    try {
      const response = await this.client.sendRequest(messages, options);
      return this.processResponse(response);
    } catch (error) {
      console.error('AI Service error:', error);
      throw error;
    }
  }

  // ストリーミングリクエスト
  async *streamMessage(messages, options = {}) {
    try {
      for await (const chunk of this.client.streamRequest(messages, options)) {
        yield chunk;
      }
    } catch (error) {
      console.error('AI Service streaming error:', error);
      throw error;
    }
  }

  // レスポンス処理
  processResponse(response, templateName = null) {
    // 基本的な処理
    const processed = {
      content: response.content,
      metadata: {
        model: response.model,
        usage: response.usage,
        timestamp: new Date(),
        provider: this.provider,
        template: templateName
      }
    };

    // JSON形式のレスポンスをパース
    if (this.isJsonResponse(response.content)) {
      try {
        processed.data = JSON.parse(response.content);
      } catch (error) {
        console.warn('Failed to parse JSON response:', error);
        processed.data = null;
      }
    }

    return processed;
  }

  // JSONレスポンスかチェック
  isJsonResponse(content) {
    const trimmed = content.trim();
    return (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
           (trimmed.startsWith('[') && trimmed.endsWith(']'));
  }

  // キャッシュキー生成
  generateCacheKey(templateName, variables) {
    const sortedVars = Object.keys(variables).sort().reduce((acc, key) => {
      acc[key] = variables[key];
      return acc;
    }, {});
    
    return `${templateName}:${JSON.stringify(sortedVars)}`;
  }

  // 学習パフォーマンス分析
  async analyzePerformance(learningData) {
    const response = await this.sendPrompt('analyze_performance', {
      grade: learningData.grade,
      subject: learningData.subject,
      currentLevel: learningData.currentLevel,
      accuracy: learningData.accuracy,
      gamesCompleted: learningData.gamesCompleted,
      totalPlayTime: learningData.totalPlayTime,
      recentResults: JSON.stringify(learningData.recentResults),
      skillMastery: this.formatSkillMastery(learningData.skillMastery)
    });

    return this.parseAnalysis(response.content);
  }

  // 難易度推奨
  async recommendDifficulty(performanceData) {
    const response = await this.sendPrompt('recommend_difficulty', {
      currentDifficulty: performanceData.currentDifficulty,
      recentAccuracy: performanceData.recentAccuracy,
      averageResponseTime: performanceData.averageResponseTime,
      correctStreak: performanceData.correctStreak,
      hintsUsed: performanceData.hintsUsed
    });

    if (response.data) {
      return response.data;
    }

    // フォールバック
    return {
      recommendedDifficulty: performanceData.currentDifficulty,
      reason: 'データ解析中',
      confidence: 0.5,
      suggestions: []
    };
  }

  // コンテンツ生成
  async generateContent(contentParams) {
    const response = await this.sendPrompt('generate_question', {
      subject: contentParams.subject,
      grade: contentParams.grade,
      difficulty: contentParams.difficulty,
      topic: contentParams.topic,
      questionType: contentParams.questionType,
      learningObjective: contentParams.learningObjective
    });

    if (response.data) {
      return response.data;
    }

    throw new Error('Failed to generate content');
  }

  // ゲーム推奨
  async recommendGames(profile, availableGames) {
    const response = await this.sendPrompt('recommend_games', {
      learningStyle: profile.learningStyle,
      weakAreas: profile.weakAreas.join(', '),
      interests: profile.interests.join(', '),
      recentGames: profile.recentGames.join(', '),
      availableGames: this.formatGameList(availableGames)
    });

    return this.parseRecommendations(response.content);
  }

  // フィードバック生成
  async generateFeedback(answerData) {
    const response = await this.sendPrompt('generate_feedback', {
      question: answerData.question,
      userAnswer: answerData.userAnswer,
      correctAnswer: answerData.correctAnswer,
      isCorrect: answerData.isCorrect ? '正解' : '不正解'
    });

    return response.content;
  }

  // ヘルパー関数：スキルマスタリーのフォーマット
  formatSkillMastery(skillMastery) {
    return skillMastery.map(skill => 
      `- ${skill.name}: ${Math.round(skill.mastery * 100)}% (${skill.attempts}回挑戦)`
    ).join('\n');
  }

  // ヘルパー関数：ゲームリストのフォーマット
  formatGameList(games) {
    return games.map(game => 
      `- ${game.title} (${game.subject}, 難易度: ${game.difficulty}, タイプ: ${game.type})`
    ).join('\n');
  }

  // ヘルパー関数：分析結果のパース
  parseAnalysis(content) {
    const sections = content.split(/\d+\.\s+/);
    
    return {
      strengths: this.extractBulletPoints(sections[1] || ''),
      weaknesses: this.extractBulletPoints(sections[2] || ''),
      recommendations: this.extractBulletPoints(sections[3] || ''),
      motivationAdvice: sections[4]?.trim() || ''
    };
  }

  // ヘルパー関数：箇条書き抽出
  extractBulletPoints(text) {
    const lines = text.split('\n');
    return lines
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('・'))
      .map(line => line.replace(/^[\-・]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  // ヘルパー関数：推奨結果のパース
  parseRecommendations(content) {
    const recommendations = [];
    const lines = content.split('\n');
    
    let currentGame = null;
    
    lines.forEach(line => {
      const gameMatch = line.match(/^\d+\.\s*(.+)/);
      if (gameMatch) {
        if (currentGame) {
          recommendations.push(currentGame);
        }
        currentGame = {
          title: gameMatch[1].trim(),
          reason: ''
        };
      } else if (currentGame && line.trim()) {
        currentGame.reason += line.trim() + ' ';
      }
    });
    
    if (currentGame) {
      recommendations.push(currentGame);
    }
    
    return recommendations;
  }

  // プロバイダー切り替え
  switchProvider(provider, config = {}) {
    this.provider = provider;
    this.initializeClient(config);
    this.clearCache();
  }

  // キャッシュクリア
  clearCache() {
    this.cache.clear();
  }

  // 統計情報取得
  getStats() {
    return {
      provider: this.provider,
      cacheSize: this.cache.size,
      ...this.client.getUsageStats()
    };
  }
}

// シングルトンインスタンス
let aiServiceInstance = null;

export const getAIService = (config) => {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService(config);
  }
  return aiServiceInstance;
};