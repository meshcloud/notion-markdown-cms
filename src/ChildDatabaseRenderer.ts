import { Client } from '@notionhq/client/build/src';
import { Page } from '@notionhq/client/build/src/api-types';

import { SyncConfig } from './';
import { lookupDatabaseConfig } from './config';
import { DatabaseViewRenderer } from './DatabaseViewRenderer';
import { DeferredRenderer } from './DeferredRenderer';
import { DatabaseConfig } from './SyncConfig';
import { TableRenderer } from './TableRenderer';

export class ChildDatabaseRenderer {
  constructor(
    private readonly config: SyncConfig,
    private readonly publicApi: Client,
    private readonly deferredRenderer: DeferredRenderer,
    private readonly tableRenderer: TableRenderer,
    private readonly viewRenderer: DatabaseViewRenderer,
  ) {}

  async renderChildDatabase(databaseId: string): Promise<string> {
    const dbConfig = lookupDatabaseConfig(this.config, databaseId);

    const msg = `<!-- included database ${databaseId} -->\n`;

    // no view was defined for this database, render as a plain inline table
    const allPages = await this.fetchPages(databaseId, dbConfig);

    const isCmsDb = this.config.cmsDatabaseId !== databaseId;
    if (isCmsDb && !dbConfig.views) {
      return msg + await this.tableRenderer.renderTable(allPages, dbConfig);
    }

    // queue all pages in the database for individual, deferred rendering
    const prepareRenderPageTasks = allPages.map((x) =>
      this.deferredRenderer.renderPage(x, dbConfig)
    );

    // note: the await here is not actually starting to render the pages, however it prepares the page render task
    const renderPageTasks = await Promise.all(prepareRenderPageTasks);

    const db = {
      pages: renderPageTasks,
      config: dbConfig,
    };

    return this.viewRenderer.renderViews(db);
  }

  private async fetchPages(
    databaseId: string,
    dbConfig: DatabaseConfig,
  ): Promise<Page[]> {
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
        `Paging not implemented, db ${db.id} has more than 100 entries`,
      );
    }

    return allPages.results;
  }
}
