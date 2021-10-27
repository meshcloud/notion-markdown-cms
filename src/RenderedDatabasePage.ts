import { PageMeta } from "./PageMeta";
import { RenderedDatabaseEntry } from "./RenderedDatabaseEntry";


export interface RenderedDatabasePage extends RenderedDatabaseEntry {
  meta: PageMeta;
  file: string;
}
