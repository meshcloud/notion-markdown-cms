import {
  Block as PublicBlock,
  BlockBase,
  Emoji,
  File,
  ExternalFile,
  ExternalFileWithCaption,
  FileWithCaption,
  ImageBlock,
  RichText,
} from "@notionhq/client/build/src/api-types";

import * as markdownTable from "./markdown-table";
import { AssetWriter } from "./AssetWriter";
import { Database } from "./Database";
import { DeferredRenderer } from "./DeferredRenderer";
import { RichTextRenderer } from "./RichTextRenderer";
import { logger } from "./logger";
import { LinkRenderer } from "./LinkRenderer";

const debug = require("debug")("blocks");

export interface CodeBlock extends BlockBase {
  type: "code";
  code: {
    text: RichText[];
    language: string;
  };
}

export interface QuoteBlock extends BlockBase {
  type: "quote";
  code: {
    text: RichText[];
    language: string;
  };
}

export interface CalloutBlock extends BlockBase {
  type: "callout";
  callout: {
    text: RichText[];
    icon: File | ExternalFile | Emoji;
  };
}

export interface DividerBlock extends BlockBase {
  type: "divider";
}

export interface ChildDatabaseBlock extends BlockBase {
  type: "child_database";
}

// these are blocks that the notion API client code does not have proper typings for
// for unknown reasons they removed types alltogether in v0.4 of the client
// https://github.com/makenotion/notion-sdk-js/pulls?q=is%3Apr+is%3Aclosed#issuecomment-927781781
export type Block =
  | PublicBlock
  | CodeBlock
  | QuoteBlock
  | CalloutBlock
  | DividerBlock
  | ChildDatabaseBlock;

export class BlockRenderer {
  constructor(
    private readonly deferredRenderer: DeferredRenderer,
    private readonly richText: RichTextRenderer,
    private readonly linkRenderer: LinkRenderer
  ) {}

  async renderBlock(block: Block, assets: AssetWriter): Promise<string> {
    switch (block.type) {
      case "paragraph":
        return await this.richText.renderMarkdown(block.paragraph.text);
      case "heading_1":
        return "# " + await this.richText.renderMarkdown(block.heading_1.text);
      case "heading_2":
        return "## " + await this.richText.renderMarkdown(block.heading_2.text);
      case "heading_3":
        return "### " + await this.richText.renderMarkdown(block.heading_3.text);
      case "bulleted_list_item":
        return (
          "- " + await this.richText.renderMarkdown(block.bulleted_list_item.text)
        );
      case "numbered_list_item":
        return (
          "1. " + await this.richText.renderMarkdown(block.numbered_list_item.text)
        );
      case "to_do":
        return "[ ] " + await this.richText.renderMarkdown(block.to_do.text);
      case "image":
        return await this.renderImage(block, assets);
      case "quote":
        block as any;
        return "> " + await this.richText.renderMarkdown((block as any).quote.text);
      case "code":
        return (
          "```" +
          block.code.language +
          "\n" +
          await this.richText.renderMarkdown(block.code.text) +
          "\n```"
        );
      case "callout":
        return (
          "> " +
          this.renderIcon(block.callout.icon) +
          " " +
          await this.richText.renderMarkdown(block.callout.text)
        );
      case "divider":
        return "---";
      case "child_database":
        // queue all pages in the database for individual, deferred rendering
        const db = await this.deferredRenderer.renderDatabasePages(block.id);
        const msg = `<!-- included database ${block.id} -->\n`;

        if (db.config.skipMarkdownTable) {
          return msg;
        }

        // todo: make this nicer, e.g. render multi tables
        return msg + this.renderTables(db);

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
        return this.renderUnsupported(
          `unsupported block type: ${block.type}`,
          block
        );
    }
  }

  renderTables(db: Database) {
    // todo: handle empty page
    const props = db.pages[0].properties;

    const table: any[][] = [];

    const headers = Array.from(props.keys.keys());
    table[0] = headers;

    const cols = Array.from(props.keys.values());
    db.pages.forEach((r) =>
      table.push(
        cols.map((c, i) => {
          const content = escapeTableCell(r.properties.values[c]);
          return i == 0
            ? this.linkRenderer.renderPageLink(content, r) // make the first cell a relative link to the page
            : content;
        })
      )
    );

    return markdownTable.markdownTable(table);
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

  private renderUnsupported(msg: string, obj: any): string {
    logger.warn(msg);
    debug(msg + "\n%O", obj);

    return `<!-- ${msg} -->`;
  }
}

function escapeTableCell(content: string | number | any): string {
  // markdown table cells do not support newlines, however we can insert <br> elements instead
  if (typeof content === "string") {
    return content.replace(/\n/g, "<br>");
  }

  return content.toString();
}
