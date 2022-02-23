import { DatabasePageProperties } from "./DatabasePageProperties";

export interface RenderDatabaseEntryTask {
    id: string;
    url: string;
    properties: DatabasePageProperties
    // note: there's nothing to do to render an individual database entry, they are always rendered as part of tables
}
