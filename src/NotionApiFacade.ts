import { Client } from '@notionhq/client';
import { DatabasesQueryParameters } from '@notionhq/client/build/src/api-endpoints';

/**
 * A common facade for interaction with notion API and handling common concerns (esp. retry on 502/rate limits).
 *
 * Note: considered splitting this up by consumer, but
 */
export class NotionApiFacade {
  private readonly client: Client;

  constructor(notionApiToken: string) {
    this.client = new Client({
      auth: notionApiToken,
    });
  }

  async retrieveDatabase(databaseId: string) {
    return await this.client.databases.retrieve({
      database_id: databaseId,
    });
  }

  async queryDatabase(query: DatabasesQueryParameters) {
    const result =  await this.client.databases.query(query); // todo: paging

    if (result.next_cursor) {
      throw new Error(
        `Paging not implemented, db ${query.database_id} has more than 100 entries`
      );
    }

    return result;
  }

  async retrievePage(pageId: string) {
    return await this.client.pages.retrieve({ page_id: pageId });
  }

  async listBlockChildren(blockId: string) {
    const result = await this.client.blocks.children.list({ block_id: blockId }); // todo: paging here? 

    if (result.next_cursor) {
      throw new Error(
        `Paging not implemented, block ${blockId} has more children than returned in a single request`
      );
    }

    return result;
  }
}
