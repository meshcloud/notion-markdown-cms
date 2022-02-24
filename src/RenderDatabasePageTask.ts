import { RenderDatabaseEntryTask } from "./RenderDatabaseEntryTask";

export interface RenderDatabasePageTask extends RenderDatabaseEntryTask {
  file: string;
  frontmatter: Record<string, any>
  render: () => Promise<any>;
}
