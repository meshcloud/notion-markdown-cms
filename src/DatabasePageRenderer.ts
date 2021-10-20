import { Client } from "@notionhq/client";
import { DatabaseConfig } from "./SyncConfig";
import { Database } from "./Database";
import { DeferredRenderer } from "./DeferredRenderer";
import { SyncConfig } from ".";

export class DatabasePageRenderer {
  constructor(
    readonly publicApi: Client,
    readonly deferredRenderer: DeferredRenderer,
    readonly config: SyncConfig
  ) {}

  async renderDatabase(databaseId: string): Promise<Database> {
    const fallbackDbConfig: DatabaseConfig = {
      outDir:
        databaseId === this.config.cmsDatabaseId
          ? this.config.outDir
          : this.config.outDir + "/" + databaseId,
      properties: {
        category: "Category",
      },
    };
    const dbConfig: DatabaseConfig =
      this.config.databases[databaseId] || fallbackDbConfig;

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

    const tasks = allPages.results.map((x) =>
      this.deferredRenderer.renderPage(x, dbConfig)
    );

    return {
      pages: tasks,
      config: dbConfig,
    };
  }
}
