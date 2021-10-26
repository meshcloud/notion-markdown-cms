# Notion Markdown CMS

Build markdown-based static sites with Notion.

1. Use Notion to write and organize pages
2. `notion-markdown-cms sync` to build a markdown repository
3. run your favourite static site generator (VuePress, Docusaurus, Gatsby, ...)

Success! 🚀

## Features

- uses the official Notion API only
- written in typescript/javascript
- renders page properties to frontmatter
- recursively traverses the Notion Block graph to include database pages, child pages
- renders an index file of all your pages so you can easily build Navs/Sidebars

### Supported Blocks

The following [Notion API block object types](https://developers.notion.com/reference/block) are supported:

| Block Type        | Supported     | Notes                                                                |
| ----------------- | ------------- | -------------------------------------------------------------------- |
| Paragraph         | ✅ Yes         |                                                                      |
| Heading1-3        | ✅ Yes         |                                                                      |
| Callout           | ✅ Yes         |                                                                      |
| Quote             | ✅ Yes         |                                                                      |
| Bulleted List     | ✅ Yes         |                                                                      |
| Numbered List     | ✅ Yes         |                                                                      |
| To do             | ✅ Yes         |                                                                      |
| Toggle            | ❌ Missing     |                                                                      |
| Code              | ✅ Yes         |                                                                      |
| Child Pages       | ❌ not planned | avoid, they don't mix well with clear site navigation                |
| Child Databases   | ✅ Yes         | renders as table + including child pages, inline-only tables planned |
| Embed             | ❌ Missing     | unclear, might be undesireable for static sites                      |
| Image             | ✅ (Yes)       | captions not supported yet                                           |
| Video             | ❌ Missing     |                                                                      |
| File              | ❌ Missing     |                                                                      |
| PDF               | ❌ Missing     |                                                                      |
| Bookmark          | ❌ Missing     |                                                                      |
| Equation          | ❌ Missing     |                                                                      |
| Divider           | ✅ Yes         |                                                                      |
| Table Of Contents | ❌ not planned | static site generators have their own ToC implementations            |
| Breadcrumb        | ❌ not planned | static site generators have their own nav implementations            |

Support for other block types can be considered once they are available on the official Notion API.

### Supported Rich Text Formatting

The following [Notion API rich text types](https://developers.notion.com/reference/rich-text) are supported

| Rich Text Type | Supported   | Notes                                            |
| -------------- | ----------- | ------------------------------------------------ |
| Text           | ✅ Yes       |                                                  |
| Mention        | ✅ partially | Page mentions only, mentioned pages are included |
| Equation       | ❌ Missing   |                                                  |

The following annotations (and any combination thereof) are supported:

| Annotation    | Supported     | Notes                     |
| ------------- | ------------- | ------------------------- |
| bold          | ✅ Yes         |                           |
| italic        | ✅ Yes         |                           |
| strikethrough | ✅ Yes         |                           |
| underline     | ✅ Yes         |                           |
| code          | ✅ Yes         |                           |
| color         | ❌ not planned | not available in markdown |

### Supported Page Property Types

The following [Notion API page property types](https://developers.notion.com/reference/page#property-value-object) are supported

| Propety type     | Supported | Notes                         |
| ---------------- | --------- | ----------------------------- |
| Rich text        | ✅ Yes     | rendered as markdown string   |
| Number           | ✅ Yes     |                               |
| Select           | ✅ Yes     | rendered as name              |
| Multi Select     | ✅ Yes     | rendered as array of names    |
| Date             | ✅ Yes     | rendered as string            |
| Formula          | ❌ missing |                               |
| Relation         | ✅ Yes     | rendered as array of page ids |
| Rollup           | ❌ missing |                               |
| Title            | ✅ Yes     | used as page title            |
| People           | ❌ missing |                               |
| Files            | ❌ missing |                               |
| Checkbox         | ❌ missing |                               |
| Url              | ✅ Yes     | rendered as string            |
| Email            | ✅ Yes     | rendered as string            |
| Phone Number     | ✅ Yes     | rendered as string            |
| Created time     | ✅ Yes     | rendered as string            |
| Created by       | ✅ Yes     | rendered as name              |
| Last edited time | ✅ Yes     | rendered as string            |
| Last edited by   | ✅ Yes     | rendered as name              |

## Usage

At the moment `notion-markdown-cms` is meant to be consumed via its node.js API from build scripts
wrapping your favourite static site generator tool. Since we're not publishing to npm yet, add it to your project directly from github

```bash
npm add "git+ssh://git@github.com:meshcloud/notion-markdown-cms.git#main"
```

You can find an example build script using the node.js API below.
Consult the [SyncConfig](./src/SyncConfig.ts) reference for documentation of available configuration options.

> A CLI tool could be made available later.

```typescript
import { SyncConfig, sync } from "notion-markdown-cms";

const config: SyncConfig = {
  cmsDatabaseId: "8f1de8c578fb4590ad6fbb0dbe283338",
  outDir: "docs/",
  indexPath: "docs/.vuepress/index.ts",
  databases: {
    "fe9836a9-6557-4f17-8adb-a93d2584f35f": {
      parentCategory: "cfmm/",
      sorts: [
        {
          property: "Scope",
          direction: "ascending",
        },
        {
          property: "Cluster",
          direction: "ascending",
        },
      ],
      properties: {
        category: "scope",
        include: ["Name", "Scope", "Cluster", "Journey Stage", "Summary"],
      },
    },
  },
};

async function main() {
  const notionApiToken = process.env.NOTION_API_TOKEN;
  if (!notionApiToken) {
    throw new Error(
      "Required NOTION_API_TOKEN environment variable not provided."
    );
  }

  await sync(notionApiToken, config);
}

main();
```

## Credits, Related Projects and Inspiration

There are quite a few alternatives out there already, so why did we build `notion-markdown-cms`?
Below table, albeit subjective, tries to answer this.

| Project                                                                  | Notion API   | Language   | Rendering Engine    | Output looks like    |
| ------------------------------------------------------------------------ | ------------ | ---------- | ------------------- | -------------------- |
| [Nortion Markdown CMS](https://github.com/meshcloud/notion-markdown-cms) | ✅ official   | TypeScript | Markdown + JS Index | Site generator theme |
| [Notion2GitHub](https://github.com/narkdown/notion2github)               | ⚠️ unofficial | Python     | Markdown            | Site generator theme |
| [notion-cms](https://github.com/n6g7/notion-cms)                         | ⚠️ unofficial | TypeScript | React               | Notion App           |
| [vue-notion](https://github.com/janniks/vue-notion)                      | ⚠️ unofficial | JavaScript | Vue.js              | Notion App           |
| [react-notion](https://github.com/janniks/react-notion)                  | ⚠️ unofficial | JavaScript | React               | Notion App           |

## Development

For convenient development you can use

- `nix-shell` to set up a development environemnt
- You'll need a Notion database for testing. You can e.g. copy one of these to your own Notion Workspace
  - [Notion Kit Test Suite](https://www.notion.so/Notion-Test-Suite-067dd719a912471ea9a3ac10710e7fdf)
  - [Narkdown's Test Suite](https://www.notion.so/acc3dfd0339e4cacb5baae8673fddfad?v=be43c1c8dd644cfb9df9efd97d8af60a)
- A [Notion API Token](https://developers.notion.com/docs/authorization)

> As this project is still in its very early stages, `notion-markdown-cms` does not come with its own demo, example or test cases yet.
