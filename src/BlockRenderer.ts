import { RichText } from '@notionhq/client/build/src/api-types';

import { AssetWriter } from './AssetWriter';
import {
    Block, Emoji, ExternalFile, ExternalFileWithCaption, File, FileWithCaption, ImageBlock
} from './Blocks';
import { DeferredRenderer } from './DeferredRenderer';
import { RenderingLoggingContext } from './logger';
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
    assets: AssetWriter,
    context: RenderingLoggingContext
  ): Promise<BlockRenderResult> {
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
          lines: await this.renderImage(block, assets, context),
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
          `**${this.renderIcon(block.callout.icon, context)}** ` +
          (await renderMarkdown(block.callout.text));

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
            block,
            context
          ),
        };
    }
  }

  private renderIcon(
    icon: File | ExternalFile | Emoji,
    context: RenderingLoggingContext
  ): string {
    switch (icon.type) {
      case "emoji":
        return icon.emoji;
      case "file":
      case "external":
        return this.renderUnsupported(
          `unsupported icon type: ${icon.type}`,
          icon,
          context
        );
    }
  }

  async renderImage(
    block: ImageBlock,
    assets: AssetWriter,
    context: RenderingLoggingContext
  ): Promise<string> {
    const url = this.parseUrl(block.image);

    const imageFile = await assets.download(url, block.id, context);

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

  private renderUnsupported(
    msg: string,
    obj: any,
    context: RenderingLoggingContext
  ): string {
    context.warn(msg);
    debug(msg + "\n%O", obj);

    return `<!-- ${msg} -->`;
  }
}
