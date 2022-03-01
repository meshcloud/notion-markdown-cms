import * as path from "path";

export class PageLinkResolver {
  private readonly absoluteFromDir: string;

  constructor(sourceDir: string) {
    this.absoluteFromDir = path.resolve(sourceDir);
  }

  resolveRelativeLinkTo(file: string) {
    const absoluteToDir = path.resolve(file);

    const relativePath = path.relative(this.absoluteFromDir, absoluteToDir);

    // normalize the rleative path to start with a ./ as that's the markdown convention for relative links
    // at least how it's most commonly interpreted (e.g. by textlint)
    return relativePath.startsWith(".") ? relativePath : "./" + relativePath;
  }
}
