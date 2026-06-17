export interface RetryOptions {
  retries?: number;
  delayMs?: number;
}

export interface IRetryHandler {
  execute<T>(
    action: () => Promise<T>,
    description?: string,
    options?: RetryOptions
  ): Promise<T>;
}
