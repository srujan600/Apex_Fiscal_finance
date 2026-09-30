import { env } from '../../config/env';
import { NovaCompletionRequest, NovaCompletionResponse } from './nova.types';
import { NovaAuthError, NovaTimeoutError, NovaError } from './nova.errors';

export class NovaClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(customBaseUrl?: string, customApiKey?: string, timeoutMs = 12000) {
    this.baseUrl = (customBaseUrl || env.NOVA_BASE_URL).replace(/\/+$/, '');
    this.apiKey = customApiKey !== undefined ? customApiKey : (env.NOVA_API_KEY || '');
    this.timeoutMs = timeoutMs;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async complete(request: NovaCompletionRequest): Promise<NovaCompletionResponse> {
    if (!this.isConfigured()) {
      throw new NovaAuthError('Aczen Nova API key is not configured in server environment');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    const endpoint = `${this.baseUrl}/chat/completions`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: request.model || 'nova-chat-v1',
          messages: request.messages,
          temperature: request.temperature ?? 0.2,
          max_tokens: request.max_tokens ?? 1024,
          ...(request.response_format ? { response_format: request.response_format } : {}),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new NovaAuthError(`Aczen Nova authentication failed with status ${response.status}`);
        }
        const errorText = await response.text().catch(() => 'Unknown upstream error');
        throw new NovaError(
          `Aczen Nova API returned HTTP error ${response.status}: ${errorText.slice(0, 200)}`,
          response.status,
          response.status >= 500
        );
      }

      const json = (await response.json()) as NovaCompletionResponse;
      return json;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new NovaTimeoutError(`Aczen Nova API call timed out after ${this.timeoutMs}ms`);
      }

      if (error instanceof NovaError) {
        throw error;
      }

      throw new NovaError(`Network error communicating with Aczen Nova: ${error.message}`);
    }
  }
}
