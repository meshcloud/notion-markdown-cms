import { LinkRenderer } from './LinkRenderer';
import { RenderDatabasePageTask } from './RenderDatabasePageTask';

describe("LinkRenderer", () => {
  test("renderPageLink strips outDir from link", async () => {
    const sut = new LinkRenderer();
    const page: Partial<RenderDatabasePageTask> = {
      file: "out/test.md",
    };

    const link = sut.renderPageLink("text", page as any);
    expect(link).toEqual("[text](/out/test.md)");
  });
});
