import * as yaml from "js-yaml";

export class FrontmatterRenderer {
  constructor() {}

  public renderFrontmatter(properties: Record<string, any>) {    
    const frontmatter = `---\n${yaml.dump(properties)}---\n\n`;

    return frontmatter
  }
}
