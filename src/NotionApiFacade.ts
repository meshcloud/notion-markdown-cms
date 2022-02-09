import {
    APIErrorCode, APIResponseError, Client, RequestTimeoutError, UnknownHTTPResponseError
} from '@notionhq/client';
import { DatabasesQueryParameters } from '@notionhq/client/build/src/api-endpoints';

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
    const result = await this.withRetry(
      async () => await this.client.databases.query(query)
    ); // todo: paging

    if (result.next_cursor) {
      throw new Error(
        `Paging not implemented, db ${query.database_id} has more than 100 entries`
      );
    }

    return result;
  }

  async retrievePage(pageId: string) {
    return await this.withRetry(
      async () => await this.client.pages.retrieve({ page_id: pageId })
    );
  }

  async listBlockChildren(blockId: string) {
    const result = await this.withRetry(
      async () =>
        await this.client.blocks.children.list({
          block_id: blockId,
        })
    ); // todo: paging here?

    if (result.next_cursor) {
      throw new Error(
        `Paging not implemented, block ${blockId} has more children than returned in a single request`
      );
    }

    return result;
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
