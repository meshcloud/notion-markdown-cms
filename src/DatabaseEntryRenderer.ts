import { Page } from "@notionhq/client/build/src/api-types";

import { PropertiesParser } from "./PropertiesParser";
import { RenderDatabaseEntryTask } from "./RenderDatabaseEntryTask";

export class DatabaseEntryRenderer {
  constructor(private readonly propertiesParser: PropertiesParser) {}

  async renderEntry(
    page: Page
  ): Promise<RenderDatabaseEntryTask> {
    const props = await this.propertiesParser.parsePageProperties(page);

    return {
      id: page.id,
      url: page.url,
      properties: props
    };
  }
}
