import { ILogger } from '../interfaces/ILogger';
import { IRetryHandler, RetryOptions } from '../interfaces/IRetryHandler';

const DEFAULT_RETRIES = 3;
const DEFAULT_DELAY_MS = 500;

export class RetryHandler implements IRetryHandler {
  constructor(private readonly logger: ILogger) {}

  async execute<T>(
    action: () => Promise<T>,
    description: string = 'action',
    options: RetryOptions = {}
  ): Promise<T> {
    const { retries = DEFAULT_RETRIES, delayMs = DEFAULT_DELAY_MS } = options;
    let lastError: unknown;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.logger.debug(`Attempt ${attempt}/${retries}: ${description}`);
        const result = await action();
        if (attempt > 1) {
          this.logger.info(`Succeeded on attempt ${attempt}/${retries}: ${description}`);
        }
        return result;
      } catch (error) {
        lastError = error;
        const isLast = attempt === retries;

        if (isLast) {
          this.logger.error(`All ${retries} attempt(s) failed: ${description}`, error);
        } else {
          const backoff = delayMs * attempt;
          this.logger.warn(
            `Attempt ${attempt}/${retries} failed: ${description} — retrying in ${backoff}ms`,
            { reason: String(error) }
          );
          await RetryHandler.sleep(backoff);
        }
      }
    }

    throw lastError;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
