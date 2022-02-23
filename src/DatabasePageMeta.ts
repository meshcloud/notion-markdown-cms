import { DatabaseEntryMeta } from './DatabaseEntryMeta';

/**
 * Conventional selection of meta information about a Notion API page.
 * Made availabel as top-level frontmatter on rendered markdown pages
 */
export interface DatabasePageMeta extends DatabaseEntryMeta {
  title: string;
}


