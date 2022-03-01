import * as path from "path";

import { AssetWriter } from "./AssetWriter";
import { PageLinkResolver } from "./PageLinkResolver";
import { RenderingContextLogger as RenderingContextLogger } from "./RenderingContextLogger";

/**
 * Unit of work for rendering a specific page.
 * Note: this is a bit of a service locator, be careful about not breaking SRP
 */
export class RenderingContext {
  readonly assetWriter: AssetWriter;
  readonly logger: RenderingContextLogger;
  readonly linkResolver: PageLinkResolver;

  constructor(notionUrl: string, file: string) {
    this.logger = new RenderingContextLogger(notionUrl, file);

    const dir = path.dirname(file);
    
    // write all assets right next to the page's markdown file
    this.assetWriter = new AssetWriter(dir, this.logger);
    
    // resolve all links relative to the page's markdown file dir
    this.linkResolver = new PageLinkResolver(dir);
  }
}
