import { RichText } from "@notionhq/client/build/src/api-types";

export class RichTextRenderer {
  public renderMarkdown(text: RichText[]): string {
    const md = text.map((rt) => {
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

      switch (rt.type) {
        case "equation":
        case "mention":
          // todo: support for mentions is probably useful, for cross-page links?
          return this.wrap(mod, rt.plain_text);
        case "text":
          const text = this.wrap(mod, rt.text.content);
          return rt.text.link
            ? this.renderMarkdownLink(text, rt.text.link.url)
            : text;
      }
    });

    return md.join(" ");
  }


  private wrap(modifier: string, content: string) {
    const reversedMod = [...modifier].reverse().join("");

    return `${modifier}${content.trim()}${reversedMod}`;
  }

  private renderMarkdownLink(text: string, url: string): string {
    return `[${text}](${url})`;
  }
}
