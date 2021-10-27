import { Page } from "@notionhq/client/build/src/api-types";

import { PropertiesParser } from "./PropertiesParser";
import { RenderDatabaseEntryTask } from "./RenderDatabaseEntryTask";
import { DatabaseConfig } from "./SyncConfig";

export class DatabaseEntryRenderer {
  constructor(private readonly propertiesParser: PropertiesParser) {}

  async renderEntry(
    page: Page,
    config: DatabaseConfig
  ): Promise<RenderDatabaseEntryTask> {
    const props = await this.propertiesParser.parseProperties(page, config);

    return {
      id: page.id,
      properties: {
        keys: props.keys,
        values: props.properties,
      },
    };
  }
}
