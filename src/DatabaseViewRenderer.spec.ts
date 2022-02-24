import { DatabaseViewRenderer } from "./DatabaseViewRenderer";
import { RenderDatabaseEntryTask } from "./RenderDatabaseEntryTask";

describe("DatabaseViewRenderer", () => {
  test("renders with grouping", async () => {
    const linkRenderer = {};
    const sut = new DatabaseViewRenderer(linkRenderer as any);

    const entries: RenderDatabaseEntryTask[] = [
      {
        properties: {
          meta: { id: "a", title: " A", url: "http://a" },
          properties: new Map([
            ["Name", "A"],
            ["Foo", "Bar"],
          ]),
        },
      },
      {
        properties: {
          meta: { id: "b", title: " B", url: "http://b" },
          properties: new Map([
            ["Name", "B"],
            ["Foo", "Baz"],
          ]),
        },
      },
    ];

    const result = sut.renderViews(entries, {
      entries: { emitToIndex: false },
      renderAs: "table",
      views: [
        {
          title: "By Foo",
          properties: {
            groupBy: "Foo",
          },
        },
      ],
    });

    const expected = `## By Foo - Bar

| Name | Foo |
| ---- | --- |
| A    | Bar |

## By Foo - Baz

| Name | Foo |
| ---- | --- |
| B    | Baz |`;
    expect(result).toEqual(expected);
  });

  test("filters columns", async () => {
    const linkRenderer = {};
    const sut = new DatabaseViewRenderer(linkRenderer as any);

    const entries: RenderDatabaseEntryTask[] = [
      {
        properties: {
          meta: { id: "a", title: " A", url: "http://a" },
          properties: new Map([
            ["Name", "A"],
            ["Foo", "Bar"],
            ["Alice", "Bob"],
          ]),
        },
      },
    ];

    const result = sut.renderViews(entries, {
      entries: { emitToIndex: false },
      renderAs: "table",
      views: [
        {
          title: "By Foo",
          properties: {
            include: ["Name", "Foo"],
          },
        },
      ],
    });

    const expected = `## By Foo

| Name | Foo |
| ---- | --- |
| A    | Bar |`;
    expect(result).toEqual(expected);
  });
});
