import { Page } from '@notionhq/client/build/src/api-types';

import { LinkRenderer } from './LinkRenderer';
import * as markdownTable from './markdown-table';
import { PropertiesParser } from './PropertiesParser';
import { RenderPageTask } from './RenderPageTask';
import { DatabaseConfig, DatabaseView } from './SyncConfig';

export class TableRenderer {
  constructor(
    private readonly linkRenderer: LinkRenderer,
    private readonly propertiesParser: PropertiesParser,
  ) {}

  async renderTable(pages: Page[], config: DatabaseConfig): Promise<string> {
    const table: any[][] = [];

    for (const page of pages) {
      const props = await this.propertiesParser.parseProperties(page, config);

      if (table.length === 0) {
        const headers = Array.from(props.keys.keys());
        table[0] = headers;
      }

      const cols = Array.from(props.keys.values())
        .map((c, i) => this.escapeTableCell(props.properties[c]));

      table.push(cols);
    }

    return markdownTable.markdownTable(table);
  }

  public renderView(pages: RenderPageTask[], key: string, view: DatabaseView): string {
    // todo: handle empty page
    const props = pages[0].properties;

    const keys = PropertiesParser.filterIncludedKeys(
      view.properties.include,
      props.keys,
    );

    const table: any[][] = [];

    const headers = Array.from(keys.keys());
    table[0] = headers;

    const cols = Array.from(keys.values());
    pages.forEach((r) =>
      table.push(
        cols.map((c, i) => {
          const content = this.escapeTableCell(r.properties.values[c]);
          return i == 0
            ? this.linkRenderer.renderPageLink(content, r) // make the first cell a relative link to the page
            : content;
        }),
      )
    );

    return `## ${view.title} - ${key}\n\n${markdownTable.markdownTable(table)}`;
  }

  private escapeTableCell(content: string | number | any): string {
    // markdown table cells do not support newlines, however we can insert <br> elements instead
    if (typeof content === "string") {
      return content.replace(/\n/g, "<br>");
    }

    return content.toString();
  }
}
