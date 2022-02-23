import { Page } from "@notionhq/client/build/src/api-types";
import { DatabasePageProperties } from "./DatabasePageProperties";

import { PropertiesParser } from "./PropertiesParser";
import { RichTextRenderer } from "./RichTextRenderer";

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
  describe("parsePageProperties", () => {
    test("preserves all properties and adds conventional sort with title coming first", async () => {
      const sut = new PropertiesParser(
        new RichTextRenderer({} as any, {} as any)
      );

      const result = await sut.parsePageProperties(page as any);

      const expected: DatabasePageProperties = {
        meta: {
          id: page.id!!,
          url: page.url!!,
          title: "Terraform",
        },
        properties: new Map<string, any>([
          ["Name", "Terraform"],
          ["order", 30],
          ["Category", "Tools"],
        ]),
      };

      expect(result).toEqual(expected);
      // explicitly test key ordering
      expect(Array.from(result.properties.keys())).toEqual([
        "Name",
        "order",
        "Category",
      ]);
    });
  });
});
