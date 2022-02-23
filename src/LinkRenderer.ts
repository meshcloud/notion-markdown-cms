import { RenderDatabasePageTask } from './RenderDatabasePageTask';

export class LinkRenderer {
  constructor() {}

  renderUrlLink(text: string, url: string): string {
    return `[${text}](${url})`;
  }

  renderPageLink(text: string, page: RenderDatabasePageTask): string {
    const url = "/" + page.file;
    
    return this.renderUrlLink(text, url);
  }
}
