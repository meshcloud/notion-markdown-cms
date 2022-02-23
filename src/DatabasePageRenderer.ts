import * as fsc from 'fs';

import { Page } from '@notionhq/client/build/src/api-types';

import { AssetWriter } from './AssetWriter';
import { FrontmatterRenderer } from './FrontmatterRenderer';
import { RenderingLoggingContext } from './logger';
import { PropertiesParser } from './PropertiesParser';
import { RecursiveBodyRenderer } from './RecursiveBodyRenderer';
import { RenderDatabasePageTask as RenderDatabasePageTask } from './RenderDatabasePageTask';
import { DatabaseConfigRenderPages } from './SyncConfig';

const fs = fsc.promises;

export class DatabasePageRenderer {
  constructor(
    readonly propertiesParser: PropertiesParser,
    readonly frontmatterRenderer: FrontmatterRenderer,
    readonly bodyRenderer: RecursiveBodyRenderer
  ) {}

  async renderPage(
    page: Page,
    config: DatabaseConfigRenderPages
  ): Promise<RenderDatabasePageTask> {
    const props = await this.propertiesParser.parsePageProperties(page);

    const destDir = config.pages.destinationPathBuilder(props);
    const file = `${destDir}/${config.pages.filenameBuilder(props)}.md`;

    // Design: all the rendering performance could be greatly enhanced writing directly to output streams instead
    // of concatenating all in memory. OTOH naively concatenatic strings is straightforward, easier to debug and rendering
    // performance probably not the bottleneck compared to the IO cost of notion API invocations.

    return {
      id: page.id,
      file,
      properties: props,
      render: async () => {
        const context = new RenderingLoggingContext(page.url, file);

        if (page.archived) {
          // have to skip rendering archived pages as attempting to retrieve the block will result in a HTTP 404
          context.warn(`page is archived - skipping`);

          return;
        }

        try {
          const assetWriter = new AssetWriter(destDir);

          const frontmatter = this.frontmatterRenderer.renderFrontmatter(props, config);
          const body = await this.bodyRenderer.renderBody(
            page,
            assetWriter,
            context
          );

          await fs.mkdir(destDir, { recursive: true });
          await fs.writeFile(file, frontmatter + body);

          context.complete();
        } catch (error) {
          // While catch-log-throw is usually an antipattern, it is the renderes job to orchestrate the rendering
          // job with concerns like logging and  writing to the outside world. Hence this place is appropriate.
          // We need to throw the error here so that the rendering process can crash with a proper error message, since
          // an error at this point here is unrecoverable.
          context.error(error);
          throw error;
        }
      },
    };
  }
}
