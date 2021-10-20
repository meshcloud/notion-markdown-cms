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

| Block Type        | Supported  | Notes                                        |
| ----------------- | ---------- | -------------------------------------------- |
| Text              | ✅ Yes     |                                              |
| Heading           | ✅ Yes     |                                              |
| Image             | ✅ Yes     |                                              |
| Image Caption     | ✅ Yes     |                                              |
| Bulleted List     | ✅ Yes     |                                              |
| Numbered List     | ✅ Yes     |                                              |
| Quote             | ✅ Yes     |                                              |
| Callout           | ✅ Yes     |                                              |
| Column            | ❌ Missing |                                              |
| iframe            | ✅ Yes     |                                              |
| Video             | ❌ Missing |                                              |
| Divider           | ✅ Yes     |                                              |
| Link              | ✅ Yes     |                                              |
| Code              | ✅ Yes     |                                              |
| Web Bookmark      | ✅ Yes     |                                              |
| Toggle List       | ✅ Yes     |                                              |
| Page Links        | ❌ Missing |                                              |
| Header            | ✅ Yes     |                                              |
| Databases         | ✅ Yes     | including child pages, inline tables planned |
| Checkbox          | ?          |                                              |
| Table Of Contents | ?          |                                              |

### Configuration

## Related Projects and Inspiration

There are quite a few alternatives out there already, so why did we build `notion-markdown-cms`?
Below table, albeit subjective, tries to answer this.

| Project                                                                  | Notion API    | Language   | Rendering Engine    |
| ------------------------------------------------------------------------ | ------------- | ---------- | ------------------- |
| [Nortion Markdown CMS](https://github.com/meshcloud/notion-markdown-cms) | ✅ official   | TypeScript | Markdown + JS Index |
| [Notion2GitHub](https://github.com/narkdown/notion2github)               | ⚠️ unofficial | Python     | Markdown            |
| [notion-cms](https://github.com/n6g7/notion-cms)                         | ⚠️ unofficial | TypeScript | React               |
| [vue-notion](https://github.com/janniks/vue-notion)                      | ⚠️ unofficial | JavaScript | Vue.js              |
| [react-notion](https://github.com/janniks/react-notion)                  | ⚠️ unofficial | JavaScript | React               |
