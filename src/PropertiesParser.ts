import { Page, PropertyValue } from '@notionhq/client/build/src/api-types';

import { DatabasePageProperties } from './DatabasePageProperties';
import { logger } from './logger';
import { RichTextRenderer } from './RichTextRenderer';
import { slugify } from './slugify';
import { DatabaseConfig, DatabaseConfigRenderPages } from './SyncConfig';

const debug = require("debug")("properties");

export class PropertiesParser {
  constructor(private readonly richText: RichTextRenderer) { }

  public async parsePageProperties(
    page: Page,
    config: DatabaseConfigRenderPages
  ): Promise<DatabasePageProperties> {
    const {
      title,
      category,
      order,
      properties,
      keys,
    } = await this.parseProperties(page, config);

    if (!title) {
      throw this.errorMissingRequiredProperty("of type 'title'", page);
    }

    const theCategory = category || config.pages.frontmatter.category.static;

    if (!theCategory) {
      throw this.errorMissingRequiredProperty(
        config.pages.frontmatter.category.property || "static category",
        page
      );
    }

    return {
      meta: {
        id: page.id,
        url: page.url,
        title: title, // notion API always calls it name
        category: theCategory,
        order: order,
        ...config.pages.frontmatter.extra,
      },
      values: properties,
      keys: keys,
    };
  }

  public async parseProperties(page: Page, config: DatabaseConfig) {
    /**
     * Design: we always lookup the properties on the page object itself.
     * This way we only parse properties once and avoid any problems coming from
     * e.g. category properties being filtered via include filters.
     */

    /**
     * Terminology: 
     * 
     * property: Notion API property name
     * key: slugified Notion API property name, used to later build frontmatter
     * value: Notion API property value
     */

    /**
     * A record of key->value
     */
    const properties: Record<string, any> = {};
    /**
     * A map of proprety -> key
     */
    const keys = new Map<string, string>();

    let title: string | null = null;
    let titleProperty: string | null = null;
    let category: string | null = null;
    let order: number | undefined = undefined;

    const categoryProperty =
      config.renderAs === "pages+views" &&
      config.pages.frontmatter.category.property;

    for (const [name, value] of Object.entries(page.properties)) {
      const parsedValue = await this.parsePropertyValue(value);

      if (
        !config.properties?.include ||
        config.properties.include.indexOf(name) >= 0
      ) {
        const slug = slugify(name);
        properties[slug] = parsedValue;
        keys.set(name, slug);
      }

      if (value.type === "title") {
        title = parsedValue;
        titleProperty = name;
      }

      if (categoryProperty && name === categoryProperty) {
        category = parsedValue;
      }

      if (name === "order") {
        order = parsedValue;
      }
    }

    if (!titleProperty) {
      throw this.errorMissingRequiredProperty("of type 'title'", page);
    }

    // no explicit ordering specified, so we make sure to put the title property first
    const includes = config.properties?.include
      || [titleProperty, ...Array.from(keys.keys()).filter(x => x != titleProperty)];


    return {
      title,
      category,
      order,
      properties,
      keys: PropertiesParser.filterIncludedKeys(
        keys,
        includes
      ),
    };
  }

  private async parsePropertyValue(value: PropertyValue): Promise<any> {
    switch (value.type) {
      case "number":
        return value.number;
      case "title":
        return await this.richText.renderMarkdown(value.title);
      case "rich_text":
        return await this.richText.renderMarkdown(value.rich_text);
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

  public static filterIncludedKeys(
    keys: Map<string, string>,
    includes: string[] | undefined,
  ): Map<string, string> {
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
