import { Page } from "@notionhq/client/build/src/api-types";

import { ChildDatabaseRenderer } from "./ChildDatabaseRenderer";
import { logger } from "./logger";
import { DatabasePageRenderer } from "./DatabasePageRenderer";
import { RenderedDatabaseEntry } from "./RenderedDatabaseEntry";
import { RenderedDatabasePage } from "./RenderedDatabasePage";
import { RenderDatabasePageTask as RenderDatabasePageTask } from "./RenderDatabasePageTask";
import { RenderDatabaseEntryTask } from "./RenderDatabaseEntryTask";
import { DatabaseConfig } from "./SyncConfig";
import { Database } from "./Database";
import { DatabaseEntryRenderer } from "./DatabaseEntryRenderer";

const debug = require("debug")("rendering");

export class DeferredRenderer {
  private dbRenderer!: ChildDatabaseRenderer;
  private pageRenderer!: DatabasePageRenderer;
  private entryRenderer!: DatabaseEntryRenderer;

  private pageQueue: (() => Promise<any>)[] = [];

  private readonly renderedPages = new Map<string, RenderDatabasePageTask>();
  private readonly renderedEntries: RenderDatabaseEntryTask[] = [];

  public initialize(
    dbRenderer: ChildDatabaseRenderer,
    pageRenderer: DatabasePageRenderer,
    entryRenderer: DatabaseEntryRenderer
  ) {
    this.dbRenderer = dbRenderer;
    this.pageRenderer = pageRenderer;
    this.entryRenderer = entryRenderer;
  }

  public async renderChildDatabase(databaseId: string): Promise<Database> {
    return await this.dbRenderer.renderChildDatabase(databaseId);
  }

  public async renderPage(
    page: Page,
    config: DatabaseConfig
  ): Promise<RenderDatabasePageTask> {
    // cache to avoid rendering the same page twice, e.g. when it is linked multiple times
    const cached = this.renderedPages.get(page.id);
    if (cached) {
      debug("page cache hit " + page.id);
      return cached;
    }

    const task = await this.pageRenderer.renderPage(page, config);

    this.renderedPages.set(page.id, task);
    this.pageQueue.push(task.render);

    return task;
  }

  public async renderEntry(
    page: Page,
    config: DatabaseConfig
  ): Promise<RenderDatabaseEntryTask> {
    const task = await this.entryRenderer.renderEntry(page, config);

    // entries are complete the moment they are retrieved, there's no more deferred processing necessary on them
    // also there should be no duplicate entries, so we do not cache/lookup any of them

    this.renderedEntries.push(task);

    return task;
  }

  public async process() {
    /**
     * Design: may not be optimal since we need at least as many iterations as the maximum depth of the page graph
     * Also iterations are not interleaving, i.e. they are strictily sequential.
     *
     * Only tasks within the same iteration are executed concurrently.
     */

    const maxTasksPerIteration = 16; // chosen by fair dice roll

    while (this.pageQueue.length) {
      const batch = this.pageQueue.splice(
        0,
        Math.min(maxTasksPerIteration, this.pageQueue.length)
      );

      debug("processing queued page batch with length: " + batch.length);

      // process concurrently
      const promises = batch.map((fn) => fn());
      await Promise.all(promises);
    }

    logger.success("sync complete");
  }

  public getRenderedPages(): (RenderedDatabasePage | RenderedDatabaseEntry)[] {
    const pages: (RenderedDatabasePage | RenderedDatabaseEntry)[] = Array.from(
      this.renderedPages.values()
    ).map((x) => ({
      file: x.file,
      meta: x.properties.meta,
      properties: x.properties.values,
    }));

    return pages.concat(this.renderedEntries);
  }
}
