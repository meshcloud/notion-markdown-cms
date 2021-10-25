import { SyncConfig } from ".";
import { RenderPageTask } from "./RenderPageTask";

export class LinkRenderer {
  constructor(private readonly config: SyncConfig) {}

  renderUrlLink(text: string, url: string): string {
    return `[${text}](${url})`;
  }

  renderPageLink(text: string, page: RenderPageTask): string {
    const url = page.file.substr(this.config.outDir.length);

    return this.renderUrlLink(text, url);
  }
}
