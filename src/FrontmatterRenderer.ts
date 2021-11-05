import * as yaml from 'js-yaml';

import { DatabasePageProperties } from './DatabasePageProperties';

export class FrontmatterRenderer {
  constructor() {}

  public renderFrontmatter(props: DatabasePageProperties) {
    const obj = {
      ...props.meta,
      properties: props.values,
    };

    const frontmatter = `---\n${yaml.dump(obj)}---\n\n`;

    return frontmatter;
  }
}
