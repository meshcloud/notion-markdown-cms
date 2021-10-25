import { DatabaseConfig } from "./SyncConfig";
import { RenderPageTask } from "./RenderPageTask";

export interface Database {
  config: DatabaseConfig;
  pages: RenderPageTask[];
}
