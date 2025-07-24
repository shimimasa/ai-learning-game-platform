// OpenAI APIクライアント
import axios from 'axios';
import { BaseAIClient, RateLimiter } from './baseAIClient';

export class OpenAIClient extends BaseAIClient {
  constructor(config = {}) {
    super({
      apiKey: config.apiKey || process.env.REACT_APP_OPENAI_API_KEY,
      baseURL: config.baseURL || 'https://api.openai.com/v1',
      model: config.model || 'gpt-4',
      ...config
    });

    // OpenAI固有の設定
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 1000;
    this.topP = config.topP || 1;
    this.frequencyPenalty = config.frequencyPenalty || 0;
    this.presencePenalty = config.presencePenalty || 0;

    // レート制限設定（GPT-4: 40,000 TPM, 200 RPM）
    this.rateLimiter = new RateLimiter(config.requestsPerMinute || 200);

    // HTTPクライアント設定
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // チャット完了リクエスト
  async sendRequest(messages, options = {}) {
    return this.makeRequest(async () => {
      try {
        const requestBody = {
          model: options.model || this.model,
          messages: this.formatMessages(messages),
          temperature: options.temperature || this.temperature,
          max_tokens: options.maxTokens || this.maxTokens,
          top_p: options.topP || this.topP,
          frequency_penalty: options.frequencyPenalty || this.frequencyPenalty,
          presence_penalty: options.presencePenalty || this.presencePenalty,
          ...options
        };

        const response = await this.client.post('/chat/completions', requestBody);
        
        this.validateResponse(response.data);
        
        // 使用統計を更新
        if (response.data.usage) {
          this.totalTokens = (this.totalTokens || 0) + response.data.usage.total_tokens;
        }
        this.totalRequests = (this.totalRequests || 0) + 1;
        this.successfulRequests = (this.successfulRequests || 0) + 1;

        return this.parseResponse(response.data);
      } catch (error) {
        this.failedRequests = (this.failedRequests || 0) + 1;
        throw this.formatError(error);
      }
    });
  }

  // メッセージフォーマット
  formatMessages(input) {
    // 文字列の場合は単一のユーザーメッセージとして扱う
    if (typeof input === 'string') {
      return [{ role: 'user', content: input }];
    }

    // 既にメッセージ配列の場合はそのまま返す
    if (Array.isArray(input)) {
      return input;
    }

    // オブジェクトの場合
    if (input.system) {
      return [
        { role: 'system', content: input.system },
        { role: 'user', content: input.user || input.prompt }
      ];
    }

    return [{ role: 'user', content: JSON.stringify(input) }];
  }

  // レスポンス解析
  parseResponse(data) {
    const choice = data.choices[0];
    
    return {
      content: choice.message.content,
      role: choice.message.role,
      finishReason: choice.finish_reason,
      usage: data.usage,
      model: data.model,
      id: data.id
    };
  }

  // 関数呼び出し付きリクエスト
  async sendFunctionRequest(messages, functions, options = {}) {
    return this.makeRequest(async () => {
      try {
        const requestBody = {
          model: options.model || this.model,
          messages: this.formatMessages(messages),
          functions: functions,
          function_call: options.functionCall || 'auto',
          temperature: options.temperature || this.temperature,
          max_tokens: options.maxTokens || this.maxTokens
        };

        const response = await this.client.post('/chat/completions', requestBody);
        
        this.validateResponse(response.data);
        
        const choice = response.data.choices[0];
        
        // 関数呼び出しがある場合
        if (choice.message.function_call) {
          return {
            type: 'function_call',
            functionCall: {
              name: choice.message.function_call.name,
              arguments: JSON.parse(choice.message.function_call.arguments)
            },
            usage: response.data.usage
          };
        }

        // 通常のメッセージレスポンス
        return this.parseResponse(response.data);
      } catch (error) {
        throw this.formatError(error);
      }
    });
  }

  // ストリーミングリクエスト
  async *streamRequest(messages, options = {}) {
    const requestBody = {
      model: options.model || this.model,
      messages: this.formatMessages(messages),
      temperature: options.temperature || this.temperature,
      max_tokens: options.maxTokens || this.maxTokens,
      stream: true
    };

    try {
      const response = await this.client.post('/chat/completions', requestBody, {
        responseType: 'stream'
      });

      let buffer = '';
      
      for await (const chunk of response.data) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.trim() === 'data: [DONE]') return;

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices[0].delta;
              
              if (delta.content) {
                yield {
                  type: 'content',
                  content: delta.content
                };
              }
            } catch (e) {
              console.error('Failed to parse streaming response:', e);
            }
          }
        }
      }
    } catch (error) {
      throw this.formatError(error);
    }
  }

  // 埋め込み生成
  async createEmbedding(input, options = {}) {
    return this.makeRequest(async () => {
      try {
        const requestBody = {
          model: options.model || 'text-embedding-ada-002',
          input: Array.isArray(input) ? input : [input]
        };

        const response = await this.client.post('/embeddings', requestBody);
        
        this.validateResponse(response.data);
        
        return {
          embeddings: response.data.data.map(item => item.embedding),
          usage: response.data.usage
        };
      } catch (error) {
        throw this.formatError(error);
      }
    });
  }

  // モデル一覧取得
  async listModels() {
    try {
      const response = await this.client.get('/models');
      return response.data.data.filter(model => model.id.includes('gpt'));
    } catch (error) {
      throw this.formatError(error);
    }
  }
}