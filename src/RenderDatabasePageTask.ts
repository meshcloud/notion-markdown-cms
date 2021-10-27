import { PageProperties } from "./PageProperties";


export interface RenderDatabasePageTask {
    id: string;
    file: string;
    properties: PageProperties;
    render: () => Promise<any>;
}
