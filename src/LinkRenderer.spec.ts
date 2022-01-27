import { LinkRenderer } from './LinkRenderer';
import { RenderDatabasePageTask } from './RenderDatabasePageTask';

describe("LinkRenderer", () => {
  const config = {
    outDir: "out/",
  };

  test("renderPageLink strips outDir from link", async () => {
    const sut = new LinkRenderer(config as any);
    const page: Partial<RenderDatabasePageTask> = {
      id: "id",
      file: "out/test.md",
    };

    const link = sut.renderPageLink("text", page as any);
    expect(link).toEqual("[text](test.md)");
  });
});
