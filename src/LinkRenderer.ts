import { SyncConfig } from ".";
import { RenderDatabasePageTask } from "./RenderDatabasePageTask";

export class LinkRenderer {
  constructor(private readonly config: SyncConfig) {}

  renderUrlLink(text: string, url: string): string {
    return `[${text}](${url})`;
  }

  renderPageLink(text: string, page: RenderDatabasePageTask): string {
    const url = page.file.substr(this.config.outDir.length);

    return this.renderUrlLink(text, url);
  }
}
