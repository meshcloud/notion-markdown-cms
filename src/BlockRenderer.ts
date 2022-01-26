import { AssetWriter } from './AssetWriter';
import {
    Block, Emoji, ExternalFile, ExternalFileWithCaption, File, FileWithCaption, ImageBlock
} from './Blocks';
import { DeferredRenderer } from './DeferredRenderer';
import { logger } from './logger';
import { RichTextRenderer } from './RichTextRenderer';

const debug = require("debug")("blocks");

export interface BlockRenderResult {
  lines: string;
  childIndent?: number;
}
export class BlockRenderer {
  constructor(
    private readonly richText: RichTextRenderer,
    private readonly deferredRenderer: DeferredRenderer
  ) {}

  async renderBlock(
    block: Block,
    assets: AssetWriter
  ): Promise<BlockRenderResult> {
    switch (block.type) {
      case "paragraph":
        return {
          lines: await this.richText.renderMarkdown(block.paragraph.text),
        };
      // note: render headings +1 level, because h1 is reserved for page titles
      case "heading_1":
        return {
          lines:
            "## " + (await this.richText.renderMarkdown(block.heading_1.text)),
        };
      case "heading_2":
        return {
          lines:
            "### " + (await this.richText.renderMarkdown(block.heading_2.text)),
        };
      case "heading_3":
        return {
          lines:
            "#### " +
            (await this.richText.renderMarkdown(block.heading_3.text)),
        };
      case "bulleted_list_item":
        return {
          lines:
            "- " +
            (await this.richText.renderMarkdown(block.bulleted_list_item.text)),
          childIndent: 4,
        };
      case "numbered_list_item":
        return {
          lines:
            "1. " +
            (await this.richText.renderMarkdown(block.numbered_list_item.text)),
          childIndent: 4,
        };
      case "to_do":
        return {
          lines:
            "[ ] " + (await this.richText.renderMarkdown(block.to_do.text)),
        };
      case "image":
        return {
          lines: await this.renderImage(block, assets),
        };
      case "quote": {
        // it's legal for a notion block to be cmoposed of multiple lines
        // each of them must be prefixed with "> " to be part of the same quote block
        const content = await this.richText.renderMarkdown(block.quote.text);

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
          `**${this.renderIcon(block.callout.icon)}** ` +
          (await this.richText.renderMarkdown(block.callout.text));

        return {
          lines: this.formatAsQuoteBlock(content),
        };
      }
      case "divider":
        return { lines: "---" };
      case "child_database":
        const msg = `<!-- included database ${block.id} -->\n`;
        const db = await this.deferredRenderer.renderChildDatabase(block.id);
        return { lines: msg + db.markdown };
      case "toggle":
      case "child_page":
      case "embed":
      case "bookmark":
      case "video":
      case "file":
      case "pdf":
      case "audio":
      case "unsupported":
      default:
        return {
          lines: this.renderUnsupported(
            `unsupported block type: ${block.type}`,
            block
          ),
        };
    }
  }

  private renderIcon(icon: File | ExternalFile | Emoji): string {
    switch (icon.type) {
      case "emoji":
        return icon.emoji;
      case "file":
      case "external":
        return this.renderUnsupported(
          `unsupported icon type: ${icon.type}`,
          icon
        );
    }
  }

  async renderImage(block: ImageBlock, assets: AssetWriter): Promise<string> {
    const url = this.parseUrl(block.image);

    const imageFile = await assets.download(url, block.id);

    // todo: caption support
    const markdown = `![image-${block.id}](./${imageFile})`;
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

  private renderUnsupported(msg: string, obj: any): string {
    logger.warn(msg);
    debug(msg + "\n%O", obj);

    return `<!-- ${msg} -->`;
  }
}
