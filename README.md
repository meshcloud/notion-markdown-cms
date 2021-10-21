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

| Block Type        | Supported      | Notes                                                 |
| ----------------- | -------------- | ----------------------------------------------------- |
| Text              | ✅ Yes         |                                                       |
| Heading           | ✅ Yes         |                                                       |
| Image             | ✅ Yes         |                                                       |
| Image Caption     | ✅ Yes         |                                                       |
| Bulleted List     | ✅ Yes         |                                                       |
| Numbered List     | ✅ Yes         |                                                       |
| Quote             | ✅ Yes         |                                                       |
| Callout           | ✅ Yes         |                                                       |
| Toggle            | ❌ Missing     |                                                       |
| Checkbox          | ?              |                                                       |
| Column            | ❌ Missing     |                                                       |
| Embed             | ❌ Missing     |                                                       |
| Video             | ❌ Missing     |                                                       |
| Audio             | ❌ Missing     |                                                       |
| Divider           | ✅ Yes         |                                                       |
| Link              | ✅ Yes         |                                                       |
| Code              | ✅ Yes         |                                                       |
| Web Bookmark      | ✅ Yes         |                                                       |
| Web Bookmark      | ❌ Missing     |                                                       |
| Toggle List       | ❌ Missing     |                                                       |
| Page Links        | ❌ Missing     |                                                       |
| Databases         | ✅ Yes         | including child pages, inline tables planned          |
| Child Pages       | ❌ not planned | avoid, they don't mix well with clear site navigation |
| Table Of Contents | ?              |                                                       |

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

| Project                                                                  | Notion API    | Language   | Rendering Engine    | Output looks like    |
| ------------------------------------------------------------------------ | ------------- | ---------- | ------------------- | -------------------- |
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
