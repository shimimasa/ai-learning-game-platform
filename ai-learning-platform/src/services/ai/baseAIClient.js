// AI APIクライアント基底クラス
export class BaseAIClient {
  constructor(config = {}) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL;
    this.model = config.model;
    this.maxRetries = config.maxRetries || 3;
    this.timeout = config.timeout || 30000;
    this.rateLimiter = null;
    this.requestQueue = [];
    this.isProcessing = false;
  }

  // APIリクエスト送信（サブクラスで実装）
  async sendRequest(prompt, options = {}) {
    throw new Error('sendRequest must be implemented by subclass');
  }

  // レート制限付きリクエスト
  async makeRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  // リクエストキューの処理
  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const { requestFn, resolve, reject } = this.requestQueue.shift();

    try {
      // レート制限チェック
      if (this.rateLimiter) {
        await this.rateLimiter.waitForSlot();
      }

      // リトライ付きリクエスト実行
      const result = await this.executeWithRetry(requestFn);
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.isProcessing = false;
      // 次のリクエストを処理
      setTimeout(() => this.processQueue(), 100);
    }
  }

  // リトライ付き実行
  async executeWithRetry(requestFn, retryCount = 0) {
    try {
      return await requestFn();
    } catch (error) {
      if (this.shouldRetry(error, retryCount)) {
        const delay = this.getRetryDelay(retryCount);
        await this.sleep(delay);
        return this.executeWithRetry(requestFn, retryCount + 1);
      }
      throw error;
    }
  }

  // リトライ判定
  shouldRetry(error, retryCount) {
    if (retryCount >= this.maxRetries) {
      return false;
    }

    // レート制限エラー
    if (error.status === 429) {
      return true;
    }

    // 一時的なエラー
    if (error.status >= 500 || error.code === 'ETIMEDOUT') {
      return true;
    }

    return false;
  }

  // リトライ遅延計算（指数バックオフ）
  getRetryDelay(retryCount) {
    const baseDelay = 1000;
    const maxDelay = 60000;
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    // ジッターを追加
    return delay + Math.random() * 1000;
  }

  // スリープ関数
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // プロンプトのトークン数推定
  estimateTokens(text) {
    // 簡易的な推定（日本語は1文字≒2トークン、英語は4文字≒1トークン）
    const japaneseChars = (text.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g) || []).length;
    const englishChars = text.length - japaneseChars;
    return Math.ceil(japaneseChars * 2 + englishChars / 4);
  }

  // レスポンス検証
  validateResponse(response) {
    if (!response) {
      throw new Error('Empty response from AI service');
    }

    if (response.error) {
      throw new Error(`AI service error: ${response.error.message || 'Unknown error'}`);
    }

    return true;
  }

  // エラーメッセージ生成
  formatError(error) {
    if (error.response) {
      return {
        message: error.response.data?.error?.message || error.message,
        status: error.response.status,
        code: error.response.data?.error?.code || 'UNKNOWN_ERROR'
      };
    }

    return {
      message: error.message,
      code: error.code || 'NETWORK_ERROR'
    };
  }

  // 使用統計
  getUsageStats() {
    return {
      totalRequests: this.totalRequests || 0,
      successfulRequests: this.successfulRequests || 0,
      failedRequests: this.failedRequests || 0,
      totalTokens: this.totalTokens || 0
    };
  }
}

// レート制限クラス
export class RateLimiter {
  constructor(requestsPerMinute = 60) {
    this.requestsPerMinute = requestsPerMinute;
    this.tokens = requestsPerMinute;
    this.lastRefill = Date.now();
    this.interval = 60000 / requestsPerMinute; // ミリ秒単位
  }

  async waitForSlot() {
    this.refillTokens();

    if (this.tokens <= 0) {
      const waitTime = this.interval - (Date.now() - this.lastRefill);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.refillTokens();
      }
    }

    this.tokens--;
  }

  refillTokens() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.interval);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.requestsPerMinute, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
}