import { Page } from "@notionhq/client/build/src/api-types";
import { DatabaseConfigRenderTable } from ".";

import { PropertiesParser } from "./PropertiesParser";
import { RenderDatabaseEntryTask } from "./RenderDatabaseEntryTask";

export class DatabaseEntryRenderer {
  constructor(private readonly propertiesParser: PropertiesParser) {}

  async renderEntry(
    page: Page,
    config: DatabaseConfigRenderTable
  ): Promise<RenderDatabaseEntryTask> {
    const props = await this.propertiesParser.parsePageProperties(page);
    const frontmatterProperties = config.entries?.frontmatterBuilder(props);

    return {
      properties: props,
      frontmatter: frontmatterProperties,
    };
  }
}
