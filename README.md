# Notion Markdown CMS

[![npm](https://badgen.net/npm/v/@meshcloud/notion-markdown-cms)](https://www.npmjs.com/package/@meshcloud/notion-markdown-cms)
[![license](https://badgen.net/github/license/meshcloud/notion-markdown-cms)](https://github.com/meshcloud/notion-markdown-cms/blob/main/LICENSE)

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

| Block Type        | Supported     | Notes                                                                                                          |
| ----------------- | ------------- | -------------------------------------------------------------------------------------------------------------- |
| Paragraph         | ✅ Yes         |                                                                                                                |
| Heading1-3        | ✅ Yes         |                                                                                                                |
| Callout           | ✅ Yes         |                                                                                                                |
| Quote             | ✅ Yes         |                                                                                                                |
| Bulleted List     | ✅ Yes         |                                                                                                                |
| Numbered List     | ✅ Yes         |                                                                                                                |
| To do             | ✅ Yes         |                                                                                                                |
| Toggle            | ✅ (Yes)       | Toggle content is included, however the toggle header is not                                                   |
| Code              | ✅ Yes         | An html block starting with `<!--notion-markdown-cms:raw-->` is rendered as raw HTML and not as a fenced block |
| Child Pages       | ❌ not planned | avoid, they don't mix well with clear site navigation                                                          |
| Child Databases   | ✅ Yes         | renders as table + including child pages, inline-only tables planned                                           |
| Embed             | ❌ Missing     | unclear, might be undesireable for static sites                                                                |
| Image             | ✅ (Yes)       | captions not supported yet                                                                                     |
| Video             | ❌ Missing     |                                                                                                                |
| File              | ❌ Missing     |                                                                                                                |
| PDF               | ❌ Missing     |                                                                                                                |
| Bookmark          | ✅ Yes | use a caption as a link name    |                                                                                                                |
| Equation          | ❌ Missing     |                                                                                                                |
| Divider           | ✅ Yes         |                                                                                                                |
| Table Of Contents | ❌ not planned | static site generators have their own ToC implementations                                                      |
| Breadcrumb        | ❌ not planned | static site generators have their own nav implementations                                                      |
| Synced Block      | ✅ Yes         | renders all children blocks                                                                                    |

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
| Rich text        | ✅ Yes     | rendered as plaintext string  |
| Number           | ✅ Yes     |                               |
| Select           | ✅ Yes     | rendered as name              |
| Multi Select     | ✅ Yes     | rendered as array of names    |
| Date             | ✅ Yes     | rendered as string            |
| Formula          | ❌ missing |                               |
| Relation         | ✅ Yes     | rendered as array of page ids |
| Rollup           | ❌ missing |                               |
| Title            | ✅ Yes     | used as page title            |
| People           | ✅ Yes     | rendered as comma-separated list of names |
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
wrapping your favourite static site generator tool. You can install it from npm

```bash
npm add "@meshcloud/notion-markdown-cms"
```

You can find an example build script using the node.js API below.
Consult the [SyncConfig](./src/SyncConfig.ts) reference for documentation of available configuration options.

> A CLI tool could be made available later.

```typescript
import { slugify, SyncConfig, sync } from "notion-markdown-cms";
const config: SyncConfig = {
  cmsDatabaseId: "8f1de8c578fb4590ad6fbb0dbe283338",
  pages: {
    destinationDirBuilder: (page) => slugify(page.properties.get("Category")),
    frontmatterBuilder: (page) => ({
      id: page.meta.id,
      url: page.meta.url,
      title: page.meta.title,
      category: page.properties.get("Category")
    }),
  },
  databases: {
    "fe9836a9-6557-4f17-8adb-a93d2584f35f": {
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
      renderAs: "pages+views",
      pages: {
        destinationDirBuilder: (page) => slugify(page.properties.get("Scope")),
        frontmatterBuilder: (page) => ({
          id: page.meta.id,
          url: page.meta.url,
          title: page.meta.title,
          cluster: page.properties.get("Cluster")
        }),
      },
      views: [
      {
        title: "By Scope",
        properties: {
          groupBy: "Scope",
          include: ["Name", "Scope", "Cluster", "Summary"],
        },
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

  rimraf.sync("docs/!(README.md)**/*");

  // change into the docs dir, this simplifies handling relative paths
  process.chdir("docs/");

  const rendered = await sync(notionApiToken, config);

  // do something with the rendered index, e.g. writing it to a file or building a nav structure
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
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
