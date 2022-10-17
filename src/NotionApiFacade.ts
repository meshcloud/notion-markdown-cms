import {
  APIErrorCode,
  APIResponseError,
  Client,
  RequestTimeoutError,
  UnknownHTTPResponseError,
} from "@notionhq/client";
import { DatabasesQueryParameters } from "@notionhq/client/build/src/api-endpoints";

const debug = require("debug")("notion-api");

/**
 * A common facade for interaction with notion API and handling common concerns (esp. retry on 502/rate limits).
 *
 * Note: considered splitting this up by consumer, but
 */
export class NotionApiFacade {
  private readonly client: Client;

  private readonly stats = {
    totalRequests: 0,
    totalRetries: 0,
    retriesByErrorCode: new Map<string, number>(),
  };

  constructor(notionApiToken: string) {
    this.client = new Client({
      auth: notionApiToken,
    });
  }

  async retrieveDatabase(databaseId: string) {
    return await this.withRetry(async () => {
      return this.client.databases.retrieve({
        database_id: databaseId,
      });
    });
  }

  async queryDatabase(query: DatabasesQueryParameters) {
    const results = [];

    let next_cursor: string | null = null;

    do {
      const response = await this.withRetry(
        async () =>
          await this.client.databases.query({
            ...query,
            start_cursor: next_cursor || undefined,
          })
      );

      results.push(...response.results);

      next_cursor = response.next_cursor;
    } while (next_cursor);

    return results;
  }

  async retrievePage(pageId: string) {
    return await this.withRetry(
      async () => await this.client.pages.retrieve({ page_id: pageId })
    );
  }

  async listBlockChildren(blockId: string) {
    const results = [];

    let next_cursor: string | null = null;

    do {
      const response = await this.withRetry(
        async () =>
          await this.client.blocks.children.list({
            block_id: blockId,
            start_cursor: next_cursor || undefined,
          })
      );

      results.push(...response.results);

      next_cursor = response.next_cursor;
    } while (next_cursor);

    return results;
  }

  printStats() {
    console.log("Notion API request statistics", this.stats);
  }

  private async withRetry<T>(
    f: () => Promise<T>,
    maxRetries: number = 3,
    retriableApiErrorCodes: APIErrorCode[] = [
      APIErrorCode.ServiceUnavailable,
      APIErrorCode.RateLimited,
    ],
    retriableUnknownHTTPStatusCodes: number[] = [502]
  ): Promise<T> {
    let lastError: any;

    for (let i = 1; i <= maxRetries; i++) {
      try {
        this.stats.totalRequests++;
        return await f();
      } catch (error: any) {
        lastError = error;

        const apiError = APIResponseError.isAPIResponseError(error) && error;
        const unknownError =
          UnknownHTTPResponseError.isUnknownHTTPResponseError(error) && error;
        const timeoutError =
          RequestTimeoutError.isRequestTimeoutError(error) && error;

        const isRetriable =
          (apiError && retriableApiErrorCodes.includes(error.code)) ||
          (unknownError &&
            retriableUnknownHTTPStatusCodes.includes(error.status)) ||
          timeoutError;

        if (!isRetriable) {
          // throw any other error immediately
          throw error;
        }

        this.stats.totalRetries++;
        const key =
          (apiError && apiError.code) ||
          (unknownError && `${unknownError.code}.${unknownError.status}`) ||
          (timeoutError && `${timeoutError.code}`) ||
          "unknown";

        const count = this.stats.retriesByErrorCode.get(key) || 0;
        this.stats.retriesByErrorCode.set(key, count + 1);

        debug(
          `Notion API request failed with error ${error.code},  ${
            maxRetries - i
          } retries left`
        );

        await sleep(1000 * i); // chosen by fair dice roll
      }
    }

    throw new Error(
      `Failed to execute Notion API request, even after ${maxRetries} retries. Original error was ${lastError}`
    );
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
