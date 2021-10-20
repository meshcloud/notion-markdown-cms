import { DatabaseConfig } from "./SyncConfig";
import { RenderPageTask } from "./RenderedPageTask";

export interface Database {
  config: DatabaseConfig;
  pages: RenderPageTask[];
}
