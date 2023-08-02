import { RichText } from "@notionhq/client/build/src/api-types";

import { AssetWriter } from "./AssetWriter";
import {
  Block,
  Emoji,
  ExternalFile,
  ExternalFileWithCaption,
  File,
  FileWithCaption,
  ImageBlock,
} from "./Blocks";
import { DeferredRenderer } from "./DeferredRenderer";
import { RenderingContextLogger } from "./RenderingContextLogger";
import { RichTextRenderer } from "./RichTextRenderer";
import { RenderingContext } from "./RenderingContext";
import { LinkRenderer } from "./LinkRenderer";

const debug = require("debug")("blocks");

export interface BlockRenderResult {
  lines: string;
  childIndent?: number;
}
export class BlockRenderer {
  constructor(
    private readonly richText: RichTextRenderer,
    private readonly deferredRenderer: DeferredRenderer,
    private readonly link: LinkRenderer
  ) {}

  async renderBlock(
    block: Block,
    context: RenderingContext
  ): Promise<BlockRenderResult | null> {
    const renderMarkdown = async (text: RichText[]) => {
      return await this.richText.renderMarkdown(text, context);
    };

    switch (block.type) {
      case "paragraph":
        return {
          lines: await renderMarkdown(block.paragraph.text),
        };
      // note: render headings +1 level, because h1 is reserved for page titles
      case "heading_1":
        return {
          lines: "## " + (await renderMarkdown(block.heading_1.text)),
        };
      case "heading_2":
        return {
          lines: "### " + (await renderMarkdown(block.heading_2.text)),
        };
      case "heading_3":
        return {
          lines: "#### " + (await renderMarkdown(block.heading_3.text)),
        };
      case "bulleted_list_item":
        return {
          lines: "- " + (await renderMarkdown(block.bulleted_list_item.text)),
          childIndent: 4,
        };
      case "numbered_list_item":
        return {
          lines: "1. " + (await renderMarkdown(block.numbered_list_item.text)),
          childIndent: 4,
        };
      case "to_do":
        return {
          lines: "[ ] " + (await renderMarkdown(block.to_do.text)),
        };
      case "image":
        return {
          lines: await this.renderImage(block, context.assetWriter),
        };
      case "quote": {
        // it's legal for a notion block to be cmoposed of multiple lines
        // each of them must be prefixed with "> " to be part of the same quote block
        const content = await renderMarkdown(block.quote.text);

        return { lines: this.formatAsQuoteBlock(content) };
      }
      case "code": {
        const code = await this.richText.renderPlainText(block.code.text);
        if (code.startsWith("<!--notion-markdown-cms:raw-->")) {
          return { lines: code };
        }

        return {
          lines: "```" + block.code.language + "\n" + code + "\n```",
        };
      }
      case "callout": {
        // render emoji as bold, this enables css to target it as `blockquote > strong:first-child`
        const content =
          `**${this.renderIcon(block.callout.icon, context.logger)}** ` +
          (await renderMarkdown(block.callout.text));

        return {
          lines: this.formatAsQuoteBlock(content),
        };
      }
      case "divider":
        return { lines: "---" };
      case "child_database":
        const msg = `<!-- included database ${block.id} -->\n`;
        const db = await this.deferredRenderer.renderChildDatabase(
          block.id,
          context.linkResolver
        );
        return { lines: msg + db.markdown };
      case "synced_block":
        // nothing to render, only the contents of the synced block are relevant
        // however, these are children nöpcl, and thus retrieved by recursion in RecusivveBodyRenderer
        return null;
      case "bookmark":
        // render caption (if provided) as a link name
        const caption = block.bookmark.caption || [];
        let title = block.bookmark.url;
        if (caption.length > 0)
          title = await this.richText.renderPlainText(caption);
        return {
          lines: this.link.renderUrlLink(title, block.bookmark.url),
        };
      case "toggle":
      case "child_page":
      case "embed":
      case "video":
      case "file":
      case "pdf":
      case "audio":
      case "unsupported":
      default:
        return {
          lines: this.renderUnsupported(
            `unsupported block type: ${block.type}`,
            block,
            context.logger
          ),
        };
    }
  }

  private renderIcon(
    icon: File | ExternalFile | Emoji,
    logger: RenderingContextLogger
  ): string {
    switch (icon.type) {
      case "emoji":
        return icon.emoji;
      case "file":
      case "external":
        return this.renderUnsupported(
          `unsupported icon type: ${icon.type}`,
          icon,
          logger
        );
    }
  }

  async renderImage(block: ImageBlock, assets: AssetWriter): Promise<string> {
    const url = this.parseUrl(block.image);

    const imageFile = await assets.download(url, block.id);

    // todo: caption support
    const blockCaption = block.image.caption || [];
    const caption =
      blockCaption.length > 0
        ? blockCaption[0].plain_text
        : `image-${block.id}`;
    const markdown = `![${caption}](./${imageFile})`;
    return markdown;
  }

  private parseUrl(image: FileWithCaption | ExternalFileWithCaption) {
    switch (image.type) {
      case "external":
        return image.external.url;
      case "file":
        return image.file.url;
    }
  }

  private formatAsQuoteBlock(content: string) {
    return content
      .split("\n")
      .map((x) => "> " + x)
      .join("\n");
  }

  private renderUnsupported(
    msg: string,
    obj: any,
    context: RenderingContextLogger
  ): string {
    context.warn(msg);
    debug(msg + "\n%O", obj);

    return `<!-- ${msg} -->`;
  }
}
