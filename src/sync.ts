import { BlockRenderer } from './BlockRenderer';
import { ChildDatabaseRenderer } from './ChildDatabaseRenderer';
import { DatabaseEntryRenderer } from './DatabaseEntryRenderer';
import { DatabasePageRenderer } from './DatabasePageRenderer';
import { DatabaseTableRenderer } from './DatabaseTableRenderer';
import { DatabaseViewRenderer } from './DatabaseViewRenderer';
import { DeferredRenderer } from './DeferredRenderer';
import { FrontmatterRenderer } from './FrontmatterRenderer';
import { LinkRenderer } from './LinkRenderer';
import { MentionedPageRenderer } from './MentionedPageRenderer';
import { NotionApiFacade } from './NotionApiFacade';
import { PropertiesParser } from './PropertiesParser';
import { RecursiveBodyRenderer } from './RecursiveBodyRenderer';
import { RichTextRenderer } from './RichTextRenderer';
import { SyncConfig } from './SyncConfig';

export async function sync(notionApiToken: string, config: SyncConfig) {
  const publicApi = new NotionApiFacade(notionApiToken);

  const deferredRenderer = new DeferredRenderer();

  const frontmatterRenderer = new FrontmatterRenderer();
  const tableRenderer = new DatabaseTableRenderer();
  const mentionedPageRenderer = new MentionedPageRenderer(
    publicApi,
    deferredRenderer,
    config
  );
  const linkRenderer = new LinkRenderer();
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

  publicApi.printStats();

  return rendered;
}
