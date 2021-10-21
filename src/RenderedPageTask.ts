import { PageProperties } from "./PageProperties";

export interface RenderPageTask {
    id: string;
    file: string;
    properties: PageProperties;
    render: () => Promise<any>;
}