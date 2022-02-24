import { DatabasePageProperties } from "./DatabasePageProperties";

export interface RenderDatabaseEntryTask {
    properties: DatabasePageProperties
    frontmatter?: Record<string, any>
    // note: there's nothing to do to render an individual database entry, they are always rendered as part of tables
}
