import { DatabaseConfig } from "./SyncConfig";
import { RenderDatabasePageTask } from "./RenderDatabasePageTask";
import { RenderDatabaseEntryTask } from "./RenderDatabaseEntryTask";

export interface Database {
  config: DatabaseConfig;
  entries: (RenderDatabaseEntryTask | RenderDatabasePageTask)[];
  markdown: string;
}
