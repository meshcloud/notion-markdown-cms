import { DatabasePageMeta } from './DatabasePageMeta';

export interface DatabasePageProperties {
  /**
   * Meta information about a Notion API page
   */
  meta: DatabasePageMeta;

  /**
   * A mapping of property object keys -> property values
   */
  values: Record<string, any>;

  /**
   * A mapping of Notion API property names -> property object keys
   */
  keys: Map<string, string>;
}
