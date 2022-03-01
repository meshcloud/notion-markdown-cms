import { PageLinkResolver } from "./PageLinkResolver";
import { RenderDatabasePageTask } from "./RenderDatabasePageTask";

export class LinkRenderer {
  constructor() {}

  renderUrlLink(text: string, url: string): string {
    return `[${text}](${url})`;
  }

  renderPageLink(
    text: string,
    toPage: RenderDatabasePageTask,
    linkResolver: PageLinkResolver
  ): string {
    const link = linkResolver.resolveRelativeLinkTo(toPage.file);

    return this.renderUrlLink(text, link);
  }
}
