import { Block, Page } from '@notionhq/client/build/src/api-types';

import { BlockRenderer } from './BlockRenderer';
import { NotionApiFacade } from './NotionApiFacade';
import { RenderingContext } from './RenderingContext';

const debug = require("debug")("body");

export class RecursiveBodyRenderer {
  constructor(
    readonly publicApi: NotionApiFacade,
    readonly blockRenderer: BlockRenderer
  ) {}

  async renderBody(
    page: Page,
    context: RenderingContext
  ): Promise<string> {
    debug("begin rendering body of page " + page.id, page.properties);

    const childs = await this.publicApi.listBlockChildren(page.id);

    // todo: paging
    const renderChilds = childs.results.map(
      async (x) => await this.renderBlock(x, "", context)
    );
    const blocks = await Promise.all(renderChilds);
    const body = blocks.join("\n\n");

    debug("completed rendering body of page " + page.id);

    return body;
  }

  async renderBlock(
    block: Block,
    indent: string,
    context: RenderingContext
  ): Promise<string> {
    const parentBlock = await this.blockRenderer.renderBlock(
      block,
      context
    );
    const parentLines = parentBlock && this.indent(parentBlock.lines, indent);

    // due to the way the Notion API is built, we need to recurisvely retrieve child
    // blocks, see https://developers.notion.com/reference/retrieve-a-block
    // "If a block contains the key has_children: true, use the Retrieve block children endpoint to get the list of children"
    const children = block.has_children
      ? (await this.publicApi.listBlockChildren(block.id)).results
      : [];

    const childIndent = indent + " ".repeat(parentBlock?.childIndent || 0);
    const renderChilds = children.map(
      async (x) => await this.renderBlock(x, childIndent, context)
    );
    const childLines = await Promise.all(renderChilds);

    return [parentLines, ...childLines].filter((x) => !!x).join("\n\n");
  }

  private indent(content: string, indent: string) {
    return content
      .split("\n")
      .map((x) => indent + x)
      .join("\n");
  }
}
