// ゲームモデルクラス
import { generateId } from '../utils/helpers';
import { GAME_STATUS, SUBJECTS, DIFFICULTY_LEVELS } from '../constants/config';

export class Game {
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.title = data.title || '';
    this.description = data.description || '';
    this.subject = data.subject || SUBJECTS.MATHEMATICS;
    this.type = data.type || 'quiz'; // quiz, puzzle, adventure, etc.
    this.difficulty = data.difficulty || DIFFICULTY_LEVELS.BEGINNER;
    this.thumbnail = data.thumbnail || '';
    this.metadata = data.metadata || this.createDefaultMetadata();
    this.content = data.content || this.createDefaultContent();
    this.config = data.config || this.createDefaultConfig();
    this.aiConfig = data.aiConfig || this.createDefaultAIConfig();
    this.status = data.status || GAME_STATUS.DRAFT;
    this.tags = data.tags || [];
    this.createdBy = data.createdBy || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.publishedAt = data.publishedAt || null;
    this.version = data.version || '1.0.0';
  }

  // デフォルトメタデータの作成
  createDefaultMetadata() {
    return {
      duration: 15, // 推定プレイ時間（分）
      targetGrade: [1, 2, 3], // 対象学年
      skills: [], // 必要なスキル
      learningObjectives: [], // 学習目標
      prerequisites: [], // 前提知識
      author: '',
      credits: ''
    };
  }

  // デフォルトコンテンツの作成
  createDefaultContent() {
    return {
      instructions: '', // ゲームの説明
      questions: [], // 問題データ
      assets: { // ゲームアセット
        images: [],
        sounds: [],
        animations: []
      },
      scenes: [], // ゲームシーン
      dialogue: [] // ダイアログデータ
    };
  }

  // デフォルト設定の作成
  createDefaultConfig() {
    return {
      timeLimit: null, // 制限時間（秒）
      lives: 3, // ライフ数
      pointsPerCorrect: 10, // 正解時のポイント
      pointsPerIncorrect: -5, // 不正解時のポイント
      showHints: true, // ヒント表示
      allowSkip: false, // スキップ許可
      randomizeQuestions: true, // 問題のランダム化
      feedbackMode: 'immediate', // immediate, delayed, none
      progressSaving: 'auto' // auto, manual
    };
  }

  // デフォルトAI設定の作成
  createDefaultAIConfig() {
    return {
      enableAdaptiveDifficulty: true, // 難易度自動調整
      enablePersonalization: true, // パーソナライゼーション
      enableAIHints: true, // AIヒント
      adaptationSensitivity: 'medium', // low, medium, high
      contentGeneration: {
        enabled: false,
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 500
      }
    };
  }

  // ゲームの公開
  publish() {
    if (this.status === GAME_STATUS.DRAFT) {
      this.status = GAME_STATUS.ACTIVE;
      this.publishedAt = new Date();
      this.updatedAt = new Date();
    }
  }

  // ゲームの非公開化
  unpublish() {
    if (this.status === GAME_STATUS.ACTIVE) {
      this.status = GAME_STATUS.INACTIVE;
      this.updatedAt = new Date();
    }
  }

  // メタデータ更新
  updateMetadata(metadata) {
    this.metadata = { ...this.metadata, ...metadata };
    this.updatedAt = new Date();
  }

  // コンテンツ更新
  updateContent(content) {
    this.content = { ...this.content, ...content };
    this.updatedAt = new Date();
  }

  // 設定更新
  updateConfig(config) {
    this.config = { ...this.config, ...config };
    this.updatedAt = new Date();
  }

  // AI設定更新
  updateAIConfig(aiConfig) {
    this.aiConfig = { ...this.aiConfig, ...aiConfig };
    this.updatedAt = new Date();
  }

  // 問題を追加
  addQuestion(question) {
    if (!this.content.questions) {
      this.content.questions = [];
    }
    this.content.questions.push({
      id: generateId(),
      ...question,
      createdAt: new Date()
    });
    this.updatedAt = new Date();
  }

  // タグを追加
  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
  }

  // 対象学年をチェック
  isForGrade(grade) {
    return this.metadata.targetGrade && this.metadata.targetGrade.includes(grade);
  }

  // Firestoreドキュメント形式に変換
  toFirestore() {
    return {
      title: this.title,
      description: this.description,
      subject: this.subject,
      type: this.type,
      difficulty: this.difficulty,
      thumbnail: this.thumbnail,
      metadata: this.metadata,
      content: this.content,
      config: this.config,
      aiConfig: this.aiConfig,
      status: this.status,
      tags: this.tags,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      publishedAt: this.publishedAt,
      version: this.version
    };
  }

  // Supabaseレコード形式に変換
  toSupabase() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      subject: this.subject,
      type: this.type,
      difficulty: this.difficulty,
      thumbnail: this.thumbnail,
      metadata: JSON.stringify(this.metadata),
      content: JSON.stringify(this.content),
      config: JSON.stringify(this.config),
      ai_config: JSON.stringify(this.aiConfig),
      status: this.status,
      tags: this.tags,
      created_by: this.createdBy,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
      published_at: this.publishedAt ? this.publishedAt.toISOString() : null,
      version: this.version
    };
  }

  // Firestoreドキュメントから作成
  static fromFirestore(id, data) {
    return new Game({
      id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      publishedAt: data.publishedAt?.toDate ? data.publishedAt.toDate() : (data.publishedAt ? new Date(data.publishedAt) : null)
    });
  }

  // Supabaseレコードから作成
  static fromSupabase(data) {
    return new Game({
      id: data.id,
      title: data.title,
      description: data.description,
      subject: data.subject,
      type: data.type,
      difficulty: data.difficulty,
      thumbnail: data.thumbnail,
      metadata: typeof data.metadata === 'string' ? JSON.parse(data.metadata) : data.metadata,
      content: typeof data.content === 'string' ? JSON.parse(data.content) : data.content,
      config: typeof data.config === 'string' ? JSON.parse(data.config) : data.config,
      aiConfig: typeof data.ai_config === 'string' ? JSON.parse(data.ai_config) : data.ai_config,
      status: data.status,
      tags: data.tags,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      publishedAt: data.published_at ? new Date(data.published_at) : null,
      version: data.version
    });
  }

  // バリデーション
  validate() {
    const errors = [];

    if (!this.title || this.title.trim().length === 0) {
      errors.push('タイトルを入力してください');
    }

    if (!this.description || this.description.trim().length === 0) {
      errors.push('説明を入力してください');
    }

    if (!Object.values(SUBJECTS).includes(this.subject)) {
      errors.push('有効な科目を選択してください');
    }

    if (!Object.values(DIFFICULTY_LEVELS).includes(this.difficulty)) {
      errors.push('有効な難易度を選択してください');
    }

    if (!Object.values(GAME_STATUS).includes(this.status)) {
      errors.push('有効なステータスを選択してください');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}