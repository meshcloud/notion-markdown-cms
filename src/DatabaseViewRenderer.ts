import { DatabaseTableRenderer } from './DatabaseTableRenderer';
import { LinkRenderer } from './LinkRenderer';
import * as markdownTable from './markdown-table';
import { PropertiesParser } from './PropertiesParser';
import { RenderDatabasePageTask } from './RenderDatabasePageTask';
import { DatabaseConfigRenderPages, DatabaseView } from './SyncConfig';

const debug = require("debug")("database-views");

// todo: name afte what it renders, not to where
export class DatabaseViewRenderer {
  constructor(private readonly linkRenderer: LinkRenderer) {}

  public renderViews(entries: RenderDatabasePageTask[], config: DatabaseConfigRenderPages): string {
    const views = config.views?.map((view) => {
      const propKeys = entries[0].properties.keys;
      const propKey = propKeys.get(view.properties.groupBy);

      if (!propKey) {
        const msg = `Could not render view ${view.title}, groupBy property ${view.properties.groupBy} not found`;
        debug(msg + "%O", view);
        throw new Error(msg);
      }

      const grouped = new Array(
        ...groupBy(entries, (p) => p.properties.values[propKey])
      );

      return grouped
        .map(([key, pages]) => this.renderView(pages, key, view))
        .join("\n\n");
    });

    return views?.join("\n\n") || "";
  }

  public renderView(
    pages: RenderDatabasePageTask[],
    titleAppendix: string,
    view: DatabaseView
  ): string {
    // todo: handle empty page
    const props = pages[0].properties;

    const keys = PropertiesParser.filterIncludedKeys(
      props.keys,
      view.properties.include,
    );

    const table: any[][] = [];

    const headers = Array.from(keys.keys());
    table[0] = headers;

    const cols = Array.from(keys.values());
    pages.forEach((r) =>
      table.push(
        cols.map((c, i) => {
          const content = DatabaseTableRenderer.escapeTableCell(r.properties.values[c]);
          return i == 0
            ? this.linkRenderer.renderPageLink(content, r) // make the first cell a relative link to the page
            : content;
        })
      )
    );

    return (
      `## ${view.title} - ${titleAppendix}\n\n` +
      markdownTable.markdownTable(table)
    );
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
