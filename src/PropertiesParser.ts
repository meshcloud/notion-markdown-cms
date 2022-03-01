import { Page, PropertyValue } from "@notionhq/client/build/src/api-types";

import { DatabasePageProperties } from "./DatabasePageProperties";
import { RenderingContextLogger } from "./RenderingContextLogger";
import { RichTextRenderer } from "./RichTextRenderer";

const debug = require("debug")("properties");

export class PropertiesParser {
  constructor(private readonly richText: RichTextRenderer) {}

  public async parsePageProperties(
    page: Page
  ): Promise<DatabasePageProperties> {
    const { title, properties } = await this.parseProperties(page);

    if (!title) {
      throw this.errorMissingRequiredProperty("of type 'title'", page);
    }

    return {
      meta: {
        id: page.id,
        url: page.url,
        title: title,
      },
      properties,
    };
  }

  private async parseProperties(page: Page) {
    /**
     * Terminology:
     *
     * property: Notion API property name
     * value: Notion API property value
     */

    /**
     * A record of property->value
     */
    const properties: Map<string, any> = new Map();

    let title: string | null = null;
    let titleProperty: string | null = null;

    const context = new RenderingContextLogger(page.url);

    for (const [name, value] of Object.entries(page.properties)) {
      const parsedValue = await this.parsePropertyValue(value, context);
      properties.set(name, parsedValue);

      if (value.type === "title") {
        title = parsedValue;
        titleProperty = name;
      }
    }

    if (!title || !titleProperty) {
      throw this.errorMissingRequiredProperty("of type 'title'", page);
    }

    // no explicit ordering specified, so we make sure to put the title property first
    const keyOrder = [
      titleProperty,
      ...Array.from(properties.keys()).filter((x) => x != titleProperty),
    ];

    // maps preserve insertion order
    const sortedProperties = new Map();
    keyOrder.forEach(x => sortedProperties.set(x, properties.get(x)));

    return {
      title,
      properties: sortedProperties,
    };
  }

  private async parsePropertyValue(
    value: PropertyValue,
    context: RenderingContextLogger
  ): Promise<any> {
    switch (value.type) {
      case "number":
        return value.number;
      case "title":
        return await this.richText.renderPlainText(value.title);
      case "rich_text":
        return await this.richText.renderPlainText(value.rich_text);
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
        context.warn(notSupported);
        debug(notSupported + "\n%O", { context, value });

        return notSupported;
    }
  }

  private errorMissingRequiredProperty(propertyName: string, page: Page) {
    // todo: should this use context?
    const msg = `Page ${page.url} is missing required property ${propertyName}`;
    debug(msg + "\n%O", page);

    return new Error(msg);
  }
}
