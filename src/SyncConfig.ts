import { Sort } from "@notionhq/client/build/src/api-types";
import { DatabasePageProperties } from "./DatabasePageProperties";

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
   * Configuration options for the rendered pages
   */
   pages: PageConfig;

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
   * Notion API https://developers.notion.com/reference/post-database-query#post-database-query-sort
   */
  sorts?: Sort[];

  renderAs: "table" | "pages+views";
}

export interface DatabaseConfigRenderTable extends DatabaseConfigBase {
  renderAs: "table";

  entries: {
    /**
     * Controls whether to emit database entries to the index of rendered pages/entries
     */
    emitToIndex: boolean;
  };
}

interface PageConfig {
  frontmatterBuilder: (props: DatabasePageProperties) => Record<string, any>;
  destinationPathBuilder: (props: DatabasePageProperties) => string;
  filenameBuilder: (props: DatabasePageProperties) => string;
}

export interface DatabaseConfigRenderPages extends DatabaseConfigBase {
  renderAs: "pages+views";
  
  /**
   * Configuration options for the rendered pages
   */
  pages: PageConfig;

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
