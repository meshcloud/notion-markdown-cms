import * as yaml from "js-yaml";
import { PageProperties } from "./PageProperties";

export class FrontmatterRenderer {
  constructor() {}

  public renderFrontmatter(props: PageProperties) {
    const obj = {
      ...props.meta,
      properties: props.values,
    };

    const frontmatter = `---\n${yaml.dump(obj)}---\n\n`;

    return frontmatter;
  }
}
