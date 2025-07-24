// Supabase用リポジトリ実装
import { supabase } from '../supabase';
import { BaseRepository } from './baseRepository';

export class SupabaseRepository extends BaseRepository {
  constructor(tableName, model) {
    super(tableName, model);
    this.tableName = tableName;
  }

  // 単一のドキュメントを取得
  async findById(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      return data ? this.model.fromSupabase(data) : null;
    } catch (error) {
      console.error(`Error finding document by ID ${id}:`, error);
      throw error;
    }
  }

  // 条件に基づいて複数のドキュメントを取得
  async findMany(queryOptions = {}, options = {}) {
    try {
      let query = supabase.from(this.tableName).select('*');

      // WHERE条件を追加
      if (queryOptions.where) {
        queryOptions.where.forEach(condition => {
          switch (condition.operator) {
            case '==':
              query = query.eq(condition.field, condition.value);
              break;
            case '!=':
              query = query.neq(condition.field, condition.value);
              break;
            case '>':
              query = query.gt(condition.field, condition.value);
              break;
            case '>=':
              query = query.gte(condition.field, condition.value);
              break;
            case '<':
              query = query.lt(condition.field, condition.value);
              break;
            case '<=':
              query = query.lte(condition.field, condition.value);
              break;
            case 'in':
              query = query.in(condition.field, condition.value);
              break;
            case 'contains':
              query = query.ilike(condition.field, `%${condition.value}%`);
              break;
            default:
              break;
          }
        });
      }

      // ORDER BY を追加
      if (queryOptions.orderBy) {
        queryOptions.orderBy.forEach(order => {
          query = query.order(order.field, { 
            ascending: order.direction !== 'desc' 
          });
        });
      }

      // LIMIT を追加
      if (queryOptions.limit) {
        query = query.limit(queryOptions.limit);
      }

      // ページネーション用のオフセット
      if (queryOptions.offset) {
        query = query.range(
          queryOptions.offset, 
          queryOptions.offset + (queryOptions.limit || 10) - 1
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(record => this.model.fromSupabase(record));
    } catch (error) {
      console.error('Error finding documents:', error);
      throw error;
    }
  }

  // 単一のドキュメントを条件で取得
  async findOne(queryOptions) {
    const results = await this.findMany({ ...queryOptions, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  // ドキュメントを作成
  async create(data) {
    try {
      const modelInstance = new this.model(data);
      const validation = modelInstance.validate ? modelInstance.validate() : { isValid: true };
      
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const docData = modelInstance.toSupabase();
      const { data: createdData, error } = await supabase
        .from(this.tableName)
        .insert([docData])
        .select()
        .single();

      if (error) throw error;

      return this.model.fromSupabase(createdData);
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  // ドキュメントを更新
  async update(id, data) {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`Document with ID ${id} not found`);
      }

      const updatedData = { 
        ...data, 
        updated_at: new Date().toISOString() 
      };
      
      const { data: updated, error } = await supabase
        .from(this.tableName)
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.model.fromSupabase(updated);
    } catch (error) {
      console.error(`Error updating document ${id}:`, error);
      throw error;
    }
  }

  // ドキュメントを削除
  async delete(id) {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error(`Error deleting document ${id}:`, error);
      throw error;
    }
  }

  // バッチ作成
  async createMany(dataArray) {
    try {
      const models = [];
      const insertData = [];

      dataArray.forEach(data => {
        const modelInstance = new this.model(data);
        const validation = modelInstance.validate ? modelInstance.validate() : { isValid: true };
        
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        insertData.push(modelInstance.toSupabase());
        models.push(modelInstance);
      });

      const { data: createdData, error } = await supabase
        .from(this.tableName)
        .insert(insertData)
        .select();

      if (error) throw error;

      return createdData.map(record => this.model.fromSupabase(record));
    } catch (error) {
      console.error('Error creating multiple documents:', error);
      throw error;
    }
  }

  // 存在確認
  async exists(id) {
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('id', id);

      if (error) throw error;

      return count > 0;
    } catch (error) {
      console.error(`Error checking existence of document ${id}:`, error);
      throw error;
    }
  }

  // カウント
  async count(queryOptions = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      // WHERE条件を追加
      if (queryOptions.where) {
        queryOptions.where.forEach(condition => {
          switch (condition.operator) {
            case '==':
              query = query.eq(condition.field, condition.value);
              break;
            case '!=':
              query = query.neq(condition.field, condition.value);
              break;
            case '>':
              query = query.gt(condition.field, condition.value);
              break;
            case '>=':
              query = query.gte(condition.field, condition.value);
              break;
            case '<':
              query = query.lt(condition.field, condition.value);
              break;
            case '<=':
              query = query.lte(condition.field, condition.value);
              break;
            case 'in':
              query = query.in(condition.field, condition.value);
              break;
            default:
              break;
          }
        });
      }

      const { count, error } = await query;

      if (error) throw error;

      return count;
    } catch (error) {
      console.error('Error counting documents:', error);
      throw error;
    }
  }
}