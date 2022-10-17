import { Page } from "@notionhq/client/build/src/api-types";

import { SyncConfig } from "./";
import { lookupDatabaseConfig } from "./config";
import { Database } from "./Database";
import { DatabaseViewRenderer } from "./DatabaseViewRenderer";
import { DeferredRenderer } from "./DeferredRenderer";
import { NotionApiFacade } from "./NotionApiFacade";
import { PageLinkResolver } from "./PageLinkResolver";
import { RenderDatabasePageTask } from "./RenderDatabasePageTask";
import {
  DatabaseConfig,
  DatabaseConfigRenderPages,
  DatabaseConfigRenderTable,
} from "./SyncConfig";

const debug = require("debug")("child-database");

export class ChildDatabaseRenderer {
  constructor(
    private readonly config: SyncConfig,
    private readonly publicApi: NotionApiFacade,
    private readonly deferredRenderer: DeferredRenderer,
    private readonly viewRenderer: DatabaseViewRenderer
  ) {}

  async renderChildDatabase(
    databaseId: string,
    linkResolver: PageLinkResolver
  ): Promise<Database> {
    const dbConfig = lookupDatabaseConfig(this.config, databaseId);

    // no view was defined for this database, render as a plain inline table
    const allPages = await this.fetchPages(databaseId, dbConfig);

    const renderPages = dbConfig.renderAs === "pages+views";

    debug(
      "rendering child database " + databaseId + " as " + dbConfig.renderAs
    );

    if (renderPages) {
      const pageConfig = dbConfig as DatabaseConfigRenderPages;
      const entries = await this.queuePageRendering(allPages, pageConfig);
      const markdown = await this.viewRenderer.renderViews(
        entries,
        dbConfig as DatabaseConfigRenderPages,
        linkResolver
      );

      return {
        config: dbConfig,
        entries,
        markdown,
      };
    } else {
      // render table
      const entries = await this.queueEntryRendering(allPages, dbConfig);
      const markdown = this.viewRenderer.renderViews(
        entries,
        dbConfig,
        linkResolver
      );

      return {
        config: dbConfig,
        entries,
        markdown,
      };
    }
  }

  private async queueEntryRendering(
    allPages: Page[],
    dbConfig: DatabaseConfigRenderTable
  ) {
    const prepareRenderEntryTasks = allPages.map((x) =>
      this.deferredRenderer.renderEntry(x, dbConfig)
    );

    // note: the await here is not actually starting to render the pages, however it prepares the page render task
    return await Promise.all(prepareRenderEntryTasks);
  }

  private async queuePageRendering(
    allPages: Page[],
    dbConfig: DatabaseConfigRenderPages
  ): Promise<RenderDatabasePageTask[]> {
    const prepareRenderPageTasks = allPages.map((x) =>
      this.deferredRenderer.renderPage(x, dbConfig)
    );

    // note: the await here is not actually starting to render the pages, however it prepares the page render task
    return await Promise.all(prepareRenderPageTasks);
  }

  private async fetchPages(
    databaseId: string,
    dbConfig: DatabaseConfig
  ): Promise<Page[]> {
    const db = await this.publicApi.retrieveDatabase(databaseId);

    const allPages = await this.publicApi.queryDatabase({
      database_id: db.id,
      sorts: dbConfig.sorts,
      page_size: 100,
    });

    return allPages;
  }
}
