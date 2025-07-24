// Claude (Anthropic) APIクライアント
import axios from 'axios';
import { BaseAIClient, RateLimiter } from './baseAIClient';

export class ClaudeClient extends BaseAIClient {
  constructor(config = {}) {
    super({
      apiKey: config.apiKey || process.env.REACT_APP_ANTHROPIC_API_KEY,
      baseURL: config.baseURL || 'https://api.anthropic.com/v1',
      model: config.model || 'claude-3-opus-20240229',
      ...config
    });

    // Claude固有の設定
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 1000;
    this.topP = config.topP || 1;
    this.topK = config.topK || undefined;
    this.stopSequences = config.stopSequences || [];

    // レート制限設定
    this.rateLimiter = new RateLimiter(config.requestsPerMinute || 60);

    // HTTPクライアント設定
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    });
  }

  // メッセージ完了リクエスト
  async sendRequest(messages, options = {}) {
    return this.makeRequest(async () => {
      try {
        const requestBody = {
          model: options.model || this.model,
          messages: this.formatMessages(messages),
          max_tokens: options.maxTokens || this.maxTokens,
          temperature: options.temperature || this.temperature,
          top_p: options.topP || this.topP,
          top_k: options.topK || this.topK,
          stop_sequences: options.stopSequences || this.stopSequences,
          ...options
        };

        // システムメッセージを抽出
        const systemMessage = this.extractSystemMessage(messages);
        if (systemMessage) {
          requestBody.system = systemMessage;
        }

        const response = await this.client.post('/messages', requestBody);
        
        this.validateResponse(response.data);
        
        // 使用統計を更新
        if (response.data.usage) {
          this.totalTokens = (this.totalTokens || 0) + 
            response.data.usage.input_tokens + response.data.usage.output_tokens;
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

  // メッセージフォーマット（Claude形式）
  formatMessages(input) {
    let messages = [];

    // 文字列の場合
    if (typeof input === 'string') {
      messages = [{ role: 'user', content: input }];
    }
    // 配列の場合
    else if (Array.isArray(input)) {
      messages = input.filter(msg => msg.role !== 'system');
    }
    // オブジェクトの場合
    else if (input.user || input.prompt) {
      messages = [{ role: 'user', content: input.user || input.prompt }];
    }

    // Claudeのメッセージ形式に変換
    return messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));
  }

  // システムメッセージ抽出
  extractSystemMessage(input) {
    if (Array.isArray(input)) {
      const systemMsg = input.find(msg => msg.role === 'system');
      return systemMsg?.content;
    }
    
    if (typeof input === 'object' && input.system) {
      return input.system;
    }

    return null;
  }

  // レスポンス解析
  parseResponse(data) {
    const content = data.content[0];
    
    return {
      content: content.text,
      role: data.role,
      stopReason: data.stop_reason,
      usage: {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: data.usage.input_tokens + data.usage.output_tokens
      },
      model: data.model,
      id: data.id
    };
  }

  // ストリーミングリクエスト
  async *streamRequest(messages, options = {}) {
    const requestBody = {
      model: options.model || this.model,
      messages: this.formatMessages(messages),
      max_tokens: options.maxTokens || this.maxTokens,
      temperature: options.temperature || this.temperature,
      stream: true
    };

    const systemMessage = this.extractSystemMessage(messages);
    if (systemMessage) {
      requestBody.system = systemMessage;
    }

    try {
      const response = await this.client.post('/messages', requestBody, {
        responseType: 'stream'
      });

      let buffer = '';
      
      for await (const chunk of response.data) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'content_block_delta' && data.delta.text) {
                yield {
                  type: 'content',
                  content: data.delta.text
                };
              } else if (data.type === 'message_stop') {
                return;
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

  // ツール使用（関数呼び出し相当）
  async sendToolRequest(messages, tools, options = {}) {
    return this.makeRequest(async () => {
      try {
        const requestBody = {
          model: options.model || this.model,
          messages: this.formatMessages(messages),
          max_tokens: options.maxTokens || this.maxTokens,
          temperature: options.temperature || this.temperature,
          tools: tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.parameters
          })),
          tool_choice: options.toolChoice || { type: 'auto' }
        };

        const systemMessage = this.extractSystemMessage(messages);
        if (systemMessage) {
          requestBody.system = systemMessage;
        }

        const response = await this.client.post('/messages', requestBody);
        
        this.validateResponse(response.data);
        
        // ツール使用がある場合
        const toolUse = response.data.content.find(c => c.type === 'tool_use');
        if (toolUse) {
          return {
            type: 'tool_use',
            toolUse: {
              name: toolUse.name,
              arguments: toolUse.input,
              id: toolUse.id
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

  // 使用可能なモデル一覧
  getAvailableModels() {
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2'
    ];
  }

  // モデル情報取得
  getModelInfo(modelName) {
    const modelInfo = {
      'claude-3-opus-20240229': {
        contextWindow: 200000,
        maxOutput: 4096,
        description: '最も高性能なモデル'
      },
      'claude-3-sonnet-20240229': {
        contextWindow: 200000,
        maxOutput: 4096,
        description: 'バランスの取れたモデル'
      },
      'claude-3-haiku-20240307': {
        contextWindow: 200000,
        maxOutput: 4096,
        description: '高速で効率的なモデル'
      }
    };

    return modelInfo[modelName] || null;
  }
}