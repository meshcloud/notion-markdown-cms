import { Page } from '@notionhq/client/build/src/api-types';

import { ChildDatabaseRenderer } from './ChildDatabaseRenderer';
import { logger } from './logger';
import { PageRenderer } from './PageRenderer';
import { RenderedPage } from './RenderedPage';
import { RenderPageTask as RenderPageTask } from './RenderPageTask';
import { DatabaseConfig } from './SyncConfig';

const debug = require("debug")("rendering");

export class DeferredRenderer {
  private dbRenderer!: ChildDatabaseRenderer;
  private pageRenderer!: PageRenderer;

  private pageQueue: (() => Promise<any>)[] = [];

  private readonly renderedPages = new Map<string, RenderPageTask>();

  public initialize(
    dbRenderer: ChildDatabaseRenderer,
    pageRenderer: PageRenderer
  ) {
    this.dbRenderer = dbRenderer;
    this.pageRenderer = pageRenderer;
  }

  public async renderChildDatabase(databaseId: string): Promise<string> {
    // database pages objects are retrieved immediately, but page bodys are queued for deferred rendering
    const fetched = await this.dbRenderer.renderChildDatabase(databaseId);

    return fetched;
  }

  public async renderPage(page: Page, config: DatabaseConfig): Promise<RenderPageTask> {
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

  public getRenderedPages(): RenderedPage[] {
    return Array.from(this.renderedPages.values()).map((x) => ({
      file: x.file,
      meta: x.properties.meta,
      properties: x.properties.values,
    }));
  }
}
