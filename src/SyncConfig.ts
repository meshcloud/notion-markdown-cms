import { Sort } from "@notionhq/client/build/src/api-types";

export interface SyncConfig {
  /**
   * Id of the Notion database containing the CMS content.
   * Traversing the block graph starts here.
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
   * Example: "docs/mydb/"
   */
  outDir: string;

  /**
   * The prefix to apply to the category value of all pages.
   * This is useful to create a unique category name for all pages of this database.
   * 
   * Example: "mydb/"
   */
  pageCategoryValuePrefix: string;

  /**
   * Notion API https://developers.notion.com/reference/post-database-query#post-database-query-sort
   */
  sorts?: Sort[];

  /**
   * Configuration options for Notion API page properties
   */
  properties: {
    /**
     * The Notion API page property that provides the value to use for the markdown page category.
     * This will be prefixed by DatabaseConfig.pageCategoryValuePrefix
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
}
