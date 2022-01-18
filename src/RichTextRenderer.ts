import { RichText } from '@notionhq/client/build/src/api-types';

import { LinkRenderer } from './LinkRenderer';
import { logger } from './logger';
import { MentionedPageRenderer } from './MentionedPageRenderer';
import { RenderDatabasePageTask } from './RenderDatabasePageTask';

const debug = require("debug")("richtext");

export class RichTextRenderer {
  constructor(
    private readonly mentionedPageRenderer: MentionedPageRenderer,
    private readonly linkRenderer: LinkRenderer
  ) {}

  public async renderPlainText(text: RichText[]): Promise<string> {
    return text.map((rt) => rt.plain_text).join(" ");
  }
  
  public async renderMarkdown(text: RichText[]): Promise<string> {
    const result: string[] = [];

    for (const rt of text) {
      const code = await this.renderMarkdownCode(rt);
      result.push(code);
    }

    return result.join(" ");
  }

  private async renderMarkdownCode(rt: RichText) {
    const mod = this.modifier(rt);

    switch (rt.type) {
      case "equation":
        return this.renderUnsupported(
          `unsupported rich text type: ${rt.type}`,
          rt
        );
      case "mention":
        switch (rt.mention.type) {
          case "page":
            const page = await this.resolveMentionedPage(rt.mention.page.id);
            if (!page) {
              // when we cannot resolve a page link, that usually means
              // - the page has been deleted/archived and notion's API is not consistently reflecting that
              // - the API use does not have access to the linked page (e.g. it sits somewhere else in the workspace)
              // In either the case, the plain_text is not a good fallback in this case as it's typically just"Untitled"
              // So instead we just render a note to the markdown
              return this.renderUnsupported(
                "could not resolve mentioned page " + rt.mention.page.id,
                rt
              );
            }

            const text = this.wrap(mod, page.properties.meta.title);
            return this.linkRenderer.renderPageLink(text, page);
          case "database":
          case "date":
          case "user":
            return this.renderUnsupported(
              `unsupported rich text mention type: ${rt.mention.type}`,
              rt
            );
        }
      // todo: support for mentions is probably useful, for cross-page links?
      case "text":
        // TODO move to above switch statement after upgrading notion client to newest version
        // switch(rt.mention.type) case: "link_preview" not supported, because types are outdated in @notionhq/client v0.3.x
        if (rt.text === undefined && rt.href !== undefined) {
          const link_text = this.wrap(mod, rt.plain_text)
          return this.linkRenderer.renderUrlLink(link_text, rt.href)
        } else {
          const text = this.wrap(mod, rt.text.content);
          return rt.text.link
            ? this.linkRenderer.renderUrlLink(text, rt.text.link.url)
            : text;
        }
    }
  }

  private modifier(rt: RichText) {
    let mod = "";

    if (rt.annotations.bold) {
      mod += "**";
    }
    if (rt.annotations.italic) {
      mod += "*";
    }

    if (rt.annotations.strikethrough) {
      mod += "~~";
    }

    if (rt.annotations.code) {
      mod += "`";
    }

    if (rt.annotations.underline) {
      // not supported atm.
    }

    return mod;
  }

  private async resolveMentionedPage(
    id: string
  ): Promise<RenderDatabasePageTask | null> {
    return await this.mentionedPageRenderer.renderPage(id);
  }

  private wrap(modifier: string, content: string) {
    const reversedMod = [...modifier].reverse().join("");

    return `${modifier}${content.trim()}${reversedMod}`;
  }

  private renderUnsupported(msg: string, obj: any): string {
    logger.warn(msg);
    debug(msg + "\n%O", obj);

    return `<!-- ${msg} -->`;
  }
}
