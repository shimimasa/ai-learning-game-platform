// AIプロンプト管理
export class PromptManager {
  constructor() {
    this.templates = new Map();
    this.variables = new Map();
    this.history = [];
    this.maxHistorySize = 100;
    
    // デフォルトプロンプトテンプレートを登録
    this.registerDefaultTemplates();
  }

  // デフォルトテンプレート登録
  registerDefaultTemplates() {
    // 学習分析プロンプト
    this.registerTemplate('analyze_performance', {
      system: `あなたは教育専門のAIアシスタントです。学習者のパフォーマンスデータを分析し、
個別最適化された学習アドバイスを提供します。分析は客観的で建設的なものにしてください。`,
      user: `以下の学習データを分析し、学習者の強み・弱み・推奨事項を日本語で提供してください。

学習者情報:
- 学年: {{grade}}
- 科目: {{subject}}
- 現在のレベル: {{currentLevel}}

パフォーマンスデータ:
- 正答率: {{accuracy}}%
- 完了したゲーム数: {{gamesCompleted}}
- 総プレイ時間: {{totalPlayTime}}分
- 最近の結果: {{recentResults}}

スキル別マスタリー:
{{skillMastery}}

以下の形式で回答してください:
1. 強み（箇条書き）
2. 改善が必要な分野（箇条書き）
3. 推奨される学習活動（具体的に）
4. モチベーション向上のアドバイス`
    });

    // 難易度推奨プロンプト
    this.registerTemplate('recommend_difficulty', {
      system: `あなたは適応学習システムのAIです。学習者のパフォーマンスに基づいて、
最適な難易度調整を推奨します。学習者が挑戦的でありながら達成可能なレベルを維持することが目標です。`,
      user: `学習者の現在のパフォーマンスに基づいて難易度調整を推奨してください。

現在の状態:
- 現在の難易度: {{currentDifficulty}} (1-5)
- 直近5問の正答率: {{recentAccuracy}}%
- 平均回答時間: {{averageResponseTime}}秒
- 連続正解数: {{correctStreak}}
- ヒント使用回数: {{hintsUsed}}

以下のJSON形式で回答してください:
{
  "recommendedDifficulty": number (1-5),
  "reason": "調整理由の説明",
  "confidence": number (0-1),
  "suggestions": ["具体的な提案1", "具体的な提案2"]
}`
    });

    // コンテンツ生成プロンプト
    this.registerTemplate('generate_question', {
      system: `あなたは教育コンテンツ作成の専門家です。学習者のレベルに適した問題を生成します。
問題は明確で、教育的価値があり、年齢に適したものにしてください。`,
      user: `以下の条件で{{subject}}の問題を生成してください。

条件:
- 学年: {{grade}}
- 難易度: {{difficulty}} (1-5)
- トピック: {{topic}}
- 問題タイプ: {{questionType}}
- 学習目標: {{learningObjective}}

以下のJSON形式で回答してください:
{
  "question": "問題文",
  "type": "multiple-choice | true-false | text",
  "options": ["選択肢1", "選択肢2", ...] (選択式の場合),
  "correctAnswer": "正解",
  "hint": "ヒント",
  "explanation": "解説",
  "difficulty": number,
  "skills": ["関連スキル1", "関連スキル2"]
}`
    });

    // ゲーム推奨プロンプト
    this.registerTemplate('recommend_games', {
      system: `あなたは個別最適化学習のアドバイザーです。学習者のプロファイルに基づいて、
最適なゲームを推奨します。学習効果と楽しさのバランスを考慮してください。`,
      user: `学習者プロファイルに基づいて、最適なゲームを推奨してください。

学習者プロファイル:
- 学習スタイル: {{learningStyle}}
- 弱点分野: {{weakAreas}}
- 興味: {{interests}}
- 最近プレイしたゲーム: {{recentGames}}

利用可能なゲーム:
{{availableGames}}

上位5つのゲームを推奨し、それぞれの推奨理由を説明してください。`
    });

    // フィードバック生成プロンプト
    this.registerTemplate('generate_feedback', {
      system: `あなたは優しく励ましてくれる教師です。学習者の回答に対して、
建設的でポジティブなフィードバックを提供します。`,
      user: `以下の回答に対してフィードバックを提供してください。

問題: {{question}}
学習者の回答: {{userAnswer}}
正解: {{correctAnswer}}
正誤: {{isCorrect}}

フィードバックは以下の要素を含めてください:
1. 回答の評価（ポジティブなトーンで）
2. なぜその答えが正しい/間違っているかの説明
3. 関連する追加情報や興味深い事実
4. 次のステップへの励まし`
    });
  }

  // テンプレート登録
  registerTemplate(name, template) {
    this.templates.set(name, template);
  }

  // 変数登録
  setVariable(name, value) {
    this.variables.set(name, value);
  }

  // 変数一括設定
  setVariables(variables) {
    Object.entries(variables).forEach(([key, value]) => {
      this.variables.set(key, value);
    });
  }

  // プロンプト生成
  generatePrompt(templateName, variables = {}) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // グローバル変数とローカル変数をマージ
    const allVariables = {
      ...Object.fromEntries(this.variables),
      ...variables
    };

    // プロンプトを構築
    const prompt = {
      system: this.interpolate(template.system, allVariables),
      user: this.interpolate(template.user, allVariables)
    };

    // 履歴に追加
    this.addToHistory({
      templateName,
      variables: allVariables,
      prompt,
      timestamp: new Date()
    });

    return prompt;
  }

  // 変数補間
  interpolate(template, variables) {
    if (!template) return '';

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = variables[key];
      
      if (value === undefined) {
        console.warn(`Variable not found: ${key}`);
        return match;
      }

      // 配列の場合は改行で結合
      if (Array.isArray(value)) {
        return value.join('\n');
      }

      // オブジェクトの場合はJSON文字列化
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
      }

      return String(value);
    });
  }

  // 履歴追加
  addToHistory(entry) {
    this.history.push(entry);
    
    // サイズ制限
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  // 履歴取得
  getHistory(limit = 10) {
    return this.history.slice(-limit);
  }

  // プロンプト最適化
  optimizePrompt(prompt, maxTokens = 1000) {
    // トークン数を推定し、必要に応じて短縮
    const estimatedTokens = this.estimateTokens(prompt);
    
    if (estimatedTokens <= maxTokens) {
      return prompt;
    }

    // システムプロンプトとユーザープロンプトを短縮
    const ratio = maxTokens / estimatedTokens;
    
    return {
      system: this.truncateText(prompt.system, Math.floor(prompt.system.length * ratio)),
      user: this.truncateText(prompt.user, Math.floor(prompt.user.length * ratio))
    };
  }

  // トークン数推定
  estimateTokens(prompt) {
    const text = `${prompt.system || ''} ${prompt.user || ''}`;
    const japaneseChars = (text.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g) || []).length;
    const englishChars = text.length - japaneseChars;
    return Math.ceil(japaneseChars * 2 + englishChars / 4);
  }

  // テキスト短縮
  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength - 3) + '...';
  }

  // プロンプトチェーン作成
  createChain(templates) {
    return {
      templates,
      currentIndex: 0,
      results: [],
      
      async execute(aiClient, initialVariables = {}) {
        const results = [];
        let variables = { ...initialVariables };
        
        for (const template of this.templates) {
          const prompt = this.generatePrompt(template.name, variables);
          const response = await aiClient.sendRequest(prompt);
          
          results.push({
            template: template.name,
            response
          });
          
          // 次のテンプレートのための変数を更新
          if (template.extractVariables) {
            const extracted = template.extractVariables(response);
            variables = { ...variables, ...extracted };
          }
        }
        
        return results;
      }
    };
  }

  // テンプレート検証
  validateTemplate(template) {
    const errors = [];
    
    if (!template.system && !template.user) {
      errors.push('テンプレートにはsystemまたはuserメッセージが必要です');
    }
    
    // 変数の検証
    const systemVars = this.extractVariables(template.system || '');
    const userVars = this.extractVariables(template.user || '');
    const allVars = [...new Set([...systemVars, ...userVars])];
    
    return {
      isValid: errors.length === 0,
      errors,
      requiredVariables: allVars
    };
  }

  // 変数抽出
  extractVariables(text) {
    const matches = text.match(/\{\{(\w+)\}\}/g) || [];
    return matches.map(match => match.slice(2, -2));
  }
}