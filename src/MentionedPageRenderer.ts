import { APIErrorCode, Client } from "@notionhq/client";
import { DeferredRenderer } from "./DeferredRenderer";
import { SyncConfig } from ".";
import { RenderDatabasePageTask } from "./RenderDatabasePageTask";
import { lookupDatabaseConfig } from "./config";

export class MentionedPageRenderer {
  constructor(
    readonly publicApi: Client,
    readonly deferredRenderer: DeferredRenderer,
    readonly config: SyncConfig
  ) {}

  async renderPage(pageId: string): Promise<RenderDatabasePageTask | null> {
    const page = await this.tryFindPage(pageId);

    if (!page) {
      return null;
    }

    let databaseId: string | null = null;
    if (page.parent.type === "database_id") {
      databaseId = page.parent.database_id;
    }

    const dbConfig = lookupDatabaseConfig(this.config, databaseId);

    return this.deferredRenderer.renderPage(page, dbConfig);
  }

  async tryFindPage(pageId: string) {
    try {
      return await this.publicApi.pages.retrieve({ page_id: pageId });
    } catch (error: any) {
      if (error.code === APIErrorCode.ObjectNotFound) {
        return null;
      } else {
        throw error;
      }
    }
  }
}
