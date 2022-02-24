import { DatabaseConfigRenderTable } from ".";
import { LinkRenderer } from "./LinkRenderer";
import * as markdownTable from "./markdown-table";
import { RenderDatabaseEntryTask } from "./RenderDatabaseEntryTask";
import { RenderDatabasePageTask } from "./RenderDatabasePageTask";
import { DatabaseConfigRenderPages, DatabaseView } from "./SyncConfig";

// todo: name afte what it renders, not to where
export class DatabaseViewRenderer {
  constructor(private readonly linkRenderer: LinkRenderer) {}

  public renderViews(
    entries: (RenderDatabasePageTask | RenderDatabaseEntryTask)[],
    config: DatabaseConfigRenderPages | DatabaseConfigRenderTable
  ): string {
    const configuredViews = config.views || [{}];

    const views = configuredViews?.map((view) => {
      const groupByProperty = view?.properties?.groupBy;

      if (!groupByProperty) {
        return this.renderView(entries, null, view);
      } else {
        const grouped = new Array(
          ...groupBy(entries, (p) =>
            p.properties.properties.get(groupByProperty)
          )
        );

        return grouped
          .map(([key, pages]) => this.renderView(pages, key, view))
          .join("\n\n");
      }
    });

    return views?.join("\n\n") || "";
  }

  private renderView(
    pages: (RenderDatabasePageTask | RenderDatabaseEntryTask)[],
    titleAppendix: string | null,
    view: DatabaseView
  ): string {
    if (!pages[0]) {
      return "<!-- no pages inside this database -->";
    }
    const pageProps = pages[0].properties;

    const includedProps =
      view?.properties?.include || Array.from(pageProps.properties.keys());

    const table: any[][] = [];

    const headers = includedProps;
    table[0] = headers;

    const cols = includedProps;
    pages.forEach((r) =>
      table.push(
        cols.map((c, i) => {
          const content = escapeTableCell(r.properties.properties.get(c));
          return i == 0 && isRenderPageTask(r)
            ? this.linkRenderer.renderPageLink(content, r) // make the first cell a relative link to the page
            : content;
        })
      )
    );

    const tableMd = markdownTable.markdownTable(table);
    if (view.title) {
      return `## ${view.title} - ${titleAppendix}\n\n` + tableMd;
    } else {
      return tableMd;
    }
  }
}

/**
 * @description
 * Takes an Array<V>, and a grouping function,
 * and returns a Map of the array grouped by the grouping function.
 *
 * @param list An array of type V.
 * @param keyGetter A Function that takes the the Array type V as an input, and returns a value of type K.
 *                  K is generally intended to be a property key of V.
 *
 * @returns Map of the array grouped by the grouping function.
 */
export function groupBy<K, V>(
  list: Array<V>,
  keyGetter: (input: V) => K
): Map<K, Array<V>> {
  const map = new Map<K, Array<V>>();
  list.forEach((item) => {
    const key = keyGetter(item);
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return map;
}

function escapeTableCell(content: string | number | any): string {
  // markdown table cells do not support newlines, however we can insert <br> elements instead
  if (typeof content === "string") {
    return content.replace(/\n/g, "<br>");
  }

  return content?.toString() || "";
}

function isRenderPageTask(
  task: RenderDatabasePageTask | RenderDatabaseEntryTask
): task is RenderDatabasePageTask {
  return (task as RenderDatabasePageTask).render !== undefined;
}
