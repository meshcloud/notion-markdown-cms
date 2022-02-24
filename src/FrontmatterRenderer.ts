import * as yaml from 'js-yaml';

export class FrontmatterRenderer {
  constructor() {}

  public renderFrontmatter(obj: Record<string, any>) {
    const frontmatter = `---\n${yaml.dump(obj)}---\n\n`;

    return frontmatter;
  }
}
