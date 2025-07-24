// API基底クラス
import axios from 'axios';

// カスタムエラークラス
export class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'APIError';
  }
}

// APIレスポンスインターフェース
export class APIResponse {
  constructor(success, data = null, error = null) {
    this.success = success;
    this.data = data;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  static success(data) {
    return new APIResponse(true, data, null);
  }

  static error(error) {
    return new APIResponse(false, null, {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An error occurred',
      details: error.details || null
    });
  }
}

// API基底クラス
export class BaseAPI {
  constructor(baseURL = process.env.REACT_APP_API_URL || '/api') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // リクエストインターセプター
    this.client.interceptors.request.use(
      async (config) => {
        // 認証トークンを追加
        const token = await this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // レスポンスインターセプター
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        return this.handleError(error);
      }
    );
  }

  // 認証トークン取得（サブクラスでオーバーライド）
  async getAuthToken() {
    // Firebaseの場合
    if (typeof window !== 'undefined' && window.firebase?.auth) {
      const user = window.firebase.auth().currentUser;
      if (user) {
        return await user.getIdToken();
      }
    }
    
    // ローカルストレージから取得
    return localStorage.getItem('authToken');
  }

  // エラーハンドリング
  handleError(error) {
    if (error.response) {
      // サーバーからのエラーレスポンス
      const { data, status } = error.response;
      const apiError = new APIError(
        data?.error?.message || error.message,
        status,
        data?.error?.code || 'SERVER_ERROR',
        data?.error?.details
      );
      return Promise.reject(apiError);
    } else if (error.request) {
      // ネットワークエラー
      const apiError = new APIError(
        'ネットワークエラーが発生しました',
        0,
        'NETWORK_ERROR'
      );
      return Promise.reject(apiError);
    } else {
      // その他のエラー
      const apiError = new APIError(
        error.message,
        500,
        'CLIENT_ERROR'
      );
      return Promise.reject(apiError);
    }
  }

  // HTTPメソッド
  async get(endpoint, params = {}) {
    try {
      const response = await this.client.get(endpoint, { params });
      return APIResponse.success(response.data);
    } catch (error) {
      return APIResponse.error(error);
    }
  }

  async post(endpoint, data = {}) {
    try {
      const response = await this.client.post(endpoint, data);
      return APIResponse.success(response.data);
    } catch (error) {
      return APIResponse.error(error);
    }
  }

  async put(endpoint, data = {}) {
    try {
      const response = await this.client.put(endpoint, data);
      return APIResponse.success(response.data);
    } catch (error) {
      return APIResponse.error(error);
    }
  }

  async patch(endpoint, data = {}) {
    try {
      const response = await this.client.patch(endpoint, data);
      return APIResponse.success(response.data);
    } catch (error) {
      return APIResponse.error(error);
    }
  }

  async delete(endpoint) {
    try {
      const response = await this.client.delete(endpoint);
      return APIResponse.success(response.data);
    } catch (error) {
      return APIResponse.error(error);
    }
  }

  // ページネーション用ヘルパー
  buildPaginationParams(page = 1, limit = 20, sort = null) {
    const params = {
      page,
      limit
    };

    if (sort) {
      params.sort = sort;
    }

    return params;
  }

  // クエリパラメータビルダー
  buildQueryParams(filters = {}) {
    const params = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params[key] = value;
      }
    });

    return params;
  }
}