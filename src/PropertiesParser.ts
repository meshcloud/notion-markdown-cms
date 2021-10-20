import { PropertyValueMap } from "@notionhq/client/build/src/api-endpoints";
import { PropertyValue } from "@notionhq/client/build/src/api-types";

import { DatabaseConfig } from "./SyncConfig";
import { logger } from "./logger";
import { PageProperties } from "./PageProperties";
import { RichTextRenderer } from "./RichTextRenderer";
import { slugify } from "./slugify";

const debug = require("debug")("properties");

export class PropertiesParser {
  constructor(private readonly richText: RichTextRenderer) {}

  public parse(properties: PropertyValueMap): PageProperties {
    const result: Record<string, any> = {};

    const nameToKey = new Map<string, string>();

    Object.entries(properties).map(([name, value]) => {
      const slug = slugify(name);
      result[slug] = this.parsePropertyValue(value);
      nameToKey.set(name, slug);
    });

    return { values: result, keys: nameToKey };
  }

  private parsePropertyValue(value: PropertyValue): any {
    const notSupported = "unsupported property type: " + value.type;

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
      case "formula":
      case "rollup":
      case "relation":
      case "people":
      case "files":
      case "checkbox":
        logger.warn(notSupported);
        debug(notSupported + "\n%O", value);
        return notSupported;
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
    }
  }

  public filter(config: DatabaseConfig, input: PageProperties): PageProperties {
    // todo: could cache built filters
    const properties = this.filterProperties(config, input);

    // patch properties by convention
    // vuepress expects a title and category property
    properties["title"] = input.values["name"]; // notion API always calls it name
    properties["category"] = input.values[config.properties.category];

    // vuepress relies on files being called README.md to make "category home" pages
    // however the name "README" does not read nice in a sidebar menu, so we label these pages "Introduction"
    // instead
    if (properties["title"] === "README") {
      properties["title"] = "Introduction";
    }

    const headers = this.filterKeys(config, input);

    return { values: properties, keys: headers };
  }

  private filterProperties(config: DatabaseConfig, input: PageProperties) {
    const propertyFilter = this.buildPropertyFilter(config, input.keys);

    const entries = Object.entries(input.values).filter(([key, value]) =>
      propertyFilter(key)
    );

    const properties = Object.fromEntries(entries);

    return properties;
  }

  private buildPropertyFilter(
    config: DatabaseConfig,
    keys: Map<string, string>
  ) {
    // includes use slug-ified names of properties
    const includes = config.properties.include;

    const propertyFilter: (p: string) => boolean = includes
      ? (p) => !!includes.find((x) => p === keys.get(x))
      : (_) => true;

    return propertyFilter;
  }

  private filterKeys(config: DatabaseConfig, input: PageProperties) {
    const includes = config.properties.include;
    if (!includes) {
      return input.keys;
    }

    // Maps iterate in insertion order, so preserve the correct ordering of keys according to includes ordering
    const filtered = new Map<string, string>();
    includes.forEach((i) => filtered.set(i, input.keys.get(i)!!)); // todo: should probably handle undefined here

    return filtered;
  }
}
