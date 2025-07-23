// Application configuration constants
export const APP_CONFIG = {
  APP_NAME: 'AI Learning Platform',
  APP_VERSION: '0.1.0',
  API_TIMEOUT: 30000, // 30 seconds
  MAX_RETRY_ATTEMPTS: 3,
  SESSION_TIMEOUT: 3600000, // 1 hour
  AUTO_SAVE_INTERVAL: 30000 // 30 seconds
};

// User roles
export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  PARENT: 'parent',
  ADMIN: 'admin'
};

// Game status
export const GAME_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft'
};

// Learning subjects
export const SUBJECTS = {
  MATHEMATICS: 'mathematics',
  SCIENCE: 'science',
  LANGUAGE: 'language',
  HISTORY: 'history',
  GEOGRAPHY: 'geography'
};

// Difficulty levels
export const DIFFICULTY_LEVELS = {
  BEGINNER: 1,
  ELEMENTARY: 2,
  INTERMEDIATE: 3,
  ADVANCED: 4,
  EXPERT: 5
};

// Session status
export const SESSION_STATUS = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
  PAUSED: 'paused'
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  USERS: '/api/users',
  GAMES: '/api/games',
  SESSIONS: '/api/sessions',
  AI: '/api/ai',
  ANALYTICS: '/api/analytics'
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  GAME_PROGRESS: 'game_progress',
  PREFERENCES: 'preferences'
};

// AI configuration
export const AI_CONFIG = {
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
  RETRY_DELAY: 1000,
  RATE_LIMIT_PER_MINUTE: 20
};