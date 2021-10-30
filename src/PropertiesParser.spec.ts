import { Page } from '@notionhq/client/build/src/api-types';

import { PropertiesParser } from './PropertiesParser';
import { RichTextRenderer } from './RichTextRenderer';
import { DatabaseConfig } from './SyncConfig';

const page: Partial<Page> = {
  id: "123",
  url: "http://example.com/123",
  properties: {
    order: { id: "a", type: "number", number: 30 },
    Category: { id: "b", type: "select", select: { name: "Tools" } },
    Name: {
      id: "c",
      type: "title",
      title: [
        {
          type: "text",
          text: { content: "Terraform" },
          plain_text: "Terraform",
          annotations: {
            bold: false,
            code: false,
            color: "default",
            italic: false,
            strikethrough: false,
            underline: false,
          },
        },
      ],
    },
  },
};

describe("PropertiesParser", () => {
  describe("parse", () => {

    test("preserves all properties and adds conventional with no include filter", async () => {
      const sut = new PropertiesParser(new RichTextRenderer({} as any, {} as any));

      const config: DatabaseConfig = {
        outDir: "db/",
        renderAs: 'table',
        entries: {
          emitToIndex: false
        }
      };

      const result = await sut.parseProperties(page as any, config);

      const expected = {
        category: null,
        order: 30,
        title: "Terraform",
        keys: new Map([
          ["order", "order"],
          ["Category", "category"],
          ["Name", "name"],
        ]),
        properties: {
          order: 30,
          category: "Tools",
          name: "Terraform",
        },
      };
      expect(result).toEqual(expected);
    });

    test("filters according to include filter", async () => {
      const sut = new PropertiesParser(new RichTextRenderer({} as any, {} as any));

      const config: DatabaseConfig = {
        outDir: "db/",
        renderAs: "table",
        properties: {
          include: ["Name", "Category"],
        },
        entries: {
          emitToIndex: false
        }
      };

      const result = await sut.parseProperties(page as any, config);
      
      const expected = {
        category: null,
        order: 30,
        title: "Terraform",
        keys: new Map([
          ["Category", "category"],
          ["Name", "name"],
        ]),
        properties: {
          category: "Tools",
          name: "Terraform",
        },
      };
      expect(result).toEqual(expected);
    });
  });
});
