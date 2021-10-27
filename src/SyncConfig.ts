import { Sort } from "@notionhq/client/build/src/api-types";

export interface SyncConfig {
  /**
   * Id of the Notion database containing the CMS content.
   * Traversing the block graph starts here.
   *
   * By convention this database must have the following properties
   *
   * - Name: page name
   * - Category: page category
   * - sort: number to control sorting of pages in sidebar
   */
  cmsDatabaseId: string;

  /**
   * The output directory where the sync will place pages.
   *
   * Example: "docs/"
   */
  outDir: string;

  /**
   * The path where the sync will store an index of rendered pages and their properties.
   * The index is
   */
  indexPath: string;

  /**
   * Configuration options for any database encountered while traversing the block graph.
   * This allows you to customize the way the CMS imports the database and its pages.
   */
  databases: Record<string, DatabaseConfig>;
}

export type DatabaseConfig =
  | DatabaseConfigRenderPages
  | DatabaseConfigRenderTable;

export interface DatabaseConfigBase {
  /**
   * The output directory where the sync will place pages of this database.
   *
   * Example: docs/mydb"
   */
  outDir: string;

  /**
   * Notion API https://developers.notion.com/reference/post-database-query#post-database-query-sort
   */
  sorts?: Sort[];

  /**
   * Configuration options for Notion API page properties
   */
  properties?: {
    /**
     * A whitelist of Notion API page property names to include in the markdown page properties.
     * Use this to select properties for export and control their ordering in rendered tables.
     */
    include?: string[];
  };

  renderAs: "table" | "pages+views";
}

export interface DatabaseConfigRenderTable extends DatabaseConfigBase {
  renderAs: "table";

  entries: {
    /**
     * Controls whether to emit database entries to the index (see SyncConfig.indexPath)
     */
    emitToIndex: boolean;
  };

  
}

export interface DatabaseConfigRenderPages extends DatabaseConfigBase {
  renderAs: "pages+views";
  /**
   * Add custom data to the page frontmatter
   */
  pages: {
    frontmatter: {
      category: {
        /**
         * The Notion API page property that provides an optional sub-category value to use for the markdown page category.
         *
         * Example: "Cluster"
         */
        property: string;
      };
      extra?: Record<string, any>;
    };
  };

  /**
   * Configure "views" to render on the page where the child_database is encountered.
   * This allows to render different subsets of columns, groupings etc. to break down large tables.
   * Most useful as a "limited" replacement of more advanced database views, which are not exposed by Notion API
   * and not supported by markdown.
   *
   * Note:
   * - When views are defined, child database pages are rendered as individual pages.
   *   The first column of the view will link to the individual pages.
   * - When no views are defined, child database pages are rendered as rows in a plain markdown table with all included
   *   properties (see DatabaseConfig.properties.include).
   *
   */
  views: DatabaseView[];
}
export interface DatabaseView {
  title: string;
  properties: {
    groupBy: string;
    include?: string[];
  };
}
