// データベースサービスのメインエクスポート
export * from './repositories';

// リポジトリインスタンスのシングルトン
import { 
  createUserRepository,
  createGameRepository,
  createGameSessionRepository,
  createLearningProgressRepository
} from './repositories';

// シングルトンインスタンス
let userRepository = null;
let gameRepository = null;
let gameSessionRepository = null;
let learningProgressRepository = null;

// リポジトリ取得関数
export const getUserRepository = () => {
  if (!userRepository) {
    userRepository = createUserRepository();
  }
  return userRepository;
};

export const getGameRepository = () => {
  if (!gameRepository) {
    gameRepository = createGameRepository();
  }
  return gameRepository;
};

export const getGameSessionRepository = () => {
  if (!gameSessionRepository) {
    gameSessionRepository = createGameSessionRepository();
  }
  return gameSessionRepository;
};

export const getLearningProgressRepository = () => {
  if (!learningProgressRepository) {
    learningProgressRepository = createLearningProgressRepository();
  }
  return learningProgressRepository;
};

// データベース初期化関数
export const initializeDatabase = async () => {
  try {
    console.log('Initializing database repositories...');
    
    // リポジトリの初期化
    getUserRepository();
    getGameRepository();
    getGameSessionRepository();
    getLearningProgressRepository();
    
    console.log('Database repositories initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};