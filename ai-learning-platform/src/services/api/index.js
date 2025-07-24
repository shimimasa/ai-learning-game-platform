// APIサービスのメインエクスポート
import { UserAPI } from './userAPI';
import { GameAPI } from './gameAPI';
import { GameSessionAPI } from './gameSessionAPI';
import { LearningProgressAPI } from './learningProgressAPI';

// APIインスタンスのシングルトン
let userAPI = null;
let gameAPI = null;
let gameSessionAPI = null;
let learningProgressAPI = null;

// API取得関数
export const getUserAPI = () => {
  if (!userAPI) {
    userAPI = new UserAPI();
  }
  return userAPI;
};

export const getGameAPI = () => {
  if (!gameAPI) {
    gameAPI = new GameAPI();
  }
  return gameAPI;
};

export const getGameSessionAPI = () => {
  if (!gameSessionAPI) {
    gameSessionAPI = new GameSessionAPI();
  }
  return gameSessionAPI;
};

export const getLearningProgressAPI = () => {
  if (!learningProgressAPI) {
    learningProgressAPI = new LearningProgressAPI();
  }
  return learningProgressAPI;
};

// 統一APIインターフェース
export class API {
  static get users() {
    return getUserAPI();
  }

  static get games() {
    return getGameAPI();
  }

  static get sessions() {
    return getGameSessionAPI();
  }

  static get progress() {
    return getLearningProgressAPI();
  }
}

// エラークラスのエクスポート
export { APIError, APIResponse } from './baseAPI';

// 便利なヘルパー関数
export const handleAPIResponse = async (apiCall) => {
  try {
    const response = await apiCall;
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// APIエラーハンドラー
export const handleAPIError = (error, defaultMessage = 'エラーが発生しました') => {
  if (error.response) {
    // サーバーエラー
    const message = error.response.data?.error?.message || defaultMessage;
    console.error('Server Error:', message);
    return message;
  } else if (error.request) {
    // ネットワークエラー
    console.error('Network Error:', error);
    return 'ネットワークエラーが発生しました';
  } else {
    // その他のエラー
    console.error('Error:', error.message);
    return error.message || defaultMessage;
  }
};

// デフォルトエクスポート
export default API;