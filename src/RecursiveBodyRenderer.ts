import { Client } from "@notionhq/client";
import { Block, Page } from "@notionhq/client/build/src/api-types";

import { AssetWriter } from "./AssetWriter";
import { BlockRenderer } from "./BlockRenderer";

export class RecursiveBodyRenderer {
  constructor(
    readonly publicApi: Client,
    readonly blockRenderer: BlockRenderer
  ) {}

  async renderBody(
    page: Page,
    assets: AssetWriter
  ): Promise<string> {
    const childs = await this.publicApi.blocks.children.list({
      block_id: page.id,
    });

    // todo: paging
    const renderChilds = childs.results.map(
      async (x) => await this.renderBlock(x, "", assets)
    );
    const blocks = await Promise.all(renderChilds);
    const body = blocks.join("\n\n");

    return body;
  }

  async renderBlock(
    block: Block,
    indent: string,
    assets: AssetWriter
  ): Promise<string> {
    const parentBlock = await this.blockRenderer.renderBlock(block, assets);
    const parentLines = this.indent(parentBlock, indent);

    // due to the way the Notion API is built, we need to recurisvely retrieve child
    // blocks, see https://developers.notion.com/reference/retrieve-a-block
    // "If a block contains the key has_children: true, use the Retrieve block children endpoint to get the list of children"
    const children = block.has_children
      ? (await this.publicApi.blocks.children.list({ block_id: block.id }))
          .results
      : [];

    const renderChilds = children.map(
      async (x) => await this.renderBlock(x, indent + "    ", assets)
    );
    const childLines = await Promise.all(renderChilds);

    return [parentLines, ...childLines].join("\n\n");
  }

  private indent(content: string, indent: string) {
    return content
      .split("\n")
      .map((x) => indent + x)
      .join("\n");
  }
}
