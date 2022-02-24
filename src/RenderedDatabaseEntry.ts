import { DatabaseEntryMeta } from './DatabaseEntryMeta';

export interface RenderedDatabaseEntry {
  meta: DatabaseEntryMeta,
  frontmatter?: Record<string, any>;
}
