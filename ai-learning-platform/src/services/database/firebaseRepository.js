// Firebase用リポジトリ実装
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase';
import { BaseRepository } from './baseRepository';

export class FirebaseRepository extends BaseRepository {
  constructor(collectionName, model) {
    super(collectionName, model);
    this.collectionRef = collection(db, collectionName);
  }

  // 単一のドキュメントを取得
  async findById(id) {
    try {
      const docRef = doc(this.collectionRef, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return this.model.fromFirestore(docSnap.id, docSnap.data());
      }
      return null;
    } catch (error) {
      console.error(`Error finding document by ID ${id}:`, error);
      throw error;
    }
  }

  // 条件に基づいて複数のドキュメントを取得
  async findMany(queryOptions = {}, options = {}) {
    try {
      let q = this.collectionRef;

      // WHERE条件を追加
      if (queryOptions.where) {
        queryOptions.where.forEach(condition => {
          q = query(q, where(condition.field, condition.operator, condition.value));
        });
      }

      // ORDER BY を追加
      if (queryOptions.orderBy) {
        queryOptions.orderBy.forEach(order => {
          q = query(q, orderBy(order.field, order.direction || 'asc'));
        });
      }

      // LIMIT を追加
      if (queryOptions.limit) {
        q = query(q, limit(queryOptions.limit));
      }

      // ページネーション用のカーソル
      if (queryOptions.startAfter) {
        q = query(q, startAfter(queryOptions.startAfter));
      }

      const querySnapshot = await getDocs(q);
      const results = [];
      
      querySnapshot.forEach((doc) => {
        results.push(this.model.fromFirestore(doc.id, doc.data()));
      });

      return results;
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

      const docData = modelInstance.toFirestore();
      const docRef = doc(this.collectionRef, modelInstance.id);
      await setDoc(docRef, docData);
      
      return modelInstance;
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

      const updatedData = { ...data, updatedAt: new Date() };
      const docRef = doc(this.collectionRef, id);
      await updateDoc(docRef, updatedData);
      
      return await this.findById(id);
    } catch (error) {
      console.error(`Error updating document ${id}:`, error);
      throw error;
    }
  }

  // ドキュメントを削除
  async delete(id) {
    try {
      const docRef = doc(this.collectionRef, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Error deleting document ${id}:`, error);
      throw error;
    }
  }

  // バッチ作成
  async createMany(dataArray) {
    try {
      const batch = writeBatch(db);
      const models = [];

      dataArray.forEach(data => {
        const modelInstance = new this.model(data);
        const validation = modelInstance.validate ? modelInstance.validate() : { isValid: true };
        
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        const docRef = doc(this.collectionRef, modelInstance.id);
        batch.set(docRef, modelInstance.toFirestore());
        models.push(modelInstance);
      });

      await batch.commit();
      return models;
    } catch (error) {
      console.error('Error creating multiple documents:', error);
      throw error;
    }
  }

  // 存在確認
  async exists(id) {
    try {
      const docRef = doc(this.collectionRef, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error(`Error checking existence of document ${id}:`, error);
      throw error;
    }
  }

  // カウント
  async count(queryOptions = {}) {
    try {
      // Firestoreの制限により、実際のドキュメントを取得してカウント
      const results = await this.findMany(queryOptions);
      return results.length;
    } catch (error) {
      console.error('Error counting documents:', error);
      throw error;
    }
  }
}