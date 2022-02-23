import { DatabasePageMeta } from "./DatabasePageMeta";

export interface DatabasePageProperties {
  /**
   * Meta information about a Notion API page
   */
  meta: DatabasePageMeta;

  /**
   * A mapping of Notion property names -> parsed property values
   */
  properties: Map<string, any>;
}
