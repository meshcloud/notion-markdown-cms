import { DatabasePageMeta } from './DatabasePageMeta';
import { RenderedDatabaseEntry } from './RenderedDatabaseEntry';

export interface RenderedDatabasePage extends RenderedDatabaseEntry {
  meta: DatabasePageMeta;
  file: string;
}
