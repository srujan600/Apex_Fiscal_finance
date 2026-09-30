export class NovaError extends Error {
  public readonly statusCode?: number;
  public readonly isRetryable: boolean;

  constructor(message: string, statusCode?: number, isRetryable = false) {
    super(message);
    this.name = 'NovaError';
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NovaAuthError extends NovaError {
  constructor(message = 'Invalid or missing Aczen Nova API Key') {
    super(message, 401, false);
    this.name = 'NovaAuthError';
  }
}

export class NovaTimeoutError extends NovaError {
  constructor(message = 'Aczen Nova API request timed out') {
    super(message, 408, true);
    this.name = 'NovaTimeoutError';
  }
}

export class NovaValidationError extends NovaError {
  constructor(message = 'Aczen Nova returned malformed or unexpected response format') {
    super(message, 502, false);
    this.name = 'NovaValidationError';
  }
}
