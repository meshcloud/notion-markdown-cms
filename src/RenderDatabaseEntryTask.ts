
export interface RenderDatabaseEntryTask {
    id: string;
    url: string;
    properties: {
        /**
         * A mapping of property object keys -> property values
         */
        values: Record<string, any>;

        /**
         * A mapping of Notion API property names -> property object keys
         */
        keys: Map<string, string>;
    };

    // note: there's nothing to do to render an individual database entry, they are always rendered as part of tables
}
