import { Page } from "@notionhq/client/build/src/api-types";

import { ChildDatabaseRenderer } from "./ChildDatabaseRenderer";
import { Database } from "./Database";
import { DatabaseEntryRenderer } from "./DatabaseEntryRenderer";
import { DatabasePageRenderer } from "./DatabasePageRenderer";
import { RenderDatabaseEntryTask } from "./RenderDatabaseEntryTask";
import { RenderDatabasePageTask as RenderDatabasePageTask } from "./RenderDatabasePageTask";
import { RenderedDatabaseEntry } from "./RenderedDatabaseEntry";
import { RenderedDatabasePage } from "./RenderedDatabasePage";
import {
  DatabaseConfigRenderPages,
  DatabaseConfigRenderTable,
} from "./SyncConfig";

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
    config: DatabaseConfigRenderPages
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
    config: DatabaseConfigRenderTable
  ): Promise<RenderDatabaseEntryTask> {
    const task = await this.entryRenderer.renderEntry(page);

    // entries are complete the moment they are retrieved, there's no more deferred processing necessary on them
    // also there should be no duplicate entries, so we do not cache/lookup any of them
    if (config.entries.emitToIndex) {
      this.renderedEntries.push(task);
    }

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
  }

  public getRenderedPages(): (RenderedDatabasePage | RenderedDatabaseEntry)[] {
    const pages: (RenderedDatabasePage | RenderedDatabaseEntry)[] = Array.from(
      this.renderedPages.values()
    ).map((x) => ({
      file: x.file,
      meta: x.properties.meta,
      properties: x.properties.properties,
    }));

    const entries: RenderedDatabaseEntry[] = this.renderedEntries.map((x) => ({
      meta: {
        id: x.properties.meta.id,
        url: x.properties.meta.url,
      },
      properties: x.properties.properties,
    }));

    return pages.concat(entries);
  }
}
