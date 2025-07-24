// ゲームリポジトリ
import { Game } from '../../../models/Game';
import { FirebaseRepository } from '../firebaseRepository';
import { SupabaseRepository } from '../supabaseRepository';
import { GAME_STATUS } from '../../../constants/config';

// Firebase用ゲームリポジトリ
export class FirebaseGameRepository extends FirebaseRepository {
  constructor() {
    super('games', Game);
  }

  // 科目別にゲームを取得
  async findBySubject(subject, options = {}) {
    return this.findMany({
      where: [
        { field: 'subject', operator: '==', value: subject },
        { field: 'status', operator: '==', value: GAME_STATUS.ACTIVE }
      ],
      ...options
    });
  }

  // 難易度別にゲームを取得
  async findByDifficulty(difficulty, options = {}) {
    return this.findMany({
      where: [
        { field: 'difficulty', operator: '==', value: difficulty },
        { field: 'status', operator: '==', value: GAME_STATUS.ACTIVE }
      ],
      ...options
    });
  }

  // 学年に適したゲームを取得
  async findByGrade(grade, options = {}) {
    // Firestoreの配列フィールドのクエリは制限があるため、
    // 全てのアクティブゲームを取得してフィルタリング
    const allGames = await this.findMany({
      where: [{ field: 'status', operator: '==', value: GAME_STATUS.ACTIVE }],
      ...options
    });

    return allGames.filter(game => game.isForGrade(grade));
  }

  // タグでゲームを検索
  async findByTag(tag, options = {}) {
    return this.findMany({
      where: [
        { field: 'tags', operator: 'array-contains', value: tag },
        { field: 'status', operator: '==', value: GAME_STATUS.ACTIVE }
      ],
      ...options
    });
  }

  // 公開されているゲームを取得
  async findActiveGames(options = {}) {
    return this.findMany({
      where: [{ field: 'status', operator: '==', value: GAME_STATUS.ACTIVE }],
      orderBy: [{ field: 'publishedAt', direction: 'desc' }],
      ...options
    });
  }

  // 作成者別にゲームを取得
  async findByCreator(creatorId, options = {}) {
    return this.findMany({
      where: [{ field: 'createdBy', operator: '==', value: creatorId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      ...options
    });
  }

  // 推奨ゲームを取得（AI分析結果に基づく）
  async findRecommendedGames(userId, learningProfile, limit = 5) {
    // 学習プロファイルに基づいてゲームを推奨
    // ここでは簡易的な実装
    const games = await this.findActiveGames({ limit: limit * 2 });
    
    // 弱点分野のゲームを優先
    const recommendedGames = games.filter(game => {
      // 弱点分野に関連するゲームを優先
      if (learningProfile.weakAreas) {
        return learningProfile.weakAreas.some(area => 
          game.metadata.skills && game.metadata.skills.includes(area)
        );
      }
      return true;
    });

    return recommendedGames.slice(0, limit);
  }
}

// Supabase用ゲームリポジトリ
export class SupabaseGameRepository extends SupabaseRepository {
  constructor() {
    super('games', Game);
  }

  // 科目別にゲームを取得
  async findBySubject(subject, options = {}) {
    return this.findMany({
      where: [
        { field: 'subject', operator: '==', value: subject },
        { field: 'status', operator: '==', value: GAME_STATUS.ACTIVE }
      ],
      ...options
    });
  }

  // 難易度別にゲームを取得
  async findByDifficulty(difficulty, options = {}) {
    return this.findMany({
      where: [
        { field: 'difficulty', operator: '==', value: difficulty },
        { field: 'status', operator: '==', value: GAME_STATUS.ACTIVE }
      ],
      ...options
    });
  }

  // 学年に適したゲームを取得
  async findByGrade(grade, options = {}) {
    // Supabaseでは、JSONフィールド内の配列検索を行う
    // 実装はSupabaseのJSON演算子に依存
    const allGames = await this.findMany({
      where: [{ field: 'status', operator: '==', value: GAME_STATUS.ACTIVE }],
      ...options
    });

    return allGames.filter(game => game.isForGrade(grade));
  }

  // タグでゲームを検索
  async findByTag(tag, options = {}) {
    return this.findMany({
      where: [
        { field: 'tags', operator: 'contains', value: tag },
        { field: 'status', operator: '==', value: GAME_STATUS.ACTIVE }
      ],
      ...options
    });
  }

  // 公開されているゲームを取得
  async findActiveGames(options = {}) {
    return this.findMany({
      where: [{ field: 'status', operator: '==', value: GAME_STATUS.ACTIVE }],
      orderBy: [{ field: 'published_at', direction: 'desc' }],
      ...options
    });
  }

  // 作成者別にゲームを取得
  async findByCreator(creatorId, options = {}) {
    return this.findMany({
      where: [{ field: 'created_by', operator: '==', value: creatorId }],
      orderBy: [{ field: 'created_at', direction: 'desc' }],
      ...options
    });
  }

  // 推奨ゲームを取得（AI分析結果に基づく）
  async findRecommendedGames(userId, learningProfile, limit = 5) {
    // 学習プロファイルに基づいてゲームを推奨
    // ここでは簡易的な実装
    const games = await this.findActiveGames({ limit: limit * 2 });
    
    // 弱点分野のゲームを優先
    const recommendedGames = games.filter(game => {
      // 弱点分野に関連するゲームを優先
      if (learningProfile.weakAreas) {
        return learningProfile.weakAreas.some(area => 
          game.metadata.skills && game.metadata.skills.includes(area)
        );
      }
      return true;
    });

    return recommendedGames.slice(0, limit);
  }
}

// 環境変数に基づいてリポジトリを選択
export const createGameRepository = () => {
  const provider = process.env.REACT_APP_AUTH_PROVIDER || 'firebase';
  return provider === 'supabase' 
    ? new SupabaseGameRepository() 
    : new FirebaseGameRepository();
};