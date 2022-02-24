import { RenderDatabaseEntryTask } from "./RenderDatabaseEntryTask";

export interface RenderDatabasePageTask extends RenderDatabaseEntryTask {
  file: string;
  render: () => Promise<any>;
}
