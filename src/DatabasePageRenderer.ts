import * as fsc from 'fs';

import { Page } from '@notionhq/client/build/src/api-types';

import { AssetWriter } from './AssetWriter';
import { FrontmatterRenderer } from './FrontmatterRenderer';
import { logger } from './logger';
import { PropertiesParser } from './PropertiesParser';
import { RecursiveBodyRenderer } from './RecursiveBodyRenderer';
import { RenderDatabasePageTask as RenderDatabasePageTask } from "./RenderDatabasePageTask";
import { slugify } from './slugify';
import { DatabaseConfig } from './SyncConfig';

const fs = fsc.promises;

export class DatabasePageRenderer {
  constructor(
    readonly propertiesParser: PropertiesParser,
    readonly frontmatterRenderer: FrontmatterRenderer,
    readonly bodyRenderer: RecursiveBodyRenderer
  ) {}

  async renderPage(page: Page, config: DatabaseConfig): Promise<RenderDatabasePageTask> {
    if (page.archived){
      logger.warn(`rendering archived page ${page.url}`);
    }

    const props = await this.propertiesParser.parsePageProperties(page, config);

    const categorySlug = slugify(props.meta.category);
    const destDir = `${config.outDir}/${categorySlug}`;

    const nameSlug = slugify(props.meta.title);
    const file = `${destDir}/${nameSlug}.md`;

    // Design: all the rendering performance could be greatly enhanced writing directly to output streams instead
    // of concatenating all in memory. OTOH naively concatenatic strings is straightforward, easier to debug and rendering
    // performance probably not the bottleneck compared to the IO cost of notion API invocations.

    return {
      id: page.id,
      file,
      properties: props,
      render: async () => {
        const assetWriter = new AssetWriter(destDir);

        const frontmatter = this.frontmatterRenderer.renderFrontmatter(props);
        const body = await this.bodyRenderer.renderBody(page, assetWriter);

        await fs.mkdir(destDir, { recursive: true });
        await fs.writeFile(file, frontmatter + body);

        logger.info("wrote: " + file);
      },
    };
  }
}
