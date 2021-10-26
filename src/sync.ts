import { promises as fs } from 'fs';

import { Client } from '@notionhq/client';

import { BlockRenderer } from './BlockRenderer';
import { ChildDatabaseRenderer } from './ChildDatabaseRenderer';
import { DatabaseViewRenderer } from './DatabaseViewRenderer';
import { DeferredRenderer } from './DeferredRenderer';
import { FrontmatterRenderer } from './FrontmatterRenderer';
import { LinkRenderer } from './LinkRenderer';
import { MentionedPageRenderer } from './MentionedPageRenderer';
import { PageRenderer } from './PageRenderer';
import { PropertiesParser } from './PropertiesParser';
import { RecursiveBodyRenderer } from './RecursiveBodyRenderer';
import { RichTextRenderer } from './RichTextRenderer';
import { SyncConfig } from './SyncConfig';
import { TableRenderer } from './TableRenderer';

export async function sync(notionApiToken: string, config: SyncConfig) {
  const publicApi = new Client({
    auth: notionApiToken,
  });

  const deferredRenderer = new DeferredRenderer();

  const mentionedPageRenderer = new MentionedPageRenderer(
    publicApi,
    deferredRenderer,
    config,
  );
  const linkRenderer = new LinkRenderer(config);
  const richTextRenderer = new RichTextRenderer(
    mentionedPageRenderer,
    linkRenderer,
  );
  const frontmatterRenderer = new FrontmatterRenderer();
  const propertiesParser = new PropertiesParser(richTextRenderer);
  const tableRenderer = new TableRenderer(linkRenderer, propertiesParser);
  const viewRenderer = new DatabaseViewRenderer(tableRenderer);
  const blockRenderer = new BlockRenderer(
    richTextRenderer,
    deferredRenderer,
  );
  const bodyRenderer = new RecursiveBodyRenderer(publicApi, blockRenderer);
  const pageRenderer = new PageRenderer(
    propertiesParser,
    frontmatterRenderer,
    bodyRenderer,
  );

  const dbRenderer = new ChildDatabaseRenderer(
    config,
    publicApi,
    deferredRenderer,
    tableRenderer,
    viewRenderer,
  );

  deferredRenderer.initialize(dbRenderer, pageRenderer);

  // seed it with the root database
  await deferredRenderer.renderChildDatabase(config.cmsDatabaseId);
  await deferredRenderer.process();

  await fs.writeFile(
    config.indexPath,
    `export const index = ${
      JSON.stringify(
        deferredRenderer.getRenderedPages(),
        null,
        2,
      )
    };`,
  );
}
