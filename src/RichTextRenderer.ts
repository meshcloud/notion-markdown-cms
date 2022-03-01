import { RichText } from "@notionhq/client/build/src/api-types";

import { LinkRenderer } from "./LinkRenderer";
import { RenderingContextLogger } from "./RenderingContextLogger";
import { MentionedPageRenderer } from "./MentionedPageRenderer";
import { RenderingContext } from "./RenderingContext";

const debug = require("debug")("richtext");

const trimWhitespaceRegex = /^(\s*)([\s\S]*?)(\s*)$/;

export class RichTextRenderer {
  constructor(
    private readonly mentionedPageRenderer: MentionedPageRenderer,
    private readonly linkRenderer: LinkRenderer
  ) {}

  public async renderPlainText(text: RichText[]): Promise<string> {
    return text.map((rt) => rt.plain_text).join(" ");
  }

  public async renderMarkdown(
    text: RichText[],
    context: RenderingContext
  ): Promise<string> {
    const result: string[] = [];

    for (const rt of text) {
      const code = await this.renderMarkdownCode(rt, context);
      // do not push empty code, this can happen e.g.
      result.push(code);
    }

    return result.join("");
  }

  private async renderMarkdownCode(
    rt: RichText,
    context: RenderingContext
  ) {
    const mod = this.modifier(rt);

    switch (rt.type) {
      case "equation":
        return this.renderUnsupported(
          `unsupported rich text type: ${rt.type}`,
          rt,
          context.logger
        );
      case "mention":
        switch (rt.mention.type) {
          case "page":
            const page = await this.mentionedPageRenderer.renderPage(
              rt.mention.page.id,
              rt.plain_text
            );
            const text = this.wrap(mod, page.properties.meta.title);
            return this.linkRenderer.renderPageLink(text, page, context.linkResolver);
          case "database":
          case "date":
          case "user":
            return this.renderUnsupported(
              `unsupported rich text mention type: ${rt.mention.type}`,
              rt,
              context.logger
            );
        }
      case "text":
        // TODO move to above switch statement after upgrading notion client to newest version
        // switch(rt.mention.type) case: "link_preview" not supported, because types are outdated in @notionhq/client v0.3.x
        if (rt.text === undefined && rt.href !== undefined) {
          const link_text = this.wrap(mod, rt.plain_text);
          return this.linkRenderer.renderUrlLink(link_text, rt.href);
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

  private wrap(modifier: string, content: string) {
    /**
     * Markdown requires annotated ranges to be trimmed (not starting or ending on whitespace).
     *
     * Since notion's rich text allows annotating ranges that include whitespace at the beginning and end,
     * translating them to markdown requires us to move whitespace "outside" of the modifier.
     */
    const reversedMod = [...modifier].reverse().join("");

    const matchGroups = trimWhitespaceRegex.exec(content);
    if (!matchGroups) {
      console.log(matchGroups);
      throw new Error(
        `Content failed parsing the whitespace test: '${content}'`
      );
    }

    const [_input, leading, core, trailing] = matchGroups;

    if (!core) {
      // this can happen e.g. if the formatted content is all whitespace (e.g. a "bold whitespace")
      // this is something that can easily happen in a range based RTF editor, but does not make sense in markdown output
      return [leading, trailing].join("");
    }

    return [leading, modifier, core, reversedMod, trailing].join("");
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
