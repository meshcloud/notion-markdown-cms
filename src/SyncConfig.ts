import { Sort } from '@notionhq/client/build/src/api-types';

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

export interface DatabaseConfig {
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
   * Add custom data to the page frontmatter
   */
  additionalPageFrontmatter?: Record<string, any>;

  /**
   * Configuration options for Notion API page properties
   */
  properties: {
    /**
     * The Notion API page property that provides an optional sub-category value to use for the markdown page category.
     *
     * Example: "Cluster"
     */
    category: string;

    /**
     * A whitelist of Notion API page property names to include in the markdown page properties.
     * Use this to select properties for export and control their ordering in rendered tables.
     */
    include?: string[];
  };

  /**
   * 
   */
  views?: DatabaseView[]
}

export interface DatabaseView {
  title: string;
  properties: {
    groupBy: string;
    include?: string[];
  }
}
