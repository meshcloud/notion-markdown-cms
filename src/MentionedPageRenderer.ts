import { APIErrorCode } from '@notionhq/client';

import { SyncConfig } from './';
import { lookupDatabaseConfig } from './config';
import { DeferredRenderer } from './DeferredRenderer';
import { NotionApiFacade } from './NotionApiFacade';
import { RenderDatabasePageTask } from './RenderDatabasePageTask';

export class MentionedPageRenderer {
  constructor(
    readonly publicApi: NotionApiFacade,
    readonly deferredRenderer: DeferredRenderer,
    readonly config: SyncConfig
  ) {}

  async renderPage(
    pageId: string,
    mentionPlaintext: string
  ): Promise<RenderDatabasePageTask> {
    // when we cannot resolve a page link, that usually means
    // - the page has been deleted/archived and notion's API is not consistently reflecting that
    // - the API use does not have access to the linked page (e.g. it sits somewhere else in the workspace)
    // In either the case, the plain_text is not a good fallback in this case as it's typically just"Untitled"
    // So instead we just render a note to the markdown

    const page = await this.tryFindPage(pageId);

    if (!page) {
      throw new Error(
        `Could not find ${this.formatMentionedPage(
          pageId,
          mentionPlaintext
        )}. The page is most likely deleted or the Notion API Integration does not have permission to access it.`
      );
    }

    let databaseId: string | null = null;
    if (page.parent.type === "database_id") {
      databaseId = page.parent.database_id;
    }

    const dbConfig = lookupDatabaseConfig(this.config, databaseId);

    if (dbConfig.renderAs !== "pages+views") {
      throw new Error(
        `The ${this.formatMentionedPage(
          pageId,
          mentionPlaintext
        )} is not part of a database configured to render as 'pages+views' and thus not included in markdown output. Rendering it as a link is thus impossible.`
      );
    }

    return this.deferredRenderer.renderPage(page, dbConfig);
  }

  private async tryFindPage(pageId: string) {
    try {
      return await this.publicApi.retrievePage( pageId);
    } catch (error: any) {
      if (error.code === APIErrorCode.ObjectNotFound) {
        // this is an expected error, e.g. we do not have access to the page source
        return null;
      } else {
        throw error;
      }
    }
  }

  private formatMentionedPage(pageId: string, mentionPlaintext: string) {
    const formattedId = pageId.replace(/-/g, "");
    return `mentioned page '${mentionPlaintext}' with url https://notion.so/${formattedId}`;
  }
}
