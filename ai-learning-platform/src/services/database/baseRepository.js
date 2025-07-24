// 基底リポジトリクラス - Firebase/Supabase共通インターフェース
export class BaseRepository {
  constructor(collection, model) {
    this.collection = collection;
    this.model = model;
  }

  // 単一のドキュメントを取得
  async findById(id) {
    throw new Error('findById method must be implemented by subclass');
  }

  // 条件に基づいて複数のドキュメントを取得
  async findMany(query = {}, options = {}) {
    throw new Error('findMany method must be implemented by subclass');
  }

  // 単一のドキュメントを条件で取得
  async findOne(query) {
    throw new Error('findOne method must be implemented by subclass');
  }

  // ドキュメントを作成
  async create(data) {
    throw new Error('create method must be implemented by subclass');
  }

  // ドキュメントを更新
  async update(id, data) {
    throw new Error('update method must be implemented by subclass');
  }

  // ドキュメントを削除
  async delete(id) {
    throw new Error('delete method must be implemented by subclass');
  }

  // バッチ作成
  async createMany(dataArray) {
    throw new Error('createMany method must be implemented by subclass');
  }

  // 存在確認
  async exists(id) {
    throw new Error('exists method must be implemented by subclass');
  }

  // カウント
  async count(query = {}) {
    throw new Error('count method must be implemented by subclass');
  }
}