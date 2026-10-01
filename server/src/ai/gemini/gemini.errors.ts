export class GeminiError extends Error {
  public readonly statusCode?: number;
  public readonly isRetryable: boolean;

  constructor(message: string, statusCode?: number, isRetryable = false) {
    super(message);
    this.name = 'GeminiError';
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class GeminiAuthError extends GeminiError {
  constructor(message = 'Invalid or missing Google Gemini API Key (GEMINI_API_KEY)') {
    super(message, 401, false);
    this.name = 'GeminiAuthError';
  }
}

export class GeminiRateLimitError extends GeminiError {
  constructor(message = 'Google Gemini API rate limit or quota exceeded (429)') {
    super(message, 429, true);
    this.name = 'GeminiRateLimitError';
  }
}

export class GeminiTimeoutError extends GeminiError {
  constructor(message = 'Google Gemini API request timed out') {
    super(message, 408, true);
    this.name = 'GeminiTimeoutError';
  }
}

export class GeminiConfigurationError extends GeminiError {
  constructor(message = 'GEMINI_API_KEY is not configured in server environment. Graceful fallback activated.') {
    super(message, 500, false);
    this.name = 'GeminiConfigurationError';
  }
}
