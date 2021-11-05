import { DatabaseEntryMeta } from './DatabaseEntryMeta';

export interface RenderedDatabaseEntry {
  meta: DatabaseEntryMeta,
  properties: Record<string, any>;
}
