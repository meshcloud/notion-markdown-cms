import { Page, PropertyValue } from "@notionhq/client/build/src/api-types";

import { DatabaseConfig } from "./SyncConfig";
import { logger } from "./logger";
import { PageProperties } from "./PageProperties";
import { RichTextRenderer } from "./RichTextRenderer";
import { slugify } from "./slugify";

const debug = require("debug")("properties");

export class PropertiesParser {
  constructor(private readonly richText: RichTextRenderer) {}

  public parse(page: Page, config: DatabaseConfig): PageProperties {
    const properties: Record<string, any> = {};
    const keys = new Map<string, string>();

    let title: string | null = null;
    let category: string | null = null;
    let order: number | undefined = undefined;

    Object.entries(page.properties).forEach(([name, value]) => {
      const parsedValue = this.parsePropertyValue(value);

      if (
        !config.properties.include ||
        config.properties.include.indexOf(name) >= 0
      ) {
        const slug = slugify(name);
        properties[slug] = parsedValue;
        keys.set(name, slug);
      }

      if (value.type === "title") {
        title = parsedValue;
      }

      if (name === config.properties.category) {
        category = parsedValue;
      }

      if (name === "order") {
        order = parsedValue;
      }
    });

    if (!title) {
      throw this.errorMissingRequiredProperty("of type 'title'", page);
    }

    if (!category) {
      throw this.errorMissingRequiredProperty(config.properties.category, page);
    }

    return {
      meta: {
        id: page.id,
        url: page.url,
        title: title, // notion API always calls it name
        category: category,
        order: order,
      },
      values: properties,
      keys: this.sortKeys(config, keys),
    };
  }

  private parsePropertyValue(value: PropertyValue): any {
    switch (value.type) {
      case "number":
        return value.number;
      case "title":
        return this.richText.renderMarkdown(value.title);
      case "rich_text":
        return this.richText.renderMarkdown(value.rich_text);
      case "select":
        return value.select?.name;
      case "multi_select":
        return value.multi_select.map((x) => x.name);
      case "date":
        return value.date;
      case "relation":
        return value.relation.map((x) => x.id);
      case "url":
        return value.url;
      case "email":
        return value.email;
      case "phone_number":
        return value.phone_number;
      case "created_time":
        return value.created_time;
      case "created_by":
        return value.created_by.name;
      case "last_edited_time":
        return value.last_edited_time;
      case "last_edited_by":
        return value.last_edited_by.name;
      case "formula":
      case "rollup":
      case "people":
      case "files":
      case "checkbox":
        const notSupported = "unsupported property type: " + value.type;
        logger.warn(notSupported);
        debug(notSupported + "\n%O", value);

        return notSupported;
    }
  }

  private sortKeys(config: DatabaseConfig, keys: Map<string, string>) {
    const includes = config.properties.include;
    if (!includes) {
      return keys;
    }

    // Maps iterate in insertion order, so preserve the correct ordering of keys according to includes ordering
    const filtered = new Map<string, string>();
    includes.forEach((i) => filtered.set(i, keys.get(i)!!)); // todo: should probably handle undefined here

    return filtered;
  }

  private errorMissingRequiredProperty(propertyName: string, page: Page) {
    const msg = `Page ${page.url} is missing required property ${propertyName}`;
    debug(msg + "\n%O", page);

    return new Error(msg);
  }
}
