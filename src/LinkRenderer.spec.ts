import { LinkRenderer } from './LinkRenderer';
import { PageLinkResolver } from './PageLinkResolver';
import { RenderDatabasePageTask } from './RenderDatabasePageTask';

describe("LinkRenderer", () => {
  
  test("renderPageLink strips outDir from link", async () => {
    const resolver = new PageLinkResolver("out");
    const sut = new LinkRenderer();
    const page: Partial<RenderDatabasePageTask> = {
      file: "out/test.md",
    };

    const link = sut.renderPageLink("text", page as any, resolver);
    expect(link).toEqual("[text](./test.md)");
  });
});
