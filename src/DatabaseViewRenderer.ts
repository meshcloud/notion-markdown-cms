import { Database } from './Database';
import { TableRenderer } from './TableRenderer';

const debug = require("debug")("database");

export class DatabaseViewRenderer {
  constructor(
    private readonly tableRenderer: TableRenderer,
  ) {}

  renderViews(db: Database): string {
    const views = db.config.views?.map((view) => {
      const propKeys = db.pages[0].properties.keys;
      const propKey = propKeys.get(view.properties.groupBy);

      if (!propKey) {
        const msg =
          `Could not render view ${view.title}, groupBy property ${view.properties.groupBy} not found`;
        debug(msg + "%O", view);
        throw new Error(msg);
      }

      const grouped = new Array(
        ...groupBy(db.pages, (p) => p.properties.values[propKey]),
      );

      return grouped
        .map(([key, pages]) => this.tableRenderer.renderView(pages, key, view))
        .join("\n\n");
    });

    return views?.join("\n\n") || "";
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
  keyGetter: (input: V) => K,
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
