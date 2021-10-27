/**
 * Conventional selection of meta information about a Notion API page.
 * Made availabel as top-level frontmatter on rendered markdown pages
 */
export interface PageMeta extends DatabaseEntryMeta {
  id: string;
  url: string;
  title: string;
  category: string;
  order?: number;
  layout?: string;
}

export interface DatabaseEntryMeta {
  id: string;
  url: string;
  title: string;
}
