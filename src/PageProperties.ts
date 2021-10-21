import { PageMeta } from "./PageMeta";

export interface PageProperties {
  /**
   * Meta information about a Notion API page
   */
  meta: PageMeta;

  /**
   * A mapping of property object keys -> property values
   */
  values: Record<string, any>;

  /**
   * A mapping of Notion API property names -> property object keys
   */
  keys: Map<string, string>;
}
 
