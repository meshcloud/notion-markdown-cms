export interface PageMeta {
  id: string;
  url: string;
  title: string;
  category: string;
  order?: number;
}

export interface PageProperties {
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

export interface PagePropertiesWithMeta extends PageProperties {}
