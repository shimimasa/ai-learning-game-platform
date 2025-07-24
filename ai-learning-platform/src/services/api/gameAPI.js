// ゲームAPI
import { BaseAPI } from './baseAPI';
import { getGameRepository } from '../database';

export class GameAPI extends BaseAPI {
  constructor() {
    super();
    this.repository = getGameRepository();
  }

  // ゲーム取得
  async getGame(gameId) {
    try {
      const game = await this.repository.findById(gameId);
      if (!game) {
        throw new Error('ゲームが見つかりません');
      }
      return { success: true, data: game };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ゲーム一覧取得
  async getGames(filters = {}) {
    try {
      const { 
        subject, 
        difficulty, 
        status, 
        type,
        tag,
        page = 1, 
        limit = 20,
        sortBy = 'publishedAt',
        sortOrder = 'desc'
      } = filters;
      
      const where = [];
      if (subject) {
        where.push({ field: 'subject', operator: '==', value: subject });
      }
      if (difficulty) {
        where.push({ field: 'difficulty', operator: '==', value: difficulty });
      }
      if (status) {
        where.push({ field: 'status', operator: '==', value: status });
      }
      if (type) {
        where.push({ field: 'type', operator: '==', value: type });
      }
      if (tag) {
        where.push({ field: 'tags', operator: 'array-contains', value: tag });
      }

      const games = await this.repository.findMany({ 
        where,
        orderBy: [{ field: sortBy, direction: sortOrder }],
        limit,
        offset: (page - 1) * limit
      });

      return { 
        success: true, 
        data: {
          games,
          pagination: {
            page,
            limit,
            total: await this.repository.count({ where })
          }
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // アクティブなゲームを取得
  async getActiveGames(options = {}) {
    try {
      const games = await this.repository.findActiveGames(options);
      return { success: true, data: games };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 科目別ゲーム取得
  async getGamesBySubject(subject, options = {}) {
    try {
      const games = await this.repository.findBySubject(subject, options);
      return { success: true, data: games };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 難易度別ゲーム取得
  async getGamesByDifficulty(difficulty, options = {}) {
    try {
      const games = await this.repository.findByDifficulty(difficulty, options);
      return { success: true, data: games };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 学年別ゲーム取得
  async getGamesByGrade(grade, options = {}) {
    try {
      const games = await this.repository.findByGrade(grade, options);
      return { success: true, data: games };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // タグ別ゲーム取得
  async getGamesByTag(tag, options = {}) {
    try {
      const games = await this.repository.findByTag(tag, options);
      return { success: true, data: games };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ゲーム作成
  async createGame(gameData) {
    try {
      const game = await this.repository.create(gameData);
      return { success: true, data: game };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ゲーム更新
  async updateGame(gameId, updateData) {
    try {
      const game = await this.repository.update(gameId, updateData);
      return { success: true, data: game };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ゲーム公開
  async publishGame(gameId) {
    try {
      const game = await this.repository.findById(gameId);
      if (!game) {
        throw new Error('ゲームが見つかりません');
      }
      
      game.publish();
      await this.repository.update(gameId, game.toFirestore());
      
      return { success: true, data: game };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ゲーム非公開
  async unpublishGame(gameId) {
    try {
      const game = await this.repository.findById(gameId);
      if (!game) {
        throw new Error('ゲームが見つかりません');
      }
      
      game.unpublish();
      await this.repository.update(gameId, game.toFirestore());
      
      return { success: true, data: game };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ゲーム削除
  async deleteGame(gameId) {
    try {
      await this.repository.delete(gameId);
      return { success: true, data: { message: 'ゲームを削除しました' } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 推奨ゲーム取得
  async getRecommendedGames(userId, learningProfile, limit = 5) {
    try {
      const games = await this.repository.findRecommendedGames(userId, learningProfile, limit);
      return { success: true, data: games };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ゲーム検索
  async searchGames(query) {
    return this.get('/games/search', { q: query });
  }

  // ゲームプレイ開始
  async startGame(gameId, userId) {
    return this.post(`/games/${gameId}/start`, { userId });
  }

  // ゲーム統計取得
  async getGameStats(gameId) {
    return this.get(`/games/${gameId}/stats`);
  }

  // 人気ゲーム取得
  async getPopularGames(limit = 10) {
    return this.get('/games/popular', { limit });
  }

  // 新着ゲーム取得
  async getNewGames(limit = 10) {
    return this.get('/games/new', { limit });
  }

  // ゲームメタデータ更新
  async updateGameMetadata(gameId, metadata) {
    return this.patch(`/games/${gameId}/metadata`, metadata);
  }

  // ゲーム設定更新
  async updateGameConfig(gameId, config) {
    return this.patch(`/games/${gameId}/config`, config);
  }

  // AI設定更新
  async updateGameAIConfig(gameId, aiConfig) {
    return this.patch(`/games/${gameId}/ai-config`, aiConfig);
  }

  // 作成者別ゲーム取得
  async getGamesByCreator(creatorId, options = {}) {
    try {
      const games = await this.repository.findByCreator(creatorId, options);
      return { success: true, data: games };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}