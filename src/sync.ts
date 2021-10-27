import { promises as fs } from "fs";

import { Client } from "@notionhq/client";

import { BlockRenderer } from "./BlockRenderer";
import { ChildDatabaseRenderer } from "./ChildDatabaseRenderer";
import { DatabaseViewRenderer } from "./DatabaseViewRenderer";
import { DeferredRenderer } from "./DeferredRenderer";
import { FrontmatterRenderer } from "./FrontmatterRenderer";
import { LinkRenderer } from "./LinkRenderer";
import { MentionedPageRenderer } from "./MentionedPageRenderer";
import { DatabasePageRenderer } from "./DatabasePageRenderer";
import { PropertiesParser } from "./PropertiesParser";
import { RecursiveBodyRenderer } from "./RecursiveBodyRenderer";
import { RichTextRenderer } from "./RichTextRenderer";
import { SyncConfig } from "./SyncConfig";
import { DatabaseTableRenderer } from "./DatabaseTableRenderer";
import { DatabaseEntryRenderer } from "./DatabaseEntryRenderer";

export async function sync(notionApiToken: string, config: SyncConfig) {
  const publicApi = new Client({
    auth: notionApiToken,
  });

  const deferredRenderer = new DeferredRenderer();

  const frontmatterRenderer = new FrontmatterRenderer();
  const tableRenderer = new DatabaseTableRenderer();
  const mentionedPageRenderer = new MentionedPageRenderer(
    publicApi,
    deferredRenderer,
    config
  );
  const linkRenderer = new LinkRenderer(config);
  const viewRenderer = new DatabaseViewRenderer(linkRenderer);
  const richTextRenderer = new RichTextRenderer(
    mentionedPageRenderer,
    linkRenderer
  );
  const propertiesParser = new PropertiesParser(richTextRenderer);
  const blockRenderer = new BlockRenderer(richTextRenderer, deferredRenderer);
  const bodyRenderer = new RecursiveBodyRenderer(publicApi, blockRenderer);
  const entryRenderer = new DatabaseEntryRenderer(propertiesParser);
  const pageRenderer = new DatabasePageRenderer(
    propertiesParser,
    frontmatterRenderer,
    bodyRenderer
  );

  const dbRenderer = new ChildDatabaseRenderer(
    config,
    publicApi,
    deferredRenderer,
    tableRenderer,
    viewRenderer
  );

  deferredRenderer.initialize(dbRenderer, pageRenderer, entryRenderer);

  // seed it with the root database
  await deferredRenderer.renderChildDatabase(config.cmsDatabaseId);
  await deferredRenderer.process();

  const rendered = deferredRenderer.getRenderedPages();
  await fs.writeFile(
    config.indexPath,
    `export const index = ${JSON.stringify(
      rendered,
      null,
      2
    )};`
  );

  return rendered;
}
