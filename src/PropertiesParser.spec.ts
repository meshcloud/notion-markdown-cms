import { PropertiesParser } from "./PropertiesParser";
import { DatabaseConfig } from "./SyncConfig";

describe("PropertiesParser", () => {
  describe("filter", () => {
    test("preserves all properties and adds conventional with no include filter", async () => {
      const sut = new PropertiesParser({} as any);

      const props = {
        values: { order: 30, category: "Tools", name: "Terraform" },
        keys: new Map([
          ["order", "order"],
          ["Category", "category"],
          ["Name", "name"],
        ]),
      };

      const config: DatabaseConfig = {
        outDir: "db/",
        properties: {
          category: "Category",
        },
      };

      const result = sut.filter(config, props);
      const expected = {
        keys: props.keys,
        values: {
          order: 30,
          category: "Tools",
          name: "Terraform",
          title: "Terraform",
        },
      };

      expect(result).toEqual(expected);
    });

    test("filters according to include filter", async () => {
      const sut = new PropertiesParser({} as any);

      const props = {
        values: { order: 30, category: "Tools", name: "Terraform" },
        keys: new Map([
          ["order", "order"],
          ["Category", "category"],
          ["Name", "name"],
        ]),
      };

      const config: DatabaseConfig = {
        outDir: "db/",
        properties: {
          category: "Category",
          include: ["Name", "Category"],
        },
      };

      const result = sut.filter(config, props);
      const expected = {
        keys: new Map([
          ["Name", "name"],
          ["Category", "category"],
        ]),
        values: {
          category: "Tools",
          name: "Terraform",
          title: "Terraform",
        },
      };

      expect(result).toEqual(expected);
    });
  });
});
