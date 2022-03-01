import { Annotations, RichText } from '@notionhq/client/build/src/api-types';
import { RenderingContext } from './RenderingContext';

import { RichTextRenderer } from './RichTextRenderer';

function annotations(x: Partial<Annotations>): Annotations {
  return {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
    color: "default",
    ...x,
  };
}

const context = new RenderingContext("", "");

describe("RichTextRenderer", () => {
  let sut: RichTextRenderer;
  let linkRenderer: typeof jest;
  let mentionedPageRenderer: typeof jest;

  beforeEach(() => {
    mentionedPageRenderer = jest.mock("./MentionedPageRenderer");
    linkRenderer = jest.mock("./LinkRenderer");
    sut = new RichTextRenderer(
      mentionedPageRenderer as any,
      linkRenderer as any
    );
  });

  describe("whitespace handling", () => {
    /**
     * When translating rich text to markdown, whitespace needs to be handled carefully.
     * A trivial translation of rich text ranges to markdown fails:
     *
     * **Hello **World -> illegal markdown
     * ** Hello** World -> illegal markdown
     *
     * The following representations are legal markdown:
     * **Hello**World -> ok (source text has no whitespace between hello and world)
     * **Hello** World -> ok (source text has whitespace between hello and wolrd)
     */

    test("handles trailing whitespace within annotations", async () => {
      const text: RichText[] = [
        {
          type: "text",
          plain_text: "Hello ",
          text: {
            content: "Hello ",
          },
          annotations: annotations({ bold: true }),
        },
        {
          type: "text",
          plain_text: "World.",
          text: {
            content: "World.",
          },
          annotations: annotations({}),
        },
      ];

      const result = await sut.renderMarkdown(text, context);

      expect(result).toEqual("**Hello** World.");
    });

    test("handles leading whitespace within annotations", async () => {
      const text: RichText[] = [
        {
          type: "text",
          plain_text: "Hello",
          text: {
            content: "Hello",
          },
          annotations: annotations({}),
        },
        {
          type: "text",
          plain_text: " World.",
          text: {
            content: " World.",
          },
          annotations: annotations({ bold: true }),
        },
      ];

      const result = await sut.renderMarkdown(text, context);

      expect(result).toEqual("Hello **World.**");
    });

    test("handles complex markdown", async () => {
      const text: RichText[] = [
        {
          type: "text",
          plain_text: " Hello ",
          text: {
            content: " Hello ",
          },
          annotations: annotations({ bold: true, italic: true }),
        },
        {
          type: "text",
          plain_text: "World",
          text: {
            content: "World.",
          },
          annotations: annotations({ bold: true }),
        },
      ];

      const result = await sut.renderMarkdown(text, context);

      expect(result).toEqual(" ***Hello*** **World.**");
    });

    test("handles multiline", async () => {
      const text: RichText[] = [
        {
          type: "text",
          plain_text: "Hello \n",
          text: {
            content: "Hello \n",
          },
          annotations: annotations({ bold: true }),
        },
        {
          type: "text",
          plain_text: "\tWorld\n",
          text: {
            content: "\tWorld\n",
          },
          annotations: annotations({}),
        },
      ];

      const result = await sut.renderMarkdown(text, context);

      expect(result).toEqual("**Hello** \n\tWorld\n");
    });

    test("handles annotated whitespace", async () => {
      const text: RichText[] = [
        {
          type: "text",
          plain_text: "Hello",
          text: {
            content: "Hello",
          },
          annotations: annotations({}),
        },
        {
          type: "text",
          plain_text: " ",
          text: {
            content: " ",
          },
          annotations: annotations({ bold: true, italic: true }),
        },
        {
          type: "text",
          plain_text: "World",
          text: {
            content: "World",
          },
          annotations: annotations({}),
        },
      ];

      const result = await sut.renderMarkdown(text, context);

      expect(result).toEqual("Hello World");
    });
  });
});
