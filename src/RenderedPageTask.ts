import { PageProperties } from "./PageProperties";

export interface RenderPageTask {
    id: string;
    category: string;
    file: string;
    properties: PageProperties;
    render: () => Promise<any>;
}