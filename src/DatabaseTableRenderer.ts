import * as markdownTable from "./markdown-table";
import { RenderDatabaseEntryTask } from "./RenderDatabaseEntryTask";

export class DatabaseTableRenderer {
  public renderTable(entries: RenderDatabaseEntryTask[]): string {
    const table: any[][] = [];

    for (const entry of entries) {
      if (table.length === 0) {
        const headers = Array.from(entry.properties.properties.keys());
        table[0] = headers;
      }

      const cols = Array.from(entry.properties.properties.values()).map((c, i) =>
        DatabaseTableRenderer.escapeTableCell(c)
      );

      table.push(cols);
    }

    return markdownTable.markdownTable(table);
  }

  static escapeTableCell(content: string | number | any): string {
    // markdown table cells do not support newlines, however we can insert <br> elements instead
    if (typeof content === "string") {
      return content.replace(/\n/g, "<br>");
    }

    return content?.toString() || "";
  }
}
