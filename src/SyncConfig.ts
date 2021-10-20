import { Sort } from "@notionhq/client/build/src/api-types";

export interface SyncConfig {
  /**
   * Id of the Notion database containing the CMS content.
   * Traversing the block graph starts here.
   */
  cmsDatabaseId: string;

  /**
   * The output directory where the sync will place pages, e.g. "docs/"
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
   * Name of the parent category to use 
   */
  parentCategory: string;
  /**
   * Notion API https://developers.notion.com/reference/post-database-query#post-database-query-sort
   */
  sorts?: Sort[];
  properties: {
    category: string;
    include?: string[];
  };
}
