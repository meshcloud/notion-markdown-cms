import { DatabaseEntryMeta } from './DatabaseEntryMeta';

export interface RenderedDatabaseEntry {
  meta: DatabaseEntryMeta,
  properties: Map<string, any>;
}
