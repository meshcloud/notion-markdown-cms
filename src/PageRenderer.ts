import * as fsc from "fs";

import { Page } from "@notionhq/client/build/src/api-types";

import { AssetWriter } from "./AssetWriter";
import { FrontmatterRenderer } from "./FrontmatterRenderer";
import { RecursiveBodyRenderer } from "./RecursiveBodyRenderer";
import { slugify } from "./slugify";
import { RenderPageTask as RenderPageTask } from "./RenderedPageTask";
import { DatabaseConfig } from "./SyncConfig";
import { PropertiesParser } from "./PropertiesParser";
import { logger } from "./logger";

const debug = require("debug")("page");

const fs = fsc.promises;

export class PageRenderer {
  constructor(
    readonly propertiesParser: PropertiesParser,
    readonly frontmatterRenderer: FrontmatterRenderer,
    readonly bodyRenderer: RecursiveBodyRenderer
  ) {}

  renderPage(page: Page, config: DatabaseConfig): RenderPageTask {
    const parsed = this.propertiesParser.parse(page.properties);
    const props = this.propertiesParser.filter(config, parsed);

    const name = props.values["name"];
    if (!name) {
      this.throwMissingRequiredProperty("name", page);
    }

    const category = props.values[props.keys.get(config.properties.category)!!];
    if (category) {
      this.throwMissingRequiredProperty(config.properties.category, page);
    }

    const nameSlug = slugify(name);
    const categorySlug = config.pageCategoryValuePrefix + slugify(category);

    const file = `${config.outDir}/${nameSlug}.md`;

    // Design: all the rendering performance could be greatly enhanced writing directly to output streams instead
    // of concatenating all in memory. OTOH naively concatenatic strings is straightforward, easier to debug and rendering
    // performance probably not the bottleneck compared to the IO cost of notion API invocations.

    return {
      id: page.id,
      category: categorySlug,
      file,
      properties: props,
      render: async () => {
        const assetWriter = new AssetWriter(config.outDir);

        const frontmatter = this.frontmatterRenderer.renderFrontmatter(
          props.values
        );
        const body = await this.bodyRenderer.renderBody(
          page,
          props,
          assetWriter
        );

        await fs.mkdir(config.outDir, { recursive: true });
        await fs.writeFile(file, frontmatter + body);

        logger.info("wrote: " + file);
      },
    };
  }

  private throwMissingRequiredProperty(propertyName: string, page: Page) {
    const msg = `Page ${page.url} is missing required property ${propertyName}`;
    debug(msg + "\n%O", page);

    throw new Error(msg);
  }
}
