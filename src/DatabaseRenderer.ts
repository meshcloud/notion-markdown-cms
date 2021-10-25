import { Client } from "@notionhq/client";
import { Database } from "./Database";
import { DeferredRenderer } from "./DeferredRenderer";
import { SyncConfig } from ".";
import { lookupDatabaseConfig } from "./config";

export class DatabaseRenderer {
  constructor(
    readonly publicApi: Client,
    readonly deferredRenderer: DeferredRenderer,
    readonly config: SyncConfig
  ) {}

  async renderDatabase(databaseId: string): Promise<Database> {
    const dbConfig = lookupDatabaseConfig(this.config, databaseId);

    const db = await this.publicApi.databases.retrieve({
      database_id: databaseId,
    });

    const allPages = await this.publicApi.databases.query({
      database_id: db.id,
      sorts: dbConfig.sorts,
      page_size: 100,
    }); // todo: paging

    if (allPages.next_cursor) {
      throw new Error(
        `Paging not implemented, db ${db.id} has more than 100 entries`
      );
    }

    const prepareRenderPageTasks = allPages.results.map((x) =>
      this.deferredRenderer.renderPage(x, dbConfig)
    );

    // note: the await here is not actually starting to render the pages, however it prepares the page render task
    const renderPageTasks = await Promise.all(prepareRenderPageTasks);

    return {
      pages: renderPageTasks,
      config: dbConfig,
    };
  }
}
