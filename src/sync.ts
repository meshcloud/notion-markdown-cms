import { promises as fs } from "fs";
import { Client } from "@notionhq/client";
import { BlockRenderer } from "./BlockRenderer";
import { FrontmatterRenderer } from "./FrontmatterRenderer";
import { PageRenderer } from "./PageRenderer";
import { PropertiesParser } from "./PropertiesParser";
import { RecursiveBodyRenderer } from "./RecursiveBodyRenderer";
import { DatabaseRenderer } from "./DatabaseRenderer";
import { DeferredRenderer } from "./DeferredRenderer";
import { SyncConfig } from "./SyncConfig";
import { RichTextRenderer } from "./RichTextRenderer";
import { MentionedPageRenderer } from "./MentionedPageRenderer";
import { LinkRenderer } from "./LinkRenderer";

export async function sync(notionApiToken: string, config: SyncConfig) {
  const publicApi = new Client({
    auth: notionApiToken,
  });

  const deferredRenderer = new DeferredRenderer();

  const mentionedPageRenderer = new MentionedPageRenderer(
    publicApi,
    deferredRenderer,
    config
  );
  const linkRenderer = new LinkRenderer(config);
  const richTextRenderer = new RichTextRenderer(
    mentionedPageRenderer,
    linkRenderer
  );
  const frontmatterRenderer = new FrontmatterRenderer();
  const propertiesParser = new PropertiesParser(richTextRenderer);
  const blockRenderer = new BlockRenderer(
    deferredRenderer,
    richTextRenderer,
    linkRenderer
  );
  const bodyRenderer = new RecursiveBodyRenderer(publicApi, blockRenderer);
  const pageRenderer = new PageRenderer(
    propertiesParser,
    frontmatterRenderer,
    bodyRenderer
  );

  const dbRenderer = new DatabaseRenderer(publicApi, deferredRenderer, config);

  deferredRenderer.initialize(dbRenderer, pageRenderer);

  // seed it with the root database
  await deferredRenderer.renderDatabasePages(config.cmsDatabaseId);
  await deferredRenderer.process();

  await fs.writeFile(
    config.indexPath,
    `export const index = ${JSON.stringify(
      deferredRenderer.getRenderedPages(),
      null,
      2
    )};`
  );
}
