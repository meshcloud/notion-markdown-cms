import * as yaml from 'js-yaml';
import { DatabaseConfigRenderPages } from '.';

import { DatabasePageProperties } from './DatabasePageProperties';

export class FrontmatterRenderer {
  constructor() {}

  public renderFrontmatter(props: DatabasePageProperties, config: DatabaseConfigRenderPages) {
    const obj = config.pages.frontmatterBuilder(props);

    const frontmatter = `---\n${yaml.dump(obj)}---\n\n`;

    return frontmatter;
  }
}
